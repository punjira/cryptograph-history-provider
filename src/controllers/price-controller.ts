import { InternalServerError } from '@cryptograph-app/error-handlers';
import { TickerPrice, TickerPriceModel } from '../models/price-model';

export function upsertPrice(data: TickerPrice): Promise<boolean> {
     return new Promise((resolve, reject) => {
          TickerPriceModel.findOneAndUpdate(
               { ticker: data.ticker },
               { price: data.price },
               { upsert: true },
               function (err, isDone) {
                    if (err) {
                         return reject(err);
                    }
                    return resolve(true);
               }
          );
     });
}

export function getPrice(req, res, next) {
     const ticker = req.params.ticker;
     let query = {};
     if (ticker) query = { ticker: ticker.toLowerCase() };
     TickerPriceModel.find(query, function (err, result) {
          if (err) {
               throw new InternalServerError();
          }
          return res.status(200).json({
               data: result.length > 1 ? result : result[0],
          });
     });
}
