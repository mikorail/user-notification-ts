// utils/ErrorUtils.ts
import { Response } from 'express';

export class ErrorUtils {
  static sendError(res: Response, statusCode: number, message: string) {
    res.status(statusCode).json({ error: message });
  }
}
