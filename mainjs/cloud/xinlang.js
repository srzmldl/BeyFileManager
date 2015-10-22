var Xinlang = {
    access_token : "7ac9546662WklwB2XjPlj4ctwDY54db9",
    evaluateValue: 0,
            
    sendUlAjax:  function(file, name) { // reture defer
    	Xinlang.evaluateValue += 1;
		console.log("xinlang", file, name);
		var url = "http://upload-vdisk.sina.com.cn/2/files/sandbox/";
		url = url + encodeURIComponent(name) + "?access_token=" + Xinlang.access_token;
		var formData = new FormData();
		formData.append("file", file, name);
		var deferred=new $.Deferred();
		var xhr=new XMLHttpRequest();
		xhr.open("POST",url,true);
		xhr.onload=function(event){
			console.log(event.target);
			if (event.target.status == 200) {
				Xinlang.evaluateValue -= 1;
				deferred.resolve(event.target);
			} else {
				Xinlang.evaluateValue += 5;
				deferred.reject(event.target);
			}
		}
		xhr.onerror=function(event){
			console.log(event);
			Xinlang.evaluateValue += 5;
			deferred.reject(event.target);
		}
		xhr.send(formData); 
		return deferred;
	},

    sendDlAjax: function(addr) { //return defer
    	Xinlang.evaluateValue += 1;
		var ajaxDeferred = new $.Deferred();
		var url = "https://api.weipan.cn/2/files/sandbox/";
		var access_token = Xinlang.access_token;
		url = url + encodeURI(addr) + "?access_token=" + access_token;
		var downloadAjax = new XMLHttpRequest();
		downloadAjax.open("GET", url, true);
		downloadAjax.responseType = 'blob';
		downloadAjax.onload = function(event) {
			if (event.target.status == 200) {
				Xinlang.evaluateValue -= 1;
				ajaxDeferred.resolve(event.target);
			} else {
				Xinlang.evaluateValue += 5;
				ajaxDeferred.reject(event.target);
			}
			console.log("loaded");
			console.log(event.target);
		};
		downloadAjax.onerror = function(event) {
			Xinlang.evaluateValue += 5;
			console.log("error");
			console.log(event.target);
			ajaxDeferred.reject(event.target);
		};
		downloadAjax.send();
		return ajaxDeferred;
	}
}