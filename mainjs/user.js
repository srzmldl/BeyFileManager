var User = function(){
    this.authen_token = "";
    this.name = "";
        
    this.register = function(loginName, password) {
        var deferred = new $.Deferred();
        var ownDefer = new $.Deferred();
        var that = this;
        deferred = ownServer.user_register(loginName, password);
	    deferred.then(function(xhr) {
		    if (xhr.state == 0) {
                that.name = loginName;
	            that.authen_token = xhr.user.authen_token;
			    $("#loginDiv").hide();
			    $("#uploadDiv").show();
		        $("#downloadDiv").show();
                ownDefer.solve();
		    } else {
                
                if (xhr.state == -1) {
		            $("#textConsole")[0].innerHTML = "Register failed!<br/>user name is shorter than 3!Try again!";
		        } else if (xhr.state == -2) {
			        $("#textConsole")[0].innerHTML = "Register failed!<br/>password is shorter than 6!Try again!";
		        } else if (xhr.state == -3) {
			        $("#textConsole")[0].innerHTML = "Register failed!<br/>user already exist!Try again!";
		        } else {
			        $("#textConsole")[0].innerHTML = "Register failed!<br/>Try again!";
		        }
                ownDefer.reject();
            }
	    }, function(xhr) {
		    $("#textConsole")[0].innerHTML = "Connection failed!<br/>Try again!";
            ownDefer.reject();
	    });
        return ownDefer;
    };

        
    this.login =  function(loginName, password){
        
        var ownDefer = new $.Deferred();
        var deferred = new $.Deferred();
        var that = this;
	    deferred = ownServer.user_login(loginName, password);
        deferred.then(
            function(xhr) {
                if (xhr.status == 401) {
                $("#textConsole")[0].innerHTML = "login failed! try again!";
                ownDefer.reject();
		        } else {
                    that.authen_token = JSON.parse(xhr.response).user.authen_token;
                    that.name = loginName;
			        $("#loginDiv").hide();
			        $("#uploadDiv").show();
		            $("#downloadDiv").show();
                    ownDefer.resolve();
		        }
            }
        );
        return ownDefer;
    };
            
    this.handle_login_form = function() {
    
	$("#textConsole")[0].innerHTML = "Text Console";
	var loginName = document.getElementById("inputName").value;
	var password = document.getElementById("inputPassword").value;
	if (loginName.toString().length < 3) {
		$("#textConsole")[0].innerHTML = "Register failed!<br/>user name is shorter than 3!Try again!";
		return;
	} else if (password.toString().length < 6) {
		$("#textConsole")[0].innerHTML = "Register failed!<br/>password is shorter than 6!Try again!";
		return;
	}

	var deferred = $.Deferred();
	var ifRegister = new Boolean();
	if ($("input[value=Login]").prop("checked") === true) {
		ifRegister = false;
	} else {
		ifRegister = true;
	}
    
    if (ifRegister) return this.register(loginName, password);
    else return this.login(loginName, password);
    }
}