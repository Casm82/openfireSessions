module.exports = function(app){
	var config = require("./settings.json")
	var checkAuth = require("./lib/checkAuthentication");
	var fork = require("child_process").fork;

	//////////////////////////////////////////////////////////////////////////////////////////
	app.get("/", function(req, res){
		if (req.session.user) { res.redirect("/app")
		} else {
			res.render("login", { title: "Вход", session: req.session });
		}
	});

	//////////////////////////////////////////////////////////////////////////////////////////
	app.post("/login", function(req, res) {
		var user = {
			username: req.body.username.toString(),
			password: req.body.password.toString(),
		};
	
		var authProc = fork(__dirname + "/lib/domainAuth.js");
		authProc.send(user);
		authProc.on("message", function(authResult) {			//	var authResult = {
			authResult.ip = req.ip;													//		"error": err,
			console.log("\nauthResult: %j", authResult);		//		"time": loginTime.toLocaleString(),
																											//		"username": username,
			if (authResult.authenticated) {									//		"authenticated": auth,
				if(authResult.authorized){										//		"authorized": isMember }
				// авторизован и есть доступ
					req.session.username = user.username;
					req.session.authorized = true;
					res.redirect("/app");
				} else {
				// авторизован, но нет в группе для доступа
					req.session.username = null;
					req.session.authorized = false;
					res.render("authError", {
							username: user.username,
							code: "notAuthorized",
							group:  config.groupName
						});
				}
			} else {
				// ошибка авторизации
				req.session.username = null;
				req.session.authorized = false;
				res.render("authError", { username: user.username, code: "notAuthenticated"});
			}
			authProc.kill();
		});
	});

	//////////////////////////////////////////////////////////////////////////////////////////
	app.get("/logout", checkAuth, function(req, res){
		console.log("logout");
		if (req.session.username) {
			req.session.destroy();
			res.redirect("/");
		}
	});
}

// vim:ts=2
