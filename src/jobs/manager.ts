import { logger, LOG_LEVELS } from '../../winston';
import { getAllExchanges } from '../controllers/exchange-controller';
import { getTickersArray } from '../helpers/utils';
import schedule from 'node-schedule';

import { tickerUpdate } from './UpdateService';
import { getBinanceTickerPrice } from '../lib/binance-price-interval';

export default async function createUpdateSchedule() {
     try {
          const exchanges = await getAllExchanges();
          const tickers = getTickersArray(exchanges);
          const candleSchedule = schedule.scheduleJob(
               '*/59 * * * * *',
               function () {
                    for (let i = 0; i < tickers.length - 1; i++) {
                         tickerUpdate(tickers[i]);
                    }
               }
          );
          const priceJob = schedule.scheduleJob('*/5 * * * * *', function () {
               getBinanceTickerPrice();
          });
     } catch (err: any) {
          logger(
               LOG_LEVELS.ERROR,
               'error while creating update schedule, Error: ' + err,
               'history-provider/jobs/manager.ts'
          );
     }
}
