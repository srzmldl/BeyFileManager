var downloadableList;

var fileSystem = {
    userName : "",
    authen_token : "",
    evaluateValue: 0,
    init: function(name, token) {
    	fileSystem.userName = name;
    	fileSystem.authen_token = token;
        fileSystem.getDownloadableList();
    },

    create : function(file) {
	    var originalFileSha1, originalFileMd5;
	    var fragList=[];
	    var beginTime,endTime,totalTime,speed;
	    if (file === undefined) {
		    alert("you are not selecting a file!");
		    return;
	    }
	    $("#textConsoleDiv").append("<p>Task accepted.Now begin compression.</p>");
	    utils.md5Calculator(file).then(function(md5) {
		    originalFileMd5 = md5;
		    return;
	    }).then(function() {
		    return utils.sha1Calculator(file);
	    }).then(function(sha1) {
		    originalFileSha1 = sha1;
		    return;
	    }).then(function() {
	        return utils.compressionAndDivision(file, fragList);
	    }).then(function(fragList) {
		    console.log("compression completed,now calculate hash.");
		    $("#textConsoleDiv").append("<p>compression completed,now calculate hash.</p>");
		    console.log(fragList);
		    return utils.calMd5AndSha1(fragList);
	    }).then(function(fragList) {
		    console.log("hash-computing completed,now upload.");
		    $("#textConsoleDiv").append("<p>hash-computing completed,now upload.</p>");
		    console.log(fragList);
		    beginTime=new Date().getTime();
		    return fileSystem.uploadManager(fragList);
	    }).then(function(fragDoneList) {
		    endTime=new Date().getTime();
		    totalTime=(endTime-beginTime)/1000;
		    speed=file.size/totalTime/1024;
		    console.log("upload completed");
		    $("#textConsoleDiv").append("<p>The Total time is : "+totalTime+" seconds. The average speed is : "+speed+"  K/s</p>");
		    $("#textConsoleDiv").append("<p>upload complete,now begin to upload message to ownServer server.</p>");
		    console.log("now begin to upload message to ownServer server");
		    console.log(fragDoneList);
		    return (utils.upFragListToOwnServerUpList(fileSystem.authen_token, fragDoneList, fileSystem.userName, file.name, originalFileMd5, originalFileSha1));
	    }).then(function(finalUplaodInfo) {
		    return (ownServer.virfiles_create(finalUplaodInfo));
	    }).then(function(xhr) {
		    console.log(xhr);
		    $("#textConsoleDiv").append("<p>upload finished.</p>");
	        }).then(fileSystem.getDownloadableList);
    }, //待完成：上传时链接频繁出错的时候要停止..

    uploadManager : function(fragList) {
        
	    var fragDoneList = [];
	    var uploadDeferred = $.Deferred();
        var fragLeftCnt = fragList.length;
        var fragArr = [];

        for (var i = 0, len = fragList.length; i < len; i++){
            fragArr[i] = new Frag(fragList[i]);
            var deferFrag = fragArr[i].upload();
            deferFrag.then(
                function(fragDoneItem){
                    fragLeftCnt--;
                    fragDoneList.push(fragDoneItem);
                    if (fragLeftCnt <= 0)
                        uploadDeferred.resolve(fragDoneList);
                    },
                function() { uploadDeferred.reject();}
            );
        }
	    return uploadDeferred;
    },//处理把所有文件碎片都上传一次
        
    getDownloadableList : function() {
	    var deferred = ownServer.virfiles_index(fileSystem.userName, "", fileSystem.authen_token);
	    deferred.then(function(xhr) {
		    downloadableList = JSON.parse(xhr.response);
	    }).then(function() {fileSystem.showDownloadableList();});
    }, //去lsy服务器获取downloadable list，现在只是根目录，理论上应该做成递归的函数，访问所有的子文件夹  
    showDownloadableList: function() {
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
		    }, fileSystem.ondownloadHandler);//给ondownloadhandler传了一个data的数据，可以用event.data访问得到
		    fileIndex.append(fileLi);
	    }
	}, //将downloadable list显示出来，待完成：增加悬停效果，换成其他元素，显示文件大小等信息
    

    ondownloadHandler : function(event) {
	    var targetFile = event.data.name;//请在本文中搜索event.data能搜到是哪里传给这里的
	    console.log("target file");
	    console.log(targetFile);
	    var feedbackList;
	    var originalFilename = event.data.name;
	    var originalFileMd5;
	    var originalFileSha1;
	    var fileList;
	    var beginTime,endTime,totalTime,speed;
	    var deferred = new $.Deferred();
	    var downloadDeferred = new $.Deferred();
	    deferred = ownServer.virfiles_show(fileSystem.userName, targetFile, fileSystem.authen_token);
	    deferred.then(function(xhr) {
		    feedbackList = JSON.parse(xhr.response);
		    originalFileMd5 = feedbackList.file_md5;
		    originalFileSha1 = feedbackList.file_sha1;
		    fileList = utils.ownServerDownFragListToDownFragList(feedbackList);
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