import { createLogger, format, transports } from 'winston';
import * as dotenv from 'dotenv';

const { combine, timestamp, printf, colorize } = format;
dotenv.config();

const logFilename = process.env.LOG_FILENAME || 'app.log'; 
console.log("Log filename:"+ logFilename);

const logLevel = process.env.LOG_LEVEL || 'info';
console.log("Set logLevel as:"+ logLevel);

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

const logger = createLogger({
  level: logLevel,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    colorize(),
    logFormat
  ),
  transports: [
    //new transports.Console(),
    new transports.File({ filename: logFilename })
  ]
});

export default logger;
