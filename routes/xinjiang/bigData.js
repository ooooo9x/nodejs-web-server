/**
 * 班列大数据页面相关api
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


// /**
//  * 中欧和中亚年订单统计
//  */
// router.get('/getOrderAreaCountFromXj', function(req, res, next) {
//
//     //获取系统当前时间--年
//     let systimeYear=timeUtils.getSystimeYear();
//
//     //当年中欧订单货值统计结果
//     let sql1="SELECT SUM(goods_size) AS goodSize,SUM(goods_worth) AS goodsWorth FROM (\n" +
//         "        SELECT * FROM xinjiang_export_orders_infor WHERE  start_tim LIKE '"+systimeYear+"%' AND order_source='1' UNION ALL SELECT * FROM xinjiang_import_orders_infor WHERE  start_tim LIKE '"+systimeYear+"%' AND order_source='1'\n" +
//         "          ) AS a WHERE 1=1";
//     //当年中亚订单货值统计结果
//     let sql2="SELECT SUM(goods_size) AS goodSize,SUM(goods_worth) AS goodsWorth FROM (\n" +
//         "        SELECT * FROM xinjiang_export_orders_infor WHERE  start_tim LIKE '"+systimeYear+"%' AND order_source='2' UNION ALL SELECT * FROM xinjiang_import_orders_infor WHERE  start_tim LIKE '"+systimeYear+"%' AND order_source='2'\n" +
//         "          ) AS a WHERE 1=1";
//
//     //组装sql
//     let sql=sql1+";"+sql2
//
//     console.log(sql)
//
//
//     dbUtils(sql,function(err,vals,fields){
//         //返回的结果集
//         var resultStr='{"code":0,"msg":"获取成功","data":}'
//         if(err){
//             resultStr='{"code":1,"msg":"'+err.message+'","data":}'
//         }else{
//
//             //当年出口货值统计结果
//             let exportArry=vals[0];
//             //当年进口货值统计结果
//             let importArry=vals[1];
//
//             //最终结果
//             let resultArry=[];
//             let value="";
//             value='{"label":"中欧","type":"1","goodSize":'+exportArry[0].goodSize+',"goodsWorth":'+exportArry[0].goodsWorth+'}';
//             resultArry.push(JSON.parse(value));
//             value='{"label":"中亚","type":"2","goodSize":'+importArry[0].goodSize+',"goodsWorth":'+importArry[0].goodsWorth+'}';
//             resultArry.push(JSON.parse(value));
//             resultStr='{"code":0,"msg":"获取成功","data":'+JSON.stringify(resultArry)+'}'
//         }
//         console.log('===出参==',resultStr);
//         res.send(resultStr);
//     });
// });


/**
 * 中欧和中亚年订单统计
 */
router.get('/getOrderAreaCountFromXj', function(req, res, next) {

    //获取系统当前时间--年
    let systimeYear=timeUtils.getSystimeYear();

    //当年中欧订单货值统计结果
    let sql1="SELECT SUM(goods_size) AS goodSize,SUM(goods_worth) AS goodsWorth FROM (\n" +
        "        SELECT * FROM xinjiang_export_orders_infor WHERE  start_tim LIKE '"+systimeYear+"%' AND order_source='1' UNION ALL SELECT * FROM xinjiang_import_orders_infor WHERE  start_tim LIKE '"+systimeYear+"%' AND order_source='1'\n" +
        "          ) AS a WHERE 1=1";
    //当年中亚订单货值统计结果
    let sql2="SELECT SUM(goods_size) AS goodSize,SUM(goods_worth) AS goodsWorth FROM (\n" +
        "        SELECT * FROM xinjiang_export_orders_infor WHERE  start_tim LIKE '"+systimeYear+"%' AND order_source='2' UNION ALL SELECT * FROM xinjiang_import_orders_infor WHERE  start_tim LIKE '"+systimeYear+"%' AND order_source='2'\n" +
        "          ) AS a WHERE 1=1";

    //组装sql
    let sql=sql1+";"+sql2

    console.log(sql)


    dbUtils(sql,function(err,vals,fields){
        //返回的结果集
        var resultStr='{"code":0,"msg":"获取成功","data":}'
        if(err){
            resultStr='{"code":1,"msg":"'+err.message+'","data":}'
        }else{

            //当年出口货值统计结果
            let exportArry=vals[0];
            //当年进口货值统计结果
            let importArry=vals[1];

            //最终结果
            let resultArry=[];
            let value="";
            value='{"label":"中欧","type":"1","goodSize":'+exportArry[0].goodSize+',"goodsWorth":'+exportArry[0].goodsWorth+'}';
            resultArry.push(JSON.parse(value));
            value='{"label":"中亚","type":"2","goodSize":'+importArry[0].goodSize+',"goodsWorth":'+importArry[0].goodsWorth+'}';
            resultArry.push(JSON.parse(value));
            resultStr='{"code":0,"msg":"获取成功","data":'+JSON.stringify(resultArry)+'}'
        }
        console.log('===出参==',resultStr);
        res.send(resultStr);
    });
});




/**
 * 进出口箱量跟货值的统计统计
 */
router.get('/getGoodsWorthCountFromXj', function(req, res, next) {

    //获取系统当前时间--年
    let systimeYear=timeUtils.getSystimeYear();

    //当年出口货值统计结果
    let sql1="SELECT SUM(goods_size) AS goodSize,SUM(goods_worth) AS goodsWorth FROM xinjiang_export_orders_infor WHERE  start_tim LIKE '"+systimeYear+"%'";
    //当年进口货值统计结果
    let sql2="SELECT SUM(goods_size) AS goodSize,SUM(goods_worth) AS goodsWorth FROM xinjiang_import_orders_infor WHERE  start_tim LIKE '"+systimeYear+"%'";

    //组装sql
    let sql=sql1+";"+sql2

    console.log(sql)


    dbUtils(sql,function(err,vals,fields){
        //返回的结果集
        var resultStr='{"code":0,"msg":"获取成功","data":}'
        if(err){
            resultStr='{"code":1,"msg":"'+err.message+'","data":}'
        }else{

            //当年出口货值统计结果
            let exportArry=vals[0];
            //当年进口货值统计结果
            let importArry=vals[1];

            //最终结果
            let resultArry=[];
            let value="";
            value='{"label":"出口","type":"export","goodSize":'+exportArry[0].goodSize+',"goodsWorth":'+exportArry[0].goodsWorth+'}';
            resultArry.push(JSON.parse(value));
            value='{"label":"进口","type":"import","goodSize":'+importArry[0].goodSize+',"goodsWorth":'+importArry[0].goodsWorth+'}';
            resultArry.push(JSON.parse(value));
            resultStr='{"code":0,"msg":"获取成功","data":'+JSON.stringify(resultArry)+'}'
        }
        console.log('===出参==',resultStr);
        res.send(resultStr);
    });
});


/**
 * 累计发运货物重量统计
 */
router.get('/getGoodsWeightCountFromXj', function(req, res, next) {

    //获取系统当前时间--年
    let systimeYear=timeUtils.getSystimeYear();

    //获取系统当前时间---月
    let systimeMonth=timeUtils.getSystimeMonth();

    //查询当年往月的统计结果
    let sql1="SELECT SUM(goods_size) AS num,transport_type FROM (\n" +
        "\tSELECT * FROM xinjiang_export_orders_infor WHERE  start_tim LIKE '"+systimeYear+"%' UNION ALL SELECT * FROM xinjiang_import_orders_infor WHERE  start_tim LIKE '"+systimeYear+"%'\n" +
        "\t  ) AS a WHERE 1=1";
    //查询当月的统计结果
    let sql2="SELECT SUM(goods_size) AS num,transport_type FROM (\n" +
        "\tSELECT * FROM xinjiang_export_orders_infor WHERE  start_tim LIKE '"+systimeMonth+"%' UNION ALL SELECT * FROM xinjiang_import_orders_infor WHERE  start_tim LIKE '"+systimeMonth+"%'\n" +
        "\t  ) AS a WHERE 1=1";

    //组装sql
    let sql=sql1+";"+sql2

    console.log(sql)


    dbUtils(sql,function(err,vals,fields){
        //返回的结果集
        var resultStr='{"code":0,"msg":"获取成功","data":}'
        if(err){
            resultStr='{"code":1,"msg":"'+err.message+'","data":}'
        }else{
            //获取往月累计统计结果
            let yearArry=vals[0][0].num;
            //获取当月统计结果
            let monthArry=vals[1][0].num;
            //最终结果
            let resultArry=[];
            let value="";
            value='{"label":"当年累计发运","value":'+yearArry+'}';
            resultArry.push(JSON.parse(value));
            value='{"label":"当月累计发运","value":'+monthArry+'}';
            resultArry.push(JSON.parse(value));
            resultStr='{"code":0,"msg":"获取成功","data":'+JSON.stringify(resultArry)+'}'
        }
        console.log('===出参==',resultStr);
        res.send(resultStr);
    });
});



/**
 * 运输货物类型数量统计
 */
router.get('/getGoodsTypeCountFromXj', function(req, res, next) {

    //获取系统当前时间
    let systime=timeUtils.getNowTime();

    let sql="SELECT COUNT(*) AS num,b.goods_type_name FROM (" +
        "SELECT * FROM xinjiang_export_orders_infor UNION ALL SELECT * FROM xinjiang_import_orders_infor" +
        ")AS a INNER JOIN xinjiang_goods_type_infor AS b WHERE a.start_tim LIKE '"+systime+"%' AND a.goods_type_code=b.goods_type_code  GROUP BY a.goods_type_code";

    console.log(sql)


    dbUtils(sql,function(err,vals,fields){
        //返回的结果集
        var resultStr='{"code":0,"msg":"获取成功","data":}'
        if(err){
            resultStr='{"code":1,"msg":"'+err.message+'","data":}'
        }else{

            resultStr='{"code":0,"msg":"获取成功","data":'+JSON.stringify(vals)+'}'
        }
        console.log('===出参==',resultStr);
        res.send(resultStr);
    });
});




/**
 * 运输工具数量统计
 */
router.get('/getTransportUtilsCountFromXj', function(req, res, next) {

    //获取系统当前时间
    let systime=timeUtils.getNowTime();
   // //出口统计
   //  let exeSql="SELECT COUNT(*) AS num,transport_type FROM `xinjiang_export_orders_infor` WHERE 1=1 AND start_tim LIKE '"+systime+"%' GROUP BY transport_type";
   //  //进口统计
   //  let impotSql="SELECT COUNT(*) AS num,transport_type FROM `xinjiang_import_orders_infor` WHERE 1=1 AND start_tim LIKE '"+systime+"%' GROUP BY transport_type";

    let sql="SELECT COUNT(*) AS num,transport_type FROM (SELECT * FROM xinjiang_export_orders_infor UNION ALL SELECT * FROM xinjiang_import_orders_infor)AS a WHERE a.start_tim LIKE '"+systime+"%'  GROUP BY a.transport_type";

    console.log(sql)


    dbUtils(sql,function(err,vals,fields){
        //返回的结果集
        var resultStr='{"code":0,"msg":"获取成功","data":}'
        if(err){
            resultStr='{"code":1,"msg":"'+err.message+'","data":}'
        }else{

            //获取出口数据
            let exeArry=vals[0];
            //获取进口数据
            let impotArry=vals[1];

            //记录结果
            let resultArry=[];

            for (var i=0;i<vals.length;i++){
                let transportName="";
                switch (vals[i].transport_type) {
                    case "0":
                        transportName="汽车运输"
                        break;
                    case "1":
                        transportName="火车运输"
                        break;
                    case "2":
                        transportName="飞机运输"
                        break;
                    case "3":
                        transportName="轮船运输"
                        break;
                    case "4":
                        transportName="其他"
                        break;

                }
                let number=vals[i].num;
                let value='{"num":'+number+',"transportName":"'+transportName+'"}';
                resultArry.push(JSON.parse(value));
            }
            resultStr='{"code":0,"msg":"获取成功","data":'+JSON.stringify(resultArry)+'}'
        }
        console.log('===出参==',resultStr);
        res.send(resultStr);
    });
});




/**
 * 根据订单编号查询订单详细信息
 *  @param ordeType:要查询的订单类型   0：出口订单  1：进口订单
 *  @param ordeCode:订单编号
 */
router.get('/getOrderInforByOrderCodeFromXj', function(req, res, next) {

    //获取前台传过来的数据量（要显示多少条数据）
    if(textUtils.isEmpty(req.query.ordeCode) || textUtils.isEmpty(req.query.ordeType)){
        res.send('{"code":1,"msg":"参数不全","data":""}');
        return;
    }

    //根据订单类型动态选择要查询的表名
    let tableName="";
    if(parseInt(req.query.ordeType)==0){
        // 出口订单
        tableName="xinjiang_export_orders_infor";
    }else if(parseInt(req.query.ordeType)==1){
        // 进口订单
        tableName="xinjiang_import_orders_infor";
    }

    let sql="SELECT a.order_code,a.transport_type,a.transpor_num,b.goods_type_name,a.goods_size,a.goods_num,a.goods_worth,a.start_region,destination,a.order_source,a.start_tim,a.delive_time\n" +
        "    FROM "+tableName+" AS a,xinjiang_goods_type_infor AS b\n" +
        "    WHERE a.goods_type_code=b.goods_type_code AND a.order_code='"+req.query.ordeCode+"'";

    console.log(sql)


    dbUtils(sql,function(err,vals,fields){
        //返回的结果集
        var resultStr='{"code":0,"msg":"获取成功","data":}'
        if(err){
            resultStr='{"code":1,"msg":"'+err.message+'","data":}'
        }else{
            if(vals.length>0){
                resultStr='{"code":0,"msg":"获取成功","data":'+JSON.stringify(vals[0])+'}'
            }else{
                resultStr='{"code":0,"msg":"暂无该订单相关信息","data":""}'
            }
        }
        console.log('===出参==',resultStr);
        res.send(resultStr);
    });
});


/**
 * 地图订单列表数据查询（当日数据）
 */
router.get('/getMapOrderlistFromXj', function(req, res, next) {

    //获取系统当前时间
    let timeStr=timeUtils.getNowTime();
    //查询出口订单
    let execsql="SELECT order_code,start_region,start_region_localation,destination,destination_localation FROM xinjiang_export_orders_infor WHERE 1=1 AND start_tim LIKE '"+timeStr+"%'";
    //查询进口订单
    let impotSql="SELECT order_code,start_region,start_region_localation,destination,destination_localation FROM xinjiang_import_orders_infor WHERE 1=1 AND start_tim LIKE '"+timeStr+"%'";
    //组装sql
    let sql=execsql+";"+impotSql;

    console.log(sql)


    dbUtils(sql,function(err,vals,fields){
        //返回的结果集
        var resultStr='{"code":0,"msg":"获取成功","data":}'
        if(err){
            resultStr='{"code":1,"msg":"'+err.message+'","data":}'
        }else{
            //条件查询结果
            //获取出口订单
            let exeArry=vals[0];
            //获取进口订单
            let impotArry=vals[1];

            //组装订单数据
            let orderArry=[];

            //装入出口订单数据
            for (var i=0;i<exeArry.length;i++){
                let value='{"order_code": "'+exeArry[i].order_code+'","start_region": "'+exeArry[i].start_region+'","start_region_localation": "'+exeArry[i].start_region_localation+'","destination": "'+exeArry[i].destination+'","destination_localation": "'+exeArry[i].destination_localation+'","order_type":"0"}';
                orderArry.push(JSON.parse(value));
            }

            //装入进口订单数据
            for (var j=0;j<impotArry.length;j++){
                let value='{"order_code": "'+impotArry[j].order_code+'","start_region": "'+impotArry[j].start_region+'","start_region_localation": "'+impotArry[j].start_region_localation+'","destination": "'+impotArry[j].destination+'","destination_localation": "'+impotArry[j].destination_localation+'","order_type":"1"}';
                orderArry.push(JSON.parse(value));
            }

            //合并数据
            // exeArry.push.apply(exeArry,impotArry);

            resultStr='{"code":0,"msg":"获取成功","data":'+JSON.stringify(orderArry)+'}'
        }
        console.log('===出参==',resultStr);
        res.send(resultStr);
    });
});



/**
 * 出口订单/进口订单滚动报告
 * @param pageSize:需要的数据量
 * @param startId:上一把数据最后一条的id
 * @param type:要查询的订单类型   0：出口订单  1：进口订单
 */
router.get('/getOrderInforFromXj', function(req, res, next) {

    //获取前台传过来的数据量（要显示多少条数据）
    if(textUtils.isEmpty(req.query.pageSize) || textUtils.isEmpty(req.query.startId) || textUtils.isEmpty(req.query.type)){
        res.send('{"code":1,"msg":"参数不全","data":""}');
        return;
    }

    let idStr='';
    for (var i=1;i<=parseInt(req.query.pageSize);i++){
        idStr=idStr+(parseInt(req.query.startId)+i)+",";
    }

    idStr="("+idStr+"0)";

    //获取系统当前时间
    let timeStr=timeUtils.getNowTime();
    //根据订单类型动态选择要查询的表名
    let tableName="";
    if(parseInt(req.query.type)==0){
        // 出口订单
        tableName="xinjiang_export_orders_infor";
    }else if(parseInt(req.query.type)==1){
        // 进口订单
        tableName="xinjiang_import_orders_infor";
    }

    //获取当前系统时间
    let sql="";
    if(parseInt(req.query.startId)==0){

        sql="SELECT * FROM "+tableName+" WHERE 1=1 AND start_tim LIKE '"+timeStr+"%'  LIMIT 0,"+parseInt(req.query.pageSize);
    }else{
        sql="SELECT * FROM "+tableName+" WHERE 1=1 AND start_tim LIKE '"+timeStr+"%'  AND id IN "+idStr;
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
