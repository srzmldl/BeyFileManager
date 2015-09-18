//api required
// sendUlAjax 上传
// sendDlAjax 下载
// evaluateValue 估值参数,请在每次进行任务时+1,任务完成-1. 上面两个过程发生错误+5.
// 暂时设计这么简单的估值参数.每个碎片会独立选择估值最小的.因为估值异步修改影响不大,暂时
// 不考虑.

var Jinshan = {
    oauth_token : "058560f25d3e696d1f2fd3b8",
    kuaipan_signature: function (url, params, method) {
        var consumer_secret = Jinshan.consumer_secret;
        var oauth_token_secret = Jinshan.oauth_token_secret;
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

    sendUlAjax: function(file, name) {
		console.log("jinshan", file, name);
		var formData = new FormData();
		formData.append("file", file, name);
		var key;
		var url = "http://p5.dfs.kuaipan.cn:8080/cdlnode/1/fileops/upload_file";
		var params = {
			oauth_consumer_key: Jinshan.oauth_consumer_key,
			oauth_token: Jinshan.oauth_token,
			oauth_signature_method: Jinshan.oauth_signature_method,
			oauth_timestamp: Math.round(new Date() / 1000).toString(),
			oauth_nonce: (Math.round(Math.random() * Math.pow(36, 10))).toString(36),
			oauth_version: Jinshan.oauth_version,
			overwrite: true,
			root: "app_folder",
			path: "" + name
		};
	    params["oauth_signature"] = Jinshan.kuaipan_signature(url, params, "POST");
		url += "?";
		for (key in params) {
			url += encodeURIComponent(key) + "=" + encodeURIComponent(params[key]) + "&";
		}
		url = url.substring(0, url.length - 1);
		var uploadAjax = $.ajax({
			url: url,
			type: "POST",
			contentType: false,
			processData: false,
			data: formData
		});
		return (uploadAjax);
	    },

    evaluateValue: 0,
        
    sendDlAjax: function(addr) {
		var ajaxDeferred = new $.Deferred();
		var url = "http://api-content.dfs.kuaipan.cn/1/fileops/download_file";
		var params = {
			oauth_consumer_key: Jinshan.oauth_consumer_key,
			oauth_token: Jinshan.oauth_token,
			oauth_signature_method: Jinshan.oauth_signature_method,
			oauth_timestamp: Math.round(new Date() / 1000).toString(),
			oauth_nonce: (Math.round(Math.random() * Math.pow(36, 10))).toString(36),
			oauth_version: Jinshan.oauth_version,
			root: "app_folder",
			path: addr //the official demo is without a "/" at the very front of addr
		};
	    params["oauth_signature"] = Jinshan.kuaipan_signature(url, params, "GET");
		url += "?";
		for (key in params) {
			url += encodeURIComponent(key) + "=" + encodeURIComponent(params[key]) + "&";
		}
		url = url.substring(0, url.length - 1);
		var downloadAjax = new XMLHttpRequest();
		downloadAjax.open("GET", url, true);
		downloadAjax.responseType = 'blob';
		downloadAjax.onload = function(event) {
			if (event.target.status == 200) {
				ajaxDeferred.resolve(event.target);
			} else {
				ajaxDeferred.reject(event.target);
			}
			console.log("loaded");
			console.log(event.target);
		};
		downloadAjax.onerror = function(event) {
			console.log("error");
			console.log(event.target);
			ajaxDeferred.reject(event.target);
		};
		downloadAjax.send();
		return ajaxDeferred;
	}
}