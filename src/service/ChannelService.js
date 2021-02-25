const Response = require("../utils/Response");
const mysqlDB = require("../utils/MySqlDB");
const textUtils = require("../utils/textUtils");
const timeUtils = require("../utils/timeUtils");
const logger = require("../utils/logger");
const nodeService = require("./NodeService");
const http = require("../utils/http");
const {
  service_Path,
  speed,
  network_ip,
  ffmpeg_exe_path,
} = require("../../config/config");

const util = require("util");
const exec = util.promisify(require("child_process").exec);

/**
 * 通道(摄像头即节点第6级)Service
 */
class ChannelService {
  constructor() {}

  /**
   * rtmp流截图
   * @param {String} rtmp 流地址
   * @param {String} imgName 图片名称
   */
  async rtmpScreenshot(rtmp, imgName) {
    let res = new Response();
    if (textUtils.isEmpty(rtmp)) {
      return res.fail("直播流为空,截图失败").toString();
    }
    if (textUtils.isEmpty(imgName)) {
      imgName = timeUtils.format(new Date(), "yyyyMMddhhmmss") + ".jpeg";
    }

    await exec(
      `${ffmpeg_exe_path}/ffmpeg.exe -i ${rtmp} -frames:v 1 ./public/${imgName}`
    );

    return res.success(`${imgName}`, "截图完成").toString();
  }

  /**
   * 分页查询通道(摄像头)信息
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
      channelName, // 通道名称/IP
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
      nodeSerial = await nodeService.getNodesByGroupId(groupId, userName, 5);
    } catch (e) {
      logger.error(e.message);
      return res.fail("组没有绑定节点").toString();
    }

    let whereSql = `WHERE a.area_id = sa.area_id AND sa.subarea_id = s.subarea_id AND s.site_id = r.site_id 
      AND r.room_id = rdr.room_id AND rdr.device_id = d.code_id`;
    let channelWhereSql = "";
    if (textUtils.isNotEmpty(areaId)) {
      whereSql += ` AND a.area_id = ${areaId}`;
    }
    if (nodeSerial && nodeSerial.area) {
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

    if (textUtils.isNotEmpty(channelName)) {
      channelWhereSql = ` AND c.channel_name LIKE '%${channelName}%' OR c.channel_ip LIKE '%${channelName}%'`;
    }
    if (nodeSerial.device && nodeSerial.device.length > 0) {
      whereSql += ` AND d.code_id in ('${nodeSerial.device
        .map((did) => String(did))
        .join("','")}')`;
    }

    let deviceCodeSql = `SELECT d.device_id FROM anhui_res_area a, anhui_res_subarea sa,
      anhui_res_site s, anhui_res_room r, device d, anhui_room_device_r rdr ${whereSql}`;
    let selectSql = `SELECT c.* FROM channel c WHERE c.channel_bearea 
      IN (${deviceCodeSql}) ${channelWhereSql} ORDER BY c.id DESC`;
    let countSql = `SELECT COUNT(*) AS count ${selectSql.substr(
      selectSql.indexOf("FROM")
    )}`;
    selectSql += ` LIMIT ${pageNum}, ${pageSize}`;

    selectSql = `${selectSql};${countSql}`;
    logger.debug(`分页查询通道(摄像头)sql: ${selectSql}`);
    let [err, result] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`分页查询通道(摄像头)出错: err = ${err.message}`);
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
   * 查询通道(摄像头)信息,带上下线状态
   * @param {Object} params 参数
   */
  async cameraStatePageBy(params) {
    let {
      groupId, // 组ID
      userName, // 用户登录名
      areaId, // 区域area_id
      subareaId, // 子区域subarea_id
      siteId, // 站点site_id
      roomId, // 机房room_id
      channelName, // 通道(摄像头)名称
      status, // 状态: 0下线, 1上线
      startTime, // 开始时间
      endTime, // 结束时间
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

    let selectChannelSql = `select a.area_name, sa.subarea_name, s.site_name, r.room_name, c.channel_name, 
      c.channel_id from anhui_res_area a, anhui_res_subarea sa, anhui_res_site s, 
      anhui_res_room r, device d, channel c, anhui_room_device_r rdr where a.area_id = sa.area_id 
      and sa.subarea_id = s.subarea_id and s.site_id = r.site_id and r.room_id = rdr.room_id 
      and d.code_id = rdr.device_id and d.device_id = c.channel_bearea`;

    if (textUtils.isNotEmpty(areaId)) {
      selectChannelSql += ` and a.area_id = ${areaId}`;
    }
    if (nodeSerial.area && nodeSerial.area.length > 0) {
      selectChannelSql += ` and a.area_id in (${nodeSerial.area.join(",")})`;
    }

    if (textUtils.isNotEmpty(subareaId)) {
      selectChannelSql += ` and sa.subarea_id = ${subareaId}`;
    }
    if (nodeSerial.subArea && nodeSerial.subArea.length > 0) {
      selectChannelSql += ` and sa.subarea_id in (${nodeSerial.subArea.join(
        ","
      )})`;
    }

    if (textUtils.isNotEmpty(siteId)) {
      selectChannelSql += ` and s.site_id = ${siteId}`;
    }
    if (nodeSerial.site && nodeSerial.site.length > 0) {
      selectChannelSql += ` and s.site_id in (${nodeSerial.site.join(",")})`;
    }

    if (textUtils.isNotEmpty(roomId)) {
      selectChannelSql += ` and r.room_id = ${roomId}`;
    }
    if (nodeSerial.room && nodeSerial.room.length > 0) {
      selectChannelSql += ` and r.room_id in (${nodeSerial.room.join(",")})`;
    }

    if (textUtils.isNotEmpty(channelName)) {
      selectChannelSql += ` and c.channel_name like '%${channelName}%'`;
    }
    if (nodeSerial.device && nodeSerial.device.length > 0) {
      selectChannelSql += ` AND d.code_id in ('${nodeSerial.device
        .map((did) => String(did))
        .join("','")}')`;
    }

    startTime = textUtils.isNotEmpty(startTime)
      ? startTime
      : timeUtils.format(new Date(), "yyyy-MM-dd") + " 00:00:00";
    endTime = textUtils.isNotEmpty(endTime)
      ? endTime
      : timeUtils.format(new Date(), "yyyy-MM-dd hh:mm:ss");

    let selectSql = `select csr.channel_id, csr.event_time, csr.status 
      from channel_status_record csr where csr.event_time >= '${startTime}' and csr.event_time <= '${endTime}'`;

    if (textUtils.isNotEmpty(status)) {
      selectSql += ` and csr.status = ${status}`;
    }

    logger.debug(`selectChannelSql: ${selectChannelSql}`);
    let [err, result] = await mysqlDB.select(selectChannelSql);
    if (err) {
      logger.error(`分页查询摄像头状态出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    let records = {};
    result &&
      result.forEach((csr) => {
        records[csr.channel_id] = {
          area_name: csr.area_name,
          subarea_name: csr.subarea_name,
          site_name: csr.site_name,
          room_name: csr.room_name,
          channelId: csr.channel_id,
          channel_name: csr.channel_name,
        };
      });

    selectSql += ` AND csr.channel_id in ('${Object.keys(records).join(
      "','"
    )}')`;
    selectSql += ` order by csr.event_time desc`;

    let countSql = `select count(*) as count ${selectSql.substr(
      selectSql.indexOf("from")
    )}`;
    selectSql += ` limit ${pageNum}, ${pageSize}`;

    selectSql = `${selectSql};${countSql}`;
    logger.debug(`分页查询摄像头状态sql: ${selectSql}`);
    [err, result] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`分页查询摄像头状态出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }
    logger.info("查询成功");
    let list;
    result[0] &&
      (list = result[0].map((it) => {
        let nodeInfo = records[it.channel_id];
        return Object.assign(it, {
          area_name: nodeInfo.area_name,
          subarea_name: nodeInfo.subarea_name,
          site_name: nodeInfo.site_name,
          room_name: nodeInfo.room_name,
          channelId: nodeInfo.channel_id,
          channel_name: nodeInfo.channel_name,
        });
      }));
    let data = {
      cnt: result[1][0].count,
      list: list,
    };
    return res.success(data).toString();
  }

  /**
   * 根据开始结束时间查询通道(摄像头)上下线信息
   * @param {String} startTime 开始时间
   * @param {String} endTime 结束时间
   */
  async getCameraOnlineMsg(startTime, endTime) {
    let res = new Response();
    startTime = textUtils.isNotEmpty(startTime)
      ? startTime
      : timeUtils.format(new Date(), "yyyy-MM-dd") + " 00:00:00";
    endTime = textUtils.isNotEmpty(endTime)
      ? endTime
      : timeUtils.format(new Date(), "yyyy-MM-dd hh:mm:ss");

    let selectSql = `SELECT tt.* FROM (SELECT t.channel_id, t.channel_name, t.channel_online, 
      (CASE WHEN channel_online = 0 THEN t.off_line_time ELSE t.on_line_time END) AS event_time 
      FROM (SELECT o.on_line_time, o.off_line_time, c.channel_id, c.channel_name, c.channel_online 
      FROM off_line_record o LEFT OUTER JOIN channel c ON o.channel_id = c.channel_id) t) tt 
      WHERE tt.event_time >= '${startTime}' AND tt.event_time <= '${endTime}' order by tt.event_time desc`;

    logger.debug(`根据开始结束时间查询通道(摄像头)上下线信息sql: ${selectSql}`);
    let [err, result] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(
        `根据开始结束时间查询通道(摄像头)上下线信息出错: err = ${err.message}`
      );
      return res.fail("查询失败").toString();
    }
    logger.info("查询成功");
    return res.success(result).toString();
  }

  /**
   * 根据机房ID查询摄像头
   * @param {Number} roomId 机房room_id
   */
  async getChannelInforByRoomId(roomId, is3d) {
    let res = new Response();
    if (textUtils.isEmpty(roomId)) {
      return res.fail("机房ID为空").toString();
    }

    let selectSql = `SELECT c.channel_id, c.channel_name, c.channel_ip, c.channel_port, c.channel_online 
      FROM channel c, device b, anhui_res_room r, anhui_room_device_r rdr WHERE c.channel_bearea = b.device_id 
      AND b.code_id = rdr.device_id AND r.room_id = rdr.room_id AND r.room_id = ${roomId}`;

    if (is3d) {
      selectSql = `SELECT c.channel_id, c.channel_name, c.channel_ip, c.channel_port, c.channel_online, 
      cl.location, cl.scale, cl.degree FROM channel c, device b, channel_location_infor cl, 
      anhui_res_room r, anhui_room_device_r rdr WHERE c.channel_bearea = b.device_id AND c.channel_id = cl.channelId 
      AND b.code_id = rdr.device_id AND r.room_id = rdr.room_id AND r.room_id = ${roomId}`;
    }
    logger.debug(
      `根据机房ID: room_id = ${roomId}, 查询摄像头sql: ${selectSql}`
    );

    let [err, result] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(
        `根据机房ID: room_id = ${roomId}, 查询摄像头出错: err = ${err.message}`
      );
      return res.fail("查询失败").toString();
    }

    return res.success(result).toString();
  }

  /**
   * 获取摄像头(通道)回看列表
   * @param {String} channelCode 摄像头(通道)code
   * @param {String} startTime 开始时间
   * @param {String} endTime 结束时间
   */
  async getChannelHlsList(channelCode, startTime, endTime) {
    logger.info(
      `查询摄像头回看列表: channelCode=${channelCode}, startTime=${startTime}, endTime=${endTime}`
    );
    let res = new Response();
    if (textUtils.isEmpty(channelCode)) {
      return res.fail("摄像头code为空").toString();
    }
    if (textUtils.isEmpty(startTime) || textUtils.isEmpty(endTime)) {
      return res.fail("开始或结束时间为空").toString();
    }
    let url = `${service_Path}vpm/vodInfo/${channelCode}/${startTime}/${endTime}`;

    logger.info(`发送请求到: ${url}`);

    let [err, data] = await http.get(url);
    if (err) {
      logger.error(`请求出错: url=${url}, err=${err.message}`);
      return res.fail("查询失败").toString();
    }

    return res.success(data).toString();
  }

  /**
   * 获取摄像头回看地址
   * @param {String} channelCode 摄像头(通道)code
   * @param {String} startTime 开始时间
   * @param {String} endTime 结束时间
   * @param {String} ip 本端ip
   */
  async getChannelHlsPath(channelCode, startTime, endTime, ip) {
    logger.info(
      `查询摄像头回看地址: channelCode=${channelCode}, startTime=${startTime}, endTime=${endTime}`
    );
    let res = new Response();
    if (textUtils.isEmpty(channelCode)) {
      return res.fail("摄像头code为空").toString();
    }
    if (textUtils.isEmpty(startTime) || textUtils.isEmpty(endTime)) {
      return res.fail("开始或结束时间为空").toString();
    }

    let url = `${service_Path}vpm/vodPlayUrl/${channelCode}/${startTime}/${endTime}/hls/0/${speed}`;

    logger.info(`发送请求到: ${url}`);

    let [err, data] = await http.get(url, {
      networkIp: ip,
    });

    if (err) {
      logger.error(`请求出错: url=${url}, err=${err.message}`);
      return res.fail("查询失败").toString();
    }

    //判断dcn网络转换IP
    if(ip.indexOf(network_ip.Intranet)===-1 && data){
      network_ip.stream.map((item) => {
        if (data.address.indexOf( item.Intranet)>-1) {
          let paly_url = data.address;
          let paly_bak = this.replaceDomain(item.Extranet, paly_url);
          data.address = paly_bak;
        }
      });
    }

    return res.success(data).toString();
  }

  /**
   * 获取摄像头直播地址
   * @param {String} channelCode 摄像头(通道)code
   * @param {String} ip 本端ip
   */
  async getChannelRtmpPath(channelCode, ip) {
    logger.info(`查询摄像头直播地址: channelCode=${channelCode}`);
    let res = new Response();
    if (textUtils.isEmpty(channelCode)) {
      return res.fail("摄像头code为空").toString();
    }

    let url = `${service_Path}vpm/liveStream/${channelCode}/http-flv/0/pull`;

    logger.info(`发送请求到: ${url}`);

    let [err, data] = await http.get(url, { networkIp: ip });

    if (err) {
      logger.error(`请求出错: url=${url}, err=${err.message}`);
      return res.fail("查询失败").toString();
    }

    if(ip.indexOf(network_ip.Intranet)===-1 && data){
      network_ip.stream.map((item) => {
        if (data.address.indexOf( item.Intranet)>-1) {
          let paly_url = data.address;
          let paly_bak = this.replaceDomain(item.Extranet, paly_url);
          data.address = paly_bak;
        }
      });
    }
    return res.success(data).toString();
  }

  /**
   * 摄像头关联机架
   * @param {String} channelId 摄像头
   * @param {Number} frameIds 机架id集合
   */
  async associationFrame(channelId, frameIds) {
    logger.info(
      `摄像头关联机架: channelId = ${channelId}, frameIds = ${frameIds}`
    );
    let res = new Response();
    if (textUtils.isEmpty(channelId)) {
      return res.fail("摄像头id为空").toString();
    }

    let deleteSql = `DELETE FROM anhui_res_frame_channel_r WHERE channel_id = '${channelId}'`,
      insertSql = "";
    if (frameIds && frameIds.length > 0) {
      insertSql = `INSERT INTO anhui_res_frame_channel_r (frame_id, channel_id) VALUES `;
      frameIds.forEach((fid) => {
        insertSql += `(${fid}, '${channelId}'),`;
      });
    }

    if (textUtils.isNotEmpty(insertSql)) {
      insertSql = insertSql.substr(0, insertSql.length - 1);
    }

    let sql = `${deleteSql};${insertSql}`;
    logger.debug(`摄像头关联机架sql: ${sql}`);

    let [err, _] = await mysqlDB.execute(sql);
    if (err) {
      logger.error(`摄像头关联机架出错: err = ${err.message}`);
      return res.fail("关联失败").toString();
    }

    return res.success().toString();
  }

  /**
   * 摄像头录像率统计
   */
  async statChannelVideo(areaId, time) {
    let res = new Response();

    let statSql = `SELECT online.area_id, online.count AS haveRecord, total.count AS totalRecord, 
      a.area_name AS areaName FROM 
      (SELECT COUNT(1) AS \`count\`, area_id FROM channel_video_record WHERE STATUS = 1 
      AND statistics_date = '${time}' GROUP BY area_id) online, 
      (SELECT COUNT(1) AS \`count\`, area_id FROM channel_video_record 
      WHERE statistics_date = '${time}' GROUP BY area_id) total, anhui_res_area a 
      WHERE online.area_id = total.area_id AND a.area_id = online.area_id`;

    if (textUtils.isNotEmpty(areaId)) {
      statSql += ` AND a.area_id = ${areaId}`;
    }
    logger.debug(`摄像头录像率统计sql: ${statSql}`);
    let [err, result] = await mysqlDB.select(statSql);
    if (err) {
      logger.error(`摄像头录像率统计出错: err = ${err.message}`);
      return res.fail("统计出错").toString();
    }
    return res.success(result).toString();
  }

  /**
   * 摄像头在线率统计
   */
  async statChannelOnlineNum(areaId, time) {
    let res = new Response(),
      statSql = `SELECT r.city_name as areaName, r.camera_online_num as online, r.camera_num as totalOnline 
        FROM stat_channel_state_infor r WHERE r.add_time = '${time}'`;

    if (textUtils.isNotEmpty(areaId)) {
      statSql += ` AND r.city_code = ${areaId}`;
    }
    logger.debug(`摄像头在线率统计sql: ${statSql}`);
    let [err, result] = await mysqlDB.select(statSql);
    if (err) {
      logger.error(`摄像头在线率统计出错: err = ${err.message}`);
      return res.fail("统计出错").toString();
    }

    return res.success(result).toString();
  }

  /**
   * 摄像头各项数据统计
   * @param {Number} roomId 机房room_id
   * @param {String} time 日期
   */
  async statChannelByRoomId(siteId, time) {
    let res = new Response();
    if (textUtils.isEmpty(siteId)) {
      return res.fail("统计失败, siteId为空").toString();
    }
    if (textUtils.isEmpty(time)) {
      time = timeUtils.format(new Date(), "yyyy-MM-dd");
    }

    // 人脸识别数
    let faceNumSql = `SELECT COUNT(1) AS num FROM face_recognition_infor WHERE computer_room_code 
      in (SELECT r.room_id FROM anhui_res_room r WHERE r.site_id = ${siteId}) AND add_time LIKE '${time}%'`,
      // 门禁数
      accessNumSql = `SELECT COUNT(1) AS num FROM anhui_res_access WHERE room_id 
        in (SELECT r.room_id FROM anhui_res_room r WHERE r.site_id = ${siteId})`,
      // 遗留物数
      alarmNumSql = `SELECT COUNT(1) AS num FROM alarm_infor WHERE computer_room_code 
        in (SELECT r.room_id FROM anhui_res_room r WHERE r.site_id = ${siteId}) AND add_time LIKE '${time}%' 
        AND alarm_type_code = (SELECT alarm_code FROM alarm_type WHERE alarm_name = '遗留物')`,
      // 摄像头数
      channelNumSql = `SELECT COUNT(1) AS num FROM channel c,(SELECT device_id FROM anhui_room_device_r 
        WHERE room_id IN(SELECT room_id FROM anhui_res_room WHERE site_id = ${siteId})) r 
        WHERE c.channel_id = r.device_id`;

    let sql = `${faceNumSql};${alarmNumSql};${channelNumSql};${accessNumSql}`;
    logger.debug(`统计机房下摄像头各项指标sql: ${sql}`);
    let [err, result] = await mysqlDB.select(sql);
    if (err) {
      logger.error(`统计机房下摄像头各项指标出错: err = ${err.message}`);
      return res.fail("统计失败").toString();
    }

    // 人脸识别数
    let faceNum = result[0][0].num;
    // 遗留物数量
    let alarmNum = result[1][0].num;
    // 摄像头总数
    let channelNum = result[2][0].num;
    // 门禁数
    let accessNum = result[3][0].num;

    let data = {
      faceNum: faceNum,
      cpRoomNum: accessNum,
      relicNum: alarmNum,
      cameraNum: channelNum,
    };

    return res.success(data).toString();
  }

  /**
   * 查询人员最新抓拍摄像头
   * @param {String} workerCode 人员code
   */
  async getLastChannelByWorkerCode(workerCode) {
    let res = new Response();
    if (textUtils.isEmpty(workerCode)) {
      return res.fail("查询失败").toString();
    }
    let selectSql = `SELECT channel_ids FROM worker_location_info WHERE worker_code = '${workerCode}' 
      ORDER BY create_time DESC LIMIT 1;`;

    logger.debug(`查询人员最新抓拍摄像头sql: ${selectSql}`);
    let [err, result] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`查询人员最新抓拍摄像头出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }
    let cIds = result[0].channel_ids;
    let cIdAry = cIds.split(",");

    return res.success({ channel_ids: cIdAry }).toString();
  }

  /**
   * 查询摄像头关联的设备
   * @param {String} channelId 摄像头channel_id
   */
  async queryBindDeviceByChannelId(channelId) {
    let res = new Response();
    let selectSql = `select device_id, device_name from anhui_res_device where channel_id = '${channelId}'`;
    logger.debug(`查询摄像头关联的设备sql: ${selectSql}`);
    let [err, result] = await mysqlDB.execute(selectSql);
    if (err) {
      console.log(
        `查询摄像头: channelId = ${channelId} 关联的设备出错: err = ${err.message}`
      );
      return res.fail("未查询到该摄像头关联的设备").toString();
    }

    return res.success(result).toString();
  }

  /**
   * 查询摄像头所属机房未被关联的设备
   * @param {String} channelId 摄像头channel_id
   */
  async queryUnBindDeviceByChannelId(channelId) {
    let res = new Response();
    let selectSql = `select device_id, device_name from anhui_res_device 
      where room_id in (SELECT r.room_id FROM anhui_res_room r, device d, channel c, anhui_room_device_r rdr 
      WHERE r.room_id = rdr.room_id AND d.code_id = rdr.device_id AND c.channel_bearea = d.device_id 
      AND c.channel_id = '${channelId}') and (frame_id is null or frame_id = '')
      and (channel_id is null or channel_id = '')`
    logger.debug(`查询摄像头所属机房未被关联的设备sql: ${selectSql}`);
    let [err, result] = await mysqlDB.execute(selectSql);
    if (err) {
      console.log(
        `查询摄像头: channelId = ${channelId} 所属机房未被关联的设备出错: err = ${err.message}`
      );
      return res.fail("未查询到该摄像头所属机房未被关联的设备").toString();
    }

    return res.success(result).toString();
  }

  /**
   * 更新摄像头关联的设备
   * @param {String} channelId 摄像头channel_id
   * @param {Array} addList 关联的设备
   * @param {Array} delList 取消关联的设备
   */
  async updateChannelBindDevices(channelId, addList, delList) {
    let res = new Response();
    let addSql = "",
      delSql = "";
    if (addList && addList.length > 0) {
      addSql = `update anhui_res_device set channel_id = '${channelId}' where device_id in (${addList.join(
        ","
      )});`;
    }
    if (delList && delList.length > 0) {
      delSql = `update anhui_res_device set channel_id = null where device_id in (${delList.join(
        ","
      )})`;
    }
    let updateSql = `${addSql}${delSql}`;
    logger.debug(`更新摄像头关联的设备sql: ${updateSql}`);
    let [err, _] = await mysqlDB.execute(updateSql);
    if (err) {
      logger.error(
        `更新摄像头: channelId = ${channelId} 关联的设备出错: err = ${err.message}`
      );
      return res.fail("更新摄像头关联的设备失败").toString();
    }

    return res.success(null, "更新摄像头关联的设备成功").toString();
  }

  /**
   * 查询首页轮播
   */
  async getChannelPlayUrl(ip) {
    let res = new Response(),
      selectSql = `SELECT * FROM star_channel WHERE 1=1 ORDER BY add_time DESC`;

    logger.debug(`查询首页轮播sql: ${selectSql}`);
    let [err, result] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`查询首页轮播出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    let arr = ip.split(".");
    if (ip.indexOf(network_ip.Intranet) === -1) {
      network_ip.stream.map((item) => {
        for (let i = 0; i < result.length; i++) {
          if (result[i].paly_url.indexOf(item.Intranet) > -1) {
            let paly_url = result[i].paly_url;
            let paly_bak = this.replaceDomain(item.Extranet, paly_url);
            result[i].paly_url = paly_bak;
          }
        }
      });
    }

    return res.success(result).toString();
  }

  /**
   * 替换图片ip
   * @param domain
   * @param url
   * @returns {string}
   */
  replaceDomain(domain, url) {
    let url_bak = "";
    if (url.indexOf("//") != -1) {
      let splitTemp = url.split("//");
      url_bak = splitTemp[0] + "//";
      url_bak = url_bak + domain;
      if (splitTemp.length >= 1 && splitTemp[1].indexOf("/") != -1) {
        let urlTemp2 = splitTemp[1].split("/");
        if (urlTemp2[0].split(":").length > 1) {
          url_bak = url_bak + ":" + urlTemp2[0].split(":")[1];
        }
        if (urlTemp2.length > 1) {
          for (let i = 1; i < urlTemp2.length; i++) {
            url_bak = url_bak + "/" + urlTemp2[i];
          }
        }
      }
    }
    return url_bak;
  }
}

module.exports = new ChannelService();
