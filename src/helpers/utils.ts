import { Exchange } from '@cryptograph-app/shared-models';

export function getTickersArray(arr: Exchange[]): string[] {
     return arr.map((el) => el.ticker);
}
