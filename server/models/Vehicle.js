import mongoose from "mongoose";

const VehicleSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
      required: [true, "Vehicle name is required"],
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Safari 4x4",
        "Tour Van",
        "Mini Bus",
        "Luxury Coach",
        "Executive 4x4 / VIP",
      ],
      default: "Safari 4x4",
    },
    capacity: {
      type: String,
      required: true, // e.g. "7–8 Passengers"
    },
    luggageCapacity: {
      type: String,
      default: "Standard Bags",
    },
    transmission: {
      type: String,
      enum: ["Automatic", "Manual", "Both Available"],
      default: "Manual",
    },
    dailyRateKES: {
      type: Number,
      required: [true, "Daily rate in KES is required"],
      min: 0,
    },
    driverIncluded: {
      type: Boolean,
      default: true,
    },
    fuelOption: {
      type: String,
      enum: ["Chauffeur + Fuel Packages", "Dry Hire Available", "Chauffeured Only"],
      default: "Chauffeur + Fuel Packages",
    },
    image: {
      type: String,
      required: true,
    },
    features: {
      type: [String],
      default: [],
    },
    available: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      default: "",
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

export const Vehicle = mongoose.model("Vehicle", VehicleSchema);
