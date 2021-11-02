import { Message } from 'node-nats-streaming';
import { natsClient } from './nats-helper';

import { createExchanges } from '../controllers/exchange-controller';
import { Exchange } from '@cryptograph-app/shared-models';
import { logger, LOG_LEVELS } from '../../winston';

const EXCHANGE_UPDATE_EVENT = 'EXCHANGE_UPDATE';

/**
 * setting manual ack to true might introduce side-effects since several other \
 * services are listening to this message
 */
// const options = natsClient
//      .getInstance()
//      .getClient()
//      .subscriptionOptions()
//      .setManualAckMode(true);

natsClient
     .getInstance()
     .getClient()
     .on('connect', () => {
          // subscribe after connection
          const exchange_subscription = natsClient
               .getInstance()
               .getClient()
               .subscribe(EXCHANGE_UPDATE_EVENT);
          exchange_subscription.on('message', function (message: Message) {
               switch (message.getSubject()) {
                    case EXCHANGE_UPDATE_EVENT:
                         // update local exchange database
                         const msg = message.getData();
                         if (typeof msg === 'string') {
                              const exchanges: Exchange[] = JSON.parse(msg);
                              createExchanges(exchanges)
                                   .then(() => {
                                        logger(
                                             LOG_LEVELS.INFO,
                                             'local exchange list updated from nats with ' +
                                                  exchanges.length +
                                                  ' new data',
                                             'history-provider/nats/subscription.ts'
                                        );
                                   })
                                   .catch((err) => {
                                        logger(
                                             LOG_LEVELS.ERROR,
                                             'error writing incoming nats exchange list to local history-provider database Error: ' +
                                                  err,
                                             'history-provider/nats/subscription.ts'
                                        );
                                   });
                         }
                         break;
               }
          });
     });
