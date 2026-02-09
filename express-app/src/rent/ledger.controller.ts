import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { getLedger } from './ledger.service';

export async function get(req: Request, res: Response): Promise<void> {
  const tenant_id = req.query.tenant_id as string | undefined;
  const property_id = req.query.property_id as string | undefined;
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;

  const residentId =
    tenant_id && mongoose.Types.ObjectId.isValid(tenant_id)
      ? new mongoose.Types.ObjectId(tenant_id)
      : undefined;
  const propertyId =
    property_id && mongoose.Types.ObjectId.isValid(property_id)
      ? new mongoose.Types.ObjectId(property_id)
      : undefined;

  const entries = await getLedger({ residentId, propertyId, from, to });
  const serialized = entries.map((e) => ({
    ...e,
    residentId: e.residentId.toString(),
    chargeId: e.chargeId?.toString(),
    paymentId: e.paymentId?.toString(),
  }));
  res.json(serialized);
}
