#!/bin/env node
var config = require("./settings.json");
var express = require("express");
var middlewares = require("express-middlewares");
var session = require("express-session");
var MongoDBStore = require('connect-mongodb-session')(session);
var https = require("https");
var mongoose = require("mongoose");
var path = require("path");
var fs = require("fs");
var app = express();
var passport = require("passport");
var passportSetup = require("./lib/passportSetup");

// Параметры HTTPS сервера
var sslcert = {
  key:  fs.readFileSync('./cert/key.pem'),
  cert: fs.readFileSync('./cert/cert.pem')
};

// Параметры Express
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.set("x-powered-by", false);
app.use(middlewares.favicon(__dirname + "/static/images/favicon.png"));
app.use(middlewares.bodyParser());
app.use(express.static(path.join(__dirname, "static")));

//var crypto = require("crypto");
//var cookieSecret = crypto.randomBytes(32).toString("base64");
var cookieSecret = "63ziAxBGEKGxne0u4qsaOV4/5sAExVOZyAeOdHMYHIE=";

app.use(middlewares.cookieParser(cookieSecret));

var store = new MongoDBStore({
  uri: config.mongoConnection,
  collection: 'sessions'
});

app.use(session({
  "secret": cookieSecret,
  "name":   "of.sid",
  "resave":  false,
  "saveUninitialized": false,
  "cookie": { maxAge: 2592000000, secure: true },
  "store":  store
}));

app.use(passport.initialize());
app.use(passport.session());

// Подключаемся к MongoDB
mongoose.connect(config.mongoConnection, function (err) {
  if (err) throw err;
  console.log("Подключились к MongoDB");

  passportSetup(passport);

  // Проходим по маршрутам
  require("./1_sessions.js")(app, passport);
  require("./2_mainApp.js")(app);
  require("./9_errorHandlers.js")(app);

  https.createServer(sslcert, app).listen(config.port, function() {
    console.log("Express сервер ожидает подключений по адресу https://" + process.env.HOSTNAME + ":" + config.port);
  });
});
