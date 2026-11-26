import { Router } from "express";
import { databaseConfigured, query } from "../db.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

export const vendorsRouter = Router();

vendorsRouter.post("/api/vendors", authenticateToken, authorizeRoles("vendor", "admin"), async (request, response) => {
  if (!databaseConfigured) return response.status(503).json({ error: "PostgreSQL is not configured." });
  const { userId, businessName, registrationNumber, description, documents = [] } = request.body || {};
  const effectiveUserId = request.user.role === "admin" ? userId : request.user.id;
  if (!effectiveUserId || !businessName || typeof businessName !== "string" || businessName.trim().length > 200) return response.status(400).json({ error: "Valid userId and businessName are required." });
  if (!Array.isArray(documents) || documents.length > 20) return response.status(400).json({ error: "Invalid documents list." });
  try {
    if (request.user.role !== "admin") {
      if (userId && String(userId) !== String(request.user.id)) return response.status(403).json({ error: "You can only create a vendor profile for your own account." });
      const existing = await query("SELECT id FROM vendors WHERE user_id = $1", [request.user.id]);
      if (existing.rows.length) return response.status(403).json({ error: "A vendor profile already exists for this account." });
    } else {
      const userResult = await query("SELECT id FROM users WHERE id = $1", [effectiveUserId]);
      if (!userResult.rows.length) return response.status(404).json({ error: "User not found." });
    }
    const result = await query(
      "INSERT INTO vendors (user_id, business_name, registration_number, description, documents) VALUES ($1, $2, $3, $4, $5) RETURNING id, user_id, business_name, registration_number, description, verification_status, created_at",
      [effectiveUserId, businessName.trim(), registrationNumber || null, description || null, JSON.stringify(documents)]
    );
    return response.status(201).json({ vendor: result.rows[0] });
  } catch {
    return response.status(500).json({ error: "Unable to create vendor profile." });
  }
});

// Marketplace-facing listing deliberately excludes personal contact data and documents.
vendorsRouter.get("/api/vendors", authenticateToken, async (request, response) => {
  if (!databaseConfigured) return response.status(503).json({ error: "PostgreSQL is not configured." });
  try {
    const result = await query("SELECT v.id, v.business_name, v.description, v.verification_status, v.created_at FROM vendors v WHERE v.verification_status = 'approved' ORDER BY v.created_at DESC");
    return response.json({ vendors: result.rows });
  } catch {
    return response.status(500).json({ error: "Unable to retrieve vendors." });
  }
});
