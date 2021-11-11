import { InternalServerError } from '@cryptograph-app/error-handlers';
import { redisClient } from '../redis/redis-clinet';

export function getCandles(req, res, next) {
     const token = req.query.symbol;
     const frame = req.query.interval;
     const limit = req.query.limit || 200;
     redisClient
          .getInstance()
          .getClient()
          .hgetall(`${token}-${frame}`, function (err, reply) {
               if (err) {
                    throw new InternalServerError();
               }
               if (!reply || !Object.keys(reply).length) {
                    return res.status(400).json({
                         data: 'ticker is not valid or no data is provided for requested coin',
                    });
               }
               const arr = Object.keys(reply).map((el) =>
                    JSON.parse(reply[el])
               );
               return res.status(200).json({
                    data: arr.sort(sortKeys).splice(-limit),
               });
          });
}

function sortKeys(a: (string | number)[], b: (string | number)[]) {
     return a[0] > b[0] ? 1 : a[0] < b[0] ? -1 : 0;
}
