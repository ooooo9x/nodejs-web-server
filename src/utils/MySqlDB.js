/**
 * 数据库链接工具
 */
//引入配置
const { mysql: mysqlc } = require("../../config/config");

const mysql = require("mysql");
const pool = mysql.createPool(mysqlc);

const mysqlDb = {
  exe(sql) {
    return new Promise(resolve => {
      pool.query(sql, (err, res) => {
        if (err) {
          resolve([err, null]);
        } else {
          resolve([null, res]);
        }
      });
    });
  },
  execute(sql) {
    return new Promise((resolve, reject) => {
      pool.getConnection((err, conn) => {
        if (err) {
          resolve([err, null]);
        } else {
          conn.query(sql, (err, res) => {
            if (err) {
              resolve([err, null]);
            } else {
              resolve([null, res]);
            }
            conn.release();
          });
        }
      });
    });
  },
  select(sql) {
    return this.execute(sql);
  },
  selectOne(sql) {
    return new Promise((resolve, reject) => {
      pool.getConnection((err, conn) => {
        if (err) {
          resolve([err, null]);
        } else {
          conn.query(sql, (err, res) => {
            if (err) {
              resolve([err, null]);
            } else {
              let result = (res && res.length > 0) ? res[0] : null;
              resolve([null, result]);
            }
            conn.release();
          });
        }
      });
    });
  },
  insert(sql) {
    return new Promise((resolve, reject) => {
      pool.getConnection((err, conn) => {
        if (err) {
          resolve([err, null]);
        } else {
          conn.query(sql, (err, res) => {
            if (err) {
              resolve([err, null]);
            } else {
              resolve([null, res.insertId]);
            }
            conn.release();
          });
        }
      });
    });
  },
  update(sql) {
    return new Promise((resolve, reject) => {
      pool.getConnection((err, conn) => {
        if (err) {
          resolve([err, null]);
        } else {
          conn.query(sql, (err, res) => {
            if (err) {
              resolve([err, null]);
            } else {
              resolve([null, res.affectedRows]);
            }
            conn.release();
          });
        }
      });
    });
  },
  delete(sql) {
    return this.update(sql);
  },
};

module.exports = mysqlDb;
