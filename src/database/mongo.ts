import { DatabaseConnectionError } from '@cryptograph-app/error-handlers';
import mongoose from 'mongoose';
import { logger, LOG_LEVELS } from '../../winston';
let connected: boolean = false;

(async function () {
     if (connected) {
          return;
     }
     await mongoose.connect(`${process.env.MONGO_URL}/history`);
     const db = mongoose.connection;
     db.once('open', () => {
          console.log('connection to mongo db created');
          connected = true;
     });
     db.on('error', (err) => {
          logger(
               LOG_LEVELS.ERROR,
               'error connecting to database , error description: ' + err,
               'database/mongo.ts'
          );
          throw new DatabaseConnectionError();
     });
})();
