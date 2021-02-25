var createError = require("http-errors");
var express = require("express");
var session = require("express-session");
var path = require("path");
var cookieParser = require("cookie-parser");
var Response = require("./src/utils/Response");

var usersRouter = require("./routes/anhui/users");
//引入人脸识别记录操作js
var faceRecognitionInforRouter = require("./routes/anhui/faceRecognitionInfor");
//引入标星播放摄像头（首页直播窗口取数据
var starCameraRouter = require("./routes/anhui/starCamera");
//引入告警记录信息操作js
var alarmInforRouter = require("./routes/anhui/alarmInfor");
//引入摄像头数据操作js
var cameraRouter = require("./routes/anhui/camera");
//引入机房数据操作js
var cpRoomRouter = require("./routes/anhui/cpRoom");
//引入电子地图数据操作js
var electronicMapRouter = require("./routes/anhui/electronicMap");
//引入角色数据操作js
var roleRouter = require("./routes/anhui/role");
//引入资源管理数据操作js
var resManagerRouter = require("./routes/anhui/resManager");
//组
var groupRouter = require("./routes/anhui/group");
//门禁
var accessc = require("./routes/anhui/accessControl");

//vpm公共组件js
var vpmApiRouter = require("./routes/coreView/vpm/vpmApi");

//新疆项目接口操作类的引入
//新疆首页api
// var xjIndexRouter = require('./routes/xinjiang/index');
// //新疆班列大数据页面相关api
// var xjbigDataRouter = require('./routes/xinjiang/bigData');
// //云眼组件相关api
// var xjYunyanRouter = require('./routes/xinjiang/yunyan');

// 云眼接口
var cloudeye = require("./routes/jiangyin/cloudeye");

var app = express();

// token鉴权
var authToken = require("./src/utils/Auth");
app.use(authToken);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "secret", // 对session id 相关的cookie 进行签名
    resave: true,
    saveUninitialized: false, // 是否保存未初始化的会话
    cookie: {
      maxAge: 1000 * 60 * 3, // 设置 session 的有效时间，单位毫秒
    },
  })
);

app.use(function (req, res, next) {
  res.set("Content-Type", "application/json;charset=utf-8");
  next();
});

app.use("/users", usersRouter);
//初始化人脸识别记录管理接口类
app.use("/faceRec", faceRecognitionInforRouter);
//初始化标星播放摄像头（首页直播窗口取数据）
app.use("/starCamera", starCameraRouter);
//初始化告警信息接口操作类
app.use("/alarm", alarmInforRouter);
//初始化摄像头信息接口操作类
app.use("/camera", cameraRouter);
//初始化机房信息接口操作类
app.use("/cproom", cpRoomRouter);
//初始化电子地图信息接口操作类
app.use("/map", electronicMapRouter);
//初始化角色息接口操作类
app.use("/role", roleRouter);
//初始化资源管理接口操作类
app.use("/resManager", resManagerRouter);
app.use("/group", groupRouter);

app.use("/accessc", accessc);

//初vpm公共组件js
app.use("/vpmApi", vpmApiRouter);

// //新疆项目接口操作类的引入
// app.use('/xjIndex', xjIndexRouter);
// //新疆项目班列大数据操作类的引入
// app.use('/xjBigData', xjbigDataRouter);
// //新疆项目班列大数据操作类的引入
// app.use('/xjYunyan', xjYunyanRouter);

//初始化数据库
// app.use('/initdb', usersRouter);

app.use("/cloudeye", cloudeye);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(200).send(new Response(401, "token验证失败"));
  } else {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
  }
});

module.exports = app;
