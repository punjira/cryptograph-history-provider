/**
 * get latest price for
 */

import { logger, LOG_LEVELS } from '../../winston';
import { getAllExchanges } from '../controllers/exchange-controller';
import { upsertPrice } from '../controllers/price-controller';
import { TickerPrice } from '../models/price-model';
import { natsClient } from '../nats/nats-helper';
import { getBinancePrice } from '../service/binance';

import { PRICE_UPDATE_EVENT } from '../nats/subscription';

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
          natsClient
               .getInstance()
               .getClient()
               .publish(PRICE_UPDATE_EVENT, JSON.stringify(valid));
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
