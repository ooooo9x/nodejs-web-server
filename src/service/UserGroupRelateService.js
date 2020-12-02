const mysqlDB = require("../utils/MySqlDB");

class UserGroupRelateService {
  constructor() {}

  /**
   * 新增用户与组的关联
   * @param {String} userName 用户登录名
   * @param {Number} groupId 组ID
   */
  async save(userName, groupId) {
    let insertSql = `insert into group_user_r(group_id, user_name) values(${groupId}, '${userName}')`;
    return await mysqlDB.execute(insertSql);
  }

  /**
   * 批量新增用户与组的关联
   * @param {String} userName 用户登录名
   * @param {Array} groupId 组ID集合
   */
  async saveList(userName, groupIds) {
    let insertSql = `insert into group_user_r(group_id, user_name) values`;
    if (groupIds && groupIds.length > 0) {
      groupIds.forEach(gId => {
        insertSql += ` (${gId}, '${userName}'),`;
      });
      if (insertSql.substr(insertSql.indexOf('values') + 'values'.length)) {
        insertSql = insertSql.substr(0, insertSql.length - 1);
        console.log(`新增用户与组的关联sql: ${insertSql}`);
        let [err, _] = await mysqlDB.execute(insertSql);
        if (err) {
          console.log(`新增用户与组的关联出错: err = ${err.message}`);
          return err;
        }
      }
    }
    return null;
  }

  /**
   * 根据用户登录名删除该用户与组的关联
   * @param {String} userName 用户登录名
   */
  async deleteByUserName(userName) {
    let deleteSql = `delete from group_user_r where user_name = '${userName}'`;
    console.log(`根据用户登录名删除其与组的关联sql: ${deleteSql}`);
    let [err, _] = await mysqlDB.execute(deleteSql);
    if (err) {
      console.log(`删除用户: userName = ${userName} 与组的关联出错, err = ${err.message}`);
    } else {
      console.log(`删除用户: userName = ${userName} 与组的关联成功`);
    }

    return err;
  }

  async updateByUserName(userName, groupIds) {
    console.log(`更新用户: userName = ${userName} 与组: groupIds = ${groupIds.join(",")} 的关联`);
    let err = await this.deleteByUserName(userName);
    if (err) {
      return err;
    }
    err = await this.saveList(userName, groupIds);
    if (err) {
      return err;
    }

    return null;
  }
}

module.exports = new UserGroupRelateService();