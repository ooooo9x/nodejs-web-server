/**
 * 告警信息表相关接口
 */
const express = require("express");
const router = express.Router();
//引入文本工具类
const textUtils = require("../../src/utils/textUtils");
// Service
const alarmService = require("../../src/service/AlarmService");

/**
 * 查询告警类型
 */
router.get("/getAlarmTypeAllInfor", (req, res) => {
  alarmService.getAlarmType().then((result) => {
    res.send(result);
  });
});

/**
 * 查询告警级别
 */
router.get("/getAlarmLevel", (req, res) => {
  alarmService.getAlarmLevel().then((result) => {
    res.send(result);
  });
});

/**
 * 查询告警信息(首页)
 */
router.get("/getAlarmInforFromIndex", (req, res) => {
  let startId = req.query.startId,
    pageSize = req.query.pageSize;
  alarmService.getAlarmByStartId(startId, pageSize).then((result) => {
    res.send(result);
  });
});

/**
 * 分页查询告警信息
 */
router.get("/getAlarmInforBySeach", (req, res) => {
  let params = {
    groupId: req.query.groupId,
    userName: req.query.userName,
    roomId: req.query.roomCode,
    alarmType: req.query.alarmType,
    dealState: req.query.dealState,
    alarmNature: req.query.alarmNature,
    channelCode: req.query.channelCode,
    startTime: req.query.startTime,
    endeTime: req.query.endeTime,
    pageNum: req.query.pageNum,
    pageSize: req.query.pageSize,
  };
  alarmService.pageByAlarm(params).then((result) => {
    res.send(result);
  });
});

/**
 * 手动处理告警
 */
router.put("/handleAlarmMsg", (req, res) => {
  let id = req.body.id;
  alarmService.handleAlarm(id).then((result) => {
    res.send(result);
  });
});

/**
 * 分页查询告警策略
 */
router.get("/getAlarmPolicyPagingInfo", (req, res) => {
  let code = req.query.policyCode,
    name = req.query.policyName,
    groupId = req.query.groupId,
    userName = req.query.userName,
    pageNum = req.query.pageNum,
    pageSize = req.query.pageSize;
  alarmService
    .pageByAlarmPolicy(code, name, groupId, userName, pageNum, pageSize)
    .then((result) => {
      res.send(result);
    });
});

/**
 * 告警策略删除
 */
router.delete("/deleteAlarmPolicies", (req, res) => {
  let policyCodes = req.body.policyCodes;
  alarmService.deleteAlarmPolicies(policyCodes).then((result) => {
    res.send(result);
  });
});

/**
 * 根据id查询告警策略
 */
router.get("/getAlarmPolicyById", (req, res) => {
  let id = req.query.id,
    code = req.query.policyCode;
  alarmService.getAlarmPolicyById(id, code).then((result) => {
    res.send(result);
  });
});

/**
 * 新增告警策略
 */
router.put("/addAlarmPolicy", function (req, res, next) {
  let params = {
    userId: req.body.userId,
    code: req.body.policyCode,
    name: req.body.policyName,
    type: req.body.policyType,
    alarmType: req.body.alarmType,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    channelIds: req.body.channelIds,
    desc: textUtils.isEmpty(req.body.desc) ? "" : req.body.desc,
  };
  alarmService.saveAlarmPolicy(params).then((result) => {
    res.send(result);
  });
});

/**
 * 修改告警策略
 */
router.put("/editAlarmPolicy", (req, res) => {
  let params = {
    userId: req.body.userId,
    code: req.body.policyCode,
    name: req.body.policyName,
    type: req.body.policyType,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    channelIds: req.body.channelIds,
    desc: textUtils.isEmpty(req.body.desc) ? "" : req.body.desc,
  };
  alarmService.updateAlarmPolicy(params).then((result) => {
    res.send(result);
  });
});

/**
 * 获取告警策略类型列表
 */
router.get("/getAlarmPolicyType", (req, res) => {
  alarmService.getAlarmPolicyType().then((result) => {
    res.send(result);
  });
});
module.exports = router;
