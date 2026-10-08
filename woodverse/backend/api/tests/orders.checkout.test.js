import { describe, it, expect, beforeAll, afterAll } from "vitest";
import jwt from "jsonwebtoken";
import pg from "pg";
import request from "node:http";

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || "";

// src/utils/auth.js and src/db.js read these at import time, so they must be set
// before any router is imported.
if (TEST_DATABASE_URL) process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.JWT_SECRET = "test-jwt-secret";

const CUSTOMER_A = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_B = "22222222-2222-4222-8222-222222222222";
const VENDOR_USER = "33333333-3333-4333-8333-333333333333";
const VENDOR_ID = "44444444-4444-4444-8444-444444444444";
const ADMIN = "77777777-7777-4777-8777-777777777777";
// Priced 245000 with 6 in stock, so a quantity of 2 is a normal stock order.
const IN_STOCK_PRODUCT = "88888888-8888-4888-8888-888888888888";
// Priced 310000 with 0 in stock, so any order for it needs manufacturing.
const OUT_OF_STOCK_PRODUCT = "99999999-9999-4999-8999-999999999999";

let server;
let baseUrl;
const pool = new pg.Pool({ connectionString: TEST_DATABASE_URL });

function tokenFor(id, role, email) {
  return jwt.sign({ id, email, role, fullName: "Test User" }, "test-jwt-secret", { expiresIn: "10m" });
}

async function startServer() {
  const { createServer } = await import("node:http");
  const express = (await import("express")).default;
  const { ordersRouter } = await import("../src/routes/orders.js");
  const { authRouter } = await import("../src/routes/auth.js");
  const { usersRouter } = await import("../src/routes/users.js");
  const { vendorsRouter } = await import("../src/routes/vendors.js");
  const { quotationsRouter } = await import("../src/routes/quotations.js");
  const app = express();
  app.use(express.json());
  app.use(ordersRouter);
  app.use(authRouter);
  app.use(usersRouter);
  app.use(vendorsRouter);
  app.use(quotationsRouter);
  app.use((error, _req, res, _next) => {
    res.status(500).json({ error: error.message });
  });

  await new Promise((resolve) => {
    server = createServer(app).listen(0, "127.0.0.1", resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
}

function send(method, path, { body, token } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : JSON.stringify(body);
    const req = request.request(
      `${baseUrl}${path}`,
      {
        method,
        headers: {
          ...(payload ? { "content-type": "application/json", "content-length": Buffer.byteLength(payload) } : {}),
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          let parsed = null;
          try {
            parsed = raw ? JSON.parse(raw) : null;
          } catch {
            parsed = raw;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const customerToken = () => tokenFor(CUSTOMER_A, "customer", "a@example.com");
const otherCustomerToken = () => tokenFor(CUSTOMER_B, "customer", "b@example.com");

// Setup and teardown live at the top level, not inside a describe block. Vitest runs
// a describe's afterAll as soon as that block finishes, so a block-scoped afterAll
// would close the server and pool before the later suites below ever ran.
beforeAll(async () => {
  if (!TEST_DATABASE_URL) return;
  await pool.query("TRUNCATE orders, products, vendors, users RESTART IDENTITY CASCADE");
  await pool.query(
    `INSERT INTO users (id, email, full_name, role, password_hash, status) VALUES
      ($1, 'a@example.com', 'Customer A', 'customer', NULL, 'active'),
      ($2, 'b@example.com', 'Customer B', 'customer', NULL, 'active'),
      ($3, 'vendor@example.com', 'Vendor User', 'vendor', NULL, 'active'),
      ($4, 'admin@example.com', 'Admin User', 'admin', NULL, 'active')`,
    [CUSTOMER_A, CUSTOMER_B, VENDOR_USER, ADMIN]
  );
  await pool.query(
    "INSERT INTO vendors (id, user_id, business_name, verification_status) VALUES ($1, $2, 'Lanka Teak Estates', 'approved')",
    [VENDOR_ID, VENDOR_USER]
  );
  await pool.query(
    `INSERT INTO products (id, vendor_id, name, price, stock_quantity, status) VALUES
      ($1, $3, 'Royal Majesty Set', 245000.00, 6, 'published'),
      ($2, $3, 'Signature Bedframe', 310000.00, 0, 'published')`,
    [IN_STOCK_PRODUCT, OUT_OF_STOCK_PRODUCT, VENDOR_ID]
  );
  // Login tests need a real hash. bcrypt cost 4 keeps the suite fast.
  const bcrypt = (await import("bcryptjs")).default;
  await pool.query("UPDATE users SET password_hash = $1", [await bcrypt.hash("password123", 4)]);
  await startServer();
});

afterAll(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

describe("POST /api/orders", () => {
  it("requires authentication", async () => {
    if (!TEST_DATABASE_URL) return;
    const res = await send("POST", "/api/orders", { body: { items: [{ id: IN_STOCK_PRODUCT, quantity: 1 }] } });
    expect(res.status).toBe(401);
  });

  it("writes a row owned by the token holder", async () => {
    if (!TEST_DATABASE_URL) return;
    const res = await send("POST", "/api/orders", {
      body: { items: [{ id: IN_STOCK_PRODUCT, quantity: 2 }] },
      token: customerToken(),
    });

    expect(res.status).toBe(201);
    const row = (await pool.query("SELECT * FROM orders WHERE id = $1", [res.body.order.id])).rows[0];
    expect(row.customer_id).toBe(CUSTOMER_A);
    expect(row.vendor_id).toBe(VENDOR_ID);
  });

  it("ignores a client supplied customerId", async () => {
    if (!TEST_DATABASE_URL) return;
    const res = await send("POST", "/api/orders", {
      body: {
        items: [{ id: IN_STOCK_PRODUCT, quantity: 1 }],
        customerId: CUSTOMER_B,
        customer: "Someone Else",
      },
      token: customerToken(),
    });

    expect(res.status).toBe(201);
    const row = (await pool.query("SELECT * FROM orders WHERE id = $1", [res.body.order.id])).rows[0];
    // The order belongs to the caller, not to the id in the body.
    expect(row.customer_id).toBe(CUSTOMER_A);
  });

  it("ignores a client supplied totalAmount and prices from the products table", async () => {
    if (!TEST_DATABASE_URL) return;
    const res = await send("POST", "/api/orders", {
      body: { items: [{ id: IN_STOCK_PRODUCT, quantity: 1 }], totalAmount: 1 },
      token: customerToken(),
    });

    expect(res.status).toBe(201);
    // 245000 + 7500 delivery + 3500 assurance
    expect(Number(res.body.order.total_amount)).toBe(256000);
    expect(res.body.pricing.total).toBe(256000);
  });

  it("ignores a client supplied price on a line item", async () => {
    if (!TEST_DATABASE_URL) return;
    const res = await send("POST", "/api/orders", {
      body: { items: [{ id: IN_STOCK_PRODUCT, quantity: 1, price: 1, name: "Free", vendor: "Attacker" }] },
      token: customerToken(),
    });

    expect(res.status).toBe(201);
    const [line] = res.body.fulfillmentPlan;
    expect(line.unitPrice).toBe(245000);
    expect(line.name).toBe("Royal Majesty Set");
    expect(line.vendor).toBe("Lanka Teak Estates");
  });

  it("marks an out of stock line as requiring manufacturing", async () => {
    if (!TEST_DATABASE_URL) return;
    const res = await send("POST", "/api/orders", {
      body: { items: [{ id: OUT_OF_STOCK_PRODUCT, quantity: 1 }] },
      token: customerToken(),
    });

    expect(res.status).toBe(201);
    expect(res.body.requiresVendorApproval).toBe(true);
    expect(res.body.order.status).toBe("vendor_approval");
    expect(res.body.order.requires_manufacturing).toBe(true);
  });

  it("keeps a stock order out of manufacturing", async () => {
    if (!TEST_DATABASE_URL) return;
    const res = await send("POST", "/api/orders", {
      body: { items: [{ id: IN_STOCK_PRODUCT, quantity: 1 }] },
      token: customerToken(),
    });

    expect(res.body.requiresVendorApproval).toBe(false);
    expect(res.body.order.status).toBe("processing");
  });

  it("rejects an order with no items", async () => {
    if (!TEST_DATABASE_URL) return;
    const res = await send("POST", "/api/orders", { body: { items: [] }, token: customerToken() });
    expect(res.status).toBe(400);
  });

  it("rejects a non uuid product id", async () => {
    if (!TEST_DATABASE_URL) return;
    const res = await send("POST", "/api/orders", {
      body: { items: [{ id: "1; DROP TABLE orders", quantity: 1 }] },
      token: customerToken(),
    });
    expect(res.status).toBe(400);
  });

  it("rejects a fractional or negative quantity", async () => {
    if (!TEST_DATABASE_URL) return;
    for (const quantity of [0, -1, 1.5, "two"]) {
      const res = await send("POST", "/api/orders", {
        body: { items: [{ id: IN_STOCK_PRODUCT, quantity }] },
        token: customerToken(),
      });
      expect(res.status).toBe(400);
    }
  });

  it("rejects a product that does not exist", async () => {
    if (!TEST_DATABASE_URL) return;
    const res = await send("POST", "/api/orders", {
      body: { items: [{ id: "00000000-0000-4000-8000-000000009999", quantity: 1 }] },
      token: customerToken(),
    });
    expect(res.status).toBe(400);
  });

  it("merges duplicate lines instead of double counting them", async () => {
    if (!TEST_DATABASE_URL) return;
    const res = await send("POST", "/api/orders", {
      body: { items: [{ id: IN_STOCK_PRODUCT, quantity: 1 }, { id: IN_STOCK_PRODUCT, quantity: 2 }] },
      token: customerToken(),
    });

    expect(res.status).toBe(201);
    expect(res.body.fulfillmentPlan).toHaveLength(1);
    expect(res.body.fulfillmentPlan[0].quantity).toBe(3);
    expect(res.body.pricing.subtotal).toBe(735000);
  });

  it("returns the error to the caller instead of a fake success", async () => {
    if (!TEST_DATABASE_URL) return;
    const before = (await pool.query("SELECT count(*)::int AS count FROM orders")).rows[0].count;
    const res = await send("POST", "/api/orders", { body: { items: "nope" }, token: customerToken() });
    const after = (await pool.query("SELECT count(*)::int AS count FROM orders")).rows[0].count;
    expect(res.status).toBe(400);
    expect(after).toBe(before);
  });
});

describe("GET /api/orders", () => {
  it("returns only the caller's orders to a customer", async () => {
    if (!TEST_DATABASE_URL) return;
    const mine = await send("GET", "/api/orders", { token: customerToken() });
    const theirs = await send("GET", "/api/orders", { token: otherCustomerToken() });

    expect(mine.status).toBe(200);
    expect(mine.body.orders.length).toBeGreaterThan(0);
    expect(mine.body.orders.every((order) => order.customer_id === CUSTOMER_A)).toBe(true);
    expect(theirs.body.orders.every((order) => order.customer_id === CUSTOMER_B)).toBe(true);
  });

  it("includes the customer name for the vendor view", async () => {
    if (!TEST_DATABASE_URL) return;
    const res = await send("GET", "/api/orders", { token: tokenFor(VENDOR_USER, "vendor", "vendor@example.com") });
    expect(res.status).toBe(200);
    expect(res.body.orders.length).toBeGreaterThan(0);
    expect(res.body.orders[0].customer_name).toBe("Customer A");
  });

  it("requires authentication", async () => {
    if (!TEST_DATABASE_URL) return;
    const res = await send("GET", "/api/orders");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/users", () => {
  it("rejects an unauthenticated request", async () => {
    if (!TEST_DATABASE_URL) return;
    const res = await send("POST", "/api/users", {
      body: { email: "attacker@example.com", fullName: "Attacker", role: "admin", password: "password123" },
    });
    expect(res.status).toBe(401);

    const found = await pool.query("SELECT id FROM users WHERE email = 'attacker@example.com'");
    expect(found.rows).toHaveLength(0);
  });

  it("rejects a non admin caller", async () => {
    if (!TEST_DATABASE_URL) return;
    const res = await send("POST", "/api/users", {
      body: { email: "attacker2@example.com", fullName: "Attacker", role: "admin", password: "password123" },
      token: customerToken(),
    });
    expect(res.status).toBe(403);

    const found = await pool.query("SELECT id FROM users WHERE email = 'attacker2@example.com'");
    expect(found.rows).toHaveLength(0);
  });

  it("still allows an admin to create a user", async () => {
    if (!TEST_DATABASE_URL) return;
    const res = await send("POST", "/api/users", {
      body: { email: "newvendor@example.com", fullName: "New Vendor", role: "vendor", password: "password123" },
      token: tokenFor(ADMIN, "admin", "admin@example.com"),
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("vendor");
    // A business account must not be usable until it is approved.
    expect(res.body.user.status).toBe("pending_approval");
  });
});

describe("POST /api/auth/register", () => {
  it("refuses to create an admin", async () => {
    if (!TEST_DATABASE_URL) return;
    const res = await send("POST", "/api/auth/register", {
      body: { email: "sneaky-admin@example.com", fullName: "Sneaky", role: "admin", password: "password123" },
    });
    expect(res.status).toBe(400);

    const found = await pool.query("SELECT id FROM users WHERE email = 'sneaky-admin@example.com'");
    expect(found.rows).toHaveLength(0);
  });

  it("creates an active customer", async () => {
    if (!TEST_DATABASE_URL) return;
    const res = await send("POST", "/api/auth/register", {
      body: { email: "newcustomer@example.com", fullName: "New Customer", password: "password123" },
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("customer");
    expect(res.body.user.status).toBe("active");
    expect(res.body.token).toBeTruthy();
  });

  it("creates a vendor as pending and attaches a vendor row", async () => {
    if (!TEST_DATABASE_URL) return;
    const res = await send("POST", "/api/auth/register", {
      body: { email: "newbiz@example.com", fullName: "New Biz", role: "vendor", businessName: "New Biz Ltd", password: "password123" },
    });
    expect(res.status).toBe(201);
    expect(res.body.user.status).toBe("pending_approval");

    const vendor = await pool.query("SELECT business_name, verification_status FROM vendors WHERE user_id = $1", [res.body.user.id]);
    expect(vendor.rows).toHaveLength(1);
    expect(vendor.rows[0].verification_status).toBe("pending");
  });

  it("rejects a short password", async () => {
    if (!TEST_DATABASE_URL) return;
    const res = await send("POST", "/api/auth/register", {
      body: { email: "short@example.com", fullName: "Short", password: "abc" },
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/vendors", () => {
  it("ignores a client supplied userId for a vendor user", async () => {
    if (!TEST_DATABASE_URL) return;
    const res = await send("POST", "/api/vendors", {
      body: { userId: CUSTOMER_A, businessName: "Stolen Vendor" },
      token: tokenFor(VENDOR_USER, "vendor", "vendor@example.com"),
    });
    expect(res.status).toBe(403);
  });
});

describe("POST /api/quotations", () => {
  it("rejects a vendor that supplies another vendorId", async () => {
    if (!TEST_DATABASE_URL) return;
    const order = await pool.query(
      "INSERT INTO orders (customer_id, vendor_id, status, total_amount, requires_manufacturing, fulfillment_plan, shipping_address) VALUES ($1, $2, 'processing', 1000, false, '[]'::jsonb, '{}'::jsonb) RETURNING *",
      [CUSTOMER_A, VENDOR_ID]
    );

    const res = await send("POST", "/api/quotations", {
      body: { orderId: order.rows[0].id, customerId: CUSTOMER_A, vendorId: "00000000-0000-4000-8000-000000009999", amount: 2500, notes: "malicious" },
      token: tokenFor(VENDOR_USER, "vendor", "vendor@example.com"),
    });

    expect(res.status).toBe(403);
  });
});

describe("POST /api/auth/register", () => {
  it("keeps supplier registration from creating a vendor profile", async () => {
    if (!TEST_DATABASE_URL) return;
    const res = await send("POST", "/api/auth/register", {
      body: { email: "newsupplier@example.com", fullName: "New Supplier", role: "supplier", businessName: "Supplier Co.", password: "password123" },
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("supplier");

    const vendor = await pool.query("SELECT id FROM vendors WHERE user_id = $1", [res.body.user.id]);
    expect(vendor.rows).toHaveLength(0);
  });
});

describe("POST /api/auth/login", () => {
  it("rejects a wrong password with 401 and no token", async () => {
    if (!TEST_DATABASE_URL) return;
    const res = await send("POST", "/api/auth/login", {
      body: { email: "a@example.com", password: "wrong-password" },
    });
    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  it("blocks a pending business account", async () => {
    if (!TEST_DATABASE_URL) return;
    await pool.query("UPDATE users SET status = 'pending_approval' WHERE email = 'newbiz@example.com'");
    const res = await send("POST", "/api/auth/login", {
      body: { email: "newbiz@example.com", password: "password123" },
    });
    expect(res.status).toBe(403);
    expect(res.body.token).toBeUndefined();
  });

  it("blocks a suspended account", async () => {
    if (!TEST_DATABASE_URL) return;
    await pool.query("UPDATE users SET status = 'suspended' WHERE email = 'newcustomer@example.com'");
    const res = await send("POST", "/api/auth/login", {
      body: { email: "newcustomer@example.com", password: "password123" },
    });
    expect(res.status).toBe(403);
  });

  it("does not reveal that a password is wrong for a suspended account", async () => {
    if (!TEST_DATABASE_URL) return;
    // Status is only reported after the password check, so a wrong password on a
    // suspended account still reads as a plain 401 rather than leaking account state.
    const res = await send("POST", "/api/auth/login", {
      body: { email: "newcustomer@example.com", password: "not-the-password" },
    });
    expect(res.status).toBe(401);
  });

  it("issues a token for a good password", async () => {
    if (!TEST_DATABASE_URL) return;
    const res = await send("POST", "/api/auth/login", {
      body: { email: "a@example.com", password: "password123" },
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe("customer");
  });
});
