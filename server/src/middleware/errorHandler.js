import { ZodError } from 'zod';
import { AppError } from '../shared/errors.js';

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route introuvable : ${req.method} ${req.originalUrl}`,
    },
  });
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError || (err?.name === 'ZodError' && Array.isArray(err.issues))) {
    const fieldErrors = {};
    for (const issue of err.issues) {
      const key = issue.path?.join('.') || 'body';
      if (!fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Certains champs sont invalides.',
        details: fieldErrors,
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  if (err?.code === '23505') {
    res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: 'Un enregistrement avec cette valeur existe déjà.',
      },
    });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Une erreur interne est survenue.',
    },
  });
}
