import express from 'express';
import { homeController } from '../container.js';

const router = express.Router();

router.get('/', homeController.getHomePage);

export default router;
