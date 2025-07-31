import request from "supertest";
import mongoose from "mongoose";
import { app } from "./testApp";
import { Order, Product, User } from "../src/models";
import {
  createTestUsers,
  createTestProduct,
  createTestOrder,
} from "./utils/testHelpers";
import { OrderStatus } from "../src/utils/types";

describe("Analytics APIs", () => {
  let testUsers: { customer: any; seller: any };
  let testProductId: string;

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

    await Order.create([
      {
        ...createTestOrder(testUsers.customer._id, testProductId),
        status: OrderStatus.DELIVERED,
        createdAt: new Date("2024-01-15"),
        // totalAmount: 199.98 matches createTestOrder (99.99 * 2)
      },
      {
        ...createTestOrder(testUsers.customer._id, testProductId),
        status: OrderStatus.DELIVERED,
        createdAt: new Date("2024-01-20"),
        // Update items for different total
        items: [
          {
            productId: new mongoose.Types.ObjectId(testProductId),
            name: "Test Product",
            quantity: 3,
            price: 99.99,
            totalPrice: 299.97, // 99.99 * 3
          },
        ],
        totalAmount: 299.97,
      },
    ]);
  });

  describe("GET /api/analytics/sales", () => {
    it("should return correct response format with sales data", async () => {
      const response = await request(app)
        .get("/api/analytics/sales?dateFrom=2024-01-01&dateTo=2024-01-31")
        .set("Authorization", `Bearer ${testUsers.seller.token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        dateRange: {
          from: "2024-01-01",
          to: "2024-01-31",
        },
        totalRevenue: expect.any(Number),
        mostSoldProduct: expect.objectContaining({
          productId: expect.any(String),
          name: expect.any(String),
          unitsSold: expect.any(Number),
        }),
        averageOrderValue: expect.any(Number),
      });
    });

    it("should return correct response format with no sales data", async () => {
      const response = await request(app)
        .get("/api/analytics/sales?dateFrom=2023-01-01&dateTo=2023-01-31")
        .set("Authorization", `Bearer ${testUsers.seller.token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        dateRange: {
          from: "2023-01-01",
          to: "2023-01-31",
        },
        totalRevenue: 0,
        mostSoldProduct: null,
        averageOrderValue: 0,
      });
    });
  });
});
