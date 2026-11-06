import mongoose from "mongoose";

const HotelSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
      required: [true, "Hotel/Stay name is required"],
      trim: true,
    },
    location: {
      type: String,
      required: true,
    },
    region: {
      type: String,
      required: true,
      enum: [
        "Maasai Mara",
        "Coast & Diani",
        "Amboseli & Tsavo",
        "Rift Valley & Lakes",
        "Mount Kenya & Aberdares",
        "Nairobi",
      ],
      default: "Maasai Mara",
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Safari Lodge",
        "Luxury Tented Camp",
        "Beach Resort",
        "Lakeside Cottage",
        "Mountain Retreat",
        "Boutique City Hotel",
      ],
      default: "Safari Lodge",
    },
    pricePerNightKES: {
      type: Number,
      required: [true, "Price per night is required"],
      min: 0,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 4.8,
    },
    image: {
      type: String,
      required: true,
    },
    amenities: {
      type: [String],
      default: [],
    },
    featured: {
      type: Boolean,
      default: false,
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

export const Hotel = mongoose.model("Hotel", HotelSchema);
