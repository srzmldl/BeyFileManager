var start = new Date;
/*var items = ["http://www.baidu.com",
  "http://www.163.com",
  "http://www.kuaipan.cn/",
  "https://www.kuaipan.cn/",
  "http://www.qq.com/",
  "http://www.sina.com.cn/"
];*/
/*var filesUploadList=[
{filename:"file1",uploadedTimes:0,originalMd5:0,timeConsuming:0,startTime:0}
{filename:"file2",uploadedTimes:1,originalMd5:0,timeConsuming:0,startTime:0}
]*/
var filesUploadList = [];
var results = [];
var running = 0;
var limit = 4;
var count = 0;

function asyncAjax(arg, i) {
  filesUploadList[i].startTime = new data;
  console.log('参数为 ' + arg);
  $.ajax({
    url: arg,
    type: "GET",
    complete: function(e) {
      results.push({ //
        url: arg,
        response: e
      });
      running--;
      if (items.length > 0) {
        uploadManagerForOnce();
      } else if (running == 0) {
        final();
      }
    }
  });
}

function final() {
  console.log("i=", i);
  console.log(results);
  //console.log("final time consuming:" + (new Date - start));
  filesUploadList[i].timeConsuming = new Date - start
}

var i = 0;

function uploadManagerForOnce() {
  var i = 0;
  while (++i && running < limit && items.length > 0) {
    var item = items.shift();
    asyncAjax(item, i);
    running++;
  }
}
/*
  i=0,serverChoose=0 ;
  while( i<filesUploadList.length ){
    if( availableServerQuantity !== 0 ){
      fileToUpload = i;
      serverChoose++;
      url= getBestUrl( serverChoose );//获取一个可用服务器,初期是找可用的url,后期改成找最快的
      filesUploadList[fileToUpload].uploadedTimes += 0.5;//文件列表规则为：已上传的加1，正在上传的加0.5
      //此处加0.5, 代表正在上传；postHandlerByAJAX监测文件传完后再加0.5，代表上传成功

      postHandlerByAJAX (url,dataForm,fileToUpload,targetUploadTimes);//调用包装好的post put请求
      i++;
    }
    else{
      setTimeout({}, 50);
    }
  }
  */
/*var filesUploadList=[
{filename:"file1",uploadedTimes:0,originalMd5,0}
{filename:"file2",uploadedTimes:1,originalMd5,0}
]*/

var j;
for (j = 0; j < filesUploadList.length; j++) {
  item[i].filename = filesUploadList[i].filename;
  item[i].uploadedTimes = filesUploadList[i].uploadedTimes;
  item[i].originalMd5 = filesUploadList[i].originalMd5;
}
launcher();



function uploadManager() {
  var server = ["xinlang", "xinlang", "jinshan", "jinshan"]
  var formAAjax = {
    "xinlang": function(file, name) {
      var url = "http://upload-vdisk.sina.com.cn/2/files/sandbox/testing728/";
      var access_token = "9aeb056662WklwB2XjPlj4ctwDY05d5f";
      var true_url = url + name + "?access_token=" + access_token;
      var formData = new FormData();
      formData.append("file", file);
      var uploadAjax = $.ajax({
        url: url,
        type: "POST",
      });
      return (uploadAjax);
    },

    "jinshan": function(file, name) {
      var formData = new FormData();
      formData.append("file", file, name);
      var key;
      var url = "http://p5.dfs.kuaipan.cn:8080/cdlnode/1/fileops/upload_file?";
      var params = {
        oauth_consumer_key: 'xcBFwv9CJNIaUfO4',
        oauth_token: '058560f25d3e696d5a00dc90',
        oauth_signature_method: "HMAC-SHA1",
        oauth_timestamp: Math.round(new Date() / 1000).toString(),
        oauth_nonce: (Math.round(Math.random() * Math.pow(36, 10))).toString(36),
        oauth_version: "1.0",
        root: "app_folder",
        path: "/testing728/" + name
      };
      params["oauth_signature"] = kuaipan_signature(url, params, "POST");
      for (key in params) {
        url += encodeURIComponent(key) + "=" + encodeURIComponent(params[key]) + "&";
      }
      url = url.substring(0, url.length - 1);
      var uploadAjax = $.ajax({
        url: url,
        contentType: false,
        processData: false,
        type: "POST",
        contentType: "multipart/form-data",
        data: formData
      });
      return (uploadAjax);
    }
  };

}