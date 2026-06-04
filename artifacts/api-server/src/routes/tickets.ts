import { Router, Response } from "express";
import { Ticket } from "../models/Ticket.js";
import { Client } from "../models/Client.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

function generateTicketId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TKT-${ts}-${rand}`;
}

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { clientId, status, page = "1", limit = "20" } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = {};
    if (clientId) filter["clientId"] = clientId;
    if (status && status !== "all") filter["status"] = status;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate("clientId", "fullName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Ticket.countDocuments(filter),
    ]);

    res.json({
      tickets: tickets.map((t) => formatTicket(t)),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    req.log.error({ err }, "List tickets error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { clientId, subject, status, notes } = req.body as {
      clientId: string;
      subject: string;
      status: string;
      notes?: string;
    };

    const client = await Client.findById(clientId).select("fullName");
    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    const ticket = new Ticket({
      ticketId: generateTicketId(),
      clientId,
      subject,
      status: status || "Open",
      notes,
    });
    await ticket.save();

    res.status(201).json({
      id: ticket._id.toString(),
      ticketId: ticket.ticketId,
      clientId: clientId,
      clientName: client.fullName,
      subject: ticket.subject,
      status: ticket.status,
      notes: ticket.notes || null,
      createdAt: (ticket as unknown as { createdAt: Date }).createdAt?.toISOString(),
      updatedAt: (ticket as unknown as { updatedAt: Date }).updatedAt?.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Create ticket error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { subject, status, notes } = req.body as {
      subject?: string;
      status?: string;
      notes?: string;
    };

    const ticket = await Ticket.findByIdAndUpdate(
      req.params["id"],
      { $set: { subject, status, notes } },
      { new: true, runValidators: true }
    ).populate("clientId", "fullName");

    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    res.json(formatTicket(ticket));
  } catch (err) {
    req.log.error({ err }, "Update ticket error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params["id"]);
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }
    res.json({ success: true, message: "Ticket deleted successfully" });
  } catch (err) {
    req.log.error({ err }, "Delete ticket error");
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatTicket(ticket: InstanceType<typeof Ticket> & { clientId?: { fullName?: string } | string }) {
  const populatedClient = ticket.clientId as { _id?: unknown; fullName?: string } | null;
  const clientName = populatedClient && typeof populatedClient === "object" && "fullName" in populatedClient
    ? populatedClient.fullName || null
    : null;

  return {
    id: ticket._id.toString(),
    ticketId: ticket.ticketId,
    clientId: typeof ticket.clientId === "object" && "_id" in (ticket.clientId as object)
      ? (ticket.clientId as { _id: unknown })._id?.toString() || ""
      : ticket.clientId?.toString() || "",
    clientName,
    subject: ticket.subject,
    status: ticket.status,
    notes: ticket.notes || null,
    createdAt: (ticket as unknown as { createdAt: Date }).createdAt?.toISOString(),
    updatedAt: (ticket as unknown as { updatedAt: Date }).updatedAt?.toISOString(),
  };
}

export default router;
