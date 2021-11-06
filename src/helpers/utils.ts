import { Exchange } from '@cryptograph-app/shared-models';

export function getTickersArray(arr: Exchange[]): string[] {
     return arr.map((el) => el.ticker);
}

export function sortKeys(a: string, b: string) {
     return a > b ? 1 : a < b ? -1 : 0;
}

export function convertToNumbers(data: (string | number)[]): number[] {
     return data.map((el) => Number(el));
}

export function convertArrayToNumbers(data: (string | number)[][]): number[][] {
     return data.map((el) => el.map((bl) => Number(bl)));
}

export function getCandleProperties(
     data: (string | number)[]
): [number, number, number] {
     const numbered = convertToNumbers(data);
     const highPrice = numbered[2];
     const lowPrice = numbered[3];
     const closePrice = numbered[4];
     return [highPrice, lowPrice, closePrice];
}
