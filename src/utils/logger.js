const winston = require("winston");
const dailyRoateFile = require("winston-daily-rotate-file");
const path = require("path");
const config = require("../../config/config");

// 日志目录
let defaultLogDir = config.logger.dir ? config.logger.dir : "logs";
// 所有日志
let logFile = path.join(defaultLogDir, "node-%DATE%.log");
// 错误信息日志
let errorLogName = path.join(defaultLogDir, "error.log");

// 控制台打印日志时根据不同日志级别显示不同颜色
const lc_config = {
  levels: {
    error: 0,
    warn: 1,
    data: 2,
    info: 3,
    debug: 4,
    verbose: 5,
    silly: 6,
    custom: 7,
  },
  colors: {
    error: "red",
    debug: "blue",
    warn: "yellow",
    data: "grey",
    info: "green",
    verbose: "cyan",
    silly: "magenta",
    custom: "yellow",
  },
};

// 日志输出格式
const formatter = winston.format.combine(
  winston.format.errors({ stack: true }), // error级别日志是否显示执行栈
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), // 日期格式化
  // 输出格式
  winston.format.printf((info) => {
    return `${info.timestamp} ${info.level} - ${info.stack || info.message}`;
  })
);

winston.addColors(lc_config.colors);

const wlogger = winston.createLogger({
  level: config.logger.level ? config.logger.level : 'info',
  levels: lc_config.levels,
  format: formatter,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // 不同级别控制台显示颜色
        winston.format.simple(),
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), // 日期格式化
        // 输出格式
        winston.format.printf((info) => {
          return `${info.timestamp} ${info.level} - ${info.stack || info.message}`;
        })
      ),
    }),
    new winston.transports.File({ level: "error", filename: errorLogName }),
    new dailyRoateFile({
      filename: logFile,
      datePattern: "YYYY-MM-DD",
      maxFiles: config.logger.maxFiles,
    }),
  ],
});

const logger = {
  info(message, params) {
    wlogger.info(`${message}${params ? JSON.stringify(params) : ''}`);
  },
  debug(message, params) {
    wlogger.debug(`${message}${params ? JSON.stringify(params) : ''}`);
  },
  warn(message, params) {
    wlogger.warn(`${message}${params ? JSON.stringify(params) : ''}`);
  },
  error(message, params) {
    console.trace();
    wlogger.error(`${message}${params ? JSON.stringify(params) : ''}`);
  }
}

module.exports = logger;
