const Response = require("../utils/Response");
const mysqlDB = require("../utils/MySqlDB");
const textUtils = require("../utils/textUtils");
const logger = require("../utils/logger");
const nodeService = require("./NodeService");

/**
 * 设备(机架中的设备)Service
 */
class DeviceService {
  constructor() {}

  /**
   * 分页查询设备信息
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
      deviceName, // 设备名称
      deviceCode, // 设备device_code
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

    let whereSql = `WHERE sa.area_id = a.area_id AND s.subarea_id = sa.subarea_id AND r.site_id = s.site_id 
          AND r.room_id = f.room_id AND f.frame_id = d.frame_id`;
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
      whereSql += ` AND f.frame_id='${frameId}'`;
    }

    if (textUtils.isNotEmpty(deviceName)) {
      whereSql += ` AND d.device_name LIKE '%${deviceName}%'`;
    }

    if (textUtils.isNotEmpty(deviceCode)) {
      whereSql += ` AND d.device_code LIKE '%${deviceCode}%'`;
    }

    let selectSql = `SELECT a.area_id,a.area_name,sa.subarea_id,sa.subarea_name,s.site_id,s.site_name,
          r.room_id,r.room_name,f.frame_id,f.frame_name,d.* FROM anhui_res_area a,anhui_res_subarea sa,
          anhui_res_site s,anhui_res_room r,anhui_res_frame f,anhui_res_device d ${whereSql} ORDER BY f.id`;
    let countSql = `SELECT COUNT(*) AS count ${selectSql.substr(
      selectSql.indexOf("FROM")
    )}`;
    selectSql += ` LIMIT ${pageNum}, ${pageSize}`;

    selectSql = `${selectSql};${countSql}`;
    logger.debug(`分页查询设备sql: ${selectSql}`);
    let [err, result] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`分页查询设备出错: err = ${err.message}`);
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
   * 新增设备
   * @param {Object} params 参数
   */
  async addDevice(params) {
    let {
        roomId, // 机房room_id
        frameId, // 机架frame_id
        deviceType, // 设备类型
        deviceCode, // 设备code
        deviceName, // 设备名称
        deviceGroupName, // 集团名称
        deviceCompany, // 设备厂家
        deviceModel, // 设备型号
      } = params,
      res = new Response();

    if (
      textUtils.isEmpty(roomId) ||
      textUtils.isEmpty(frameId) ||
      textUtils.isEmpty(deviceType) ||
      textUtils.isEmpty(deviceCode) ||
      textUtils.isEmpty(deviceName) ||
      textUtils.isEmpty(deviceGroupName) ||
      textUtils.isEmpty(deviceCompany) ||
      textUtils.isEmpty(deviceModel)
    ) {
      return res.fail("新增设备失败,必填项为空").toString();
    }

    let deviceId = new Date().getTime(),
      insertSql = `INSERT INTO anhui_res_device (device_id, device_type, device_name, device_code, 
        device_group_name, device_company, device_model, frame_id, room_id, system_code) VALUES (
        ${deviceId}, ${deviceType}, ${deviceName}, ${deviceCode}, ${deviceGroupName}, ${deviceCompany}, 
        ${deviceModel}, ${frameId}, ${roomId}, 1)`;

    logger.debug(`新增设备sql: ${insertSql}`);
    let [err, _] = await mysqlDB.insert(insertSql);
    if (err) {
      logger.error(`新增设备出错: err = ${err.message}`);
      return res.fail("新增失败").toString();
    }

    return res.success().toString();
  }

  /**
   * 删除设备
   * @param {Array} ids 设备id集合
   */
  async deleteDevice(ids) {
    logger.info(`删除设备: ${ids.join(",")}`);
    let res = new Response();
    if (textUtils.isEmpty(ids)) {
      return res.fail("删除失败,设备id为空").toString();
    }

    let deleteSql = `DELETE FROM anhui_res_device WHERE id IN (${ids.join(
      ","
    )})`;
    logger.debug(`删除设备sql: ${deleteSql}`);
    let [err, _] = await mysqlDB.delete(deleteSql);
    if (err) {
      logger.error(`删除设备出错: err = ${err.message}`);
      return res.fail("删除设备失败").toString();
    }

    return res.success().toString();
  }

  /**
   * 更新设备
   * @param {Object} params 参数
   */
  async updateDevice(params) {
    let {
        id,// 设备id
        roomId,// 机房room_id
        frameId,// 机架frame_id
        deviceType,// 设备类型
        deviceCode,// 设备编码
        deviceName,// 设备名称
        deviceGroupName,// 集团名称
        deviceCompany,// 设备厂家
        deviceModel,// 设备型号
      } = params,
      res = new Response();

    if (textUtils.isEmpty(id)) {
      return res.fail("修改失败,设备id为空").toString();
    }

    let updateSql = "";
    if (textUtils.isNotEmpty(roomId)) {
      updateSql += `room_id = ${roomId},`;
    }
    if (textUtils.isNotEmpty(frameId)) {
      updateSql += `frame_id = ${frameId},`;
    }
    if (textUtils.isNotEmpty(deviceType)) {
      updateSql += `device_type = '${deviceType}',`;
    }
    if (textUtils.isNotEmpty(deviceCode)) {
      updateSql += `device_code = '${deviceCode}',`;
    }
    if (textUtils.isNotEmpty(deviceName)) {
      updateSql += `device_name = '${deviceName}',`;
    }
    if (textUtils.isNotEmpty(deviceGroupName)) {
      updateSql += `device_group_name = '${deviceGroupName}',`;
    }
    if (textUtils.isNotEmpty(deviceCompany)) {
      updateSql += `device_company = '${deviceCompany}',`;
    }
    if (textUtils.isNotEmpty(deviceModel)) {
      updateSql += `device_model = '${deviceModel}',`;
    }

    if (textUtils.isEmpty(updateSql)) {
      return res.success(null, "设备未发生变化").toString();
    }

    updateSql = `UPDATE anhui_res_device SET ${updateSql.substr(0, updateSql.length - 1)} WHERE id = ${id}`;
    logger.debug(`更新设备sql: ${updateSql}`);

    let [err, _] = await mysqlDB.update(updateSql);
    if (err) {
      logger.error(`更新设备出错: err = ${err.message}`);
      return res.fail("更新失败").toString();
    }

    return res.success().toString();
  }
}

module.exports = new DeviceService();
