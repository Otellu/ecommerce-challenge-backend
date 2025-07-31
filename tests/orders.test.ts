import request from "supertest";
import mongoose from "mongoose";
import { app } from "./testApp";
import { Product, User } from "../src/models";
import {
  createTestUsers,
  createTestProduct,
  cleanTestData,
} from "./utils/testHelpers";

describe("Order APIs", () => {
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

    const product = await Product.create({
      ...createTestProduct(testUsers.seller._id),
      stock: 100,
    });
    testProductId = product._id.toString();
  });

  describe("POST /api/orders", () => {
    it("should return correct response format", async () => {
      const orderData = {
        items: [
          {
            productId: testProductId,
            quantity: 2,
          },
        ],
        shippingAddress: {
          street: "123 Main Street",
          city: "New York",
          state: "NY",
          zipCode: "10001",
          country: "USA",
        },
      };

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${testUsers.customer.token}`)
        .send(orderData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: "Order created successfully",
        data: {
          orderId: expect.any(String),
          status: "pending",
          totalAmount: expect.any(Number),
          items: expect.arrayContaining([
            expect.objectContaining({
              productId: testProductId,
              name: expect.any(String),
              quantity: 2,
              price: expect.any(Number),
            }),
          ]),
        },
      });
    });
  });
});
