var config = {
  //登录3des加密key
  des_key: "sihuatech",
  // 请求Java服务器的地址
  service_Path: "http://10.221.122.122:10001/",
  // true: 校验验证码, false: 不校验,
  isCheckCaptcha: false,
  // ffmpeg可执行文件路径
  ffmpeg_exe_path: "D:/utils/ffmpeg4.3.1/bin",
  isCacheTree: false, // 是否启用树的缓存: true启用，false禁用

  mysql: {
    // 数据库地址
    host: "10.221.122.121",
    //数据库名字
    database: "bigvdev",
    //数据库登录名
    user: "root",
    //数据库密码
    password: "root",
    //数据库端口
    port: 3306,
    //数据库最大链接数
    connectionLimit: 10,
    timezone: "08:00",
    multipleStatements: true, // 支持执行多条 sql 语句
  },

  //摄像头树结构是否显示本平台之外的数据   false:不显示  true：显示
  camera_tree_is_show_other_data: false,
  //机房树结构是否显示本平台之外的数据  false:不显示  true：显示
  cproom_tree_is_show_other_data: false,

  //前端拉取vpm回看文件的速度
  speed: 4,

  //拉取回看流地址的模式
  yunyan_channel_address_mode: "native",

  //图片服务器外网地址
  network_ip: {
    Intranet:"10.221.100",
    img: [
      {
        Intranet:"134.64.48.78",
        Extranet:"134.64.48.79",
      }
    ],
    stream: [
      {
        Intranet:"172.17.78.5",
        Extranet:"156.65.32.65",
      },
      {
        Intranet:"172.17.78.6",
        Extranet:"156.65.32.66",
      }
    ]
  },
  logger: {
    level: "debug",  // 日志级别
    dir: "D:/workspace/com.sihua.bigV.nodeServer/logs", // 日志目录
    maxFiles: "15d" // 日志最大天数,超过时间删除
  }
};

module.exports = config;
