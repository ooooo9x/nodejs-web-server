const express = require("express");
const router = express.Router();
// Service
const groupService = require("../../src/service/GroupService");

/**
 * 新增组
 */
router.put("/addGroup", (req, res, next) => {
  let name = req.body.name,
    nodes = req.body.node,
    parentId = req.body.parentId;
  groupService.save(name, parentId, nodes).then((result) => {
    res.send(result);
  });
});

/**
 * 更新组
 */
router.put("/updateGroup", (req, res, next) => {
  let id = req.body.id,
    name = req.body.name,
    node = req.body.node;
  groupService.update(id, name, node).then((result) => {
    res.send(result);
  });
});

/**
 * 查询所有组
 */
router.get("/searchAll", (req, res) => {
  let id = req.query.groupId;
  groupService.query(id).then((result) => {
    res.send(result);
  });
});

/**
 * 分页查询组
 */
router.get("/pageBy", (req, res) => {
  let name = req.query.name,
    pageNum = req.query.pageNum,
    pageSize = req.query.pageSize,
    parentId = req.query.parentId,
    userName = req.query.userName;
  groupService.pageByGroup(name, parentId, userName, pageNum, pageSize).then((result) => {
    res.send(result);
  });
});

/**
 * 根据组ID查询组详情
 */
router.get("/searchGroupById/:id", (req, res) => {
  let id = req.params.id;
  groupService.queryGroupById(id).then((result) => {
    res.send(result);
  });
});

/**
 * 删除组
 */
router.delete("/removeGroupByIds", (req, res) => {
  let ids = req.body.ids;
  groupService.deleteGroupByIds(ids).then((result) => {
    res.send(result);
  });
});

module.exports = router;
