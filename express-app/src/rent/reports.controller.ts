import type { Request, Response } from 'express';
import { getReportSummary } from './reports.service';

export async function summary(_req: Request, res: Response): Promise<void> {
  const data = await getReportSummary();
  res.json(data);
}
