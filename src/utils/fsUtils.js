const fs = require("fs");
const StirngUtils = require("./StringUtils");

class Fs {
  /**
   * 读取文件
   * @param {String} filePath 文件路径
   */
  readFile(filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        resolve([err, data]);
      });
    });
  }

  /**
   * 写文件
   * @param {String} filePath 文件路径
   * @param {String} data 写入的数据
   */
  writeFile(filePath, data) {
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, data, (err) => {
        resolve([err, null]);
      });
    });
  }

  /**
   * 删除文件
   * @param {String} filePath 文件路径
   */
  removeFile(filePath) {
    return new Promise((resolve, reject) => {
      fs.unlink(filePath, (err) => {
        resolve([err, null]);
      });
    });
  }

  /**
   * 读取目录下所有文件
   * @param {String} dir 目录
   */
  readdir(dir) {
    return new Promise((resolve, reject) => {
      fs.readdir(dir, (err, files) => {
        resolve([err, files]);
      });
    });
  }

  /**
   * 创建目录,支持创建多层目录
   * @param {String} dir 目录名
   */
  mkdir(dir) {
    return new Promise((resolve) => {
      if (StirngUtils.isEmpty(dir)) {
        resolve([new Error("Unable to create an empty directory")]);
        return;
      }
      let dirList = dir.split(/\/|\\/);
      dirList.reduce((dn, cn) => {
        dn += `/${cn}`;
        if (!fs.existsSync(dn)) {
          fs.mkdirSync(dn);
        }
        return dn;
      });
      resolve([null]);
    });
  }

  /**
   * 检测文件或目录是否存在
   * @param {String} name 文件或目录名
   */
  exists(name) {
    return fs.existsSync(name);
  }
}

module.exports = new Fs();
