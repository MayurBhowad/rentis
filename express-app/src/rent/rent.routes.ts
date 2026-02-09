import { Router } from 'express';
import * as propertyController from './property.controller';
import * as residentController from './resident.controller';
import * as chargeController from './charge.controller';
import * as paymentController from './payment.controller';
import * as ledgerController from './ledger.controller';
import * as reportsController from './reports.controller';

const router = Router();

router.post('/properties', propertyController.create);
router.get('/properties', propertyController.list);

router.post('/tenants', residentController.create);
router.get('/tenants', residentController.list);
router.get('/tenants/:id', residentController.getById);
router.patch('/tenants/:id', residentController.update);

router.post('/charges', chargeController.create);
router.get('/charges', chargeController.list);

router.post('/payments', paymentController.create);
router.get('/payments', paymentController.list);
router.delete('/payments/:id', paymentController.remove);

router.get('/ledger', ledgerController.get);

router.get('/reports/summary', reportsController.summary);

export default router;
