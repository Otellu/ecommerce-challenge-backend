import request from "supertest";
import { app } from "./testApp";
import { Order, Product, User } from "../src/models";
import {
  createTestUsers,
  createTestProduct,
  createTestOrder,
  getNonExistentObjectId,
} from "./utils/testHelpers";
import { OrderStatus } from "../src/utils/types";

describe("Review APIs", () => {
  let testUsers: { customer: any; seller: any };
  let testProductId: string;
  let testOrderId: string;

  beforeEach(async () => {
    testUsers = createTestUsers();

    await User.create([
      {
        _id: testUsers.customer._id,
        name: testUsers.customer.name,
        email: testUsers.customer.email,
        password: "hashedpassword",
        role: testUsers.customer.role,
      },
      {
        _id: testUsers.seller._id,
        name: testUsers.seller.name,
        email: testUsers.seller.email,
        password: "hashedpassword",
        role: testUsers.seller.role,
      },
    ]);

    const product = await Product.create(
      createTestProduct(testUsers.seller._id)
    );
    testProductId = product._id.toString();

    const order = await Order.create({
      ...createTestOrder(testUsers.customer._id, testProductId),
      status: OrderStatus.DELIVERED,
    });
    testOrderId = order._id.toString();
  });

  describe("POST /api/reviews", () => {
    it("should return correct response format", async () => {
      const reviewData = {
        productId: testProductId,
        orderId: testOrderId,
        rating: 5,
        comment: "Excellent product! Highly recommended.",
      };

      const response = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${testUsers.customer.token}`)
        .send(reviewData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: "Review created successfully",
        data: {
          reviewId: expect.any(String),
          productId: testProductId,
          rating: 5,
          comment: "Excellent product! Highly recommended.",
          isVerifiedPurchase: true,
          customerName: expect.any(String),
          createdAt: expect.any(String),
        },
      });
    });

    it("should return 401 when no authorization token provided", async () => {
      const reviewData = {
        productId: testProductId,
        orderId: testOrderId,
        rating: 5,
        comment: "Excellent product! Highly recommended.",
      };

      const response = await request(app)
        .post("/api/reviews")
        .send(reviewData)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining("Access token is required"),
      });
    });

    it("should return 403 when seller tries to create review", async () => {
      const reviewData = {
        productId: testProductId,
        orderId: testOrderId,
        rating: 5,
        comment: "Excellent product! Highly recommended.",
      };

      const response = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${testUsers.seller.token}`)
        .send(reviewData)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining("Insufficient permissions"),
      });
    });

    it("should return 400 for missing required fields", async () => {
      const incompleteReviewData = {
        rating: 5,
        comment: "Excellent product! Highly recommended.",
        // Missing: productId, orderId
      };

      const response = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${testUsers.customer.token}`)
        .send(incompleteReviewData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
      });
    });

    it("should return 400 for invalid rating", async () => {
      const reviewData = {
        productId: testProductId,
        orderId: testOrderId,
        rating: 6, // Invalid: rating should be 1-5
        comment: "Excellent product! Highly recommended.",
      };

      const response = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${testUsers.customer.token}`)
        .send(reviewData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
      });
    });

    it("should return 400 for zero rating", async () => {
      const reviewData = {
        productId: testProductId,
        orderId: testOrderId,
        rating: 0, // Invalid: rating should be 1-5
        comment: "Excellent product! Highly recommended.",
      };

      const response = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${testUsers.customer.token}`)
        .send(reviewData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
      });
    });

    it("should return 400 for negative rating", async () => {
      const reviewData = {
        productId: testProductId,
        orderId: testOrderId,
        rating: -1, // Invalid: negative rating
        comment: "Excellent product! Highly recommended.",
      };

      const response = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${testUsers.customer.token}`)
        .send(reviewData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
      });
    });

    it("should return 400 for invalid product ID format", async () => {
      const reviewData = {
        productId: "invalid-id",
        orderId: testOrderId,
        rating: 5,
        comment: "Excellent product! Highly recommended.",
      };

      const response = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${testUsers.customer.token}`)
        .send(reviewData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
      });
    });

    it("should return 400 for invalid order ID format", async () => {
      const reviewData = {
        productId: testProductId,
        orderId: "invalid-id",
        rating: 5,
        comment: "Excellent product! Highly recommended.",
      };

      const response = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${testUsers.customer.token}`)
        .send(reviewData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
      });
    });

    it("should return 404 for non-existent product", async () => {
      const nonExistentProductId = getNonExistentObjectId();
      const reviewData = {
        productId: nonExistentProductId,
        orderId: testOrderId,
        rating: 5,
        comment: "Excellent product! Highly recommended.",
      };

      const response = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${testUsers.customer.token}`)
        .send(reviewData)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining(
          "Order not found or you cannot review this product"
        ),
      });
    });

    it("should return 404 for non-existent order", async () => {
      const nonExistentOrderId = getNonExistentObjectId();
      const reviewData = {
        productId: testProductId,
        orderId: nonExistentOrderId,
        rating: 5,
        comment: "Excellent product! Highly recommended.",
      };

      const response = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${testUsers.customer.token}`)
        .send(reviewData)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining("Order not found"),
      });
    });

    it("should return 404 for order not delivered", async () => {
      // Create an order that's not delivered
      const pendingOrder = await Order.create({
        ...createTestOrder(testUsers.customer._id, testProductId),
        status: OrderStatus.PENDING,
      });

      const reviewData = {
        productId: testProductId,
        orderId: pendingOrder._id.toString(),
        rating: 5,
        comment: "Excellent product! Highly recommended.",
      };

      const response = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${testUsers.customer.token}`)
        .send(reviewData)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining(
          "Order not found or you cannot review this product"
        ),
      });
    });

    it("should return 404 for order not belonging to customer", async () => {
      // Create another customer and order
      const anotherCustomer = createTestUsers().customer;
      anotherCustomer.email = "another-customer@test.com"; // Use unique email
      await User.create({
        _id: anotherCustomer._id,
        name: anotherCustomer.name,
        email: anotherCustomer.email,
        password: "hashedpassword",
        role: anotherCustomer.role,
      });

      const anotherOrder = await Order.create({
        ...createTestOrder(anotherCustomer._id, testProductId),
        status: OrderStatus.DELIVERED,
      });

      const reviewData = {
        productId: testProductId,
        orderId: anotherOrder._id.toString(),
        rating: 5,
        comment: "Excellent product! Highly recommended.",
      };

      const response = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${testUsers.customer.token}`)
        .send(reviewData)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining(
          "Order not found or you cannot review this product"
        ),
      });
    });

    it("should return 404 for order not containing the product", async () => {
      // Create another product and order with that product
      const anotherProduct = await Product.create(
        createTestProduct(testUsers.seller._id)
      );

      const orderWithDifferentProduct = await Order.create({
        ...createTestOrder(
          testUsers.customer._id,
          anotherProduct._id.toString()
        ),
        status: OrderStatus.DELIVERED,
      });

      const reviewData = {
        productId: testProductId, // Original product
        orderId: orderWithDifferentProduct._id.toString(), // Order with different product
        rating: 5,
        comment: "Excellent product! Highly recommended.",
      };

      const response = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${testUsers.customer.token}`)
        .send(reviewData)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining(
          "Order not found or you cannot review this product"
        ),
      });
    });

    it("should return 409 for duplicate review", async () => {
      const reviewData = {
        productId: testProductId,
        orderId: testOrderId,
        rating: 5,
        comment: "Excellent product! Highly recommended.",
      };

      // Create first review
      await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${testUsers.customer.token}`)
        .send(reviewData)
        .expect(201);

      // Try to create duplicate review
      const response = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${testUsers.customer.token}`)
        .send(reviewData)
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining(
          "You have already reviewed this product for this order"
        ),
      });
    });

    it("should return 400 for comment too long", async () => {
      const longComment = "a".repeat(1001); // Comment longer than 1000 characters
      const reviewData = {
        productId: testProductId,
        orderId: testOrderId,
        rating: 5,
        comment: longComment,
      };

      const response = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${testUsers.customer.token}`)
        .send(reviewData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
      });
    });

    it("should allow review without comment", async () => {
      const reviewData = {
        productId: testProductId,
        orderId: testOrderId,
        rating: 5,
        // No comment provided
      };

      const response = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${testUsers.customer.token}`)
        .send(reviewData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: "Review created successfully",
        data: {
          reviewId: expect.any(String),
          productId: testProductId,
          rating: 5,
          comment: null,
          isVerifiedPurchase: true,
        },
      });
    });
  });
});
