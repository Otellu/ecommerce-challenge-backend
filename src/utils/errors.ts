import { AppError } from "@/utils/types";

/**
 * Custom error classes for better error handling
 * Provides structured error responses with appropriate HTTP status codes
 */

/**
 * Base application error class
 */
export class ApplicationError extends Error implements AppError {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request Error
 */
export class BadRequestError extends ApplicationError {
  constructor(message = "Bad Request") {
    super(message, 400);
  }
}

/**
 * 401 Unauthorized Error
 */
export class UnauthorizedError extends ApplicationError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

/**
 * 403 Forbidden Error
 */
export class ForbiddenError extends ApplicationError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

/**
 * 404 Not Found Error
 */
export class NotFoundError extends ApplicationError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

/**
 * 409 Conflict Error
 */
export class ConflictError extends ApplicationError {
  constructor(message = "Resource conflict") {
    super(message, 409);
  }
}

/**
 * 422 Unprocessable Entity Error
 */
export class ValidationError extends ApplicationError {
  constructor(message = "Validation failed") {
    super(message, 422);
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends ApplicationError {
  constructor(message = "Internal server error") {
    super(message, 500);
  }
}
