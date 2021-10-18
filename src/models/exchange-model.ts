import mongoose from 'mongoose';

export interface Exchange {
     ticker: string;
}

const exchangeSchema = new mongoose.Schema<Exchange>({
     ticker: {
          type: String,
          required: true,
          unique: true,
     },
});

const ExchangeModel = mongoose.model<Exchange>('exchange', exchangeSchema);

export { ExchangeModel };
