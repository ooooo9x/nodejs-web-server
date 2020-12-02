/**
 * 电子地图表相关接口
 */
const express = require("express");
const router = express.Router();
// Service
const nodeService = require("../../src/service/NodeService");
const channelService = require("../../src/service/ChannelService");
const workerService = require("../../src/service/WorkerService");

/**
 * 获取当前机房下的所有人员信息及当前位置信息
 */
router.get("/getAllUserInforByRoomCode", (req, res) => {
  let roomId = req.query.cproomCode;
  workerService.getAllUserInforByRoomCode(roomId).then((result) => {
    res.send(result);
  });
});

/**
 * 获取用户的历史移动轨迹(包括虚拟点位,用于3d机房人员移动)<已弃用>
 */
router.get("/getWorkerHistoryMoveLocalInfor", (req, res) => {
  let workerCode = req.query.workerCode,
    roomId = req.query.cproomCode;
  workerService
    .getWorkerHistoryMoveLocalInfor(roomId, workerCode)
    .then((result) => {
      res.send(result);
    });
});

/**
 * 获取用户的历史移动轨迹(包括虚拟点位,用于2d)
 */
router.get("/getWorkerHistoryTrajectory", (req, res) => {
  let workerCode = req.query.workerCode,
    roomId = req.query.roomCode,
    startTime = req.query.startTime,
    endTime = req.query.endTime;

  workerService
    .getWorkerHistoryTrajectory(roomId, workerCode, startTime, endTime)
    .then((result) => {
      res.send(result);
    });
});

/**
 * 获取用户的当前位置
 */
router.get("/getWorkerNowLocalInfor", (req, res) => {
  let roomId = req.query.cproomCode,
    workerCode = req.query.workerCode,
    time = req.query.time;

  workerService
    .getWorkerNowLocalInfor(roomId, workerCode, time)
    .then((result) => {
      res.send(result);
    });
});

/**
 * 根据员工工号获取员工信息
 */
router.get("/getWorkerInfor", (req, res) => {
  let code = req.query.workerCode;
  workerService.getWorkerByCode(code).then((result) => {
    res.send(result);
  });
});

/**
 * 获取机房的摄像头信息
 */
router.get("/getChannelInforBycproomCode", (req, res) => {
  let roomId = req.query.roomId,
    is3d = req.query.is3d === '1';
  channelService.getChannelInforByRoomId(roomId, is3d).then((result) => {
    res.send(result);
  });
});

/**
 * 获取资源系统的机房目录树
 */
router.get("/getResTree", (req, res) => {
  let groupId = req.query.groupId,
    userName = req.query.userName,
    have3d = req.query.have3d === "1";
  nodeService.getResRoomTree(groupId, userName, have3d).then((result) => {
    res.send(result);
  });
});

module.exports = router;
