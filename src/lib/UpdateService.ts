/**
 * update candle stick data from binance
 */

import { logger, LOG_LEVELS } from '../../winston';
import { findMissingData } from '../helpers/redis-helpers';
import {
     convertArrayToNumbers,
     convertToNumbers,
     getCandleProperties,
     sortKeys,
} from '../helpers/utils';
import { natsClient } from '../nats/nats-helper';
import Redis from '../redis/asyncRedis';
import { getBinanceKLines } from '../service/binance';

const file_location = 'history-provider/jobs/UpdateService.ts';
const frames = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '1d'];
const frameMap = {
     '1m': 60000,
     '3m': 180000,
     '5m': 300000,
     '15m': 900000,
     '30m': 1800000,
     '1h': 3600000,
     '2h': 7200000,
     '4h': 14400000,
     '1d': 86400000,
};

/**
 *
 * @param ticker string symbol name
 * @param interval string time frame interval
 * @returns array of all available keys on redis
 */
async function getSymbolAvailableKeys(
     ticker: string,
     interval: string
): Promise<string[]> {
     try {
          return Redis.HKEYS(`${ticker}-${interval}`);
     } catch (err: any) {
          logger(
               LOG_LEVELS.ERROR,
               'error while reading redis keys, Error: ' + err,
               file_location + 'getSymbolAvailableKeys'
          );
     }
}

/**
 *
 * @param ticker string
 * @param interval string
 * @param key string key name
 * @param data object | string | number value
 */
async function setSymbolHash(
     ticker: string,
     interval: string,
     key: string,
     data: any
) {
     try {
          return Redis.HSET(`${ticker}-${interval}`, key, JSON.stringify(data));
     } catch (err: any) {
          logger(
               LOG_LEVELS.ERROR,
               'error while trying to hset for ' +
                    ticker +
                    ' on ' +
                    interval +
                    ' interval',
               file_location + '/' + 'setSymbolHash'
          );
     }
}

async function deleteHash(ticker: string, interval: string, key: string) {
     try {
          return Redis.HDEL(`${ticker}-${interval}`, key);
     } catch (err: any) {
          logger(
               LOG_LEVELS.ERROR,
               'error while trying to delete hash (hdel) for ' +
                    ticker +
                    ' on ' +
                    interval +
                    ' interval',
               file_location + '/' + 'deleteHash'
          );
     }
}

/**
 *
 * @param ticker symbol name
 * @param frame time frame interval
 * @returns available data length
 */
async function checkDataLength(ticker: string, frame: string): Promise<number> {
     const data = await getSymbolAvailableKeys(ticker, frame);
     return data?.length || 0;
}

/**
 *
 * @param ticker symbol name
 * @param interval time frame interval
 * @returns missing keys based on interval
 */
async function checkDataGaps(
     ticker: string,
     interval: string
): Promise<number[]> {
     const keys = await getSymbolAvailableKeys(ticker, interval);
     return findMissingData(keys, interval);
}

/**
 *
 * @param ticker symbol
 * @param interval time frame
 *
 * get the whole data from binance with 200 candle limit
 */
async function getDataFromBinance(
     ticker: string,
     interval: string,
     limit: number
): Promise<(string | number)[][]> {
     try {
          const data = await getBinanceKLines(
               ticker.toUpperCase(),
               interval,
               limit
          );
          return data;
     } catch (err: any) {
          logger(
               LOG_LEVELS.ERROR,
               'error fetching data from binance. Error: ' + err,
               file_location + '/' + 'getDataFromBinance'
          );
     }
}

/**
 *
 * @param ticker string symbol
 * @param interval string interval
 * @param data binance response data (string|number)[][]
 */
async function writeRedis(ticker: string, interval: string, data: number[][]) {
     for (let one of data) {
          await setSymbolHash(ticker, interval, String(one[0]), one);
     }
}

/**
 *
 * @param ticker string
 * @param interval string
 * @param data any
 * @param channel string
 * @param message string
 *
 * callback when updating data is over. use to publish nats event
 */
async function updateCallback(
     ticker: string,
     interval: string,
     data?: any,
     channel?: string,
     message?: string
) {
     natsClient.getInstance().publishMessage(channel, {
          ticker: `${ticker}-${interval}`,
          data: data,
     });
}

/**
 *
 * @param ticker string symbol
 *
 * check data existence and health for all frames and update them if necessary
 */
async function checkData(ticker: string) {
     for (let one of frames) {
          // if no data is found for a ticker, we fetch the whole thing
          const length = await checkDataLength(ticker, one);
          if (!length) {
               // logger(
               //      LOG_LEVELS.INFO,
               //      `${ticker} on ${one} interval is empty, fetching 200 candles from binance`,
               //      file_location
               // );
               const data = await getDataFromBinance(ticker, one, 200);
               if (!data) {
                    continue;
               }
               await writeRedis(ticker, one, convertArrayToNumbers(data));
          }
          const missing_data = await checkDataGaps(ticker, one);
          /**
           * there are gaps in data
           * **fetch the whole thing**
           * @todo:
           *    only fetch missing information. since there might be several gaps in \
           *    different places in data, these chunks should get fetched separately \
           *    consider recursive
           */
          if (missing_data && missing_data.length) {
               // logger(
               //      LOG_LEVELS.INFO,
               //      `${ticker} has gaps, fetching 200 candles from binance`,
               //      file_location
               // );
               const data = await getDataFromBinance(ticker, one, 200);
               if (!data) {
                    continue;
               }
               await writeRedis(ticker, one, convertArrayToNumbers(data));
          }
     }
}

/**
 *
 * @param ticker string symbol
 * @param interval string time frame
 * @param data new candle data
 *
 * check and update new candle
 */
async function handleNewData(
     ticker: string,
     interval: string,
     data: (string | number)[][]
) {
     const latest = convertToNumbers(data[1]);
     if (latest[0] % frameMap[interval] === 0) {
          await setSymbolHash(ticker, interval, String(latest[0]), latest);
          const keys = await getSymbolAvailableKeys(ticker, interval);
          const sorted_keys = keys.sort(sortKeys);
          let PrevFixed;
          try {
               PrevFixed = await Redis.HGET(
                    `${ticker}-${interval}`,
                    sorted_keys.at(-2)
               );
          } catch (err: any) {}
          if (!PrevFixed) {
               logger(
                    LOG_LEVELS.ERROR,
                    `no recent key found for ${ticker} on ${interval}`,
                    file_location + '/' + 'handleNewData'
               );
               return;
          }
          const Obj = JSON.parse(PrevFixed);
          const [hp, lp, cp] = getCandleProperties(convertToNumbers(data[0]));
          Obj[4] = cp;
          Obj[2] = Obj[2] > hp ? Obj[2] : hp;
          Obj[3] = Obj[3] < lp ? Obj[3] : lp;
          await setSymbolHash(ticker, interval, String(Obj[0]), Obj);
          const count = await checkDataLength(ticker, interval);
          /**
           * we never need more than 200 data on each ticker on each frame
           */
          if (count > 200) {
               // delete the oldest data
               await deleteHash(ticker, interval, sorted_keys[0]);
          }
     }
}

async function handleUpdateData(
     ticker: string,
     interval: string,
     data: (string | number)[][]
) {
     const latest = convertToNumbers(data[1]);
     if (latest[0] % frameMap[interval] !== 0) {
          const [hp, lp, cp] = getCandleProperties(latest);
          const keys = await getSymbolAvailableKeys(ticker, interval);
          const sorted_keys = keys.sort(sortKeys);
          let recentKey;
          try {
               recentKey = await Redis.HGET(
                    `${ticker}-${interval}`,
                    String(sorted_keys.at(-1))
               );
          } catch (err: any) {}
          if (!recentKey) {
               logger(
                    LOG_LEVELS.ERROR,
                    `no recent key found for ${ticker} on ${interval} frame`,
                    file_location + '/' + 'handleUpdateData'
               );
               return;
          }
          const Obj = JSON.parse(recentKey);
          Obj[4] = cp;
          Obj[2] = Obj[2] > hp ? Obj[2] : hp;
          Obj[3] = Obj[3] < lp ? Obj[3] : lp;
          await setSymbolHash(ticker, interval, String(Obj[0]), Obj);
     }
     updateCallback(ticker, '1m', latest, 'NEW_CANDLESTICK_UPDATE_EVENT');
}

async function update(ticker: string) {
     const newCandles = await getDataFromBinance(ticker, '1m', 2);
     if (!newCandles) {
          return;
     }
     if (!newCandles.length) {
          logger(
               LOG_LEVELS.ERROR,
               'returned data from binance for ' +
                    ticker +
                    ' is empty. consider checking binance status for the ticker',
               file_location + '/' + 'update'
          );
          return;
     }
     for (let k of Object.keys(frameMap)) {
          await handleUpdateData(ticker, k, newCandles);
          await handleNewData(ticker, k, newCandles);
     }
}

/**
 *
 * @param ticker string symbol name ex: btcusdt
 *
 * ===============================
 * ****** process is async *******
 * ===============================
 * tickers will get updated one by one. this can cause some major problems in data but \
 * currently the only way to handle 300 tokens with 9 timeframes without passing the binance \
 * limit or freezing the server is this.
 *
 * the gap interval will keep growing smaller until it reaches 1 minute.
 */
export async function tickerUpdate(ticker: string) {
     // check data on all frames before performing the base 1 minute update interval
     await checkData(ticker);
     await update(ticker);
     console.log(ticker);
}
