import express from 'express';
const router = express.Router();

import { getPrice } from '../controllers/price-controller';

router.get('/:ticker?', getPrice);

export default router;
