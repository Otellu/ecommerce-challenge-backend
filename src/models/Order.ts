import { Schema, model } from "mongoose";
import { IOrder, OrderStatus } from "@/utils/types";

/**
 * Order Schema Design Considerations:
 *
 * 1. Embedded order items for atomic operations and performance
 * 2. Customer reference for order history queries
 * 3. Order status tracking with enum validation
 * 4. Shipping address embedded (consider separate Address model for reuse)
 * 5. Payment details embedded with optional fields
 * 6. Timestamps for order lifecycle tracking
 * 7. Total amount stored (not calculated) for consistency and performance
 *
 * Scalability considerations:
 * - Partition by date for time-series queries
 * - Separate collection for order audit logs if needed
 * - Consider order item normalization for complex analytics
 * - Index on customer and status for frequent queries
 */

const orderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },

    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },

    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },

    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be a whole number",
      },
    },

    totalPrice: {
      type: Number,
      required: [true, "Total price is required"],
      min: [0, "Total price cannot be negative"],
    },
  },
  { _id: false }
); // No separate _id for embedded documents

const shippingAddressSchema = new Schema(
  {
    street: {
      type: String,
      required: [true, "Street address is required"],
      trim: true,
      maxlength: [200, "Street address cannot exceed 200 characters"],
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      maxlength: [100, "City name cannot exceed 100 characters"],
    },

    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
      maxlength: [100, "State name cannot exceed 100 characters"],
    },

    zipCode: {
      type: String,
      required: [true, "ZIP code is required"],
      trim: true,
      match: [/^\d{5}(-\d{4})?$/, "Invalid ZIP code format"],
    },

    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
      maxlength: [100, "Country name cannot exceed 100 characters"],
    },
  },
  { _id: false }
);

const paymentDetailsSchema = new Schema(
  {
    method: {
      type: String,
      required: [true, "Payment method is required"],
      enum: ["credit_card", "debit_card", "paypal", "stripe", "bank_transfer"],
      trim: true,
    },

    transactionId: {
      type: String,
      trim: true,
      sparse: true, // Allow null values but enforce uniqueness when present
    },

    paidAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer ID is required"],
      index: true, // Frequently queried for user order history
    },

    items: {
      type: [orderItemSchema],
      required: [true, "Order items are required"],
      validate: {
        validator: function (items: any[]) {
          return items && items.length > 0;
        },
        message: "Order must contain at least one item",
      },
    },

    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
      validate: {
        validator: function (value: number) {
          // Validate up to 2 decimal places for currency
          return /^\d+(\.\d{1,2})?$/.test(value.toString());
        },
        message: "Total amount can have maximum 2 decimal places",
      },
    },

    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
      required: true,
      index: true, // Frequently used for filtering orders
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: [true, "Shipping address is required"],
    },

    paymentDetails: {
      type: paymentDetailsSchema,
      default: null,
    },

    shippedAt: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    // Optimize JSON output
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for performance optimization
orderSchema.index({ customerId: 1, createdAt: -1 }); // Customer order history
orderSchema.index({ status: 1, createdAt: -1 }); // Orders by status
orderSchema.index({ createdAt: -1 }); // Recent orders
orderSchema.index({ "items.productId": 1 }); // Product order analytics

// Sparse indexes for optional fields
orderSchema.index({ shippedAt: -1 }, { sparse: true });
orderSchema.index({ deliveredAt: -1 }, { sparse: true });

// Text index for order search (by customer details, etc.)
orderSchema.index({
  "shippingAddress.city": "text",
  "shippingAddress.state": "text",
});

// Pre-save middleware to validate total amount
orderSchema.pre("save", function (next) {
  // Validate that total amount matches sum of item totals
  const calculatedTotal = this.items.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );
  const tolerance = 0.01; // Allow small floating point differences

  if (Math.abs(this.totalAmount - calculatedTotal) > tolerance) {
    return next(new Error("Total amount does not match sum of item prices"));
  }

  // Update timestamps based on status changes
  if (this.isModified("status")) {
    const now = new Date();

    switch (this.status) {
      case OrderStatus.SHIPPED:
        if (!this.shippedAt) this.shippedAt = now;
        break;
      case OrderStatus.DELIVERED:
        if (!this.deliveredAt) this.deliveredAt = now;
        if (!this.shippedAt) this.shippedAt = now;
        break;
    }
  }

  next();
});

// Virtual for order age (useful for analytics)
orderSchema.virtual("daysSinceOrder").get(function () {
  const diffTime = Math.abs(new Date().getTime() - this.createdAt.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for order processing time
orderSchema.virtual("processingTime").get(function () {
  if (!this.shippedAt) return null;
  const diffTime = this.shippedAt.getTime() - this.createdAt.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60)); // Hours
});

// Static method to find orders by status
orderSchema.statics.findByStatus = function (status: OrderStatus) {
  return this.find({ status }).populate("customerId", "name email");
};

// Static method to find customer orders
orderSchema.statics.findByCustomer = function (customerId: string) {
  return this.find({ customerId }).sort({ createdAt: -1 });
};

// Static method for sales analytics (date range)
orderSchema.statics.getSalesInDateRange = function (
  startDate: Date,
  endDate: Date
) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: {
          $in: [
            OrderStatus.PAID,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
        totalOrders: { $sum: 1 },
        averageOrderValue: { $avg: "$totalAmount" },
      },
    },
  ]);
};

// Instance method to check if order can be cancelled
orderSchema.methods.canBeCancelled = function (): boolean {
  return [OrderStatus.PENDING, OrderStatus.PAID].includes(this.status);
};

// Instance method to check if order is completed
orderSchema.methods.isCompleted = function (): boolean {
  return this.status === OrderStatus.DELIVERED;
};

export const Order = model<IOrder>("Order", orderSchema);
