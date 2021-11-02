import { ExchangeModel } from '../models/exchange-model';
import { Exchange } from '@cryptograph-app/shared-models';

export function createExchanges(exchanges: Exchange[]) {
     return new Promise((resolve, reject) => {
          ExchangeModel.insertMany(
               exchanges,
               { ordered: false },
               (err, result) => {
                    if (err) {
                         return reject(err);
                    }
                    return resolve(result);
               }
          );
     });
}

export function getAllExchanges(): Promise<Exchange[]> {
     return new Promise((resolve, reject) => {
          ExchangeModel.find({}, function (err, result) {
               if (err) {
                    return reject(err);
               }
               return resolve(result);
          });
     });
}
