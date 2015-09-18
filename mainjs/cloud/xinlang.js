var Xinlang = {
    access_token : "01336d6662WklwB2XjPlj4ctwDY6dc89",
    oauth_token: "058560f25d3e696d1f2fd3b8",
    oauth_consumer_key: "xcBFwv9CJNIaUfO4",
    oauth_signature_method: "HMAC-SHA1",
    oauth_version: "1.0",
    consumer_secret: "BweeUfcIhh1hVgmx",
    oauth_token_secret: "810c09dc238d4f25aa4f8a24cbf9ab1e",
    
    evaluateValue: 0,
            
    sendUlAjax:  function(file, name) { // reture defer
		console.log("xinlang", file, name);
		var url = "http://upload-vdisk.sina.com.cn/2/files/sandbox/";
		url = url + encodeURIComponent(name) + "?access_token=" + Xinlang.access_token;
		var formData = new FormData();
		formData.append("file", file, name);
		var uploadAjax = $.ajax({
			url: url,
			type: "POST",
			contentType: false,
			processData: false,
			//contentType: "multipart/form-data",
			data: formData
		});
		return (uploadAjax);
	},

    sendDlAjax: function(addr) { //return defer
		var ajaxDeferred = new $.Deferred();
		var url = "https://api.weipan.cn/2/files/sandbox/";
		var access_token = Xinlang.access_token;
		url = url + encodeURI(addr) + "?access_token=" + access_token;
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