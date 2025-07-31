import { Document, Types } from "mongoose";

// Base interfaces
export interface BaseDocument extends Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// User related types
export enum UserRole {
  CUSTOMER = "customer",
  SELLER = "seller",
}

export interface IUser extends BaseDocument {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Product related types
export interface IProduct extends BaseDocument {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  sellerId: Types.ObjectId;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  // Computed fields for aggregation
  rating?: number;
  reviewCount?: number;
  // Instance methods
  softDelete(): Promise<IProduct>;
  isInStock(quantity?: number): boolean;
}

// Order related types
export enum OrderStatus {
  PENDING = "pending",
  PAID = "paid",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

export interface IOrderItem {
  productId: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
}

export interface IOrder extends BaseDocument {
  customerId: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentDetails?: {
    method: string;
    transactionId?: string;
    paidAt?: Date;
  };
  shippedAt?: Date;
  deliveredAt?: Date;
}

// Review related types
export interface IReview extends BaseDocument {
  productId: Types.ObjectId;
  customerId: Types.ObjectId;
  orderId: Types.ObjectId;
  rating: number;
  comment?: string;
  isVerifiedPurchase: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  page?: number;
  limit?: number;
  totalResults?: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sellerId?: string;
  isActive?: boolean;
}

export interface OrderFilters {
  status?: OrderStatus;
  customerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// Analytics types
export interface SalesAnalytics {
  totalRevenue: number;
  mostSoldProduct: {
    productId: string;
    name: string;
    unitsSold: number;
  };
  averageOrderValue: number;
  dateRange: {
    from: string;
    to: string;
  };
}

// JWT payload types
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Request types with user context
import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

// Environment variables
export interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRE: string;
  BCRYPT_SALT_ROUNDS: number;
  CORS_ORIGIN: string;
}

// Error types
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

// Validation error type
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}
