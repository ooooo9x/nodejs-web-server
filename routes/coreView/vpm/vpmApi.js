/**
 * 机房相关接口
 */

//引入debug打印日志
var debug = require('debug')('com.sihua.bigv.nodeserver:app');
//请求工具
var request = require('request');
var express = require('express');

var router = express.Router();
//引入数据库操作工具
var dbUtils=require("../../../src/utils/MySqlDbUtils");
//引入文本工具类
var textUtils=require("../../../src/utils/textUtils");
//引入时间工具
var timeUtils=require("../../../src/utils/timeUtils");

//引入常量类
var config=require("../../../config/config");


//要执行的sql
var sqlStr="";



/**
 * 获取通道回看记录
 *
 * @param  startTime:开始时间（秒级时间戳）
 * @param  endTime：结束时间（秒级时间戳）
 * @param channelCode://通道code（摄像头编码）
 *
 */
router.get('/getChannelHlsList', function(req, res, next) {

  //返回的结果集
  var resultStr='{"code":0,"msg":"获取成功","data":}'
  //获取开始时间
  let startTime=req.query.startTime;
  //获取结束时间
  let endTime=req.query.endTime
  //通道code（摄像头编码）
  let channelCode=req.query.channelCode

  if(textUtils.isEmpty(startTime) || textUtils.isEmpty(endTime) || textUtils.isEmpty(channelCode)){
    resultStr='{"code":1,"msg":"参数不全","data":}'
    res.send(resultStr);
  }else{
    let url=config.service_Path+'vpm/vodInfo/'+channelCode+'/'+startTime+'/'+endTime;
    console.log(url);
    request(url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log(body)
        console.info(response.body);
        //解析数据
        let obj=JSON.parse(response.body);

        resultStr='{"code":0,"msg":"'+obj.message+'","data":'+JSON.stringify(obj.data)+'}';
        console.log('===出参===',resultStr);
      }else{
        resultStr='{"code":1,"msg":"数据获取失败","data":}'
      }
      res.send(resultStr);
    })
  }
});


/**
 * 获取通道下文件的回看地址
 *
 * @param  startTime:开始时间秒级时间戳
 * @param  endTime：结束时间，秒级时间戳
 * @param channelCode://通道code（摄像头编码）
 *
 */
router.get('/getChannelHlsPath', function(req, res, next) {

  //返回的结果集
  var resultStr='{"code":0,"msg":"获取成功","data":}'
  //获取开始时间
  let startTime=req.query.startTime;
  //获取结束时间
  let endTime=req.query.endTime
  //通道code（摄像头编码）
  let channelCode=req.query.channelCode

  //读取回看流切片的速度
  let yunyan_channel_address_mode=config.yunyan_channel_address_mode;

  if(textUtils.isEmpty(startTime) || textUtils.isEmpty(endTime) || textUtils.isEmpty(channelCode)){
    resultStr='{"code":1,"msg":"参数不全","data":}'
    res.send(resultStr);
  }else{
    if(yunyan_channel_address_mode==='native'){
      console.log('本地查询回看流地址模式');
      //组装sql
      let sql="select * from xinjiang_channel_address  where channel_id = '"+channelCode+"'" ;
      console.log(sql);

      dbUtils(sql,function(err,vals,fields){
        //返回的结果集
        var resultStr='{"code":0,"msg":"获取成功","data":}'
        if(err){
          resultStr='{"code":1,"msg":"'+err.message+'","data":""}'
        }else{
          resultStr='{"code":0,"msg":"获取成功","data":'+JSON.stringify(vals)+'}'
        }
        console.log('===出参==='+resultStr);
        res.send(resultStr);
      });
    }
    else {
      let url=config.service_Path+'vpm/vodPlayUrl/'+channelCode+'/'+startTime+'/'+endTime+'/hls/0';
      console.log(url);
      request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log(body)
          console.info(response.body);
          //解析数据
          let obj=JSON.parse(response.body);

          resultStr='{"code":0,"msg":"'+obj.message+'","data":'+JSON.stringify(obj.data)+'}';
          console.log('===出参===',resultStr);
        }else{
          resultStr='{"code":1,"msg":"回看地址获取失败","data":}'
        }
        res.send(resultStr);
      })
    }

  }
});


/**
 * 获取摄像头下的直播地址
 *
 * @param channelCode://通道code（摄像头编码）
 *
 */
router.get('/getChannelRtmpPath', function(req, res, next) {

  //返回的结果集
  var resultStr='{"code":0,"msg":"获取成功","data":}'
  //获取开始时间
  let startTime=req.query.startTime;
  //获取结束时间
  let endTime=req.query.endTime
  //通道code（摄像头编码）
  let channelCode=req.query.channelCode

  if(textUtils.isEmpty(channelCode)){
    resultStr='{"code":1,"msg":"参数不全","data":}'
    res.send(resultStr);
  }else{
    let url=config.service_Path+'vpm/liveStream/'+channelCode+'/rtmp/0';
    console.log(url);
    request(url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log(body)
        console.info(response.body);
        //解析数据
        let obj=JSON.parse(response.body);

        resultStr='{"code":0,"msg":"'+obj.message+'","data":'+JSON.stringify(obj.data)+'}';
        console.log('===出参===',resultStr);
      }else{
        resultStr='{"code":1,"msg":"回看地址获取失败","data":}'
      }
      res.send(resultStr);
    })
  }
});



/**
 * 查询电子地图首页中的机房树结构
 *
 * @param  provinces:省份编码
 */
router.get('/getCpRoomTree', function(req, res, next) {


  //查询机房所有级别区域数据的sql
  let sqlCpRoom="SELECT DEVICE_ID ,NAME AS label,LEVEL,PARENT_ID FROM i_area WHERE 1=1";
  //获取省份数据
  if(!textUtils.isEmpty(req.query.provinces)){
    sqlCpRoom= sqlCpRoom+" AND ( code_id LIKE '"+parseInt(req.query.provinces)+"%' OR code_id=1)";
  }
  console.log(sqlCpRoom);

  dbUtils(sqlCpRoom,function(err,vals,fields){
    //返回的结果集
    var resultStr='{"code":0,"msg":"获取成功","data":}'
    if(err){
      resultStr='{"code":1,"msg":"'+err.message+'","data":}'
    }else{
      //接收所有的目录层级数据
      let list=vals;

      var rJson = [];

      //将所有的pid的数据加到对应的id数据对象里面去，需要添加一个属性children
      for(var i=0;i<list.length;i++){

        var arr = [];

        for(var j=0;j<list.length;j++){


          if(list[i].DEVICE_ID == list[j].PARENT_ID){

            list[i].children = arr;

            arr.push(list[j]);

          }
        }
      }

      for(var i=0;i<list.length;i++){

        if(list[i].PARENT_ID == 0){

          rJson.push(list[i]);
        }

      }

      let treeArry=[];
      for (var i=0;i<rJson.length;i++){
        if(!config.cproom_tree_is_show_other_data && parseInt(rJson[i].label.indexOf('VPM'))>=0){
        }else{
          treeArry.push(rJson[i]);
        }
      }


      resultStr='{"code":0,"msg":"获取成功","data":'+JSON.stringify(treeArry)+'}'
    }
    console.log('===出参===',resultStr);
    res.send(resultStr);
  });

});



/**
 * 视频监控，查询摄像头树结构
 *
 */
router.get('/getCameraInforByTree', function(req, res, next) {

  //获取区域数据
  let sql1='select DEVICE_ID,NAME,PARENT_ID,LEVEL from i_area';

  //获取跟机房关联的设备数据
  let sql5='SELECT a.device_name,a.device_id,a.device_parent_id FROM device AS a,i_area AS b WHERE a.device_parent_id=b.DEVICE_ID AND b.LEVEL=4';
  //查询所有跟设备关联的通道数据
  let sql6='SELECT a.channel_id,a.channel_name,a.channel_bearea,a.stream_online FROM channel AS a,device AS b WHERE a.channel_bearea=b.device_id';



  //组装多sql
  var sql=sql1+";"+sql5+";"+sql6;
  console.log(sql)

  dbUtils(sql,function(err,vals,fields){
    var resultStr='{"code":0,"msg":"获取成功","data":}'
    //返回的结果集
    if(err){
      resultStr='{"code":1,"msg":"数据获取异常:'+err.message+'","data":}'
    }else{

      //获取区域一级数据
      let areaArry=vals[0];
      //设备数据
      let devicesArry=vals[1];
      //通道数据
      let channelArry=vals[2];

      let list=[];

      //组装的对象
      let value="";
      // 记录组装区域
      for(var a=0;a<areaArry.length;a++){
        value='{"code":"'+areaArry[a].DEVICE_ID+'","label":"'+areaArry[a].NAME+'","PARENT_ID":"'+areaArry[a].PARENT_ID+'","LEVEL":'+areaArry[a].LEVEL+',"online":""}';
        list.push(JSON.parse(value));
      }

      //把设备数也组装进去
      for(var b=0;b<devicesArry.length;b++){
        value='{"code":"'+devicesArry[b].device_id+'","label":"'+devicesArry[b].device_name+'","PARENT_ID":"'+devicesArry[b].device_parent_id+'","LEVEL":5,"online":""}';
        list.push(JSON.parse(value));
      }

      //把通道数据也组装进去
      for(var c=0;c<channelArry.length;c++){
        value='{"code":"'+channelArry[c].channel_id+'","label":"'+channelArry[c].channel_name+'","PARENT_ID":"'+channelArry[c].channel_bearea+'","LEVEL":6,"online":"'+channelArry[c].stream_online+'"}';
        // console.log(value)
        list.push(JSON.parse(value));
      }

      var rJson = [];

      //将所有的pid的数据加到对应的id数据对象里面去，需要添加一个属性children
      for(var i=0;i<list.length;i++){

        var arr = [];

        for(var j=0;j<list.length;j++){

          if(list[i].LEVEL!=6 && list[i].code == list[j].PARENT_ID){

            list[i].children = arr;

            arr.push(list[j]);
          }
        }
      }

      for(var i=0;i<list.length;i++){

        console.log(i+"======"+list[i].PARENT_ID)

        if(list[i].PARENT_ID == 0){

          rJson.push(list[i]);

        }

      }

      let treeArry=[];
      for (var i=0;i<rJson.length;i++){
        if(!config.camera_tree_is_show_other_data && parseInt(rJson[i].label.indexOf('VPM'))>=0){
        }else{
          treeArry.push(rJson[i]);
        }
      }


      resultStr='{"code":0,"msg":"获取成功","data":'+JSON.stringify(treeArry)+'}'

    }
    console.log("===出参===",resultStr);
    res.send(resultStr);
  });

});



module.exports = router;
