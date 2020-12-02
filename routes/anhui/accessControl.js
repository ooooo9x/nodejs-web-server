const express = require("express");
const router = express.Router();
// Service
const accessControlService = require("../../src/service/AccessControlService");
const nodeService = require("../../src/service/NodeService");

/**
 * 查询门禁记录
 */
router.get("/getCreditCardRecord", (req, res) => {
  let devid = req.query.devid,
    startTime = req.query.startTime,
    endTime = req.query.endTime;
  accessControlService
    .getCreditCardRecord(devid, startTime, endTime)
    .then((result) => {
      res.send(result);
    });
});

/**
 * 根据机房ID查询门禁
 */
router.get("/getAccessControl", (req, res) => {
  let roomId = req.query.roomId;
  accessControlService.getAccessByRoomId(roomId).then((result) => {
    res.send(result);
  });
});

/**
 * 大屏滚动门禁记录
 */
router.get("/getOpendoorRec", (req, res) => {
  accessControlService.getOpendoorRec().then((result) => {
    res.send(result);
  });
});

/**
 * 门禁树
 */
router.get("/getTree", (req, res) => {
  let groupId = req.query.groupId,
    userName = req.query.userName;
  nodeService.getResAccessTree(groupId, userName).then((result) => {
    res.send(result);
  });
});

router.post('/saveAccessChannelRel', (req, res, next) => {
  let accessId = req.body.accessId;
  let channelIds = req.body.channelIds;
  accessControlService.saveAccessChannelRel(accessId,channelIds).then(result => {
    res.send(result);
  });
});

router.get('/getChannelIdByAccessId', (req, res, next) => {
  let accessId = req.query.accessId;
  accessControlService.getChannelIdByAccessId(accessId).then(result => {
    res.send(result);
  });
});

module.exports = router;
