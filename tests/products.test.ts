import request from "supertest";
import { app } from "./testApp";
import { Product, User } from "../src/models";
import {
  createTestUsers,
  createTestProduct,
  getNonExistentObjectId,
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

    it("should handle pagination parameters correctly", async () => {
      const response = await request(app)
        .get("/api/products?page=2&limit=5")
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        page: 2,
        limit: 5,
        totalResults: expect.any(Number),
        products: expect.any(Array),
      });
    });

    it("should handle search parameter", async () => {
      const response = await request(app)
        .get("/api/products?search=test")
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        products: expect.any(Array),
      });
    });

    it("should handle category filter", async () => {
      const response = await request(app)
        .get("/api/products?category=test")
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        products: expect.any(Array),
      });
    });

    it("should handle price range filters", async () => {
      const response = await request(app)
        .get("/api/products?minPrice=10&maxPrice=1000")
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        products: expect.any(Array),
      });
    });

    it("should handle invalid pagination parameters gracefully", async () => {
      const response = await request(app)
        .get("/api/products?page=-1&limit=1000")
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
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

    it("should return 401 when no authorization token provided", async () => {
      const productData = {
        name: "Test Product",
        description: "Test description",
        price: 99.99,
        stock: 10,
        category: "test",
      };

      const response = await request(app)
        .post("/api/products")
        .send(productData)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining("Access token is required"),
      });
    });

    it("should return 403 when customer tries to create product", async () => {
      const productData = {
        name: "Test Product",
        description: "Test description",
        price: 99.99,
        stock: 10,
        category: "test",
      };

      const response = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${testUsers.customer.token}`)
        .send(productData)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining("Insufficient permissions"),
      });
    });

    it("should return 400 for invalid product data", async () => {
      const invalidProductData = {
        name: "", // Invalid: empty name
        description: "Test description",
        price: -10, // Invalid: negative price
        stock: "invalid", // Invalid: string instead of number
        category: "test",
      };

      const response = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${testUsers.seller.token}`)
        .send(invalidProductData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
      });
    });

    it("should return 400 for missing required fields", async () => {
      const incompleteProductData = {
        name: "Test Product",
        // Missing: description, price, stock, category
      };

      const response = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${testUsers.seller.token}`)
        .send(incompleteProductData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
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

    it("should return 401 when no authorization token provided", async () => {
      const response = await request(app)
        .delete(`/api/products/${testProductId}`)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining("Access token is required"),
      });
    });

    it("should return 403 when customer tries to delete product", async () => {
      const response = await request(app)
        .delete(`/api/products/${testProductId}`)
        .set("Authorization", `Bearer ${testUsers.customer.token}`)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining("Insufficient permissions"),
      });
    });

    it("should return 404 for non-existent product", async () => {
      const nonExistentId = getNonExistentObjectId();

      const response = await request(app)
        .delete(`/api/products/${nonExistentId}`)
        .set("Authorization", `Bearer ${testUsers.seller.token}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining("Product not found"),
      });
    });

    it("should return 404 when seller tries to delete another seller's product", async () => {
      // Create another seller and product
      const anotherSeller = createTestUsers().seller;
      anotherSeller.email = "another-seller@test.com"; // Use unique email
      await User.create({
        _id: anotherSeller._id,
        name: anotherSeller.name,
        email: anotherSeller.email,
        password: "hashedpassword",
        role: anotherSeller.role,
      });

      const anotherProduct = await Product.create(
        createTestProduct(anotherSeller._id)
      );

      const response = await request(app)
        .delete(`/api/products/${anotherProduct._id}`)
        .set("Authorization", `Bearer ${testUsers.seller.token}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining("Product not found"),
      });
    });

    it("should return 400 for invalid product ID format", async () => {
      const response = await request(app)
        .delete("/api/products/invalid-id")
        .set("Authorization", `Bearer ${testUsers.seller.token}`)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining(
          "Product ID must be a valid MongoDB ObjectId"
        ),
      });
    });
  });
});
