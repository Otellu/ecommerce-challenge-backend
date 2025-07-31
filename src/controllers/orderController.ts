import { Request, Response, NextFunction } from "express";
import { sendSuccess } from "@/utils/response";

/**
 * Order Controller
 * Handles order creation, management, and tracking
 *
 * TODO: Check src/routes/orders.ts for validation schemas to understand:
 * - What body fields are required for order creation
 * - What validation rules are applied to order items and shipping address
 *
 * TODO: Add these imports when implementing:
 * - import { Order, Product } from "@/models";
 * - import { NotFoundError, BadRequestError } from "@/utils/errors";
 * - import { OrderStatus, AuthenticatedRequest } from "@/utils/types";
 * - import mongoose from "mongoose"; (for transactions/sessions)
 */

/**
 * Create new order
 * POST /api/orders
 * TODO: Implement order creation with stock validation and atomic updates (Making atomic updates will get you bonus points!)
 */
export const createOrder = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // TODO: Validate order items and shipping address
    // TODO: Check product availability and stock levels
    // TODO: Calculate total amount and create order with atomic updates

    sendSuccess(
      res,
      {
        orderId: "dummy-order-id",
        status: "pending",
        totalAmount: 0,
        items: [],
      },
      "Order created successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};
