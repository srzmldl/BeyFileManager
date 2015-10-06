var Frag = function(item) {
    this.item = item;
    this.vis = [];
    this.uploadTimeLim = 2;
    this.errorTimeLim = 2;
    var tmpFragDoneList = [];
    
    var uploadTimeLeft;
    var errorTimeLeft;
    this.upload = function() {
        var that = this;
        var len = uploadServerList.length;
        for (var i = 0; i < len; ++i)
            that.vis[i] = 0;
        uploadTimeLeft = that.uploadTimeLim;
        errorTimeLeft = that.errorTimeLim;
        var defer = new $.Deferred();
        uploadAll(that).then(
            function() {
                defer.resolve(tmpFragDoneList);
            },
            function () {
                defer.reject();
            }
        )
        return defer;    
        // setTimeout(singleUl,1000,item, serverUsing);
    }
    
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
            
        var tmp = -1;
        for (var j = 0; j < len; ++j)
            if (!that.vis[j] && (tmp < 0 || uploadServerList[j].evaluateValue < uploadServerList[tmp].evaluateValue))
                tmp = j;
        var serverUsing = uploadServerList[tmp];
		var promise = serverUsing.sendUlAjax(item.content, item.filename);
	    promise.then(function(a, b, c) {
            uploadTimeLeft--;
            tmpFragDoneList.push({})
			item.uploadedServer.push({
				panname: serverUsing,
				addr: item.filename
			});
			fragDoneList.push(item);
			console.log(a, b, c);
			server.push(serverUsing);
			ulOnce();
			return;
		}, function(a, b, c) {
			console.log(a, b, c);
			errorTimeLeft--;
			if (errorTimeLeft <= 0) {
		        console.log("Error Times:"+ that.errorTimeLim);
				console.log("errorItem", item);
			    console.log("fragDoneList",that.tmpfragDoneList);
				$("#textConsoleDiv").append("<p>Server Error.</p>");
			} else {
                uploadAll(that);
			}
			return;
		});
	}
    
    
}