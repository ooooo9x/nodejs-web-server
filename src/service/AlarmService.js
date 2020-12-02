const Response = require("../utils/Response");
const mysqlDB = require("../utils/MySqlDB");
const textUtils = require("../utils/textUtils");
const timeUtils = require("../utils/timeUtils");
const logger = require("../utils/logger");
const nodeService = require("./NodeService");

/**
 * 遗留物Service
 */
class AlarmService {
  constructor() {}

  /**
   * 查询告警类型
   */
  async getAlarmType() {
    let res = new Response(),
      selectSql = `SELECT alarm_code, alarm_name FROM alarm_type ORDER BY alarm_code ASC`;

    logger.debug(`查询告警类型sql: ${selectSql}`);
    let [err, result] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`查询告警类型出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    return res.success(result).toString();
  }

  /**
   * 查询告警级别
   */
  async getAlarmLevel() {
    let res = new Response(),
      selectSql = `SELECT level_code as code, level_name as name FROM alarm_level`;

    logger.debug(`查询告警级别sql: ${selectSql}`);
    let [err, result] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`查询告警级别出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    return res.success(result).toString();
  }

  /**
   * 查询告警信息(首页)
   * @param {Number} startId 上次查询最后一条告警的id
   * @param {Number} pageSize 条数
   */
  async getAlarmByStartId(startId, pageSize) {
    let res = new Response();
    if (textUtils.isEmpty(pageSize) || textUtils.isEmpty(startId)) {
      return res.fail("查询失败,必填参数为空").toString();
    }

    (pageSize = parseInt(pageSize)), (startId = parseInt(startId));

    // '2020-06-18'
    let timeStr = timeUtils.getNowTime();

    //获取当前系统时间
    let sql = "";
    if (startId === 0) {
      sql = `SELECT * FROM alarm_infor WHERE add_time LIKE '${timeStr}%' LIMIT 0, ${pageSize}`;
    } else {
      let idAry = [];
      for (let i = 1; i <= pageSize; i++) {
        idAry.push(startId + i);
      }
      sql = `SELECT * FROM alarm_infor WHERE add_time LIKE '${timeStr}%'  AND id IN (${idAry.join(
        ","
      )})`;
    }

    logger.debug(`查询告警信息sql: ${sql}`);
    let [err, result] = await mysqlDB.select(sql);
    if (err) {
      logger.error(`查询告警信息出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    return res.success(result).toString();
  }

  /**
   * 分页查询遗留物
   * @param {Object} params 查询参数
   */
  async pageByAlarm(params) {
    let {
        groupId, // 组id
        userName, // 用户登录名
        roomId, // 机房room_id
        alarmType, // 告警类型
        dealState, // 处理状态 0：已处理 1：未处理
        alarmNature, // 告警级别
        channelCode, // 设备编号
        startTime, // 开始时间
        endeTime, // 结束时间
        pageNum, // 页码
        pageSize, // 每页大小
      } = params,
      res = new Response();

    pageNum = textUtils.isEmpty(pageNum) ? 0 : pageNum - 1;
    pageSize = textUtils.isEmpty(pageSize) ? 10 : parseInt(pageSize);
    pageNum = pageSize * pageNum;

    // 获取用户组绑定的区域节点
    let nodeSerial = {};
    try {
      nodeSerial = await nodeService.getNodesByGroupId(groupId, userName);
    } catch (e) {
      logger.error(e.message);
      return res.fail("组没有绑定节点").toString();
    }

    let selectSql = " WHERE 1=1";

    if (textUtils.isNotEmpty(roomId)) {
      selectSql += ` AND a.computer_room_code = '${roomId}'`;
    }

    if (textUtils.isNotEmpty(startTime)) {
      selectSql += ` AND a.add_time >= '${startTime}'`;
    }

    if (textUtils.isNotEmpty(endeTime)) {
      selectSql += ` AND a.add_time <= '${endeTime}'`;
    }

    if (textUtils.isNotEmpty(dealState)) {
      selectSql += ` AND a.alarm_process_state = ${dealState}`;
    }

    if (textUtils.isNotEmpty(alarmType)) {
      selectSql += ` AND a.alarm_type_code = ${alarmType}`;
    }

    if (textUtils.isNotEmpty(alarmNature)) {
      selectSql += ` AND a.level = ${alarmNature}`;
    }

    if (textUtils.isNotEmpty(channelCode)) {
      selectSql += ` AND c.channel_id = '${channelCode}'`;
    }

    if (nodeSerial.device && nodeSerial.device.length > 0) {
      selectSql += ` AND c.channel_id in ('${nodeSerial.device.map((did) => String(did)).join("','")}')`;
    }

    let countSql = `SELECT COUNT(*) AS num FROM alarm_infor a, channel c ${selectSql} AND c.code_id = a.camera_code`;

    selectSql = `SELECT a.*, c.channel_id FROM alarm_infor a, channel c ${selectSql} AND c.code_id = a.camera_code 
      ORDER BY a.add_time DESC LIMIT ${pageNum}, ${pageSize}`;

    let sql = `${countSql};${selectSql}`;
    logger.debug(`分页查询遗留物sql: ${sql}`);
    let [err, result] = await mysqlDB.select(sql);
    if (err) {
      logger.error(`分页查询遗留物出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    return res
      .success({
        count: result[0][0].num,
        pageNum: pageNum + 1,
        pageSize: pageSize,
        data: result[1],
      })
      .toString();
  }

  /**
   * 手动处理告警
   * @param {Number} id 告警id
   */
  async handleAlarm(id) {
    let res = new Response();
    if (textUtils.isEmpty(id)) {
      return res.fail("id为空").toString();
    }
    let sql = `UPDATE alarm_infor SET alarm_process_state = 0 WHERE id = ${id}`;
    logger.debug(`告警处理sql: ${sql}`);
    let [err, _] = await mysqlDB.update(sql);
    if (err) {
      logger.error(`告警处理出错: err = ${err.message}`);
      return res.fail("处理失败").toString();
    }

    return res.success().toString();
  }

  /**
   * 分页查询告警策略
   * @param {String} code 策略code
   * @param {String} name 策略名
   * @param {Number} pageNum 页码
   * @param {Number} pageSize 每页大小
   */
  async pageByAlarmPolicy(code, name, groupId, userName, pageNum, pageSize) {
    pageNum = textUtils.isEmpty(pageNum) ? 0 : pageNum - 1;
    pageSize = textUtils.isEmpty(pageSize) ? 10 : parseInt(pageSize);
    pageNum = pageSize * pageNum;

    let res = new Response(),
      whereSql = "";
    if (textUtils.isNotEmpty(code)) {
      whereSql += ` AND a.policy_code LIKE '%${code}%'`;
    }
    if (textUtils.isNotEmpty(name)) {
      whereSql += ` AND a.policy_name LIKE '%${name}%'`;
    }

    let nodeSerial = {};
    try {
      nodeSerial = await nodeService.getNodesByGroupId(groupId, userName);
    } catch (e) {
      logger.info(e.message);
      return res.fail("组没有绑定节点").toString();
    }

    let sql = `SELECT * FROM alarm_policy a WHERE 1=1 ${whereSql} ORDER BY a.id LIMIT ${pageNum}, ${pageSize}`;
    let countSql = `SELECT COUNT(*) AS cnt FROM alarm_policy ${whereSql}`;
    if (nodeSerial.device && nodeSerial.device.length > 0) {
      sql = `select a.* from alarm_policy a, alarm_policy_channel_r r 
        where r.channel_id  in ('${nodeSerial.device
          .map((did) => String(did))
          .join("','")}') 
        and r.policy_code = a.policy_code ${whereSql} ORDER BY a.id LIMIT ${pageNum}, ${pageSize}`;
      countSql = `select count(*) as cnt from alarm_policy a, alarm_policy_channel_r r 
        where r.channel_id  in ('${nodeSerial.device
          .map((did) => String(did))
          .join("','")}') 
        and r.policy_code = a.policy_code ${whereSql}`;
    }

    sql = `SELECT t.*,u.cn_name FROM (${sql}) t LEFT OUTER JOIN user u on t.create_user = u.id GROUP BY t.policy_code`;
    sql = `${sql};${countSql}`;

    logger.debug(`分页查询告警策略sql: ${sql}`);
    let [err, result] = await mysqlDB.select(sql);
    if (err) {
      logger.error(`分页查询告警策略出错: err = ${err.message}`);
      return res.fail("处理失败").toString();
    }

    return res
      .success({
        cnt: result[1][0].cnt,
        list: result[0],
      })
      .toString();
  }

  /**
   * 删除告警策略
   * @param {Array} codes 策略code集合
   */
  async deleteAlarmPolicies(codes) {
    let res = new Response();
    if (textUtils.isEmpty(codes)) {
      return res.fail("策略code为空").toString();
    }

    let deleteSql = `DELETE FROM alarm_policy WHERE policy_code IN ('${codes.join(
      "','"
    )}');
      DELETE FROM alarm_policy_channel_r WHERE policy_code IN ('${codes.join(
        "','"
      )}')`;

    logger.debug(`告警策略删除sql: ${deleteSql}`);
    let [err, _] = await mysqlDB.delete(deleteSql);
    if (err) {
      logger.error(`告警策略删除出错: err = ${err.message}`);
      return res.fail("删除失败").toString();
    }

    return res.success().toString();
  }

  /**
   * 根据id查询告警策略
   * @param {Number} id 策略id
   * @param {String} code 策略code
   */
  async getAlarmPolicyById(id, code) {
    let res = new Response();
    if (textUtils.isEmpty(id)) {
      return res.fail("策略id为空").toString();
    }
    if (textUtils.isEmpty(code)) {
      return res.fail("策略code为空").toString();
    }

    let selectSql = `SELECT * FROM alarm_policy WHERE id=${id};
      SELECT channel_id FROM alarm_policy_channel_r WHERE policy_code='${code}';`;

    logger.debug(`查询告警策略sql: ${selectSql}`);
    let [err, result] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`查询告警策略出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    let data = result[0][0];
    data.channel_ids = result[1];
    return res.success(data).toString();
  }

  /**
   * 新增告警策略
   * @param {Object} params 参数
   */
  async saveAlarmPolicy(params) {
    let {
        userId,
        code,
        name,
        type,
        alarmType,
        startTime,
        endTime,
        channelIds,
        desc,
      } = params,
      res = new Response();
    if (
      textUtils.isEmpty(userId) ||
      textUtils.isEmpty(code) ||
      textUtils.isEmpty(name) ||
      textUtils.isEmpty(type) ||
      textUtils.isEmpty(alarmType) ||
      textUtils.isEmpty(startTime) ||
      textUtils.isEmpty(endTime) ||
      textUtils.isEmpty(channelIds)
    ) {
      return res.fail("必填项为空").toString();
    }

    let selectSql = `SELECT * FROM alarm_policy WHERE policy_code = '${code}'`;
    logger.debug(`查询策略code是否重复sql: ${selectSql}`);
    let [err, policy] = await mysqlDB.selectOne(selectSql);
    if (err) {
      logger.error(`查询告警策略出错: err = ${err.message}`);
      return res.fail("更新失败").toString();
    }
    if (policy) {
      logger.info(`告警策略code重复: code = ${code}`);
      return res.fail("策略code重复").toString();
    }

    let insertSql = `INSERT INTO alarm_policy (policy_code, policy_name, policy_type, alarm_type_code, 
      start_time, end_time, create_user, des) VALUES('${code}', '${name}', '${type}', '${alarmType}', '${startTime}',
      '${endTime}', ${userId}, '${desc}')`;

    let insertRelSql = `INSERT INTO alarm_policy_channel_r (channel_id,policy_code) VALUES `;
    channelIds.forEach((cid) => {
      insertRelSql += `('${cid}', '${code}'),`;
    });
    insertRelSql = insertRelSql.substr(0, insertRelSql.length - 1);

    insertSql = `${insertSql};${insertRelSql}`;
    logger.debug(`新增策略sql: ${insertSql}`);
    let [e, _] = await mysqlDB.insert(insertSql);
    if (e) {
      logger.error(`新增策略出错: err = ${e.message}`);
      return res.fail("新增失败").toString();
    }

    return res.success().toString();
  }

  /**
   * 修改告警策略
   * @param {Object} params 参数
   */
  async updateAlarmPolicy(params) {
    let {
        userId,
        code,
        name,
        type,
        startTime,
        endTime,
        channelIds,
        desc,
      } = params,
      res = new Response();
    if (
      textUtils.isEmpty(userId) ||
      textUtils.isEmpty(code) ||
      textUtils.isEmpty(name) ||
      textUtils.isEmpty(type) ||
      textUtils.isEmpty(startTime) ||
      textUtils.isEmpty(endTime) ||
      textUtils.isEmpty(channelIds)
    ) {
      return res.fail("必填项为空").toString();
    }

    let updateSql = `UPDATE alarm_policy SET policy_name = '${name}', policy_type = '${type}', 
      start_time = '${startTime}', end_time = '${endTime}', des = '${desc}' WHERE policy_code = '${code}'`,
      deleteRelSql = `DELETE FROM alarm_policy_channel_r WHERE policy_code = '${code}'`,
      insertRelSql = `INSERT INTO alarm_policy_channel_r (channel_id,policy_code) VALUES `;

    channelIds.forEach((cid) => {
      insertRelSql += `('${cid}', '${code}'),`;
    });
    insertRelSql = insertRelSql.substr(0, insertRelSql.length - 1);

    logger.debug(`更新告警策略sql: ${updateSql}`);
    logger.debug(`删除策略与摄像头的关联sql: ${deleteRelSql}`);
    logger.debug(`新增策略与摄像头的关联sql: ${insertRelSql}`);

    let sql = `${updateSql};${deleteRelSql};${insertRelSql}`;
    let [e, _] = await mysqlDB.execute(sql);
    if (e) {
      logger.error(`更新告警策略出错: err = ${e.message}`);
      return res.fail("更新失败").toString();
    }

    return res.success().toString();
  }

  /**
   * 查询告警策略
   */
  async getAlarmPolicyType() {
    let res = new Response(),
      selectSql = "SELECT * FROM alarm_type";

    logger.debug(`查询告警策略类型sql: ${selectSql}`);
    let [e, data] = await mysqlDB.select(selectSql);
    if (e) {
      logger.error(`查询告警策略出错: err = ${e.message}`);
      return res.fail("查询失败").toString();
    }

    return res.success(data).toString();
  }

  /**
   * 根据类型查询告警
   * @param {Number} type 类型
   * @param {Number} size 
   */
  async getAlarmByType(type, size=1) {
    let res = new Response(),
      selectSql = "SELECT * FROM alarm_infor";

    if (textUtils.isNotEmpty(type)) {
      selectSql += ` WHERE alarm_type_code = ${type}`;
    }

    selectSql += ` LIMIT 0, ${size}`;
    
    logger.debug(`根据类型查询告警sql: ${selectSql}`);
    let [e, data] = await mysqlDB.select(selectSql);
    if (e) {
      logger.error(`根据类型查询告警出错: err = ${e.message}`);
      return res.fail("查询失败").toString();
    }

    return res.success(data).toString();
  }
}

module.exports = new AlarmService();
