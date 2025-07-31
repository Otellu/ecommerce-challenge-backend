import { Schema, model } from "mongoose";
import { IOrder, OrderStatus } from "@/utils/types";

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
);

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
      sparse: true,
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save middleware to validate total amount
orderSchema.pre("save", function (next) {
  const calculatedTotal = this.items.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );
  const tolerance = 0.01;

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

// Static method to find orders by status
orderSchema.statics.findByStatus = function (status: OrderStatus) {
  return this.find({ status }).populate("customerId", "name email");
};

// Static method to find customer orders
orderSchema.statics.findByCustomer = function (customerId: string) {
  return this.find({ customerId }).sort({ createdAt: -1 });
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
