var Frag = function(item0) {
    var uploadTimeLim = 1;
    var errorTimeLim = 4;
    var downloadErrorTimeLim = 4;
    var vis = [];
    var fragDoneItem; //本碎片的上传信息
    var uploadTimeLeft; //还需要上传的次数
    var errorTimeLeft; //本碎片剩余错误容许次数
    var hashServer = [];
    var downloadErrorTimeLeft; //下载碎片剩余次数
    var item = item0;
    this.upload = function() {
        var len = uploadServerList.length; 
        for (var i = 0; i < len; ++i) //初始化,标记所有网盘未上传过
            vis[i] = 0;
        uploadTimeLeft = uploadTimeLim; 
        errorTimeLeft = errorTimeLim; //错误容许次数和上传次数初始化
        var defer = new $.Deferred();
        fragDoneItem = item;
        uploadAll().then( //上传碎片到所有选择的网盘
            function() {
                defer.resolve(fragDoneItem);
            },
            function () {
                defer.reject();
            }
        );
        return defer;
        // setTimeout(singleUl,1000,item, serverUsing);
    };
    //选择合适的网盘伪并行上传
	function uploadAll() {
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
            if (!vis[j] && (tmp < 0 || uploadServerList[j].evaluateValueUpload < uploadServerList[tmp].evaluateValueUpload))
                tmp = j;
        var serverUsing = uploadServerList[tmp]; //把估值最小的网盘拿出来
	    var promise = serverUsing.sendUlAjax(fragDoneItem.content, fragDoneItem.filename);//传这个网盘
	    promise.then(function(a, b, c) { //传成功了
            uploadTimeLeft--; //剩余次数-1
            fragDoneItem.uploadedServer.push({ //信息push到doneItem
		        panname: uploadServerName[tmp],
			    addr: fragDoneItem.filename
			});
            vis[tmp] = 1; //网盘标记为已经传过
		    console.log(a, b, c);
            if (uploadTimeLeft <= 0) defer.resolve(); //传了足够多次数,正常中止
            else {
                uploadAll().then(   //不够次数继续递归传下一个网盘
                    function() {defer.resolve();},
                    function() {defer.reject();}
                );
            }
		}, function(a, b, c) { //这里是否考虑只要上传过碎片就resolve算了. TODO
			console.log(a, b, c);
			errorTimeLeft--; //错误容许次数-1
			if (errorTimeLeft <= 0) { //错误次数过多,上传失败
		        console.log("Error Times:"+ errorTimeLim);
			    console.log("errorItem", fragDoneItem);
			    $("#textConsoleDiv").append("<p>Server Error.</p>");
                defer.reject();
			} else {
                uploadAll().then( //正常中止
                    function() {defer.resolve();},
                    function() {defer.reject();}
                );
			}
		});
        return defer;
	}
    
    this.download = function() {
        for (var i = 0; i < uploadServerName.length; ++i) {
            hashServer[uploadServerName[i]] = uploadServerList[i];
        }
        downloadErrorTimeLeft = downloadErrorTimeLim;
        return verifiedDownload();
    };

    function verifiedDownload() {
        var defer = new $.Deferred();
        var tmp = item.server[0];
	    for (var i = 1; i < item.server.length; i++) {
            if (hashServer[item.server[i].panname].evaluateValueDownload < tmp.evaluateValueDownload)
                tmp = hashServer[item.server[i].panname];
	    }
	    downloadSingleFragment(tmp.addr, tmp.panname).then(
            function(fragDoneBlob){
                defer.resolve(fragDoneBlob);
            },
            function() {
                downloadErrorTimeLeft--;
                if (downloadErrorTimeLeft <= 0) defer.reject();
                else {
                    verifiedDownload().then(
                        function(fragDoneBlob) {defer.resolve(fragDoneBlob);},
                        function() {defer.reject();}
                    );
                }
            }
        );
	    return defer;
	}
    //验md5 TODO
	function downloadSingleFragment(addr, serverUsing) {
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
            var defer = new $.Deferred();
            var fragDoneBlob;
            var ajaxDeferred = hashServer[serverUsing].sendDlAjax(addr);
		    ajaxDeferred.then(
                function(xhr) {
			    //console.log("here is one");
			        fragDoneBlob = xhr.response;
                    defer.resolve(fragDoneBlob);
		        },
                function(xhr) {
                    defer.reject();
		        }
            );
            return defer;
	    }
};