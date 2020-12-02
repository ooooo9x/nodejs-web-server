/**
 * 摄像头通道相关接口
 */
const express = require("express");
const router = express.Router();
// Service
const nodeService = require("../../src/service/NodeService");
const channelService = require("../../src/service/ChannelService");

/**
 * rtmp流截图
 */
router.get("/rtmpScreenshot", (req, res) => {
  let rtmp = req.query.rtmp,
    imgName = req.query.imgName;
  channelService.rtmpScreenshot(rtmp, imgName).then((result) => {
    res.send(result);
  });
});

/**
 * 资源系统的摄像头树结构
 */
router.get("/getResCameraTree", (req, res) => {
  let params = {
    groupId: req.query.groupId, // 组ID
    userId: req.query.userId, // 用户ID
    userName: req.query.userName, // 用户登录名
    areaId: req.query.areaId, // 区域code
    subareaId: req.query.subareaId, // 子区域code
    siteId: req.query.siteId, // 站点code
    roomId: req.query.roomId, // 机房code
    frameId: req.query.frameId, // 机架code
    channelName: req.query.channelName, // 通道名称或IP
    showAll: req.query.showAll === "0", // 是否展示无摄像头的机房 true为显示
    frameName: req.query.frameName, // 机架名称
    deviceNameLike: req.query.deviceNameLike, // 设备名称(机架里的设备)
    has3d: req.query.has3d === "1",
  };
  nodeService.getResChannelTree(params).then((result) => {
    res.send(result);
  });
});

/**
 * 用户收藏的资源系统摄像头目录树
 */
router.get("/getCollectCameraTree", (req, res) => {
  let groupId = req.query.groupId,
    userName = req.query.userName,
    userId = req.query.userId;
  nodeService.getCollectCameraTree(groupId, userName, userId).then((result) => {
    res.send(result);
  });
});

/**
 * VPM系统摄像头目录树
 */
router.get("/getVpmCameraTree", (req, res) => {
  nodeService.getVpmCameraTree().then((result) => {
    res.send(result);
  });
});

/**
 * 摄像头录像率统计(首页)
 */
router.get("/getCameraVideotatisticsl", (req, res) => {
  let areaId = req.query.areaId, time = req.query.time;
  channelService.statChannelVideo(areaId, time).then((result) => {
    res.send(result);
  });
});

/**
 * 摄像头在线率统计(首页)
 */
router.get("/getCameraOnlineNumInfor", (req, res) => {
  let areaId = req.query.areaId, time = req.query.time;
  channelService.statChannelOnlineNum(areaId, time).then((result) => {
    res.send(result);
  });
});

/**
 * 摄像头各项数据统计(首页)
 */
router.get("/getCameraInforByProvinces", (req, res) => {
  let siteId = req.query.siteId,
    time = req.query.time;

  channelService.statChannelByRoomId(siteId, time).then((result) => {
    res.send(result);
  });
});

/**
 * 查询人员最新抓拍摄像头
 */
router.get("/getWorkerCurrentChannel", (req, res) => {
  let workerCode = req.query.workerCode;
  channelService.getLastChannelByWorkerCode(workerCode).then((result) => {
    res.send(result);
  });
});

/**
 * 根据开始结束时间查询通道(摄像头)上下线信息
 */
router.get("/getCameraOnlineMsg", (req, res) => {
  let startTime = req.query.startTime,
    endTime = req.query.endTime;
  channelService.getCameraOnlineMsg(startTime, endTime).then((result) => {
    res.send(result);
  });
});

/**
 * 分页查询通道(摄像头)信息,带上下线状态
 */
router.get("/getCameraState", (req, res) => {
  let params = {
    groupId: req.query.groupId, // 组ID
    userName: req.query.userName, // 用户登录名
    areaId: req.query.areaId, // 区域area_id
    subareaId: req.query.subareaId, // 子区域subarea_id
    siteId: req.query.siteId, // 站点site_id
    roomId: req.query.roomId, // 机房room_id
    channelName: req.query.channelName, // 通道(摄像头)名称
    status: req.query.status, // 状态: 0下线, 1上线
    startTime: req.query.startTime, // 开始时间
    endTime: req.query.endTime, // 结束时间
    pageNum: req.query.pageNum, // 当前页
    pageSize: req.query.pageSize, // 每页显示数
  };
  channelService.cameraStatePageBy(params).then((result) => {
    res.send(result);
  });
});

module.exports = router;
