/**
 * 机房相关接口
 */
const express = require("express");
const router = express.Router();
// Service
const roomService = require("../../src/service/RoomService");
const channelService = require("../../src/service/ChannelService");
const workerService = require("../../src/service/WorkerService");

/**
 * 人脸识别获取接口
 */
router.get("/getFaceRecord", (req, res, next) => {
  let params = {
    startTime: req.query.startTime,
    endTime: req.query.endTime,
    roomCode: req.query.roomCode,
    workerCode: req.query.workerCode,
    channelId: req.query.channelId,
    online: req.query.online,
    pageNum: req.query.pageNum,
    pageSize: req.query.pageSize,
    areaId: req.query.areaId,
    subareaId: req.query.subareaId,
    siteId: req.query.siteId,
    ip: req.get("X-Real-IP") == null ? req.ip : req.get("X-Real-IP"),
    userName: req.query.userName,
    groupId: req.query.groupId,
  };

  roomService.getFaceRecord(params).then((result) => {
    res.send(result);
  });
});

/**
 * 查询摄像头(通道)回看列表
 */
router.get("/getChannelHlsList", (req, res) => {
  let channelCode = req.query.channelCode,
    startTime = req.query.startTime,
    endTime = req.query.endTime;
  channelService
    .getChannelHlsList(channelCode, startTime, endTime)
    .then((result) => {
      res.send(result);
    });
});

/**
 * 查询摄像头回看地址
 */
router.get("/getChannelHlsPath", (req, res) => {
  let startTime = req.query.startTime,
    endTime = req.query.endTime,
    channelCode = req.query.channelCode,
    ip = req.get("X-Real-IP") == null ? req.ip : req.get("X-Real-IP");

  channelService
    .getChannelHlsPath(channelCode, startTime, endTime, ip)
    .then((result) => {
      res.send(result);
    });
});

/**
 * 获取摄像头下的直播地址
 */
router.get("/getChannelRtmpPath", (req, res) => {
  let channelCode = req.query.channelCode,
    ip = req.get("X-Real-IP") == null ? req.ip : req.get("X-Real-IP");
  channelService.getChannelRtmpPath(channelCode, ip).then((result) => {
    res.send(result);
  });
});

/**
 * 查询人员历史轨迹抓拍列表
 */
router.get("/getWorkerHistoricalTrackList", (req, res) => {
  let startTime = req.query.startTime,
    endTime = req.query.endTime,
    workerCode = req.query.workerCode,
    roomId = req.query.roomCode;
  workerService
    .getWorkerHistoricalTrackList(roomId, workerCode, startTime, endTime)
    .then((result) => {
      res.send(result);
    });
});

module.exports = router;
