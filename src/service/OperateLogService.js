const operateLogConf = require("../../config/operateLog.conf");
const logger = require("../utils/logger");
const mysqlDb = require("../utils/MySqlDB");
const Response = require("../utils/Response");
const StringUtils = require("../utils/StringUtils");

class OperateLogService {
  constructor() {}

  /**
   * 分页查询操作日志
   * @param {Object} params 查询参数
   */
  async pageByOperateLog(params) {
    let {
        userName, // 操作人
        ip, // ip
        startTime, // 开始时间
        endTime, // 结束时间
        pageSize = 20, // 查询条数
        pageNum = 1, // 查询页数
      } = params,
      res = new Response(),
      selectSql = `SELECT user_name AS userName, ip, create_time AS createTime, description, type 
        FROM log_operate WHERE 1=1`;

    if (StringUtils.isNotEmpty(userName)) {
      selectSql += ` AND user_name like '%${userName}%'`;
    }
    if (StringUtils.isNotEmpty(ip)) {
      selectSql += ` AND ip like '%${ip}%'`;
    }
    if (StringUtils.isNotEmpty(startTime)) {
      selectSql += ` AND create_time >= '${startTime}'`;
    }
    if (StringUtils.isNotEmpty(endTime)) {
      selectSql += ` AND create_time < '${endTime}'`;
    }

    pageNum = parseInt(pageNum) - 1;
    pageNum = pageSize * pageNum;

    selectSql += ` ORDER BY create_time DESC`;
    let countSql = `SELECT COUNT(*) AS count ${selectSql.substr(
      selectSql.indexOf("FROM")
    )}`;
    selectSql += ` LIMIT ${pageNum}, ${pageSize}`;

    logger.debug(`分页查询操作日志sql: ${countSql};${selectSql}`);
    let [err, result] = await mysqlDb.select(`${countSql};${selectSql}`);
    if (err) {
      logger.error(`分页查询操作日志出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    return res
      .success({ count: result[0][0].count, data: result[1] })
      .toString();
  }

  async save(operateLog) {
    let { currentUser, key, params, currentTime, type, ip } = operateLog;

    let desc = this.format(key, params),
      insertSql = `INSERT INTO log_operate(user_name, description, create_time, type, ip) 
        VALUES('${currentUser}', '${desc}', '${currentTime}', ${type}, '${ip}')`;

    logger.debug(`新增用户操作日志sql: ${insertSql}`);
    let [err] = await mysqlDb.insert(insertSql);
    if (err) {
      logger.error(`新增用户操作日志出错: err = ${err.message}`);
    }
  }

  format(key, args) {
    return (
      key.match(/(\w+)\.(\w+)/g),
      operateLogConf[RegExp.$1][RegExp.$2].replace(
        /\{\{(\w+)\}\}/g,
        (_, item) => {
          return args[item];
        }
      )
    );
  }
}

module.exports = new OperateLogService();
