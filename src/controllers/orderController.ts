import { Request, Response, NextFunction } from "express";
import { Order, Product } from "@/models";
import { sendSuccess } from "@/utils/response";
import { NotFoundError, BadRequestError } from "@/utils/errors";
import { OrderStatus, AuthenticatedRequest } from "@/utils/types";
import mongoose from "mongoose";

/**
 * Order Controller
 * Handles order creation, management, and tracking
 */

/**
 * Create new order
 * POST /api/orders
 */
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let session = null;

  // Don't use sessions in test environment as MongoDB Memory Server has limited transaction support
  if (process.env.NODE_ENV !== "test") {
    try {
      session = await mongoose.startSession();
    } catch (error) {
      // Session not supported (e.g., in test environment)
    }
  }

  try {
    const executeOrder = async () => {
      const { userId } = (req as AuthenticatedRequest).user!;
      const { items, shippingAddress } = req.body;

      if (!items || items.length === 0) {
        throw new BadRequestError("Order must contain at least one item");
      }

      // Validate and calculate order details
      const orderItems = [];
      let totalAmount = 0;

      for (const item of items) {
        const findOptions = session ? { session } : {};
        const product = await Product.findOne(
          {
            _id: item.productId,
            isActive: true,
            isDeleted: false,
          },
          null,
          findOptions
        );

        if (!product) {
          throw new NotFoundError(
            `Product ${item.productId} not found or unavailable`
          );
        }

        if (!product.isInStock(item.quantity)) {
          throw new BadRequestError(
            `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
          );
        }

        // Calculate item total
        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;

        orderItems.push({
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          totalPrice: itemTotal,
        });

        // Reduce stock atomically
        const updateOptions = session ? { session } : {};
        await Product.updateOne(
          { _id: product._id },
          { $inc: { stock: -item.quantity } },
          updateOptions
        );
      }

      // Create order
      const order = new Order({
        customerId: userId,
        items: orderItems,
        totalAmount,
        status: OrderStatus.PENDING,
        shippingAddress,
      });

      const saveOptions = session ? { session } : {};
      await order.save(saveOptions);

      // Format response according to API specification
      const response = {
        orderId: order._id,
        status: order.status,
        totalAmount: order.totalAmount,
        items: order.items.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      sendSuccess(res, response, "Order created successfully", 201);
    };

    if (session) {
      await session.withTransaction(executeOrder);
    } else {
      await executeOrder();
    }
  } catch (error) {
    next(error);
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};
