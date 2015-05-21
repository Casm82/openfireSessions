module.exports = function (req, res, next) {
	if (! (req.session.username && req.session.authorized)) {
		if (req.ip.match(/127\.0\.0\.1/)) { next ()
		} else {
				res.render("authError", {code: "notLoggedIn"});
		}
	} else {
		next();
	}
}
