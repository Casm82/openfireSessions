var config = require("../settings.json");
var async = require("async");
var tidy = require("htmltidy").tidy;
var htmlParse = require("./htmlparse");
var spawn = require("child_process").spawn;

process.on("message", function (updReq) {
	var curlCmd = "/bin/sh";
	var curlArgs = ["-c", "curl -skL " + config.openfireConf.url + "/login.jsp --data \"url=%2Fsession-summary.jsp?range=" + config.openfireConf.limit + "&login=true&username=" + config.openfireConf.login + "&password=" + config.openfireConf.password + "\""];
	
	async.waterfall([
		// Получаем статистику сессий с помощью curl
		function(callback){
			var curlReq = spawn(curlCmd, curlArgs);
			var rawHtml = "";
			
			curlReq.stdout.on('data', function (data) {
				rawHtml += data.toString();
			});
	
			curlReq.stderr.on("data", function (data) {
				console.log("stderr: " + data);
				callback(data.toString());
			});
	
			curlReq.on("close", function (code) {
				//console.log("curl process exited with code " + code);
				callback(null, rawHtml);
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
