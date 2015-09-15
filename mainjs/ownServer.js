var ownServer = {
    
    url_base  : "http://222.195.92.170:3000" ,
	user_show :  function(name, authen_token) {
		// show the profile by token and user_name after verify.
		// 400 for error name & 403 for error token
        var url =  this.url_base +"/api/v1/users/profile";
		var params = {
			"show_user": {
				"name": "",
				"authen_token": ""
			}
		};
		params.show_user.name = name;
		params.show_user.authen_token = authen_token;
		var deferred = new $.Deferred();
		var xhr = new XMLHttpRequest();
		xhr.open("POST", url, true);
		xhr.setRequestHeader("Content-Type", "application/json");
		var formData = JSON.stringify(params);
		xhr.onload = function(event) {
			deferred.resolve(event.target);
		}
		xhr.send(formData);
		return deferred;
	},

	user_register: function(name, password) {
		//- register a new user
		//  * Meaning of state:
		//    + -1  |name| < 3
		//    + -2  |password| < 6
		//    + -3 user already exist.
		//    + 0 no error
    var url =  this.url_base +"/api/v1/users";
		var params = {
			"register_user": {
				"name": "",
				"password": ""
			}
		};
		params.register_user.name = name;
		params.register_user.password = password;
		var deferred = new $.Deferred();
		var xhr = new XMLHttpRequest();
		xhr.open("POST", url, true);
		xhr.setRequestHeader("Content-Type", "application/json");
		var formData = JSON.stringify(params);
		xhr.onload = function(event) {
			if (event.target.status == 200) {
				deferred.resolve(JSON.parse(event.target.response));
			} else {
				deferred.reject(e.status + " : " + e.statusText);
			}
		}
		xhr.send(formData);
		return deferred;
	},

	user_login: function(name, password) {
		//- login and get user information & token
		//- 401 error if login fail
    var url = this.url_base +"/api/v1/sessions";
		var params = {
			"user": {
				"name": "",
				"password": ""
			}
		};
		params.user.name = name;
		params.user.password = password;
		var deferred = new $.Deferred();
		var xhr = new XMLHttpRequest();
		xhr.open("POST", url, true);
		xhr.setRequestHeader("Content-Type", "application/json");
		var formData = JSON.stringify(params);
		xhr.onload = function(event) {
			deferred.resolve(event.target);
		}
		xhr.send(formData);
		return deferred;
	},

	virfiles_index: function(user_name, path, authen_token) {
		//- list files and directory in :path of :user_name
		// if path is root, path = ""
		var deferred = new $.Deferred();
		    var url =  this.url_base +"/api/v1/virfiles/index";
		var params = {
			"abs_path": {
				"user_name": "",
				"path": ""
			},
			"authen_token": ""
		};
		params.abs_path.user_name = user_name;
		params.abs_path.path = path;
		params.authen_token = authen_token;
		var xhr = new XMLHttpRequest();
		xhr.open("POST", url, true);
		xhr.setRequestHeader("Content-Type", "application/json");
		var formData = JSON.stringify(params);
		xhr.onload = function(event) {
			deferred.resolve(event.target);
		}
		xhr.send(formData);
		return deferred;
	},

	virfiles_create: function(params) {
        var url =  this.url_base +"/api/v1/virfiles";
		//params e.g. 

		//1. file
		/*{
		 "abs_path": {
		 "user_name": "test00",
		 "path": ""
		 },
		 "file_inf": {
		 "name": "ff2",
		 "frag_num": 2,
		 "if_file": true,
		 "file_sha1": "123",
		 "file_md5": "123"
		 },
		 "frag_arr": [{
		 "addr": "www/baidu/com",
		 "index": 1,
		 "sha1": "123",
		 "md5": "123",
		 "server_name": "xinlang"
		 }, {
		 "addr": "www.google.com",
		 "index": 2,
		 "sha1": "123",
		 "md5": "123",
		 "server_name": "xinlang"
		 }],
		 "authen_token": "Q0ksIastifLXxNU4aAzh/o09RWzy1lVESvcTHYdLaIfWywUW5PtbeikEoPVO2+z5GzJpCUSxqudEfCtTulRWYg=="
		 }*/

		//2. dictionary
		/*{
		 "abs_path": {
		 "user_name": "test00",
		 "path": ""
		 },
		 "file_inf": {
		 "name": "firstd1",
		 "frag_num": 0,
		 "if_file": false
		 },
		 "authen_token": "50z7tPyBiKomBRd5i5iTdMG4QKZlZ3cT0qgVQWRoq49bwj52nW4dvhd0zJ4xbVT587Qx6mGOAUiBbzA8RNh67w=="
		 }*/
		var deferred = new $.Deferred();
		var xhr = new XMLHttpRequest();
		xhr.open("POST", url, true);
		xhr.setRequestHeader("Content-Type", "application/json");
		var formData = JSON.stringify(params);
		xhr.onload = function(event) {
			deferred.resolve(event.target);
		}
		xhr.send(formData);
		return deferred;
	},

	virfiles_show: function(user_name, path, authen_token) {
		//- show all the frag of :path
        var url =  this.url_base+"/api/v1/virfiles/show";
		var params = {
			"abs_path": {
				"user_name": "",
				"path": ""
			},
			"authen_token": ""
		};
		params.abs_path.user_name = user_name;
		params.abs_path.path = path;
		params.authen_token = authen_token;
		var deferred = new $.Deferred();
		var xhr = new XMLHttpRequest();
		xhr.open("POST", url, true);
		xhr.setRequestHeader("Content-Type", "application/json");
		var formData = JSON.stringify(params);
		xhr.onload = function(event) {
			deferred.resolve(event.target);
		}
		xhr.send(formData);
		return deferred;
	},

	virfiles_delete: function(user_name, path, authen_token) {
		//- delete :path of :user_name
        var url = this.url_base+"/api/v1/virfiles/delete";
		var params = {
			"abs_path": {
				"user_name": "",
				"path": ""
			},
			"authen_token": ""
		};
		params.abs_path.user_name = user_name;
		params.abs_path.path = path;
		params.authen_token = authen_token;
		var xhr = new XMLHttpRequest();
		xhr.open("DELETE", url, true);
		xhr.setRequestHeader("Content-Type", "application/json");
		var formData = JSON.stringify(params);
		xhr.onload = function(event) {
			deferred.resolve(event.target);
		}
		xhr.send(formData);
		return deferred;
	}
}