import { Router, Request, Response } from "express";
import { authenticate } from "../auth/auth.middleware";
import { asyncHandler, sendSuccess } from "../../core/utils/index";
import { monteCarloService } from "./montecarlo.service";

const router = Router();

// All montecarlo routes require authentication
router.use(authenticate);

/**
 * POST /montecarlo/:userId/:goalId
 * 
 * Runs a Monte Carlo simulation for a specific user and goal.
 */
router.post(
    "/:userId/:goalId",
    asyncHandler(async (req: Request, res: Response) => {
        const userId = parseInt(req.params.userId);
        const goalId = parseInt(req.params.goalId);

        const result = await monteCarloService.runSimulation(userId, goalId);
        return sendSuccess(res, result);
    })
);

export const monteCarloController = router;
