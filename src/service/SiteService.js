const Response = require("../utils/Response");
const mysqlDB = require("../utils/MySqlDB");
const textUtils = require("../utils/textUtils");
const logger = require("../utils/logger");
const nodeService = require("./NodeService");

/**
 * 站点Service
 */
class SiteService {
  constructor() {}

  /**
   * 分页查询站点信息
   * @param {Object} params 参数
   */
  async pageBy(params) {
    let {
      groupId, // 组ID
      userName, // 用户登录名
      areaId, // 区域area_id
      subareaId, // 子区域subarea_id
      siteId, // 站点site_id
      siteType, // 站点类型
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
      nodeSerial = await nodeService.getNodesByGroupId(groupId, userName, 3);
    } catch (e) {
      logger.error(e.message);
      return res.fail("组没有绑定节点").toString();
    }

    let whereSql = `WHERE sa.area_id = a.area_id AND s.subarea_id = sa.subarea_id`;
    if (textUtils.isNotEmpty(areaId)) {
      whereSql += ` AND a.area_id = ${areaId}`;
    }
    if (nodeSerial.area && nodeSerial.area.length > 0) {
      whereSql += ` and a.area_id in (${nodeSerial.area.join(",")})`;
    }

    if (textUtils.isNotEmpty(subareaId)) {
      whereSql += ` AND sa.subarea_id = ${subareaId}`;
    }
    if (nodeSerial.subArea && nodeSerial.subArea.length > 0) {
      whereSql += ` and sa.subarea_id in (${nodeSerial.subArea.join(
        ","
      )})`;
    }

    if (textUtils.isNotEmpty(siteId)) {
      whereSql += ` AND s.site_id = ${siteId}`;
    }
    if (nodeSerial.site && nodeSerial.site.length > 0) {
      whereSql += ` and s.site_id in (${nodeSerial.site.join(",")})`;
    }

    if (textUtils.isNotEmpty(siteType)) {
      whereSql += ` AND s.site_type = '${siteType}'`;
    }

    let selectSql = `SELECT a.area_id,a.area_name,sa.subarea_id,sa.subarea_name,s.* 
          FROM anhui_res_area a,anhui_res_subarea sa,anhui_res_site s ${whereSql} ORDER BY s.id`;
    let countSql = `SELECT COUNT(*) AS count ${selectSql.substr(
      selectSql.indexOf("FROM")
    )}`;
    selectSql += ` LIMIT ${pageNum}, ${pageSize}`;

    selectSql = `${selectSql};${countSql}`;
    logger.debug(`分页查询站点sql: ${selectSql}`);
    let [err, result] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`分页查询站点出错: err = ${err.message}`);
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
   * 查询站点类型
   */
  async getSiteType() {
    let res = new Response(),
      selectSql = "SELECT DISTINCT s.site_type FROM anhui_res_site s";
    
    let [err, siteTypes] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`查询站点类型出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    return res.success(siteTypes).toString();
  }
}

module.exports = new SiteService();
