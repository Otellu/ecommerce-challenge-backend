import { Request, Response, NextFunction } from "express";
import { Review, Order } from "@/models";
import { sendSuccess } from "@/utils/response";
import { NotFoundError, ConflictError } from "@/utils/errors";
import { AuthenticatedRequest, OrderStatus } from "@/utils/types";

/**
 * Review Controller
 * Handles product review creation and retrieval
 */

/**
 * Create a new review for a product
 * POST /api/reviews
 */
export const createReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = (req as AuthenticatedRequest).user!;
    const { productId, orderId, rating, comment } = req.body;

    // Verify that the order exists and belongs to the customer
    const order = await Order.findOne({
      _id: orderId,
      customerId: userId,
      "items.productId": productId,
      status: { $in: [OrderStatus.DELIVERED, OrderStatus.PAID] },
    });

    if (!order) {
      throw new NotFoundError(
        "Order not found or you cannot review this product. Only delivered/paid orders can be reviewed."
      );
    }

    // Check if review already exists for this order and product
    const existingReview = await Review.findOne({
      productId,
      customerId: userId,
      orderId,
    });

    if (existingReview) {
      throw new ConflictError(
        "You have already reviewed this product for this order"
      );
    }

    // Create the review
    const review = new Review({
      productId,
      customerId: userId,
      orderId,
      rating,
      comment: comment?.trim() || null,
      isVerifiedPurchase: true,
    });

    await review.save();

    // Populate customer name for response
    await review.populate("customerId", "name");

    sendSuccess(
      res,
      {
        reviewId: review._id,
        productId: review.productId,
        rating: review.rating,
        comment: review.comment,
        isVerifiedPurchase: review.isVerifiedPurchase,
        customerName: (review.customerId as any).name,
        createdAt: review.createdAt,
      },
      "Review created successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};
