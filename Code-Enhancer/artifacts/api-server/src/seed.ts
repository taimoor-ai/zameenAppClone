import { db, propertiesTable, propertyImagesTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./lib/logger";

const SAMPLE_PROPERTIES = [
  {
    title: "Modern 4-Bedroom House in DHA",
    description: "A beautiful modern house with spacious rooms, marble flooring, and a lush green garden. Located in the heart of DHA with easy access to main boulevard.",
    listingType: "sale" as const,
    propertyType: "house" as const,
    price: "25000000",
    areaSize: "10 Marla",
    bedrooms: 4,
    bathrooms: 4,
    city: "Lahore",
    area: "DHA Phase 5",
    status: "available" as const,
    featured: true,
    ownerName: "Ahmed Ali",
    ownerPhone: "0300-1234567",
  },
  {
    title: "Luxury Apartment in Clifton",
    description: "Stunning sea-view apartment on the 12th floor with premium finishes. Fully furnished with modern kitchen and walk-in closets.",
    listingType: "rent" as const,
    propertyType: "apartment" as const,
    price: "85000",
    areaSize: "1800 sq ft",
    bedrooms: 3,
    bathrooms: 2,
    city: "Karachi",
    area: "Clifton Block 2",
    status: "available" as const,
    featured: true,
    ownerName: "Sara Khan",
    ownerPhone: "0321-9876543",
  },
  {
    title: "Commercial Plot in Multan",
    description: "Prime commercial plot on main road with ideal footfall for business. All utilities available.",
    listingType: "sale" as const,
    propertyType: "plot" as const,
    price: "8500000",
    areaSize: "4 Marla",
    bedrooms: 0,
    bathrooms: 0,
    city: "Multan",
    area: "Gulgasht Colony",
    status: "available" as const,
    featured: false,
    ownerName: "Bilal Mehmood",
    ownerPhone: "0333-5556789",
  },
  {
    title: "Cozy 2-Bedroom Apartment",
    description: "Well-maintained apartment in a secure society with 24/7 guard, backup generator, and ample parking.",
    listingType: "rent" as const,
    propertyType: "apartment" as const,
    price: "45000",
    areaSize: "1200 sq ft",
    bedrooms: 2,
    bathrooms: 2,
    city: "Islamabad",
    area: "F-10 Markaz",
    status: "available" as const,
    featured: false,
    ownerName: "Farah Nawaz",
    ownerPhone: "0311-4445566",
  },
  {
    title: "Farmhouse with Pool in Chakwal",
    description: "Beautiful farmhouse spread over 2 kanals with swimming pool, fruit trees, and servant quarters. Perfect weekend retreat.",
    listingType: "sale" as const,
    propertyType: "farmhouse" as const,
    price: "15000000",
    areaSize: "2 Kanal",
    bedrooms: 5,
    bathrooms: 4,
    city: "Chakwal",
    area: "Talagang Road",
    status: "available" as const,
    featured: true,
    ownerName: "Imran Malik",
    ownerPhone: "0345-7778899",
  },
];

export async function seedDatabase(): Promise<void> {
  try {
    const result = await db.execute(sql`SELECT COUNT(*) as count FROM properties`);
    const count = Number((result.rows[0] as { count: string }).count);
    if (count > 0) {
      logger.info({ count }, "Database already seeded, skipping");
      return;
    }
    logger.info("Seeding sample properties...");
    for (const prop of SAMPLE_PROPERTIES) {
      await db.insert(propertiesTable).values(prop);
    }
    logger.info({ count: SAMPLE_PROPERTIES.length }, "Sample properties seeded");
  } catch (err) {
    logger.error({ err }, "Failed to seed database");
  }
}
