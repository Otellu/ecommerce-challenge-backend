import { Request, Response, NextFunction } from "express";
import { User } from "@/models";
import { sendSuccess, sendPaginatedSuccess } from "@/utils/response";
import { NotFoundError } from "@/utils/errors";
import { AuthenticatedRequest, UserRole } from "@/utils/types";

/**
 * User Controller
 * Handles user profile management and admin operations
 */

/**
 * Get user profile
 * GET /api/users/profile
 */
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = (req as AuthenticatedRequest).user!;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      throw new NotFoundError("User not found");
    }

    sendSuccess(res, {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PATCH /api/users/profile
 */
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = (req as AuthenticatedRequest).user!;
    const { name } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Update allowed fields
    if (name) {
      user.name = name.trim();
    }

    await user.save();

    sendSuccess(
      res,
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        updatedAt: user.updatedAt,
      },
      "Profile updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users (Seller only - for admin purposes)
 * GET /api/users
 */
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const role = req.query.role as UserRole;

    // Build filter
    const filters: any = {};
    if (role) filters.role = role;

    const [users, totalResults] = await Promise.all([
      User.find(filters)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filters),
    ]);

    const formattedUsers = users.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    }));

    sendPaginatedSuccess(res, formattedUsers, page, limit, totalResults);
  } catch (error) {
    next(error);
  }
};
