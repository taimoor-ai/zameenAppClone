import { sql } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { propertiesTable } from "./properties";

export const propertyImagesTable = pgTable("property_images", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: uuid("property_id").notNull().references(() => propertiesTable.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  isThumbnail: boolean("is_thumbnail").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPropertyImageSchema = createInsertSchema(propertyImagesTable).omit({ id: true, createdAt: true });
export type InsertPropertyImage = z.infer<typeof insertPropertyImageSchema>;
export type DbPropertyImage = typeof propertyImagesTable.$inferSelect;
