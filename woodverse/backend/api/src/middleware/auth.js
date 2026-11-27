import { verifyToken } from "../utils/auth.js";\nimport { databaseConfigured, query } from "../db.js";\nimport { devAccounts } from "../data/memory.js";
import { authorizeRoles } from "./rbac.js";

export { authorizeRoles };

export async function authenticateToken(request, response, next) {
  const header = request.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return response.status(401).json({ error: "Missing or invalid authorization token." });
  }
  const token = header.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return response.status(401).json({ error: "Invalid or expired token." });
  }
  request.user = decoded;
  next();
}

export function isAdmin(request, response, next) {
  if (!request.user || request.user.role !== "admin") {
    return response.status(403).json({ error: "Admin access required." });
  }
  next();
}
