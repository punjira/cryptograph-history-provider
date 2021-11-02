import { redisClient } from '../redis/redis-clinet';
import { promisify } from 'util';
import { getBinanceKLines } from '../service/binance';
import { logger, LOG_LEVELS } from '../../winston';
import { natsClient } from '../nats/nats-helper';

// not using bluebird to keep intellisence
const client = redisClient.getInstance().getClient();
const asyncHSET = promisify(client.hset).bind(client);
const asyncHGET = promisify(client.hget).bind(client);
const asyncHKEYS = promisify(client.hkeys).bind(client);
const asyncHDEL = promisify(client.hdel).bind(client);

const file_location = 'history-provider/lib/binance-interval-update.ts';

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

export async function updateFromBinance(symbols: string[]) {
     console.log('-------------------------------');
     for (let symbol of symbols) {
          try {
               const NewKLines = await getBinanceKLines(
                    symbol.toUpperCase(),
                    '1m',
                    2
               );
               if (NewKLines.length) {
                    await updateExisting(symbol, NewKLines[1], NewKLines[0]);
               } else {
                    logEmptyArray(symbol);
               }
          } catch (err) {
               logError(symbol, err);
          }
     }
}

/**
 *
 * @param symbol symbol
 * @param data binance most recent information
 * @param prev binance 1m lagging information
 *
 */
async function updateExisting(
     symbol: string,
     data: (string | number)[],
     prev: (string | number)[]
) {
     const number_converted = data.map((el) => Number(el));
     for (let k of Object.keys(frameMap)) {
          if (!symbol || !k || !frameMap[k]) {
               logger(
                    LOG_LEVELS.ERROR,
                    'something is really wrong here, the passed in symbol or interval is invalid!',
                    file_location
               );
               continue;
          }
          try {
               const redis_keys: string[] = await asyncHKEYS(`${symbol}-${k}`);
               if (!redis_keys || !redis_keys.length) {
                    continue;
               }
          } catch (err) {
               logger(
                    LOG_LEVELS.ERROR,
                    'skipping empty key on redis error, ' +
                         symbol +
                         ' interval: ' +
                         k
               );
               continue;
          }
          if (Number(data[0]) % frameMap[k] !== 0) {
               // data is not new, update the latest one
               const [highPrice, lowPrice, closePrice] =
                    getCandleProperties(data);
               const keys: string[] = await asyncHKEYS(`${symbol}-${k}`);
               const sortedKeys = keys.sort(sortKeys);
               let recentKey;
               try {
                    recentKey = await asyncHGET(
                         `${symbol}-${k}`,
                         String(sortedKeys.at(-1))
                    );
               } catch (err) {}
               if (!recentKey) {
                    logger(
                         LOG_LEVELS.ERROR,
                         'not recent key found for hash ' +
                              `${symbol}-${k} with last sorted key of ${String(
                                   sortedKeys.at(-1)
                              )}` +
                              ' recentKey: ' +
                              recentKey,
                         file_location
                    );
                    continue;
               }
               const Obj = JSON.parse(recentKey);
               Obj[4] = closePrice;
               Obj[2] = Obj[2] > highPrice ? Obj[2] : highPrice;
               Obj[3] = Obj[3] < lowPrice ? Obj[3] : lowPrice;
               await asyncHSET(
                    `${symbol}-${k}`,
                    String(Obj[0]),
                    JSON.stringify(Obj)
               );
          } else {
               // this should get stored as a new key
               await asyncHSET(
                    `${symbol}-${k}`,
                    String(data[0]),
                    JSON.stringify(number_converted)
               );
               // update latest candle with previous information.
               const keys: string[] = await asyncHKEYS(`${symbol}-${k}`);
               const sortedKeys = keys.sort(sortKeys);
               let PrevFixed;
               try {
                    PrevFixed = await asyncHGET(
                         `${symbol}-${k}`,
                         sortedKeys.at(-2)
                    );
               } catch (err) {}
               if (!PrevFixed) {
                    logger(
                         LOG_LEVELS.ERROR,
                         'not recent key found for hash ' +
                              `${symbol}-${k} with last sorted key of ${String(
                                   sortedKeys.at(-1)
                              )}` +
                              ' recentKey: ' +
                              PrevFixed,
                         file_location
                    );
                    continue;
               }
               const Obj = JSON.parse(PrevFixed);
               const [highPrice, lowPrice, closePrice] =
                    getCandleProperties(prev);

               Obj[4] = closePrice;
               Obj[2] = Obj[2] > highPrice ? Obj[2] : highPrice;
               Obj[3] = Obj[3] < lowPrice ? Obj[3] : lowPrice;
               await asyncHSET(
                    `${symbol}-${k}`,
                    String(Obj[0]),
                    JSON.stringify(Obj)
               );
               if (keys.length > 200) {
                    // remove oldest data
                    await asyncHDEL(`${symbol}-${k}`, sortedKeys[0]);
               }
               /**
                * publish **notification** (not actual candle) that data has been updated
                */
               natsClient.getInstance().publishMessage('CANDLE_UPDATE', {
                    ticker: `${symbol}-${k}`,
               });
               natsClient
                    .getInstance()
                    .publishMessage('NEW_CANDLESTICK_UPDATE_EVENT', {
                         ticker: `${symbol}-${k}`,
                         data: Obj,
                    });
          }
     }
}

function sortKeys(a: string, b: string) {
     return a > b ? 1 : a < b ? -1 : 0;
}

function logEmptyArray(symbol: string) {
     logger(
          LOG_LEVELS.ERROR,
          'the received response from binance for ' +
               symbol +
               ' on 1m interval in an empty array',
          file_location
     );
}

function logError(symbol: string, err: any) {
     logger(
          LOG_LEVELS.ERROR,
          'error while updating interval on ' + symbol + ' with error : ' + err,
          file_location
     );
}

function getCandleProperties(data: (string | number)[]) {
     const numbered = data.map((el) => Number(el));
     const highPrice = numbered[2];
     const lowPrice = numbered[3];
     const closePrice = numbered[4];
     return [highPrice, lowPrice, closePrice];
}
