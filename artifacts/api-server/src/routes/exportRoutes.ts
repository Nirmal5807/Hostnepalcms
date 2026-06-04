import { Router, Response } from "express";
import * as XLSX from "xlsx";
import { Client } from "../models/Client.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

function buildFilter(query: Record<string, string>) {
  const filter: Record<string, unknown> = {};
  const { status, serviceType, paymentStatus } = query;
  if (status && status !== "all") filter["status"] = status;
  if (serviceType && serviceType !== "all") filter["serviceType"] = serviceType;
  if (paymentStatus && paymentStatus !== "all") filter["paymentStatus"] = paymentStatus;
  return filter;
}

function clientToRow(client: InstanceType<typeof Client>) {
  return {
    "Full Name": client.fullName,
    Email: client.email,
    "Discord Username": client.discordUsername || "",
    "Discord ID": client.discordId || "",
    "Service Type": client.serviceType,
    "Plan Name": client.planName,
    "Server ID": client.serverId,
    "Purchase Date": client.purchaseDate.toISOString().split("T")[0],
    "Renewal Date": client.renewalDate.toISOString().split("T")[0],
    "Payment Status": client.paymentStatus,
    "Monthly Price (NPR)": client.monthlyPrice,
    Status: client.status,
    Notes: client.notes || "",
  };
}

router.get("/csv", async (req: AuthRequest, res: Response) => {
  try {
    const filter = buildFilter(req.query as Record<string, string>);
    const clients = await Client.find(filter).sort({ renewalDate: 1 });

    const rows = clients.map(clientToRow);
    const headers = Object.keys(rows[0] || clientToRow({
      fullName: "", email: "", discordUsername: "", discordId: "",
      serviceType: "VPS Hosting", planName: "", serverId: "",
      purchaseDate: new Date(), renewalDate: new Date(),
      paymentStatus: "Paid", monthlyPrice: 0, status: "Active", notes: "",
    } as InstanceType<typeof Client>));

    const csvLines = [
      headers.join(","),
      ...rows.map((row) =>
        headers.map((h) => {
          const val = String(row[h as keyof typeof row] || "");
          return val.includes(",") ? `"${val}"` : val;
        }).join(",")
      ),
    ];

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="hostnepal-clients-${Date.now()}.csv"`);
    res.send(csvLines.join("\n"));
  } catch (err) {
    req.log.error({ err }, "Export CSV error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/excel", async (req: AuthRequest, res: Response) => {
  try {
    const filter = buildFilter(req.query as Record<string, string>);
    const clients = await Client.find(filter).sort({ renewalDate: 1 });

    const rows = clients.map(clientToRow);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    const colWidths = [
      { wch: 20 }, { wch: 25 }, { wch: 18 }, { wch: 18 },
      { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 14 },
      { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 12 }, { wch: 30 },
    ];
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Clients");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="hostnepal-clients-${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (err) {
    req.log.error({ err }, "Export Excel error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
