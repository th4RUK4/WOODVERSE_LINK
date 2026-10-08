import { Router } from "express";
import { databaseConfigured, query } from "../db.js";
import { buildFulfillmentPlan } from "../utils/helpers.js";
import { catalogProducts, orders } from "../data/memory.js";
import { currentTime, DELIVERY_FEE, ASSURANCE_FEE, parseOrderItems, uuidPattern } from "../utils/helpers.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

export const ordersRouter = Router();

ordersRouter.post("/api/orders/evaluate-stock", authenticateToken, (request, response) => {
  const plan = buildFulfillmentPlan(request.body.items || [], catalogProducts);
  response.json({
    requiresVendorApproval: plan.some((item) => item.vendorApprovalRequired),
    productionTrackingRequired: plan.some((item) => item.decision === "manufacture"),
    fulfillmentPlan: plan,
  });
});

// The order total and the acting customer are decided here, never by the browser.
// The client may only say "which products, how many".
ordersRouter.post("/api/orders", authenticateToken, authorizeRoles("customer", "vendor", "admin"), async (request, response) => {
  if (!databaseConfigured) {
    return response.status(503).json({ error: "PostgreSQL is not configured, so orders cannot be placed." });
  }

  const parsed = parseOrderItems(request.body.items);
  if (parsed.error) {
    return response.status(400).json({ error: parsed.error });
  }
  const items = parsed.items;

  try {
    const productResult = await query(
      `SELECT p.id, p.name, p.price, p.stock_quantity, p.vendor_id, v.business_name AS vendor
       FROM products p
       JOIN vendors v ON v.id = p.vendor_id
       WHERE p.id = ANY($1::uuid[])`,
      [items.map((item) => item.id)]
    );
    const productsById = new Map(productResult.rows.map((row) => [String(row.id), row]));

    const unknown = items.filter((item) => !productsById.has(item.id));
    if (unknown.length > 0) {
      return response.status(400).json({ error: `Unknown product: ${unknown[0].id}. Refresh the catalog and try again.` });
    }

    let subtotal = 0;
    const vendorIds = new Set();
    const fulfillmentPlan = items.map((item) => {
      const product = productsById.get(item.id);
      const unitPrice = Number(product.price);
      const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
      subtotal += lineTotal;
      vendorIds.add(String(product.vendor_id));

      const available = Number(product.stock_quantity);
      const manufactureRequired = available < item.quantity;

      return {
        id: String(product.id),
        name: product.name,
        vendor: product.vendor,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
        available,
        stock: available > 0 ? (available <= 4 ? `Low Stock (${available})` : "In Stock") : "Out of Stock",
        decision: manufactureRequired ? "manufacture" : "stock",
        vendorApprovalRequired: manufactureRequired,
        nextStep: manufactureRequired
          ? "Vendor must approve before production tracking starts."
          : "Reserve stock and prepare delivery.",
        reason: manufactureRequired
          ? `Only ${available} in stock, ${item.quantity} requested.`
          : "Requested quantity is available in stock.",
      };
    });

    const delivery = items.length > 0 ? DELIVERY_FEE : 0;
    const assurance = items.length > 0 ? ASSURANCE_FEE : 0;
    const total = Math.round((subtotal + delivery + assurance) * 100) / 100;
    const requiresManufacturing = fulfillmentPlan.some((item) => item.vendorApprovalRequired);

    const result = await query(
      `INSERT INTO orders (customer_id, vendor_id, status, total_amount, requires_manufacturing, fulfillment_plan, shipping_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        request.user.id,
        vendorIds.size === 1 ? [...vendorIds][0] : null,
        requiresManufacturing ? "vendor_approval" : "processing",
        total,
        requiresManufacturing,
        JSON.stringify(fulfillmentPlan),
        JSON.stringify(request.body.shippingAddress || {}),
      ]
    );

    const created = result.rows[0];
    orders.unshift({
      id: created.id,
      customer: request.user.fullName,
      status: requiresManufacturing ? "Vendor Approval" : "Processing",
      requiresVendorApproval: requiresManufacturing,
      createdAt: created.created_at,
    });

    if (request.io) {
      const rooms = new Set(["woodverse-notifications"]);
      if (created.customer_id) rooms.add(`customer:${created.customer_id}:notifications`);
      if (created.vendor_id) {
        const vendorUserResult = await query("SELECT user_id FROM vendors WHERE id = $1", [created.vendor_id]);
        const vendorUserId = vendorUserResult.rows[0]?.user_id;
        if (vendorUserId) rooms.add(`vendor:${vendorUserId}:notifications`);
      }

      for (const room of rooms) {
        request.io.to(room).emit("notification:event", {
          id: `notice-${Date.now()}`,
          audience: "Vendor",
          source: "WoodVerse API",
          title: requiresManufacturing ? "Order needs vendor approval" : "New stock order",
          message: requiresManufacturing
            ? `Order ${created.id} has items that must be manufactured before delivery.`
            : `Order ${created.id} can be fulfilled from stock.`,
          time: currentTime(),
        });
      }
    }

    return response.status(201).json({
      order: created,
      requiresVendorApproval: requiresManufacturing,
      productionTrackingRequired: requiresManufacturing,
      fulfillmentPlan,
      pricing: { subtotal, delivery, assurance, total },
    });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
});

ordersRouter.get("/api/orders", authenticateToken, authorizeRoles("admin", "vendor", "customer"), async (request, response) => {
  if (!databaseConfigured) return response.json({ orders });
  // The customer name is joined in rather than looked up per row in the browser, so
  // a vendor never has to read the users table to label an order.
  const selectOrders = `
    SELECT o.*, u.full_name AS customer_name, v.business_name AS vendor_name
    FROM orders o
    LEFT JOIN users u ON u.id = o.customer_id
    LEFT JOIN vendors v ON v.id = o.vendor_id
  `;
  try {
    let result;
    if (request.user.role === "customer") {
      result = await query(`${selectOrders} WHERE o.customer_id = $1 ORDER BY o.created_at DESC`, [request.user.id]);
    } else if (request.user.role === "vendor") {
      const vendorResult = await query("SELECT id FROM vendors WHERE user_id = $1", [request.user.id]);
      const vendorId = vendorResult.rows[0]?.id;
      // A vendor with no vendor row yet sees nothing rather than everyone's orders.
      if (!vendorId) return response.json({ orders: [] });
      result = await query(`${selectOrders} WHERE o.vendor_id = $1 ORDER BY o.created_at DESC`, [vendorId]);
    } else {
      result = await query(`${selectOrders} ORDER BY o.created_at DESC`);
    }
    response.json({ orders: result.rows });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});
