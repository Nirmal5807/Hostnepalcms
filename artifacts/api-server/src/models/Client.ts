import mongoose, { Schema, Document } from "mongoose";

export interface IClient extends Document {
  fullName: string;
  email: string;
  discordUsername?: string;
  discordId?: string;
  serviceType: "Minecraft Hosting" | "VPS Hosting";
  planName: string;
  serverId: string;
  purchaseDate: Date;
  renewalDate: Date;
  paymentStatus: "Paid" | "Pending" | "Overdue";
  monthlyPrice: number;
  notes?: string;
  status: "Active" | "Suspended" | "Expired";
}

const ClientSchema = new Schema<IClient>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    discordUsername: { type: String, trim: true },
    discordId: { type: String, trim: true },
    serviceType: {
      type: String,
      required: true,
      enum: ["Minecraft Hosting", "VPS Hosting"],
    },
    planName: { type: String, required: true, trim: true },
    serverId: { type: String, required: true, trim: true },
    purchaseDate: { type: Date, required: true },
    renewalDate: { type: Date, required: true },
    paymentStatus: {
      type: String,
      required: true,
      enum: ["Paid", "Pending", "Overdue"],
      default: "Pending",
    },
    monthlyPrice: { type: Number, required: true, min: 0 },
    notes: { type: String },
    status: {
      type: String,
      required: true,
      enum: ["Active", "Suspended", "Expired"],
      default: "Active",
    },
  },
  { timestamps: true }
);

ClientSchema.index({ email: 1 });
ClientSchema.index({ renewalDate: 1 });
ClientSchema.index({ status: 1 });
ClientSchema.index({ paymentStatus: 1 });

export const Client = mongoose.model<IClient>("Client", ClientSchema);
