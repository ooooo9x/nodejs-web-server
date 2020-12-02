/**
 * 字符串工具类
 */

class StringUtils {
  isEmpty(str) {
    return (
      typeof str === "undefined" ||
      str === null ||
      str === "" ||
      str === "null" ||
      str === "undefined"
    );
  }

  isNotEmpty(str) {
    return !this.isEmpty(str);
  }

  /**
   * 多项判断: 如果至少有一项为空则返回true, 如果全部不为空则返回false
   */
  isOneEmpty() {
    let params = Array.prototype.slice.call(arguments);
    for (let i = 0, len = params.length; i < len; i++) {
      if (this.isEmpty(params[i])) {
        return true;
      }
    }

    return false;
  }

  /**
   * 多项判断: 如果至少有一项不为空则返回true, 如果全部为空则返回false
   */
  isOneNotEmpty() {
    let params = Array.prototype.slice.call(arguments);
    for (let i = 0, len = params.length; i < len; i++) {
      if (this.isNotEmpty(params[i])) {
        return true;
      }
    }

    return false;
  }
}

module.exports = new StringUtils();
