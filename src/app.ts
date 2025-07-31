import express, { Application } from "express";
import cors from "cors";
import { config } from "@/config/environment";
import { errorHandler, notFoundHandler } from "@/middleware";

// Import routes
import authRoutes from "@routes/auth";
import productRoutes from "@routes/products";
import orderRoutes from "@routes/orders";
import analyticsRoutes from "@routes/analytics";
import reviewRoutes from "@routes/reviews";

/**
 * Express application setup with middleware and routes
 */

const createApp = (): Application => {
  const app: Application = express();

  // CORS configuration
  app.use(
    cors({
      origin: config.CORS_ORIGIN,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Body parsing middleware
  app.use(
    express.json({
      limit: "10mb",
      type: "application/json",
    })
  );

  app.use(
    express.urlencoded({
      extended: true,
      limit: "10mb",
    })
  );

  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/reviews", reviewRoutes);

  // API documentation endpoint (placeholder)
  app.get("/api", (_req, res) => {
    res.status(200).json({
      success: true,
      message: "E-commerce Marketplace Challenge",
      documentation: "Readme.md",
      endpoints: {
        auth: "/api/auth",
        products: "/api/products",
        orders: "/api/orders",
        analytics: "/api/analytics",
        reviews: "/api/reviews",
      },
    });
  });

  // 404 handler for undefined routes
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
};

export default createApp;
