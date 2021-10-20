import express from 'express';
const router = express.Router();

import { getCandles } from '../controllers/history-controller';

router.get('/', getCandles);

export default router;
