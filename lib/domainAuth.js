var config = require('../settings.json');

process.on('message', function (user) {
	var username = user.username, password = user.password;

	var ActiveDirectory = require('activedirectory');
	var ad = new ActiveDirectory(config.ldapConfig);

	ad.authenticate(username + "@" + config.domain, password, function(err, auth) {
		var loginTime = new Date();
		var authResult = {
			"error": err,
			"time": loginTime.toLocaleString(),
			"username": username,
			"authenticated": auth,
			"authorized": false
		};
	
		if (err) { process.send(authResult); return; }
	
		if (auth) {
			ad.isUserMemberOf(username, config.groupName, function(err, isMember) {
				if (err) throw err;
				authResult.authorized=isMember;
				process.send(authResult);
			});
		} else {
			console.log('Authentication failed! %j %j', user, authResult);
			process.send(authResult);
		}
	});
})
