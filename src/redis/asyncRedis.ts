/**
 * no idea how to test this!
 */
import { promisify } from 'util';
import { redisClient } from './redis-clinet';

/**
 * create instance once.
 */
const initInstance = (function () {
     const client = redisClient.getInstance().getClient();
     return function () {
          return client;
     };
})();

/**
 * export new async interface
 */
const PromisedRedisInterface = {
     client: initInstance(),
     HGET: async function (set: string, key: string) {
          return await promisify(this.client.HGET).bind(this.client)(set, key);
     },
     HSET: async function (set: string, key: string, value) {
          return await promisify(this.client.HSET).bind(this.client)(
               set,
               key,
               value
          );
     },
     HKEYS: async function (set: string): Promise<string[]> {
          return promisify(this.client.hkeys).bind(this.client)(set);
     },
     HGETALL: async function (set: string) {
          return await promisify(this.client.HGETALL).bind(this.client)(set);
     },
     HDEL: async function (set: string, key: string) {
          return await promisify(this.client.HDEL).bind(this.client)(set, key);
     },
};

export default PromisedRedisInterface;
