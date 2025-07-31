import { Schema, model, Model } from "mongoose";
import { IReview } from "@/utils/types";

/**
 * Review Schema Design Considerations:
 *
 * 1. Product and customer references for relationship integrity
 * 2. Order reference to verify purchase (verified purchase badge)
 * 3. Rating validation (1-5 stars)
 * 4. Optional comment field for detailed feedback
 * 5. Verified purchase flag for trust indicators
 * 6. Compound unique index to prevent duplicate reviews per order
 *
 * Scalability considerations:
 * - Separate collection from products for independent scaling
 * - Indexes on productId for aggregation queries
 * - Consider denormalizing average rating to product collection
 * - Archive old reviews if needed for performance
 */

const reviewSchema = new Schema<IReview>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
      index: true, // Frequently queried for product reviews
    },

    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer ID is required"],
      index: true, // For customer review history
    },

    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order ID is required"],
      index: true, // For purchase verification
    },

    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
      validate: {
        validator: Number.isInteger,
        message: "Rating must be a whole number",
      },
    },

    comment: {
      type: String,
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
      default: null,
    },

    isVerifiedPurchase: {
      type: Boolean,
      required: true,
      default: true,
      index: true, // For filtering verified reviews
    },
  },
  {
    timestamps: true,
    // Optimize JSON output
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for performance and business rules
reviewSchema.index(
  { productId: 1, customerId: 1, orderId: 1 },
  { unique: true }
); // Prevent duplicate reviews per order
reviewSchema.index({ productId: 1, rating: -1 }); // Product reviews sorted by rating
reviewSchema.index({ customerId: 1, createdAt: -1 }); // Customer review history
reviewSchema.index({ createdAt: -1 }); // Recent reviews
reviewSchema.index({ productId: 1, isVerifiedPurchase: 1 }); // Verified product reviews

// Text search index for review comments
reviewSchema.index({ comment: "text" });

// Pre-save middleware to verify purchase
reviewSchema.pre("save", async function (next) {
  if (this.isNew || this.isModified("orderId")) {
    try {
      // Import Order model dynamically to avoid circular dependency
      const { Order } = await import("./Order");

      // Verify that the order belongs to the customer and contains the product
      const order = await Order.findOne({
        _id: this.orderId,
        customerId: this.customerId,
        "items.productId": this.productId,
        status: { $in: ["delivered", "paid"] }, // Only allow reviews for completed/paid orders
      });

      if (!order) {
        return next(
          new Error(
            "Invalid order: Order not found or does not contain the product"
          )
        );
      }

      // Set verified purchase flag based on order verification
      this.isVerifiedPurchase = true;
    } catch (error) {
      return next(error as Error);
    }
  }

  next();
});

// Static method to get product rating statistics
reviewSchema.statics.getProductRating = function (productId: string) {
  return this.aggregate([
    { $match: { productId: new Schema.Types.ObjectId(productId) } },
    {
      $group: {
        _id: "$productId",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: {
            $switch: {
              branches: [
                { case: { $eq: ["$rating", 1] }, then: "1star" },
                { case: { $eq: ["$rating", 2] }, then: "2star" },
                { case: { $eq: ["$rating", 3] }, then: "3star" },
                { case: { $eq: ["$rating", 4] }, then: "4star" },
                { case: { $eq: ["$rating", 5] }, then: "5star" },
              ],
              default: "unknown",
            },
          },
        },
      },
    },
    {
      $addFields: {
        roundedRating: { $round: ["$averageRating", 1] },
      },
    },
  ]);
};

// Static method to find verified reviews for a product
reviewSchema.statics.findVerifiedReviews = function (productId: string) {
  return this.find({
    productId,
    isVerifiedPurchase: true,
  })
    .populate("customerId", "name")
    .sort({ createdAt: -1 });
};

// Static method to find customer reviews
reviewSchema.statics.findByCustomer = function (customerId: string) {
  return this.find({ customerId })
    .populate("productId", "name")
    .sort({ createdAt: -1 });
};

// Instance method to check if review can be edited
reviewSchema.methods.canBeEdited = function (): boolean {
  const daysSinceCreation = Math.floor(
    (new Date().getTime() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysSinceCreation <= 7; // Allow editing within 7 days
};

// Virtual for review age
reviewSchema.virtual("daysOld").get(function () {
  const diffTime = Math.abs(new Date().getTime() - this.createdAt.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for helpful score (can be extended with likes/dislikes)
reviewSchema.virtual("helpfulScore").get(function () {
  // Placeholder for future helpful voting feature
  return 0;
});

interface IReviewModel extends Model<IReview> {
  getProductRating(productId: string): Promise<any[]>;
  findVerifiedReviews(productId: string): Promise<IReview[]>;
  findByCustomer(customerId: string): Promise<IReview[]>;
}

export const Review = model<IReview, IReviewModel>("Review", reviewSchema);
