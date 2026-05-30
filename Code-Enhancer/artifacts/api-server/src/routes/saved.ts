import { Router } from "express";

import { pool } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/saved", requireAuth, async (req, res) => {
  if (req.user!.id === "admin") {
    res.json({ properties: [] });
    return;
  }
  const result = await pool.query(`
    SELECT
      p.id, p.seller_id, p.title, p.description, p.listing_type, p.property_type,
      p.price, p.area_size, p.bedrooms, p.bathrooms, p.city, p.area,
      p.status, p.featured, p.owner_name, p.owner_phone, p.created_at,
      COALESCE(json_agg(pi.image_url) FILTER (WHERE pi.image_url IS NOT NULL), '[]') AS images,
      sp.saved_at
    FROM saved_properties sp
    JOIN properties p ON p.id = sp.property_id
    LEFT JOIN property_images pi ON pi.property_id = p.id
    WHERE sp.user_id = $1
    GROUP BY p.id, sp.saved_at
    ORDER BY sp.saved_at DESC
  `, [req.user!.id]);

  res.json({ properties: result.rows });
});

router.post("/saved/:propertyId", requireAuth, async (req, res) => {
  if (req.user!.id === "admin") {
    res.status(403).json({ error: "Admin cannot save properties" });
    return;
  }
  try {
    await pool.query(
      "INSERT INTO saved_properties (user_id, property_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [req.user!.id, req.params.propertyId]
    );
    res.status(201).json({ success: true });
  } catch {
    res.status(409).json({ error: "Already saved" });
  }
});

router.delete("/saved/:propertyId", requireAuth, async (req, res) => {
  if (req.user!.id === "admin") {
    res.status(403).json({ error: "Admin cannot unsave properties" });
    return;
  }
  await pool.query(
    "DELETE FROM saved_properties WHERE user_id = $1 AND property_id = $2",
    [req.user!.id, req.params.propertyId]
  );
  res.json({ success: true });
});

router.post("/transactions", requireAuth, async (req, res) => {
  const {
    propertyId, propertyTitle, propertyCity, propertyType,
    transactionType, amountTransacted,
    sellerOrOwnerId, sellerOrOwnerName, sellerOrOwnerEmail,
  } = req.body;

  const user = req.user!;

  const result = await pool.query(
    `INSERT INTO transactions
      (property_id, property_title, property_city, property_type,
       transaction_type, amount_transacted,
       party_first_id, party_first_name, party_first_email,
       party_second_id, party_second_name, party_second_email)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING id`,
    [propertyId || null, propertyTitle, propertyCity, propertyType,
     transactionType === "sale" ? "sale" : "rent_lease", amountTransacted,
     sellerOrOwnerId || null, sellerOrOwnerName, sellerOrOwnerEmail,
     user.id === "admin" ? null : user.id, user.name, user.email]
  );
  res.status(201).json({ success: true, id: result.rows[0].id });
});

export default router;
