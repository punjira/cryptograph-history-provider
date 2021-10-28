/**
 * get latest price for
 */

import { logger, LOG_LEVELS } from '../../winston';
import { getAllExchanges } from '../controllers/exchange-controller';
import { upsertPrice } from '../controllers/price-controller';
import { TickerPrice } from '../models/price-model';
import { getBinancePrice } from '../service/binance';

export async function getBinanceTickerPrice() {
     try {
          const prices = await getBinancePrice();
          const exchange = await getAllExchanges();
          const available = exchange.map((el) => el.ticker);
          const valid: TickerPrice[] = prices
               .filter((el) => available.includes(el.symbol.toLowerCase()))
               .map((el) => ({
                    ticker: el.symbol.toLowerCase(),
                    price: Number(el.price),
               }));
          valid.forEach(async (el) => {
               await upsertPrice(el);
          });
          logger(
               LOG_LEVELS.INFO,
               'successfully updated ' + valid.length + ' coin price',
               'history-provider/lib/binance-price-interval.ts'
          );
     } catch (err: any) {
          logger(
               LOG_LEVELS.ERROR,
               'error while fetching ticker prices from binance, Error: ' + err,
               'history-provider/lib/binance-price-interval.ts'
          );
     }
}
