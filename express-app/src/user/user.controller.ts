import type { Request, Response } from 'express';

export const getMe = (req: Request, res: Response): void => {
  res.json({ user: req.user });
};
