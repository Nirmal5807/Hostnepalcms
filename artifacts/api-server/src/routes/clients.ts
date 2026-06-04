import { Router, Response } from "express";
import { Client } from "../models/Client.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/stats/dashboard", async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalClients,
      activeServices,
      expiredServices,
      suspendedServices,
      pendingPayments,
      overduePayments,
      serviceTypeBreakdown,
      activeClients,
    ] = await Promise.all([
      Client.countDocuments(),
      Client.countDocuments({ status: "Active" }),
      Client.countDocuments({ status: "Expired" }),
      Client.countDocuments({ status: "Suspended" }),
      Client.countDocuments({ paymentStatus: "Pending" }),
      Client.countDocuments({ paymentStatus: "Overdue" }),
      Client.aggregate([
        { $group: { _id: "$serviceType", count: { $sum: 1 } } },
        { $project: { serviceType: "$_id", count: 1, _id: 0 } },
      ]),
      Client.find({ status: "Active" }).select("monthlyPrice"),
    ]);

    const monthlyRevenue = activeClients.reduce((sum, c) => sum + (c.monthlyPrice || 0), 0);
    const annualRevenue = monthlyRevenue * 12;

    res.json({
      totalClients,
      activeServices,
      expiredServices,
      suspendedServices,
      pendingPayments,
      overduePayments,
      monthlyRevenue,
      annualRevenue,
      serviceTypeBreakdown,
    });
  } catch (err) {
    req.log.error({ err }, "Dashboard stats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats/renewals", async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const clients = await Client.find({
      status: "Active",
      renewalDate: { $gte: now, $lte: in7Days },
    }).sort({ renewalDate: 1 });

    const reminders = clients.map((client) => {
      const msUntil = client.renewalDate.getTime() - now.getTime();
      const daysUntilRenewal = Math.ceil(msUntil / (1000 * 60 * 60 * 24));
      let urgency: "critical" | "warning" | "notice" = "notice";
      if (daysUntilRenewal <= 1) urgency = "critical";
      else if (daysUntilRenewal <= 3) urgency = "warning";

      return {
        client: formatClient(client),
        daysUntilRenewal,
        urgency,
      };
    });

    res.json({ reminders, total: reminders.length });
  } catch (err) {
    req.log.error({ err }, "Renewal reminders error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats/revenue-chart", async (req: AuthRequest, res: Response) => {
  try {
    const months: { month: string; revenue: number; clients: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const monthStr = d.toLocaleString("default", { month: "short", year: "2-digit" });

      const activeInMonth = await Client.find({
        status: "Active",
        purchaseDate: { $lte: monthEnd },
        $or: [{ renewalDate: { $gte: d } }, { status: "Active" }],
      }).select("monthlyPrice");

      const revenue = activeInMonth.reduce((sum, c) => sum + (c.monthlyPrice || 0), 0);
      months.push({ month: monthStr, revenue, clients: activeInMonth.length });
    }

    res.json({ monthly: months });
  } catch (err) {
    req.log.error({ err }, "Revenue chart error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const {
      search,
      serviceType,
      status,
      paymentStatus,
      sortBy = "renewalDate",
      sortOrder = "asc",
      page = "1",
      limit = "20",
    } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = {};

    if (search) {
      filter["$or"] = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { discordUsername: { $regex: search, $options: "i" } },
        { serverId: { $regex: search, $options: "i" } },
        { planName: { $regex: search, $options: "i" } },
      ];
    }

    if (serviceType && serviceType !== "all") filter["serviceType"] = serviceType;
    if (status && status !== "all") filter["status"] = status;
    if (paymentStatus && paymentStatus !== "all") filter["paymentStatus"] = paymentStatus;

    const allowedSortFields: Record<string, string> = {
      renewalDate: "renewalDate",
      purchaseDate: "purchaseDate",
      fullName: "fullName",
      monthlyPrice: "monthlyPrice",
    };
    const sortField = allowedSortFields[sortBy] || "renewalDate";
    const sortDir = sortOrder === "desc" ? -1 : 1;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [clients, total] = await Promise.all([
      Client.find(filter).sort({ [sortField]: sortDir }).skip(skip).limit(limitNum),
      Client.countDocuments(filter),
    ]);

    res.json({
      clients: clients.map(formatClient),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    req.log.error({ err }, "List clients error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;
    const client = new Client({
      ...body,
      purchaseDate: new Date(body.purchaseDate),
      renewalDate: new Date(body.renewalDate),
    });
    await client.save();
    res.status(201).json(formatClient(client));
  } catch (err) {
    req.log.error({ err }, "Create client error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const client = await Client.findById(req.params["id"]);
    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }
    res.json(formatClient(client));
  } catch (err) {
    req.log.error({ err }, "Get client error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;
    if (body.purchaseDate) body.purchaseDate = new Date(body.purchaseDate);
    if (body.renewalDate) body.renewalDate = new Date(body.renewalDate);

    const client = await Client.findByIdAndUpdate(
      req.params["id"],
      { $set: body },
      { new: true, runValidators: true }
    );
    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }
    res.json(formatClient(client));
  } catch (err) {
    req.log.error({ err }, "Update client error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const client = await Client.findByIdAndDelete(req.params["id"]);
    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }
    res.json({ success: true, message: "Client deleted successfully" });
  } catch (err) {
    req.log.error({ err }, "Delete client error");
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatClient(client: InstanceType<typeof Client>) {
  return {
    id: client._id.toString(),
    fullName: client.fullName,
    email: client.email,
    discordUsername: client.discordUsername || null,
    discordId: client.discordId || null,
    serviceType: client.serviceType,
    planName: client.planName,
    serverId: client.serverId,
    purchaseDate: client.purchaseDate.toISOString(),
    renewalDate: client.renewalDate.toISOString(),
    paymentStatus: client.paymentStatus,
    monthlyPrice: client.monthlyPrice,
    notes: client.notes || null,
    status: client.status,
    createdAt: (client as unknown as { createdAt: Date }).createdAt?.toISOString(),
    updatedAt: (client as unknown as { updatedAt: Date }).updatedAt?.toISOString(),
  };
}

export default router;
