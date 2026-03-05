import { Router, Request, Response } from "express";
import { authMiddleware, AuthRequest } from "../../core/middleware/auth.middleware";
import { asyncHandler, sendSuccess } from "../../core/utils/index";
import { monteCarloService } from "./montecarlo.service";

const router = Router();

// All montecarlo routes require authentication
router.use(authMiddleware as any);

/**
 * POST /montecarlo/run
 *
 * Runs a stress-test Monte Carlo simulation using the authenticated
 * user's real portfolio holdings. Does NOT persist results.
 */
router.post(
    "/run",
    asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as AuthRequest).user?.id;
        const { volatilityMultiplier, crashDepth, inflationRate, interestRateShock, numPaths } = req.body;

        const result = await monteCarloService.runStressTest(userId, {
            volatilityMultiplier: Number(volatilityMultiplier) || 1,
            crashDepth: Number(crashDepth) || -30,
            inflationRate: Number(inflationRate) || 3,
            interestRateShock: Number(interestRateShock) || 0,
            numPaths: numPaths ? Number(numPaths) : undefined,
        });

        return sendSuccess(res, result);
    })
);

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
