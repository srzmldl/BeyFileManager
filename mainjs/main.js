// ownServer服务器测试api：get initial.ownServer_url+/api/v1/hello
zip.workerScriptsPath = "/js/";
document.getElementById("uploadClick").addEventListener('click', onUploadHandler, false);
document.getElementById("loginSubmit").addEventListener('click', loginHandler, false);
var initial = {
	jinshan: {
		oauth_token: "058560f25d3e696d1f2fd3b8",
		oauth_consumer_key: "xcBFwv9CJNIaUfO4",
		oauth_signature_method: "HMAC-SHA1",
		oauth_version: "1.0",
		consumer_secret: "BweeUfcIhh1hVgmx",
		oauth_token_secret: "810c09dc238d4f25aa4f8a24cbf9ab1e"
	},
	xinlang: {
		access_token: "01336d6662WklwB2XjPlj4ctwDY6dc89"
	},
	uploadServer: ["xinlang", "jinshan", "xinlang", "jinshan"],//上传用到的那个服务器列表
	BYTES_PER_CHUNK: 2 * 1024 * 1024 //每一个文件碎片大小的设置
};

var utils = {
	ownServerDownFragListToDownFragList: function(feedbackList) {
		var fileList = [];
		var i, fragIndex, newServer;
		for (i = 0; i < feedbackList.frag_num; i++) {
			fileList[i] = {};
			fileList[i].server = [];
			fileList[i].index = i;
		}
		for (i = 0; i < feedbackList.frag_list.length; i++) {
			fragIndex = feedbackList.frag_list[i].index;
			fileList[fragIndex].md5 = feedbackList.frag_list[i].md5;
			fileList[fragIndex].sha1 = feedbackList.frag_list[i].sha1;
			newServer = {};
			newServer.panname = feedbackList.frag_list[i].server_name;
			newServer.addr = feedbackList.frag_list[i].addr;
			fileList[fragIndex].server.push(newServer);
		}
		return fileList;
	}, //从ownServer服务器返回来的to用于下载的所有frag的地址的list
	upFragListToOwnServerUpList: function(authen_token, finishedList, userName, fileName, originalFileMd5, originalFileSha1) {
		var finalUplaodInfo = {};
		finalUplaodInfo.abs_path = {};
		finalUplaodInfo.abs_path.user_name = userName;
		finalUplaodInfo.abs_path.path = "";

		finalUplaodInfo.file_inf = {};
		finalUplaodInfo.file_inf.name = fileName;
		finalUplaodInfo.file_inf.frag_num = finishedList.length;
		finalUplaodInfo.file_inf.if_file = true;
		finalUplaodInfo.file_inf.file_sha1 = originalFileSha1;
		finalUplaodInfo.file_inf.file_md5 = originalFileMd5;

		finalUplaodInfo.frag_arr = [];
		var i, j, k;
		for (i = 0, j = 0; i < finishedList.length; i++) {
			for (k = 0; k < finishedList[i].uploadedServer.length; k++) {
				finalUplaodInfo.frag_arr[j] = {};
				finalUplaodInfo.frag_arr[j].addr = finishedList[i].uploadedServer[k].addr;
				finalUplaodInfo.frag_arr[j].server_name = finishedList[i].uploadedServer[k].panname;
				finalUplaodInfo.frag_arr[j].index = finishedList[i].index;
				finalUplaodInfo.frag_arr[j].sha1 = finishedList[i].sha1;
				finalUplaodInfo.frag_arr[j].md5 = finishedList[i].md5;
				j++;
			}
		}
		finalUplaodInfo.authen_token = authen_token;
		return finalUplaodInfo;
	}//上传成功后的list to 用于传给ownServer服务器的list
}

var user_current = new User();

function loginHandler(event) {
	event.stopPropagation();
    event.preventDefault();
    var deferred = new $.Deferred();
    deferred = user_current.handle_login_form();
    deferred.then(
        function(){
        fileSystem.init(user_current.user_name, user_current.authen_token);}
    );
    } //用户按登陆时的处理函数，待完成：(1)弹出窗出警告instead of text console，(2)考虑要不要改成div元素直接删掉和直接从零建起，而不是show和hide，提高代码的隐蔽性
        



var sendUlAjax = {
	"xinlang": function(file, name) {
		console.log("xinlang", file, name);
		var url = "http://upload-vdisk.sina.com.cn/2/files/sandbox/";
		url = url + encodeURIComponent(name) + "?access_token=" + initial.xinlang.access_token;
		var formData = new FormData();
		formData.append("file", file, name);
		var uploadAjax = $.ajax({
			url: url,
			type: "POST",
			contentType: false,
			processData: false,
			//contentType: "multipart/form-data",
			data: formData
		});
		return (uploadAjax);
	},

	"jinshan": function(file, name) {
		console.log("jinshan", file, name);
		var formData = new FormData();
		formData.append("file", file, name);
		var key;
		var url = "http://p5.dfs.kuaipan.cn:8080/cdlnode/1/fileops/upload_file";
		var params = {
			oauth_consumer_key: initial.jinshan.oauth_consumer_key,
			oauth_token: initial.jinshan.oauth_token,
			oauth_signature_method: initial.jinshan.oauth_signature_method,
			oauth_timestamp: Math.round(new Date() / 1000).toString(),
			oauth_nonce: (Math.round(Math.random() * Math.pow(36, 10))).toString(36),
			oauth_version: initial.jinshan.oauth_version,
			overwrite: true,
			root: "app_folder",
			path: "" + name
		};
		params["oauth_signature"] = utils.kuaipan_signature(url, params, "POST");
		url += "?";
		for (key in params) {
			url += encodeURIComponent(key) + "=" + encodeURIComponent(params[key]) + "&";
		}
		url = url.substring(0, url.length - 1);
		var uploadAjax = $.ajax({
			url: url,
			type: "POST",
			contentType: false,
			processData: false,
			data: formData
		});
		return (uploadAjax);
	}
}//发一个上传的ajax请求，ul=upload，返回的是deferred对象


var sendDlAjax = {
	"xinlang": function(addr) {
		var ajaxDeferred = new $.Deferred();
		var url = "https://api.weipan.cn/2/files/sandbox/";
		var access_token = initial.xinlang.access_token;
		url = url + encodeURI(addr) + "?access_token=" + access_token;
		var downloadAjax = new XMLHttpRequest();
		downloadAjax.open("GET", url, true);
		downloadAjax.responseType = 'blob';
		downloadAjax.onload = function(event) {
			if (event.target.status == 200) {
				ajaxDeferred.resolve(event.target);
			} else {
				ajaxDeferred.reject(event.target);
			}
			console.log("loaded");
			console.log(event.target);
		};
		downloadAjax.onerror = function(event) {
			console.log("error");
			console.log(event.target);
			ajaxDeferred.reject(event.target);
		};
		downloadAjax.send();
		return ajaxDeferred;
	},
	"jinshan": function(addr) {
		var ajaxDeferred = new $.Deferred();
		var url = "http://api-content.dfs.kuaipan.cn/1/fileops/download_file";
		var params = {
			oauth_consumer_key: initial.jinshan.oauth_consumer_key,
			oauth_token: initial.jinshan.oauth_token,
			oauth_signature_method: initial.jinshan.oauth_signature_method,
			oauth_timestamp: Math.round(new Date() / 1000).toString(),
			oauth_nonce: (Math.round(Math.random() * Math.pow(36, 10))).toString(36),
			oauth_version: initial.jinshan.oauth_version,
			root: "app_folder",
			path: addr //the official demo is without a "/" at the very front of addr
		};
		params["oauth_signature"] = utils.kuaipan_signature(url, params, "GET");
		url += "?";
		for (key in params) {
			url += encodeURIComponent(key) + "=" + encodeURIComponent(params[key]) + "&";
		}
		url = url.substring(0, url.length - 1);
		var downloadAjax = new XMLHttpRequest();
		downloadAjax.open("GET", url, true);
		downloadAjax.responseType = 'blob';
		downloadAjax.onload = function(event) {
			if (event.target.status == 200) {
				ajaxDeferred.resolve(event.target);
			} else {
				ajaxDeferred.reject(event.target);
			}
			console.log("loaded");
			console.log(event.target);
		};
		downloadAjax.onerror = function(event) {
			console.log("error");
			console.log(event.target);
			ajaxDeferred.reject(event.target);
		};
		downloadAjax.send();
		return ajaxDeferred;
	}
} //发一个下载请求，dl=download

