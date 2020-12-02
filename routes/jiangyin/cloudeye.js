/**
 * 云眼组件相关api
 */
const express = require("express");
const alarmService = require("../../src/service/AlarmService");
const cloudEyeService = require("../../src/service/CloudEyeService");
const router = express.Router();

router.get("/getLivePlayUrlByType", (req, res) => {
  let type = req.query.type,
    size = req.query.size;
  cloudEyeService.getLivePlayUrlByType(type, size).then((result) => {
    res.send(result);
  });
});

/**
 * 获取标签类型
 */
router.get("/getTagTypeById", (req, res) => {
  let id = req.query.id;
  cloudEyeService.getTagType(id).then((result) => {
    res.send(result);
  });
});

/**
 * 获取所有的设备
 */
router.get("/getAllChannel", (req, res) => {
  cloudEyeService.getAllChannel().then((result) => {
    res.send(result);
  });
});

/**
 * 根据设备id获取所有的点位
 */
router.get("/getPointsByChannelId", (req, res) => {
  let channelId = req.query.camera_id,
    userId = req.query.user_id;
  cloudEyeService.getPointsByChannelId(channelId, userId).then((result) => {
    res.send(result);
  });
});

/**
 * 增加云眼的点位
 */
router.post("/addMarkPoint", (req, res) => {
  let params = {
    markName: req.body.mark_name,
    tagTypeId: req.body.tag_type_id,
    channelId: req.body.channel_id,
    markX: req.body.mark_x,
    markY: req.body.mark_y,
    description: req.body.description,
    cameraId: req.body.camera_id,
  };
  cloudEyeService.addMarkPoint(params).then((result) => {
    res.send(result);
  });
});

/**
 * 更新云眼的点位
 */
router.put("/updateMarkPoint", (req, res) => {
  let params = {
    id: req.body.id,
    markName: req.body.mark_name,
    tagTypeId: req.body.tag_type_id,
    channelId: req.body.channel_id,
    markX: req.body.mark_x,
    markY: req.body.mark_y,
    description: req.body.description,
    cameraId: req.body.camera_id,
  };
  cloudEyeService.updateMarkPoint(params).then((result) => {
    res.send(result);
  });
});

/**
 * 删除云眼的点位
 */
router.delete("/deleteMarkPoint", (req, res) => {
  let id = req.body.id;
  cloudEyeService.deleteMarkPoint(id).then((result) => {
    res.send(result);
  });
});

/**
 * 事件查询接口
 */
router.get("/searchEvent", (req, res) => {
  let name = req.query.labelOrEvent,
    channelId = req.query.channel_id,
    startTime = req.query.start_time,
    endTime = req.query.end_time;
  cloudEyeService
    .searchEvent(name, channelId, startTime, endTime)
    .then((result) => {
      res.send(result);
    });
});

/**
 * 根据事件id删除事件
 */
router.delete("/deleteEventInfoById", (req, res) => {
  let id = req.body.id;
  cloudEyeService.deleteEventInfoById(id).then((result) => {
    res.send(result);
  });
});

/**
 * 查询事件类型
 */
router.get("/getEventTypeById", (req, res) => {
  let id = req.query.id;
  cloudEyeService.getEventTypeById(id).then((result) => {
    res.send(result);
  });
});

/**
 * 新增收藏点位
 */
router.post("/addUserCollectPoint", (req, res) => {
  let userId = req.body.user_id,
    pointId = req.body.point_id;
  cloudEyeService.addUserCollectPoint(userId, pointId).then((result) => {
    res.send(result);
  });
});

/**
 * 查询收藏点位
 */
router.post("/searchUserCollectPoint", (req, res) => {
  let userId = req.body.user_id;
  cloudEyeService.searchUserCollectPoint(userId).then((result) => {
    res.send(result);
  });
});

/**
 * 删除收藏点位
 */
router.post("/removeUserCollectPoint", (req, res) => {
  let id = req.body.id;
  cloudEyeService.removeUserCollectPoint(id).then((result) => {
    res.send(result);
  });
});

/**
 * 根据类型查询告警
 */
router.get("/getAlarmByType", (req, res) => {
  let type = req.query.type,
    size = req.query.size;
  alarmService.getAlarmByType(type, size).then((result) => {
    res.send(result);
  });
});

/**
 * 查询告警类型
 */
router.get("/getAlarmType", (req, res) => {
  alarmService.getAlarmType().then((result) => {
    res.send(result);
  });
});

module.exports = router;
