import request from "supertest";
import { app } from "./testApp";
import { Order, Product, User } from "../src/models";
import {
  createTestUsers,
  createTestProduct,
  createTestOrder,
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
  });
});
