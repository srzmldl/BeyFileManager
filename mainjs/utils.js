var utils = {
    
    BYTES_PER_CHUNK: 2 * 1024 * 1024, //每一个文件碎片大小的设置
    md5Calculator: function (file) {
        var md5Deferred = $.Deferred();
        //	var file = $("#uploadSelect")[0].files[0];
        //  file should be a File Object got by input element
        var worker = new Worker("./js/calculator.worker.md5.js");
        var blob = new Blob();
        worker.addEventListener("message", function (event) {
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
        var handle_hash_block = function (event) {
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
        var handle_load_block = function (event) {
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
    sha1Calculator: function (file) {
        var sha1Deferred = new $.Deferred();
        var worker, reader, i, buffer_size, block, blob, handle_hash_block, handle_load_block;
        var max_crypto_file_size = 500 * 1024 * 1024;
        if (file.size < max_crypto_file_size) {
            var reader = new FileReader();
            reader.onload = function (event) {
                var data = event.target.result;
                window.crypto.subtle.digest({
                    name: "SHA-1"
                }, data)
                    .then(function (hash) {
                        var hexString = '',
                            hashResult = new Uint8Array(hash);
                        for (var i = 0; i < hashResult.length; i++) {
                            hexString += ("00" + hashResult[i].toString(16)).slice(-2);
                        }
                        console.log("SHA1:", hexString);
                        sha1Deferred.resolve(hexString);
                    })
                    .catch(function (error) {
                        console.error(error);
                        sha1Deferred.reject(error);
                    });
            };
            reader.readAsArrayBuffer(file);
        } else {
            worker = new Worker('/js/calculator.worker.sha1.js');
            worker.addEventListener('message', function (event) {
                if (event.data.result) {
                    console.log("SHA1:", event.data.result);
                    worker.terminate();
                    sha1Deferred.resolve(event.data.result);
                }
            });
            handle_load_block = function (event) {
                worker.postMessage({
                    'message': event.target.result,
                    'block': block
                });
            };
            handle_hash_block = function (event) {
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
    calMd5AndSha1: function (fragList) {
        var i;
        var allDeferred = [],
            deferred;

        function calMd5AndStore(index) {
            return (utils.md5Calculator(fragList[index].content).then(function (md5) {
                fragList[index]["md5"] = md5;
            }));
        }

        function calSha1AndStore(index) {
            return (utils.md5Calculator(fragList[index].content).then(function (sha1) {
                fragList[index]["sha1"] = sha1;
            }));
        }

        for (i = 0; i < fragList.length; i++) {
            //计算每个碎片的MD5码
            allDeferred.push(calMd5AndStore(i));
            allDeferred.push(calSha1AndStore(i));
        }
        deferred = $.when.apply(this, allDeferred).then(function () {
            return (fragList);
        });
        return deferred;
    }, //算所有文件碎片的hash值，这里也可以有进度，理由同上
    compressionAndDivision: function (file, fragList) {
        var deferred = new $.Deferred();
        zip.createWriter(new zip.BlobWriter(), function (writer) {
            writer.add(file.name, new zip.BlobReader(file), function () {
                writer.close(function (blob) {
                    var size = file.size;
                    var start = 0;
                    var fileNum = 0;
                    var end = utils.BYTES_PER_CHUNK;
                    while (start < size) {
                        fragList.push({
                            index: fileNum,
                            content: blob.slice(start, end),
                            filename: file.name + "." + (fileNum++),
                            uploadedServer: [],
                            md5: "",
                            sha1: ""
                        });
                        start = end;
                        end = end + utils.BYTES_PER_CHUNK;
                    }
                    ;
                    console.log("the file " + file.name + "'s Compression and division complete");
                    deferred.resolve(fragList);
                }) //writer.close
            }) //writer.add
        }) //zip.createWriter
        return deferred;
    }, //压缩和分块，待完成：压缩和分块处理时可以有进度（尤其是每一个文件碎片完成的时候）
    
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
            for (k = 0; k < finishedList.uploadedServer.length; ++k)
				finalUplaodInfo.frag_arr[j] = {};
		        finalUplaodInfo.frag_arr[j].addr = finishedList[i].uploadedServer[k].addr;
				finalUplaodInfo.frag_arr[j].server_name = finishedList[i].uploadedServer[k].panname;
				finalUplaodInfo.frag_arr[j].index = finishedList[i].index;
				finalUplaodInfo.frag_arr[j].sha1 = finishedList[i].sha1;
			    finalUplaodInfo.frag_arr[j].md5 = finishedList[i].md5;
                ++j;
		}
		finalUplaodInfo.authen_token = authen_token;
		return finalUplaodInfo;
	}//上传成功后的list to 用于传给ownServer服务器的list
}