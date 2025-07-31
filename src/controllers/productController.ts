import { Request, Response, NextFunction } from "express";
import { sendSuccess, sendPaginatedSuccess } from "@/utils/response";

/**
 * Product Controller
 * Handles product CRUD operations and search functionality
 *
 * TODO: Check src/routes/products.ts for validation schemas to understand:
 * - What query parameters are accepted (page, limit, category)
 * - What body fields are required for product creation
 * - What validation rules are applied
 *
 * TODO: Add these imports when implementing:
 * - import { Product } from "@/models";
 * - import { NotFoundError, BadRequestError } from "@/utils/errors";
 * - import { AuthenticatedRequest } from "@/utils/types";
 */

/**
 * Get products with pagination and category filter
 * GET /api/products
 * TODO: Implement product listing with pagination and category filtering
 */
export const getProducts = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // TODO: Extract query parameters (page, limit, category)
    // TODO: Implement pagination and category filtering
    // TODO: Return formatted product list

    sendPaginatedSuccess(res, [], 1, 20, 0);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new product (Seller only)
 * POST /api/products
 * TODO: Implement product creation with validation and seller verification
 */
export const createProduct = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // TODO: Validate product data and create new product
    // TODO: Ensure only sellers can create products

    sendSuccess(
      res,
      {
        productId: "dummy-id",
      },
      "Product created successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete product (Seller only - own products)
 * DELETE /api/products/:id
 * TODO: Implement soft delete with ownership verification
 */
export const deleteProduct = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // TODO: Verify product exists and user owns it
    // TODO: Implement soft delete functionality

    sendSuccess(res, undefined, "Product soft-deleted successfully");
  } catch (error) {
    next(error);
  }
};
