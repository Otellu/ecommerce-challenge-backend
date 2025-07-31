import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { sendError } from "@/utils/response";

export interface ValidationSchema {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}

export const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const validationOptions = {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    };

    const errors: string[] = [];

    // Validate body
    if (schema.body) {
      const { error } = schema.body.validate(req.body, validationOptions);
      if (error) {
        errors.push(...error.details.map((detail: any) => detail.message));
      }
    }

    // Validate query
    if (schema.query) {
      const { error } = schema.query.validate(req.query, validationOptions);
      if (error) {
        errors.push(...error.details.map((detail: any) => detail.message));
      }
    }

    // Validate params
    if (schema.params) {
      const { error } = schema.params.validate(req.params, validationOptions);
      if (error) {
        errors.push(...error.details.map((detail: any) => detail.message));
      }
    }

    if (errors.length > 0) {
      sendError(res, errors.join(", "), 400);
      return;
    }

    next();
  };
};
