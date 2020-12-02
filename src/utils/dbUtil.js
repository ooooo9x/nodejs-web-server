//引入ORM框架
var Sequelize = require('sequelize');
//引入常量类
var config=require("../../config/config");

var dbUtil = {}
dbUtil.initdb = function (){
//初始化链接（支持连接池）
var sequelize = new Sequelize(config.mysql_name, config.mysql_username, config.mysql_pwd,  {
    host: config.mysql_path,
    port:config.mysql_port,
    // 建议开启，方便对照生成的sql语句
    logging: true,
    dialect: 'mysql'|'sqlite'|'postgres'|'mssql',
    pool: {
      max: 5,
      min: 0,
      idle: 10000
    },
    // SQLite only
    storage: 'path/to/database.sqlite'
  });
  //定义数据模型
  var User = sequelize.define('user', {
    username: Sequelize.STRING,
    birthday: Sequelize.DATE
  });
  //初始化数据
  sequelize.sync().then(function() {
    return User.create({
      username: 'janedoe',
      birthday: new Date(1980, 6, 20)
    });
  }).then(function(jane) {
    //获取数据
    console.log(jane.get({
      plain: true
    }));
  }).catch(function (err) {
    //异常捕获
    console.log('Unable to connect to the database:', err);
  });
}

//测试数据库链接
sequelize.authenticate().then(function() {
    console.log("数据库连接成功");
}).catch(function(err) {
    //数据库连接失败时打印输出
    console.error(err);
    throw err;
});

exports.sequelize = sequelize;
exports.Sequelize = Sequelize;

module.exports = dbUtil;

