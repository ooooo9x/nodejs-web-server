const expressJwt = require("express-jwt");
const { des_key } = require("../../config/config");

module.exports = expressJwt({ secret: des_key, algorithms: ['HS256'] }).unless({
  path: [
    "/users/userLogin",
    "/users/searchGroupsByUserName",
    "/users/checkCaptcha",
    "/users/createCaptcha",
  ],
});