import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { ApplicationError } from "@/utils/errors";
import { sendError } from "@/utils/response";

/**
 * Global error handling middleware
 * Catches and formats all application errors
 */
export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  let statusCode = 500;
  let message = "Internal server error";
  let errors: any = undefined;

  // Handle application errors
  if (error instanceof ApplicationError) {
    statusCode = error.statusCode;
    message = error.message;
  }

  // Handle Mongoose validation errors
  else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 422;
    message = "Validation failed";
    errors = Object.values(error.errors).map((err) => ({
      field: err.path,
      message: err.message,
      value: (err as any).value,
    }));
  }

  // Handle Mongoose cast errors (invalid ObjectId)
  else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = "Invalid ID format";
  }

  // Handle MongoDB duplicate key errors
  else if (error.name === "MongoServerError" && (error as any).code === 11000) {
    statusCode = 409;
    const field = Object.keys((error as any).keyValue)[0];
    message = `${field} already exists`;
  }

  // Handle JWT errors
  else if (
    error.name === "JsonWebTokenError" ||
    error.name === "TokenExpiredError"
  ) {
    statusCode = 401;
    message = error.message;
  }

  // Send error response
  return sendError(res, message, statusCode, errors);
};

/**
 * 404 Not Found handler
 * Catches requests to non-existent routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  return sendError(res, `Route ${req.originalUrl} not found`, 404);
};
