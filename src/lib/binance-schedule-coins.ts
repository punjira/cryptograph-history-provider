import schedule from 'node-schedule';
import { updateFromBinance } from './binance-interval';

export function createSchedule() {
     const job = schedule.scheduleJob('*/10 * * * * *', function () {
          updateFromBinance(['btcusdt', 'ethusdt', 'trxusdt']);
     });
}
