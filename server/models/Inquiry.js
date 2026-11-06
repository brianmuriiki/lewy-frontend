import mongoose from "mongoose";

const InquirySchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      sparse: true,
    },
    referenceCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      trim: true,
      lowercase: true,
    },
    serviceType: {
      type: String,
      required: true,
      enum: [
        "Upcoming group trip",
        "Custom safari",
        "Car or bus hire",
        "Hotel & accommodation",
        "Family package",
        "Corporate or school trip",
        "General enquiry",
      ],
      default: "Upcoming group trip",
    },
    targetItemTitle: {
      type: String,
      default: "",
    },
    preferredDate: {
      type: String,
      default: "",
    },
    numberOfTravelers: {
      type: Number,
      default: 1,
      min: 1,
    },
    destinationOrNotes: {
      type: String,
      default: "",
    },
    budgetRange: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Pending", "Contacted", "Confirmed", "Archived"],
      default: "Pending",
    },
    adminNotes: {
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
        ret.createdAt = doc.createdAt ? new Date(doc.createdAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "";
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret.customId || ret._id.toString();
        ret.createdAt = doc.createdAt ? new Date(doc.createdAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "";
        return ret;
      },
    },
  }
);

export const Inquiry = mongoose.model("Inquiry", InquirySchema);
