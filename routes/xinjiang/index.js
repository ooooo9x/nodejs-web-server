/**
 * 首页相关api
 * @type {createApplication}
 */

var express = require('express');
var router = express.Router();
//引入数据库操作工具
var dbUtils=require("../../src/utils/MySqlDbUtils");
//引入文本工具类
var textUtils=require("../../src/utils/textUtils");
//引入时间工具
var timeUtils=require("../../src/utils/timeUtils");

//要执行的sql
var sqlStr="";



/**
 * 获取首页标星播放地址
 * type：地址类型 0：仓库监控 1：堆场监控 2：龙门吊作业区 3:关键道口1  4：关键道口2
 */
router.get('/geStarCameraPlayUrlFromXj', function(req, res, next) {

    if(textUtils.isEmpty(req.query.type)){
        res.send('{"code":1,"msg":"参数不全","data":""}');
        return;
    }

    let sqlStr="SELECT * FROM xinjiang_star_camera WHERE 1=1 AND TYPE='"+req.query.type+"' ORDER BY id DESC";
    console.log(sqlStr);
    dbUtils(sqlStr,function(err,vals,fields){
        //返回的结果集
        var resultStr='{"code":0,"msg":"获取成功","data":""}'
        if(err){
            resultStr='{"code":1,"msg":"'+err.message+'","data":""}'
        }else{
            resultStr='{"code":0,"msg":"获取成功","data":'+JSON.stringify(vals)+'}'
        }
        console.log('===出参==='+resultStr);
        res.send(resultStr);
    });


});

/**
 * 首页人脸识别滚动报告查询
 * @param pageSize:需要的数据量
 * @param startId:上一把数据最后一条的id
 */
router.get('/getFaceReportFromXj', function(req, res, next) {

    //获取前台传过来的数据量（要显示多少条数据）
    if(textUtils.isEmpty(req.query.pageSize) || textUtils.isEmpty(req.query.startId)){
        res.send('{"code":1,"msg":"参数不全","data":}');
        return;
    }

    let idStr='';
    for (var i=1;i<=parseInt(req.query.pageSize);i++){
        idStr=idStr+(parseInt(req.query.startId)+i)+",";
    }

    idStr="("+idStr+"0)";

    // let timeStr='2020-06-18';
    let timeStr=timeUtils.getNowTime();

    //获取当前系统时间
    let sql="";
    if(parseInt(req.query.startId)==0){
        sql="SELECT * FROM xinjiang_face_recognition_infor WHERE 1=1 AND add_time LIKE '"+timeStr+"%'  LIMIT 0,"+parseInt(req.query.pageSize);
    }else{
        sql="SELECT * FROM xinjiang_face_recognition_infor WHERE 1=1 AND add_time LIKE '"+timeStr+"%'  AND id IN "+idStr;
    }
    console.log(sql)


    dbUtils(sql,function(err,vals,fields){
        //返回的结果集
        var resultStr='{"code":0,"msg":"获取成功","data":}'
        if(err){
            resultStr='{"code":1,"msg":"'+err.message+'","data":}'
        }else{

            //条件查询结果
            resultStr='{"code":0,"msg":"获取成功","data":'+JSON.stringify(vals)+'}'
        }
        console.log('===出参==',resultStr);
        res.send(resultStr);
    });
});



/**
 * 首页车辆入场记录滚动查询
 * @param pageSize:需要的数据量
 * @param startId:上一把数据最后一条的id
 */
router.get('/getCarReportFromXj', function(req, res, next) {

    //获取前台传过来的数据量（要显示多少条数据）
    if(textUtils.isEmpty(req.query.pageSize) || textUtils.isEmpty(req.query.startId)){
        res.send('{"code":1,"msg":"参数不全","data":}');
        return;
    }

    let idStr='';
    for (var i=1;i<=parseInt(req.query.pageSize);i++){
        idStr=idStr+(parseInt(req.query.startId)+i)+",";
    }

    idStr="("+idStr+"0)";

    // let timeStr='2020-06-18';
    let timeStr=timeUtils.getNowTime();

    //获取当前系统时间
    let sql="";
    if(parseInt(req.query.startId)==0){
        sql="SELECT * FROM xinjiang_car_access_records_infor WHERE 1=1 AND add_time LIKE '"+timeStr+"%'  LIMIT 0,"+parseInt(req.query.pageSize);
    }else{
        sql="SELECT * FROM xinjiang_car_access_records_infor WHERE 1=1 AND add_time LIKE '"+timeStr+"%'  AND id IN "+idStr;
    }
    console.log(sql)


    dbUtils(sql,function(err,vals,fields){
        //返回的结果集
        var resultStr='{"code":0,"msg":"获取成功","data":}'
        if(err){
            resultStr='{"code":1,"msg":"'+err.message+'","data":}'
        }else{

            //条件查询结果
            resultStr='{"code":0,"msg":"获取成功","data":'+JSON.stringify(vals)+'}'
        }
        console.log('===出参==',resultStr);
        res.send(resultStr);
    });
});



/**
 * 首页累计发运表格提醒数据
 * @param pageSize:需要的数据量
 * @param startId:上一把数据最后一条的id
 */
router.get('/getStartHintInforFromXj', function(req, res, next) {

    //获取前台传过来的数据量（要显示多少条数据）
    if(textUtils.isEmpty(req.query.pageSize) || textUtils.isEmpty(req.query.startId)){
        res.send('{"code":1,"msg":"参数不全","data":}');
        return;
    }

    let idStr='';
    for (var i=1;i<=parseInt(req.query.pageSize);i++){
        idStr=idStr+(parseInt(req.query.startId)+i)+",";
    }

    idStr="("+idStr+"0)";

    // let timeStr='2020-06-18';
    let timeStr=timeUtils.getNowTime();

    //获取当前系统时间
    let sql="";
    if(parseInt(req.query.startId)==0){
        sql="SELECT * FROM xinjiang_star_hint_infor WHERE 1=1 AND add_time LIKE '"+timeStr+"%'  LIMIT 0,"+parseInt(req.query.pageSize);
    }else{
        sql="SELECT * FROM xinjiang_star_hint_infor WHERE 1=1 AND add_time LIKE '"+timeStr+"%'  AND id IN "+idStr;
    }
    console.log(sql)


    dbUtils(sql,function(err,vals,fields){
        //返回的结果集
        var resultStr='{"code":0,"msg":"获取成功","data":}'
        if(err){
            resultStr='{"code":1,"msg":"'+err.message+'","data":}'
        }else{

            //条件查询结果
            resultStr='{"code":0,"msg":"获取成功","data":'+JSON.stringify(vals)+'}'
        }
        console.log('===出参==',resultStr);
        res.send(resultStr);
    });
});

module.exports = router;
