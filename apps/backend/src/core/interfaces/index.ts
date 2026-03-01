import { Request } from "express";
import { JwtPayload } from "../types";

/**
 * Express Request augmented with authenticated user info.
 */
export interface AuthenticatedRequest extends Request {
  user?: any;
}
