const Response = require("../utils/Response");
const mysqlDB = require("../utils/MySqlDB");
const textUtils = require("../utils/textUtils");
const logger = require("../utils/logger");
const { network_ip } = require("../../config/config");
const Cache = require("../utils/Cache");
const nodeService = require("./NodeService");
const channelService = require("./ChannelService");

/**
 * 机房Service
 */
class RoomService {
  constructor() {}

  /**
   * 分页查询机房信息
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
      roomType, // 机房类型
      roomLevel, // 机房等级
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

    let whereSql =
      "WHERE sa.area_id = a.area_id AND s.subarea_id = sa.subarea_id AND r.site_id = s.site_id";
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

    if (textUtils.isNotEmpty(roomType)) {
      whereSql += ` AND r.room_type = '${roomType}'`;
    }

    if (textUtils.isNotEmpty(roomLevel)) {
      whereSql += ` AND r.room_level = '${roomLevel}'`;
    }

    let selectSql = `SELECT a.area_id,a.area_name,sa.subarea_id,sa.subarea_name,s.site_id,s.site_name,r.* 
          FROM anhui_res_area a,anhui_res_subarea sa,anhui_res_site s,anhui_res_room r ${whereSql} ORDER BY r.id`;
    let countSql = `SELECT COUNT(*) AS count ${selectSql.substr(
      selectSql.indexOf("FROM")
    )}`;
    selectSql += ` LIMIT ${pageNum}, ${pageSize}`;

    selectSql = `${selectSql};${countSql}`;
    logger.debug(`分页查询机房sql: ${selectSql}`);
    let [err, result] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`分页查询机房出错: err = ${err.message}`);
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
   * 机房关联摄像头
   * @param {Array} list 机房与摄像头关联列表
   * @example
   * [
   *  {
   *    "roomId": 1223,
   *    "deviceCodes": ["111", "222"]
   *  }
   * ]
   */
  async associationRoom(list) {
    let res = new Response();
    if (!list || list.length <= 0) {
      return res.fail("数据为空").toString();
    }

    let insertSql = "",
      roomRemoveDeviceList = [];
    list.forEach((item) => {
      let roomId = item.roomId,
        deviceCodes = item.deviceCodes;
      deviceCodes &&
        deviceCodes.length > 0 &&
        deviceCodes.forEach((code) => {
          insertSql += `(${roomId}, ${code}),`;
        });
      roomRemoveDeviceList.push(roomId);
    });
    textUtils.isNotEmpty(insertSql) &&
      (insertSql = `insert into anhui_room_device_r(room_id, device_id) values 
        ${insertSql.substr(0, insertSql.length - 1)}`);
    let deleteSql = `delete from anhui_room_device_r where room_id in (${roomRemoveDeviceList.join(
      ","
    )})`;
    let sql = `${deleteSql};${insertSql}`;

    let [err, _] = await mysqlDB.execute(sql);
    if (err) {
      logger.error(`机房关联摄像头出错: err = ${err.message}`);
      return res.fail("关联失败").toString();
    }

    await new Cache().clear();

    return res.success().toString();
  }

  /**
   * 获取人脸识别
   * @param {Object} params 参数
   */
  async getFaceRecord(params) {
    let {
        startTime, // 开始时间
        endTime, // 结束时间
        roomId, // 机房ID
        workerCode, // 人员code
        channelId, // 摄像头ID
        online, // 员工是否在线，0：在线；1：离线
        pageNum, // 当前页
        pageSize, // 每页显示数
        areaId, // 区域ID
        subareaId, // 子区域ID
        siteId, // 站点ID
        groupId, // 组ID
        userName, // 用户登录名
        ip, //
      } = params,
      res = new Response();

    pageNum = textUtils.isEmpty(pageNum) ? 0 : pageNum - 1;
    pageSize = textUtils.isEmpty(pageSize) ? 20 : parseInt(pageSize);
    pageNum = pageSize * pageNum;

    let nodeSerial = {};
    try {
      nodeSerial = await nodeService.getNodesByGroupId(groupId, userName);
    } catch (e) {
      logger.info(e.message);
      return res.fail("组没有绑定节点").toString();
    }

    let wSql = "WHERE w.is_invalid = 0";
    let fSql = "WHERE f.is_invalid = 0";
    let areaSql = `SELECT CONCAT( a.area_name, '-', sa.subarea_name, '-', s.site_name, '-', r.room_name ) 
      AS roomMsg, r.room_id FROM anhui_res_area a, anhui_res_subarea sa, anhui_res_site s, anhui_res_room r 
      WHERE a.area_id = sa.area_id AND s.subarea_id = sa.subarea_id AND r.site_id = s.site_id`;

    if (textUtils.isNotEmpty(online)) {
      wSql += ` AND w.type = ${online}`;
    }

    /*查询机房*/
    if (textUtils.isNotEmpty(roomId)) {
      areaSql += ` AND r.room_id = ${roomId}`;
      wSql += ` AND w.room_code = '${roomId}'`;
      fSql += ` AND f.computer_room_code = '${roomId}'`;
    }
    if (nodeSerial.room && nodeSerial.room.length > 0) {
      areaSql += ` AND r.room_id in (${nodeSerial.room.join(",")})`;
      wSql += ` AND w.room_code in ('${nodeSerial.room.join("','")}')`;
      fSql += ` AND f.computer_room_code in ('${nodeSerial.room.join("','")}')`;
    }

    let sqlBak = `SELECT r.room_id FROM anhui_res_area a, anhui_res_subarea sa, 
      anhui_res_site s, anhui_res_room r WHERE a.area_id = sa.area_id AND s.subarea_id = sa.subarea_id 
      AND r.site_id = s.site_id`;
    if (textUtils.isNotEmpty(areaId)) {
      areaSql += ` AND a.area_id = ${areaId}`;
      sqlBak += ` AND a.area_id = ${areaId}`;
      // wSql += ` AND w.room_code IN (SELECT r.room_id FROM anhui_res_area a, anhui_res_subarea sa, 
      //   anhui_res_site s, anhui_res_room r WHERE a.area_id = sa.area_id AND s.subarea_id = sa.subarea_id 
      //   AND r.site_id = s.site_id AND a.area_id = ${areaId})`;
      // fSql += ` AND f.computer_room_code IN (SELECT r.room_id FROM anhui_res_area a, anhui_res_subarea sa, 
      //   anhui_res_site s, anhui_res_room r WHERE a.area_id = sa.area_id AND s.subarea_id = sa.subarea_id 
      //   AND r.site_id = s.site_id AND a.area_id = ${areaId})`;
    }
    if (nodeSerial.area && nodeSerial.area.length > 0) {
      areaSql += ` AND a.area_id in (${nodeSerial.area.join(",")})`;
      sqlBak += ` AND a.area_id in (${nodeSerial.area.join(",")})`;
    }

    if (textUtils.isNotEmpty(subareaId)) {
      areaSql += ` AND sa.subarea_id = ${subareaId}`;
      // wSql += ` AND w.room_code IN (SELECT r.room_id FROM anhui_res_area a, anhui_res_subarea sa, 
      //   anhui_res_site s, anhui_res_room r WHERE a.area_id = sa.area_id AND s.subarea_id = sa.subarea_id 
      //   AND r.site_id = s.site_id AND sa.subarea_id = ${subareaId})`;
      // fSql += ` AND f.computer_room_code IN (SELECT r.room_id FROM anhui_res_area a, anhui_res_subarea sa, 
      //   anhui_res_site s, anhui_res_room r WHERE a.area_id = sa.area_id AND s.subarea_id = sa.subarea_id 
      //   AND r.site_id = s.site_id AND sa.subarea_id = ${subareaId})`;
      sqlBak += ` AND sa.subarea_id = ${subareaId}`;
    }
    if (nodeSerial.subArea && nodeSerial.subArea.length > 0) {
      areaSql += ` AND sa.subarea_id in (${nodeSerial.subArea.join(",")})`;
      sqlBak += ` AND sa.subarea_id in (${nodeSerial.subArea.join(",")})`;
    }

    if (textUtils.isNotEmpty(siteId)) {
      areaSql += ` AND s.site_id = ${siteId}`;
      // wSql += ` AND w.room_code IN (SELECT r.room_id FROM anhui_res_area a, anhui_res_subarea sa, 
      //   anhui_res_site s, anhui_res_room r WHERE a.area_id = sa.area_id AND s.subarea_id = sa.subarea_id 
      //   AND r.site_id = s.site_id AND s.site_id = ${siteId})`;
      // fSql += ` AND f.computer_room_code IN (SELECT r.room_id FROM anhui_res_area a, anhui_res_subarea sa, 
      //   anhui_res_site s, anhui_res_room r WHERE a.area_id = sa.area_id AND s.subarea_id = sa.subarea_id 
      //   AND r.site_id = s.site_id AND s.site_id = ${siteId})`;
      sqlBak += ` AND s.site_id = ${siteId}`;
    }
    if (nodeSerial.site && nodeSerial.site.length > 0) {
      areaSql += ` AND s.site_id in (${nodeSerial.site.join(",")})`;
      sqlBak += ` AND s.site_id in (${nodeSerial.site.join(",")})`;
    }
    wSql += ` AND w.room_code IN (${sqlBak})`;
    fSql += ` AND f.computer_room_code IN (${sqlBak})`;

    /*查询通道*/
    sqlBak = `SELECT CONCAT( a.area_name, '-', sa.subarea_name, '-', s.site_name, '-', r.room_name ) AS 
      roomMsg, r.room_id FROM anhui_res_area a, anhui_res_subarea sa, anhui_res_site s, anhui_res_room r, 
      device d, channel c, anhui_room_device_r rdr WHERE a.area_id = sa.area_id AND s.subarea_id = sa.subarea_id 
      AND r.site_id = s.site_id AND r.room_id = rdr.room_id AND d.code_id = rdr.device_id 
      AND c.channel_bearea = d.device_id`;
    sqlBak = `SELECT CONCAT( a.area_name, '-', sa.subarea_name, '-', s.site_name, '-', r.room_name ) AS roomMsg, 
      r.room_id FROM anhui_res_area a, anhui_res_subarea sa, anhui_res_site s, anhui_res_room r WHERE 
      a.area_id = sa.area_id AND s.subarea_id = sa.subarea_id AND r.site_id = s.site_id AND r.room_id IN (
      SELECT DISTINCT r.room_id FROM anhui_res_room r,device d, channel c, anhui_room_device_r rdr WHERE 
      r.room_id = rdr.room_id AND d.code_id = rdr.device_id AND c.channel_bearea = d.device_id`;
    if (textUtils.isNotEmpty(channelId)) {
      fSql += ` AND f.camera_code='${channelId}'`;
      wSql += ` AND w.channel_ids='${channelId}'`;
      areaSql = `${sqlBak} AND c.channel_id = '${channelId}'`;
      if (!(nodeSerial.device && nodeSerial.device.length > 0)) {
        areaSql += `)`;
      }
    }
    if (nodeSerial.device && nodeSerial.device.length > 0) {
      let csql = `SELECT c1.channel_id FROM channel c1, device d1 WHERE c1.channel_bearea = d1.device_id 
        AND d1.code_id in('${nodeSerial.device.map((did) => String(did)).join("','")}')`;
      fSql += ` AND f.camera_code in (${csql})`;
      wSql += ` AND w.channel_ids in (${csql})`;
      if (textUtils.isNotEmpty(channelId)) {
        areaSql += ` AND c.channel_id in (${csql}))`;
      } else {
        areaSql = `${sqlBak} AND c.channel_id in (${csql}))`;
      }
    }

    /*模糊查询用户名或身份证号*/
    if (textUtils.isNotEmpty(workerCode)) {
      fSql += ` AND f.worker_code LIKE '%${workerCode}%' OR f.worker_name LIKE '%${workerCode}%'`;
    }
    /*过滤开始结束时间*/
    if (textUtils.isNotEmpty(startTime) && textUtils.isNotEmpty(endTime)) {
      wSql += ` AND w.create_time >= '${startTime}' AND w.create_time <= '${endTime}'`;
      fSql += ` AND f.add_time >= '${startTime}' AND f.add_time <= '${endTime}'`;
    }
    //worker_location_info
    let w = `SELECT w.worker_code,w.room_code,w.create_time,w.channel_ids FROM worker_location_info w ${wSql} 
      GROUP BY w.worker_code,w.room_code,w.create_time ORDER BY w.create_time DESC`;
    let sql1 = `SELECT wt.worker_code,wt.room_code,wt.create_time,wt.channel_ids AS channel_id FROM (${w}) wt 
      GROUP BY wt.worker_code,wt.room_code ORDER BY wt.create_time DESC`;
    //face_recognition_infor
    let f = `SELECT f.worker_code, f.computer_room_code AS room_id, f.camera_code AS channel_id, 
      f.add_time AS create_time, f.worker_img, f.worker_name FROM face_recognition_infor f ${fSql} 
      GROUP BY f.worker_code,f.computer_room_code,f.add_time ORDER BY f.add_time DESC`;

    let sql = `SELECT t1.worker_code, t1.room_code, t1.channel_id AS camera_code, t2.worker_img, t2.worker_name, 
      t3.roomMsg FROM (${sql1}) t1,(${f}) t2,(${areaSql}) t3 WHERE t1.worker_code=t2.worker_code 
      AND t1.room_code=t2.room_id AND t1.channel_id=t2.channel_id AND t1.create_time=t2.create_time 
      AND t1.room_code=t3.room_id ORDER BY t1.create_time DESC LIMIT ${pageNum}, ${pageSize}`;
    let NewSql1 = `SELECT wt.worker_code,wt.room_code,wt.create_time,wt.channel_ids AS channel_id FROM (${w}) wt 
      GROUP BY wt.worker_code,wt.room_code ORDER BY wt.create_time DESC`;

    let countSql = `SELECT COUNT(DISTINCT t1.worker_code) AS cnt FROM (${NewSql1}) t1,(${f}) t2 
      WHERE t1.worker_code=t2.worker_code AND t1.room_code=t2.room_id AND t1.channel_id=t2.channel_id 
      AND t1.create_time=t2.create_time`;
    let selectSql = `${sql};${countSql}`;
    logger.debug(`人脸识别查询sql: ${selectSql}`);

    let [err, result] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`人脸识别查询出错: err = ${err.message}`);
      return res.fail("人脸识别查询失败").toString();
    }
    let list = result[0];
    let arr = ip.split(".");
    if(ip.indexOf(network_ip.Intranet)===-1){
      network_ip.img.map((item) => {
        for (let i = 0; i < list.length; i++) {
          if (list[i].worker_img.indexOf( item.Intranet)>-1) {
            let img = list[i].worker_img;
            let img_bak = channelService.replaceDomain(item.Extranet, img);
            list[i].worker_img = img_bak;
          }
        }
      });
    }


    let data = {
      pageSize,
      pageNum,
      cnt: result[1][0].cnt,
      data: list,
    };

    logger.info("查询成功");

    return res.success(data).toString();
  }

  /**
   * 查询机房等级
   * @param {string} roomId 机房room_id
   */
  async getRoomLevel(roomId) {
    let res = new Response(), selectSql = `SELECT DISTINCT room_level FROM anhui_res_room`;
    if (textUtils.isNotEmpty(roomId)) {
      selectSql += ` WHERE room_id = ${roomId}`;
    }
    
    logger.debug(`查询机房等级sql: ${selectSql}`);
    let [err, data] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`查询机房等级出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    return res.success(data).toString();
  }

  /**
   * 查询机房类型
   * @param {string} roomId 机房room_id 
   */
  async getRoomType(roomId) {
    let res = new Response(), selectSql = `SELECT DISTINCT room_type FROM anhui_res_room`;
    if (textUtils.isNotEmpty(roomId)) {
      selectSql += ` WHERE room_id = ${roomId}`;
    }
    
    logger.debug(`查询机房类型sql: ${selectSql}`);
    let [err, data] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`查询机房类型出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    return res.success(data).toString();
  }
}

module.exports = new RoomService();
