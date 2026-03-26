import express from 'express';
import { userController } from '../../controllers/user.controller.js';

const router = express.Router();

router.get('/list', userController.getList);
router.get('/detail/:id', userController.getById);

router.get('/add', userController.add);
router.post('/add', userController.addUser);

router.get('/edit/:id', userController.editByID);
router.post('/edit', userController.update);

router.post('/reset-password', userController.resetPassword);
router.post('/delete', userController.delete);

router.get('/upgrade-requests', userController.getUpgradeRequests);
router.post('/upgrade/approve', userController.approveUpgrade);
router.post('/upgrade/reject', userController.rejectUpgrade);

export default router;