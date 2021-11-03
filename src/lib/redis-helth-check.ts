import { redisClient } from '../redis/redis-clinet';
import { promisify } from 'util';
import { ExchangeModel } from '../models/exchange-model';

const client = redisClient.getInstance().getClient();
const asyncHSET = promisify(client.hset).bind(client);
const asyncHGETALL = promisify(client.hgetall).bind(client);
const asyncHKEYS = promisify(client.hkeys).bind(client);

const intervals = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '1d'];

export default async function checkRedis() {
     const exchanges = await ExchangeModel.find({});
     for (let one of exchanges) {
          for (let k of intervals) {
               const keys = await asyncHKEYS(`${one.ticker}-${k}`);
               if (keys)
                    console.log(
                         'found ',
                         keys.length,
                         ' number of keys for ',
                         one.ticker,
                         ' on ',
                         k
                    );
          }
     }
}
