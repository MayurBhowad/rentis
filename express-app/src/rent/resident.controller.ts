import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Resident } from './Resident.model';

export async function list(_req: Request, res: Response): Promise<void> {
  const list = await Resident.find({}).populate('propertyId', 'name address').sort({ name: 1 }).lean();
  res.json(list);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: 'Invalid id' });
    return;
  }
  const doc = await Resident.findById(id).populate('propertyId', 'name address').lean();
  if (!doc) {
    res.status(404).json({ message: 'Tenant not found' });
    return;
  }
  res.json(doc);
}

export async function create(req: Request, res: Response): Promise<void> {
  const { name, propertyId } = req.body as { name?: string; propertyId?: string };
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ message: 'name is required' });
    return;
  }
  const data: { name: string; propertyId?: mongoose.Types.ObjectId } = { name: name.trim() };
  if (propertyId && mongoose.Types.ObjectId.isValid(propertyId)) {
    data.propertyId = new mongoose.Types.ObjectId(propertyId);
  }
  const doc = await Resident.create(data);
  res.status(201).json(doc);
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: 'Invalid id' });
    return;
  }
  const { propertyId } = req.body as { propertyId?: string | null };
  const update: { propertyId: mongoose.Types.ObjectId | null } = { propertyId: null };
  if (propertyId !== undefined && propertyId !== null && propertyId !== '') {
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      res.status(400).json({ message: 'Invalid propertyId' });
      return;
    }
    update.propertyId = new mongoose.Types.ObjectId(propertyId);
  }
  const doc = await Resident.findByIdAndUpdate(id, update, { new: true }).populate('propertyId', 'name address').lean();
  if (!doc) {
    res.status(404).json({ message: 'Tenant not found' });
    return;
  }
  res.json(doc);
}
