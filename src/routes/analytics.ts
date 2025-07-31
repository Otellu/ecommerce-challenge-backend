import { Router } from "express";
import Joi from "joi";
import * as analyticsController from "@/controllers/analyticsController";
import { validate, authenticate, authorizeSeller } from "@/middleware";

const router = Router();

/**
 * Analytics Routes
 * Handles sales analytics and reporting (Seller only)
 */

const salesAnalyticsValidation = {
  query: Joi.object({
    dateFrom: Joi.date().iso().required().messages({
      "date.base": "Date from must be a valid date",
      "date.format": "Date from must be in ISO format (YYYY-MM-DD)",
      "any.required": "Date from is required",
    }),
    dateTo: Joi.date().iso().min(Joi.ref("dateFrom")).required().messages({
      "date.base": "Date to must be a valid date",
      "date.format": "Date to must be in ISO format (YYYY-MM-DD)",
      "date.min": "Date to must be after or equal to date from",
      "any.required": "Date to is required",
    }),
  }),
};

// Routes
router.get(
  "/sales",
  authenticate,
  authorizeSeller,
  validate(salesAnalyticsValidation),
  analyticsController.getSalesAnalytics
);

export default router;
