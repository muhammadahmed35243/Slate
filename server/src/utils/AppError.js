export class AppError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_ERROR', details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(msg = 'Bad request', details) { return new AppError(msg, 400, 'BAD_REQUEST', details); }
  static unauthorized(msg = 'Not authenticated') { return new AppError(msg, 401, 'UNAUTHORIZED'); }
  static forbidden(msg = 'Not allowed') { return new AppError(msg, 403, 'FORBIDDEN'); }
  static notFound(msg = 'Not found') { return new AppError(msg, 404, 'NOT_FOUND'); }
  static conflict(msg = 'Conflict') { return new AppError(msg, 409, 'CONFLICT'); }
}
