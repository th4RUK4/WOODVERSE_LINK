import { Router } from "express";
import { databaseConfigured, query } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

export const messagesRouter = Router();

messagesRouter.post("/api/messages", authenticateToken, async (request, response) => {
  if (!databaseConfigured) return response.status(503).json({ error: "Messaging unavailable." });
  const senderId = String(request.user.id);
  const { recipientId, threadId, body } = request.body || {};
  const content = typeof body === "string" ? body.trim() : "";
  if (!recipientId || !content || content.length > 5000 || String(recipientId) === senderId) {
    return response.status(400).json({ error: "Valid recipientId and message body (1-5000 characters) are required." });
  }
  try {
    const recipient = await query("SELECT id FROM users WHERE id = $1 AND status = 'active'", [recipientId]);
    if (!recipient.rows.length) return response.status(404).json({ error: "Recipient not found." });

    let resolvedThread = threadId;
    if (resolvedThread) {
      const members = await query("SELECT DISTINCT sender_id, recipient_id FROM messages WHERE thread_id = $1", [resolvedThread]);
      const allowed = members.rows.some(row =>
        (String(row.sender_id) === senderId && String(row.recipient_id) === String(recipientId)) ||
        (String(row.sender_id) === String(recipientId) && String(row.recipient_id) === senderId)
      );
      if (!allowed) return response.status(403).json({ error: "You are not a participant in this conversation." });
    } else {
      resolvedThread = null;
    }
    const inserted = await query(
      "INSERT INTO messages (sender_id, recipient_id, thread_id, body) VALUES ($1, $2, COALESCE($3, gen_random_uuid()), $4) RETURNING id, sender_id, recipient_id, thread_id, body, created_at, read_at",
      [senderId, recipientId, resolvedThread, content]
    );
    return response.status(201).json({ message: inserted.rows[0] });
  } catch {
    return response.status(500).json({ error: "Unable to send message." });
  }
});

messagesRouter.get("/api/messages", authenticateToken, async (request, response) => {
  if (!databaseConfigured) return response.status(503).json({ error: "Messaging unavailable." });
  try {
    const values = [request.user.id];
    let sql = "SELECT id, sender_id, recipient_id, thread_id, body, created_at, read_at FROM messages WHERE (sender_id = $1 OR recipient_id = $1)";
    if (request.query.threadId) {
      sql += " AND thread_id = $2";
      values.push(request.query.threadId);
    }
    sql += " ORDER BY created_at ASC LIMIT 1000";
    const result = await query(sql, values);
    return response.json({ messages: result.rows });
  } catch {
    return response.status(500).json({ error: "Unable to retrieve messages." });
  }
});
