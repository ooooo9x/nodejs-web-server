const mysqlDB = require("../utils/MySqlDB");
const Response = require("../utils/Response");
const textUtils = require("../utils/textUtils");
const logger = require("../utils/logger");
const nodeService = require("./NodeService");

/**
 * 机架Service
 */
class FeameService {
  constructor() {}

  /**
   * 查询机房下未被关联的设备
   * @param {Number} roomId 机房ID
   */
  async queryUnbindDeviceByRoomId(roomId) {
    let res = new Response();
    let selectSql = `select device_id, device_name from anhui_res_device 
          where room_id = ${roomId} and  frame_id is null or frame_id = ''`;
    let [err, result] = await mysqlDB.execute(selectSql);
    if (err) {
      console.log(
        `查询机房: roomId = ${roomId} 下未被机架关联的设备出错: err = ${err.message}`
      );
      res.fail("该机房下未查询到未被关联的设备");
      return res.toString();
    }

    res.success(result);
    return res.toString();
  }

  /**
   * 查询机架关联的设备
   * @param {Number} frameId 机架ID
   */
  async queryBindDeviceByFrameId(frameId) {
    let res = new Response();
    let selectSql = `select device_id, device_name from anhui_res_device where frame_id = ${frameId}`;
    let [err, result] = await mysqlDB.execute(selectSql);
    if (err) {
      console.log(
        `查询机架: frameId = ${frameId} 关联的设备出错: err = ${err.message}`
      );
      res.fail("未查询到该机架关联的设备");
      return res.toString();
    }

    res.success(result);
    return res.toString();
  }

  /**
   * 更新机架关联的设备
   * @param {Number} frameId 机架ID
   * @param {Array} addList 添加的设备集合
   * @param {Array} delList 移除的设备集合
   */
  async updateFrameBindDevices(frameId, addList, delList) {
    let res = new Response();
    let addSql = "",
      delSql = "";
    if (addList && addList.length > 0) {
      addSql = `update anhui_res_device set frame_id = '${frameId}' where device_id in (${addList.join(
        ","
      )});`;
    }
    if (delList && delList.length > 0) {
      delSql = `update anhui_res_device set frame_id = null where device_id in (${delList.join(
        ","
      )})`;
    }
    let updateSql = `${addSql}${delSql}`;
    console.log(`更新机架关联的设备sql: ${updateSql}`);
    let [err, _] = await mysqlDB.execute(updateSql);
    if (err) {
      console.log(
        `更新机架: frameId = ${frameId} 关联的设备出错: err = ${err.message}`
      );
      res.fail("更新机架关联的设备失败");
      return res.toString();
    }

    res.success(null, "更新机架关联的设备成功");
    return res.toString();
  }

  /**
   * 分页查询机架信息
   * @param {Object} params 参数
   */
  async pageBy(params) {
    let {
      groupId, // 组ID
      userName, // 用户登录名
      areaId, // 区域area_id
      subareaId, // 子区域subarea_id
      siteId, // 站点site_id
      roomId, // 机房room_id
      frameId, // 机架frame_id
      pageNum, // 当前页
      pageSize, // 每页显示数
    } = params;

    pageNum = textUtils.isEmpty(pageNum) ? 0 : pageNum - 1;
    pageSize = textUtils.isEmpty(pageSize) ? 20 : parseInt(pageSize);
    pageNum = pageSize * pageNum;

    // 获取用户组绑定的区域节点
    let nodeSerial = {},
      res = new Response();
    try {
      nodeSerial = await nodeService.getNodesByGroupId(groupId, userName);
    } catch (e) {
      logger.error(e.message);
      return res.fail("组没有绑定节点").toString();
    }

    let whereSql = `WHERE sa.area_id = a.area_id AND s.subarea_id = sa.subarea_id 
          AND r.site_id = s.site_id AND r.room_id = f.room_id`;
    if (textUtils.isNotEmpty(areaId)) {
      whereSql += ` AND a.area_id = ${areaId}`;
    }
    if (nodeSerial.area && nodeSerial.area.length > 0) {
      whereSql += ` AND a.area_id in (${nodeSerial.area.join(",")})`;
    }

    if (textUtils.isNotEmpty(subareaId)) {
      whereSql += ` AND sa.subarea_id = ${subareaId}`;
    }
    if (nodeSerial.subArea && nodeSerial.subArea.length > 0) {
      whereSql += ` AND sa.subarea_id in (${nodeSerial.subArea.join(",")})`;
    }

    if (textUtils.isNotEmpty(siteId)) {
      whereSql += ` AND s.site_id = ${siteId}`;
    }
    if (nodeSerial.site && nodeSerial.site.length > 0) {
      whereSql += ` AND s.site_id in (${nodeSerial.site.join(",")})`;
    }

    if (textUtils.isNotEmpty(roomId)) {
      whereSql += ` AND r.room_id = ${roomId}`;
    }
    if (nodeSerial.room && nodeSerial.room.length > 0) {
      whereSql += ` AND r.room_id in (${nodeSerial.room.join(",")})`;
    }

    if (textUtils.isNotEmpty(frameId)) {
      whereSql += ` AND f.frame_id = '${frameId}'`;
    }

    let selectSql = `SELECT a.area_id,a.area_name,sa.subarea_id,sa.subarea_name,s.site_id,
          s.site_name,r.room_id,r.room_name,f.* FROM anhui_res_area a,anhui_res_subarea sa,
          anhui_res_site s,anhui_res_room r,anhui_res_frame f ${whereSql} ORDER BY f.id`;
    let countSql = `SELECT COUNT(*) AS count ${selectSql.substr(
      selectSql.indexOf("FROM")
    )}`;
    selectSql += ` LIMIT ${pageNum}, ${pageSize}`;

    selectSql = `${selectSql};${countSql}`;
    logger.debug(`分页查询机架sql: ${selectSql}`);
    let [err, result] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`分页查询机架出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }
    logger.info("查询成功");
    let data = {
      cnt: result[1][0].count,
      list: result[0],
    };
    return res.success(data).toString();
  }

  /**
   * 根据机柜id获取机柜信息
   * @param {Number} frameId 机柜id
   */
  async getFrameInfoById(frameId) {
    logger.info(`根据id查询机架信息: ID = ${frameId}`);

    let res = new Response();
    if (textUtils.isEmpty(frameId)) {
      return res.fail("机架id为空").toString();
    }

    let selectSql = `SELECT a.area_name, sa.subarea_name, s.site_name, r.room_name, f.frame_name, 
      a.area_id, sa.subarea_id, s.site_id, r.room_id, f.frame_id FROM anhui_res_area a, anhui_res_subarea sa, 
      anhui_res_site s, anhui_res_room r, anhui_res_frame f WHERE f.frame_id = ${frameId} 
      AND f.room_id = r.room_id AND r.site_id = s.site_id AND s.subarea_id = sa.subarea_id 
      AND sa.area_id = a.area_id`;

    logger.debug(`根据id查询机架信息sql: ${selectSql}`);

    let [err, data] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`根据id查询机架信息出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    return res.success(data).toString();
  }

  /**
   * 根据摄像头id查询关联的机架
   * @param {String} channelId 摄像头(通道)id
   */
  async getFrameListByChannelId(channelId) {
    let res = new Response();
    if (textUtils.isEmpty(channelId)) {
      return res.fail("摄像头id为空").toString();
    }

    let selectSql = `SELECT DISTINCT f.* FROM anhui_res_frame f, anhui_res_frame_channel_r fc 
      WHERE fc.channel_id = '${channelId}' AND f.frame_id = fc.frame_id`;

    logger.debug(`根据摄像头id查询机架sql: ${selectSql}`);
    let [err, data] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`根据摄像头id查询机架出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    return res.success(data).toString();
  }

  /**
   * 根据摄像头id查询所属机房下未被关联的机架
   * @param {String} channelId 摄像头(通道)id
   */
  async getUnbindFrameByChannelId(channelId) {
    let res = new Response();
    if (textUtils.isEmpty(channelId)) {
      return res.fail("摄像头id为空").toString();
    }

    let selectSql = `SELECT DISTINCT f.* FROM channel c, device d, anhui_res_room r, anhui_res_frame f, 
      anhui_room_device_r rdr WHERE c.channel_id = '${channelId}' AND c.channel_bearea = d.device_id 
      AND d.code_id = rdr.device_id AND r.room_id = rdr.room_id AND r.room_id = f.room_id AND f.frame_id 
      NOT IN ( SELECT fc.frame_id FROM anhui_res_frame_channel_r fc WHERE fc.channel_id = '${channelId}' )`

    logger.debug(`根据摄像头id查询机架sql: ${selectSql}`);
    let [err, data] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`根据摄像头id查询机架出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    return res.success(data).toString();
  }
}

module.exports = new FeameService();
