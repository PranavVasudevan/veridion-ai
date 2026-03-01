import { Router, Request, Response } from "express";
import { authMiddleware } from "../../core/middleware/auth.middleware";
import { asyncHandler, sendSuccess } from "../../core/utils/index";
import { monteCarloService } from "./montecarlo.service";

const router = Router();

// All montecarlo routes require authentication
router.use(authMiddleware as any);

/**
 * POST /montecarlo/:userId/:goalId
 * 
 * Runs a Monte Carlo simulation for a specific user and goal.
 */
router.post(
    "/:userId/:goalId",
    asyncHandler(async (req: Request, res: Response) => {
        const userId = parseInt(req.params.userId as string);
        const goalId = parseInt(req.params.goalId as string);

        const result = await monteCarloService.runSimulation(userId, goalId);
        return sendSuccess(res, result);
    })
);

export const monteCarloController = router;
