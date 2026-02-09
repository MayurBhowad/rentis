import { Charge } from './Charge.model';
import { Payment } from './Payment.model';
import { Resident } from './Resident.model';

export interface MonthlyCollection {
  month: string; // YYYY-MM
  total: number;
}

export interface OutstandingDue {
  residentId: string;
  amount: number;
}

export interface PropertyIncome {
  propertyId: string;
  total: number;
}

export interface ReportSummary {
  monthlyCollection: MonthlyCollection[];
  outstandingDues: OutstandingDue[];
  propertyWiseIncome: PropertyIncome[];
}

export async function getReportSummary(): Promise<ReportSummary> {
  const charges = await Charge.find({}).lean();
  const payments = await Payment.find({}).lean();
  const residents = await Resident.find({}).select('_id propertyId').lean();

  const paidByCharge = new Map<string, number>();
  for (const c of charges) {
    paidByCharge.set(c._id.toString(), c.paidAmount);
  }

  const monthlyByMonth = new Map<string, number>();
  for (const p of payments) {
    const month = (p.date as Date).toISOString().slice(0, 7);
    monthlyByMonth.set(month, (monthlyByMonth.get(month) ?? 0) + p.amount);
  }
  const monthlyCollection: MonthlyCollection[] = Array.from(monthlyByMonth.entries())
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const outstandingByResident = new Map<string, number>();
  for (const c of charges) {
    const balance = c.amount - (c.paidAmount ?? 0);
    if (balance > 0) {
      const rid = c.residentId.toString();
      outstandingByResident.set(rid, (outstandingByResident.get(rid) ?? 0) + balance);
    }
  }
  const outstandingDues: OutstandingDue[] = Array.from(outstandingByResident.entries()).map(
    ([residentId, amount]) => ({ residentId, amount })
  );

  const incomeByProperty = new Map<string, number>();
  for (const p of payments) {
    const res = residents.find((r) => r._id.equals(p.residentId));
    const pid = res?.propertyId?.toString() ?? 'unassigned';
    incomeByProperty.set(pid, (incomeByProperty.get(pid) ?? 0) + p.amount);
  }
  const propertyWiseIncome: PropertyIncome[] = Array.from(incomeByProperty.entries()).map(
    ([propertyId, total]) => ({ propertyId, total })
  );

  return { monthlyCollection, outstandingDues, propertyWiseIncome };
}
