/**
 * feed data base with the latest 200 candles for each exchange available in database
 */

import { ExchangeModel } from '../models/exchange-model';
import { Exchange } from '@cryptograph-app/shared-models';
import { logger, LOG_LEVELS } from '../../winston';
import { getBinanceKLines } from '../service/binance';
import { redisClient } from '../redis/redis-clinet';
import { promisify } from 'util';

import { createSchedule } from './binance-schedule-coins';

const file_location = 'history-provider/lib/binance-initial-history.ts';

const intervals = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '1d'];

export async function feedInitialData() {
     try {
          const exchanges = await ExchangeModel.find({});
          logger(
               LOG_LEVELS.INFO,
               'fetching binance klines for ' + exchanges.length + ' data',
               file_location
          );
          // await queue([
          //      { ticker: 'btcusdt' },
          //      { ticker: 'ethusdt' },
          //      // { ticker: 'bnbusdt' },
          //      // { ticker: 'adausdt' },
          //      // { ticker: 'xrpusdt' },
          //      // { ticker: 'solusdt' },
          //      // { ticker: 'dotusdt' },
          //      // { ticker: 'dogeusdt' },
          //      // { ticker: 'usdcusdt' },
          //      // { ticker: 'lunausdt' },
          // ]);
          await queue(exchanges);
          createSchedule();
          console.log('all done!, the updating process should only start now');
     } catch (err) {
          logger(
               LOG_LEVELS.ERROR,
               'error while reading exchanges. Error: ' + err,
               file_location
          );
          return;
     }
}

async function queue(items: Exchange[]) {
     for (let item of items) {
          for (let interval of intervals) {
               logger(
                    LOG_LEVELS.INFO,
                    'fetching data for <<' +
                         item.ticker +
                         '>> on the ' +
                         interval +
                         ' interval',
                    file_location
               );
               await fetchAndWrite(item.ticker, interval);
          }
     }
}

async function fetchAndWrite(symbol: string, interval: string) {
     try {
          const data = await getBinanceKLines(symbol, interval, 200);
          await write(symbol, interval, data);
     } catch (err) {
          logger(
               LOG_LEVELS.ERROR,
               'error while fetching klines for ' +
                    symbol +
                    ' on the ' +
                    interval +
                    ' interval, Error: ' +
                    err,
               file_location
          );
     }
}

async function write(
     symbol: string,
     interval: string,
     data: (string | number)[][]
) {
     const client = redisClient.getInstance().getClient();
     const asyncHSET = promisify(client.hset).bind(client);
     for (let one of data) {
          const number_converted = one.map((el) => Number(el));
          await asyncHSET(
               `${symbol}-${interval}`,
               String(one[0]),
               JSON.stringify(number_converted)
          );
     }
}
