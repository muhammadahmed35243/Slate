import { AppError } from '../utils/AppError.js';

// Usage: validate({ body: zodSchema, query: zodSchema, params: zodSchema })
// Parsed (coerced/defaulted) values are placed on req.valid.
export const validate = (schemas) => (req, _res, next) => {
  req.valid = {};
  for (const key of ['params', 'query', 'body']) {
    if (!schemas[key]) continue;
    const result = schemas[key].safeParse(req[key]);
    if (!result.success) {
      return next(AppError.badRequest('Validation failed', result.error.flatten()));
    }
    req.valid[key] = result.data;
  }
  next();
};
