import request from "supertest";
import { app } from "./testApp";
import { Product, User } from "../src/models";
import {
  createTestUsers,
  createTestProduct,
  getNonExistentObjectId,
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

    it("should return 401 when no authorization token provided", async () => {
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
        .send(orderData)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining("Access token is required"),
      });
    });

    it("should return 403 when seller tries to create order", async () => {
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
        .set("Authorization", `Bearer ${testUsers.seller.token}`)
        .send(orderData)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining("Insufficient permissions"),
      });
    });

    it("should return 400 for empty items array", async () => {
      const orderData = {
        items: [],
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
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining("At least one item is required"),
      });
    });

    it("should return 400 for missing items", async () => {
      const orderData = {
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
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
      });
    });

    it("should return 400 for missing shipping address", async () => {
      const orderData = {
        items: [
          {
            productId: testProductId,
            quantity: 2,
          },
        ],
      };

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${testUsers.customer.token}`)
        .send(orderData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
      });
    });

    it("should return 400 for invalid product ID format", async () => {
      const orderData = {
        items: [
          {
            productId: "invalid-id",
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
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
      });
    });

    it("should return 404 for non-existent product", async () => {
      const nonExistentId = getNonExistentObjectId();
      const orderData = {
        items: [
          {
            productId: nonExistentId,
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
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining("not found or unavailable"),
      });
    });

    it("should return 400 for insufficient stock", async () => {
      const orderData = {
        items: [
          {
            productId: testProductId,
            quantity: 150, // More than available stock (100)
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
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining("Insufficient stock"),
      });
    });

    it("should return 400 for zero quantity", async () => {
      const orderData = {
        items: [
          {
            productId: testProductId,
            quantity: 0,
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
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
      });
    });

    it("should return 400 for negative quantity", async () => {
      const orderData = {
        items: [
          {
            productId: testProductId,
            quantity: -1,
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
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
      });
    });

    it("should return 400 for inactive product", async () => {
      // Create an inactive product
      const inactiveProduct = await Product.create({
        ...createTestProduct(testUsers.seller._id),
        isActive: false,
        stock: 50,
      });

      const orderData = {
        items: [
          {
            productId: inactiveProduct._id.toString(),
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
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining("not found or unavailable"),
      });
    });

    it("should return 400 for deleted product", async () => {
      // Create a deleted product
      const deletedProduct = await Product.create({
        ...createTestProduct(testUsers.seller._id),
        isDeleted: true,
        stock: 50,
      });

      const orderData = {
        items: [
          {
            productId: deletedProduct._id.toString(),
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
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining("not found or unavailable"),
      });
    });

    it("should return 400 for invalid shipping address", async () => {
      const orderData = {
        items: [
          {
            productId: testProductId,
            quantity: 2,
          },
        ],
        shippingAddress: {
          street: "", // Invalid: empty street
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
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
      });
    });
  });
});
