import express from 'express';
import { systemController } from '../../controllers/system.controller.js';

const router = express.Router();

router.get('/settings', systemController.getSettings);
router.post('/settings', systemController.updateSettings);

export default router;
