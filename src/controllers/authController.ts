import { Request, Response, NextFunction } from "express";
import { User } from "@/models";
import { generateToken } from "@/utils/jwt";
import { sendSuccess } from "@/utils/response";
import { ConflictError } from "@/utils/errors";
import { UserRole } from "@/utils/types";

/**
 * Authentication Controller
 * Handles user registration and token management
 */

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, role = UserRole.CUSTOMER } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
    });

    await user.save();

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Send success response
    sendSuccess(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        ...token,
      },
      "User registered successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};
