import { Router } from "express";
import Joi from "joi";
import * as productController from "@/controllers/productController";
import { validate, authenticate, authorizeSeller } from "@/middleware";

const router = Router();

const createProductValidation = {
  body: Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      "string.min": "Product name must be at least 2 characters long",
      "string.max": "Product name cannot exceed 100 characters",
      "any.required": "Product name is required",
    }),
    description: Joi.string().min(10).max(1000).required().messages({
      "string.min": "Description must be at least 10 characters long",
      "string.max": "Description cannot exceed 1000 characters",
      "any.required": "Description is required",
    }),
    price: Joi.number().positive().precision(2).required().messages({
      "number.base": "Price must be a number",
      "number.positive": "Price must be positive",
      "number.precision": "Price can have maximum 2 decimal places",
      "any.required": "Price is required",
    }),
    stock: Joi.number().integer().min(0).required().messages({
      "number.base": "Stock must be a number",
      "number.integer": "Stock must be an integer",
      "number.min": "Stock cannot be negative",
      "any.required": "Stock is required",
    }),
    category: Joi.string().min(2).max(50).required().messages({
      "string.min": "Category must be at least 2 characters long",
      "string.max": "Category cannot exceed 50 characters",
      "any.required": "Category is required",
    }),
    images: Joi.array().items(Joi.string().uri()).min(1).max(5).messages({
      "array.min": "At least one image is required",
      "array.max": "Maximum 5 images allowed",
      "string.uri": "Image URLs must be valid URLs",
    }),
  }),
};

const productQueryValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      "number.base": "Page must be a number",
      "number.integer": "Page must be an integer",
      "number.min": "Page must be at least 1",
    }),
    limit: Joi.number().integer().min(1).max(100).default(20).messages({
      "number.base": "Limit must be a number",
      "number.integer": "Limit must be an integer",
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 100",
    }),
    category: Joi.string().min(1).max(50).messages({
      "string.min": "Category filter must be at least 1 character",
      "string.max": "Category filter cannot exceed 50 characters",
    }),
    minPrice: Joi.number().positive().precision(2).messages({
      "number.base": "Min price must be a number",
      "number.positive": "Min price must be positive",
      "number.precision": "Min price can have maximum 2 decimal places",
    }),
    maxPrice: Joi.number().positive().precision(2).messages({
      "number.base": "Max price must be a number",
      "number.positive": "Max price must be positive",
      "number.precision": "Max price can have maximum 2 decimal places",
    }),
    search: Joi.string().min(1).max(100).messages({
      "string.min": "Search query must be at least 1 character",
      "string.max": "Search query cannot exceed 100 characters",
    }),
  }),
};

const productIdValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required().messages({
      "string.hex": "Product ID must be a valid MongoDB ObjectId",
      "string.length": "Product ID must be 24 characters long",
      "any.required": "Product ID is required",
    }),
  }),
};

// Routes
router.get(
  "/",
  validate(productQueryValidation),
  productController.getProducts
);

router.post(
  "/",
  authenticate,
  authorizeSeller,
  validate(createProductValidation),
  productController.createProduct
);

router.delete(
  "/:id",
  authenticate,
  authorizeSeller,
  validate(productIdValidation),
  productController.deleteProduct
);

export default router;
