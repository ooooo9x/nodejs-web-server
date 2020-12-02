const Response = require("../utils/Response");
const mysqlDB = require("../utils/MySqlDB");
//引入时间工具
const timeUtils = require("../../src/utils/timeUtils");
//引入3des加密工具
const desUtils = require("../utils/3desUtils");
//生成验证码工具
const svgCaptcha = require("svg-captcha");
const groupService = require("./GroupService");
const roleService = require("./RoleService");
const logger = require("../utils/logger");
const Cache = require("../utils/Cache");
const StringUtils = require("../utils/StringUtils");
const ArrayUtils = require("../utils/ArrayUtils");
const jwt = require("jsonwebtoken");

const { isCheckCaptcha, des_key } = require("../../config/config");

/**
 * 用户Service
 */
class UserService {
  constructor() {}

  /**
   * 用户登录
   * @param {String} userName 用户名
   * @param {String} password 密码
   */
  async login(userName, password) {
    let res = new Response();

    if (StringUtils.isEmpty(userName) || StringUtils.isEmpty(password)) {
      return res.fail("用户名或密码为空").toString();
    }

    let sql = `SELECT u.*, r.level as role_level FROM user u, role r 
      WHERE user_name = '${userName}' AND u.role_code = r.role_code`;
    logger.debug("用户查询sql:", sql);

    let [err, user] = await mysqlDB.selectOne(sql);
    if (err) {
      return res.fail(err.message).toString();
    }
    if (user.pwd !== password) {
      return res.fail("密码不正确").toString();
    }

    let token = jwt.sign({ userName, password }, des_key);
    logger.debug(`用户[${userName}]登录token[${token}]`);
    user.token = token;

    return res.success(user, "登录成功").toString();
  }

  /**
   * 查询用户绑定的组
   * @param {String} userName 用户登录名
   * @param {Number} type 1只返回一条组数据, 默认返回所有
   */
  async searchGroupsByUserName(userName, type) {
    let res = new Response();
    if (StringUtils.isEmpty(userName)) {
      return res.fail("用户名不能为空").toString();
    }

    if (userName === "admin") {
      return res.success([{ id: 0, name: "所有组" }]).toString();
    }

    let selectSql = `select * from \`group\` where id in 
      (select group_id from group_user_r where user_name = '${userName}') order by id desc`;
    logger.debug(`查询用户绑定的组sql: ${selectSql}`);
    let [err, result] = await mysqlDB.select(selectSql);
    if (err) {
      logger.info(`查询用户绑定的组出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    let groups = Number(type) === 1 ? [result[0]] : result;

    return res.success(groups).toString();
  }

  /**
   * 更新用户信息
   * @param {Number} id 用户ID
   * @param {String} cnName 用户姓名
   * @param {String} roleCode 角色code
   * @param {Array} groupIds 组集合
   */
  async updateUser(id, cnName, roleCode, groupId) {
    let currentTime = timeUtils.getSystemTime();

    let res = new Response();
    if (StringUtils.isEmpty(id)) {
      return res.fail("用户ID为空").toString();
    }
    if (StringUtils.isEmpty(groupId)) {
      logger.info(`用户未绑定组`);
      return res.fail("用户未绑定组").toString();
    }

    let selectSql = `select * from user where id = ${id}`;
    logger.debug(`查询用户sql: ${selectSql}`);
    let [err, user] = await mysqlDB.execute(selectSql);
    if (err) {
      logger.info(`用户: ID = ${id} 不存在, err = ${err.message}`);
      return res.fail("用户不存在").toString();
    }

    selectSql = `select * from role where role_code = '${roleCode}'`;
    logger.debug(`查询用户绑定的角色sql: ${selectSql}`);
    let [err1, result] = await mysqlDB.execute(selectSql);
    if (err1) {
      logger.info(
        `用户: ID = ${id} 绑定的角色: code = ${roleCode} 出错, err = ${err1.message}`
      );
      return res.fail("用户绑定的角色不存在").toString();
    }

    let userName = user[0].user_name;

    let updateUserSql = `update user set cn_name = '${cnName}', role_code = '${roleCode}', 
      edit_time = '${currentTime}' where id = ${id}`;
    let deleteGroupUserRelateSql = `delete from group_user_r where user_name = '${userName}'`;

    let insertGroupUserRelateSql = `insert into group_user_r(group_id, user_name) values(${groupId}, '${userName}')`;
    // if (StringUtils.isEmpty(groupId)) {
    //   insertGroupUserRelateSql = `insert into group_user_r(group_id, user_name) values`;
    //   groupIds.forEach((gId) => {
    //     insertGroupUserRelateSql += ` (${gId}, '${userName}'),`;
    //   });
    //   if (
    //     insertGroupUserRelateSql.substr(
    //       insertGroupUserRelateSql.indexOf("values") + "values".length
    //     )
    //   ) {
    //     insertGroupUserRelateSql = insertGroupUserRelateSql.substr(
    //       0,
    //       insertGroupUserRelateSql.length - 1
    //     );
    //   }
    // }

    let updateSql = `${updateUserSql};${deleteGroupUserRelateSql};${insertGroupUserRelateSql}`;
    logger.debug(`更新用户信息sql: ${updateSql}`);
    [err1, result] = await mysqlDB.execute(updateSql);
    if (err1) {
      logger.info(`更新用户: ID = ${id} 信息出错, err = ${err1.message}`);
      return res.fail("更新用户信息出错").toString();
    }

    return res.success(null, "用户信息更新成功").toString();
  }

  /**
   * 新增用户
   * @param {String} userName 用户登录名
   * @param {String} cnName 用户姓名
   * @param {String} pwd 密码
   * @param {String} roleCode 角色code
   * @param {String} groupId 组ID
   */
  async save(userName, cnName, pwd, roleCode, groupId) {
    let currentTime = timeUtils.getSystemTime(),
      res = new Response();

    if (StringUtils.isOneEmpty(userName, cnName, pwd)) {
      logger.info(
        `用户信息不全: userName = ${userName}, cnName = ${cnName}, pwd = ${pwd}`
      );
      return res.fail("用户信息不全").toString();
    }
    if (StringUtils.isEmpty(roleCode)) {
      logger.info(`用户未绑定角色`);
      return res.fail("用户未绑定角色").toString();
    }
    if (StringUtils.isEmpty(groupId)) {
      logger.info(`用户未绑定组`);
      return res.fail("用户未绑定组").toString();
    }

    let selectSql = `select * from user where user_name = '${userName}'`;
    let [err, result] = await mysqlDB.execute(selectSql);
    if (ArrayUtils.isNotEmpty(result)) {
      logger.info(`登录名重复: ${userName}`);
      return res.fail("登录名重复").toString();
    }

    selectSql = `select * from role where role_code = '${roleCode}'`;
    [err, result] = await mysqlDB.execute(selectSql);
    if (err || ArrayUtils.isEmpty(result)) {
      logger.info(`用户绑定的角色: roleCode = ${roleCode} 不存在`);
      return res.fail("用户绑定的角色不存在").toString();
    }

    let insertSql = `insert into user(user_name, cn_name, pwd, role_code, add_time, edit_time) 
      values('${userName}', '${cnName}', '${pwd}', '${roleCode}', '${currentTime}', '${currentTime}');
      insert into group_user_r(group_id, user_name) values(${groupId}, '${userName}')`;

    logger.debug(`新增用户sql: ${insertSql}`);
    [err, result] = await mysqlDB.execute(insertSql);
    if (err) {
      logger.error(`新增用户出错: err = ${err.message}`);
      return res.fail("新增用户出错").toString();
    }

    // err = await userGroupRelateService.saveList(userName, groupIds);
    // if (err) {
    //   res.fail("添加用户与组的关联出错");
    //   logger.info(
    //     `添加用户: userName = ${userName} 与组的关联出错, err = ${err.message}`
    //   );
    //   return res.toString();
    // }

    return res.success(null, "新增用户成功").toString();
  }

  /**
   * 根据组ID分页查询所有用户
   * @param {Number} groupId 组
   */
  async queryUserByGroupId(
    groupId,
    currentUser,
    loginName,
    userName,
    isAllGroup, // 是否显示组下所有子组关联的用户
    pageSize,
    pageNum
  ) {
    let res = new Response();
    if (StringUtils.isEmpty(groupId)) {
      return res.fail("组ID为空").toString();
    }

    //每页大小
    pageSize = pageSize ? parseInt(pageSize) : 10;
    //当前页
    pageNum = pageNum ? parseInt(pageNum) - 1 : 0;
    pageNum = pageSize * pageNum;

    let whereSql = "where 1=1";

    // 超级管理员用户不受组的限制
    if (currentUser !== "admin") {
      whereSql += ` and user_name in (select r.user_name from group_user_r r, \`group\` g 
        where r.group_id = g.id`;
      if (isAllGroup) {
        // 递归查询该组下所有子组
        let selectChildSql = `select getGroupChildList(${groupId}) as groupIds`;
        logger.debug(`查询所有子组sql: ${selectChildSql}`);
        let [e, cids] = await mysqlDB.selectOne(selectChildSql);
        if (e) {
          logger.error(`查询所有子组出错: err = ${e.message}`);
          return res.fail("查询出错").toString();
        }
        whereSql += ` and g.id in (${cids.groupIds
          .split(",")
          .map((cid) => Number(cid))
          .join(",")}))`;
      } else {
        whereSql += ` and (g.id = ${groupId} or g.parent_id = ${groupId}))`;
      }
    }
    if (loginName) whereSql += ` and user.user_name = '${loginName}'`;
    if (userName) whereSql += ` and user.cn_name = '${userName}'`;

    let selectSql = `select * from user ${whereSql} limit ${pageNum}, ${pageSize}`;
    let countSql = `select count(*) as count from user ${whereSql}`;

    logger.debug(`根据组ID查询用户sql: ${selectSql}`);
    logger.debug(`根据组ID查询用户总数sql: ${countSql}`);

    let [er, count] = await mysqlDB.execute(countSql);
    if (er) {
      logger.info(`根据组: ID = ${groupId}, 查询到用户总数出错`);
      count = 0;
    } else {
      count = count[0].count;
    }
    let [err, users] = await mysqlDB.execute(selectSql);
    if (err) {
      logger.info(`根据组: ID = ${groupId}, 未查询到用户`);
      return res.fail("未查询到用户").toString();
    }

    if (ArrayUtils.isNotEmpty(users)) {
      for (let i = 0, len = users.length; i < len; i++) {
        // 查询用户关联的组信息
        let groups = await groupService.queryGroupByUserName(
          users[i].user_name
        );
        users[i].groups = groups;

        // 查询用户绑定的角色信息
        let role = await roleService.queryRoleByCode(users[i].role_code);
        users[i].role = role;
      }
    }

    let data = {
      count,
      data: users,
    };
    logger.info(`组: groupId = ${groupId} 下用户查询成功`);
    return res.success(data).toString();
  }

  /**
   * 根据ID删除用户
   * @param {Number} id 用户ID
   */
  async deleteUserById(id) {
    let selectSql = `select * from user where id = ${id}`;
    let [err, user] = await mysqlDB.execute(selectSql);
    if (err) {
      throw err;
    }

    if (!user || user.length <= 0) {
      throw new Error(`用户不存在: ID = ${id}`);
    }

    user = user[0];

    let deleteUserGroupRelateSql = `delete from group_user_r where user_name = '${user.user_name}'`;

    let deleteUserSql = `delete from user where id = ${id}`;
    let deleteSql = `${deleteUserSql};${deleteUserGroupRelateSql}`;
    logger.debug(`删除用户sql: ${deleteSql}`);
    let [err1, _] = await mysqlDB.execute(deleteSql);
    if (err1) {
      throw err1;
    }

    return null;
  }

  /**
   * 批量删除用户
   * @param {Array} ids 删除用户ID集合
   */
  async deleteUserByIds(ids) {
    let res = new Response();
    if (ArrayUtils.isEmpty(ids)) {
      return res.fail("要删除的用户ID为空").toString();
    }

    for (let i = 0, len = ids.length; i < len; i++) {
      if (!ids[i]) continue;
      try {
        await this.deleteUserById(ids[i]);
      } catch (e) {
        logger.info(`用户: ID = ${ids[i]} 删除出错: err = ${e.message}`);
      }
    }

    return res.success(null, "用户删除成功").toString();
  }

  /**
   * 生成验证码
   */
  getCaptcha() {
    let cap = svgCaptcha.create({ fontSize: 50, width: 100, height: 40 });
    let text = cap.text ? cap.text.toLowerCase() : "";
    let data = cap.data;
    return { text, data };
  }

  /**
   * 校验验证码
   * @param {String} text 用户输入的验证码
   * @param {String} captcha session中的验证码
   */
  checkCaptcha(text, captcha) {
    let res = new Response();
    if (!isCheckCaptcha) {
      return res.success(null, "验证码校验成功");
    }
    if (StringUtils.isEmpty(text)) {
      return res.fail("请输入验证码").toString();
    }
    if (captcha === text.toLowerCase()) {
      res.success(null, "验证码校验成功");
    } else {
      res.fail("验证码不正确");
    }

    return res.toString();
  }

  /**
   * 解密密文密码(用户忘记密码时,调用该接口)
   * @param {String} password 密文密码
   * @param {String} desKey 密钥
   */
  decryptByDES(password, desKey) {
    let pwd = desUtils.decryptByDES(password, desKey);
    return new Response().success(pwd).toString();
  }

  /**
   * 添加收藏
   * @param {Number} userId 用户ID
   * @param {Number} areaId 区域ID
   * @param {Number} subareaId 子区域ID
   * @param {Number} siteId 站点ID
   * @param {String} roomCode 机房code
   * @param {Number} channelIds 通道ID集合
   */
  async addCollect(
    userId,
    areaId,
    subareaId,
    siteId,
    roomCode,
    channelIds,
    groupId
  ) {
    let res = new Response();
    if (StringUtils.isEmpty(userId)) {
      logger.info(`添加收藏的用户ID: ${userId}, 为空`);
      return res.fail("添加收藏的用户ID为空").toString();
    }

    let insertSql = "";
    if (StringUtils.isNotEmpty(areaId)) {
      insertSql = `INSERT INTO user_collect (user_id,channel_id) SELECT ${userId} AS user_id, c.channel_id 
        FROM channel c, device d, anhui_res_room r, anhui_res_site s, anhui_res_subarea sa, anhui_room_device_r rdr 
        where sa.area_id = ${areaId} AND c.channel_bearea = d.device_id AND rdr.room_id = r.room_id 
        AND rdr.device_id = d.code_id AND r.site_id = s.site_id AND s.subarea_id = sa.subarea_id 
        AND c.channel_id NOT IN (SELECT uc.channel_id FROM user_collect uc WHERE user_id = ${userId})`;
    }

    if (StringUtils.isNotEmpty(subareaId)) {
      insertSql = `INSERT INTO user_collect (user_id,channel_id) SELECT ${userId} AS user_id,c.channel_id 
        FROM channel c,device d, anhui_res_room r, anhui_res_site s, anhui_room_device_r rdr 
        where s.subarea_id = ${subareaId} AND c.channel_bearea = d.device_id AND rdr.room_id = r.room_id 
        AND rdr.device_id = d.code_id AND r.site_id = s.site_id 
        AND c.channel_id NOT IN (SELECT uc.channel_id FROM user_collect uc WHERE user_id = ${userId})`;
    }

    if (StringUtils.isNotEmpty(siteId)) {
      insertSql = `INSERT INTO user_collect (user_id,channel_id) SELECT ${userId} AS user_id,c.channel_id 
        FROM channel c, device d, anhui_res_room r, anhui_room_device_r rdr where r.site_id = ${siteId} 
        AND c.channel_bearea = d.device_id AND rdr.room_id = r.room_id AND rdr.device_id = d.code_id 
        AND c.channel_id NOT IN (SELECT uc.channel_id FROM user_collect uc WHERE user_id = ${userId})`;
    }

    if (StringUtils.isNotEmpty(roomCode)) {
      insertSql = `INSERT INTO user_collect (user_id, channel_id) SELECT ${userId} AS user_id, c.channel_id 
       FROM channel c, device d, anhui_res_room r, anhui_room_device_r rdr where r.room_id = '${roomCode}' 
       AND c.channel_bearea = d.device_id AND rdr.room_id = r.room_id AND rdr.device_id = d.code_id 
       AND c.channel_id NOT IN (SELECT uc.channel_id FROM user_collect uc WHERE user_id = ${userId})`;
    }

    channelIds = [...new Set(channelIds)];
    channelIds.forEach((ch) => {
      insertSql += `INSERT INTO user_collect (user_id, channel_id) VALUES (${userId}, '${ch}');`;
    });
    logger.debug(`用户: ID = ${userId}, 添加收藏sql: ${insertSql}`);
    let [err, _] = await mysqlDB.insert(insertSql);
    if (err) {
      logger.error(`用户: ID = ${userId}, 添加收藏出错: err = ${err.message}`);
      return res.fail("添加收藏失败").toString();
    }

    // 添加收藏时, 清除原收藏树缓存
    let cache = new Cache(),
      keyPath = `collecttreedata.${timeUtils.format(
        new Date(),
        "yyyy-MM-dd"
      )}.groupId-${groupId}.userId-${userId}.txt`;

    await cache.removeCacheFile(keyPath);

    logger.info(`用户: ID = ${userId}, 添加收藏成功`);
    return res.success().toString();
  }

  /**
   * 取消收藏
   * @param {Number} userId 用户ID
   * @param {Number} areaId 区域ID
   * @param {Number} subareaId 子区域ID
   * @param {Number} siteId 站点ID
   * @param {String} roomCode 机房code
   * @param {Number} channelIds 通道ID集合
   */
  async removeCollect(
    userId,
    areaId,
    subareaId,
    siteId,
    roomCode,
    channelIds,
    groupId
  ) {
    let res = new Response();
    if (StringUtils.isEmpty(userId)) {
      logger.info(`取消收藏的用户ID: ${userId}, 为空`);
      return res.fail("取消收藏的用户ID为空").toString();
    }

    let deleteSql = "";
    if (StringUtils.isNotEmpty(areaId)) {
      deleteSql = `DELETE FROM user_collect WHERE user_id = ${userId} AND channel_id IN (SELECT c.channel_id 
        FROM channel c, device d, anhui_res_room r, anhui_res_site s, anhui_res_subarea sa, anhui_room_device_r rdr 
        where sa.area_id = ${areaId} AND c.channel_bearea = d.device_id AND rdr.room_id = r.room_id 
        AND rdr.device_id = d.code_id AND r.site_id = s.site_id AND s.subarea_id = sa.subarea_id)`;
    }

    if (StringUtils.isNotEmpty(subareaId)) {
      deleteSql = `DELETE FROM user_collect WHERE user_id = ${userId} AND channel_id IN (SELECT c.channel_id 
        FROM channel c, device d, anhui_res_room r, anhui_res_site s, anhui_room_device_r rdr 
        where s.subarea_id = ${subareaId} AND c.channel_bearea = d.device_id AND rdr.room_id = r.room_id 
        AND rdr.device_id = d.code_id AND r.site_id = s.site_id)`;
    }

    if (StringUtils.isNotEmpty(siteId)) {
      deleteSql = `DELETE FROM user_collect WHERE user_id = ${userId} AND channel_id IN (SELECT c.channel_id 
        FROM channel c, device d, anhui_res_room r, anhui_room_device_r rdr where r.site_id = ${siteId} 
        AND c.channel_bearea = d.device_id AND rdr.room_id = r.room_id AND rdr.device_id = d.code_id)`;
    }

    if (StringUtils.isNotEmpty(roomCode)) {
      deleteSql = `DELETE FROM user_collect WHERE user_id = ${userId} AND channel_id IN (SELECT c.channel_id 
        FROM channel c, device d, anhui_res_room r, anhui_room_device_r rdr where r.room_id = '${roomCode}' 
        AND c.channel_bearea = d.device_id AND rdr.room_id = r.room_id AND rdr.device_id = d.code_id)`;
    }

    if (ArrayUtils.isNotEmpty(channelIds)) {
      deleteSql = `DELETE FROM user_collect WHERE user_id = ${userId} AND channel_id IN ('${channelIds.join(
        "','"
      )}')`;
    }

    logger.debug(`用户: ID = ${userId}, 取消收藏sql: ${deleteSql}`);

    let [err, _] = await mysqlDB.delete(deleteSql);
    if (err) {
      logger.error(`用户: ID = ${userId}, 取消收藏出错: err = ${err.message}`);
      return res.fail("取消收藏失败").toString();
    }

    // 取消收藏时, 清除原收藏树缓存
    let cache = new Cache(),
      keyPath = `collecttreedata.${timeUtils.format(
        new Date(),
        "yyyy-MM-dd"
      )}.groupId-${groupId}.userId-${userId}.txt`;

    await cache.removeCacheFile(keyPath);

    logger.info(`用户: ID = ${userId}, 取消收藏成功`);
    return res.success().toString();
  }

  /**
   * 根据ID查询用户
   * @param {Number} id 用户ID
   */
  async getUserById(id) {
    let res = new Response();
    if (StringUtils.isEmpty(id)) {
      return res.fail("用户ID为空").toString();
    }

    let selectSql = `SELECT * FROM user WHERE id = ${id}`;
    logger.debug(`根据ID查询用户sql: ${selectSql}`);
    let [err, user] = await mysqlDB.selectOne(selectSql);
    if (err) {
      logger.error(`根据ID: ${id}, 查询用户出错: err = ${err.message}`);
      return res.fail("查询失败").toString();
    }

    if (user) {
      return res.success(user).toString();
    } else {
      return res.fail("未查询到用户").toString();
    }
  }

  /**
   * 根据用户登录名更新密码
   * @param {String} userName 用户登录名
   * @param {String} pwd 密码
   */
  async changePwdByUserName(userName, pwd) {
    let res = new Response();
    if (StringUtils.isEmpty(userName)) {
      return res.fail("用户登录名为空").toString();
    }
    if (StringUtils.isEmpty(pwd)) {
      return res.fail("用户密码为空").toString();
    }

    let selectSql = `SELECT * FROM user WHERE user_name = '${userName}'`;
    let [err, result] = await mysqlDB.selectOne(selectSql);
    if (err) {
      logger.error(
        `根据登录名: userName = ${userName}, 查询用户出错: err = ${err.message}`
      );
      return res.fail("更新失败").toString();
    }
    if (!result) {
      logger.info(`根据登录名: userName = ${userName}, 未查询到用户`);
      return res.fail("更新失败").toString();
    }

    let updateSql = `UPDATE user SET pwd = '${pwd}' WHERE user_name = '${userName}'`;
    logger.debug(`更新密码sql: ${updateSql}`);
    [err, result] = await mysqlDB.update(updateSql);
    if (err) {
      logger.error(
        `更新用户: userName = ${userName}, 密码出错: err = ${err.message}`
      );
      return res.fail("更新失败").toString();
    }

    return res.success(null, "更新成功").toString();
  }
}

module.exports = new UserService();
