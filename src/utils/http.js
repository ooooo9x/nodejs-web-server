const axios = require("axios");

class Http {
  constructor() {}

  get(url, params = {}, headers = {}) {
    return new Promise((resolve) => {
      axios
        .get(url, { params, headers })
        .then((resp) => {
          if (resp.data.code === 0 || resp.data.code === 200) {
            resolve([null, resp.data.data]);
          } else {
            resolve([new Error(resp.data.message), null]);
          }
        })
        .catch((err) => {
          resolve([err, null]);
        });
    });
  }

  post(url, data = {}) {
    return new Promise((resolve) => {
      axios
        .post(url, data)
        .then((resp) => {
          if (resp.data.code === 0 || resp.data.code === 200) {
            resolve([null, resp.data.data]);
          } else {
            resolve([new Error(resp.data.message), null]);
          }
        })
        .catch((err) => {
          resolve([err, null]);
        });
    });
  }

  delete(url, data = {}) {
    return new Promise((resolve) => {
      axios
        .delete(url, { data })
        .then((resp) => {
          if (resp.data.code === 0 || resp.data.code === 200) {
            resolve([null, resp.data.data]);
          } else {
            resolve([new Error(resp.data.message), null]);
          }
        })
        .catch((err) => {
          resolve([err, null]);
        });
    });
  }

  put(url, data) {
    return new Promise((resolve) => {
      axios
        .put(url, data)
        .then((resp) => {
          if (resp.data.code === 0 || resp.data.code === 200) {
            resolve([null, resp.data.data]);
          } else {
            resolve([new Error(resp.data.message), null]);
          }
        })
        .catch((err) => {
          resolve([err, null]);
        });
    });
  }
}

module.exports = new Http();
