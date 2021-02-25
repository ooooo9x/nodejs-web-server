const Response = require("../utils/Response");
const mysqlDB = require("../utils/MySqlDB");
const textUtils = require("../utils/textUtils");
const nodeGroupRelateService = require("./NodeGroupRelateService");
const logger = require("../utils/logger");
const ArrayUtils = require("../utils/ArrayUtils");
const StringUtils = require("../utils/StringUtils");
const timeUtils = require("../utils/timeUtils");
const Cache = require("../utils/Cache");
const operateLogService = require("./OperateLogService");

class GroupService {
  constructor() {}

  /**
   * 新增组
   * @param {String} name 组名称
   * @param {Array} nodes 节点集合
   */
  async save(name, parentId, nodes, currentUser, ip) {
    let res = new Response();
    if (textUtils.isEmpty(name) || ArrayUtils.isEmpty(nodes) || StringUtils.isEmpty(parentId)) {
      logger.info(`组信息有误: name=${name}, nodes=${nodes}, parentId=${parentId}`);
      return res.fail("组信息有误").toString();
    }

    let insertSql = `insert into \`group\` (name, parent_id) values ('${name}', ${parentId})`;
    logger.debug(`新增组sql: ${insertSql}`);
    let [err, result] = await mysqlDB.execute(insertSql);
    if (err) {
      logger.error(`新增组出错: err = ${err.message}`);
      return res.fail("新增组失败").toString();
    }

    let groupId = result.insertId;
    logger.info(`新建组成功, ID=${groupId}, 开始新建组和节点的关联关系`);

    let insertRelateSql = nodeGroupRelateService.saveList(groupId, nodes);
    [err, result] = await mysqlDB.insert(insertRelateSql);
    if (err) {
      res.fail("新增组失败");
      logger.error(`新增组出错: err = ${err.message}`);
    } else {
      res.success(null);
      logger.info("新建组和节点的关联成功");
    }

    // 用户操作日志
    operateLogService.save({
      currentUser,
      key: "group.add",
      params: { name },
      currentTime: timeUtils.getCurrentTime(),
      type: 1,
      ip,
    });

    return res.toString();
  }

  /**
   * 更新组
   * @param {Number} id 组ID
   * @param {String} name 组名称
   * @param {Array} node 组关联的节点信息
   */
  async update(id, name, node, currentUser, ip) {
    let updateSql = `update \`group\` set name = '${name}' where id = ${id}`,
      deleteRelateSql = `delete from group_node_r where group_id = ${id}`,
      insertRelateSql = "";
    if (node && node.length > 0) {
      insertRelateSql = nodeGroupRelateService.saveList(id, node);
    }
    logger.debug(
      `更新组sql: ${updateSql};${deleteRelateSql};${insertRelateSql}`
    );
    let [err, result] = await mysqlDB.execute(
      `${updateSql};${deleteRelateSql};${insertRelateSql}`
    );
    let res = new Response();
    if (err) {
      logger.error(`更新组出错: err = ${err.message}`);
      return res.fail("更新组出错").toString();
    }

    // 组更新,清除所有缓存
    await new Cache().clear();

    logger.info("更新成功");

    // 用户操作日志
    operateLogService.save({
      currentUser,
      key: "group.edit",
      params: { name },
      currentTime: timeUtils.getCurrentTime(),
      type: 1,
      ip,
    });

    return res.success(null).toString();
  }

  /**
   * 查询所有组
   */
  async query(id) {
    let res = new Response();
    // 递归查询该组下所有子组
    let selectChildSql = `select getGroupChildList(${id}) as groupIds`;
    logger.debug(`查询所有子组sql: ${selectChildSql}`);
    let [e, cids] = await mysqlDB.selectOne(selectChildSql);
    if (e) {
      logger.error(`查询所有子组出错: err = ${e.message}`);
      return res.fail("查询组出错").toString();
    }

    let selectAllSql = `select * from \`group\` where id 
      in (${cids.groupIds.split(',').map(cid => Number(cid)).join(',')})`;
    logger.info(`查询所有组sql: ${selectAllSql}`);
    let [err, groups] = await mysqlDB.execute(selectAllSql);
    if (err) {
      logger.error(`查询组出错: err = ${err.message}`);
      return res.fail("查询组出错").toString();
    }
    res.success(groups, "查询成功");
    return res.toString();
  }

  /**
   * 根据用户登录名查询组
   * @param {String} userName 用户登录名
   */
  async queryGroupByUserName(userName) {
    let selectSql = `select * from \`group\` where id in 
      (select group_id from group_user_r where user_name = '${userName}')`;
    let [err, groups] = await mysqlDB.execute(selectSql);
    if (err) {
      logger.error(`根据用户登录名: userName = ${userName}, 未查询到关联组`);
      return null;
    }

    return groups;
  }

  /**
   * 分页查询组
   * @param {String} name 组名称
   * @param {Number} pageNum 当前页
   * @param {Number} pageSize 每页显示大小
   */
  async pageByGroup(name, parentId, userName, pageNum, pageSize) {
    let res = new Response();
    pageSize = pageSize ? parseInt(pageSize) : 10;
    pageNum = pageNum ? (parseInt(pageNum) - 1) * pageSize : 0;

    let selectSql = `select * from \`group\` where parent_id = ${parentId}`,
      countSql;
    // 管理员用户显示所有组
    if (userName === "admin") {
      selectSql = `select * from \`group\` where 1=1`;
    }
    if (name) {
      selectSql += ` and name like '%${name}%'`;
    }
    countSql = "select count(*) as count " + selectSql.substr(selectSql.indexOf("from"));
    selectSql += ` order by id desc limit ${pageNum}, ${pageSize}`;
    logger.debug(`分页查询组sql: ${countSql};${selectSql}`);
    let [err, result] = await mysqlDB.select(`${countSql};${selectSql}`);
    if (err) {
      logger.error(`分页查询组出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }
    logger.info("分页查询组成功");
    let count = result[0],
      groups = result[1];
    res.success({
      count: count[0].count,
      data: groups,
    });
    return res.toString();
  }

  /**
   * 根据组ID查询组详情
   * @param {Number} id 组ID
   */
  async queryGroupById(id) {
    let res = new Response();
    let selectSql = `select node_code as nodeCodes, path from group_node_r where group_id = ${id}`;
    let [err, result] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(
        `查询组: groupId = ${id}, 关联的节点出错: err = ${err.message}`
      );
      return res.fail("查询失败").toString();
    }
    logger.info(`根据组: groupId = ${id}, 查询组详情成功`);
    return res.success(result).toString();
  }

  /**
   * 删除组
   * @param {Array} ids 要删除的组ID集合
   */
  async deleteGroupByIds(ids, currentUser, ip) {
    let res = new Response();
    if (!ids || ids.length <= 0) {
      return res.fail("要删除的组ID为空").toString();
    }
    let delIds = [],
      ndelIds = [];
    for (let i = 0, len = ids.length; i < len; i++) {
      let [_, relates] = await mysqlDB.select(
        `select * from \`group\` where parent_id = ${ids[i]};
         select * from group_user_r where group_id = ${ids[i]}`
      );
      if (relates && relates.length > 0 && (relates[0].length > 0 || relates[1].length > 0)) {
        ndelIds.push(ids[i]);
      } else {
        delIds.push(ids[i]);
      }
    }
    if (delIds && delIds.length > 0) {
      let selectSql = `select GROUP_CONCAT(name) as names from \`group\` where id in (${delIds.join(",")})`;
      let [e, groupNames] = await mysqlDB.select(selectSql);
      if (!e && groupNames) {
        // 用户操作日志
        operateLogService.save({
          currentUser,
          key: "group.del",
          params: { name: groupNames[0].names },
          currentTime: timeUtils.getCurrentTime(),
          type: 1,
          ip,
        });
      }
      let deleteRelateSql = `delete from group_node_r where group_id in (${delIds.join(",")})`,
        deleteGroupSql = `delete from \`group\` where id in (${delIds.join(
          ","
        )})`;
      logger.debug(`删除组sql: ${deleteRelateSql};${deleteGroupSql}`);
      let [err] = await mysqlDB.delete(
        `${deleteRelateSql};${deleteGroupSql}`
      );
      if (err) {
        logger.error(`删除组出错: err = ${err.message}`);
        return res.fail("删除失败").toString();
      }
    }
    if (ndelIds && ndelIds.length > 0) {
      logger.info(`组: ${ndelIds.join(",")} 已被绑定, 无法删除`);
      return res.success(null, `组: ${ndelIds.join(",")} 已被绑定, 无法删除`).toString();
    }

    return res.success(null).toString();
  }
}

module.exports = new GroupService();
