import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { JwtPayload } from "../../core/types";
import { UnauthorizedError, ForbiddenError } from "../../core/errors";
import { AuthenticatedRequest } from "../../core/interfaces";

/**
 * Verifies the JWT from the Authorization header and attaches
 * `req.user` with the decoded payload.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Missing or malformed authorization header"));
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return next(new UnauthorizedError("Token expired"));
    }
    return next(new UnauthorizedError("Invalid token"));
  }
}

/**
 * Role-based access guard. Must be used AFTER `authenticate`.
 *
 * Usage: `router.get("/admin", authenticate, authorize("ADMIN"), handler)`
 */
export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return next(new UnauthorizedError("Authentication required"));
    }

    if (roles.length > 0 && !roles.includes(user.role)) {
      return next(new ForbiddenError("Insufficient permissions"));
    }

    next();
  };
}
