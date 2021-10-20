/**
 * feed data base with the latest 200 candles for each exchange available in database
 */

import { Exchange, ExchangeModel } from '../models/exchange-model';
import { logger, LOG_LEVELS } from '../../winston';
import { getBinanceKLines } from '../service/binance';
import { redisClient } from '../redis/redis-clinet';

const file_location = 'history-provider/lib/binance-initial-history.ts';

const intervals = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '1d'];

export async function feedInitialData() {
     ExchangeModel.find({}, function (err, result) {
          logger(
               LOG_LEVELS.INFO,
               'fetching binance klines for ' + result.length + ' data',
               file_location
          );
          if (err) {
               logger(
                    LOG_LEVELS.ERROR,
                    'error while reading exchanges. Error: ' + err,
                    file_location
               );
               return;
          }
          // queue(result);
          queue([
               { ticker: 'btcusdt' },
               { ticker: 'ethusdt' },
               { ticker: 'trxusdt' },
          ]);
     });
}

async function queue(items: Exchange[]) {
     for (let item of items) {
          for (let interval of intervals) {
               logger(
                    LOG_LEVELS.INFO,
                    'fetching data for ' +
                         item.ticker +
                         ' on the ' +
                         interval +
                         ' interval',
                    file_location
               );
               const data = await fetch(item.ticker, interval);
          }
     }
}

async function fetch(symbol: string, interval: string) {
     try {
          const data = await getBinanceKLines(symbol, interval, 200);
          write(symbol, interval, data);
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
     for (let one of data) {
          const number_converted = one.map((el) => Number(el));
          client.hset(
               `${symbol}-${interval}`,
               String(one[0]),
               JSON.stringify(number_converted)
          );
     }
}
