const config = require("../../config/config");
const Response = require("../utils/Response");
const StringUtils = require("../utils/StringUtils");
const ArrayUtils = require("../utils/ArrayUtils");
const mysqlDb = require("../utils/MySqlDB");
const logger = require("../utils/logger");
const http = require("../utils/http");

class AccessControlService {
  constructor() {}

  /**
   * 查询门禁记录
   * @param {String} devid 设备ID
   * @param {String} startTime 开始时间
   * @param {String} endTime 结束时间
   */
  async getCreditCardRecord(devid, startTime, endTime) {
    let res = new Response();
    let url = `${config.service_Path}vpm/getCreditCardRecord`;

    let queryString = "";
    if (StringUtils.isNotEmpty(devid)) {
      queryString += `&devid=${devid}`;
    }
    if (StringUtils.isNotEmpty(startTime)) {
      queryString += `&startTime=${startTime}`;
    }
    if (StringUtils.isNotEmpty(endTime)) {
      queryString += `&endTime=${endTime}`;
    }

    // pageNum = pageNum ? parseInt(pageNum) : 1;
    // pageSize = pageSize ? parseInt(pageSize) : 10;

    // queryString += `&pageNum=${pageNum}&pageSize=${pageSize}`;

    if (StringUtils.isNotEmpty(queryString)) {
      url += queryString.replace(/^&/, "?");
    }

    try {
      logger.info(`发送请求到: ${url}`);

      let [err, cords] = await http.get(url);
      if (err) {
        logger.error(`查询门禁记录出错: err = ${err.message}`);
        return res.fail("查询失败").toString();
      }

      res.success(cords);
    } catch (e) {
      res.fail("数据获取失败");
      logger.error(`请求出错: err = ${e.message}`);
    }

    return res.toString();
  }

  /**
   * 门禁列表
   */
  async getAccessControl() {
    let res = new Response();
    let url = `${config.service_Path}vpm/getAccessControl`;

    let response = syncRequest("GET", url);
    console.log("门禁列表: ", response.getBody().toString());
    let data = response.getBody().toString(),
      resObj = data ? JSON.parse(data) : null;
    console.log("code:", resObj.code);
    if (resObj && (resObj.code === 0 || resObj.code === "0")) {
      console.log("获取门禁列表数据成功");
      res.success(resObj.data);
    } else {
      res.fail("数据获取失败");
    }

    return res.toString();
  }

  /**
   * 大屏滚动门禁记录
   */
  async getOpendoorRec() {
    let res = new Response();
    let url = `${config.service_Path}vpm/getOpendoorRec`;

    logger.info(`发送请求到: ${url}`);

    try {
      let [err, cords] = await http.get(url);
      if (err) {
        logger.error(`大屏滚动门禁记录出错: err = ${err.message}`);
        return res.fail("查询失败").toString();
      }

      let newCords = [];
      cords.forEach((c) => {
        newCords.push({
          username: c.username || "无",
          card_no: c.cardno || "无",
          opentime: c.opentime,
        });
      });

      res.success(newCords)
    } catch (e) {
      res.fail("数据获取失败");
      logger.error(`请求出错: err = ${e.message}`);
    }

    return res.toString();
  }

  /**
   * 根据机房ID查询门禁
   * @param {Number} roomId 机房ID
   */
  async getAccessByRoomId(roomId) {
    let res = new Response();
    if (!roomId) {
      return res.fail("机房ID为空").toString();
    }
    let selectSql = `select access_id as id, access_name as name 
      from anhui_res_access where room_id = ${roomId}`;

    logger.debug(`根据机房ID查询门禁sql: ${selectSql}`);
    
    let [err, result] = await mysqlDb.execute(selectSql);
    if (err) {
      return res.fail("查询失败").toString();
    }

    return res.success(result).toString();
  }

  /**
   * 根据门禁ID查询摄像头
   * @param {String} accessId 门禁ID
   */
  async getChannelIdByAccessId(accessId) {
    let res = new Response();
    if (StringUtils.isEmpty(accessId)) {
      return res.fail("门禁ID为空").toString();
    }
    let selectSql = `select r.channel_id as channelId ,channel.channel_name as channelName 
      from anhui_res_access_channel_r r,channel  where r.access_id = '${accessId}' and channel.channel_id=r.channel_id`;

    logger.debug(`根据机房ID查询门禁sql: ${selectSql}`);

    let [err, result] = await mysqlDb.execute(selectSql);
    if (err) {
      return res.fail("查询失败").toString();
    }

    return res.success(result).toString();
  }

  /**
   * 新增门禁和摄像头关系
   * @param {Number} accessId 机房ID
   * @param {Array} channelIds 机房ID
   */
  async saveAccessChannelRel(accessId,channelIds) {
    let deleteRelateSql = `delete from anhui_res_access_channel_r where access_id = '${accessId}'`,
        insertRelateSql = "";
    if (ArrayUtils.isNotEmpty(channelIds)) {
      insertRelateSql = this.saveList(accessId, channelIds);
    }
    logger.debug(
        `更新门禁关系sql: ${deleteRelateSql};${insertRelateSql}`
    );
    let [err, result] = await mysqlDb.execute(
        `${deleteRelateSql};${insertRelateSql}`
    );
    let res = new Response();
    if (err) {
      logger.info(`更新门禁关系出错: err = ${err.message}`);
      return res.fail("更新门禁关系出错").toString();
    }
    logger.info("更新成功");
    return res.success(null).toString();
  }

  /**
   * 批量新增摄像头与门禁的关联
   * @param {Number} accessId 门禁ID
   * @param {Array} channelIds 摄像头Id集合
   */
  saveList(accessId, channelIds) {
    let insertSql = `insert into anhui_res_access_channel_r (access_id, channel_id) values`;
    channelIds.forEach(ncode => {
      insertSql += ` ('${accessId}', '${ncode}'),`;
    });
    console.log(`新增摄像头与门禁关联sql:${insertSql}`);

    if (insertSql.substr(insertSql.indexOf('values') + 'values'.length)) {
      return insertSql.substr(0, insertSql.length - 1);
    }
    return "";
  }
}

module.exports = new AccessControlService();
