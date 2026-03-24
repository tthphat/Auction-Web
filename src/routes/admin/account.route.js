import express from 'express';
import { accountController } from '../../controllers/account.controller.js';
const router = express.Router();

// Define your admin category routes here
// router.get('/profile', (req, res) => {
//     res.render('vwAdmin/account/profile');
// });

router.get('/profile', accountController.getProfile);

export default router;