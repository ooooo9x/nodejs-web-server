const express = require("express");
const router = express.Router();
const operateLogService = require("../../src/service/OperateLogService");
// Service
const userService = require("../../src/service/UserService");
const requestIp = require('request-ip');

/**
 * 用户登录
 */
router.post("/userLogin", (req, res) => {
  let userName = req.body.userName,
    password = req.body.pwd;
  userService.login(userName, password).then((result) => {
    res.send(result);
  });
});

/**
 * 查询用户绑定的组
 */
router.get("/searchGroupsByUserName", (req, res) => {
  let userName = req.query.userName,
    type = req.query.type;
  userService.searchGroupsByUserName(userName, type).then((result) => {
    res.send(result);
  });
});

/**
 * 批量删除用户
 */
router.delete("/deleteUser", (req, res) => {
  let ids = req.body.ids,
    currentUser = req.user.userName,
    ip = requestIp.getClientIp(req);
  userService.deleteUserByIds(ids, currentUser, ip).then((result) => {
    res.send(result);
  });
});

/**
 * 修改用户信息
 */
router.put("/editUser", (req, res) => {
  let id = req.body.id,
    cnName = req.body.cnName,
    roleCode = req.body.roleCode,
    groupId = req.body.groupId,
    currentUser = req.user.userName,
    ip = requestIp.getClientIp(req);
  userService
    .updateUser(id, cnName, roleCode, groupId, currentUser, ip)
    .then((result) => {
      res.send(result);
    });
});

/**
 * 新增用户
 */
router.put("/addUser", (req, res) => {
  let userName = req.body.userName,
    cnName = req.body.cnName,
    pwd = req.body.pwd,
    roleCode = req.body.roleCode,
    groupId = req.body.groupId,
    currentUser = req.user.userName,
    ip = requestIp.getClientIp(req);
  userService
    .save(userName, cnName, pwd, roleCode, groupId, currentUser, ip)
    .then((result) => {
      res.send(result);
    });
});

/**
 * 分页查询用户数据
 */
router.get("/getUserList", (req, res) => {
  let groupId = req.query.groupId,
    currentUser = req.query.currentUser,
    loginName = req.query.loginName,
    userName = req.query.userName,
    pageSize = req.query.pageSize,
    pageNum = req.query.pageNum,
    isAllGroup = req.query.isAllGroup === "true";
  userService
    .queryUserByGroupId(
      groupId,
      currentUser,
      loginName,
      userName,
      isAllGroup,
      pageSize,
      pageNum
    )
    .then((result) => {
      res.send(result);
    });
});

/**
 * 解密密文密码(用户忘记密码时,调用该接口)
 */
router.get("/decryptByDES", (req, res) => {
  let password = req.query.password,
    desKey = req.query.desKey;
  res.send(userService.decryptByDES(password, desKey));
});

/**
 * 收藏
 */
router.post("/collect", (req, res) => {
  let userId = req.body.userId,
    areaId = req.body.area,
    subareaId = req.body.subarea,
    siteId = req.body.site,
    roomCode = req.body.room,
    channelIds = req.body.channelIds,
    groupId = req.body.groupId;
  userService
    .addCollect(
      userId,
      areaId,
      subareaId,
      siteId,
      roomCode,
      channelIds,
      groupId
    )
    .then((result) => {
      res.send(result);
    });
});

/**
 * 取消收藏
 */
router.post("/unCollect", (req, res) => {
  let userId = req.body.userId,
    areaId = req.body.area,
    subareaId = req.body.subarea,
    siteId = req.body.site,
    roomCode = req.body.room,
    channelIds = req.body.channelIds,
    groupId = req.body.groupId;
  userService
    .removeCollect(
      userId,
      areaId,
      subareaId,
      siteId,
      roomCode,
      channelIds,
      groupId
    )
    .then((result) => {
      res.send(result);
    });
});

/**
 * 根据id查询用户
 */
router.get("/getUserById", (req, res) => {
  let id = req.query.id;
  userService.getUserById(id).then((result) => {
    res.send(result);
  });
});

/**
 * 重置用户的密码
 */
router.post("/changePwd", (req, res) => {
  let userName = req.body.userName,
    pwd = req.body.pwd,
    currentUser = req.user.userName,
    ip = requestIp.getClientIp(req);

  userService
    .changePwdByUserName(userName, pwd, currentUser, ip)
    .then((result) => {
      res.send(result);
    });
});

/**
 * 生成验证码
 */
router.get("/createCaptcha", (req, res) => {
  let { text, data } = userService.getCaptcha();
  // session 存储
  req.session.captcha = text;
  // 响应的类型
  res.type("svg");
  res.send(data);
});

/**
 * 校验验证码
 */
router.get("/checkCaptcha", (req, res) => {
  let text = req.query.text,
    captcha = req.session.captcha;
  let result = userService.checkCaptcha(text, captcha);
  res.send(result);
});

/**
 * 分页查询操作日志
 */
router.get("/searchOperateLog", (req, res) => {
  let params = {
    userName: req.query.userName,
    ip: req.query.ip,
    startTime: req.query.startTime,
    endTime: req.query.endTime,
    pageSize: req.query.pageSize,
    pageNum: req.query.pageNum,
  };
  operateLogService.pageByOperateLog(params).then((result) => {
    res.send(result);
  });
});

module.exports = router;
