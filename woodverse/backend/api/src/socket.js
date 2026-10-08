import { currentTime } from "./utils/helpers.js";
import { verifyToken } from "./utils/auth.js";

function getAllowedSharedRoom(user) {
  if (!user || !["vendor", "supplier"].includes(user.role)) {
    return null;
  }
  return "supplier-vendor-messages";
}

function getAllowedNotificationRoom(user) {
  if (!user) {
    return null;
  }

  if (user.role === "admin") {
    return "woodverse-notifications";
  }

  if (user.role === "customer") {
    return `customer:${user.id}:notifications`;
  }

  if (user.role === "vendor") {
    return `vendor:${user.id}:notifications`;
  }

  if (user.role === "supplier") {
    return `supplier:${user.id}:notifications`;
  }

  return null;
}

export function registerSocketHandlers(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(" ")[1];
    if (!token) {
      return next(new Error("Authentication required."));
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error("Invalid token."));
    }
    socket.user = decoded;
    next();
  });

  io.on("connection", (socket) => {
    socket.on("vendor:join", ({ supplier } = {}) => {
      const room = getAllowedSharedRoom(socket.user);
      if (!room) {
        return socket.emit("vendor:message", {
          id: `notice-error-${Date.now()}`,
          vendor: "System",
          sender: "system",
          text: "Only vendors and suppliers can join the supplier-vendor channel.",
          time: currentTime(),
        });
      }

      socket.join(room);
      socket.emit("vendor:message", {
        id: `welcome-${Date.now()}`,
        vendor: socket.user.role === "vendor" ? "Vendor Channel" : "Supplier Channel",
        sender: socket.user.role,
        text: `${socket.user.fullName || supplier || "Supplier"} is connected to the vendor messaging channel.`,
        time: currentTime(),
      });
    });

    socket.on("vendor:thread:open", ({ vendor } = {}) => {
      if (!socket.user || !["vendor", "supplier"].includes(socket.user.role)) {
        return socket.emit("vendor:message", {
          id: `notice-error-${Date.now()}`,
          vendor: "System",
          sender: "system",
          text: "You are not authorized to open a vendor message thread.",
          time: currentTime(),
        });
      }

      socket.emit("vendor:message", {
        id: `thread-${Date.now()}`,
        vendor: vendor || "Vendor",
        sender: socket.user.role,
        text: `Realtime thread opened with ${vendor || "the vendor"}.`,
        time: currentTime(),
      });
    });

    socket.on("vendor:message:send", ({ vendor, text } = {}) => {
      if (!socket.user || !["vendor", "supplier"].includes(socket.user.role)) {
        return socket.emit("vendor:message", {
          id: `notice-error-${Date.now()}`,
          vendor: "System",
          sender: "system",
          text: "Only vendor and supplier accounts can send vendor messages.",
          time: currentTime(),
        });
      }

      const room = getAllowedSharedRoom(socket.user);
      if (!room || !text) {
        return socket.emit("vendor:message", {
          id: `notice-error-${Date.now()}`,
          vendor: vendor || "System",
          sender: "system",
          text: "Message content is required.",
          time: currentTime(),
        });
      }

      const sender = socket.user.role;
      const sentMessage = {
        id: `socket-${Date.now()}`,
        vendor: vendor || "Vendor",
        sender,
        text,
        time: currentTime(),
      };
      socket.to(room).emit("vendor:message", sentMessage);

      socket.emit("vendor:message", {
        id: `ack-${Date.now()}`,
        vendor: vendor || "Vendor",
        sender,
        text: `${sender === "supplier" ? "Supplier" : "Vendor"} message sent to ${vendor || "the vendor"}.`,
        time: currentTime(),
      });
    });

    socket.on("notification:join", () => {
      const room = getAllowedNotificationRoom(socket.user);
      if (!room) {
        return socket.emit("notification:event", {
          id: `notice-error-${Date.now()}`,
          audience: "System",
          source: "WoodVerse API",
          title: "Unauthorized",
          message: "You are not authorized to join notification rooms.",
          time: currentTime(),
        });
      }

      socket.join(room);
      if (socket.user.role === "admin") {
        socket.join("woodverse-notifications");
      }

      socket.emit("notification:event", {
        id: `notice-welcome-${Date.now()}`,
        audience: "System",
        source: "WoodVerse API",
        title: "Notification channel connected",
        message: `${socket.user.role} notifications are active for ${socket.user.fullName || socket.user.email}.`,
        time: currentTime(),
      });
    });

    socket.on("notification:send", ({ audience = "Vendor", source = "WoodVerse", title, message } = {}) => {
      if (!socket.user || socket.user.role !== "admin") {
        return socket.emit("notification:event", {
          id: `notice-error-${Date.now()}`,
          audience: "System",
          source: "WoodVerse API",
          title: "Unauthorized",
          message: "Only admins can send notifications.",
          time: currentTime(),
        });
      }
      const notification = {
        id: `notice-${Date.now()}`,
        audience,
        source,
        title: title || `${audience} notification`,
        message: message || "A new WoodVerse notification was created.",
        time: currentTime(),
      };
      io.to("woodverse-notifications").emit("notification:event", notification);
    });
  });
}
