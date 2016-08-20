var config = require("../settings.json");
var async = require("async");
var tidy = require("htmltidy").tidy;
var htmlParse = require("./htmlparse");
var spawn = require("child_process").spawn;

process.on("message", function (updReq) {
  var curlCmd = "/bin/sh";
  var curlGetArgs = ["-c", `curl -sk ${config.openfireConf.url}/login.jsp --cookie-jar /tmp/openfire.cookie.txt` ];
  var curlPostArgs = ["-c", `curl -skL ${config.openfireConf.url}/login.jsp --data 'url=%2Fsession-summary.jsp?range=${config.openfireConf.limit}&login=true&username=${config.openfireConf.login}&password=${config.openfireConf.password}' --cookie /tmp/openfire.cookie.txt`];

  async.waterfall([
    // Получаем сессионный cookie
    function(callback){
      //console.log(curlGetArgs);
      var curlGet = spawn(curlCmd, curlGetArgs);
      var error = null;

      curlGet.stderr.on("data", function (data) {
        console.log("stderr: " + data);
        error = data.toString();
      });

      curlGet.on("close", function (code) {
        callback(error);
      });

    },
    // Получаем статистику сессий с помощью curl
    function(callback){
      //console.log(curlPostArgs);
      var curlPost = spawn(curlCmd, curlPostArgs);
      var rawHtml = "";
      var error = null;

      curlPost.stdout.on('data', function (data) {
        rawHtml += data.toString();
      });

      curlPost.stderr.on("data", function (data) {
        console.log("stderr: " + data);
        error = data.toString();
      });

      curlPost.on("close", function (code) {
        callback(error, rawHtml);
      });
    },
    // Приводим HTML вывод curl к стандарту W3C
    function (rawHtml, callback) {
      tidy(rawHtml, function(err, normHtml) {
        callback(err, normHtml);
      })
    },
    // Преобразуем Html в объект json
    function (normHtml, callback) {
      callback(null, htmlParse(normHtml));
    }
    ],
    function(err, sessions) {
      if (err) { process.send({"err": err,  "sessions": null })
       } else  { process.send({"err": null, "sessions": sessions }) }
    }
  ); // <--- waterfall
});
