import { eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";

import { db, propertiesTable, propertyImagesTable } from "@workspace/db";
import { pool } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/properties", async (req, res) => {
  const { listingType, city, propertyType, minPrice, maxPrice, limit = "50", offset = "0" } = req.query as Record<string, string>;

  const conditions: string[] = ["1=1"];
  const params: (string | number)[] = [];
  let idx = 1;

  if (listingType && (listingType === "sale" || listingType === "rent")) {
    conditions.push(`p.listing_type = $${idx++}`);
    params.push(listingType);
  }
  if (city && city.trim()) {
    conditions.push(`LOWER(p.city) = LOWER($${idx++})`);
    params.push(city.trim());
  }
  if (propertyType && propertyType.trim()) {
    conditions.push(`p.property_type = $${idx++}`);
    params.push(propertyType.trim());
  }
  if (minPrice && !isNaN(Number(minPrice))) {
    conditions.push(`p.price >= $${idx++}`);
    params.push(Number(minPrice));
  }
  if (maxPrice && !isNaN(Number(maxPrice))) {
    conditions.push(`p.price <= $${idx++}`);
    params.push(Number(maxPrice));
  }

  const sql = `
    SELECT
      p.id, p.seller_id, p.title, p.description, p.listing_type, p.property_type,
      p.price, p.area_size, p.bedrooms, p.bathrooms, p.city, p.area,
      p.latitude, p.longitude, p.status, p.featured, p.owner_name, p.owner_phone,
      p.created_at, p.updated_at,
      COALESCE(json_agg(pi.image_url) FILTER (WHERE pi.image_url IS NOT NULL), '[]') AS images,
      u.profile_pic_url AS owner_avatar
    FROM properties p
    LEFT JOIN property_images pi ON pi.property_id = p.id
    LEFT JOIN users u ON u.id = p.seller_id
    WHERE ${conditions.join(" AND ")}
    GROUP BY p.id, u.profile_pic_url
    ORDER BY p.featured DESC, p.created_at DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `;
  params.push(Math.min(Number(limit), 100), Number(offset));

  const result = await pool.query(sql, params);
  res.json({ properties: result.rows.map(normalizeProperty) });
});

router.get("/properties/:id", async (req, res) => {
  const sql = `
    SELECT
      p.id, p.seller_id, p.title, p.description, p.listing_type, p.property_type,
      p.price, p.area_size, p.bedrooms, p.bathrooms, p.city, p.area,
      p.latitude, p.longitude, p.status, p.featured, p.owner_name, p.owner_phone,
      p.created_at, p.updated_at,
      COALESCE(json_agg(pi.image_url ORDER BY pi.is_thumbnail DESC, pi.created_at)
        FILTER (WHERE pi.image_url IS NOT NULL), '[]') AS images,
      u.profile_pic_url AS owner_avatar
    FROM properties p
    LEFT JOIN property_images pi ON pi.property_id = p.id
    LEFT JOIN users u ON u.id = p.seller_id
    WHERE p.id = $1
    GROUP BY p.id, u.profile_pic_url
  `;
  const result = await pool.query(sql, [req.params.id]);
  if (result.rows.length === 0) {
    res.status(404).json({ error: "Property not found" });
    return;
  }
  res.json({ property: normalizeProperty(result.rows[0]) });
});

const createPropertySchema = z.object({
  title: z.string().min(3),
  description: z.string().optional().default(""),
  listingType: z.enum(["sale", "rent"]),
  propertyType: z.enum(["house", "apartment", "plot", "commercial", "farmhouse"]),
  price: z.number().positive(),
  areaSize: z.string().optional().default(""),
  bedrooms: z.number().int().min(0).optional().default(0),
  bathrooms: z.number().int().min(0).optional().default(0),
  city: z.string().min(1),
  area: z.string().optional().default(""),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  featured: z.boolean().optional().default(false),
  images: z.array(z.string()).optional().default([]),
});

router.post("/properties", requireAuth, async (req, res) => {
  const parsed = createPropertySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const { images, ...data } = parsed.data;
  const user = req.user!;

  let ownerName = user.name;
  let ownerPhone = "";
  let ownerAvatar = user.avatar ?? "";
  let sellerId: string | null = user.id;

  if (user.id === "admin") {
    sellerId = null;
    ownerName = "GharDhoondo";
    ownerAvatar = "";
  } else {
    const userResult = await pool.query("SELECT phone, profile_pic_url FROM users WHERE id = $1", [user.id]);
    ownerPhone = userResult.rows[0]?.phone ?? "";
    ownerAvatar = userResult.rows[0]?.profile_pic_url ?? "";
  }

  const [property] = await db
    .insert(propertiesTable)
    .values({
      sellerId,
      title: data.title,
      description: data.description,
      listingType: data.listingType,
      propertyType: data.propertyType,
      price: String(data.price),
      areaSize: data.areaSize,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      city: data.city,
      area: data.area,
      latitude: data.latitude ? String(data.latitude) : null,
      longitude: data.longitude ? String(data.longitude) : null,
      featured: data.featured,
      ownerName,
      ownerPhone,
    })
    .returning();

  if (images && images.length > 0) {
    await db.insert(propertyImagesTable).values(
      images.map((url, i) => ({ propertyId: property.id, imageUrl: url, isThumbnail: i === 0 }))
    );
  }

  res.status(201).json({ property: { ...property, images, ownerAvatar } });
});

router.put("/properties/:id/status", requireAuth, async (req, res) => {
  const propertyId = String(req.params.id);
  const status = req.body.status;
  if (!["available", "sold", "rented"].includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }
  const [property] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, propertyId)).limit(1);
  if (!property) {
    res.status(404).json({ error: "Property not found" });
    return;
  }
  if (property.sellerId !== req.user!.id && req.user!.role !== "admin") {
    res.status(403).json({ error: "Only the seller or admin can change status" });
    return;
  }
  await db.update(propertiesTable).set({ status }).where(eq(propertiesTable.id, propertyId));
  res.json({ success: true, status });
});

router.delete("/properties/:id", requireAuth, async (req, res) => {
  const propertyId = String(req.params.id);
  const [property] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, propertyId)).limit(1);
  if (!property) {
    res.status(404).json({ error: "Property not found" });
    return;
  }
  if (property.sellerId !== req.user!.id && req.user!.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  await db.delete(propertiesTable).where(eq(propertiesTable.id, propertyId));
  res.json({ success: true });
});

function normalizeProperty(row: Record<string, unknown>) {
  return {
    id: row.id,
    sellerId: row.seller_id,
    title: row.title,
    description: row.description,
    listingType: row.listing_type,
    propertyType: row.property_type,
    price: Number(row.price),
    areaSize: row.area_size,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    city: row.city,
    area: row.area,
    latitude: row.latitude ? Number(row.latitude) : null,
    longitude: row.longitude ? Number(row.longitude) : null,
    status: row.status,
    featured: row.featured,
    ownerName: row.owner_name,
    ownerPhone: row.owner_phone,
    ownerAvatar: row.owner_avatar ?? "",
    images: Array.isArray(row.images) ? row.images : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default router;
