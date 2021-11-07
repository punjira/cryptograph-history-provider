import express from 'express';
const app = express();
import cors from 'cors';
app.use(cors());
import { MongoConnect } from './database/mongo';
import manager from './jobs/manager';
require('./nats/subscription');
// import { redisClient } from './redis/redis-clinet';

// redisClient.getInstance().getClient();

// import { feedInitialData } from './lib/binance-initial-history';
// import { createSchedule } from './lib/binance-schedule-coins';
// feedInitialData();
// createSchedule();
MongoConnect(() => {
     manager();
});

import historyRoutes from './routes/history-routes';
import priceRoutes from './routes/price-routes';

app.use('/history', historyRoutes);
app.use('/price', priceRoutes);

app.listen(process.env.PORT, () => {
     console.log('server is up on port ', process.env.PORT);
});
