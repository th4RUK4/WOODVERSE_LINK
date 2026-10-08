import { Router } from "express";
import { databaseConfigured, query } from "../db.js";
import bcrypt from "bcryptjs";
import { signToken } from "../utils/auth.js";
import { devAccounts, devPassword } from "../data/memory.js";

export const authRouter = Router();

// Without a database the portals would be unreachable, because every one of them is
// gated on a role that only a real login can supply. So login falls back to the seeded
// accounts in data/memory.js, the same way the catalog route serves memory products.
//
// This is a development convenience only. In production a missing DATABASE_URL must
// still fail loudly rather than hand out a token for a well known password.
const devAccountsEnabled = !databaseConfigured && process.env.NODE_ENV !== "production";

// Logged once at boot so the credentials do not have to be guessed or read out of the
// source when a developer needs to get into a portal.
export const devCredentials = devAccounts.map((user) => ({ email: user.email, password: devPassword }));

// Public self-registration. "admin" is deliberately not accepted: an admin account can
// only be created by another admin through POST /api/users.
const SELF_REGISTER_ROLES = new Set(["customer", "vendor", "supplier"]);

// Shared by both account sources so a suspended or unapproved account is refused
// identically whether it came from PostgreSQL or from the in-memory seed.
function accountBlocked(user) {
  if (user.status === "suspended") return "Account is suspended.";
  if (user.status === "pending_approval") return "Your account is still waiting for admin approval.";
  return null;
}

authRouter.post("/api/auth/register", async (request, response) => {
  if (!databaseConfigured) {
    return response.status(503).json({
      error: "PostgreSQL is not configured.",
    });
  }

  const { email, fullName, password, role = "customer", businessName } = request.body;

  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedName = String(fullName || "").trim();
  const rawPassword = String(password || "");
  const requestedRole = String(role || "customer").trim().toLowerCase();

  if (!SELF_REGISTER_ROLES.has(requestedRole)) {
    return response.status(400).json({
      error: `role must be one of: ${[...SELF_REGISTER_ROLES].join(", ")}.`,
    });
  }

  if (!normalizedEmail || !normalizedName || !rawPassword) {
    return response.status(400).json({
      error: "Email, full name, and password are required.",
    });
  }

  if (rawPassword.length < 8) {
    return response.status(400).json({
      error: "Password must be at least 8 characters.",
    });
  }

  try {
    const existingUser = await query(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return response.status(409).json({
        error: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(rawPassword, 12);
    // Vendor and supplier accounts stay pending until an admin approves them, so a
    // freshly registered business account cannot immediately act as one.
    const isCustomer = requestedRole === "customer";
    const shouldCreateVendorProfile = requestedRole === "vendor";
    const status = isCustomer ? "active" : "pending_approval";

    const result = await query(
      `INSERT INTO users
        (email, full_name, role, password_hash, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, full_name, role, status, created_at`,
      [normalizedEmail, normalizedName, requestedRole, passwordHash, status]
    );

    const user = result.rows[0];

    if (shouldCreateVendorProfile) {
      await query(
        `INSERT INTO vendors (user_id, business_name, verification_status)
         VALUES ($1, $2, 'pending')`,
        [user.id, String(businessName || `${normalizedName}'s business`).slice(0, 200)]
      );
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
    });

    return response.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    if (error.code === "23505") {
      return response.status(409).json({
        error: "An account with this email already exists.",
      });
    }

    console.error(error);
    return response.status(500).json({
      error: "Internal server error",
    });
  }
});


authRouter.post("/api/auth/login", async (request, response) => {
  if (!databaseConfigured && !devAccountsEnabled) {
    return response.status(503).json({ error: "PostgreSQL is not configured." });
  }
  const { email, password } = request.body;
  if (!email || !password) return response.status(400).json({ error: "Email and password are required." });

  try {
    const user = databaseConfigured
      ? (await query("SELECT id, email, full_name, role, password_hash, status FROM users WHERE email = $1", [email.toLowerCase()])).rows[0]
      : devAccounts.find((candidate) => candidate.email === String(email).trim().toLowerCase());

    if (!user || !user.password_hash) {
      return response.status(401).json({ error: "Invalid email or password." });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return response.status(401).json({ error: "Invalid email or password." });
    }
    const blocked = accountBlocked(user);
    if (blocked) {
      return response.status(403).json({ error: blocked });
    }
    const token = signToken({ id: user.id, email: user.email, role: user.role, fullName: user.full_name });
    response.json({
      token,
      user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role, status: user.status },
      source: databaseConfigured ? "postgresql" : "memory",
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Internal server error" });
  }
});
