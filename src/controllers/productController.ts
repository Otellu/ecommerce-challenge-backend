import { Request, Response, NextFunction } from "express";
import { Product, Review } from "@/models";
import { sendSuccess } from "@/utils/response";
import { NotFoundError } from "@/utils/errors";
import { AuthenticatedRequest } from "@/utils/types";

/**
 * Product Controller
 * Handles product CRUD operations and search functionality
 */

/**
 * Get products with filters and pagination
 * GET /api/products
 */
export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100); // Max 100 items per page
    const search = req.query.search as string;
    const category = req.query.category as string;
    const minPrice = req.query.minPrice
      ? parseFloat(req.query.minPrice as string)
      : undefined;
    const maxPrice = req.query.maxPrice
      ? parseFloat(req.query.maxPrice as string)
      : undefined;
    const sellerId = req.query.sellerId as string;
    const sort = (req.query.sort as string) || "createdAt";
    const order = req.query.order === "asc" ? 1 : -1;

    // Build filter object
    const filters: any = {
      isActive: true,
      isDeleted: false,
    };

    if (category) {
      filters.category = { $regex: category, $options: "i" };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filters.price = {};
      if (minPrice !== undefined) filters.price.$gte = minPrice;
      if (maxPrice !== undefined) filters.price.$lte = maxPrice;
    }

    if (sellerId) {
      filters.sellerId = sellerId;
    }

    // Build query
    let query = Product.find(filters);

    // Add text search if provided
    if (search) {
      query = Product.find({
        ...filters,
        $text: { $search: search },
      });
    }

    // Add sorting
    const sortOptions: any = {};
    sortOptions[sort] = order;

    // Add text search score for relevance sorting
    if (search) {
      sortOptions.score = { $meta: "textScore" };
    }

    // Execute query with pagination
    const [products, totalResults] = await Promise.all([
      query
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("sellerId", "name")
        .lean(),
      Product.countDocuments(
        search ? { ...filters, $text: { $search: search } } : filters
      ),
    ]);

    // Get review statistics for all products
    const productIds = products.map((product) => product._id);
    const reviewStats = await Review.aggregate([
      {
        $match: {
          productId: { $in: productIds },
        },
      },
      {
        $group: {
          _id: "$productId",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    // Create a map for quick lookup
    const reviewMap = new Map();
    reviewStats.forEach((stat) => {
      reviewMap.set(stat._id.toString(), {
        rating: Math.round(stat.averageRating * 10) / 10,
        totalReviews: stat.totalReviews,
      });
    });

    // Format products for response
    const formattedProducts = products.map((product) => {
      const reviewData = reviewMap.get(product._id.toString()) || {
        rating: 0,
        totalReviews: 0,
      };

      return {
        id: product._id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        category: product.category,
        images: product.images,
        rating: reviewData.rating,
        totalReviews: reviewData.totalReviews,
      };
    });

    // Send response in required format
    res.status(200).json({
      success: true,
      page,
      limit,
      totalResults,
      products: formattedProducts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new product (Seller only)
 * POST /api/products
 */
export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = (req as AuthenticatedRequest).user!;
    const { name, description, price, stock, category, images } = req.body;

    const product = new Product({
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      stock: parseInt(stock),
      category: category.trim(),
      images: images || [],
      sellerId: userId,
    });

    await product.save();

    sendSuccess(
      res,
      {
        productId: product._id,
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
 */
export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId } = (req as AuthenticatedRequest).user!;

    // Find product and verify ownership
    const product = await Product.findOne({
      _id: id,
      sellerId: userId,
      isDeleted: false,
    });

    if (!product) {
      throw new NotFoundError(
        "Product not found or you do not have permission to delete it"
      );
    }

    // Soft delete
    await product.softDelete();

    sendSuccess(res, undefined, "Product soft-deleted successfully");
  } catch (error) {
    next(error);
  }
};
