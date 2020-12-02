const Response = require("../utils/Response");
const mysqlDB = require("../utils/MySqlDB");
const logger = require("../utils/logger");
const textUtils = require("../utils/textUtils");
const timeUtils = require("../utils/timeUtils");

/**
 * 云眼Service
 */
class CloudEyeService {
  constructor() {}

  /**
   * 查询直播地址
   * @param {Number} type 直播类型：AR 0, 普通 1，默认0
   * @param {Number} size 获取地址个数，默认1
   */
  async getLivePlayUrlByType(type = 0, size = 1) {
    let res = new Response(),
      selectSql = `SELECT camera_code as id, camera_name as channelName, paly_url as playUrl 
        FROM star_channel WHERE \`type\` = ${type} LIMIT 0, ${size}`;

    logger.debug(`查询直播地址sql: ${selectSql}`);
    let [err, data] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`查询直播地址出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    return res.success(data).toString();
  }

  /**
   * 标签类型
   * @param {Number} id
   */
  async getTagType(id) {
    let res = new Response(),
      selectSql = `SELECT * FROM cloudeye_tag_type`;

    if (textUtils.isNotEmpty(id)) {
      selectSql += ` AND id = ${id}`;
    }

    logger.debug(`查询标签类型sql: ${selectSql}`);
    let [err, data] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`查询标签类型出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    return res.success(data).toString();
  }

  /**
   * 查询所有设备
   */
  async getAllChannel() {
    let res = new Response(),
      selectSql = `SELECT channel_id, channel_name FROM channel`;

    logger.debug(`查询所有设备sql: ${selectSql}`);
    let [err, data] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`查询所有设备出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    return res.success(data).toString();
  }

  /**
   * 获取所有的点位
   * @param {String} channelId
   * @param {Number} userId
   */
  async getPointsByChannelId(channelId, userId) {
    let res = new Response(),
      selectSql = `SELECT (SELECT DISTINCT 1 FROM cloudeye_event_infor ev WHERE ev.channel_id = point.channel_id) 
        as is_event,(SELECT DISTINCT 1 FROM cloudeye_user_point_r collect 
        WHERE collect.point_id=point.id and collect.user_id=${userId}) as is_collect,
        (SELECT DISTINCT 1 FROM cloudeye_event_infor ev WHERE ev.channel_id=point.channel_id and ev.status='1') 
        as is_alarm, point.* FROM cloudeye_mark_point_infor point WHERE point.camera_id='${channelId}'`;

    logger.debug(`查询设备点位sql: ${selectSql}`);
    let [err, data] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`查询设备点位出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    return res.success(data).toString();
  }

  /**
   * 点位添加
   */
  async addMarkPoint(params) {
    let {
        markName, // 点位名称（标签名称）
        tagTypeId, // 标签类型id
        channelId, // 摄像头id
        markX, // x坐标值
        markY, // y坐标值
        description, // 标签描述
        cameraId, // 广角摄像头的id
      } = params,
      res = new Response(),
      insertSql = `INSERT INTO cloudeye_mark_point_infor(mark_name, tag_type_id, channel_id, mark_x, 
        mark_y, description, camera_id, add_time) values('${markName}', '${tagTypeId}', '${channelId}', 
        '${markX}', '${markY}', '${description}', '${cameraId}', '${timeUtils.getSystemTime()}')`;

    logger.debug(`新增标点sql: ${insertSql}`);
    let [err] = await mysqlDB.insert(insertSql);
    if (err) {
      logger.error(`新增标点出错: err = ${err.message}`);
      return res.fail("新增失败").toString();
    }

    return res.success(null).toString();
  }

  /**
   * 更新标点
   * @param {Object} params
   */
  async updateMarkPoint(params) {
    let {
        id,
        markName, // 点位名称（标签名称）
        tagTypeId, // 标签类型id
        channelId, // 摄像头id
        markX, // x坐标值
        markY, // y坐标值
        description, // 标签描述
        cameraId, // 广角摄像头的id
      } = params,
      res = new Response(),
      updateSql = `UPDATE cloudeye_mark_point_infor set`;
    if (textUtils.isNotEmpty(markName)) {
      updateSql += ` mark_name = '${markName}',`;
    }
    if (textUtils.isNotEmpty(tagTypeId)) {
      updateSql += ` tag_type_id = '${tagTypeId}',`;
    }
    if (textUtils.isNotEmpty(channelId)) {
      updateSql += ` channel_id = '${channelId}',`;
    }
    if (textUtils.isNotEmpty(markX)) {
      updateSql += ` mark_x = '${markX}',`;
    }
    if (textUtils.isNotEmpty(markY)) {
      updateSql += ` mark_y = '${markY}',`;
    }
    if (textUtils.isNotEmpty(description)) {
      updateSql += ` description = '${description}',`;
    }
    if (textUtils.isNotEmpty(cameraId)) {
      updateSql += ` camera_id = '${cameraId}',`;
    }

    if (textUtils.isEmpty(updateSql.split("set")[1])) {
      return res.fail("数据无更改").toString();
    }
    updateSql = updateSql.substr(0, updateSql.length - 1) + ` where id = ${id}`;

    logger.debug(`更新标点sql: ${updateSql}`);
    let [err] = await mysqlDB.insert(updateSql);
    if (err) {
      logger.error(`更新标点出错: err = ${err.message}`);
      return res.fail("更新失败").toString();
    }

    return res.success(null).toString();
  }

  /**
   * 删除标点
   * @param {Number} id 标点id
   */
  async deleteMarkPoint(id) {
    let res = new Response(),
      deleteSql = `DELETE FROM cloudeye_mark_point_infor WHERE id = ${id}`;

    logger.debug(`删除标点sql: ${deleteSql}`);
    let [err] = await mysqlDB.delete(deleteSql);
    if (err) {
      logger.error(`删除标点出错: err = ${err.message}`);
      return res.fail("删除失败").toString();
    }

    return res.success(null).toString();
  }

  /**
   * 事件查询
   * @param {String} name 标签或事件名称
   * @param {String} channelId 摄像头id
   * @param {String} startTime 事件开始时间
   * @param {String} endTime 事件结束时间
   */
  async searchEvent(name, channelId, startTime, endTime) {
    let res = new Response();

    let selectSql = "";
    if (textUtils.isNotEmpty(channelId)) {
      selectSql = `SELECT * FROM cloudeye_event_infor event WHERE channel_id = '${channelId}'`;
    } else {
      let selectLabel = `SELECT * FROM cloudeye_event_infor where type_id in 
        (SELECT id FROM cloudeye_event_type`;

      let selectEvent = `SELECT * FROM cloudeye_event_infor where channel_id in 
        (SELECT channel_id from cloudeye_mark_point_infor where tag_type_id in 
          (SELECT id FROM cloudeye_tag_type`;

      if (textUtils.isNotEmpty(name)) {
        selectLabel += ` WHERE name like '%${name}%'`;
        selectEvent += ` WHERE name like '%${name}%'`;
      }
      selectSql = `SELECT * from (${selectLabel}) union ${selectEvent}))) event WHERE 1=1`;
    }
    if (textUtils.isNotEmpty(startTime)) {
      selectSql += ` AND start_time >='${startTime}'`;
    }
    if (textUtils.isNotEmpty(endTime)) {
      selectSql += ` AND end_time <='${endTime}'`;
    }
    selectSql += " ORDER BY event.id DESC";

    logger.debug(`事件查询sql: ${selectSql}`);
    let [err, data] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`事件查询出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    return res.success(data).toString();
  }

  /**
   * 查询事件类型
   * @param {Number} id 事件类型id
   */
  async getEventTypeById(id) {
    let res = new Response(),
      selectSql = `SELECT * FROM cloudeye_event_type WHERE 1=1`;

    if (textUtils.isNotEmpty(id)) {
      selectSql += ` AND id = ${id}`;
    }
    logger.debug(`查询事件类型sql: ${selectSql}`);
    let [err, data] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`查询事件类型出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    return res.success(data).toString();
  }

  /**
   * 删除事件
   * @param {Number} id 事件id
   */
  async deleteEventInfoById(id) {
    let res = new Response(),
      deleteSql = `DELETE FROM cloudeye_event_infor WHERE id = ${id}`;

    logger.debug(`删除事件sql: ${deleteSql}`);
    let [err] = await mysqlDB.delete(deleteSql);
    if (err) {
      logger.error(`删除事件出错: err = ${err.message}`);
      return res.fail("删除失败").toString();
    }

    return res.success(null).toString();
  }

  /**
   * 新增收藏点位
   * @param {Number} userId 用户id
   * @param {Number} pointId 标点id
   */
  async addUserCollectPoint(userId, pointId) {
    let res = new Response(),
      insertSql = `INSERT INTO cloudeye_user_point_r(user_id, point_id, add_time) values(${userId}, ${pointId}, 
        '${timeUtils.getSystemTime()}')`;

    logger.debug(`新增收藏点位sql: ${insertSql}`);
    let [err] = await mysqlDB.insert(insertSql);
    if (err) {
      logger.error(`新增收藏点位出错: err = ${err.message}`);
      return res.fail("新增失败").toString();
    }

    return res.success(null).toString();
  }

  /**
   * 查询收藏点位
   * @param {Number} userId 用户id
   */
  async searchUserCollectPoint(userId) {
    let res = new Response(),
      selectSql = `SELECT r.id, p.mark_name AS pointName, p.tag_type_id as tagTypeId 
        FROM cloudeye_user_point_r r, cloudeye_mark_point_infor p 
        WHERE r.point_id = p.id AND r.user_id = ${userId}`;

    logger.debug(`查询收藏点位sql: ${selectSql}`);
    let [err, data] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`查询收藏点位出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    return res.success(data).toString();
  }

  /**
   * 删除收藏点位
   * @param {Number} id
   */
  async removeUserCollectPoint(id) {
    let res = new Response(),
      deleteSql = `DELETE FROM cloudeye_user_point_r WHERE id = ${id}`;

    logger.debug(`删除收藏点位sql: ${deleteSql}`);
    let [err] = await mysqlDB.delete(deleteSql);
    if (err) {
      logger.error(`删除收藏点位出错: err = ${err.message}`);
      return res.fail("删除失败").toString();
    }

    return res.success(null).toString();
  }
}

module.exports = new CloudEyeService();
