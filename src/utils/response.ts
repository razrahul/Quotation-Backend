// src/utils/response.ts
import { Response } from "express";

export function success(res: Response, message: string, data?: any , status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data
  });
}

export function error(res: Response, message: string, status = 400,  error?: any) {
  return res.status(status).json({
    success: false,
    message,
    error
  });
}
