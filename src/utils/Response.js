/**
 * http响应
 */
class Response {
  constructor(code, message, data) {
    this.code = code;
    this.message = message;
    this.data = data;
  }

  success(data, message = "success") {
    this.code = 0;
    this.message = message;
    this.data = data;

    return this;
  }

  fail(message = "failed") {
    this.code = 1;
    this.message = message;
    this.data = null;

    return this;
  }

  toString() {
    return JSON.stringify(this);
  }
}

module.exports = Response;
