const mysqlDB = require("../utils/MySqlDB");

class NodeGroupRelateService {
  constructor() {}

  /**
   * 批量新增节点与组的关联
   * @param {Number} groupId 组ID
   * @param {Array} nodes 节点code集合
   */
  saveList(groupId, nodes) {
    let insertSql = `insert into group_node_r (group_id, path, node_code) values`;
    for (let i = 0, len = nodes.length; i < len; i++) {
      let path = nodes[i].path,
        nodeCodes = nodes[i].nodeCodes;
      if (!nodeCodes || nodeCodes.length <= 0) {
        continue;
      }
      nodeCodes.forEach(ncode => {
        insertSql += ` (${groupId}, '${path}', '${ncode}'),`;
      });
    }

    console.log(`新增组和节点关联sql:${insertSql}`);

    if (insertSql.substr(insertSql.indexOf('values') + 'values'.length)) {
      return insertSql.substr(0, insertSql.length - 1);
    }

    return "";
  }
}

module.exports = new NodeGroupRelateService();