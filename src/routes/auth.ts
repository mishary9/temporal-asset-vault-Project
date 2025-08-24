import { Router } from 'express';
import { loginHandler, registerHandler } from '../handlers/auth';
import {
  loginValidator,
  registerValidator,
  validate,
} from '../handlers/authValidator';

const router = Router();

router.post('/login', loginValidator, validate, loginHandler);
router.post('/register', registerValidator, validate, registerHandler);

export default router;
