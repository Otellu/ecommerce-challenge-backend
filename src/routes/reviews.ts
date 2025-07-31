import { Router } from "express";
import Joi from "joi";
import * as reviewController from "@/controllers/reviewController";
import { validate, authenticate, authorizeCustomer } from "@/middleware";

const router = Router();

/**
 * Review Routes
 * Handles product review creation and retrieval
 */

const createReviewValidation = {
  body: Joi.object({
    productId: Joi.string().hex().length(24).required().messages({
      "string.hex": "Product ID must be a valid MongoDB ObjectId",
      "string.length": "Product ID must be 24 characters long",
      "any.required": "Product ID is required",
    }),
    orderId: Joi.string().hex().length(24).required().messages({
      "string.hex": "Order ID must be a valid MongoDB ObjectId",
      "string.length": "Order ID must be 24 characters long",
      "any.required": "Order ID is required",
    }),
    rating: Joi.number().integer().min(1).max(5).required().messages({
      "number.base": "Rating must be a number",
      "number.integer": "Rating must be an integer",
      "number.min": "Rating must be at least 1",
      "number.max": "Rating cannot exceed 5",
      "any.required": "Rating is required",
    }),
    comment: Joi.string().max(1000).allow("", null).messages({
      "string.max": "Comment cannot exceed 1000 characters",
    }),
  }),
};

router.post(
  "/",
  authenticate,
  authorizeCustomer,
  validate(createReviewValidation),
  reviewController.createReview
);

export default router;
