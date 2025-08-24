import { check, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// if faced issues when trying to create a new user, try to remove this declaration in a declaration file :>
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        wallet_id: string;
        username: string;
        iat: number;
        exp: number;
      };
    }
  }
}
export const loginValidator = [
  check('username').isEmail().withMessage('Invalid email or password'),
  check('password')
    .isLength({ min: 4 })
    .withMessage('Invalid email or password'),
];

export const registerValidator = [
  check('username').isEmail().withMessage('Enter a valid email'),
  check('password')
    .isLength({ min: 4 })
    .withMessage('Password must be at least 4 characters long'),
];

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader: string | undefined = req.headers['authorization'];
  const token: string | undefined = authHeader && authHeader.split(' ')[1];
  if (token == null) {
    return res.status(401).json({ message: 'Error: No token provided.' });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || 'your-default-secret-key',
    (err: any, user: any) => {
      if (err) {
        console.error('JWT Verification Error:', err.message);
        return res
          .status(403)
          .json({ message: 'Error: Token is not valid. Please login again.' });
      }
      req.user = user;
      next();
    }
  );
};
