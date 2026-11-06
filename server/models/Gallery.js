import mongoose from "mongoose";

const GallerySchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      sparse: true,
    },
    title: {
      type: String,
      required: [true, "Media title is required"],
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Safaris & Wildlife",
        "Waterfalls & Rivers",
        "Mountain Hiking",
        "Road Trips & Fleet",
        "Camp & Group Life",
        "Stays & Resorts",
      ],
      default: "Safaris & Wildlife",
    },
    location: {
      type: String,
      default: "Kenya",
    },
    mediaType: {
      type: String,
      enum: ["image", "video"],
      default: "image",
    },
    url: {
      type: String,
      required: [true, "Media URL is required"],
    },
    caption: {
      type: String,
      default: "",
    },
    date: {
      type: String,
      default: () => new Date().toLocaleString("en-GB", { month: "long", year: "numeric" }),
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

export const Gallery = mongoose.model("Gallery", GallerySchema);
