import express from "express";
import cors from "cors";
import { config } from "../src/config/environment";
import authRoutes from "../src/routes/auth";
import productRoutes from "../src/routes/products";
import orderRoutes from "../src/routes/orders";
import reviewRoutes from "../src/routes/reviews";
import analyticsRoutes from "../src/routes/analytics";
import { errorHandler } from "../src/middleware/errorHandler";

/**
 * Test Express application instance
 * Separate from main app to ensure test isolation
 */
const app = express();

// Basic middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/analytics", analyticsRoutes);

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "OK", message: "Test server is running" });
});

// Global error handler
app.use(errorHandler);

export { app };
