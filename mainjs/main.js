// ownServer服务器测试api：get initial.ownServer_url+/api/v1/hello
zip.workerScriptsPath = "/js/";
document.getElementById("uploadClick").addEventListener('click', onUploadHandler, false);
document.getElementById("loginSubmit").addEventListener('click', loginHandler, false);

//var xinlang = Xinlang;
//var jinshan = Jinshan;
var uploadServerList = [Xinlang, Jinshan];//上传用到的那个服务器列表;
var uploadServerName = ["Xinlang", "Jinshan"];//上传用到的那个服务器列表;

var user_current = new User();

function loginHandler(event) {
	event.stopPropagation();
    event.preventDefault();
    var deferred = new $.Deferred();
    deferred = user_current.handle_login_form();
    deferred.then(
        function(){
            fileSystem.init(user_current.user_name, user_current.authen_token);
        }
    );
    } //用户按登陆时的处理函数，待完成：(1)弹出窗出警告instead of text console，(2)考虑要不要改成div元素直接删掉和直接从零建起，而不是show和hide，提高代码的隐蔽性

function onUploadHandler(){
    event.stopPropagation();
    event.preventDefault();
    var uploadSelect = $("#uploadSelect");
    if (uploadSelect[0].files[0] === undefined) {
        Materialize.toast("you are not selecting a file!",4000);
        return;
    }
    uploadSelect.attr("disabled","");
    fileSystem.create(uploadSelect[0].files[0]);
}