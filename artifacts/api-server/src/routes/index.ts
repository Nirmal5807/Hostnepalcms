import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import clientsRouter from "./clients.js";
import ticketsRouter from "./tickets.js";
import revenueRouter from "./revenue.js";
import exportRouter from "./exportRoutes.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/clients", clientsRouter);
router.use("/tickets", ticketsRouter);
router.use("/revenue", revenueRouter);
router.use("/export", exportRouter);

export default router;
