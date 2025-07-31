import { Request, Response, NextFunction } from "express";
import { sendSuccess } from "@/utils/response";

/**
 * Review Controller
 * Handles product review creation and retrieval
 *
 * TODO: Check src/routes/reviews.ts for validation schemas to understand:
 * - What body fields are required for review creation
 * - What validation rules are applied to rating and comment
 *
 * TODO: Add these imports when implementing:
 * - import { Review, Order } from "@/models";
 * - import { NotFoundError, ConflictError } from "@/utils/errors";
 * - import { AuthenticatedRequest, OrderStatus } from "@/utils/types";
 */

/**
 * Create a new review for a product
 * POST /api/reviews
 * TODO: Implement review creation with order verification and duplicate prevention
 */
export const createReview = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // TODO: Verify order exists and customer owns it
    // TODO: Check if review already exists and prevent duplicates
    // TODO: Create review with verified purchase flag

    sendSuccess(
      res,
      {
        reviewId: "dummy-review-id",
        productId: "dummy-product-id",
        rating: 5,
        comment: "dummy comment",
        isVerifiedPurchase: true,
        customerName: "dummy customer",
        createdAt: new Date().toISOString(),
      },
      "Review created successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};
