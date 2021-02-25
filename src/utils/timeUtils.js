/**
 * 时间工具
 */
module.exports = {
  // 格式化时间
  format(date, format='yyyy-MM-dd hh:mm:ss') {
    let o = {
      "M+": date.getMonth() + 1, //month
      "d+": date.getDate(), //day
      "h+": date.getHours(), //hour
      "m+": date.getMinutes(), //minute
      "s+": date.getSeconds(), //second
      "q+": Math.floor((date.getMonth() + 3) / 3), //quarter
      S: date.getMilliseconds(), //millisecond
    };

    if (/(y+)/.test(format)) {
      format = format.replace(
        RegExp.$1,
        (date.getFullYear() + "").substr(4 - RegExp.$1.length)
      );
    }

    for (let k in o) {
      if (new RegExp("(" + k + ")").test(format)) {
        format = format.replace(
          RegExp.$1,
          RegExp.$1.length == 1
            ? o[k]
            : ("00" + o[k]).substr(("" + o[k]).length)
        );
      }
    }
    return format;
  },
  //获取系统时间 月份
  getCurrentMonth() {
    return this.format(new Date(), "yyyy-MM");
  },
  //获取系统时间 年份
  getCurrentYear() {
    return this.format(new Date(), "yyyy");
  },
  //获取系统时间 yyyy-MM-dd
  getCurrentDate() {
    return this.format(new Date(), "yyyy-MM-dd");
  },
  //获取系统时间 yyyy-MM-dd HH:mm:ss
  getCurrentTime() {
    return this.format(new Date());
    // var currentFormatDate = "2020-06-10";
    // try {
    //   var date = new Date();
    //   var year = date.getFullYear();
    //   //年 ,从 Date 对象以四位数字返回年份
    //   var month = date.getMonth() + 1;
    //   // 月 ,从 Date 对象返回月份 (0 ~ 11) ,date.getMonth()比实际月份少 1 个月
    //   var day = date.getDate();
    //   //日 ,从 Date 对象返回一个月中的某一天 (1 ~ 31)
    //   var hours = date.getHours();
    //   //小时 ,返回 Date 对象的小时 (0 ~ 23)
    //   var minutes = date.getMinutes();
    //   //分钟 ,返回 Date 对象的分钟 (0 ~ 59)
    //   var seconds = date.getSeconds();
    //   //秒 ,返回 Date 对象的秒数 (0 ~ 59)
    //   // 获取当前系统时间
    //   //修改月份格式
    //   if (month >= 1 && month <= 9) {
    //     month = "0" + month;
    //   }
    //   // 修改日期格式
    //   if (day >= 0 && day <= 9) {
    //     day = "0" + day;
    //   }
    //   // 修改小时格式
    //   if (hours >= 0 && hours <= 9) {
    //     hours = "0" + hours;
    //   }
    //   // 修改分钟格式
    //   if (minutes >= 0 && minutes <= 9) {
    //     minutes = "0" + minutes;
    //   }
    //   // 修改秒格式
    //   if (seconds >= 0 && seconds <= 9) {
    //     seconds = "0" + seconds;
    //   }
    //   // 获取当前系统时间  格式(yyyy-mm-dd hh:mm:ss)
    //   currentFormatDate =
    //     year +
    //     "-" +
    //     month +
    //     "-" +
    //     day +
    //     " " +
    //     hours +
    //     ":" +
    //     minutes +
    //     ":" +
    //     seconds;
    //   // currentFormatDate = year + "-" + month + "-"
    //   // + day ;
    // } catch (e) {
    //   console.log(e);
    // }

    // return currentFormatDate;
  },
  //获取当前时间前N分钟的时间
  getNowFormatDate(timelength) {
    var date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    //前十分钟时间
    var minutes = parseInt(timelength);

    var interTimes = minutes * 60 * 1000;

    var interTimes = parseInt(interTimes);
    date = new Date(Date.parse(date) - interTimes);

    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    var hour = date.getHours();
    var minutes = date.getMinutes();
    if (month >= 1 && month <= 9) {
      month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
      strDate = "0" + strDate;
    }
    if (hour >= 0 && hour <= 9) {
      hour = "0" + hour;
    }
    if (minutes >= 0 && minutes <= 9) {
      minutes = "0" + minutes;
    }
    var currentdate =
      date.getFullYear() +
      seperator1 +
      month +
      seperator1 +
      strDate +
      " " +
      hour +
      seperator2 +
      minutes +
      seperator2 +
      date.getSeconds();
    return currentdate;
  },
  //根据日期获取秒级时间戳
  getTimeStamp(value) {
    var date = new Date(value);
    var time = date.getTime() / 1000; //转换成秒；
    return time;
  },
};
