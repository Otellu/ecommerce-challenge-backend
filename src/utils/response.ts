import { Response } from "express";
import { ApiResponse } from "@/utils/types";

/**
 * Standardized API response utilities
 * Ensures consistent response format across all endpoints
 */

/**
 * Send success response
 * @param res Express response object
 * @param data Response data
 * @param message Success message
 * @param statusCode HTTP status code (default: 200)
 */
export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    ...(message && { message }),
    ...(data && { data }),
  };

  return res.status(statusCode).json(response);
};

/**
 * Send paginated success response
 * @param res Express response object
 * @param data Response data array
 * @param page Current page number
 * @param limit Items per page
 * @param totalResults Total number of results
 * @param message Success message
 */
export const sendPaginatedSuccess = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  totalResults: number,
  message?: string
): Response => {
  const response: ApiResponse<T[]> = {
    success: true,
    ...(message && { message }),
    data,
    page,
    limit,
    totalResults,
  };

  return res.status(200).json(response);
};

/**
 * Send error response
 * @param res Express response object
 * @param message Error message
 * @param statusCode HTTP status code (default: 500)
 * @param errors Additional error details
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  errors?: any
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    ...(errors && { errors }),
  };

  return res.status(statusCode).json(response);
};

/**
 * Send validation error response
 * @param res Express response object
 * @param errors Validation error details
 * @param message Custom error message
 */
export const sendValidationError = (
  res: Response,
  errors: any[],
  message = "Validation failed"
): Response => {
  return sendError(res, message, 422, errors);
};
