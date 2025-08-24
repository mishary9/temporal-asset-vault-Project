import { Router } from 'express';
import { authenticateToken } from '../handlers/authValidator';
import {
  getAssetsHandler,
  depositHandler,
  withdrawHandler,
} from '../handlers/assets';

const router = Router();
router.get('/', authenticateToken, getAssetsHandler);
router.post('/deposit', authenticateToken, depositHandler);
router.post('/withdraw', authenticateToken, withdrawHandler);

export default router;
