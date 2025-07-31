import { Schema, model, Model } from "mongoose";
import { IReview } from "@/utils/types";

const reviewSchema = new Schema<IReview>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },

    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer ID is required"],
    },

    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order ID is required"],
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
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save middleware to verify purchase
reviewSchema.pre("save", async function (next) {
  if (this.isNew || this.isModified("orderId")) {
    try {
      const { Order } = await import("./Order");

      const order = await Order.findOne({
        _id: this.orderId,
        customerId: this.customerId,
        "items.productId": this.productId,
        status: { $in: ["delivered", "paid"] },
      });

      if (!order) {
        return next(
          new Error(
            "Invalid order: Order not found or does not contain the product"
          )
        );
      }

      this.isVerifiedPurchase = true;
    } catch (error) {
      return next(error as Error);
    }
  }

  next();
});

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
  return daysSinceCreation <= 7;
};

interface IReviewModel extends Model<IReview> {
  findVerifiedReviews(productId: string): Promise<IReview[]>;
  findByCustomer(customerId: string): Promise<IReview[]>;
}

export const Review = model<IReview, IReviewModel>("Review", reviewSchema);
