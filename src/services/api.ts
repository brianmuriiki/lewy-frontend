import { BookingInquiry, GalleryMedia, HotelStay, Trip, Vehicle } from "../types";

const API_BASE =
  (import.meta as any).env?.VITE_API_URL ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
    ? "/api"
    : "http://localhost:5000/api");

export interface MongoAdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface MongoImageUploadResult {
  success: boolean;
  id?: string;
  url: string;
  filename?: string;
  size?: number;
}

export interface DashboardStats {
  trips: number;
  vehicles: number;
  hotels: number;
  gallery: number;
  inquiries: {
    total: number;
    pending: number;
    confirmed: number;
    contacted: number;
  };
  uploadedImages: number;
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("chalcedony_jwt_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const MongoApi = {
  baseUrl: API_BASE,

  // Check if backend MongoDB server is alive
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2500) });
      const data = await res.json();
      return data.status === "ok";
    } catch {
      return false;
    }
  },

  // -------------------------------------------------------------
  // AUTHENTICATION
  // -------------------------------------------------------------
  async login(emailOrUsername: string, password: string): Promise<{
    success: boolean;
    token?: string;
    admin?: MongoAdminUser;
    message?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailOrUsername, password }),
        signal: AbortSignal.timeout(6000),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("chalcedony_jwt_token", data.token);
        localStorage.setItem("chalcedony_admin_user", JSON.stringify(data.admin));
        localStorage.setItem("chalcedony_admin_auth", "true");
        window.dispatchEvent(new Event("chalcedony_data_change"));
        return { success: true, token: data.token, admin: data.admin };
      }

      return {
        success: false,
        message: data.message || "Invalid credentials",
      };
    } catch {
      // If server is not reachable, fall back to local credentials
      console.warn("MongoDB backend server not reachable, checking local authentication fallback.");
      const isDefault =
        (emailOrUsername === "admin" || emailOrUsername === "admin@chalcedony.com") &&
        password === "chalcedony2026";

      if (isDefault) {
        localStorage.setItem("chalcedony_admin_auth", "true");
        window.dispatchEvent(new Event("chalcedony_data_change"));
        return {
          success: true,
          admin: {
            id: "local-admin",
            email: "admin@chalcedony.com",
            name: "Administrator (Local Mode)",
            role: "superadmin",
          },
        };
      }

      return {
        success: false,
        message: "Could not connect to MongoDB server and credentials do not match default fallback.",
      };
    }
  },

  async verifyToken(): Promise<boolean> {
    const token = localStorage.getItem("chalcedony_jwt_token");
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async changePassword(newPassword: string, currentPassword?: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ newPassword, currentPassword }),
      });
      const data = await res.json();
      return { success: res.ok, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to update password" };
    }
  },

  // -------------------------------------------------------------
  // TRIPS API
  // -------------------------------------------------------------
  async getTrips(query?: { category?: string; featured?: boolean; search?: string }): Promise<Trip[] | null> {
    try {
      const params = new URLSearchParams();
      if (query?.category) params.append("category", query.category);
      if (query?.featured !== undefined) params.append("featured", String(query.featured));
      if (query?.search) params.append("search", query.search);

      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`${API_BASE}/trips${qs}`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  async saveTrip(trip: Trip): Promise<Trip | null> {
    try {
      const res = await fetch(`${API_BASE}/trips/${trip.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(trip),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  async deleteTrip(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/trips/${id}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // -------------------------------------------------------------
  // FLEET / VEHICLES API
  // -------------------------------------------------------------
  async getVehicles(query?: { category?: string; available?: boolean }): Promise<Vehicle[] | null> {
    try {
      const params = new URLSearchParams();
      if (query?.category) params.append("category", query.category);
      if (query?.available !== undefined) params.append("available", String(query.available));

      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`${API_BASE}/vehicles${qs}`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  async saveVehicle(vehicle: Vehicle): Promise<Vehicle | null> {
    try {
      const res = await fetch(`${API_BASE}/vehicles/${vehicle.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(vehicle),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  async deleteVehicle(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/vehicles/${id}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // -------------------------------------------------------------
  // HOTELS & STAYS API
  // -------------------------------------------------------------
  async getHotels(query?: { region?: string; category?: string; featured?: boolean }): Promise<HotelStay[] | null> {
    try {
      const params = new URLSearchParams();
      if (query?.region) params.append("region", query.region);
      if (query?.category) params.append("category", query.category);
      if (query?.featured !== undefined) params.append("featured", String(query.featured));

      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`${API_BASE}/hotels${qs}`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  async saveHotel(hotel: HotelStay): Promise<HotelStay | null> {
    try {
      const res = await fetch(`${API_BASE}/hotels/${hotel.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(hotel),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  async deleteHotel(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/hotels/${id}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // -------------------------------------------------------------
  // GALLERY API
  // -------------------------------------------------------------
  async getGallery(query?: { category?: string; mediaType?: string }): Promise<GalleryMedia[] | null> {
    try {
      const params = new URLSearchParams();
      if (query?.category) params.append("category", query.category);
      if (query?.mediaType) params.append("mediaType", query.mediaType);

      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`${API_BASE}/gallery${qs}`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  async saveMedia(item: GalleryMedia): Promise<GalleryMedia | null> {
    try {
      const res = await fetch(`${API_BASE}/gallery/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(item),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  async deleteMedia(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/gallery/${id}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // -------------------------------------------------------------
  // INQUIRIES API
  // -------------------------------------------------------------
  async getInquiries(query?: { status?: string; serviceType?: string }): Promise<BookingInquiry[] | null> {
    try {
      const params = new URLSearchParams();
      if (query?.status) params.append("status", query.status);
      if (query?.serviceType) params.append("serviceType", query.serviceType);

      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`${API_BASE}/inquiries${qs}`, {
        headers: getAuthHeader(),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  async createInquiry(
    inquiryData: Omit<BookingInquiry, "id" | "referenceCode" | "createdAt" | "status">
  ): Promise<BookingInquiry | null> {
    try {
      const res = await fetch(`${API_BASE}/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inquiryData),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  async updateInquiryStatus(
    id: string,
    status: BookingInquiry["status"],
    adminNotes?: string
  ): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/inquiries/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ status, adminNotes }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteInquiry(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/inquiries/${id}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // -------------------------------------------------------------
  // STATS & SEED
  // -------------------------------------------------------------
  async getStats(): Promise<DashboardStats | null> {
    try {
      const res = await fetch(`${API_BASE}/stats`, {
        headers: getAuthHeader(),
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.stats || null;
    } catch {
      return null;
    }
  },

  async resetDatabase(): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/seed/reset`, {
        method: "POST",
        headers: getAuthHeader(),
      });
      const data = await res.json();
      return { success: res.ok, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  // -------------------------------------------------------------
  // IMAGE STORAGE API
  // -------------------------------------------------------------
  async uploadImage(
    file: File,
    category: string = "general",
    caption: string = ""
  ): Promise<MongoImageUploadResult> {
    const token = localStorage.getItem("chalcedony_jwt_token");
    const formData = new FormData();
    formData.append("image", file);
    formData.append("category", category);
    formData.append("caption", caption);

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        signal: AbortSignal.timeout(15000),
      });

      const data = await res.json();

      if (res.ok && data.url) {
        return {
          success: true,
          id: data.id,
          url: data.url,
          filename: data.filename,
          size: data.size,
        };
      }

      throw new Error(data.message || "Upload failed");
    } catch (err: any) {
      console.warn("MongoDB upload server unavailable. Converting to Base64 image URL as local fallback.", err);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            success: true,
            url: reader.result as string,
            filename: file.name,
            size: file.size,
          });
        };
        reader.readAsDataURL(file);
      });
    }
  },

  getStoredAdmin(): MongoAdminUser | null {
    try {
      const data = localStorage.getItem("chalcedony_admin_user");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.removeItem("chalcedony_jwt_token");
    localStorage.removeItem("chalcedony_admin_user");
    localStorage.removeItem("chalcedony_admin_auth");
    window.dispatchEvent(new Event("chalcedony_data_change"));
  },
};
