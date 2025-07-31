import dotenv from "dotenv";
import { EnvironmentConfig } from "@/utils/types";

// Load environment variables
dotenv.config();

/**
 * Environment configuration with validation
 * Ensures all required environment variables are present and properly typed
 */
const getConfig = (): EnvironmentConfig => {
  const requiredEnvVars = ["PORT", "MONGODB_URI"];

  // Check for missing required environment variables
  const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }

  return {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: parseInt(process.env.PORT || "3000", 10),
    MONGODB_URI: process.env.MONGODB_URI!,
    JWT_SECRET: process.env.JWT_SECRET! || "cruit-ecommerce-backend-challenge",
    JWT_EXPIRE: process.env.JWT_EXPIRE || "10y",
    BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10),
    CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
  };
};

// Validate and export configuration
export const config = getConfig();
