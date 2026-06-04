import mongoose from "mongoose";
import { logger } from "./logger.js";

let connected = false;

export async function connectMongoDB(): Promise<void> {
  if (connected) return;

  const uri = process.env["MONGODB_URL"];
  if (!uri) {
    throw new Error(
      "MONGODB_URL must be set. Please provide a MongoDB connection string (e.g. from MongoDB Atlas)."
    );
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    connected = true;
    logger.info("Connected to MongoDB");
  } catch (err) {
    logger.error({ err }, "Failed to connect to MongoDB");
    throw err;
  }

  mongoose.connection.on("error", (err) => {
    logger.error({ err }, "MongoDB connection error");
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
    connected = false;
  });
}
