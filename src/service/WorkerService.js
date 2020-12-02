const Response = require("../utils/Response");
const mysqlDB = require("../utils/MySqlDB");
const textUtils = require("../utils/textUtils");
const timeUtils = require("../utils/timeUtils");
const logger = require("../utils/logger");
const { service_Path, network_ip } = require("../../config/config");
const http = require("../utils/http");
const channelService = require("./ChannelService");

/**
 * 人员Service
 */
class WorkerService {
  constructor() {}

  /**
   * 获取机房下的所有人员信息
   * @param {String} roomId 机房room_id
   */
  async getAllUserInforByRoomCode(roomId) {
    let res = new Response();
    if (textUtils.isEmpty(roomId)) {
      return res.fail("机房code为空").toString();
    }

    let url = `${service_Path}point/initPoint/${roomId}`;

    logger.info(`发送请求到: ${url}`);

    let [err, data] = await http.get(url);
    if (err) {
      logger.error(`请求出错: url=${url}, err=${err.message}`);
      return res.fail("查询失败").toString();
    }

    return res.success(data).toString();
  }

  /**
   * 获取用户的移动轨迹(包括虚拟点位,用于3d机房人员移动)
   * @param {String} roomId 机房room_id
   * @param {String} workerCode 人员code
   */
  async getWorkerHistoryMoveLocalInfor(roomId, workerCode) {
    logger.info(
      `获取用户的移动轨迹: roomId=${roomId}, workerCode=${workerCode}`
    );
    let res = new Response();
    if (textUtils.isEmpty(roomId)) {
      return res.fail("机房code为空").toString();
    }
    if (textUtils.isEmpty(workerCode)) {
      return res.fail("人员code为空").toString();
    }

    //获取人员当前位置
    let sqlNowLocation = `SELECT id,location FROM worker_location_info WHERE worker_code = '${workerCode}' 
      AND room_code = '${roomId}' AND create_time LIKE '${timeUtils.getNowTime()}%' ORDER BY create_time ASC`,
      //获取当前机房的所有点位
      sqlAllLocation = `SELECT * FROM point_position WHERE room_code = '${roomId}'`;

    logger.debug(`获取人员当前位置sql: ${sqlNowLocation}`);
    logger.debug(`获取当前机房的所有点位sql: ${sqlAllLocation}`);

    let [err, result] = await mysqlDB.select(
      `${sqlNowLocation};${sqlAllLocation}`
    );
    if (err) {
      logger.error(
        `获取人员历史路径出错: roomId = ${roomId}, workerCode = ${workerCode}, err = ${err.message}`
      );
      return res.fail("查询失败").toString();
    }
    if (!result || result.length <= 0) {
      return res.success(null, "暂无当前人员轨迹信息").toString();
    }

    //获取人员移动的轨迹
    let moveArry = result[0];
    //机房所有点位
    let allLocalList = result[1],
      allLocalMap = {};
    allLocalList &&
      allLocalList.forEach((loc) => {
        allLocalMap[loc.position_code] = loc.location;
      });

    //记录下整个移动过程中的最短路径信息
    let hisLocals = [];

    for (var i = 0, len = moveArry.length - 1; i < len; i++) {
      let startLocal = moveArry[i].location,
        endLocal = moveArry[i + 1].location;
      //组装请求地址
      let url = `${service_Path}vpm/floyd/${startLocal}/${endLocal}/${roomId}`;

      logger.info(`发送请求到: ${url}`);

      let [err, localCodes] = await http.get(url);
      if (err) {
        logger.error(`请求出错: url=${url}, err=${err.message}`);
        return res.fail("查询失败").toString();
      }

      localCodes &&
        localCodes.forEach((code) => {
          hisLocals.push({
            id: code,
            location: allLocalMap[code],
          });
        });
    }

    return res.success(hisLocals.reverse()).toString();
  }

  /**
   * 获取用户的历史移动轨迹(包括虚拟点位,用于2d)
   * @param {String} roomId 机房room_id
   * @param {String} workerCode 人员code
   * @param {String} startTime 开始时间
   * @param {String} endTime 结束时间
   */
  async getWorkerHistoryTrajectory(roomId, workerCode, startTime, endTime) {
    logger.info(
      `获取用户的历史移动轨迹: roomId=${roomId}, workerCode=${workerCode}, startTime=${startTime}, endTime=${endTime}`
    );
    let res = new Response();
    if (textUtils.isEmpty(roomId)) {
      return res.fail("机房code为空").toString();
    }
    if (textUtils.isEmpty(workerCode)) {
      return res.fail("人员code为空").toString();
    }
    if (textUtils.isEmpty(startTime) || textUtils.isEmpty(endTime)) {
      return res.fail("开始或结束时间为空").toString();
    }

    let url = `${service_Path}point/hisPath/${roomId}/${workerCode}/${startTime}/${endTime}`;

    logger.info(`发送请求到: ${url}`);

    let [err, data] = await http.get(url);
    if (err) {
      logger.error(`获取用户的历史移动轨迹出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    return res.success(data).toString();
  }

  /**
   * 获取人员的当前位置
   * @param {String} roomId 机房room_id
   * @param {String} workerCode 人员code
   * @param {String} time 上一次点位对应的时间
   */
  async getWorkerNowLocalInfor(roomId, workerCode, time) {
    logger.info(
      `获取人员的当前位置: roomId=${roomId}, workerCode=${workerCode}, time=${time}`
    );
    let res = new Response();
    if (textUtils.isEmpty(roomId)) {
      return res.fail("机房code为空").toString();
    }
    if (textUtils.isEmpty(workerCode)) {
      return res.fail("人员code为空").toString();
    }
    if (textUtils.isEmpty(time)) {
      return res.fail("上一次点位对应的时间为空").toString();
    }

    let url = `${service_Path}point/newPath/${roomId}/${workerCode}/${time}`;

    logger.info(`发送请求到: ${url}`);

    let [err, data] = await http.get(url);
    if (err) {
      logger.error(`获取人员的当前位置出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    return res.success(data).toString();
  }

  /**
   * 根据code查询人员信息
   * @param {String} code 人员code
   */
  async getWorkerByCode(code) {
    logger.info(`根据code查询人员信息: code=${code}`);
    let res = new Response();
    if (textUtils.isEmpty(code)) {
      return res.fail("人员code为空").toString();
    }

    let selectSql = `SELECT worker_code,worker_name,phone_num,worker_img FROM face_recognition_infor 
      WHERE worker_code = '${code}' ORDER BY id DESC LIMIT 0,1`;

    logger.debug(`查询人员信息sql: ${selectSql}`);

    let [err, worker] = await mysqlDB.selectOne(selectSql);
    if (err) {
      logger.error(`查询人员信息出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    return res.success(worker).toString();
  }

  /**
   * 查询人员历史轨迹抓拍列表
   * @param {String} roomId 机房room_id
   * @param {String} workerCode 人员code
   * @param {String} startTime 开始时间
   * @param {String} endTime 结束时间
   */
  async getWorkerHistoricalTrackList(roomId, workerCode, startTime, endTime) {
    logger.info(
      `查询人员历史轨迹抓拍列表: roomId=${roomId}, workerCode=${workerCode}, startTime=${startTime}, endTime=${endTime}`
    );
    let res = new Response();
    if (textUtils.isEmpty(roomId)) {
      return res.fail("摄像头code为空").toString();
    }
    if (textUtils.isEmpty(workerCode)) {
      return res.fail("人员code为空").toString();
    }
    if (textUtils.isEmpty(startTime) || textUtils.isEmpty(endTime)) {
      return res.fail("开始或结束时间为空").toString();
    }

    let selectSql = `SELECT channel_ids as channelId, create_time as createTime FROM worker_location_info 
      WHERE is_invalid = 0 AND worker_code = '${workerCode}' AND room_code = '${roomId}' 
      AND create_time >= '${startTime}' AND create_time <= '${endTime}'`;

    logger.debug(`查询人员历史轨迹抓拍列表sql: ${selectSql}`);

    let [err, data] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`查询人员历史轨迹抓拍列表出错: err=${err.message}`);
      return res.fail("查询失败").toString();
    }

    return res.success(data).toString();
  }

  /**
   * 人脸识别获取(首页)
   * @param {Number} startId 上次查询最后一条数据的id
   * @param {Number} pageSize 查询数量
   * @param {String} ip ip
   */
  async getFaceRecUserImg(startId, pageSize, ip) {
    let res = new Response();
    if (textUtils.isEmpty(startId) || textUtils.isEmpty(pageSize)) {
      return res.fail("查询失败,必填参数为空").toString();
    }

    (pageSize = parseInt(pageSize)), (startId = parseInt(startId));

    // '2020-06-18';
    let timeStr = timeUtils.getNowTime(),
      sql = "";
    if (startId === 0) {
      sql = `SELECT DISTINCT * FROM face_recognition_infor 
        WHERE add_time LIKE '${timeStr}%'  LIMIT 0, ${pageSize}`;
    } else {
      let idAry = [];
      for (let i = 1; i <= pageSize; i++) {
        idAry.push(startId + i);
      }
      sql = `SELECT DISTINCT * FROM face_recognition_infor 
        WHERE add_time LIKE '${timeStr}%' AND id IN (${idAry.join(",")})`;
    }

    logger.debug(`人脸识别获取(首页)sql: ${sql}`);
    let [err, result] = await mysqlDB.select(sql);
    if (err) {
      logger.error(`人脸识别获取(首页)出错: err=${err.message}`);
      return res.fail("查询失败").toString();
    }

    let arr = ip.split(".");
    if(ip.indexOf(network_ip.Intranet)===-1){
      network_ip.img.map((item) => {
        for (let i = 0; i < result.length; i++) {
          if (result[i].worker_img.indexOf( item.Intranet)>-1) {
            let img = result[i].worker_img;
            let img_bak = channelService.replaceDomain(item.Extranet, img);
            result[i].worker_img = img_bak;
          }
        }
      });
    }
    return res.success(result).toString();
  }

  /**
   * 查询当日各地区机房人脸识别数(首页)
   */
  async getFaceRecSum() {
    let startTime = timeUtils.getNowTime(),
      res = new Response();
    let selectSql = `SELECT city, city_code, COUNT(*) AS num FROM face_recognition_infor 
      WHERE add_time >= '${startTime}' GROUP BY city ORDER BY city DESC`;

    logger.debug(`查询当日各地区机房人脸识别数(首页)sql: ${selectSql}`);
    let [err, result] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(
        `查询当日各地区机房人脸识别数(首页)出错: err=${err.message}`
      );
      return res.fail("查询失败").toString();
    }

    return res.success(result).toString();
  }
}

module.exports = new WorkerService();
