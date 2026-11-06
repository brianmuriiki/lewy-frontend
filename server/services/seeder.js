import { Admin } from "../models/Admin.js";
import { Trip } from "../models/Trip.js";
import { Vehicle } from "../models/Vehicle.js";
import { Hotel } from "../models/Hotel.js";
import { Gallery } from "../models/Gallery.js";
import { Inquiry } from "../models/Inquiry.js";
import {
  seedTrips,
  seedVehicles,
  seedHotels,
  seedGallery,
  seedInquiries,
} from "../data/seedData.js";

/**
 * Automatically seeds the database if collections are empty.
 */
export async function autoSeedDatabase() {
  try {
    // 1. Seed Admin
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const email = (process.env.DEFAULT_ADMIN_EMAIL || "admin@chalcedony.com").toLowerCase().trim();
      const password = process.env.DEFAULT_ADMIN_PASSWORD || "chalcedony2026";
      const name = process.env.DEFAULT_ADMIN_NAME || "Chalcedony Administrator";
      const role = process.env.DEFAULT_ADMIN_ROLE || "superadmin";

      await Admin.create({ email, password, name, role });
      console.log(`[Seed] Default Admin created (${email})`);
    }

    // 2. Seed Trips
    const tripCount = await Trip.countDocuments();
    if (tripCount === 0) {
      await Trip.insertMany(seedTrips);
      console.log(`[Seed] Inserted ${seedTrips.length} default trips`);
    }

    // 3. Seed Vehicles
    const vehicleCount = await Vehicle.countDocuments();
    if (vehicleCount === 0) {
      await Vehicle.insertMany(seedVehicles);
      console.log(`[Seed] Inserted ${seedVehicles.length} default fleet vehicles`);
    }

    // 4. Seed Hotels
    const hotelCount = await Hotel.countDocuments();
    if (hotelCount === 0) {
      await Hotel.insertMany(seedHotels);
      console.log(`[Seed] Inserted ${seedHotels.length} default hotels & stays`);
    }

    // 5. Seed Gallery
    const galleryCount = await Gallery.countDocuments();
    if (galleryCount === 0) {
      await Gallery.insertMany(seedGallery);
      console.log(`[Seed] Inserted ${seedGallery.length} default gallery media items`);
    }

    // 6. Seed Inquiries
    const inquiryCount = await Inquiry.countDocuments();
    if (inquiryCount === 0) {
      await Inquiry.insertMany(seedInquiries);
      console.log(`[Seed] Inserted ${seedInquiries.length} default booking inquiries`);
    }
  } catch (error) {
    console.warn("[Seed] Auto-seed warning:", error.message);
  }
}

/**
 * Resets and re-seeds all data collections to default seed state
 */
export async function forceResetAndSeed() {
  await Promise.all([
    Trip.deleteMany({}),
    Vehicle.deleteMany({}),
    Hotel.deleteMany({}),
    Gallery.deleteMany({}),
    Inquiry.deleteMany({}),
  ]);

  await Promise.all([
    Trip.insertMany(seedTrips),
    Vehicle.insertMany(seedVehicles),
    Hotel.insertMany(seedHotels),
    Gallery.insertMany(seedGallery),
    Inquiry.insertMany(seedInquiries),
  ]);

  // Ensure admin account exists
  const adminCount = await Admin.countDocuments();
  if (adminCount === 0) {
    const email = (process.env.DEFAULT_ADMIN_EMAIL || "admin@chalcedony.com").toLowerCase().trim();
    const password = process.env.DEFAULT_ADMIN_PASSWORD || "chalcedony2026";
    const name = process.env.DEFAULT_ADMIN_NAME || "Chalcedony Administrator";
    await Admin.create({ email, password, name, role: "superadmin" });
  }

  return {
    trips: seedTrips.length,
    vehicles: seedVehicles.length,
    hotels: seedHotels.length,
    gallery: seedGallery.length,
    inquiries: seedInquiries.length,
  };
}
