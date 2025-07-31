import { Schema, model } from "mongoose";
import { IProduct } from "@/utils/types";

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Product name cannot exceed 200 characters"],
      minlength: [3, "Product name must be at least 3 characters"],
    },

    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
      validate: {
        validator: function (value: number) {
          // Validate up to 2 decimal places for currency
          return /^\d+(\.\d{1,2})?$/.test(value.toString());
        },
        message: "Price can have maximum 2 decimal places",
      },
    },

    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Stock must be a whole number",
      },
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      maxlength: [50, "Category name cannot exceed 50 characters"],
    },

    images: [
      {
        type: String,
        validate: {
          validator: function (url: string) {
            // Basic URL validation
            return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url);
          },
          message: "Invalid image URL format",
        },
      },
    ],

    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller ID is required"],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Soft delete fields
    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
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

// Virtual for rating (to be populated from Reviews collection)
productSchema.virtual("rating", {
  ref: "Review",
  localField: "_id",
  foreignField: "productId",
  justOne: false,
});

// Virtual for review count
productSchema.virtual("reviewCount", {
  ref: "Review",
  localField: "_id",
  foreignField: "productId",
  count: true,
});

// Middleware to handle soft delete
productSchema.pre("save", function (next) {
  if (this.isDeleted && !this.deletedAt) {
    this.deletedAt = new Date();
    this.isActive = false;
  }
  next();
});

// Static method to find available products (common query)
productSchema.statics.findAvailable = function () {
  return this.find({
    isActive: true,
    isDeleted: false,
    stock: { $gt: 0 },
  });
};

// Static method to find by seller
productSchema.statics.findBySeller = function (sellerId: string) {
  return this.find({
    sellerId,
    isActive: true,
    isDeleted: false,
  });
};

// Instance method for soft delete
productSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.isActive = false;
  return this.save();
};

// Instance method to check if product is in stock
productSchema.methods.isInStock = function (quantity = 1): boolean {
  return this.stock >= quantity && this.isActive && !this.isDeleted;
};

export const Product = model<IProduct>("Product", productSchema);
