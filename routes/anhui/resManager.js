/**
 * 资源管理相关接口
 */
const express = require("express");
const router = express.Router();
// Service
const feameService = require("../../src/service/FrameService");
const nodeService = require("../../src/service/NodeService");
const roomService = require("../../src/service/RoomService");
const siteService = require("../../src/service/SiteService");
const frameService = require("../../src/service/FrameService");
const deviceService = require("../../src/service/DeviceService");
const channelService = require("../../src/service/ChannelService");

/**
 * 根据摄像头ID查询该摄像头关联的设备
 */
router.get("/getBindDeviceByChannelId", (req, res) => {
  let channelId = req.query.channelId;
  channelService.queryBindDeviceByChannelId(channelId).then((result) => {
    res.send(result);
  });
});

/**
 * 查询摄像头所属机房未被关联的设备
 */
router.get("/getUnBindDeviceByChannelId", (req, res) => {
  let channelId = req.query.channelId;
  channelService.queryUnBindDeviceByChannelId(channelId).then((result) => {
    res.send(result);
  });
});

/**
 * 根据机房ID查询该机房下未被关联的设备
 */
router.get("/getUnbindDeviceByRoomId", (req, res) => {
  let roomId = req.query.roomId;
  feameService.queryUnbindDeviceByRoomId(roomId).then((result) => {
    res.send(result);
  });
});

/**
 * 根据机架ID查询该机架关联的设备
 */
router.get("/getBindDeviceByFrameId", (req, res) => {
  let frameId = req.query.frameId;
  feameService.queryBindDeviceByFrameId(frameId).then((result) => {
    res.send(result);
  });
});

/**
 * 更新机架关联的设备
 */
router.post("/updateFrameBindDevices", (req, res) => {
  let frameId = req.body.frameId,
    addList = req.body.addList,
    delList = req.body.delList;
  feameService
    .updateFrameBindDevices(frameId, addList, delList)
    .then((result) => {
      res.send(result);
    });
});

/**
 * 更新摄像头关联的设备
 */
router.post("/updateChannelBindDevices", (req, res) => {
  let channelId = req.body.channelId,
    addList = req.body.addList,
    delList = req.body.delList;
  channelService
    .updateChannelBindDevices(channelId, addList, delList)
    .then((result) => {
      res.send(result);
    });
});

/**
 * 获取站点分页信息
 */
router.get("/getSitePagingInfo", (req, res) => {
  let params = {
    groupId: req.query.groupId, // 组ID
    userName: req.query.userName, // 用户登录名
    areaId: req.query.areaId, // 区域area_id
    subareaId: req.query.subareaId, // 子区域subarea_id
    siteId: req.query.siteId, // 站点site_id
    siteType: req.query.siteType, // 站点类型
    pageNum: req.query.pageNum, // 当前页
    pageSize: req.query.pageSize, // 每页显示数
  };
  siteService.pageBy(params).then((result) => {
    res.send(result);
  });
});

/**
 * 获取区域信息
 */
router.get("/getAreaInfo", (req, res) => {
  let groupId = req.query.groupId,
    userName = req.query.userName,
    areaCode = req.query.areaCode;
  nodeService.getAreaInfo(groupId, userName, areaCode).then((result) => {
    res.send(result);
  });
});

/**
 * 根据区域id获取子区域信息
 */
router.get("/getSubareaInfo", (req, res) => {
  let groupId = req.query.groupId,
    userName = req.query.userName,
    areaId = req.query.areaId;
  nodeService.getSubareaInfo(groupId, userName, areaId).then((result) => {
    res.send(result);
  });
});

/**
 * 根据子区域id获取站点信息
 */
router.get("/getSiteInfo", (req, res) => {
  let groupId = req.query.groupId,
    userName = req.query.userName,
    subareaId = req.query.subareaId;
  nodeService.getSiteInfo(groupId, userName, subareaId).then((result) => {
    res.send(result);
  });
});

/**
 * 获取站点类型
 */
router.get("/getSiteType", (req, res) => {
  siteService.getSiteType().then((result) => {
    res.send(result);
  });
});

/**
 * 根据局站id获取机房信息
 */
router.get("/getRoomInfo", (req, res) => {
  let groupId = req.query.groupId,
    userName = req.query.userName,
    siteId = req.query.siteId;
  nodeService.getRoomInfo(groupId, userName, siteId).then((result) => {
    res.send(result);
  });
});

/**
 * 根据机房id获取机架信息
 */
router.get("/getFrameInfo", (req, res) => {
  let groupId = req.query.groupId,
    userName = req.query.userName,
    roomId = req.query.roomId;
  nodeService.getFrameInfo(groupId, userName, roomId).then((result) => {
    res.send(result);
  });
});

/**
 * 根据机柜id获取机柜信息
 */
router.get("/getFrameInfoById", (req, res) => {
  let frameId = req.query.frameId;
  frameService.getFrameInfoById(frameId).then((result) => {
    res.send(result);
  });
});

/**
 * 获取机房等级
 */
router.get("/getRoomLevel", (req, res) => {
  let roomId = req.query.roomId;
  roomService.getRoomLevel(roomId).then((result) => {
    res.send(result);
  });
});

/**
 * 获取机房类型
 */
router.get("/getRoomType", (req, res) => {
  let roomId = req.query.roomId;
  roomService.getRoomType(roomId).then((result) => {
    res.send(result);
  });
});

/**
 * 获取机房分页信息
 */
router.get("/getRoomPagingInfo", (req, res) => {
  let params = {
    groupId: req.query.groupId, // 组ID
    userName: req.query.userName, // 用户登录名
    areaId: req.query.areaId, // 区域area_id
    subareaId: req.query.subareaId, // 子区域subarea_id
    siteId: req.query.siteId, // 站点site_id
    roomId: req.query.roomId, // 机房room_id
    roomType: req.query.roomType, // 机房类型
    roomLevel: req.query.roomLevel, // 机房等级
    pageNum: req.query.pageNum, // 当前页
    pageSize: req.query.pageSize, // 每页显示数
  };
  roomService.pageBy(params).then((result) => {
    res.send(result);
  });
});

/**
 * 获取机架分页信息
 */
router.get("/getFramePagingInfo", (req, res) => {
  let params = {
    groupId: req.query.groupId, // 组ID
    userName: req.query.userName, // 用户登录名
    areaId: req.query.areaId, // 区域area_id
    subareaId: req.query.subareaId, // 子区域subarea_id
    siteId: req.query.siteId, // 站点site_id
    roomId: req.query.roomId, // 机房room_id
    frameId: req.query.frameId, // 机架frame_id
    pageNum: req.query.pageNum, // 当前页
    pageSize: req.query.pageSize, // 每页显示数
  };
  frameService.pageBy(params).then((result) => {
    res.send(result);
  });
});

/**
 * 分页查询设备信息
 */
router.get("/getDevicePagingInfo", (req, res) => {
  let params = {
    groupId: req.query.groupId, // 组ID
    userName: req.query.userName, // 用户登录名
    areaId: req.query.areaId, // 区域area_id
    subareaId: req.query.subareaId, // 子区域subarea_id
    siteId: req.query.siteId, // 站点site_id
    roomId: req.query.roomId, // 机房room_id
    frameId: req.query.frameId, // 机架frame_id
    deviceName: req.query.deviceName, // 设备名称
    deviceCode: req.query.deviceCode, // 设备device_code
    pageNum: req.query.pageNum, // 当前页
    pageSize: req.query.pageSize, // 每页显示数
  };
  deviceService.pageBy(params).then((result) => {
    res.send(result);
  });
});

/**
 * 新增设备
 */
router.put("/addDevice", (req, res) => {
  let params = {
    roomId: req.body.roomId,
    frameId: req.body.frameId,
    deviceType: req.body.deviceType,
    deviceCode: req.body.deviceCode,
    deviceName: req.body.deviceName,
    deviceGroupName: req.body.deviceGroupName,
    deviceCompany: req.body.deviceCompany,
    deviceModel: req.body.deviceModel,
  };

  deviceService.addDevice(params).then((result) => {
    res.send(result);
  });
});

/**
 * 删除设备
 */
router.delete("/deleteDevice", (req, res) => {
  let deviceIds = req.body.deviceIds;
  deviceService.deleteDevice(deviceIds).then((result) => {
    res.send(result);
  });
});

/**
 * 修改设备
 */
router.put("/editDevice", (req, res) => {
  let params = {
    id: req.body.id,
    roomId: req.body.roomId,
    frameId: req.body.frameId,
    deviceType: req.body.deviceType,
    deviceCode: req.body.deviceCode,
    deviceName: req.body.deviceName,
    deviceGroupName: req.body.deviceGroupName,
    deviceCompany: req.body.deviceCompany,
    deviceModel: req.body.deviceModel,
  };

  deviceService.updateDevice(params).then((result) => {
    res.send(result);
  });
});

/**
 * 分页查询通道(摄像头)信息
 */
router.get("/getChannelPagingInfo", (req, res) => {
  let params = {
    groupId: req.query.groupId, // 组ID
    userName: req.query.userName, // 用户登录名
    areaId: req.query.areaId, // 区域area_id
    subareaId: req.query.subareaId, // 子区域subarea_id
    siteId: req.query.siteId, // 站点site_id
    roomId: req.query.roomId, // 机房room_id
    channelName: req.query.channelName, // 通道名称/IP
    pageNum: req.query.pageNum, // 当前页
    pageSize: req.query.pageSize, // 每页显示数
  };
  channelService.pageBy(params).then((result) => {
    res.send(result);
  });
});

/**
 * 摄像头关联机架
 */
router.post("/associationFrame", (req, res) => {
  let frameIds = req.body.frameIds,
    channelId = req.body.channelId;

  channelService.associationFrame(channelId, frameIds).then((result) => {
    res.send(result);
  });
  // if (textUtils.isEmpty(channelId) || frameIds == null) {
  //   res.send('{"code":1,"msg":"参数不全","data":}');
  //   return;
  // }
  // /*删除关系表老数据*/
  // let sql =
  //   "DELETE FROM anhui_res_frame_channel_r where channel_id='" +
  //   channelId +
  //   "';";
  // if (frameIds.length > 0) {
  //   /*添加新数据*/
  //   sql +=
  //     "INSERT INTO anhui_res_frame_channel_r (frame_id,channel_id) VALUES ";
  //   for (let i = 0; i < frameIds.length; i++) {
  //     let frameId = frameIds[i];
  //     if (i === 0) {
  //       sql += "(" + frameId + ", '" + channelId + "')";
  //     } else {
  //       sql += ",(" + frameId + ", '" + channelId + "')";
  //     }
  //   }
  // }
  // console.log(sql);

  // dbUtils(sql, function (err, vals, fields) {
  //   if (err) {
  //     res.send('{"code":1,"msg":"' + err.message + '","data":}');
  //   } else {
  //     res.send('{"code":0,"msg":"数据关联成功","data":""}');
  //   }
  // });
});

/**
 * 关联机房
 */
router.post("/associationRoom", (req, res) => {
  let list = req.body;
  roomService.associationRoom(list).then((result) => {
    res.send(result);
  });
});

/**
 * 取消关联机房
 */
// router.get("/unassociationRoom", function (req, res, next) {
//   let roomId = req.query.roomId;
//   if (textUtils.isEmpty(roomId)) {
//     res.send('{"code":1,"msg":"参数不全","data":}');
//     return;
//   }

//   let sql = "UPDATE anhui_res_room SET room_code='' WHERE room_id=" + roomId;
//   console.log(sql);
//   dbUtils(sql, function (err, vals, fields) {
//     if (err) {
//       res.send('{"code":1,"msg":"' + err.message + '","data":}');
//     } else {
//       res.set("Content-Type", "application/json");
//       res.send('{"code":0,"msg":"数据取消关联成功","data":""}');
//     }
//   });
// });

/**
 * 机架关联设备
 */
// router.get("/frameAssociationDevice", function (req, res, next) {
//   let frameId = req.query.frameId;
//   let deviceIds = req.query.deviceIds;
//   if (textUtils.isEmpty(frameId) || deviceIds == null) {
//     res.send('{"code":1,"msg":"参数不全","data":}');
//     return;
//   }
//   let deviceIdStr = "";
//   for (let i = 0; i < deviceIds.length; i++) {
//     let deviceId = deviceIds[i];
//     if (i === 0) {
//       deviceIdStr = deviceId;
//     } else {
//       deviceIdStr = deviceIdStr + "," + deviceId;
//     }
//   }

//   let sql =
//     "UPDATE anhui_res_device SET frame_id=" +
//     frameId +
//     " WHERE device_id IN (" +
//     deviceIdStr +
//     ")";
//   console.log(sql);
//   dbUtils(sql, function (err, vals, fields) {
//     if (err) {
//       res.send('{"code":1,"msg":"' + err.message + '","data":}');
//     } else {
//       res.set("Content-Type", "application/json");
//       res.send('{"code":0,"msg":"数据取消关联成功","data":""}');
//     }
//   });
// });

/**
 * 根据摄像头id查询关联的机架
 */
router.get("/getFrameListByChannelId", (req, res) => {
  let channelId = req.query.channelId;
  frameService.getFrameListByChannelId(channelId).then((result) => {
    res.send(result);
  });
  // if (textUtils.isEmpty(channelId)) {
  //   res.send('{"code":1,"msg":"参数不全","data":}');
  //   return;
  // }

  // let sql =
  //   "SELECT DISTINCT f.* FROM anhui_res_frame f,anhui_res_frame_channel_r fc WHERE fc.channel_id='" +
  //   channelId +
  //   "' AND f.frame_id=fc.frame_id";
  // console.log(sql);
  // dbUtils(sql, function (err, vals, fields) {
  //   if (err) {
  //     res.send('{"code":1,"msg":"' + err.message + '","data":}');
  //   } else {
  //     let resultStr =
  //       '{"code":0,"msg":"数据获取成功","data":' + JSON.stringify(vals) + "}";
  //     res.set("Content-Type", "application/json");
  //     res.send(resultStr);
  //   }
  // });
});

/**
 * 根据摄像头id查询所属机房下未被关联的机架
 */
router.get("/getUnbindFrameByChannelId", (req, res) => {
  let channelId = req.query.channelId;
  frameService.getUnbindFrameByChannelId(channelId).then((result) => {
    res.send(result);
  });
  // if (textUtils.isEmpty(channelId)) {
  //   res.send('{"code":1,"msg":"参数不全","data":}');
  //   return;
  // }

  // let sql =
  //   "SELECT DISTINCT f.* FROM channel c, device d, anhui_res_room r, anhui_res_frame f " +
  //   "WHERE c.channel_id = '" +
  //   channelId +
  //   "' AND c.channel_bearea = d.device_id AND d.device_parent_id = r.room_code AND r.room_id = f.room_id " +
  //   "AND f.frame_id NOT IN ( SELECT fc.frame_id FROM anhui_res_frame_channel_r fc WHERE fc.channel_id = '" +
  //   channelId +
  //   "' )";
  // console.log(sql);
  // dbUtils(sql, function (err, vals, fields) {
  //   if (err) {
  //     res.send('{"code":1,"msg":"' + err.message + '","data":}');
  //   } else {
  //     let resultStr =
  //       '{"code":0,"msg":"数据获取成功","data":' + JSON.stringify(vals) + "}";
  //     res.set("Content-Type", "application/json");
  //     res.send(resultStr);
  //   }
  // });
});

module.exports = router;
