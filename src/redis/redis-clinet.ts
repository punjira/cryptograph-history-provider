import redis from 'redis';

export const redisClient = (function () {
     class CreateRedisClient {
          client: redis.RedisClient;
          constructor() {
               this.client = redis.createClient({
                    host: process.env.REDIS_HOST,
                    port: Number(process.env.REDIS_PORT),
               });
          }
          getClient() {
               return this.client;
          }
     }
     let instance: CreateRedisClient;
     return {
          getInstance: () => {
               if (!instance) {
                    instance = new CreateRedisClient();
               }
               return instance;
          },
     };
})();
