import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { UserRole, OrderStatus } from "../../src/utils/types";

export interface TestUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  token: string;
}

/**
 * Generate a JWT token for testing
 */
export const generateTestToken = (
  userId: string,
  role: UserRole,
  email: string
): string => {
  const payload = {
    userId,
    email,
    role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: "1h",
    issuer: "ecommerce-marketplace-cruit-api",
    audience: "ecommerce-marketplace-cruit-users",
  });
};

/**
 * Create test users with different roles
 */
export const createTestUsers = () => {
  const customerId = new mongoose.Types.ObjectId().toString();
  const sellerId = new mongoose.Types.ObjectId().toString();

  const customer: TestUser = {
    _id: customerId,
    name: "Test Customer",
    email: "customer@test.com",
    role: UserRole.CUSTOMER,
    token: generateTestToken(
      customerId,
      UserRole.CUSTOMER,
      "customer@test.com"
    ),
  };

  const seller: TestUser = {
    _id: sellerId,
    name: "Test Seller",
    email: "seller@test.com",
    role: UserRole.SELLER,
    token: generateTestToken(sellerId, UserRole.SELLER, "seller@test.com"),
  };

  return { customer, seller };
};

/**
 * Create test product data
 */
export const createTestProduct = (sellerId: string) => ({
  name: "Test Product",
  description: "A test product for testing purposes",
  price: 99.99,
  stock: 50,
  category: "test",
  images: ["https://example.com/image1.jpg"],
  sellerId: new mongoose.Types.ObjectId(sellerId),
  isActive: true,
  isDeleted: false,
});

/**
 * Create test order data
 */
export const createTestOrder = (customerId: string, productId: string) => ({
  customerId: new mongoose.Types.ObjectId(customerId),
  items: [
    {
      productId: new mongoose.Types.ObjectId(productId),
      name: "Test Product",
      quantity: 2,
      price: 99.99,
      totalPrice: 199.98, // price * quantity
    },
  ],
  totalAmount: 199.98,
  shippingAddress: {
    street: "123 Test Street",
    city: "Test City",
    state: "TS",
    zipCode: "12345",
    country: "Test Country",
  },
  status: OrderStatus.PENDING,
});

/**
 * Create test review data
 */
export const createTestReview = (
  customerId: string,
  productId: string,
  orderId: string
) => ({
  customerId: new mongoose.Types.ObjectId(customerId),
  productId: new mongoose.Types.ObjectId(productId),
  orderId: new mongoose.Types.ObjectId(orderId),
  rating: 5,
  comment: "Excellent product! Highly recommended.",
  isVerifiedPurchase: true,
});

/**
 * Clean all test collections (now handled by global afterEach in setup.ts)
 */
export const cleanTestData = async () => {
  // This function is now handled by the global afterEach in setup.ts
  // Keeping this function for backward compatibility, but it's a no-op
  return;
};

/**
 * Create invalid MongoDB ObjectId for testing
 */
export const getInvalidObjectId = (): string => "invalid-object-id";

/**
 * Create valid but non-existent MongoDB ObjectId for testing
 */
export const getNonExistentObjectId = (): string =>
  new mongoose.Types.ObjectId().toString();
