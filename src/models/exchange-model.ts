import mongoose from 'mongoose';

import { Exchange, ExchangeSchema } from '@cryptograph-app/shared-models';

const ExchangeModel = mongoose.model<Exchange>('exchange', ExchangeSchema);

export { ExchangeModel };
