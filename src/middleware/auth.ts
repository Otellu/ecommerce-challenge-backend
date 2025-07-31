import { Request, Response, NextFunction } from "express";
import { User } from "@/models";
import { verifyAccessToken, extractTokenFromHeader } from "@/utils/jwt";
import { UnauthorizedError, ForbiddenError } from "@/utils/errors";
import { UserRole, AuthenticatedRequest } from "@/utils/types";

/**
 * Authentication middleware
 * Verifies JWT token and adds user information to request object
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      throw new UnauthorizedError("Access token is required");
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Verify user still exists
    const user = await User.findById(decoded.userId).select("_id email role");

    if (!user) {
      throw new UnauthorizedError("User account not found");
    }

    // Add user information to request object
    (req as AuthenticatedRequest).user = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorization middleware factory
 * Checks if authenticated user has required role(s)
 * @param allowedRoles Array of roles that can access the resource
 */
export const authorize = (allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const user = (req as AuthenticatedRequest).user;

      if (!user) {
        throw new UnauthorizedError("Authentication required");
      }

      if (!allowedRoles.includes(user.role)) {
        throw new ForbiddenError("Insufficient permissions");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Customer-only authorization middleware
 */
export const authorizeCustomer = authorize([UserRole.CUSTOMER]);

/**
 * Seller-only authorization middleware
 */
export const authorizeSeller = authorize([UserRole.SELLER]);

/**
 * Customer or Seller authorization middleware
 */
export const authorizeUser = authorize([UserRole.CUSTOMER, UserRole.SELLER]);
