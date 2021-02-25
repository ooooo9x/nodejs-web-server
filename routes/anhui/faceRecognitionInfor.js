/**
 * 人脸识别结果相关接口
 */
const express = require("express");
const router = express.Router();
// Service
const workerService = require("../../src/service/WorkerService");

/**
 * 人脸识别结果查询（人脸头像）
 * @param pageSize:需要的数据量
 * @param startId:上一把数据最后一条的id
 */
router.get("/getFaceRecUserImg", (req, res) => {
  // let ip = req.get("X-Real-IP") == null ? req.ip : req.get("X-Real-IP"),
  //   startId = req.query.startId,
  //   pageSize = req.query.pageSize;
  // workerService.getFaceRecUserImg(startId, pageSize, ip).then((result) => {
  //   res.send(result);
  // });
  let ip = req.get("X-Real-IP") == null ? req.ip : req.get("X-Real-IP"),
    pageSize = req.query.pageSize;
  workerService.getFaceRecUserImg1(pageSize, ip).then((result) => {
    res.send(result);
  });
});

/**
 * 查询当日各地区机房人脸识别数
 */
router.get("/getFaceRecSum", (req, res) => {
  workerService.getFaceRecSum().then((result) => {
    res.send(result);
  });
});

module.exports = router;
