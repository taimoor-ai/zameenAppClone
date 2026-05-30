import { sql } from "drizzle-orm";
import { pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { propertiesTable } from "./properties";
import { usersTable } from "./users";

export const savedPropertiesTable = pgTable(
  "saved_properties",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id").notNull().references(() => propertiesTable.id, { onDelete: "cascade" }),
    savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("saved_properties_user_property_unique").on(t.userId, t.propertyId)],
);

export const insertSavedPropertySchema = createInsertSchema(savedPropertiesTable).omit({ id: true, savedAt: true });
export type InsertSavedProperty = z.infer<typeof insertSavedPropertySchema>;
export type DbSavedProperty = typeof savedPropertiesTable.$inferSelect;
