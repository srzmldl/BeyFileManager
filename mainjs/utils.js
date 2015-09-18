var utils = {
    kuaipan_signature: function (url, params, method) {
        var consumer_secret = initial.jinshan.consumer_secret;
        var oauth_token_secret = initial.jinshan.oauth_token_secret;
        var secret = consumer_secret + "&";
        if ("oauth_token" in params)
            secret += oauth_token_secret;
        var base = method + "&" + encodeURIComponent(url) + "&";
        var array = new Array();
        for (key in params) {
            array.push(key);
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
    },
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
                    var end = initial.BYTES_PER_CHUNK;
                    while (start < size) {
                        fragList.push({
                            index: fileNum,
                            content: blob.slice(start, end),
                            filename: file.name + "." + (fileNum++),
                            uploadedTimes: 0,
                            uploadedServer: [],
                            md5: "",
                            sha1: ""
                        });
                        start = end;
                        end = end + initial.BYTES_PER_CHUNK;
                    }
                    ;
                    console.log("the file " + file.name + "'s Compression and division complete");
                    deferred.resolve(fragList);
                }) //writer.close
            }) //writer.add
        }) //zip.createWriter
        return deferred;
    } //压缩和分块，待完成：压缩和分块处理时可以有进度（尤其是每一个文件碎片完成的时候）

}