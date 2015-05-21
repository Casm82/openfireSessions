#!/bin/env node
var config = require("./settings.json"),
	express = require("express"),
	expressMiddlewares = require("express-middlewares"),
	https = require("https"),
	mongoose = require("mongoose"),
	path = require("path"),
	fs = require("fs"),
	app = express();

// Параметры HTTPS сервера
var sslcert = {
	key: fs.readFileSync(__dirname + "/cert/openfire.pem"),
	cert: fs.readFileSync(__dirname + "/cert/openfire.crt.pem") };


// Параметры Express
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");
app.set("x-powered-by", false);
app.use(expressMiddlewares.favicon());
app.use(expressMiddlewares.bodyParser());
app.use(express.static(path.join(__dirname, "static")));

var crypto = require("crypto");
//var cookieSecret = crypto.randomBytes(32).toString("base64");
var cookieSecret = "secreT";

app.use(expressMiddlewares.cookieParser(cookieSecret));

app.use(expressMiddlewares.session(
	{	secret: cookieSecret,
		cookie: { maxAge: 2592000000, secure: true }
/*		store: new expressMiddlewares({
			storage: "mongodb",
			instance: mongoose,
			host: "localhost",
			port: 27017,
			db: "openfire",
			collection: "sessions",
			expire: 604800000
			}) */
	}));


// Подключаемся к MongoDB
mongoose.connect("mongodb://localhost/openfire", function (err) {
	if (err) throw err;
	console.log("Подключились к MongoDB");
	
	// Проходим по маршрутам
	require("./1_sessions.js")(app);
	require("./2_mainApp.js")(app);
	require("./9_errorHandlers.js")(app);
	
	require("https").createServer(sslcert, app).listen(config.port, function() {
		console.log("Express сервер ожидает подключений по адресу https://" + process.env.HOSTNAME + ":" + config.port);
	});
});

// vim:ts=2
