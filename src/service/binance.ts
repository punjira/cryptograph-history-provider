import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import {
     binanceBaseAddress,
     binanceCandleSticks,
     binancePrefix,
     binanceTickerPrice,
} from '../endpoints';

// from binance docs
export type BinanceKLineResponse = [
     number, // Open time
     string, // Open
     string, // High
     string, // Low
     string, // Close
     string, // Volume
     number, // Close time
     string, // Quote asset volume
     number, // Number of trades
     string, // Taker buy base asset volume
     string, // Taker buy quote asset volume
     string // Ignore.
];

export function getBinanceKLines(
     symbol: string,
     interval: string,
     limit = 2
): Promise<(number | string)[][]> {
     return new Promise((resolve, reject) => {
          const options: AxiosRequestConfig = {
               method: 'GET',
               url: binanceBaseAddress + binancePrefix + binanceCandleSticks,
               params: {
                    symbol: symbol.toUpperCase(),
                    interval,
                    limit,
               },
          };
          axios(options)
               .then((data: AxiosResponse<BinanceKLineResponse[]>) => {
                    const stripped = data.data.map((el) => el.slice(0, 7));
                    return resolve(stripped);
               })
               .catch((err) => {
                    return reject(err);
               });
     });
}

export type BinancePriceResponse = {
     symbol: string;
     price: string;
};

/**
 *
 * get latest price for all symbols
 */
export function getBinancePrice(): Promise<BinancePriceResponse[]> {
     return new Promise((resolve, reject) => {
          const options: AxiosRequestConfig = {
               method: 'GET',
               url: binanceBaseAddress + binancePrefix + binanceTickerPrice,
          };
          axios(options)
               .then((data: AxiosResponse<BinancePriceResponse[]>) => {
                    return resolve(data.data);
               })
               .catch((err: any) => {
                    reject(err);
               });
     });
}
