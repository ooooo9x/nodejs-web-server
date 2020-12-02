/**
 * 标星播放摄像头（首页直播窗口取数据）表相关接口
 */
const express = require('express');
const router = express.Router();
// Service
const ChannelService = require('../../src/service/ChannelService');

/**
 * 查询首页中标星摄像头的直播地址
 */
router.get('/getCameraPlayUrl', (req, res) => {
  let ip = req.get("X-Real-IP") == null ? req.ip : req.get("X-Real-IP");
  ChannelService.getChannelPlayUrl(ip).then(result => {
    res.send(result);
  });
});

module.exports = router;
