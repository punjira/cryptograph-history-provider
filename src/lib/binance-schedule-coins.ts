import schedule from 'node-schedule';
import { updateFromBinance } from './binance-interval';
import { getBinanceTickerPrice } from './binance-price-interval';

export function createSchedule() {
     const candleJob = schedule.scheduleJob('*/59 * * * * *', function () {
          updateFromBinance([
               'btcusdt',
               'ethusdt',
               'trxusdt',
               'ltcusdt',
               'shibusdt',
          ]);
     });
     const priceJob = schedule.scheduleJob('*/5 * * * * *', function () {
          getBinanceTickerPrice();
     });
     // really getting tempted to call something BoobJob here!
}
