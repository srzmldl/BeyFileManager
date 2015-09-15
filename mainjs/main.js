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
}

var authen_token;
var downloadableList;

var tool = {
	kuaipan_signature: function(url, params, method) {
		var consumer_secret = initial.jinshan.consumer_secret;
		var oauth_token_secret = initial.jinshan.oauth_token_secret;
		var secret = consumer_secret + "&";
		if ("oauth_token" in params)
			secret += oauth_token_secret;
		var base = method + "&" + encodeURIComponent(url) + "&";
		var array = new Array();
		for (key in params) {
			array.push(key);
		}
		array.sort();
		var item = "";
		for (i = 0, l = array.length; i < l; i++) {
			item += encodeURIComponent(array[i]) + "=" + encodeURIComponent(params[array[i]]) + "&";
		}
		item = item.substring(0, item.length - 1);
		base += encodeURIComponent(item);
		var hash = CryptoJS.HmacSHA1(base, secret);
		hash = hash.toString();
		var hash_digest = "";
		for (i = 0, l = hash.length; i < l; i += 2) {
			hash_digest += String.fromCharCode(parseInt(hash[i] + hash[i + 1], 16));
		}
		var signature = window.btoa(hash_digest);
		return signature;
	},
	md5Calculator: function(file) {
		var md5Deferred = $.Deferred();
		//	var file = $("#uploadSelect")[0].files[0];
		//  file should be a File Object got by input element
		var worker = new Worker("./js/calculator.worker.md5.js");
		var blob=new Blob();
		worker.addEventListener("message", function(event) {
			if (event.data.result) {
				console.log("md5:", event.data.result);
				worker.terminate();
				md5Deferred.resolve(event.data.result);
			}
		});
		var buffer_size = 64 * 16 * 1024;
		var block = {
			'file_size': file.size,
			'start': 0
		};
		block.end = buffer_size > file.size ? file.size : buffer_size;
		var count = 0
		var handle_hash_block = function(event) {
			if (block.end !== file.size) {
				block.start += buffer_size;
				block.end += buffer_size;

				if (block.end > file.size) {
					block.end = file.size;
				}
				reader = new FileReader();
				reader.onload = handle_load_block;
				blob = file.slice(block.start, block.end);

				reader.readAsArrayBuffer(blob);
			}
		};
		worker.addEventListener('message', handle_hash_block);
		var handle_load_block = function(event) {
			count += 1;
			worker.postMessage({
				'message': event.target.result,
				'block': block
			});
		};
		var reader = new FileReader();
		reader.onload = handle_load_block;
		blob = file.slice(block.start, block.end);
		reader.readAsArrayBuffer(blob);
		return md5Deferred;
	},
	sha1Calculator: function(file) {
		var sha1Deferred = new $.Deferred();
		var worker, reader, i, buffer_size, block, blob, handle_hash_block, handle_load_block;
		var max_crypto_file_size = 500 * 1024 * 1024;
		if (file.size < max_crypto_file_size) {
			var reader = new FileReader();
			reader.onload = function(event) {
				var data = event.target.result;
				window.crypto.subtle.digest({
						name: "SHA-1"
					}, data)
					.then(function(hash) {
						var hexString = '',
							hashResult = new Uint8Array(hash);
						for (var i = 0; i < hashResult.length; i++) {
							hexString += ("00" + hashResult[i].toString(16)).slice(-2);
						}
						console.log("SHA1:", hexString);
						sha1Deferred.resolve(hexString);
					})
					.catch(function(error) {
						console.error(error);
						sha1Deferred.reject(error);
					});
			};
			reader.readAsArrayBuffer(file);
		} else {
			worker = new Worker('/js/calculator.worker.sha1.js');
			worker.addEventListener('message', function(event) {
				if (event.data.result) {
					console.log("SHA1:", event.data.result);
					worker.terminate();
					sha1Deferred.resolve(event.data.result);
				}
			});
			handle_load_block = function(event) {
				worker.postMessage({
					'message': event.target.result,
					'block': block
				});
			};
			handle_hash_block = function(event) {
				if (block.end !== file.size) {
					block.start += buffer_size;
					block.end += buffer_size;
					if (block.end > file.size) {
						block.end = file.size;
					}
					reader = new FileReader();
					reader.onload = handle_load_block;
					blob = file.slice(block.start, block.end);
					reader.readAsArrayBuffer(blob);
				}
			};
			buffer_size = 64 * 16 * 1024;
			block = {
				'file_size': file.size,
				'start': 0
			};
			block.end = buffer_size > file.size ? file.size : buffer_size;
			worker.addEventListener('message', handle_hash_block);
			reader = new FileReader();
			reader.onload = handle_load_block;
			blob = file.slice(block.start, block.end);
			reader.readAsArrayBuffer(blob);
		}
		return sha1Deferred;
	},
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
//var file_system
        
function loginHandler(event) {
	event.stopPropagation();
    event.preventDefault();
    var deferred = new $.Deferred();
    deferred = user_current.handle_login_form();
    deferred.then(
        getDownloadableList()
    )    
} //用户按登陆时的处理函数，待完成：(1)弹出窗出警告instead of text console，(2)考虑要不要改成div元素直接删掉和直接从零建起，而不是show和hide，提高代码的隐蔽性

function getDownloadableList() {
	var deferred = ownServer.virfiles_index(loginName, "", authen_token);
	deferred.then(function(xhr) {
		downloadableList = JSON.parse(xhr.response);
	}).then(showDownloadableList)
} //去lsy服务器获取downloadable list，现在只是根目录，理论上应该做成递归的函数，访问所有的子文件夹

function showDownloadableList() {
	var index = downloadableList.list;
	var fileIndex = $("#fileIndex");
	fileIndex.children().remove();
	fileIndex.append("<li>..</li>");
	var fileLi;
	for (i = 0, l = index.length; i < l; i++) {
		if (index[i].if_file == true) {
			fileLi = $("<li><a>" + index[i].name + "</a></li>");
		} else {
			fileLi = $("<li><a>()" + index[i].name + "</a><li>");
		}
		fileLi.on("click", {
			name: index[i].name
		}, ondownloadHandler);//给ondownloadhandler传了一个data的数据，可以用event.data访问得到
		fileIndex.append(fileLi);
	}
} //将downloadable list显示出来，待完成：增加悬停效果，换成其他元素，显示文件大小等信息

function compressionAndDivision(file, fragList) {
	var deferred = new $.Deferred();
	zip.createWriter(new zip.BlobWriter(), function(writer) {
			writer.add(file.name, new zip.BlobReader(file), function() {
					writer.close(function(blob) {
							var size = file.size;
							var start = 0;
							var fileNum = 0;
							var end = initial.BYTES_PER_CHUNK;
							while (start < size) {
								fragList.push({
									index: fileNum,
									content: blob.slice(start, end),
									filename: file.name + "." + (fileNum++),
									uploadedTimes: 0,
									uploadedServer: [],
									md5: "",
									sha1: ""
								});
								start = end;
								end = end + initial.BYTES_PER_CHUNK;
							};
							console.log("the file " + file.name + "'s Compression and division complete");
							deferred.resolve(fragList);
						}) //writer.close
				}) //writer.add
		}) //zip.createWriter
	return deferred;
} //压缩和分块，待完成：压缩和分块处理时可以有进度（尤其是每一个文件碎片完成的时候）

function calMd5AndSha1(fragList) {
	var i;
	var allDeferred = [],
		deferred;

	function calMd5AndStore(index) {
		return (tool.md5Calculator(fragList[index].content).then(function(md5) {
			fragList[index]["md5"] = md5;
		}));
	}

	function calSha1AndStore(index) {
		return (tool.md5Calculator(fragList[index].content).then(function(sha1) {
			fragList[index]["sha1"] = sha1;
		}));
	}
	for (i = 0; i < fragList.length; i++) {
		//计算每个碎片的MD5码
		allDeferred.push(calMd5AndStore(i));
		allDeferred.push(calSha1AndStore(i));
	}
	deferred = $.when.apply(this, allDeferred).then(function() {
		return (fragList);
	});
	return deferred;
} //算所有文件碎片的hash值，这里也可以有进度，理由同上

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
		params["oauth_signature"] = tool.kuaipan_signature(url, params, "POST");
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

function uploadManager(fragList) {
        
	var server = initial.uploadServer.concat();
	var running = 0;
	var errorTimes = 0;
	var fragAmount = fragList.length;
	var fragDoneList = [];
	var ulOnceDeferred = $.Deferred();

	function singleUl(item, serverUsing) {
		// item={
		// 	index: fileNum,
		// 	content: blob.slice(start, end),
		// 	filename: file.name + "." + (fileNum++),
		// 	uploadedTimes: 0,
		// 	uploadedServer: [],
		// 	md5: "",
		// 	sha1: ""
		// }
		var promise = sendUlAjax[serverUsing](item.content, item.filename);
		promise.then(function(a, b, c) {
			item.uploadedTimes++;
			item.uploadedServer.push({
				panname: serverUsing,
				addr: item.filename
			});
			fragDoneList.push(item);
			console.log(a, b, c);
			running--;
			server.push(serverUsing);
			ulOnce();
			return;
		}, function(a, b, c) {
			fragList.push(item);
			console.log(a, b, c);
			running--;
			errorTimes++;
			if(errorTimes>3){
				console.log("Error Times:"+errorTimes);
				console.log("fragList",fragList);
				console.log("fragDoneList",fragDoneList);
				$("#textConsoleDiv").append("<p>Server Error.</p>");
			}else{
				server.push(serverUsing);
				ulOnce();
			}
			return;
		});
	}

	function ulOnce() {
		var item;
		var serverUsing;
		while (server.length > 0 && fragList.length > 0) {
			item = fragList.shift();
			serverUsing = server.shift();
			setTimeout(singleUl,1000,item, serverUsing);
			running++;
		}
		if (fragList.length === 0 & fragDoneList.length === fragAmount) {
			ulOnceDeferred.resolve(fragDoneList);
		}
	}

	ulOnce();

	return ulOnceDeferred;
}//处理把所有文件碎片都上传一次

function onUploadHandler() {
	var uploadSelect = document.getElementById("uploadSelect");
	uploadSelect.disable = true;
	var file = uploadSelect.files[0];
	var originalFileSha1, originalFileMd5;
	var fragList=[];
	var beginTime,endTime,totalTime,speed;
	if (file === undefined) {
		alert("you are not selecting a file!");
		return;
	}
	$("#textConsoleDiv").append("<p>Task accepted.Now begin compression.</p>");
	tool.md5Calculator(file).then(function(md5) {
		originalFileMd5 = md5;
		return;
	}).then(function() {
		return tool.sha1Calculator(file);
	}).then(function(sha1) {
		originalFileSha1 = sha1;
		return;
	}).then(function() {
		return compressionAndDivision(file, fragList);
	}).then(function(fragList) {
		console.log("compression completed,now calculate hash.");
		$("#textConsoleDiv").append("<p>compression completed,now calculate hash.</p>");
		console.log(fragList);
		return calMd5AndSha1(fragList);
	}).then(function(fragList) {
		console.log("hash-computing completed,now upload.");
		$("#textConsoleDiv").append("<p>hash-computing completed,now upload.</p>");
		console.log(fragList);
		beginTime=new Date().getTime();
		return uploadManager(fragList);
	}).then(function(fragDoneList) {
		endTime=new Date().getTime();
		totalTime=(endTime-beginTime)/1000;
		speed=file.size/totalTime/1024;
		console.log("upload completed");
		$("#textConsoleDiv").append("<p>The Total time is : "+totalTime+" seconds. The average speed is : "+speed+"  K/s</p>");
		$("#textConsoleDiv").append("<p>upload complete,now begin to upload message to ownServer server.</p>");
		console.log("now begin to upload message to ownServer server");
		console.log(fragDoneList);
		return (tool.upFragListToOwnServerUpList(authen_token, fragDoneList, loginName, file.name, originalFileMd5, originalFileSha1));
	}).then(function(finalUplaodInfo) {
		return (ownServer.virfiles_create(finalUplaodInfo));
	}).then(function(xhr) {
		console.log(xhr);
		$("#textConsoleDiv").append("<p>upload finished.</p>");
	}).then(getDownloadableList);
} //待完成：上传时链接频繁出错的时候要停止..

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
		params["oauth_signature"] = tool.kuaipan_signature(url, params, "GET");
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


function ondownloadHandler(event) {
	var targetFile = event.data.name;//请在本文中搜索event.data能搜到是哪里传给这里的
	console.log("target file");
	console.log(targetFile);
	var deferred;
	var feedbackList;
	var originalFilename = event.data.name;
	var originalFileMd5;
	var originalFileSha1;
	var fileList;
	var beginTime,endTime,totalTime,speed;
	var deferred = new $.Deferred();
	var downloadDeferred = new $.Deferred();
	deferred = ownServer.virfiles_show(loginName, targetFile, authen_token);
	deferred.then(function(xhr) {
		feedbackList = JSON.parse(xhr.response);
		originalFileMd5 = feedbackList.file_md5;
		originalFileSha1 = feedbackList.file_sha1;
		fileList = tool.ownServerDownFragListToDownFragList(feedbackList);
		$("#textConsoleDiv").append("<p>download begins.</p>");
		beginTime=new Date().getTime();
	}).then(downloadAllFrag).then(function() {
		var decompressiondeferred = new $.Deferred();
		blob = new Blob(blobList);
		var unzipblob;
		endTime=new Date().getTime();
		totalTime=(endTime-beginTime)/1000;
		speed=blob.size/totalTime;
		$("#textConsoleDiv").append("<p>The Total time is : "+totalTime+" seconds. The average speed is : "+speed+"  K/s</p>");
		$("#textConsoleDiv").append("<p>download completed,now decompression.</p>");
		
		zip.createReader(new zip.BlobReader(blob), function(reader) {
			reader.getEntries(function(entries) {
				if (entries.length) {
					entries[0].getData(new zip.BlobWriter(), function(newblob) {
						unzipblob = newblob;
						// close the zip reader
						reader.close(function() {
							// onclose callback
							decompressiondeferred.resolve(unzipblob);
						});
					}, function(current, total) {
						// onprogress callback
					});
				}
			});
		}, function(error) {
			// onerror callback
		});
		return decompressiondeferred;
	}).then(function(unzipblob) {
		//here is the hash comparison and the decompression
		var a = document.createElement("a");
		a.href = window.URL.createObjectURL(unzipblob);
		a.download = originalFilename;
		a.textContent = "Download " + originalFilename;
		$("#textConsoleDiv").append($("<p></p>").append(a));
	});

	var blobList = [];
	var blob;
	var server = {
		xinlang: {
			avail: 2,
			onlyList: [],
		},
		jinshan: {
			avail: 2,
			onlyList: []
		}
	};
	var sharedList = [];


	function downloadAllFrag() { //only initial all the server ajax requests
		var i;
		var serverUsing, temporaryitem; //temporary variable just to make the code more clear
		for (i = 0; i < fileList.length; i++) {
			fileList[i].downloadStatus = 0;
			if (fileList[i].server.length == 1) {
				server[fileList[i].server[0].panname]["onlyList"].push(fileList[i]);
			} else {
				sharedList.push(fileList[i]);
			}
		}
		for (i in server) {
			serverUsing = i; //xinlang or jinshan so on
			while (server[serverUsing]["avail"] > 0) {
				if (server[serverUsing]["onlyList"].length > 0) {
					downloadSingleFragment(server[serverUsing]["onlyList"].shift(), serverUsing);
				} else if (sharedList.length > 0) {
					if ((temporaryitem = isServerUsingInSharedList(serverUsing)) === false) {
						break;
					} else {
						downloadSingleFragment(temporaryitem, serverUsing);
					}
				} else {
					break;
				}
			}
		}
		return downloadDeferred;
	}

	function isServerUsingInSharedList(serverUsiag) {
		var i, j;
		for (i = 0; i < sharedList.length; i++) {
			for (j = 0; j < sharedList[i].server.length; j++) {
				if (sharedList[i].server[j].panname == serverUsing) {
					return (sharedList.splice(i, 1)[0]); //把sharedlist的这个对象删除掉
				}
			}
		}
		return (false);
	}

	function continueDownloading(serverUsing) {
		console.log("here is two");
		var i, j, k, temp;
		if (serverUsing !== undefined) {
			downloadSingleFragment(server[serverUsing]["onlyList"].shift(), serverUsing);
		} else {
			for (i = 0; i < sharedList.length; i++) {
				temp = sharedList[i];
				for (j = 0; j < temp.server.length; j++) {
					if (serverUsing === temp.server[j].panname) {
						downloadSingleFragment(sharedList.splice(i, 1)[0], serverUsing);
						return;
					}
				}

			}
			return;
		}

	}

	function isAllFinished() {
		if (sharedList.length > 0) {
			return false;
		} else if (server.jinshan.onlyList.length > 0) {
			return false;
		} else if (server.jinshan.avail < 2) {
			return false;
		} else if (server.xinlang.onlyList.length > 0) {
			return false;
		} else if (server.xinlang.avail < 2) {
			return false;
		} else {
			return true;
		}
	}

	function downloadSingleFragment(fileListItem, serverUsing) {
		// fileListItem == {
		// 	index: 0,
		// 	md5: "bd1da099e0cebe25728265abfc3243c7",
		// 	sha1: "56bda88e0ee879c2d189406698c27b7442fcb5d5",
		// 	server: [{
		// 		panname: "xinlang",
		// 		addr: "/testing729_index.ppt.0"
		// 	}],
		//	downloadStatus:0
		// }
		var i;
		for (i = 0; i < fileListItem.server.length && fileListItem.server[i].panname != serverUsing; i++);
		if (fileListItem.server[i].panname !== serverUsing) {
			throw (new Error("unknown mistaks(it's impossible!)pls check this line immediately!"));
			return;
		}
		server[serverUsing]["avail"]--;
		var ajaxDeferred = sendDlAjax[serverUsing](fileListItem.server[i].addr);
		ajaxDeferred.then(function(xhr) {
			console.log("here is one");
			server[serverUsing]["avail"]++;
			fileListItem.downloadStatus = 1;
			blobList[fileListItem["index"]] = xhr.response;
			if (server[serverUsing]["onlyList"].length > 0) {
				continueDownloading(serverUsing);
			} else if (sharedList.length > 0) {
				continueDownloading(undefined);
			} else if (isAllFinished()) {
				downloadDeferred.resolve();
				console.log("here is three");
			} else {
				return;
			}
		}, function(xhr) {
			server[serverUsing]["avail"]++;
			if (fileListItem.server.length === 1) {
				server[serverUsing]["onlyList"].push(fileListItem);
			} else {
				sharedList.push(fileListItem);
			}
			if (server[serverUsing]["onlyList"].length > 0) {
				continueDownloading(serverUsing);
			} else if (sharedList.length > 0) {
				continueDownloading(undefined);
			} else {
				return;
			}
		})
	}
}