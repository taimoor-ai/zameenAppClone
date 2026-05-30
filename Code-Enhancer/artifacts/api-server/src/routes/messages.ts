import { Router } from "express";
import { z } from "zod";

import { pool } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const sendSchema = z.object({
  propertyId: z.string().uuid(),
  receiverId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

router.get("/messages", requireAuth, async (req, res) => {
  const { propertyId } = req.query as { propertyId?: string };
  const userId = req.user!.id;

  if (!propertyId) {
    res.status(400).json({ error: "propertyId is required" });
    return;
  }

  const result = await pool.query(
    `SELECT
      m.id, m.property_id, m.sender_id, m.receiver_id, m.content, m.created_at,
      su.name AS sender_name,
      su.profile_pic_url AS sender_avatar,
      ru.name AS receiver_name
    FROM messages m
    JOIN users su ON su.id = m.sender_id
    JOIN users ru ON ru.id = m.receiver_id
    WHERE m.property_id = $1
      AND (m.sender_id = $2 OR m.receiver_id = $2)
    ORDER BY m.created_at ASC
    LIMIT 200`,
    [propertyId, userId]
  );

  res.json({
    messages: result.rows.map((r) => ({
      id: r.id,
      propertyId: r.property_id,
      senderId: r.sender_id,
      senderName: r.sender_name,
      senderAvatar: r.sender_avatar ?? "",
      receiverId: r.receiver_id,
      receiverName: r.receiver_name,
      content: r.content,
      createdAt: r.created_at,
    })),
  });
});

router.post("/messages", requireAuth, async (req, res) => {
  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const { propertyId, receiverId, content } = parsed.data;
  const senderId = req.user!.id;

  if (senderId === receiverId) {
    res.status(400).json({ error: "Cannot message yourself" });
    return;
  }

  const prop = await pool.query(
    "SELECT seller_id FROM properties WHERE id = $1",
    [propertyId]
  );
  if (prop.rows.length === 0) {
    res.status(404).json({ error: "Property not found" });
    return;
  }

  const result = await pool.query(
    `INSERT INTO messages (property_id, sender_id, receiver_id, content)
     VALUES ($1, $2, $3, $4)
     RETURNING id, created_at`,
    [propertyId, senderId, receiverId, content]
  );

  const receiverRow = await pool.query("SELECT name FROM users WHERE id = $1", [receiverId]);
  const receiverName = receiverRow.rows[0]?.name ?? "";

  res.status(201).json({
    message: {
      id: result.rows[0].id,
      propertyId,
      senderId,
      senderName: req.user!.name,
      senderAvatar: req.user?.avatar ?? "",
      receiverId,
      receiverName,
      content,
      createdAt: result.rows[0].created_at,
    },
  });
});

router.get("/messages/conversations", requireAuth, async (req, res) => {
  const userId = req.user!.id;

  const result = await pool.query(
    `SELECT DISTINCT ON (m.property_id, other_party)
      m.property_id,
      CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END AS other_party,
      p.title AS property_title,
      p.city AS property_city,
      u.name AS other_party_name,
      u.profile_pic_url AS other_party_avatar,
      m.content AS last_message,
      m.created_at AS last_message_at
    FROM messages m
    JOIN properties p ON p.id = m.property_id
    JOIN users u ON u.id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END
    WHERE m.sender_id = $1 OR m.receiver_id = $1
    ORDER BY m.property_id, other_party, m.created_at DESC
    LIMIT 50`,
    [userId]
  );

  res.json({
    conversations: result.rows.map((r) => ({
      propertyId: r.property_id,
      propertyTitle: r.property_title,
      propertyCity: r.property_city,
      otherPartyId: r.other_party,
      otherPartyName: r.other_party_name,
      otherPartyAvatar: r.other_party_avatar ?? "",
      lastMessage: r.last_message,
      lastMessageAt: r.last_message_at,
    })),
  });
});

export default router;
