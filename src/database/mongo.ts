import mongoose from 'mongoose';
import { logger, LOG_LEVELS } from '../../winston';

export const MongoConnect = function (callback) {
     console.log('creating mongodb connection');
     mongoose.connect(`${process.env.MONGO_URL}`, {
          dbName: 'history',
          connectTimeoutMS: 60000,
          socketTimeoutMS: 60000,
          keepAlive: true,
     });
     const db = mongoose.connection;
     db.once('open', () => {
          console.log('connection to mongo db created');
          callback();
     });
     db.on('error', (err) => {
          logger(
               LOG_LEVELS.ERROR,
               'error connecting to database , error description: ' + err,
               'database/mongo.ts'
          );
     });
     db.on('disconnected', () => {
          mongoose.connect(`${process.env.MONGO_URL}/history`, {
               connectTimeoutMS: 3000,
               keepAlive: true,
          });
     });
};
