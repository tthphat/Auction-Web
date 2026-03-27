import express from 'express';
import { accountController } from '../../container.js';
const router = express.Router();

router.get('/profile', accountController.getProfile);

export default router;