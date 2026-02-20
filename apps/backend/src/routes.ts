import { Router } from "express";
import { authController } from "./modules/auth/auth.controller";
import { portfolioController } from "./modules/portfolio/portfolio.controller";

const router = Router();

router.use("/auth", authController);
router.use("/portfolio", portfolioController);

// Health check (no auth)
router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
