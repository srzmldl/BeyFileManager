var Frag = function(item) {
    this.item = item;
    this.vis = [];
    this.uploadTimeLim = 1;
    this.errorTimeLim = 2;

    var fragDoneItem;
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
        fragDoneItem = item;
        uploadAll(that).then(
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
        var len = uploadServerList.length;
        for (var j = 0; j < len; ++j)
            if (!that.vis[j] && (tmp < 0 || uploadServerList[j].evaluateValue < uploadServerList[tmp].evaluateValue))
                tmp = j;
        var serverUsing = uploadServerList[tmp];
		var promise = serverUsing.sendUlAjax(item.content, item.filename);
	    promise.then(function(a, b, c) {
            uploadTimeLeft--;
            fragDoneItem.uploadedServer.push({
		        panname: uploadServerName[tmp],
				addr: item.filename
			});
            that.vis[tmp] = 1;
		    console.log(a, b, c);
            if (uploadTimeLeft <= 0) defer.resolve();
            else {
                uploadAll(that).then(
                    function() {defer.resolve();},
                    function() {defer.reject();}
                );
            }
		}, function(a, b, c) {
			console.log(a, b, c);
			errorTimeLeft--;
			if (errorTimeLeft <= 0) {
		        console.log("Error Times:"+ that.errorTimeLim);
				console.log("errorItem", item);
			    console.log("fragDoneList",that.tmpfragDoneList);
			    $("#textConsoleDiv").append("<p>Server Error.</p>");
                defer.reject();
			} else {
                uploadAll(that).then(
                    function() {defer.resolve();},
                    function() {defer.reject();}
                );
			}
		});
        return defer;
	}
    
    
}