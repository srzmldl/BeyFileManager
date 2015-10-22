var User = function(){
    this.authen_token = "";
    this.user_name = "";
    
    this.register = function(loginName, password) {
        var deferred = new $.Deferred();
        var ownDefer = new $.Deferred();
        var that = this;
        deferred = ownServer.user_register(loginName, password);
	    deferred.then(function(xhr) {
		    if (xhr.state == 0) {
                that.user_name = loginName;
	            that.authen_token = xhr.user.authen_token;
			    $("#loginDiv").hide();
		        $("#mainFrame").show();
		        $("nav ul > li").eq(0).removeClass("active");
			    $("nav ul > li").eq(1).addClass("active");
                ownDefer.resolve();
		    } else {
                
                if (xhr.state == -1) {
		            Materialize.toast("Register failed! user name is shorter than 3!Try again!",4000);
		        } else if (xhr.state == -2) {
			        Materialize.toast("Register failed! password is shorter than 6!Try again!",4000);
		        } else if (xhr.state == -3) {
			        Materialize.toast("Register failed! user already exist!Try again!",4000);
		        } else {
			        Materialize.toast("Register failed! Try again!",4000);
		        }
                ownDefer.reject();
            }
	    }, function(xhr) {
		    Materialize.toast("Connection failed! Try again!",4000);
		    Materialize.toast(xhr,4000);
            ownDefer.reject();
	    });
        return ownDefer;
    };

    
    this.login =  function(loginName, password){
        var deferred = new $.Deferred();
        var ownDefer = new $.Deferred();
        var that = this;
	    deferred = ownServer.user_login(loginName, password);
        deferred.then(
            function(xhr) {
                if (xhr.status == 401) {
                    Materialize.toast("login failed! try again!",4000);
                    ownDefer.reject();
		        } else {
                    that.authen_token = JSON.parse(xhr.response).user.authen_token;
                    that.user_name = loginName;
			        $("#loginDiv").hide();
			        $("#mainFrame").show();
			        $("nav ul > li").eq(0).removeClass("active");
			        $("nav ul > li").eq(1).addClass("active");
                    ownDefer.resolve();
		        }
            }
        );
        return ownDefer;
    };
    
    this.handle_login_form = function() {
	    var loginName = document.getElementById("inputName").value;
	    var password = document.getElementById("inputPassword").value;
	    if (loginName.toString().length < 3) {
		    Materialize.toast("user name is shorter than 3!Try again!", 4000);
		    return (new $.Deferred()).reject();
	    } else if (password.toString().length < 6) {
		    Materialize.toast("password is shorter than 6!Try again!", 4000);
		    return (new $.Deferred()).reject();
	    }
	    var deferred = $.Deferred();
	    var ifRegister = new Boolean();
	    if ($("input[name=loginMode]:checked").val()=="Login") {
		    return this.login(loginName, password);
	    } else if($("input[name=loginMode]:checked").val()=="Register"){
		    return this.register(loginName, password);
	    } else {
	    	Materialize.toast("please choose login or register", 4000);
	    }
    }
}