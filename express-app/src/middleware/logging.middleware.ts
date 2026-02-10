import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { apiLogger } from '../config/logger';

const USER_CONTEXT_PLACEHOLDER = 'single-admin';

/**
 * Logging middleware: assigns request_id and logs each API request with method, path,
 * response status, execution time, and user context. Do not log request bodies.
 */
export function loggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = randomUUID();
  req.requestId = requestId;
  req.requestStartTime = Date.now();

  res.on('finish', () => {
    const durationMs = req.requestStartTime != null ? Date.now() - req.requestStartTime : 0;
    const userContext = req.user?.email ?? USER_CONTEXT_PLACEHOLDER;

    const logData = {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs,
      userContext,
    };

    if (res.statusCode >= 500) {
      apiLogger.error({ ...logData, msg: 'Request completed with server error' });
    } else if (res.statusCode >= 400) {
      apiLogger.warn({ ...logData, msg: 'Request completed with client error' });
    } else {
      apiLogger.info({ ...logData, msg: 'Request completed' });
    }
  });

  next();
}
