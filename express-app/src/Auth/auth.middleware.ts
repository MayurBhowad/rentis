/// <reference path="../types/express.d.ts" />
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../user/User.model';

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token: string | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ message: 'Server configuration error' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as { id: string };
    const user = await User.findById(decoded.id).lean();
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};
