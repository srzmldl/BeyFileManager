var Frag = function(item) {
    this.item = item;
    this.vis = [];
    this.uploadTimeLim = 1;
    this.errorTimeLim = 2;

    var fragDoneItem; //本碎片的上传信息
    var uploadTimeLeft; //还需要上传的次数
    var errorTimeLeft; //本碎片剩余错误容许次数
    this.upload = function() {
        var that = this;
        var len = uploadServerList.length; 
        for (var i = 0; i < len; ++i) //初始化,标记所有网盘未上传过
            that.vis[i] = 0;
        uploadTimeLeft = that.uploadTimeLim; 
        errorTimeLeft = that.errorTimeLim; //错误容许次数和上传次数初始化
        var defer = new $.Deferred();
        fragDoneItem = item; 
        uploadAll(that).then( //上传碎片到所有选择的网盘
            function() {
                defer.resolve(fragDoneItem);
            },
            function () {
                defer.reject();
            }
        )
        return defer;
        // setTimeout(singleUl,1000,item, serverUsing);
    }
    //选择合适的网盘伪并行上传
	function uploadAll(that) {
		// item={
		// 	index: fileNum,
		// 	content: blob.slice(start, end),
		// 	filename: file.name + "." + (fileNum++),
		// 	uploadedTimes: 0,
		// 	uploadedServer: [],
		// 	md5: "",
		// 	sha1: ""
		// }
        var defer = new $.Deferred();
       
        var tmp = -1; //tmp找估值最小的网盘
        var len = uploadServerList.length;
        for (var j = 0; j < len; ++j)
            if (!that.vis[j] && (tmp < 0 || uploadServerList[j].evaluateValue < uploadServerList[tmp].evaluateValue))
                tmp = j;
        var serverUsing = uploadServerList[tmp]; //把估值最小的网盘拿出来
		var promise = serverUsing.sendUlAjax(item.content, item.filename);//传这个网盘
	    promise.then(function(a, b, c) { //传成功了
            uploadTimeLeft--; //剩余次数-1
            fragDoneItem.uploadedServer.push({ //信息push到doneItem
		        panname: uploadServerName[tmp],
				addr: item.filename
			});
            that.vis[tmp] = 1; //网盘标记为已经传过
		    console.log(a, b, c);
            if (uploadTimeLeft <= 0) defer.resolve(); //传了足够多次数,正常中止
            else {
                uploadAll(that).then(   //不够次数继续递归传下一个网盘
                    function() {defer.resolve();},
                    function() {defer.reject();}
                );
            }
		}, function(a, b, c) { //这里是否考虑只要上传过碎片就resolve算了. TODO
			console.log(a, b, c);
			errorTimeLeft--; //错误容许次数-1
			if (errorTimeLeft <= 0) { //错误次数过多,上传失败
		        console.log("Error Times:"+ that.errorTimeLim);
				console.log("errorItem", item);
			    console.log("fragDoneList",that.tmpfragDoneList);
			    $("#textConsoleDiv").append("<p>Server Error.</p>");
                defer.reject();
			} else {
                uploadAll(that).then( //正常中止
                    function() {defer.resolve();},
                    function() {defer.reject();}
                );
			}
		});
        return defer;
	}
    
    prototype.download = function() {
        
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
            
        }