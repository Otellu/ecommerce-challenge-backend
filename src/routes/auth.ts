import { Router } from "express";
import Joi from "joi";
import * as authController from "@/controllers/authController";
import { validate } from "@/middleware";

const router = Router();

const registerValidation = {
  body: Joi.object({
    name: Joi.string().min(2).max(50).required().messages({
      "string.min": "Name must be at least 2 characters long",
      "string.max": "Name cannot exceed 50 characters",
      "any.required": "Name is required",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
    password: Joi.string().min(6).required().messages({
      "string.min": "Password must be at least 6 characters long",
      "any.required": "Password is required",
    }),
    role: Joi.string().valid("customer", "seller").required().messages({
      "any.only": "Role must be either 'customer' or 'seller'",
      "any.required": "Role is required",
    }),
  }),
};

router.post("/register", validate(registerValidation), authController.register);

export default router;
