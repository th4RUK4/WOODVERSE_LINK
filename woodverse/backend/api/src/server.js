import http from "node:http";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "node:path";
import { fileURLToPath } from "node:url";
import rateLimit from "express-rate-limit";
import { Server } from "socket.io";
import { databaseConfigured, initializeDatabase } from "./db.js";
import { registerRoutes } from "./routes/index.js";
import { devCredentials } from "./routes/auth.js";
import { registerSocketHandlers } from "./socket.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const port = Number(process.env.PORT || 4000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT must be a valid TCP port.");
const isProduction = process.env.NODE_ENV === "production";
if (isProduction && !process.env.WEB_ORIGIN) throw new Error("WEB_ORIGIN must be explicitly configured in production.");
if (isProduction && !databaseConfigured) throw new Error("DATABASE_URL is required in production.");
const configuredOrigins = (process.env.WEB_ORIGIN || "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);


const app = express();
app.use(helmet());
app.use(cors({ origin: configuredOrigins, credentials: true }));
app.use(express.json({ limit: "1mb" }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: "Too many authentication attempts. Try again later." } });
app.use("/api/auth", authLimiter);

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use("/api", apiLimiter);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: configuredOrigins,
    methods: ["GET", "POST"],
  },
});

registerRoutes(app, io);
registerSocketHandlers(io);

const frontendDistPath = path.join(__dirname, "..", "..", "..", "frontend", "dist");
if (process.env.NODE_ENV === "production") {
  app.use(express.static(frontendDistPath));
  app.get("*", (request, response) => {
    if (request.path.startsWith("/api")) {
      return response.status(404).json({ error: "Not found" });
    }
    response.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

initializeDatabase()
  .then((result) => {
    const databaseStatus = result.initialized ? "ready" : "not_configured";
    server.listen(port, "0.0.0.0",() => {
      console.log(`WoodVerse Express API and Socket.IO server running on http://localhost:${port}`);
      console.log(`PostgreSQL database: ${databaseStatus}`);
      if (!result.initialized && process.env.NODE_ENV !== "production") {
        console.log("No database, so login falls back to seeded in-memory accounts:");
        for (const account of devCredentials) console.log(`  ${account.email} / ${account.password}`);
      }
    });
  })
  .catch((error) => {
    console.error(`PostgreSQL initialization failed: ${error.message}`);
    server.listen(port, "0.0.0.0", () => console.log(`WoodVerse Express API and Socket.IO server running on http://localhost:${port} without database`));
  });
