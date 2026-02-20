import { Router, Request, Response } from "express";
import * as authService from "./auth.service";
import { authenticate } from "./auth.middleware";
import { asyncHandler, sendSuccess, sendCreated } from "../../core/utils";
import { BadRequestError } from "../../core/errors";
import { AuthenticatedRequest } from "../../core/interfaces";

const router = Router();

// ── POST /auth/register ──────────────────────────────
router.post(
  "/register",
  asyncHandler(async (req: Request, res: Response) => {
    const { email, name, password } = req.body;

    if (!email || !password) {
      throw new BadRequestError("Email and password are required");
    }

    if (password.length < 8) {
      throw new BadRequestError("Password must be at least 8 characters");
    }

    const result = await authService.register({ email, name, password });
    return sendCreated(res, result);
  })
);

// ── POST /auth/login ─────────────────────────────────
router.post(
  "/login",
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new BadRequestError("Email and password are required");
    }

    const result = await authService.login({ email, password });
    return sendSuccess(res, result);
  })
);

// ── POST /auth/refresh ───────────────────────────────
router.post(
  "/refresh",
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new BadRequestError("Refresh token is required");
    }

    const result = await authService.refreshAccessToken(refreshToken);
    return sendSuccess(res, result);
  })
);

// ── GET /auth/profile ────────────────────────────────
router.get(
  "/profile",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as AuthenticatedRequest).user;
    const profile = await authService.getProfile(userId);
    return sendSuccess(res, profile);
  })
);

export const authController = router;
