import { Router } from "express";
import { databaseConfigured, query } from "../db.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

export const quotationsRouter = Router();

quotationsRouter.post("/api/quotations", authenticateToken, authorizeRoles("vendor", "admin"), async (request, response) => {
  if (!databaseConfigured) return response.status(503).json({ error: "PostgreSQL is not configured." });

  const { orderId, customerId, vendorId, amount = 0, notes, validUntil } = request.body;
  try {
    let effectiveCustomerId = customerId || null;
    let effectiveVendorId = vendorId || null;

    if (request.user.role === "vendor") {
      const vendorResult = await query("SELECT id FROM vendors WHERE user_id = $1", [request.user.id]);
      const vendorProfile = vendorResult.rows[0];
      if (!vendorProfile) {
        return response.status(403).json({ error: "Vendor profile not found for the authenticated account." });
      }
      effectiveVendorId = vendorProfile.id;

      if (vendorId && String(vendorId) !== String(effectiveVendorId)) {
        return response.status(403).json({ error: "Vendor ID does not match the authenticated vendor account." });
      }

      if (orderId) {
        const orderResult = await query("SELECT id, customer_id, vendor_id FROM orders WHERE id = $1", [orderId]);
        const order = orderResult.rows[0];
        if (!order) {
          return response.status(404).json({ error: "Order not found." });
        }

        effectiveCustomerId = order.customer_id;

        if (customerId && String(customerId) !== String(order.customer_id)) {
          return response.status(403).json({ error: "Order does not belong to the supplied customer." });
        }

        if (String(order.vendor_id) !== String(effectiveVendorId)) {
          return response.status(403).json({ error: "Order does not belong to the authenticated vendor." });
        }
      }

      if (!effectiveCustomerId) {
        return response.status(400).json({ error: "customerId is required." });
      }
    } else if (request.user.role === "admin") {
      if (orderId) {
        const orderResult = await query("SELECT id, customer_id, vendor_id FROM orders WHERE id = $1", [orderId]);
        const order = orderResult.rows[0];
        if (!order) {
          return response.status(404).json({ error: "Order not found." });
        }
        effectiveCustomerId = customerId || order.customer_id;
        if (customerId && String(customerId) !== String(order.customer_id)) {
          return response.status(403).json({ error: "Order does not belong to the supplied customer." });
        }
        if (vendorId && order.vendor_id && String(vendorId) !== String(order.vendor_id)) {
          return response.status(403).json({ error: "Order does not belong to the supplied vendor." });
        }

        effectiveVendorId = vendorId || order.vendor_id;
      }
    }

    if (!effectiveCustomerId || !effectiveVendorId) {
      return response.status(400).json({ error: "customerId and vendorId are required." });
    }

    const result = await query(
      "INSERT INTO quotations (order_id, customer_id, vendor_id, amount, notes, valid_until, status) VALUES ($1, $2, $3, $4, $5, $6, 'sent') RETURNING *",
      [orderId || null, effectiveCustomerId, effectiveVendorId, amount, notes || null, validUntil || null]
    );
    response.status(201).json({ quotation: result.rows[0] });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Internal server error" });
  }
});

quotationsRouter.get("/api/quotations", authenticateToken, authorizeRoles("admin", "vendor", "customer"), async (request, response) => {
  if (!databaseConfigured) return response.status(503).json({ error: "PostgreSQL is not configured." });
  try {
    let result;
    if (request.user.role === "customer") {
      result = await query("SELECT * FROM quotations WHERE customer_id = $1 ORDER BY created_at DESC", [request.user.id]);
    } else if (request.user.role === "vendor") {
      const vendorResult = await query("SELECT id FROM vendors WHERE user_id = $1", [request.user.id]);
      const vendorId = vendorResult.rows[0]?.id;
      if (!vendorId) {
        return response.status(403).json({ error: "Vendor profile not found for the authenticated account." });
      }
      result = await query("SELECT * FROM quotations WHERE vendor_id = $1 ORDER BY created_at DESC", [vendorId]);
    } else {
      result = await query("SELECT * FROM quotations ORDER BY created_at DESC");
    }
    response.json({ quotations: result.rows });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Internal server error" });
  }
});
