import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./utils/auth.js", () => ({ verifyToken: vi.fn((token) => {
  if (token === "admin") return { id: "1", role: "admin" };
  if (token === "vendor") return { id: "2", role: "vendor" };
  return null;
}) }));
vi.mock("./utils/helpers.js", () => ({ currentTime: () => "test-time" }));

import { registerSocketHandlers } from "./socket.js";

function createHarness(token) {
  const io = { middleware: null, connection: null, rooms: [], broadcasts: [],
    use(fn) { this.middleware = fn; },
    on(event, fn) { if (event === "connection") this.connection = fn; },
    to(room) { return { emit: (event, payload) => this.broadcasts.push({ room, event, payload }) }; },
  };
  const socket = { handshake: { auth: { token } }, handlers: {}, joined: [], emitted: [],
    on(event, fn) { this.handlers[event] = fn; },
    join(room) { this.joined.push(room); },
    emit(event, payload) { this.emitted.push({ event, payload }); },
  };
  registerSocketHandlers(io);
  return { io, socket, connect() { io.middleware(socket, (err) => { if (err) throw err; io.connection(socket); }); } };
}

describe("Socket.IO notification and legacy chat access", () => {
  it("rejects missing or invalid tokens", () => {
    const h = createHarness("bad-token");
    expect(() => h.connect()).toThrow("Invalid token.");
  });

  it("joins only the authenticated vendor notification room", () => {
    const h = createHarness("vendor");
    h.connect();
    h.socket.handlers["notification:join"]();
    expect(h.socket.joined).toEqual(["vendor:2:notifications"]);
  });

  it("rejects vendor notification-send attempts without broadcasting", () => {
    const h = createHarness("vendor");
    h.connect();
    h.socket.handlers["notification:send"]({ title: "attack", message: "hello" });
    expect(h.io.broadcasts).toHaveLength(0);
    expect(h.socket.emitted.some(e => e.payload?.title === "Unauthorized")).toBe(true);
  });

  it("admin can send bounded notification data only to admin room", () => {
    const h = createHarness("admin");
    h.connect();
    h.socket.handlers["notification:join"]();
    h.socket.handlers["notification:send"]({ title: "  Admin notice ", message: " message ", audience: "all", source: "forged" });
    const broadcast = h.io.broadcasts.at(-1);
    expect(broadcast.room).toBe("woodverse-admin-notifications");
    expect(broadcast.payload.title).toBe("Admin notice");
    expect(broadcast.payload.message).toBe("message");
    expect(broadcast.payload.audience).toBe("Admin");
    expect(broadcast.payload.source).toBe("WoodVerse Admin");
  });

  it("blocks legacy shared-chat events", () => {
    const h = createHarness("vendor");
    h.connect();
    h.socket.handlers["vendor:join"]();
    h.socket.handlers["vendor:thread:open"]();
    h.socket.handlers["vendor:message:send"]();
    expect(h.socket.emitted.filter(e => e.event === "vendor:message")).toHaveLength(3);
    expect(h.io.broadcasts).toHaveLength(0);
  });
});
