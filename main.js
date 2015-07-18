
var b64Encode=function( str ) {
  return btoa(unescape(encodeURIComponent( str )));
}

var b64Decode=function( str ) {
  return decodeURIComponent(escape(atob( str )));
}

var tokenManager={};
tokenManager.vdiskToken={appkey:'2708795085',
	appsecret:'533acb3c8a63082e923f6c80553f8b45',
	redirect_uri:'http://home.ustc.edu.cn/~dq620/',
	display:'popup',
	getTokenUrl:"https://auth.sina.com.cn/oauth2/authorize?client_id=%s&redirect_uri=%s&display=%s",
	getOrRefreshTokenUrl:'https://auth.sina.com.cn/oauth2/access_token'};
tokenManager.kdiskToken={consumer_key:'xcBFwv9CJNIaUfO4',
	consumer_secret:'BweeUfcIhh1hVgmx',
	token:'96158d64015d45dfb7782595ccdc535d',
	signature_method:"HMAC-SHA1",
	token_secret:'07a37bbef8414be9ad23dc2918aedb19'};
tokenManager.qiniuToken={
	access_key:'hJOewyQ8zdpUxbAYFDPbASnYbIS_2_VansAnW3K1',
	secret_key:'CY4lEJ3fryp2eh9GYc6Ic686DRzy29qC6XWcIptd',
	bucket_name:'benjamin',
	bucket_domain:'http://7xjd7x.com1.z0.glb.clouddn.com/test.mp3'};

var availableServer=["sina","kdisk","qiniu","googledrive","onedrive","dropbox"];


function getHandlerByAJAX(url,parameters,callback) {
	var getXHR = new XMLHttpRequest();
	var i;
	url=url+"?";
	for(i in parameters){
		url+=(encodeURIComponent(i)+"="+encodeURIComponent(parameters[i])+"&");
	}
	getXHR.onreadystatechange = callback;
	getXHR.open("GET",url,true)
	getXHR.send();
}

function postHandlerByAJAX(url,parameters,file){
	var postXHR = new XMLHttpRequest();
	postXHR.open("POST",url,true);
	postXHR.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	postXHR.onreadystatechange=callback;
	postXHR.send(DataForm);
}


var availableServerCounter=2;
document.getElementById("uploadClick").addEventListener('click', onUploadHandler, false);
var onUploadHandler=function(){
	var files=document.getElementById("uploadSelect").files;
	var xhr=new XMLHttpRequest();
	xhr.open("POST","http://upload-vdisk.sina.com.cn/2/files/sandbox/"+files[0].name+"?"+"access_token=13faf46652WklwB1f6c9foPXfFf4faed",true)
	xhr.onreadystatechange=function(){
		if(xhr.readyState===4){
			document.getElementById("text_console").innerText=xhr.responseText;
		}
	};
//	xhr.setRequestHeader("Content-Type","multipart/form-data");
	var formData = new FormData();
	formData.append('file', files[0]);
	xhr.send(formData);	
}
