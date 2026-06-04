import mongoose from "mongoose";
import { User } from "./models/User.js";
import { Client } from "./models/Client.js";
import { Ticket } from "./models/Ticket.js";
import { logger } from "./lib/logger.js";

const MONGODB_URL = process.env["MONGODB_URL"];
if (!MONGODB_URL) {
  logger.error("MONGODB_URL is required");
  process.exit(1);
}

async function seed() {
  await mongoose.connect(MONGODB_URL!);
  logger.info("Connected to MongoDB for seeding");

  const existingAdmin = await User.findOne({ username: "admin" });
  if (!existingAdmin) {
    await User.create({ username: "admin", password: "HostNepal@2025", role: "admin" });
    logger.info("Created admin user: admin / HostNepal@2025");
  } else {
    logger.info("Admin user already exists");
  }

  const clientCount = await Client.countDocuments();
  if (clientCount === 0) {
    const now = new Date();
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const ago30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const clients = await Client.create([
      {
        fullName: "Aarav Sharma",
        email: "aarav@example.com",
        discordUsername: "aarav#1234",
        discordId: "123456789012345678",
        serviceType: "Minecraft Hosting",
        planName: "Creeper Plan",
        serverId: "MC-001",
        purchaseDate: ago30Days,
        renewalDate: in7Days,
        paymentStatus: "Pending",
        monthlyPrice: 500,
        status: "Active",
        notes: "Premium customer, prefers fast response",
      },
      {
        fullName: "Priya Adhikari",
        email: "priya@example.com",
        discordUsername: "priya_gamer#5678",
        discordId: "987654321098765432",
        serviceType: "VPS Hosting",
        planName: "VPS Pro 4GB",
        serverId: "VPS-002",
        purchaseDate: ago30Days,
        renewalDate: in30Days,
        paymentStatus: "Paid",
        monthlyPrice: 1200,
        status: "Active",
      },
      {
        fullName: "Rohan Thapa",
        email: "rohan@example.com",
        discordUsername: "rohan_dev#9012",
        discordId: "111222333444555666",
        serviceType: "Minecraft Hosting",
        planName: "Diamond Plan",
        serverId: "MC-003",
        purchaseDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        renewalDate: in3Days,
        paymentStatus: "Overdue",
        monthlyPrice: 750,
        status: "Active",
        notes: "Payment overdue, follow up needed",
      },
      {
        fullName: "Sita Karki",
        email: "sita@example.com",
        discordUsername: "sita_k#3456",
        discordId: "222333444555666777",
        serviceType: "VPS Hosting",
        planName: "VPS Basic 2GB",
        serverId: "VPS-004",
        purchaseDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        renewalDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        paymentStatus: "Pending",
        monthlyPrice: 800,
        status: "Expired",
        notes: "Renewal discussion pending",
      },
      {
        fullName: "Bikash Magar",
        email: "bikash@example.com",
        discordUsername: "bikash_mc#7890",
        discordId: "333444555666777888",
        serviceType: "Minecraft Hosting",
        planName: "Enderman Plan",
        serverId: "MC-005",
        purchaseDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        renewalDate: in60Days,
        paymentStatus: "Paid",
        monthlyPrice: 600,
        status: "Active",
      },
    ]);

    const ticketCount = await Ticket.countDocuments();
    if (ticketCount === 0 && clients.length > 0) {
      await Ticket.create([
        {
          ticketId: "TKT-00001",
          clientId: clients[0]!._id,
          subject: "Server lag during peak hours",
          status: "Open",
          notes: "Customer reported 200ms+ ping during weekends",
        },
        {
          ticketId: "TKT-00002",
          clientId: clients[1]!._id,
          subject: "Need help with SSH key setup",
          status: "Resolved",
          notes: "Guided customer through SSH configuration. Issue resolved.",
        },
        {
          ticketId: "TKT-00003",
          clientId: clients[2]!._id,
          subject: "Payment not reflecting",
          status: "In Progress",
          notes: "Customer sent payment via eSewa. Verifying transaction ID.",
        },
      ]);
      logger.info("Sample tickets created");
    }

    logger.info(`${clients.length} sample clients created`);
  } else {
    logger.info(`${clientCount} clients already exist, skipping sample data`);
  }

  await mongoose.disconnect();
  logger.info("Seeding complete");
}

seed().catch((err) => {
  logger.error({ err }, "Seed failed");
  process.exit(1);
});
