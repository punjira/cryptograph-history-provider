import { DatabaseConnectionError } from '@cryptograph-app/error-handlers';
import mongoose from 'mongoose';
import { logger, LOG_LEVELS } from '../../winston';
let connected: boolean = false;

export const MongoConnect = function (callback) {
     console.log('creating mongodb connection');
     mongoose.connect(`${process.env.MONGO_URL}/study`, {
          connectTimeoutMS: 3000,
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
          console.log('=======================================');
          console.log('mongo connections error, Error: ', err);
          throw new DatabaseConnectionError();
     });
     db.on('disconnected', (thing) => {
          console.log('========================================');
          console.log('mongo connection disconnected, The thing: ', thing);
          // mongoose.connect(`${process.env.MONGO_URL}/study`, {
          //      connectTimeoutMS: 3000,
          //      keepAlive: true,
          // });
     });
     db.on('disconnecting', (thing) => {
          console.log('========================================');
          console.log('mongo connection disconnecting, The thing: ', thing);
     });
     db.on('close', (thing) => {
          console.log('========================================');
          console.log('mongo connection disconnecting, The thing: ', thing);
     });
};

// (async function () {
//      if (connected) {
//           return;
//      }
//      await mongoose.connect(`${process.env.MONGO_URL}/history`);
//      const db = mongoose.connection;
//      db.once('open', () => {
//           console.log('connection to mongo db created');
//           connected = true;
//      });
//      db.on('error', (err) => {
//           logger(
//                LOG_LEVELS.ERROR,
//                'error connecting to database , error description: ' + err,
//                'database/mongo.ts'
//           );
//           throw new DatabaseConnectionError();
//      });
// })();
