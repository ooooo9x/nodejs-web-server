const Response = require("../utils/Response");
const mysqlDB = require("../utils/MySqlDB");
const StringUtils = require("../utils/StringUtils");
const logger = require("../utils/logger");
const timeUtils = require("../utils/timeUtils");

class RoleService {
  constructor() {}

  /**
   * 根据code查询角色信息
   * @param {String} code 角色code
   */
  async queryRoleByCode(code) {
    if (StringUtils.isEmpty(code)) {
      return null;
    }

    let selectSql = `select * from role where role_code = '${code}'`;
    logger.debug(`查询角色sql: ${selectSql}`);
    let [err, role] = await mysqlDB.execute(selectSql);
    if (err) {
      logger.error(`查询角色: code = ${code} 出错, err = ${err.message}`);
      return null;
    }

    if (role && role.length > 0) {
      return role[0];
    } else {
      return null;
    }
  }

  /**
   * 更新角色
   * @param {Number} id 角色ID
   * @param {String} roleName 角色名
   * @param {Array} privileges 权限code集合
   */
  async updateRole(id, roleName, level, privileges) {
    let res = new Response();
    if (StringUtils.isEmpty(id)) {
      logger.info(`角色: ID = ${id}, 不存在`);
      return res.fail("角色不存在").toString();
    }
    if (StringUtils.isEmpty(roleName)) {
      return res.fail("角色名为空").toString();
    }

    let selectSql = `select * from role where id = ${id}`;
    let [err, role] = await mysqlDB.selectOne(selectSql);
    if (err) {
      logger.error(`根据ID: ${id} 查询角色出错: err = ${err.message}`);
      return res.fail("更新失败").toString();
    }
    if (StringUtils.isEmpty(role)) {
      logger.error(`角色: ID = ${id}, 不存在`);
      return res.fail("角色不存在").toString();
    }
    if (StringUtils.isEmpty(level)) {
      return res.fail("角色级别为空").toString();
    }

    let roleCode = role.role_code;
    let deleteSql = `delete from privilege_role_r where role_code = '${roleCode}'`;
    let insertSql = `insert into privilege_role_r(privilege_code, role_code) values`;
    privileges.forEach((p) => {
      insertSql += `('${p}', '${roleCode}'),`;
    });
    if (insertSql.substr(insertSql.indexOf("values") + "values".length)) {
      insertSql = insertSql.substr(0, insertSql.length - 1);
    }
    let updateSql = `update role set role_name = '${roleName}', level = ${level}, edit_time = '${timeUtils.format(
      new Date()
    )}' 
      where role_code = '${roleCode}';`;
    updateSql += `${deleteSql};${insertSql}`;
    logger.debug(`角色权限全删全增sql: ${updateSql}`);

    let [er, _] = await mysqlDB.execute(updateSql);
    if (er) {
      logger.error(`角色权限全删全增出错: err = ${er.message}`);
      return res.fail("角色权限更新失败").toString();
    }

    return res.success().toString();
  }

  /**
   * 新增角色
   * @param {String} code 角色code
   * @param {String} name 角色名
   * @param {Array} privileges 权限code集合
   */
  async saveRole(code, name, level, privileges) {
    let res = new Response();
    if (StringUtils.isEmpty(code)) {
      return res.fail("角色code为空").toString();
    }
    if (StringUtils.isEmpty(name)) {
      return res.fail("角色名为空").toString();
    }
    if (StringUtils.isEmpty(level)) {
      return res.fail("角色级别为空").toString();
    }

    let selectSql = `select * from role where role_code = '${code}'`;
    let [err, role] = await mysqlDB.selectOne(selectSql);
    if (err) {
      logger.error(`根据code: ${code} 查询角色出错: err = ${err.message}`);
      return res.fail("新增失败").toString();
    }
    if (StringUtils.isNotEmpty(role)) {
      logger.info(`角色: code = ${code}, 已存在`);
      return res.fail("角色code重复").toString();
    }

    let insertSql = ``;
    privileges.forEach((p) => {
      insertSql += `('${p}', '${code}'),`;
    });
    if (StringUtils.isNotEmpty(insertSql)) {
      insertSql = `insert into privilege_role_r(privilege_code, role_code) 
        values ${insertSql.substr(0, insertSql.length - 1)}`;
    }
    let updateSql = `insert into role(role_name, role_code, level, add_time, edit_time) 
      values('${name}', '${code}', ${level}, '${timeUtils.format(
      new Date()
    )}', '${timeUtils.format(new Date())}')`;

    let sql = `${updateSql};${insertSql}`;
    logger.debug(`新增角色sql: ${sql}`);
    let [e, _] = await mysqlDB.insert(sql);
    if (e) {
      logger.error(`新增角色出错: err = ${e.message}`);
      return res.fail("新增失败").toString();
    }

    return res.success().toString();
  }

  /**
   * 删除角色
   * @param {Array} codes 角色code集合
   */
  async deleteRole(codes) {
    let res = new Response();
    if (StringUtils.isEmpty(codes)) {
      return res.fail("角色code为空").toString();
    }

    let selectSql = `SELECT * FROM user WHERE role_code IN ('${codes.join(
      "','"
    )}')`;
    logger.debug(`删除角色前检查角色是否被绑定sql: ${selectSql}`);
    let [err, result] = await mysqlDB.selectOne(selectSql);
    if (err) {
      logger.error(`删除角色前检查角色是否被绑定出错: err = ${err.message}`);
      return res.fail("删除失败").toString();
    }
    if (result) {
      return res.fail("角色已被绑定").toString();
    }

    let deleteSql = `DELETE FROM role WHERE role_code IN ('${codes.join(
      "','"
    )}');
      DELETE FROM privilege_role_r WHERE role_code IN ('${codes.join("','")}')`;

    logger.debug(`删除角色sql: ${deleteSql}`);
    [err, result] = await mysqlDB.delete(deleteSql);
    if (err) {
      logger.error(`删除角色出错: err = ${err.message}`);
      return res.fail("删除失败").toString();
    }

    return res.success().toString();
  }

  /**
   * 分页查询角色
   * @param {String} code 角色code
   * @param {String} name 角色名
   * @param {Number} pageNum 页码
   * @param {Number} pageSize 每页大小
   */
  async pageByRole(code, name, level, pageNum, pageSize) {
    let res = new Response();
    pageNum = StringUtils.isEmpty(pageNum) ? 0 : pageNum - 1;
    pageSize = StringUtils.isEmpty(pageSize) ? 20 : parseInt(pageSize);
    pageNum = pageSize * pageNum;

    let whereSql = " WHERE 1=1";
    if (StringUtils.isNotEmpty(code)) {
      whereSql += ` AND r.role_code LIKE '%${code}%'`;
    }
    if (StringUtils.isNotEmpty(name)) {
      whereSql += ` AND r.role_name LIKE '%${name}%'`;
    }
    if (StringUtils.isNotEmpty(level)) {
      whereSql += ` AND r.level >= ${level}`;
    }

    let selectSql = `SELECT r.*, GROUP_CONCAT(DISTINCT p.privilege_name) AS privilege_name, 
      GROUP_CONCAT(DISTINCT p.privilege_code) AS privilege_code FROM role r, privilege_role_r pr, 
      privilege p ${whereSql} AND r.role_code = pr.role_code AND p.privilege_code = pr.privilege_code 
      GROUP BY r.role_code ORDER BY id DESC LIMIT ${pageNum}, ${pageSize}`;

    let countSql = "SELECT COUNT(1) AS num FROM role r " + whereSql;
    let sql = `${selectSql};${countSql}`;
    logger.debug(`角色分页查询sql: ${sql}`);

    let [err, result] = await mysqlDB.select(sql);
    if (err) {
      logger.error(`角色分页查询出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    return res
      .success({
        count: result[1][0].num,
        data: result[0],
      })
      .toString();
  }

  /**
   * 根据id查询角色
   * @param {Number} id 角色id
   */
  async getRoleById(id) {
    let res = new Response(),
      selectSql = `SELECT * FROM role WHERE id = ${id}`;
    logger.debug(`查询角色sql: ${selectSql}`);
    let [err, role] = await mysqlDB.selectOne(selectSql);
    if (err) {
      logger.error(`查询角色出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    return res.success(role).toString();
  }

  /**
   * 查询菜单权限
   * @param {String} code 角色code
   */
  async getPrivilegeTree(code) {
    let res = new Response(),
      selectSql = `SELECT * FROM privilege`;
    if (StringUtils.isNotEmpty(code)) {
      selectSql = `SELECT p.* FROM privilege p, privilege_role_r pr 
        WHERE pr.role_code = '${code}' AND p.privilege_code = pr.privilege_code`;
    }

    logger.debug(`查询菜单权限sql: ${selectSql}`);
    let [err, list] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`查询菜单出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    let pobj = {},
      pList = [];
    list &&
      list.forEach((p) => {
        if (p.parent_id in pobj) {
          pobj[p.parent_id].push(p);
        } else {
          pobj[p.parent_id] = [p];
        }
      });

    list &&
      list.forEach((p) => {
        if (p.parent_id === 0) {
          p.children = pobj[p.id];
          pList.push(p);
        }
      });

    return res.success(pList).toString();
  }

  /**
   * 查询全部角色
   */
  async getAllRoles() {
    let res = new Response(),
      selectSql = "SELECT * FROM role";

    logger.debug(`查询全部角色sql: ${selectSql}`);
    let [err, roles] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`查询全部角色出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    return res.success(roles).toString();
  }

  /**
   * 查询角色,级别<=level
   */
  async getRolesByLevel(level) {
    let res = new Response(),
      selectSql = `SELECT * FROM role where level >= ${level}`;

    logger.debug(`查询符合级别的角色sql: ${selectSql}`);
    let [err, roles] = await mysqlDB.select(selectSql);
    if (err) {
      logger.error(`查询符合级别的角色出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    return res.success(roles).toString();
  }
}

module.exports = new RoleService();
