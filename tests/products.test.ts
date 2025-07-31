import request from "supertest";
import mongoose from "mongoose";
import { app } from "./testApp";
import { Product, User } from "../src/models";
import {
  createTestUsers,
  createTestProduct,
  cleanTestData,
} from "./utils/testHelpers";

describe("Product APIs", () => {
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
  });

  describe("GET /api/products", () => {
    it("should return correct response format", async () => {
      const response = await request(app).get("/api/products").expect(200);

      expect(response.body).toMatchObject({
        success: true,
        page: expect.any(Number),
        limit: expect.any(Number),
        totalResults: expect.any(Number),
        products: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            price: expect.any(Number),
            stock: expect.any(Number),
            category: expect.any(String),
            images: expect.any(Array),
            rating: expect.any(Number),
            totalReviews: expect.any(Number),
          }),
        ]),
      });
    });
  });

  describe("POST /api/products", () => {
    it("should return correct response format", async () => {
      const productData = {
        name: "MacBook Pro M3",
        description: "Powerful laptop for professionals with M3 chip",
        price: 1999.99,
        stock: 25,
        category: "computers",
        images: ["https://example.com/macbook.jpg"],
      };

      const response = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${testUsers.seller.token}`)
        .send(productData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: "Product created successfully",
        data: {
          productId: expect.any(String),
        },
      });
    });
  });

  describe("DELETE /api/products/:id", () => {
    it("should return correct response format", async () => {
      const response = await request(app)
        .delete(`/api/products/${testProductId}`)
        .set("Authorization", `Bearer ${testUsers.seller.token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Product soft-deleted successfully",
      });
    });
  });
});
