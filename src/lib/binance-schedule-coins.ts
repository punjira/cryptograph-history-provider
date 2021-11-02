import schedule from 'node-schedule';
import { updateFromBinance } from './binance-interval';
import { getBinanceTickerPrice } from './binance-price-interval';
import { getAllExchanges } from '../controllers/exchange-controller';
import { logger, LOG_LEVELS } from '../../winston';

export async function createSchedule() {
     try {
          const tokens = await getAllExchanges();
          const tickers = tokens.map((el) => el.ticker);
          const candleJob = schedule.scheduleJob('*/59 * * * * *', function () {
               updateFromBinance(tickers);
          });
          const priceJob = schedule.scheduleJob('*/5 * * * * *', function () {
               getBinanceTickerPrice();
          });
          // really getting tempted to call something BoobJob here!
     } catch (err) {
          logger(
               LOG_LEVELS.ERROR,
               'error while setting schedule, Error: ' + err,
               'history-provider/lib/binance-schedule-coin.ts'
          );
     }
}
