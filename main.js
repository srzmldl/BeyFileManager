zip.workerScriptsPath = "/js/";

function kuaipan_signature(url, params, method) {
	var consumer_secret = 'BweeUfcIhh1hVgmx'
	var oauth_token_secret = '7f27aa8a90bd494bad148411cfeaf254'
	var secret = consumer_secret + "&";
	if ("oauth_token" in params)
		secret += oauth_token_secret;
	var base = method + "&" + encodeURIComponent(url) + "&";
	var array = new Array();
	for (key in params) {
		array.push(key)
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
}



function md5Calculator(j, file) {
	var md5Promise = $.Deferred();
	//	var file = $("#uploadSelect")[0].files[0];
	//  file should be a File Object got by input element
	var worker = new Worker("./js/calculator.worker.md5.js");
	worker.addEventListener("message", function(event) {
		if (event.data.result) {
			console.log("md5:", event.data.result);
			md5Promise.resolve(j, event.data.result);
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
	var blob = file.slice(block.start, block.end);
	reader.readAsArrayBuffer(blob);
	return md5Promise;
}

function sha1Calculator(j, file) {
	var sha1Promise = new $.Deferred();
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
					sha1Promise.resolve(j, hexString);
				})
				.catch(function(error) {
					console.error(error);
					sha1Promise.reject(error);
				});
		};
		reader.readAsArrayBuffer(file);
	} else {
		worker = new Worker('/js/calculator.worker.sha1.js');
		worker.addEventListener('message', function(event) {
			if (event.data.result) {
				console.log("SHA1:", event.data.result);
				sha1Promise.resolve(j, event.data.result);
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
	return sha1Promise;
}

function calculateMd5AndSha1(	) {
	var i;
	var tempMd5Promise = [],
		tempSha1Promise = [],
		tempPromise = [],
		wholePromise;
	for (i = 0; i < fragmentsList.length; i++) {
		//计算每个碎片的MD5码
		tempMd5Promise[i] = md5Calculator(i, fragmentsList[i].fragment);
		tempSha1Promise[i] = sha1Calculator(i, fragmentsList[i].fragment);
		tempPromise.push($.when(tempMd5Promise[i], tempSha1Promise[i]).then(function(arg1, arg2) {
			fragmentsList[arg1[0]]["originalMd5"] = arg1[1];
			fragmentsList[arg2[0]]["originalSha1"] = arg2[1];
		}));
	}
	wholePromise = $.when.apply(this, tempPromise);
	return wholePromise;
}

document.getElementById("uploadClick").addEventListener('click', onUploadHandler, false);
var fragmentsList = [];
var fragmentsFinishedList = [];

function onUploadHandler() {
	var uploadSelect = document.getElementById("uploadSelect");
	uploadSelect.disable = true;
	var file = uploadSelect.files[0];
	compressionAndDivision(file, fragmentsList).then(function() {
			console.log("compression completed,now calculate hash.");
			calculateMd5AndSha1();
		}).then(function() {
			console.log("hash-computing completed,now upload.");
			uploadManager();
		}).then(function() {
			console.log("upload completed");
		});

}


function compressionAndDivision(file, fragmentsList) {
	var compressionDeferred = new $.Deferred();
	zip.createWriter(new zip.BlobWriter(), function(writer) {
			writer.add(file.name, new zip.BlobReader(file), function() {
					writer.close(function(blob) {
							var size = file.size;
							var start = 0;
							var fileNum = 0;
							const BYTES_PER_CHUNK = 2 * 1024 * 1024;
							var end = BYTES_PER_CHUNK;
							while (start < size) {
								fragmentsList.push({
									fileNum: fileNum,
									fragment: blob.slice(start, end),
									filename: file.name + "." + (fileNum++),
									uploadedTimes: 0,
									uploadedServer: [],
									originalMd5: "0",
									originalSha1: "0"
								});
								start = end;
								end = end + BYTES_PER_CHUNK;
							};
							console.log("the file " + file.name + "'s Compression and division complete");
							compressionDeferred.resolve();
						}) //writer.close
				}) //writer.add
		}) //zip.createWriter
	return compressionDeferred;
}

function uploadManager() {
	var server = ["xinlang", "xinlang", "jinshan", "jinshan"]
	var running = 0;
	var limit = 4;
	var count = 0;
	var fragmentsListlength = fragmentsList.length;
	var formAAjax = {
		"xinlang": function(file, name) {
			var url = "http://upload-vdisk.sina.com.cn/2/files/sandbox/testing728/";
			var access_token = "9aeb056662WklwB2XjPlj4ctwDY05d5f";
			var true_url = url + name + "?access_token=" + access_token;
			var formData = new FormData();
			formData.append("file", file);
			var uploadAjax = $.ajax({
				url: url,
				contentType: false,
				processData: false,
				type: "POST",
				contentType: "multipart/form-data",
				data: formData
			});
			return (uploadAjax);
		},

		"jinshan": function(file, name) {
			var formData = new FormData();
			formData.append("file", file, name);
			var key;
			var url = "http://p5.dfs.kuaipan.cn:8080/cdlnode/1/fileops/upload_file?";
			var params = {
				oauth_consumer_key: 'xcBFwv9CJNIaUfO4',
				oauth_token: '058560f25d3e696d5a00dc90',
				oauth_signature_method: "HMAC-SHA1",
				oauth_timestamp: Math.round(new Date() / 1000).toString(),
				oauth_nonce: (Math.round(Math.random() * Math.pow(36, 10))).toString(36),
				oauth_version: "1.0",
				root: "app_folder",
				path: "/testing728/" + name
			};
			params["oauth_signature"] = kuaipan_signature(url, params, "POST");
			for (key in params) {
				url += encodeURIComponent(key) + "=" + encodeURIComponent(params[key]) + "&";
			}
			url = url.substring(0, url.length - 1);
			var uploadAjax = $.ajax({
				url: url,
				contentType: false,
				processData: false,
				type: "POST",
				contentType: "multipart/form-data",
				data: formData
			});
			return (uploadAjax);
		}
	};
	var uploadDeferred = $.Deferred();

	function singleUploadRequest(item, serverUsing) {
		// fragmentsList.push({
		// 	fragment: blob.slice(start, end),
		// 	filename: file.name + "." + (fileNum++),
		// 	uploadedTimes: 0,
		// 	originalMd5: "0",
		// 	originalSha1: "0"
		// });
		var promise = formAAjax[serverUsing](item.fragment, item.filename);
		promise.then(function(a, b, c) {
			item.uploadedTimes++;
			item.uploadedServer.push(serverUsing);
			fragmentsFinishedList.push(item);
			console.log(a, b, c);
			running--;
			server.push(serverUsing);
			uploadOnce();
			return;
		});
	}

	function uploadOnce() {
		while (running < limit && fragmentsList.length > 0) {
			var item = fragmentsList.shift();
			var serverUsing = server.shift();
			singleUploadRequest(item, serverUsing);
			running++;
		}
		if (fragmentsList.length === 0 & fragmentsFinishedList.length === fragmentsListlength) {
			uploadDeferred.resolve();
		}
	}

	uploadOnce();

	return uploadDeferred;
}