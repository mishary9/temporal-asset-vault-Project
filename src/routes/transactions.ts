import { Router } from 'express';
import { authenticateToken } from '../handlers/authValidator';
import { getTransactionsHandler } from '../handlers/transaction';

const router = Router();
router.get(
  '/transactions/:workflowId',
  authenticateToken,
  getTransactionsHandler
);

export default router;
