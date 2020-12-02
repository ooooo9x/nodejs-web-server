/**
 * 数组工具类
 */

class ArrayUtils {
  isEmpty(ary) {
    return (
      Object.prototype.toString.call(ary) !== '[object Array]' ||
      ary.length <= 0
    );
  }

  isNotEmpty(ary) {
    return !this.isEmpty(ary);
  }
}

module.exports = new ArrayUtils();
