import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser, UserRole } from "@/utils/types";
import { config } from "@/config/environment";

/**
 * User Schema Design Considerations:
 *
 * 1. Email uniqueness with sparse index for performance
 * 2. Password hashing with bcrypt using configurable salt rounds
 * 3. Role-based access control with enum validation
 * 4. Timestamps for audit trails
 *
 * Scalability considerations:
 * - Compound indexes on frequently queried fields
 * - Lean queries for performance where password not needed
 * - Virtual for full name if needed later
 */

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
      minlength: [2, "Name must be at least 2 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please provide a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Don't include password in queries by default for security
    },

    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    // Improve query performance by excluding deleted users from default queries
    toJSON: {
      transform: function (_doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  try {
    // Hash password with configurable salt rounds
    this.password = await bcrypt.hash(this.password, config.BCRYPT_SALT_ROUNDS);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

// Static method to find by role
userSchema.statics.findByRole = function (role: UserRole) {
  return this.find({ role });
};

export const User = model<IUser>("User", userSchema);
