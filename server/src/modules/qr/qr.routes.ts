import { Router } from 'express';
import { QrController } from './qr.controller';
import { validateRequest } from '../../common/middleware/validate.middleware';
import { generateQrSchema, parseQrUrlSchema } from './qr.schema';

const router = Router();

router.post(
  '/generate',
  validateRequest({ body: generateQrSchema }),
  QrController.generatePlacard
);

router.get(
  '/parse',
  validateRequest({ query: parseQrUrlSchema }),
  QrController.parseUrl
);

export const qrRoutes = router;
