var downloadableList;

var fileSystem = {
    userName : "",
    authen_token : "",

    init: function(name, token) {
    	this.userName = name;
    	this.authen_token = token;
        this.getDownloadableList();
    },
    
    getDownloadableList : function() {
        var that = this;
	    var deferred = ownServer.virfiles_index(that.userName, "", that.authen_token);
	    deferred.then(function(xhr) {
		    downloadableList = JSON.parse(xhr.response);
	    }).then(function() {that.showDownloadableList();});
    }, //去lsy服务器获取downloadable list，现在只是根目录，理论上应该做成递归的函数，访问所有的子文件夹  
    showDownloadableList: function() {
        var that = this;
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
		    }, that.ondownloadHandler);//给ondownloadhandler传了一个data的数据，可以用event.data访问得到
		    fileIndex.append(fileLi);
	    }
	}, //将downloadable list显示出来，待完成：增加悬停效果，换成其他元素，显示文件大小等信息
 
    ondownloadHandler : function(event) {
        var that = this;
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
	    deferred = ownServer.virfiles_show(that.userName, targetFile, that.authen_token);
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
};