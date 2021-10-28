/**
 * nats client api
 */

import nats from 'node-nats-streaming';
import { randomBytes } from 'crypto';

export const natsClient = (function () {
     class NatsClient {
          stan: nats.Stan;
          constructor() {
               this.stan = nats.connect(
                    'cryptograph',
                    randomBytes(4).toString('hex'),
                    {
                         url: process.env.NATS_URL,
                    }
               );
          }
          getClient() {
               return this.stan;
          }
          publishMessage(topic: string, message: object) {
               this.stan.publish(topic, JSON.stringify(message), () => {
                    // do some logging
               });
          }
     }
     let instance: NatsClient;
     return {
          getInstance: () => {
               if (!instance) {
                    instance = new NatsClient();
               }
               return instance;
          },
     };
})();
