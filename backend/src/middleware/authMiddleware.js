import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;

    const token = req.cookies?.token || req.cookies?.jwt || bearerToken;

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized: Authentication token is missing.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id ?? decoded.userId,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role,
    };

    if (!req.user.id || !req.user.role) {
      return res.status(401).json({
        error: 'Unauthorized: Malformed token payload.',
      });
    }

    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized: Token has expired.',
      });
    }
    return res.status(401).json({
      error: 'Unauthorized: Invalid token.',
    });
  }
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized: Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden: Insufficient permissions for this resource.',
      });
    }

    return next();
  };
};