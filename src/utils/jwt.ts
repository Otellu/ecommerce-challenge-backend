import jwt from "jsonwebtoken";
import { config } from "@/config/environment";
import { JwtPayload, UserRole } from "@/utils/types";

/**
 * JWT utility functions for token generation and verification
 * Provides secure token handling with configurable expiration
 */

/**
 * Generate access token
 * @param payload User information to encode in token
 * @returns Signed JWT token
 */
export const generateAccessToken = (payload: {
  userId: string;
  email: string;
  role: UserRole;
}): string => {
  // @ts-ignore - JWT type definitions issue with strict typing
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE,
    issuer: "ecommerce-marketplace-cruit-api",
    audience: "ecommerce-marketplace-cruit-users",
  });
};

/**
 * Verify access token
 * @param token JWT token to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      issuer: "ecommerce-marketplace-cruit-api",
      audience: "ecommerce-marketplace-cruit-users",
    }) as JwtPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Access token has expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid access token");
    } else {
      throw new Error("Token verification failed");
    }
  }
};

/**
 * Extract token from Authorization header
 * @param authHeader Authorization header value
 * @returns Extracted token or null
 */
export const extractTokenFromHeader = (
  authHeader: string | undefined
): string | null => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.substring(7); // Remove 'Bearer ' prefix
};

/**
 * Generate access token
 * @param payload User information to encode in token
 * @returns Object containing access token
 */
export const generateToken = (payload: {
  userId: string;
  email: string;
  role: UserRole;
}): { accessToken: string } => {
  return {
    accessToken: generateAccessToken(payload),
  };
};
