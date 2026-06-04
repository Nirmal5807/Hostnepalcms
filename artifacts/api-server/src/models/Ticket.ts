import mongoose, { Schema, Document } from "mongoose";

export interface ITicket extends Document {
  ticketId: string;
  clientId: mongoose.Types.ObjectId;
  subject: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  notes?: string;
}

const TicketSchema = new Schema<ITicket>(
  {
    ticketId: { type: String, required: true, unique: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    subject: { type: String, required: true, trim: true },
    status: {
      type: String,
      required: true,
      enum: ["Open", "In Progress", "Resolved", "Closed"],
      default: "Open",
    },
    notes: { type: String },
  },
  { timestamps: true }
);

TicketSchema.index({ clientId: 1 });
TicketSchema.index({ status: 1 });

export const Ticket = mongoose.model<ITicket>("Ticket", TicketSchema);
