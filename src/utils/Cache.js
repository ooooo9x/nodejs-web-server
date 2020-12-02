const path = require("path");
const fs = require("./fsUtils");
const logger = require("./logger");
const timeUtils = require("./timeUtils");

class Cache {
  constructor() {
    this.cache_dir = path.join(__dirname, '../../cache/tree');
    if (!fs.exists(this.cache_dir)) {
      fs.mkdir(this.cache_dir);
    }
  }

  /**
   * 添加缓存
   * @param {String} key 键
   * @param {Object} val 缓存值
   */
  async set(key, val) {
    this.expire();
    logger.info(`添加缓存: key = ${key}`);
    key = path.join(this.cache_dir, key);
    let [err] = await fs.writeFile(key, JSON.stringify(val));
    if (err) {
      logger.error(`缓存出错: key = ${key}, err = ${err.message}`);
    } else {
      logger.info(`${key}已缓存.`);
    }
  }

  /**
   * 获取缓存
   * @param {String} key 键
   */
  async get(key) {
    logger.info(`读取缓存: key = ${key}`);
    key = path.join(this.cache_dir, key);
    let [err, data] = await fs.readFile(key);
    if (err) {
      logger.error(`读取缓存出错: key = ${key}, err = ${err.message}`);
      return null;
    }
    if (data) {
      logger.info(`缓存读取成功: key = ${key}`);
      return JSON.parse(data);
    } else {
      logger.info(`未读取到缓存: key = ${key}`);
      return null;
    }
  }

  /**
   * 清除过期缓存(清除当前日期之外的缓存文件)
   * @param {String} key 键
   */
  async expire() {
    logger.info(`清除过期缓存`);
    let [err, files] = await fs.readdir(this.cache_dir);
    if (err) {
      logger.error(`清除过期缓存出错: err = ${err.message}`);
      return;
    }
    let expireKey = timeUtils.format(new Date(), "yyyy-MM-dd");
    files && files.length > 0 && files.forEach(async (fileName) => {
      if (fileName && fileName.split("\.")[1] !== expireKey) {
        await fs.removeFile(path.join(this.cache_dir, fileName));
      }
    });
  }

  /**
   * 清除缓存文件
   * @param {String} key 键
   */
  async removeCacheFile(key) {
    logger.info(`清除缓存: key = ${key}`);
    key = path.join(this.cache_dir, key);
    let [err, _] = await fs.removeFile(key);
    if (err) {
      logger.error(`清除缓存出错: key = ${key}, err = ${err.message}`);
    }
  }

  /**
   * 清除所有缓存文件
   */
  async clear() {
    logger.info(`清除所有缓存`);
    let [err, files] = await fs.readdir(this.cache_dir);
    if (err) {
      logger.error(`清除所有缓存出错: err = ${err.message}`);
      return;
    }
    files && files.forEach(async (fileName) => {
      await fs.removeFile(path.join(this.cache_dir, fileName));
    });
  }
}

module.exports = Cache;