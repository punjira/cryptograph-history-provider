import { sortKeys } from './utils';

const interval_distance = {
     '1m': 60 * 1000,
     '3m': 60 * 3 * 1000,
     '5m': 60 * 5 * 1000,
     '15m': 60 * 15 * 1000,
     '30m': 60 * 30 * 1000,
     '1h': 60 * 60 * 1000,
     '2h': 60 * 60 * 2 * 1000,
     '4h': 60 * 60 * 4 * 1000,
     '1d': 60 * 60 * 24 * 1000,
};

export function findMissingData(keys: string[], interval: string): number[] {
     const sortedKeys = keys.sort(sortKeys);
     const missing_keys: number[] = [];
     for (let i = 0; i < sortedKeys.length - 1; i++) {
          if (
               Number(sortedKeys[i]) + interval_distance[interval] !==
               Number(sortedKeys[i + 1])
          ) {
               missing_keys.push(
                    Number(sortedKeys[i]) + interval_distance[interval]
               );
          }
     }
     return missing_keys;
}

export function checkDataUptodate(keys: string[], interval: string) {}
