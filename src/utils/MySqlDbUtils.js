/**
 * 数据库链接工具
 * <弃用,推荐使用MySqlDB.js>
 */
//引入常量类
var config=require("../../config/config");

var mysql=require("mysql");

var pool = mysql.createPool(config.mysql);

var query=function(sql,callback){
    pool.getConnection(function(err,conn){
        if(err){
            callback(err,null,null);
        }else{
            conn.query(sql,function(qerr,vals,fields){
                //释放连接
                conn.release();
                //事件驱动回调
                callback(qerr,vals,fields);
            });
        }
    });
};

module.exports=query;
