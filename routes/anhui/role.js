const express = require("express");
const router = express.Router();
// Service
const roleService = require("../../src/service/RoleService");
const requestIp = require('request-ip');

/**
 * 新增角色
 */
router.put("/addRole", (req, res) => {
  let roleCode = req.body.roleCode,
    roleName = req.body.roleName,
    roleLevel = req.body.roleLevel,
    privileges = req.body.privileges,
    currentUser = req.user.userName,
    ip = requestIp.getClientIp(req);

  roleService
    .saveRole(roleCode, roleName, roleLevel, privileges, currentUser, ip)
    .then((result) => {
      res.send(result);
    });
});

/**
 * 删除角色
 */
router.delete("/deleteRole", (req, res) => {
  let roleCodes = req.body.roleCodes,
    currentUser = req.user.userName,
    ip = requestIp.getClientIp(req);
  roleService.deleteRole(roleCodes, currentUser, ip).then((result) => {
    res.send(result);
  });
});

/**
 * 分页查询角色
 */
router.get("/getRoleList", (req, res) => {
  let code = req.query.roleCode,
    name = req.query.roleName,
    level = req.query.roleLevel,
    pageNum = req.query.pageNum,
    pageSize = req.query.pageSize;
  roleService
    .pageByRole(code, name, level, pageNum, pageSize)
    .then((result) => {
      res.send(result);
    });
});

/**
 * 根据id查询角色
 */
router.get("/getRoleById", (req, res) => {
  let id = req.query.id;
  roleService.getRoleById(id).then((result) => {
    res.send(result);
  });
});

/**
 * 修改角色信息
 */
router.put("/editRole", (req, res, next) => {
  let id = req.body.id,
    roleName = req.body.roleName,
    roleLevel = req.body.roleLevel,
    privileges = req.body.privileges,
    currentUser = req.user.userName,
    ip = requestIp.getClientIp(req);
  roleService
    .updateRole(id, roleName, roleLevel, privileges, currentUser, ip)
    .then((result) => {
      res.send(result);
    });
});

/**
 * 查询全部角色
 */
router.get("/getAllRoles", (req, res) => {
  roleService.getAllRoles().then((result) => {
    res.send(result);
  });
});

/**
 * 查询角色,级别<=level
 */
router.get("/getRolesByLevel", (req, res) => {
  let level = req.query.level;
  roleService.getRolesByLevel(level).then((result) => {
    res.send(result);
  });
});

/**
 * 获取权限树接口
 */
router.get("/getPrivilegeTree", (req, res) => {
  let roleCode = req.query.roleCode;
  roleService.getPrivilegeTree(roleCode).then((result) => {
    res.send(result);
  });
});

/**
 * 根据角色code获取权限菜单
 */
router.get("/getPrivilegeByRoleCode", (req, res) => {
  let roleCode = req.query.roleCode;
  roleService.getPrivilegeByRoleCode(roleCode).then((result) => {
    res.send(result);
  });
});

module.exports = router;
