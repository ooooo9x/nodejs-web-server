/**
 * <弃用,推荐使用StringUtils.js>
 */

module.exports = {
  //文本判空
  isEmpty: function (value) {
    if (
      value === "" ||
      value === null ||
      value === undefined ||
      value === "undefined" ||
      value === "null" || 
      value.length <= 0
    ) {
      return true;
    } else {
      return false;
    }
  },

  isNotEmpty: function (value) {
    return !this.isEmpty(value);
  },

  /**
   * 多项判断: 如果至少有一项为空则返回true, 如果全部不为空则返回false
   */
  isOneEmpty() {
    let params = Array.prototype.slice.call(arguments);
    for (let i=0, len=params.length; i<len; i++) {
      if (this.isEmpty(params[i])) {
        return true;
      }
    }

    return false;
  },
  
  /**
   * 多项判断: 如果至少有一项不为空则返回true, 如果全部为空则返回false
   */
  isOneNotEmpty() {
    let params = Array.prototype.slice.call(arguments);
    for (let i=0, len=params.length; i<len; i++) {
      if (this.isNotEmpty(params[i])) {
        return true;
      }
    }

    return false;
  }
};
