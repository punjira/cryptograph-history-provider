/**
 * feed data base with the latest 200 candles for each exchange available in database
 */

import { ExchangeModel } from '../models/exchange-model';
import { Exchange } from '@cryptograph-app/shared-models';
import { logger, LOG_LEVELS } from '../../winston';
import { getBinanceKLines, getBinanceKLinesWindow } from '../service/binance';
import { redisClient } from '../redis/redis-clinet';
import { promisify } from 'util';

import { createSchedule } from './binance-schedule-coins';

const file_location = 'history-provider/lib/binance-initial-history.ts';

const intervals = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '1d'];

const interval_distance = {
     '1m': 60 * 1000,
     '3m': 60 * 3 * 1000,
     '5m': 60 * 5 * 1000,
     '15m': 60 * 15 * 1000,
     '30m': 60 * 30 * 1000,
     '1h': 60 * 60 * 1000,
     '2h': 60 * 60 * 2 * 1000,
     '4h': 60 * 60 * 4 * 1000,
     '1d': 60 * 60 * 24 * 1000,
};

const client = redisClient.getInstance().getClient();
const asyncHSET = promisify(client.hset).bind(client);
const asyncHGETALL = promisify(client.hgetall).bind(client);
const asyncHKEYS = promisify(client.hkeys).bind(client);

export async function feedInitialData() {
     try {
          const exchanges = await ExchangeModel.find({});
          logger(
               LOG_LEVELS.INFO,
               'fetching binance klines for ' + exchanges.length + ' data',
               file_location
          );
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
               const keys = await asyncHKEYS(`${item.ticker}-${interval}`);
               if (!keys || !keys.length) {
                    // key is missing, fetch all and write
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
               } else {
                    await checkKeyHealth(item.ticker, interval);
                    await checkDataUptodate(item.ticker, interval);
               }
          }
     }
}

async function checkKeyHealth(symbol: string, interval: string) {
     const keys: string[] = await asyncHKEYS(`${symbol}-${interval}`);
     const sortedKeys = keys.sort(sortKeys);
     const missing_keys: number[] = [];
     for (let i = 0; i < sortedKeys.length - 1; i++) {
          if (
               Number(sortedKeys[i]) + interval_distance[interval] !==
               Number(sortedKeys[i + 1])
          ) {
               missing_keys.push(
                    Number(sortedKeys[i]) + interval_distance[interval]
               );
          }
     }
     if (missing_keys.length) {
          /**
           * data is crrupted, fetch and fill the crrupt data.
           */
          logger(
               LOG_LEVELS.INFO,
               `${symbol} data on ${interval} interval is crrupted. fetching and filling missing information`,
               file_location
          );
          for (let one of missing_keys) {
               const data = await getBinanceKLinesWindow(
                    symbol,
                    interval,
                    String(one - 500),
                    String(one + 500)
               );
               await write(symbol, interval, data);
          }
     }
}

async function checkDataUptodate(symbol: string, interval: string) {
     const now = +new Date();
     const keys: string[] = await asyncHKEYS(`${symbol}-${interval}`);
     const sortedKeys = keys.sort(sortKeys);
     if (now > Number(sortedKeys.at(-1)) + interval_distance[interval]) {
          const missing_count =
               Math.floor(
                    (now - Number(sortedKeys.at(-1))) /
                         interval_distance[interval]
               ) + 1; // +1 to make thing sound!
          logger(
               LOG_LEVELS.INFO,
               `${symbol} data on ${interval} is outof data, pulling ${missing_count} data`
          );
          const data = await getBinanceKLines(symbol, interval, missing_count);
          await write(symbol, interval, data);
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
     for (let one of data) {
          const number_converted = one.map((el) => Number(el));
          await asyncHSET(
               `${symbol}-${interval}`,
               String(one[0]),
               JSON.stringify(number_converted)
          );
     }
}

function sortKeys(a: string, b: string) {
     return a > b ? 1 : a < b ? -1 : 0;
}
