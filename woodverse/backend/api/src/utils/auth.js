import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters.");
}
const JWT_EXPIRY = "7d";

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY, algorithm: "HS256" });
}

export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    if (!decoded || typeof decoded !== "object" || !decoded.id || !decoded.role) return null;
    return decoded;
  } catch {
    return null;
  }
}
