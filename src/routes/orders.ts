import { Router } from "express";
import Joi from "joi";
import * as orderController from "@/controllers/orderController";
import { validate, authenticate, authorizeCustomer } from "@/middleware";

const router = Router();

/**
 * Order Routes
 * Handles order creation, tracking, and management
 */

const createOrderValidation = {
  body: Joi.object({
    items: Joi.array()
      .items(
        Joi.object({
          productId: Joi.string().hex().length(24).required().messages({
            "string.hex": "Product ID must be a valid MongoDB ObjectId",
            "string.length": "Product ID must be 24 characters long",
            "any.required": "Product ID is required",
          }),
          quantity: Joi.number().integer().min(1).required().messages({
            "number.base": "Quantity must be a number",
            "number.integer": "Quantity must be an integer",
            "number.min": "Quantity must be at least 1",
            "any.required": "Quantity is required",
          }),
        })
      )
      .min(1)
      .required()
      .messages({
        "array.min": "At least one item is required",
        "any.required": "Items are required",
      }),
    shippingAddress: Joi.object({
      street: Joi.string().min(5).max(200).required().messages({
        "string.min": "Street address must be at least 5 characters long",
        "string.max": "Street address cannot exceed 200 characters",
        "any.required": "Street address is required",
      }),
      city: Joi.string().min(2).max(100).required().messages({
        "string.min": "City must be at least 2 characters long",
        "string.max": "City cannot exceed 100 characters",
        "any.required": "City is required",
      }),
      state: Joi.string().min(2).max(50).required().messages({
        "string.min": "State must be at least 2 characters long",
        "string.max": "State cannot exceed 50 characters",
        "any.required": "State is required",
      }),
      zipCode: Joi.string().min(3).max(20).required().messages({
        "string.min": "Zip code must be at least 3 characters long",
        "string.max": "Zip code cannot exceed 20 characters",
        "any.required": "Zip code is required",
      }),
      country: Joi.string().min(2).max(100).required().messages({
        "string.min": "Country must be at least 2 characters long",
        "string.max": "Country cannot exceed 100 characters",
        "any.required": "Country is required",
      }),
    })
      .required()
      .messages({
        "any.required": "Shipping address is required",
      }),
  }),
};

// Routes
router.post(
  "/",
  authenticate,
  authorizeCustomer,
  validate(createOrderValidation),
  orderController.createOrder
);

export default router;
