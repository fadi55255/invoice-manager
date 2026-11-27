import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../shared/errors.js';

const VALID_ROLES = ['admin', 'accountant', 'viewer'];

export function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    try {
      const decoded = jwt.verify(token, env.jwtSecret);
      const roleCandidate = String(
        decoded.role || decoded.user_metadata?.role || 'viewer'
      ).toLowerCase();

      const role = VALID_ROLES.includes(roleCandidate)
        ? roleCandidate
        : 'viewer';

      req.user = {
        id: decoded.sub || decoded.id || '00000000-0000-0000-0000-000000000000',
        email: decoded.email || 'unknown@local',
        role,
      };
      return next();
    } catch {
      return next(
        new AppError(401, 'Token JWT invalide ou expiré.', 'INVALID_TOKEN')
      );
    }
  }

  if (env.devBypassAuth) {
    const headerRole = String(
      req.headers['x-dev-role'] || 'admin'
    ).toLowerCase();
    const role = VALID_ROLES.includes(headerRole) ? headerRole : 'admin';

    req.user = {
      id: '00000000-0000-4000-8000-000000000001',
      email: 'sara@masociete.dz',
      role,
    };
    return next();
  }

  return next(new AppError(401, 'Authentification requise.', 'UNAUTHORIZED'));
}

export function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(
        new AppError(401, 'Authentification requise.', 'UNAUTHORIZED')
      );
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          403,
          "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
          'FORBIDDEN',
          { requiredRoles: allowedRoles, currentRole: req.user.role }
        )
      );
    }
    return next();
  };
}
