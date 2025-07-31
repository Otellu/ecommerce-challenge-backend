import { Request, Response, NextFunction } from "express";
import { Order } from "@/models";

import { BadRequestError } from "@/utils/errors";
import { OrderStatus } from "@/utils/types";

/**
 * Analytics Controller
 * Handles sales analytics and reporting using MongoDB aggregation pipelines
 */

/**
 * Get sales analytics for date range
 * GET /api/analytics/sales
 */
export const getSalesAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract and validate date range
    const fromDate = req.query.dateFrom
      ? new Date(req.query.dateFrom as string)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const toDate = req.query.dateTo
      ? new Date(req.query.dateTo as string)
      : new Date();

    if (fromDate >= toDate) {
      throw new BadRequestError("From date must be before to date");
    }

    // Define completed order statuses for revenue calculation
    const completedStatuses = [
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ];

    // Aggregation pipeline for sales analytics
    const analyticsResult = await Order.aggregate([
      // Match orders in date range with completed status
      {
        $match: {
          createdAt: { $gte: fromDate, $lte: toDate },
          status: { $in: completedStatuses },
        },
      },

      // Unwind items array to analyze individual products
      {
        $unwind: "$items",
      },

      // Group to calculate metrics
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $addToSet: "$_id" }, // Count unique orders
          totalItemsSold: { $sum: "$items.quantity" },

          // Group by product to find most sold
          productSales: {
            $push: {
              productId: "$items.productId",
              productName: "$items.name",
              quantity: "$items.quantity",
              revenue: "$items.totalPrice",
            },
          },

          // Collect order totals for average calculation
          orderTotals: { $push: "$totalAmount" },
        },
      },

      // Calculate derived metrics
      {
        $project: {
          totalRevenue: 1,
          totalOrders: { $size: "$totalOrders" },
          totalItemsSold: 1,
          productSales: 1,
          orderTotals: 1,
          averageOrderValue: { $avg: "$orderTotals" },
        },
      },
    ]);

    // If no sales data found
    if (!analyticsResult.length) {
      const response = {
        dateRange: {
          from: fromDate.toISOString().split("T")[0],
          to: toDate.toISOString().split("T")[0],
        },
        totalRevenue: 0,
        mostSoldProduct: null,
        averageOrderValue: 0,
      };

      res.status(200).json({
        success: true,
        ...response,
      });
      return;
    }

    const analytics = analyticsResult[0];

    // Find most sold product
    const productSalesMap = new Map();

    analytics.productSales.forEach((sale: any) => {
      const productId = sale.productId.toString();

      if (productSalesMap.has(productId)) {
        const existing = productSalesMap.get(productId);
        existing.quantity += sale.quantity;
        existing.revenue += sale.revenue;
      } else {
        productSalesMap.set(productId, {
          productId: productId,
          name: sale.productName,
          quantity: sale.quantity,
          revenue: sale.revenue,
        });
      }
    });

    // Find product with highest sales quantity
    let mostSoldProduct = null;
    let maxQuantity = 0;

    for (const product of productSalesMap.values()) {
      if (product.quantity > maxQuantity) {
        maxQuantity = product.quantity;
        mostSoldProduct = {
          productId: product.productId,
          name: product.name,
          unitsSold: product.quantity,
        };
      }
    }

    // Format response according to API specification
    const response = {
      dateRange: {
        from: fromDate.toISOString().split("T")[0],
        to: toDate.toISOString().split("T")[0],
      },
      totalRevenue: Math.round(analytics.totalRevenue * 100) / 100, // Round to 2 decimal places
      mostSoldProduct,
      averageOrderValue: Math.round(analytics.averageOrderValue * 100) / 100, // Round to 2 decimal places
    };

    res.status(200).json({
      success: true,
      ...response,
    });
  } catch (error) {
    next(error);
  }
};
