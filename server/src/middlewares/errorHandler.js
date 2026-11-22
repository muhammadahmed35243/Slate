import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

export const notFound = (req, _res, next) =>
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));

// Postgres error codes we translate into friendly HTTP errors.
const PG_ERRORS = {
  '23505': [409, 'CONFLICT', 'Already exists'],
  '23503': [400, 'BAD_REFERENCE', 'Referenced record does not exist'],
  '42501': [403, 'FORBIDDEN', 'Not allowed'],
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  let { status = 500, code = 'INTERNAL_ERROR', message, details } = err;

  if (!(err instanceof AppError) && PG_ERRORS[err.code]) {
    [status, code, message] = PG_ERRORS[err.code];
  }
  if (status >= 500) console.error(err);

  res.status(status).json({
    error: {
      code,
      message: status >= 500 && env.NODE_ENV === 'production' ? 'Something went wrong' : message,
      ...(details && { details }),
    },
  });
};
