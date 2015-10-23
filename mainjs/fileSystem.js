var downloadableList;

var fileSystem = {
    userName : "",
    authen_token : "",
    evaluateValue: 0,
    uploadProgress:{
    	totalSize:0,
    	beginTime:0,
    	endTime:0,
    	progressPoint:0,
    	lastTime:0
    },
    // initial filesystem
    init: function(name, token){ 
    	fileSystem.userName = name;
    	fileSystem.authen_token = token;
        fileSystem.getDownloadableList();
    },

    // create file or directory. TODO  directory
    create : function(file) {
	    var originalFileSha1, originalFileMd5;
	    var fragList=[];
	    var totalTime,speed;
	    fileSystem.uploadProgress.totalSize=file.size;
	    
	    var htmlcontent='<li class="collection-item avatar">';
    	htmlcontent+='<i class="material-icons circle red"></i>';
    	htmlcontent+='<span class="title">'+file.name+'<br/>file size is '+Math.round(file.size/1024/1024)+'MB.</span>';//filename
    	htmlcontent+='<p class="information">informations here</p>';
    	htmlcontent+='<p>Speed:<span class="speed">0</span>kb/s</p>';
    	htmlcontent+='<div class="row" style="margin-bottom:0;"><div class="col s2">Progress:</div><div class="progress col s10"><div class="determinate" style="width: 0%"></div></div></div>';
    	htmlcontent+='<div class="preloader-wrapper small active secondary-content"><div class="spinner-layer spinner-blue-only"><div class="circle-clipper left"><div class="circle"></div></div><div class="gap-patch"><div class="circle"></div></div><div class="circle-clipper right"><div class="circle"></div></div></div></div>';
    	$(htmlcontent).appendTo($("#uploadingList"));

	    $("#uploadingList > li:last > p.information").text("Task accepted.Now begin compression.");
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
		    $("#uploadingList > li:last > p.information").text("compression completed,now calculate hash.");
		    console.log(fragList);
		    return utils.calMd5AndSha1(fragList);
	    }).then(function(fragList) {
		    console.log("hash-computing completed,now upload.");
   		    $("#uploadingList > li:last > p.information").text("hash-computing completed,now upload.");
		    console.log(fragList);
		    fileSystem.uploadProgress.beginTime=new Date().getTime();
		    fileSystem.uploadProgress.lastTime=new Date().getTime();
		    return fileSystem.uploadManager(fragList);
	    }).then(function(fragDoneList) {
		    fileSystem.uploadProgress.endTime=new Date().getTime();
		    totalTime=(fileSystem.uploadProgress.endTime-fileSystem.uploadProgress.beginTime)/1000;
		    speed=file.size/totalTime/1024;
		    console.log("upload completed");
		    $("#uploadingList > li:last > p.information").text("The Total time is : "+totalTime+" seconds. The average speed is : "+speed+"  K/s");
		    $("#uploadingList > li:last > p.information").text("upload complete,now begin to upload message to ownServer server.");
		    console.log("now begin to upload message to ownServer server");
		    console.log(fragDoneList);
		    return (utils.upFragListToOwnServerUpList(fileSystem.authen_token, fragDoneList, fileSystem.userName, file.name, originalFileMd5, originalFileSha1));
	    }).then(function(finalUplaodInfo) {
		    return (ownServer.virfiles_create(finalUplaodInfo));
	    }).then(function(xhr) {
		    console.log(xhr);
		    $("#uploadSelect").removeAttr("disabled");
		    $("#uploadingList > li:last > p.information").text("upload finished.");
		    $("#uploadingList > li:last > .preloader-wrapper").hide();
	        }).then(fileSystem.getDownloadableList);
    },

    // upload a file
    uploadManager : function(fragList) {
        
	    var fragDoneList = []; // 传完后各个碎片的信息
	    var uploadDeferred = $.Deferred();
        var fragLeftCnt = fragList.length; //还有多少碎片要传
        //var fragArr = []; //需要传的碎片数组

        //每个碎片时一个Frag实例,独立上传
        for (var i = 0, len = fragList.length; i < len; i++){
            var fragNow = new Frag(fragList[i]);
            var deferFrag = fragNow.upload();
            deferFrag.then(
                function(fragDoneItem){
                    fragLeftCnt--; //上传成功一个碎片,待传碎片数量-1
                    fragDoneList.push(fragDoneItem); //该碎片的信息push到fragDoneList中
                    if (fragLeftCnt <= 0) //全部传完
                        uploadDeferred.resolve(fragDoneList);
                    },
                function() { uploadDeferred.reject();}
            );
        }
	    return uploadDeferred;
    },
     
    getDownloadableList : function() {
	    var deferred = ownServer.virfiles_index(fileSystem.userName, "", fileSystem.authen_token);
	    deferred.then(function(xhr) {
		    downloadableList = JSON.parse(xhr.response);
	    }).then(fileSystem.showDownloadableList);
    }, //去lsy服务器获取downloadable list，现在只是根目录，理论上应该做成递归的函数，访问所有的子文件夹  
    showDownloadableList: function() {
		var index = downloadableList.list;
		var fileIndex = $("#fileIndex");
		var fileLi;
		for (i = 0, l = index.length; i < l; i++) {
			// <li class="collection-item avatar">
			//     <i class="material-icons circle red">insert_drive_file</i>
			//     <span class="title">Title</span>
			//     <p>First Line</p>
			//     <a href="#!" class="secondary-content"><i class="material-icons">file_download</i></a>
			// </li>
			var htmlcontent='<li class="collection-item avatar">';
			htmlcontent+='<i class="material-icons circle red"></i>';
			htmlcontent+='<span class="title">'+index[i].name+'</span>';//filename
			htmlcontent+='<div class="progress" hidden>Progress <div class="determinate" style="width: 0%"></div></div>';
			htmlcontent+='<a class="secondary-content"><i class="material-icons">file_download</i></a>'+'</li>';
			fileLi = $(htmlcontent);
			if (index[i].if_file == true) {
				fileLi.find("i").text('insert_drive_file');
			} else {
				fileLi.find("i").text('folder');
			}
			fileLi.find("a").on("click", {
			name: index[i].name
		    }, fileSystem.ondownloadHandler);//给ondownloadhandler传了一个data的数据，可以用event.data访问得到
		    fileLi.appendTo(fileIndex);
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
		    var blob = new Blob(blobList);
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
       
        // fileList = [{server[], index, md5, sha1}]
        function downloadAllFrag() { //only initial all the server ajax requests
            var deferred = new $.Deferred();
            var fragLeftCnt = fileList.length;
            for (var i = 0; i < fileList.length; ++i) {
                var fragNow = new Frag(fileList[i]);
                var deferFrag = fragNow.download();
                deferFrag.then(
                    function(fragDoneBlob) {
                    fragLeftCnt--; //上传成功一个碎片,待传碎片数量-1
                    blobList[i] = fragDoneBlob;
                    if (fragLeftCnt <= 0) //全部下载完
                        deferred.resolve();
                    },
                function() { deferred.reject();}
                );
            }
	        return deferred;
        }
};