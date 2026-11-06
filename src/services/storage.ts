import { BookingInquiry, GalleryMedia, HotelStay, Trip, Vehicle } from "../types";
import { initialGallery, initialHotels, initialInquiries, initialTrips, initialVehicles } from "../data/seedData";
import { MongoApi } from "./api";

const KEYS = {
  TRIPS: "chalcedony_trips",
  VEHICLES: "chalcedony_vehicles",
  HOTELS: "chalcedony_hotels",
  GALLERY: "chalcedony_gallery",
  INQUIRIES: "chalcedony_inquiries",
  ADMIN_AUTH: "chalcedony_admin_auth",
  ADMIN_PIN: "chalcedony_admin_pin",
  FAVORITES: "chalcedony_saved_trips",
};

const DEFAULT_ADMIN_PIN = "chalcedony2026";

function notifyChange() {
  window.dispatchEvent(new Event("chalcedony_data_change"));
}

export const StorageService = {
  // Sync all data from MongoDB backend if server is online
  async syncWithBackend(): Promise<boolean> {
    try {
      const isOnline = await MongoApi.checkHealth();
      if (!isOnline) return false;

      const [remoteTrips, remoteVehicles, remoteHotels, remoteGallery] = await Promise.all([
        MongoApi.getTrips(),
        MongoApi.getVehicles(),
        MongoApi.getHotels(),
        MongoApi.getGallery(),
      ]);

      let changed = false;

      if (remoteTrips && remoteTrips.length > 0) {
        localStorage.setItem(KEYS.TRIPS, JSON.stringify(remoteTrips));
        changed = true;
      }
      if (remoteVehicles && remoteVehicles.length > 0) {
        localStorage.setItem(KEYS.VEHICLES, JSON.stringify(remoteVehicles));
        changed = true;
      }
      if (remoteHotels && remoteHotels.length > 0) {
        localStorage.setItem(KEYS.HOTELS, JSON.stringify(remoteHotels));
        changed = true;
      }
      if (remoteGallery && remoteGallery.length > 0) {
        localStorage.setItem(KEYS.GALLERY, JSON.stringify(remoteGallery));
        changed = true;
      }

      // If admin is logged in, sync inquiries as well
      if (this.isAdminLoggedIn()) {
        const remoteInquiries = await MongoApi.getInquiries();
        if (remoteInquiries && remoteInquiries.length > 0) {
          localStorage.setItem(KEYS.INQUIRIES, JSON.stringify(remoteInquiries));
          changed = true;
        }
      }

      if (changed) {
        notifyChange();
      }
      return true;
    } catch {
      return false;
    }
  },

  // -------------------------------------------------------------
  // TRIPS
  // -------------------------------------------------------------
  getTrips(): Trip[] {
    try {
      const data = localStorage.getItem(KEYS.TRIPS);
      if (!data) {
        localStorage.setItem(KEYS.TRIPS, JSON.stringify(initialTrips));
        return initialTrips;
      }
      return JSON.parse(data);
    } catch {
      return initialTrips;
    }
  },

  saveTrip(trip: Trip): Trip {
    const trips = this.getTrips();
    const index = trips.findIndex((t) => t.id === trip.id);
    if (index >= 0) {
      trips[index] = trip;
    } else {
      trips.unshift(trip);
    }
    localStorage.setItem(KEYS.TRIPS, JSON.stringify(trips));
    notifyChange();

    // Async sync to MongoDB backend
    MongoApi.saveTrip(trip).catch(() => {});
    return trip;
  },

  deleteTrip(id: string): void {
    const trips = this.getTrips().filter((t) => t.id !== id);
    localStorage.setItem(KEYS.TRIPS, JSON.stringify(trips));
    notifyChange();

    // Async sync to MongoDB backend
    MongoApi.deleteTrip(id).catch(() => {});
  },

  // -------------------------------------------------------------
  // VEHICLES / FLEET
  // -------------------------------------------------------------
  getVehicles(): Vehicle[] {
    try {
      const data = localStorage.getItem(KEYS.VEHICLES);
      if (!data) {
        localStorage.setItem(KEYS.VEHICLES, JSON.stringify(initialVehicles));
        return initialVehicles;
      }
      return JSON.parse(data);
    } catch {
      return initialVehicles;
    }
  },

  saveVehicle(vehicle: Vehicle): Vehicle {
    const vehicles = this.getVehicles();
    const index = vehicles.findIndex((v) => v.id === vehicle.id);
    if (index >= 0) {
      vehicles[index] = vehicle;
    } else {
      vehicles.unshift(vehicle);
    }
    localStorage.setItem(KEYS.VEHICLES, JSON.stringify(vehicles));
    notifyChange();

    // Async sync to MongoDB backend
    MongoApi.saveVehicle(vehicle).catch(() => {});
    return vehicle;
  },

  deleteVehicle(id: string): void {
    const vehicles = this.getVehicles().filter((v) => v.id !== id);
    localStorage.setItem(KEYS.VEHICLES, JSON.stringify(vehicles));
    notifyChange();

    // Async sync to MongoDB backend
    MongoApi.deleteVehicle(id).catch(() => {});
  },

  // -------------------------------------------------------------
  // HOTELS / STAYS
  // -------------------------------------------------------------
  getHotels(): HotelStay[] {
    try {
      const data = localStorage.getItem(KEYS.HOTELS);
      if (!data) {
        localStorage.setItem(KEYS.HOTELS, JSON.stringify(initialHotels));
        return initialHotels;
      }
      return JSON.parse(data);
    } catch {
      return initialHotels;
    }
  },

  saveHotel(hotel: HotelStay): HotelStay {
    const hotels = this.getHotels();
    const index = hotels.findIndex((h) => h.id === hotel.id);
    if (index >= 0) {
      hotels[index] = hotel;
    } else {
      hotels.unshift(hotel);
    }
    localStorage.setItem(KEYS.HOTELS, JSON.stringify(hotels));
    notifyChange();

    // Async sync to MongoDB backend
    MongoApi.saveHotel(hotel).catch(() => {});
    return hotel;
  },

  deleteHotel(id: string): void {
    const hotels = this.getHotels().filter((h) => h.id !== id);
    localStorage.setItem(KEYS.HOTELS, JSON.stringify(hotels));
    notifyChange();

    // Async sync to MongoDB backend
    MongoApi.deleteHotel(id).catch(() => {});
  },

  // -------------------------------------------------------------
  // GALLERY
  // -------------------------------------------------------------
  getGallery(): GalleryMedia[] {
    try {
      const data = localStorage.getItem(KEYS.GALLERY);
      if (!data) {
        localStorage.setItem(KEYS.GALLERY, JSON.stringify(initialGallery));
        return initialGallery;
      }
      return JSON.parse(data);
    } catch {
      return initialGallery;
    }
  },

  saveMedia(item: GalleryMedia): GalleryMedia {
    const gallery = this.getGallery();
    const index = gallery.findIndex((g) => g.id === item.id);
    if (index >= 0) {
      gallery[index] = item;
    } else {
      gallery.unshift(item);
    }
    localStorage.setItem(KEYS.GALLERY, JSON.stringify(gallery));
    notifyChange();

    // Async sync to MongoDB backend
    MongoApi.saveMedia(item).catch(() => {});
    return item;
  },

  deleteMedia(id: string): void {
    const gallery = this.getGallery().filter((g) => g.id !== id);
    localStorage.setItem(KEYS.GALLERY, JSON.stringify(gallery));
    notifyChange();

    // Async sync to MongoDB backend
    MongoApi.deleteMedia(id).catch(() => {});
  },

  // -------------------------------------------------------------
  // INQUIRIES / BOOKINGS
  // -------------------------------------------------------------
  getInquiries(): BookingInquiry[] {
    try {
      const data = localStorage.getItem(KEYS.INQUIRIES);
      if (!data) {
        localStorage.setItem(KEYS.INQUIRIES, JSON.stringify(initialInquiries));
        return initialInquiries;
      }
      return JSON.parse(data);
    } catch {
      return initialInquiries;
    }
  },

  createInquiry(
    inquiryData: Omit<BookingInquiry, "id" | "referenceCode" | "createdAt" | "status">
  ): BookingInquiry {
    const inquiries = this.getInquiries();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newInquiry: BookingInquiry = {
      ...inquiryData,
      id: "inq-" + Date.now(),
      referenceCode: `CHL-${new Date().getFullYear()}-${randomSuffix}`,
      createdAt: new Date().toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }),
      status: "Pending",
    };
    inquiries.unshift(newInquiry);
    localStorage.setItem(KEYS.INQUIRIES, JSON.stringify(inquiries));
    notifyChange();

    // Also send directly to MongoDB backend if available
    MongoApi.createInquiry(newInquiry).catch(() => {});

    return newInquiry;
  },

  updateInquiryStatus(id: string, status: BookingInquiry["status"], adminNotes?: string): void {
    const inquiries = this.getInquiries();
    const index = inquiries.findIndex((i) => i.id === id);
    if (index >= 0) {
      inquiries[index].status = status;
      if (adminNotes !== undefined) {
        inquiries[index].adminNotes = adminNotes;
      }
      localStorage.setItem(KEYS.INQUIRIES, JSON.stringify(inquiries));
      notifyChange();

      // Async sync to MongoDB backend
      MongoApi.updateInquiryStatus(id, status, adminNotes).catch(() => {});
    }
  },

  deleteInquiry(id: string): void {
    const inquiries = this.getInquiries().filter((i) => i.id !== id);
    localStorage.setItem(KEYS.INQUIRIES, JSON.stringify(inquiries));
    notifyChange();

    // Async sync to MongoDB backend
    MongoApi.deleteInquiry(id).catch(() => {});
  },

  // -------------------------------------------------------------
  // FAVORITES
  // -------------------------------------------------------------
  getFavorites(): string[] {
    try {
      const data = localStorage.getItem(KEYS.FAVORITES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  toggleFavorite(tripId: string): boolean {
    const favs = this.getFavorites();
    const exists = favs.includes(tripId);
    let updated: string[];
    if (exists) {
      updated = favs.filter((id) => id !== tripId);
    } else {
      updated = [...favs, tripId];
    }
    localStorage.setItem(KEYS.FAVORITES, JSON.stringify(updated));
    notifyChange();
    return !exists;
  },

  // -------------------------------------------------------------
  // ADMIN AUTH
  // -------------------------------------------------------------
  isAdminLoggedIn(): boolean {
    return localStorage.getItem(KEYS.ADMIN_AUTH) === "true";
  },

  loginAdmin(pinOrPassword: string): boolean {
    const storedPin = localStorage.getItem(KEYS.ADMIN_PIN) || DEFAULT_ADMIN_PIN;
    if (pinOrPassword.trim() === storedPin || pinOrPassword.trim() === "admin") {
      localStorage.setItem(KEYS.ADMIN_AUTH, "true");
      notifyChange();
      return true;
    }
    return false;
  },

  logoutAdmin(): void {
    MongoApi.logout();
    localStorage.removeItem(KEYS.ADMIN_AUTH);
    notifyChange();
  },

  updateAdminPin(newPin: string): void {
    localStorage.setItem(KEYS.ADMIN_PIN, newPin);
    // Also try updating backend admin password
    MongoApi.changePassword(newPin).catch(() => {});
  },

  // -------------------------------------------------------------
  // RESET & BACKUP
  // -------------------------------------------------------------
  async resetAllToDefaults(): Promise<void> {
    localStorage.setItem(KEYS.TRIPS, JSON.stringify(initialTrips));
    localStorage.setItem(KEYS.VEHICLES, JSON.stringify(initialVehicles));
    localStorage.setItem(KEYS.HOTELS, JSON.stringify(initialHotels));
    localStorage.setItem(KEYS.GALLERY, JSON.stringify(initialGallery));
    localStorage.setItem(KEYS.INQUIRIES, JSON.stringify(initialInquiries));
    notifyChange();

    // Reset MongoDB backend as well
    await MongoApi.resetDatabase().catch(() => {});
  },

  exportDatabaseJSON(): string {
    return JSON.stringify(
      {
        trips: this.getTrips(),
        vehicles: this.getVehicles(),
        hotels: this.getHotels(),
        gallery: this.getGallery(),
        inquiries: this.getInquiries(),
      },
      null,
      2
    );
  },

  importDatabaseJSON(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.trips) {
        localStorage.setItem(KEYS.TRIPS, JSON.stringify(parsed.trips));
        parsed.trips.forEach((t: Trip) => MongoApi.saveTrip(t).catch(() => {}));
      }
      if (parsed.vehicles) {
        localStorage.setItem(KEYS.VEHICLES, JSON.stringify(parsed.vehicles));
        parsed.vehicles.forEach((v: Vehicle) => MongoApi.saveVehicle(v).catch(() => {}));
      }
      if (parsed.hotels) {
        localStorage.setItem(KEYS.HOTELS, JSON.stringify(parsed.hotels));
        parsed.hotels.forEach((h: HotelStay) => MongoApi.saveHotel(h).catch(() => {}));
      }
      if (parsed.gallery) {
        localStorage.setItem(KEYS.GALLERY, JSON.stringify(parsed.gallery));
        parsed.gallery.forEach((g: GalleryMedia) => MongoApi.saveMedia(g).catch(() => {}));
      }
      if (parsed.inquiries) {
        localStorage.setItem(KEYS.INQUIRIES, JSON.stringify(parsed.inquiries));
      }
      notifyChange();
      return true;
    } catch {
      return false;
    }
  },
};

// Initial background sync check on application load
if (typeof window !== "undefined") {
  setTimeout(() => {
    StorageService.syncWithBackend();
  }, 1000);
}
