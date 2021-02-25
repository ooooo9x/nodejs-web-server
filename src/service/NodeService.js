const Response = require("../utils/Response");
const mysqlDB = require("../utils/MySqlDB");
const textUtils = require("../utils/textUtils");
const logger = require("../utils/logger");
const Cache = require("../utils/Cache");
const timeUtils = require("../utils/timeUtils");
const { isCacheTree } = require("../../config/config");

/**
 * 节点(区域、子区域、站点、机房、设备、通道)Service
 */
class NodeService {
  constructor() {}

  /**
   * 根据摄像头id查询所属各节点名称
   * @param {String} channelId 摄像头channel_id
   */
  async getNodesNameByChannelId(channelId) {
    let res = new Response();
    if (textUtils.isEmpty(channelId)) {
      return res.fail("查询失败").toString();
    }
    let selectSql = `SELECT a.area_name, sa.subarea_name, s.site_name, r.room_name, c.channel_name 
      FROM anhui_res_area a, anhui_res_subarea sa, anhui_res_site s, anhui_res_room r, device d, channel c, 
      anhui_room_device_r rdr WHERE a.area_id = sa.area_id AND sa.subarea_id = s.subarea_id 
      AND s.site_id = r.site_id AND r.room_id = rdr.room_id AND rdr.device_id = d.code_id 
      AND d.device_id = c.channel_bearea AND c.channel_id = '${channelId}';`;

    logger.debug(`根据摄像头id查询所属各节点名称sql: ${selectSql}`);
    let [err, result] = await mysqlDB.selectOne(selectSql);
    if (err) {
      logger.error(`根据摄像头id查询所属各节点名称出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    return res.success(result).toString();
  }

  /**
   * 查询摄像头树
   * @param {Object} params 查询参数
   */
  async getResChannelTree(params) {
    let {
        groupId, // 组ID
        userId, // 用户ID
        userName, // 用户登录名
        areaId, // 区域code
        subareaId, // 子区域code
        siteId, // 站点code
        roomId, // 机房code
        frameId, // 机架code
        channelName, // 通道名称或IP
        showAll, // 是否展示无摄像头的机房 true为显示
        frameName, // 机架名称
        deviceNameLike, // 设备名称(机架里的设备)
        has3d, // 若为true则只显示has_3d=1的机房
      } = params,
      res = new Response();

    // 参数中有一项不为空则不读写缓存
    let isCache = textUtils.isOneNotEmpty(
      areaId,
      subareaId,
      siteId,
      roomId,
      frameId,
      channelName,
      frameName,
      deviceNameLike
    ), cache = null, keyPath = "";
    if (!isCache) {
      // 先从缓存读取
      cache = new Cache(),
        keyPath = `channeltreedata.${timeUtils.format(new Date(), "yyyy-MM-dd")}.groupId-${groupId}.has3d-${has3d}.showAll-${showAll}.txt`;
      let data = await cache.get(keyPath);
      if (data) {
        return res.success(data).toString();
      }
    }

    let nodeSerial = {};
    try {
      console.time("search group");
      nodeSerial = await this.getNodesByGroupId(groupId, userName);
      console.timeEnd("search group");
    } catch (e) {
      logger.info(e.message);
      return res.fail("组没有绑定节点").toString();
    }

    // 区域sql
    let areaSql = `SELECT area_id AS code,area_name AS name,0 AS cnt FROM anhui_res_area WHERE state=0`;
    if (textUtils.isNotEmpty(areaId)) {
      areaSql += ` AND area_id = ${areaId}`;
    }
    if (nodeSerial.area && nodeSerial.area.length > 0) {
      areaSql += ` AND area_id in (${nodeSerial.area.join(",")})`;
    }

    // 子区域sql
    let subareaSql = `SELECT subarea_id AS code,area_id AS parent_code,subarea_name AS name 
      FROM anhui_res_subarea where 1=1`;
    if (textUtils.isNotEmpty(subareaId)) {
      subareaSql += ` AND subarea_id = ${subareaId}`;
    }
    if (nodeSerial.subArea && nodeSerial.subArea.length > 0) {
      subareaSql += ` AND subarea_id in (${nodeSerial.subArea.join(",")})`;
    }

    // 站点sql
    let siteSql = `SELECT site_id AS code,site_group_name,site_type,site_address,
      subarea_id AS parent_code,site_name AS name FROM anhui_res_site where 1=1`;
    if (textUtils.isNotEmpty(siteId)) {
      siteSql += ` AND site_id = ${siteId}`;
    }
    if (nodeSerial.site && nodeSerial.site.length > 0) {
      siteSql += ` AND site_id in (${nodeSerial.site.join(",")})`;
    }

    // 机房sql
    let roomSql = `SELECT room_id AS code,room_group_name,room_type,room_level,
      site_id AS parent_code,room_name AS name FROM anhui_res_room where 1=1`;
    if (has3d) {
      logger.info("只显示有3d模型的机房");
      roomSql += ` AND have_3d = 1`;
    }
    if (textUtils.isNotEmpty(roomId)) {
      roomSql += ` AND room_id = '${roomId}'`;
    }
    if (nodeSerial.room && nodeSerial.room.length > 0) {
      roomSql += ` AND room_id in (${nodeSerial.room.join(",")})`;
    }

    // 设备sql
    let deviceSql = `SELECT d.code_id AS code, d.device_name AS name, rdr.room_id AS parent_code, d.* 
      FROM device d, anhui_room_device_r rdr where d.code_id = rdr.device_id`;
    if (nodeSerial.device && nodeSerial.device.length > 0) {
      deviceSql += ` AND code_id in ('${nodeSerial.device.map((did) => String(did)).join("','")}')`;
    }

    // 通道sql
    let channelSql = `SELECT a.channel_id AS code,a.channel_name AS name,
      a.channel_bearea AS parent_code,a.channel_online,a.channel_ip FROM channel AS a`;

    if (textUtils.isNotEmpty(userId)) {
      channelSql = `SELECT a.channel_id AS code, a.channel_name AS name, a.channel_bearea AS parent_code, 
        a.channel_online, a.channel_ip, ( CASE WHEN uc.id IS NULL THEN 0 ELSE 1 END ) AS is_collect 
        FROM channel AS a LEFT OUTER JOIN ( SELECT u.* FROM user_collect u 
        WHERE u.user_id = ${userId}) AS uc ON uc.channel_id = a.channel_id`;
    }
    channelSql = `SELECT cs.* FROM (${channelSql}) cs WHERE 1=1 `;
    if (textUtils.isNotEmpty(channelName)) {
      channelSql += `AND cs.name LIKE'%${channelName}%' OR cs.channel_ip LIKE '%${channelName}%' `;
    }
    if (textUtils.isNotEmpty(deviceNameLike)) {
      channelSql += `AND cs.code IN (SELECT fc.channel_id FROM anhui_res_device d,anhui_res_frame_channel_r fc 
        WHERE d.device_name LIKE '%${deviceNameLike}%' AND d.frame_id=fc.frame_id) `;
      channelSql += `OR cs.code IN (SELECT d.channel_id FROM anhui_res_device d 
        WHERE d.device_name LIKE '%${deviceNameLike}%' AND d.channel_id IS NOT NULL) `;
    }

    if (textUtils.isNotEmpty(frameId) && textUtils.isNotEmpty(frameName)) {
      channelSql += `AND cs.code IN (SELECT arfc.channel_id FROM anhui_res_frame_channel_r arfc 
        WHERE arfc.frame_id=${frameId} OR arfc.frame_id in (SELECT frame_id FROM anhui_res_frame 
        WHERE frame_name LIKE '%${frameName}%')) `;
    } else if (textUtils.isNotEmpty(frameId)) {
      channelSql += `AND cs.code IN (SELECT arfc.channel_id FROM anhui_res_frame_channel_r arfc 
        WHERE arfc.frame_id=${frameId}) `;
    } else if (textUtils.isNotEmpty(frameName)) {
      channelSql += `AND cs.code IN (SELECT arfc.channel_id FROM anhui_res_frame_channel_r arfc 
        WHERE arfc.frame_id in (SELECT frame_id FROM anhui_res_frame WHERE frame_name LIKE '%${frameName}%')) `;
    }

    let selectSql = `${areaSql};${subareaSql};${siteSql};${roomSql};${deviceSql};${channelSql}`;
    logger.debug(`查询摄像头树sql: ${selectSql}`);
    console.time("search tree");
    let [err, result] = await mysqlDB.select(selectSql);
    console.timeEnd("search tree");
    if (err) {
      logger.info(`查询摄像头树出错: err = ${err.message}`);
      return res.fail("查询摄像头树失败").toString();
    }
    let area = result[0];
    let subarea = result[1];
    let site = result[2];
    let room = result[3];
    let device = result[4];
    let channel = result[5];

    // 组装树
    console.time("gen tree");
    device = this.assemblyTree1(
      device,
      this.groupByParentCode(channel, 6),
      showAll
    );
    room = this.assemblyTree1(room, this.groupByParentCode(device, 5), showAll);
    site = this.assemblyTree1(site, this.groupByParentCode(room, 4), showAll);
    subarea = this.assemblyTree1(
      subarea,
      this.groupByParentCode(site, 3),
      showAll
    );
    area = this.assemblyTree1(
      area,
      this.groupByParentCode(subarea, 2),
      showAll
    );
    this.groupByParentCode(area, 1);
    console.timeEnd("gen tree");

    if (!isCache) {
      // 数据缓存
      cache.set(keyPath, area);
    }

    return res.success(area).toString();
  }

  /**
   * 获取机房树
   * @param {Number} groupId 组ID
   * @param {String} userName 用户登录名
   */
  async getResRoomTree(groupId, userName, have3d) {
    let res = new Response();
    
    // 先从缓存读取
    let cache = new Cache(),
      keyPath = `roomtreedata.${timeUtils.format(new Date(), "yyyy-MM-dd")}.groupId-${groupId}.has3d-${have3d}.txt`;
    let data = await cache.get(keyPath);
    if (data) {
      return res.success(data).toString();
    }

    let nodeSerial = {};
    try {
      nodeSerial = await this.getNodesByGroupId(groupId, userName);
    } catch (e) {
      logger.info(e.message);
      return res.fail("组没有绑定节点").toString();
    }

    let areaSql = `SELECT area_id AS code,area_name AS name FROM anhui_res_area WHERE state = 0`;
    if (nodeSerial.area && nodeSerial.area.length > 0) {
      areaSql += ` AND area_id in (${nodeSerial.area.join(",")})`;
    }

    let subAreaSql = `SELECT subarea_id AS code,area_id AS parent_code,subarea_name AS name 
      FROM anhui_res_subarea where 1=1`;
    if (nodeSerial.subArea && nodeSerial.subArea.length > 0) {
      subAreaSql += ` AND subarea_id in (${nodeSerial.subArea.join(",")})`;
    }

    let siteSql = `SELECT site_id AS code, site_group_name, site_type, site_address, 
      subarea_id AS parent_code, site_name AS name FROM anhui_res_site where 1=1`;
    if (nodeSerial.site && nodeSerial.site.length > 0) {
      siteSql += ` AND site_id in (${nodeSerial.site.join(",")})`;
    }

    let roomSql = `SELECT room_id AS code, room_group_name, room_type, 
      room_level, site_id AS parent_code, room_name AS name, have_2d, have_3d FROM anhui_res_room 
      WHERE 1=1`;
    if (have3d) {
      roomSql += ` AND have_3d = 1`;
    }
    if (nodeSerial.room && nodeSerial.room.length > 0) {
      roomSql += ` AND room_id in (${nodeSerial.room.join(",")})`;
    }

    let selectSql = `${areaSql};${subAreaSql};${siteSql};${roomSql}`;
    logger.debug(`查询机房树sql: ${selectSql}`);
    let [err, result] = await mysqlDB.select(selectSql);
    if (err) {
      logger.info(`查询机房树出错: err = ${err.message}`);
      return res.fail("查询机房树失败").toString();
    }
    let area = result[0],
      subarea = result[1],
      site = result[2],
      room = result[3];

    site = this.assemblyTree1(site, this.groupByParentCode(room, 4));
    subarea = this.assemblyTree1(subarea, this.groupByParentCode(site, 3));
    area = this.assemblyTree1(area, this.groupByParentCode(subarea, 2));
    this.groupByParentCode(area, 1);

    // 数据缓存
    cache.set(keyPath, area);

    return res.success(area).toString();
  }

  /**
   * 获取门禁树,没有门禁的机房不显示
   * @param {Number} groupId 组ID
   * @param {String} userName 用户登录名
   */
  async getResAccessTree(groupId, userName) {
    let res = new Response();
    
    // 先从缓存读取
    let cache = new Cache(),
      keyPath = `accesstreedata.${timeUtils.format(new Date(), "yyyy-MM-dd")}.groupId-${groupId}.txt`;
    let data = await cache.get(keyPath);
    if (data) {
      return res.success(data).toString();
    }

    let nodeSerial = {};
    try {
      nodeSerial = await this.getNodesByGroupId(groupId, userName);
    } catch (e) {
      logger.info(e.message);
      return res.fail("组没有绑定节点").toString();
    }

    let selectAreaSql = `SELECT area_id AS code,area_name AS name FROM anhui_res_area WHERE state=0`,
      selectSubAreaSql = `SELECT subarea_id AS code,area_id AS parent_code,subarea_name AS name
        FROM anhui_res_subarea where 1=1`,
      selectSiteSql = `SELECT site_id AS code,site_group_name,site_type,site_address,
        subarea_id AS parent_code,site_name AS name FROM anhui_res_site where 1=1`,
      selectRoomSql = `SELECT room_id AS code,room_group_name,room_type,room_level,
        site_id AS parent_code,room_name AS name,have_2d,have_3d FROM anhui_res_room 
        WHERE room_id IN (SELECT DISTINCT room_id FROM anhui_res_access)`;

    if (nodeSerial.area && nodeSerial.area.length > 0) {
      selectAreaSql += ` AND area_id in (${nodeSerial.area.join(",")})`;
    }
    if (nodeSerial.subArea && nodeSerial.subArea.length > 0) {
      selectSubAreaSql += ` AND subarea_id in (${nodeSerial.subArea.join(
        ","
      )})`;
    }
    if (nodeSerial.site && nodeSerial.site.length > 0) {
      selectSiteSql += ` AND site_id in (${nodeSerial.site.join(",")})`;
    }
    if (nodeSerial.room && nodeSerial.room.length > 0) {
      selectRoomSql += ` AND room_id in (${nodeSerial.room.join(",")})`;
    }

    let selectTreeSql = `${selectAreaSql};${selectSubAreaSql};${selectSiteSql};${selectRoomSql}`;
    logger.debug(`获取门禁树sql: ${selectTreeSql}`);
    let [err, result] = await mysqlDB.select(selectTreeSql);
    if (err) {
      logger.info(
        `查询树形数据出错: sql = ${selectTreeSql},\n err = ${err.message}`
      );
      return res.fail("查询失败").toString();
    }

    logger.info("数据查询成功,开始组装树形结构");

    let area = result[0],
      subarea = result[1],
      site = result[2],
      room = result[3];

    // 组装树
    site = this.assemblyTree1(site, this.groupByParentCode(room, 4));
    subarea = this.assemblyTree1(subarea, this.groupByParentCode(site, 3));
    area = this.assemblyTree1(area, this.groupByParentCode(subarea, 2));
    this.groupByParentCode(area, 1);

    // 数据缓存
    cache.set(keyPath, area);

    logger.info("数据组装成功");
    return res.success(area).toString();
  }

  /**
   * 查询收藏树
   * @param {Number} groupId 组ID
   * @param {String} userName 用户登录名
   * @param {Number} userId 用户ID
   */
  async getCollectCameraTree(groupId, userName, userId) {
    // 获取用户组绑定的区域节点
    let nodeSerial = {},
      res = new Response();
          
    // 先从缓存读取
    let cache = new Cache(),
      keyPath = `collecttreedata.${timeUtils.format(new Date(), "yyyy-MM-dd")}.groupId-${groupId}.userId-${userId}.txt`;
    let data = await cache.get(keyPath);
    if (data) {
      return res.success(data).toString();
    }

    try {
      nodeSerial = await this.getNodesByGroupId(groupId, userName);
    } catch (e) {
      logger.error(e.message);
      return res.fail("组没有绑定节点").toString();
    }

    // 根据用户ID反查设备code
    let deviceCodeSql = `SELECT DISTINCT c.channel_bearea FROM user_collect uc, channel c 
      WHERE uc.user_id = ${userId} AND c.channel_id = uc.channel_id`;
    if (nodeSerial.device && nodeSerial.device.length > 0) {
      deviceCodeSql += ` AND c.channel_bearea IN ('${nodeSerial.device
        .map((did) => String(did))
        .join("','")}')`;
    }

    // 根据设备code反查机房ID
    let roomIdsSql = `SELECT r.room_id FROM anhui_res_room r, device d, anhui_room_device_r rdr
      WHERE d.device_id IN (${deviceCodeSql}) AND d.code_id = rdr.device_id and r.room_id = rdr.room_id`;
    if (nodeSerial.room && nodeSerial.room.length > 0) {
      roomIdsSql += ` AND r.room_id in (${nodeSerial.room.join(",")})`;
    }

    // 根据机房id反查站点id
    let siteIdsSql = `SELECT DISTINCT s.site_id FROM anhui_res_room r, anhui_res_site s  
      WHERE r.room_id IN (${roomIdsSql}) AND r.site_id = s.site_id`;
    if (nodeSerial.site && nodeSerial.site.length > 0) {
      siteIdsSql += ` AND s.site_id in (${nodeSerial.site.join(",")})`;
    }

    // 根据站点id反查子区域id
    let subareaIdsSql = `SELECT DISTINCT sa.subarea_id FROM anhui_res_site s, anhui_res_subarea sa 
      WHERE s.site_id IN (${siteIdsSql}) AND s.subarea_id = sa.subarea_id`;
    if (nodeSerial.subArea && nodeSerial.subArea.length > 0) {
      subareaIdsSql += ` AND sa.subarea_id in (${nodeSerial.subArea.join(
        ","
      )})`;
    }

    // 根据子区域id反查区域id
    let areaIdsSql = `SELECT DISTINCT a.area_id FROM anhui_res_subarea sa, 
      anhui_res_area a WHERE sa.subarea_id IN (${subareaIdsSql}) AND sa.area_id = a.area_id AND a.state = 0`;
    if (nodeSerial.area && nodeSerial.area.length > 0) {
      areaIdsSql += ` AND a.area_id in (${nodeSerial.area.join(",")})`;
    }

    let areaSql = `SELECT area_id AS code,area_name AS name,0 AS cnt FROM anhui_res_area 
      WHERE area_id IN (${areaIdsSql})`;
    let subareaSql = `SELECT subarea_id AS code,area_id AS parent_code,subarea_name AS name,0 AS cnt 
      FROM anhui_res_subarea WHERE subarea_id IN (${subareaIdsSql})`;
    let siteSql = `SELECT site_id AS code,site_group_name,site_type,site_address,subarea_id AS parent_code,
      site_name AS name,0 AS cnt FROM anhui_res_site WHERE site_id IN (${siteIdsSql})`;
    let roomSql = `SELECT room_id AS code,room_group_name,room_type,room_level,site_id AS parent_code,
      room_name AS name FROM anhui_res_room WHERE room_id IN (${roomIdsSql})`;
    let deviceSql = `SELECT d.device_id AS code, d.device_name AS name, d.*, rdr.room_id AS parent_code 
      FROM device d, anhui_room_device_r rdr WHERE d.device_id IN (${deviceCodeSql}) and rdr.device_id = d.code_id`;
    let channelSql = `SELECT a.channel_id AS code,a.channel_name AS name,a.channel_bearea AS parent_code,
      a.channel_online,a.channel_ip FROM channel AS a,user_collect uc WHERE uc.user_id = ${userId} 
      AND a.channel_id = uc.channel_id`;
    let selectSql = `${areaSql};${subareaSql};${siteSql};${roomSql};${deviceSql};${channelSql}`;
    logger.debug(`查询用户: ID=${userId}, 收藏树sql: ${selectSql}`);
    let [err, result] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`查询用户: ID=${userId}, 收藏树出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    let area = result[0];
    let subarea = result[1];
    let site = result[2];
    let room = result[3];
    let device = result[4];
    let channel = result[5];

    // 组装树
    device = this.assemblyTree1(device, this.groupByParentCode(channel, 6));
    room = this.assemblyTree1(room, this.groupByParentCode(device, 5));
    site = this.assemblyTree1(site, this.groupByParentCode(room, 4));
    subarea = this.assemblyTree1(subarea, this.groupByParentCode(site, 3));
    area = this.assemblyTree1(area, this.groupByParentCode(subarea, 2));
    this.groupByParentCode(area, 1);

    // 数据缓存
    cache.set(keyPath, area);

    logger.info("查询成功");
    return res.success(area).toString();
  }

  /**
   * 查询Vpm树
   */
  async getVpmCameraTree() {
    let res = new Response();

    // 先从缓存读取
    let cache = new Cache(),
      keyPath = `vpmtreedata.${timeUtils.format(new Date(), "yyyy-MM-dd")}.txt`;
    if (isCacheTree) {
      let data = await cache.get(keyPath);
      if (data) {
        return res.success(data).toString();
      }
    }

    let areaSql = `SELECT DEVICE_ID AS code, PARENT_ID AS parent_code, NAME AS name, 0 AS isChecked, LEVEL AS level 
      FROM i_area`;
    let deviceSql = `SELECT device_id AS code, device_parent_id AS parent_code, device_name AS name, 0 AS isChecked 
      FROM device WHERE code_id NOT IN (SELECT DISTINCT device_id FROM anhui_room_device_r)`;
    let channelSql = `SELECT channel_id AS code, channel_bearea AS parent_code, channel_name AS name, 
      0 AS isChecked, channel_online FROM channel`;

    let selectSql = `${areaSql};${deviceSql};${channelSql}`;

    logger.debug(`查询vpm树sql: ${selectSql}`);

    let [err, result] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`查询vpm树出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    let areaList = result[0];
    let deviceList = result[1];
    let channelList = result[2];

    /*组装设备和通道*/
    deviceList = this.assemblyTree1(
      deviceList,
      this.groupByParentCode1(channelList, "channel")
    );
    this.groupByParentCode1(deviceList, "device");

    /*组装机房和设备*/
    for (let i = 0; i < areaList.length; i++) {
      let area = areaList[i];
      let children = [];
      for (let j = 0; j < deviceList.length; j++) {
        let device = deviceList[j];
        if (area.code === device.parent_code) {
          area.isChecked = 1;
          children.push(device);
        }
      }
      area.children = children;
    }

    /*组装机房上层的树*/
    let root = [];
    for (let i = 0; i < areaList.length; i++) {
      let area = areaList[i];
      if (area.level === 1) {
        this.assemblyAreaTree(area, areaList);
        root.push(area);
      }
    }

    // 数据缓存
    if (isCacheTree)
      cache.set(keyPath, root);

    return res.success(root).toString();
  }

  assemblyAreaTree(parent, areaList) {
    for (let i = 0; i < areaList.length; i++) {
      let area = areaList[i];
      if (parent.code === area.parent_code) {
        this.assemblyAreaTree(area, areaList);
        parent.children.push(area);
      }
    }
  }

  /**
   * 根据parent_code将nodes分组(用于组装vpm树)
   * @param {Array} nodes
   * @param {String} type channel 摄像头, device 设备
   */
  groupByParentCode1(nodes, type) {
    let nodesObj = {};
    nodes &&
      nodes.length &&
      nodes.forEach((node) => {
        let key = node.parent_code;
        if (key in nodesObj) {
          nodesObj[key].push(node);
        } else {
          nodesObj[key] = [node];
        }
        if (type === "channel") {
          node.code = `channel-${node.code}`;
          node.type = "channel";
        } else if (type === "device") {
          node.isChecked = 1;
          node.isDevice = 1;
          node.type = "device";
        }
      });

    return nodesObj;
  }

  /**
   * 查询区域
   * @param {Number} groupId 组ID
   * @param {String} userName 用户登录名
   * @param {Number} areaCode 区域code
   */
  async getAreaInfo(groupId, userName, areaCode) {
    let res = new Response();

    let nodeSerial = {};
    try {
      nodeSerial = await this.getNodesByGroupId(groupId, userName, 1);
    } catch (e) {
      logger.info(e.message);
      return res.fail("组没有绑定节点").toString();
    }

    let selectSql = `select * from anhui_res_area where state = 0`;
    if (nodeSerial.area && nodeSerial.area.length > 0) {
      selectSql += ` and area_id in (${nodeSerial.area.join(",")})`;
    }

    logger.debug(`查询区域sql: ${selectSql}`);
    let [err, result] = await mysqlDB.select(selectSql);
    if (err) {
      logger.info(`查询区域出错: err = ${err.message}`);
      return res.fail("查询区域出错").toString();
    }

    logger.info("查询区域成功");
    return res.success(result).toString();
  }

  /**
   * 获取子区域
   * @param {Number} groupId 组ID
   * @param {String} userName 用户登录名
   * @param {Number} areaId 区域area_id
   */
  async getSubareaInfo(groupId, userName, areaId) {
    let res = new Response();

    let nodeSerial = {};
    try {
      nodeSerial = await this.getNodesByGroupId(groupId, userName, 2);
    } catch (e) {
      logger.info(e.message);
      return res.fail("组没有绑定子区域节点").toString();
    }

    let selectSql = `select * from anhui_res_subarea where 1=1`;
    if (textUtils.isNotEmpty(areaId)) {
      selectSql += ` and area_id = ${areaId}`;
    }
    if (nodeSerial.subArea && nodeSerial.subArea.length > 0) {
      selectSql += ` and subarea_id in (${nodeSerial.subArea.join(",")})`;
    }

    logger.debug(`查询子区域sql: ${selectSql}`);
    let [err, result] = await mysqlDB.select(selectSql);
    if (err) {
      logger.info(`查询子区域出错: err = ${err.message}`);
      return res.fail("查询子区域出错").toString();
    }

    logger.info("查询子区域成功");
    return res.success(result).toString();
  }

  /**
   * 获取站点
   * @param {Number} groupId 组ID
   * @param {String} userName 用户登录名
   * @param {Number} subareaId 子区域subarea_id
   */
  async getSiteInfo(groupId, userName, subareaId) {
    let res = new Response();

    let nodeSerial = {};
    try {
      nodeSerial = await this.getNodesByGroupId(groupId, userName, 3);
    } catch (e) {
      logger.info(e.message);
      return res.fail("组没有绑定站点节点").toString();
    }

    let selectSql = `select * from anhui_res_site where 1=1`;
    if (textUtils.isNotEmpty(subareaId)) {
      selectSql += ` and subarea_id = ${subareaId}`;
    }
    if (nodeSerial.site && nodeSerial.site.length > 0) {
      selectSql += ` and site_id in (${nodeSerial.site.join(",")})`;
    }

    logger.debug(`查询站点sql: ${selectSql}`);
    let [err, result] = await mysqlDB.select(selectSql);
    if (err) {
      logger.info(`查询站点出错: err = ${err.message}`);
      return res.fail("查询站点出错").toString();
    }

    logger.info("查询站点成功");
    return res.success(result).toString();
  }

  /**
   * 获取机房
   * @param {Number} groupId 组ID
   * @param {String} userName 用户登录名
   * @param {Number} siteId 站点site_id
   */
  async getRoomInfo(groupId, userName, siteId) {
    let res = new Response();

    let nodeSerial = {};
    try {
      nodeSerial = await this.getNodesByGroupId(groupId, userName, 4);
    } catch (e) {
      logger.info(e.message);
      return res.fail("组没有绑定机房节点").toString();
    }

    let selectSql = `select * from anhui_res_room where 1=1`;
    if (textUtils.isNotEmpty(siteId)) {
      selectSql += ` and site_id = ${siteId}`;
    }
    if (nodeSerial.room && nodeSerial.room.length > 0) {
      selectSql += ` and room_id in (${nodeSerial.room.join(",")})`;
    }

    logger.debug(`查询机房sql: ${selectSql}`);
    let [err, result] = await mysqlDB.select(selectSql);
    if (err) {
      logger.info(`查询机房出错: err = ${err.message}`);
      return res.fail("查询机房出错").toString();
    }

    logger.info("查询机房成功");
    return res.success(result).toString();
  }

  /**
   * 获取机架
   * @param {Number} groupId 组ID
   * @param {String} userName 用户登录名
   * @param {Number} roomId 机房room_id
   */
  async getFrameInfo(groupId, userName, roomId) {
    let res = new Response();

    let nodeSerial = {};
    try {
      nodeSerial = await this.getNodesByGroupId(groupId, userName, 4);
    } catch (e) {
      logger.info(e.message);
      return res.fail("组没有绑定机房节点").toString();
    }

    let selectSql = `select * from anhui_res_frame where 1=1`;
    if (textUtils.isNotEmpty(roomId)) {
      selectSql += ` and room_id = ${roomId}`;
    }
    if (nodeSerial.room && nodeSerial.room.length > 0) {
      selectSql += ` and room_id in (${nodeSerial.room.join(",")})`;
    }

    logger.debug(`查询机架sql: ${selectSql}`);
    let [err, result] = await mysqlDB.select(selectSql);
    if (err) {
      logger.info(`查询机架出错: err = ${err.message}`);
      return res.fail("查询机架出错").toString();
    }

    logger.info("查询机架成功");
    return res.success(result).toString();
  }

  /**
   * 根据组ID获取组绑定的树节点,管理员用户默认获取所有,将返回每一层级的拥有权限的节点code
   * @param {Number} groupId 组ID
   * @param {String} userName 用户登录名
   * @param {Number} nodeLen node的层级,默认五层
   */
  async getNodesByGroupId(groupId, userName, nodeLen = 5) {
    // 管理员用户默认拥有全部组权限,其他用户根据其登录组查询组权限
    if (userName === "admin") {
      return {};
    }
    let nodesSql = `SELECT path,node_code AS nodeCode FROM group_node_r WHERE group_id = ${groupId}`;
    logger.debug(`根据组ID查询绑定的节点sql: ${nodesSql}`);
    let [err, result] = await mysqlDB.select(nodesSql);
    if (err) {
      logger.info(
        `根据组ID: ${groupId}, 查询绑定的节点出错: err = ${err.message}`
      );
      throw err;
    }

    if (!result || result.length <= 0) {
      logger.info(`根据组ID: ${groupId}, 查询绑定的节点为空`);
      throw new Error("根据组查询绑定的节点为空");
    }

    let nodeCodes = [],
      nodeSerial = {},
      serial = ["area", "subArea", "site", "room", "device", "channel"];
    // nodeCodes为组与节点关联库中path和node_code的组合,以/分隔,默认有五层(区域/子区域/站点/机房/设备/),
    // 如果不足五层,则根据父级code获取所有子级
    result.forEach((n) => {
      nodeCodes.push(`${n.path}${n.nodeCode}`);
    });

    // 当不足五层结构时,根据此对象查询对应数据库获取子级数据
    // name: 表名, where: 查询条件, id: 查询的列, type: 查询条件where字段类型
    let table = [
      { name: "anhui_res_area", where: "" },
      {
        name: "anhui_res_subarea",
        where: "area_id",
        id: "subarea_id",
        key: "subarea_id",
      },
      {
        name: "anhui_res_site",
        where: "subarea_id",
        id: "site_id",
        key: "site_id",
      },
      {
        name: "anhui_res_room",
        where: "site_id",
        id: "room_id",
        key: "room_id",
      },
      {
        name: "device d, anhui_room_device_r rdr",
        where: "d.code_id = rdr.device_id and rdr.room_id",
        id: "d.code_id",
        key: "code_id",
      },
      {
        name: "channel",
        where: "channel_bearea",
        id: "channel_id",
        key: "channel_id",
      },
    ];

    // 节点默认有五层
    for (let i = 0, len = nodeCodes.length; i < len; i++) {
      let nodeAry = nodeCodes[i].split("/"),
        parentCode;
      for (let i = 0; i < nodeLen; i++) {
        let key = serial[i],
          code = nodeAry[i];
        // 不足五层时根据父级code查询所有子级
        if (!code) {
          // 拼接查询语句,由于每级对应表不一样,故配合上文对象table拼接sql
          if (textUtils.isNotEmpty(parentCode) && parentCode.length > 0) {
            let selSql = `select ${table[i].id} from ${table[i].name} `;
            if (table[i].type === "String") {
              selSql += `where ${table[i].where} in ('${parentCode.join(
                "','"
              )}')`;
            } else {
              selSql += `where ${table[i].where} in (${parentCode.join(",")})`;
            }
            // selSql += ` and (isnull(${table[i].where})=0 and length(trim(${table[i].where}))>0`;
            let [e, re] = await mysqlDB.select(selSql);
            logger.debug("节点权限查询sql:", selSql);
            if (e) {
              logger.error(`查询出错: err = ${e.message}`);
              code = [];
            } else {
              // 查询到的数据为对象数组,配合上文table将对象中的属性值取出,最终为一个数据
              code = re.map((r) => r[`${table[i].key}`]);
            }
          } else {
            code = [];
          }
        } else {
          code = [code];
        }
        parentCode = code;
        if (key in nodeSerial) {
          nodeSerial[key].push(...code);
        } else {
          nodeSerial[key] = code;
        }
      }
    }

    // 去重
    for (let ns in nodeSerial) {
      nodeSerial[ns] = [...new Set(nodeSerial[ns])];
    }

    return nodeSerial;
  }

  /**
   * 根据parent_code将节点分组
   * @param {Array} nodes 节点集合
   */
  groupByParentCode(nodes, level) {
    let nodesObj = {};
    nodes &&
      nodes.length &&
      nodes.forEach((node) => {
        let key = node.parent_code;
        level && (node.level = level);
        if (key in nodesObj) {
          nodesObj[key].push(node);
          node.is_collect === 1 && (nodesObj[`${key}_col`] += 1);
        } else {
          nodesObj[key] = [node];
          node.is_collect === 1 ? (nodesObj[`${key}_col`] = 1) : (nodesObj[`${key}_col`] = 0);
        }
      });

    return nodesObj;
  }

  assemblyTree1(parents, childNodesObj, showAll) {
    let newParents = [];
    parents &&
      parents.length &&
      parents.forEach((pn) => {
        let children = childNodesObj[pn.code];
        if (children && children.length > 0) {
          pn.children = children;
          let coll = childNodesObj[`${pn.code}_col`];
          if (coll && coll === children.length) {
            pn.is_collect = 1;
          } else {
            pn.is_collect = 0;
          }

          newParents.push(pn);
        } else if (showAll) {
          newParents.push(pn);
        }
      });
    return newParents;
  }

  /**
   * 组装树结构数据（带是否被收藏的标识）
   * @param {Array} parents 父节点集合
   * @param {Array} child 子节点集合
   * @param {Number} level1 父节点级别
   * @param {Number} level2 子节点级别
   */
  assemblyTreeWithCollect(parents, child, level1, level2) {
    let newParents = [];
    for (let i = 0; i < parents.length; i++) {
      let children = [];
      let collect = 0;
      for (let j = 0; j < child.length; j++) {
        if (parents[i].code === child[j].parent_code) {
          if (child[j].is_collect === 1) {
            collect++;
          }
          child[j].level = level2;
          children.push(child[j]);
        }
      }
      if (collect > 0 && children.length === collect) {
        parents[i].is_collect = 1;
      } else {
        parents[i].is_collect = 0;
      }
      parents[i].level = level1;
      parents[i].children = children;
      if (children.length > 0) {
        newParents.push(parents[i]);
      }
    }
    return newParents;
  }

  /**
   * 组装树结构数据（不带是否被收藏的标识）
   * @param {Array} parents 父节点集合
   * @param {Array} child 子节点集合
   * @param {Number} level1 父节点级别
   * @param {Number} level2 子节点级别
   * @param {Boolean} showAll 是否展示无摄像头的机房 true为显示
   */
  assemblyTree(parents, child, level1, level2, showAll) {
    let newParents = [];
    for (let i = 0; i < parents.length; i++) {
      let children = [];
      for (let j = 0; j < child.length; j++) {
        if (parents[i].code === child[j].parent_code) {
          child[j].level = level2;
          children.push(child[j]);
        }
      }
      parents[i].level = level1;
      parents[i].children = children;
      if (showAll) {
        newParents.push(parents[i]);
      } else {
        if (children.length > 0) {
          newParents.push(parents[i]);
        }
      }
    }
    return newParents;
  }
}

module.exports = new NodeService();
