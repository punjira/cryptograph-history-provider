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
          publishMessage() {
               console.log('should publish messages');
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
