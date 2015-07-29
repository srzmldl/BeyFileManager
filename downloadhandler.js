// var temp;
// for(var i=0;i<fragmentsFinishedList.length;i++){
// temp=fragmentsFinishedList[i];
// console.log("{index:"+temp.fileNum+",md5:"+temp.originalMd5+",sha1:"+temp.originalSha1+",server:"+temp.uploadedServer[0]+"}")
// }

function ondownloadHandler(event) {
	var targetFile = event.target.value;
	var originalFilename = "index.ppt";
	var originalFileMd5 = "04476dfab0495651579743ff1c9b09ce";
	var originalFileSha1 = "b828d9664fb08e3dc0a48edbe3d470244e115ed3";
	var fileList;
	//[{“addr”:”www.google.com”,”index”:2,"sha1":xxx,"md5":xxx, "server_name":xxx},{……..}]
	fileList = [{
		index: 0,
		addr: "/testing729_index.ppt.0",
		md5: "bd1da099e0cebe25728265abfc3243c7",
		sha1: "56bda88e0ee879c2d189406698c27b7442fcb5d5",
		server_name: "xinlang"
	}, {
		index: 3,
		addr: "/testing729_index.ppt.3",
		md5: "8691ea5a4a04d761ea7441c6c315927a",
		sha1: "aefdb53ca3c50ff78659edadd99f70fbc92945d2",
		server_name: "jinshan"
	}, {
		index: 2,
		addr: "/testing729_index.ppt.2",
		md5: "1fc00e74bab8727d28367268126846c9",
		sha1: "46b96359a3e17bce6f6b5a0961b082a2e5175f24",
		server_name: "jinshan"
	}, {
		index: 6,
		addr: "/testing729_index.ppt.6",
		md5: "d6fd6ae9b3f78d864a37d8d1a520b90e",
		sha1: "4c9e0438ff1afc2358501cc65ac481e49ebbd63e",
		server_name: "jinshan"
	}, {
		index: 5,
		addr: "/testing729_index.ppt.5",
		md5: "61bdd15b163c082bc48c3708fb5efd2b",
		sha1: "138f47d2294b7a3f7f71ee0650f51a216b27db06",
		server_name: "jinshan"
	}, {
		index: 4,
		addr: "/testing729_index.ppt.4",
		md5: "3ae9367b0d0d6a354eb87f21be250078",
		sha1: "9fd8366c5c6878a061bc74a58d309271d16a4ce3",
		server_name: "xinlang"
	}, {
		index: 1,
		addr: "/testing729_index.ppt.1",
		md5: "f899b38c75135c9bcddc3fb72ca3df58",
		sha1: "493e876e9b1bd675e929acf91442208229f5d671",
		server_name: "jinshan"
	}];

	var formAAjax={
		"xinlang":function(addr){
			var ajaxDeferred=new $.Deferred();
			var url = "https://api.weipan.cn/2/files/sandbox/";
			var access_token = "5f22cd6653lNba91f6c9fLtp7Kcd83d4";
			url = url + encodeURI(name) + "?access_token=" + access_token;
			var uploadAjax = new XMLHttpRequest();
			uploadAjax.open("GET",url,true);
			uploadAjax.responseType='blob';
			uploadAjax.onload=function(event){
				console.log("loaded");
				console.log(event.target);
				ajaxDeferred.resolve(event.target);
			};
			uploadAjax.onerror=function(event){
				console.log("error");
				console.log(event.target);
				ajaxDeferred.reject(event.target);
			};
			uploadAjax.send();
			return ajaxDeferred;
		},
		"jinshan":function(addr){
			var ajaxDeferred=new $.Deferred();
			var url = "http://api-content.dfs.kuaipan.cn/1/fileops/download_file";
			var params = {
				oauth_consumer_key: 'xcBFwv9CJNIaUfO4',
				oauth_token: '058560f25d3e696d5a00dc90',
				oauth_signature_method: "HMAC-SHA1",
				oauth_timestamp: Math.round(new Date() / 1000).toString(),
				oauth_nonce: (Math.round(Math.random() * Math.pow(36, 10))).toString(36),
				oauth_version: "1.0",
				root: "app_folder",
				path: addr//the official demo is without a "/" in the very front of addr
			};
			params["oauth_signature"] = kuaipan_signature(url, params, "GET");
			url += "?";
			for (key in params) {
				url += encodeURIComponent(key) + "=" + encodeURIComponent(params[key]) + "&";
			}
			url = url.substring(0, url.length - 1);
			var uploadAjax = new XMLHttpRequest();
			uploadAjax.open("GET",url,true);
			uploadAjax.responseType='blob';
			uploadAjax.onload=function(event){
				if(event.target.status==200){
					ajaxDeferred.resolve(event.target);
				}else{
					ajaxDeferred.reject(event.target);
				}
				console.log("loaded");
				console.log(event.target);
			};
			uploadAjax.onerror=function(event){
				console.log("error");
				console.log(event.target);
				ajaxDeferred.reject(event.target);
			};
			uploadAjax.send();
			return ajaxDeferred;
		}
	}
}


