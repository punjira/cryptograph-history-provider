import mongoose from 'mongoose';

export interface TickerPrice {
     ticker: string;
     price: number;
}

const tickerPriceSchema = new mongoose.Schema<TickerPrice>({
     ticker: {
          type: String,
          required: true,
          unique: true,
     },
     price: {
          type: Number,
     },
});

const TickerPriceModel = mongoose.model<TickerPrice>(
     'price',
     tickerPriceSchema
);

export { TickerPriceModel };
