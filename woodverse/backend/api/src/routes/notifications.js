import { Router } from "express";
import { currentTime } from "../utils/helpers.js";
import { authenticateToken, isAdmin } from "../middleware/auth.js";

export const notificationsRouter = Router();

notificationsRouter.post("/api/notifications", authenticateToken, isAdmin, (request, response, next) => {
  const notification = {
    id: `notice-${Date.now()}`,
    audience: request.body.audience || "Vendor",
    source: request.body.source || "WoodVerse API",
    title: request.body.title || "WoodVerse notification",
    message: request.body.message || "A WoodVerse event was created.",
    time: currentTime(),
  };
  if (request.io) {
    const room = "woodverse-notifications";
    request.io.to(room).emit("notification:event", notification);
  }
  response.status(201).json(notification);
});
