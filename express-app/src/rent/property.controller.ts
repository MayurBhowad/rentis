import type { Request, Response } from 'express';
import { Property } from './Property.model';

export async function list(_req: Request, res: Response): Promise<void> {
  const list = await Property.find({}).sort({ name: 1 }).lean();
  res.json(list);
}

export async function create(req: Request, res: Response): Promise<void> {
  const { name, address } = req.body as { name?: string; address?: string };
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ message: 'name is required' });
    return;
  }
  const doc = await Property.create({
    name: name.trim(),
    address: typeof address === 'string' ? address.trim() || undefined : undefined,
  });
  res.status(201).json(doc);
}
