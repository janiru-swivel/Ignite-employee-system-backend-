import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import fs from "fs";

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Configure daily rotate file transports
const fileTransport = new DailyRotateFile({
  filename: path.join(logsDir, "%DATE%-app.log"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
  level: "info",
});

const errorFileTransport = new DailyRotateFile({
  filename: path.join(logsDir, "%DATE%-error.log"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
  level: "error",
});

// Create logger instance
const logger = winston.createLogger({
  format: logFormat,
  transports: [
    fileTransport,
    errorFileTransport,
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      level: process.env.NODE_ENV === "production" ? "error" : "debug",
    }),
  ],
});

// Create a stream object for Morgan integration
const morganStream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

export { logger, morganStream };
