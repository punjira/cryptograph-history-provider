import { Exchange } from '@cryptograph-app/shared-models';
import { getTickersArray } from '../helpers/utils';

describe('utils', () => {
     describe('get tickers array', () => {
          let testArray: Exchange[];
          beforeEach(() => {
               testArray = [
                    {
                         ticker: 'btcusdt',
                    },
                    {
                         ticker: 'ethusdt',
                    },
               ];
          });
          it('should return tickers', () => {
               expect(getTickersArray(testArray)).toEqual([
                    'btcusdt',
                    'ethusdt',
               ]);
          });
          it('should return empty array on empty input', () => {
               expect(getTickersArray([])).toEqual([]);
          });
     });
});
