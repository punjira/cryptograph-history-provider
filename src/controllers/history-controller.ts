import { InternalServerError } from '@cryptograph-app/error-handlers';
import { redisClient } from '../redis/redis-clinet';

export function getCandles(req, res, next) {
     const token = req.query.symbol;
     const frame = req.query.interval;
     redisClient
          .getInstance()
          .getClient()
          .hgetall(`${token}-${frame}`, function (err, reply) {
               if (err) {
                    throw new InternalServerError();
               }
               const arr = Object.keys(reply).map((el) =>
                    JSON.parse(reply[el])
               );
               return res.status(200).json({
                    data: arr.sort(sortKeys),
               });
          });
}

function sortKeys(a: (string | number)[], b: (string | number)[]) {
     return a[0] > b[0] ? 1 : a[0] < b[0] ? -1 : 0;
}
