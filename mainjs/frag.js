var Frag = function(item) {
        this.item = item;
        this.vis = [];
        
        this.upload = function(){
            var that = this;
            var len = uploadServerList.length;
            for (var i = 0; i < len; ++i)
                that.vis[i] = 0;
            var defer = new $.Deferred();
            
        }
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
        
    setTimeout(singleUl,1000,item, serverUsing);
    
}