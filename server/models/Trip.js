import mongoose from "mongoose";

const ItineraryDaySchema = new mongoose.Schema(
  {
    day: { type: String, required: true },
    title: { type: String, required: true },
    desc: { type: String, required: true },
  },
  { _id: false }
);

const TripSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      sparse: true,
    },
    title: {
      type: String,
      required: [true, "Trip title is required"],
      trim: true,
    },
    subtitle: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Safari",
        "Day trip",
        "Hiking",
        "Waterfalls",
        "Road trip",
        "Family package",
        "Custom package",
      ],
      default: "Safari",
    },
    duration: {
      type: String,
      required: true, // e.g. "3 days · 2 nights"
    },
    date: {
      type: String,
      default: "", // e.g. "18–20 Oct 2026"
    },
    priceKES: {
      type: Number,
      required: [true, "Price in KES is required"],
      min: 0,
    },
    priceUSD: {
      type: Number,
      min: 0,
      default: 0,
    },
    featuredImage: {
      type: String,
      required: true,
    },
    galleryImages: {
      type: [String],
      default: [],
    },
    tag: {
      type: String,
      default: "", // e.g. "Most loved", "Selling Fast"
    },
    location: {
      type: String,
      required: true,
    },
    spotsLeft: {
      type: Number,
      default: 10,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    overview: {
      type: String,
      default: "",
    },
    highlights: {
      type: [String],
      default: [],
    },
    itinerary: {
      type: [ItineraryDaySchema],
      default: [],
    },
    included: {
      type: [String],
      default: [],
    },
    excluded: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret.customId || ret._id.toString();
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret.customId || ret._id.toString();
        return ret;
      },
    },
  }
);

// Search index
TripSchema.index({ title: "text", overview: "text", location: "text" });

export const Trip = mongoose.model("Trip", TripSchema);
