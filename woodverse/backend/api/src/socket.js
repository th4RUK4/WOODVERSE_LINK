import { currentTime } from "./utils/helpers.js";
import { verifyToken } from "./utils/auth.js";

function getAllowedNotificationRoom(user) {
  if (!user) return null;
  if (user.role === "admin") return "woodverse-admin-notifications";
  if (["customer", "vendor", "supplier"].includes(user.role)) return `${user.role}:${user.id}:notifications`;
  return null;
}

export function registerSocketHandlers(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(" ")[1];
    if (!token) return next(new Error("Authentication required."));
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id || !decoded.role) return next(new Error("Invalid token."));
    socket.user = decoded;
    next();
  });

  io.on("connection", (socket) => {
    // Private vendor/supplier chat is intentionally disabled here until participant-
    // validated conversation rooms and persistence are implemented.
    const rejectLegacyChat = () => socket.emit("vendor:message", {
      id: `notice-error-${Date.now()}`, vendor: "System", sender: "system",
      text: "Shared vendor chat is disabled for privacy. Use the authenticated messaging API.",
      time: currentTime(),
    });
    socket.on("vendor:join", rejectLegacyChat);
    socket.on("vendor:thread:open", rejectLegacyChat);
    socket.on("vendor:message:send", rejectLegacyChat);

    socket.on("notification:join", () => {
      const room = getAllowedNotificationRoom(socket.user);
      if (!room) return socket.emit("notification:event", { audience:"System", source:"WoodVerse API", title:"Unauthorized", message:"Not authorized.", time:currentTime() });
      socket.join(room);
      socket.emit("notification:event", {
        id: `notice-welcome-${Date.now()}`, audience:"System", source:"WoodVerse API",
        title:"Notification channel connected", message:"Your notification channel is active.", time:currentTime(),
      });
    });

    // Restrict notification broadcasts to the dedicated admin room. Validate and
    // bound payloads to avoid abuse; client-provided audience/source are not trusted.
    let lastNotificationAt = 0;
    socket.on("notification:send", (payload = {}) => {
      if (socket.user?.role !== "admin") {
        return socket.emit("notification:event", { audience:"System", source:"WoodVerse API", title:"Unauthorized", message:"Only admins can send notifications.", time:currentTime() });
      }
      const now = Date.now();
      if (now - lastNotificationAt < 1000) return;
      lastNotificationAt = now;
      const title = typeof payload.title === "string" ? payload.title.trim().slice(0, 160) : "";
      const message = typeof payload.message === "string" ? payload.message.trim().slice(0, 2000) : "";
      io.to("woodverse-admin-notifications").emit("notification:event", {
        id: `notice-${now}`, audience:"Admin", source:"WoodVerse Admin",
        title:title || "Admin notification", message:message || "A notification was created.", time:currentTime(),
      });
    });;
  });
}
