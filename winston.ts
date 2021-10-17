import winston from 'winston';
import path from 'path';

export enum LOG_LEVELS {
     ERROR = 'error',
     DEBUG = 'debug',
     INFO = 'info',
}

const customLogger = winston.createLogger({
     level: LOG_LEVELS.INFO,
     format: winston.format.json(),
     defaultMeta: { service: 'coin-provider service' },
     transports: [
          new winston.transports.File({
               filename: path.join(__dirname, '../logs/info.log'),
               level: LOG_LEVELS.INFO,
          }),
          new winston.transports.File({
               filename: path.join(__dirname, '../logs/debug.log'),
               level: LOG_LEVELS.DEBUG,
          }),
          new winston.transports.File({
               filename: path.join(__dirname, '../logs/error.log'),
               level: LOG_LEVELS.ERROR,
          }),
          new winston.transports.File({
               filename: path.join(__dirname, '../logs/combined.log'),
          }),
     ],
});

if (process.env.NODE_ENV !== 'production') {
     customLogger.add(
          new winston.transports.Console({
               format: winston.format.simple(),
          })
     );
}

export const logger = (level: LOG_LEVELS, message: string, file?: string) => {
     const customizedMessage = `NEW LOG MESSAGE   ${Date()}      file: ${
          file ? file : 'not specified'
     }\tmessage: ${message}`;
     customLogger.log({
          level,
          message: customizedMessage,
     });
};
