"use strict";
var fs = require("fs");
var pug = require("pug");
var async = require("async");
var fork = require("child_process").fork;
var models = require("./models");
var config = require("./settings.json");
var checkAuth = require("./lib/checkAuth");

module.exports = function(app){

  ////////////////////////////////////////////////////////////////////////////////
  app.get("/", checkAuth, function(req, res) {
    let sAMAccountName;
    if (req.user && req.user.displayName) {
      sAMAccountName = req.user.displayName;
    } else {
      if (req.session && req.session.username) sAMAccountName = req.session.username;
    };
    res.render("app", {
      "title":    "База данных подключений к Openfire",
      "session":  sAMAccountName,
      "authType": req.session.authType
    });
  });

  ////////////////////////////////////////////////////////////////////////////////
  app.get("/app", checkAuth, function(req, res) {
    res.redirect("/");
  });

  ////////////////////////////////////////////////////////////////////////////////
  app.post("/search", checkAuth, function(req, res) {
    let sAMAccountName;
    if (req.user && req.user.displayName) {
      sAMAccountName = req.user.displayName;
    } else {
      if (req.session && req.session.username) sAMAccountName = req.session.username;
    };

    let query = {
      "username" : req.body.username.trim(),
      "hostname" : req.body.hostname.trim(),
      "ip" :       req.body.ip.trim()
    };

    let logEntry = {
      "user":  sAMAccountName,
      "ts":    new Date().toLocaleString(),
      "query": query,
    };

    fs.appendFile(config.searchLog, JSON.stringify(logEntry) + "\n");

    // поиск по логину
    if (query.username && !query.hostname && !query.ip) {
      var search = {"_id": { "$regex": new RegExp(query.username) }}
    };
    // поиск по имени компьютера
    if (!query.username && query.hostname && !query.ip) {
      var search = {"resources.hostname": { "$regex": new RegExp(query.hostname, "i") }}
    };
    // поиск по ip
    if (!query.username && !query.hostname && query.ip) {
      var search = {"resources.ip": { "$regex": new RegExp(query.ip) }}
    };
    // поиск по логину и имени компьютера
    if (query.username && query.hostname && !query.ip) {
      var search = {
        "_id": { "$regex": new RegExp(query.username)},
        "resources.hostname": { "$regex": new RegExp(query.hostname, "i") }
      }
    };
    // поиск по логину и ip
    if (query.username && !query.hostname && query.ip) {
      var search = {
        "_id": { "$regex": new RegExp(query.username)},
        "resources.ip": { "$regex": new RegExp(query.ip) }
      }
    };
    // поиск по имени компьютера и ip
    if (!query.username && query.hostname && query.ip) {
      var search = {
        "resources.hostname": { "$regex": new RegExp(query.hostname, "i") },
        "resources.ip": { "$regex": new RegExp(query.ip) }
      }
    };
    // поиск по логину, имени компьютера и ip
    if (query.username && query.hostname && query.ip) {
      var search = {
        "_id": { "$regex": new RegExp(query.username)},
        "resources.hostname": { "$regex": new RegExp(query.hostname, "i") },
        "resources.ip": { "$regex": new RegExp(query.ip) }
      }
    };
    models.PCModel.find(search).sort({"_id": 1}).
      exec(function(err, records){
        var html = pug.renderFile(__dirname + "/views/elmSearch.pug", {"cursor": records});
        res.status(200).send(html);
      })
  });

  ////////////////////////////////////////////////////////////////////////////////
  app.post("/update", checkAuth, function(req, res) {
    var updReq = req.body;
    var querySessions = fork(__dirname + "/lib/querySessions.js");
    querySessions.send(updReq);

    querySessions.on("message", function(queryRes){
      if (queryRes.err) {
        res.status(200).send("Ошибка")
      } else {
        async.waterfall([
          // Получаем существующий отчёт
          function (callback) {
            models.PCModel.find({}, function(err, dbReport) {
              if (err) {callback(err) } else { callback(null, dbReport) };
            })
          },
          // Объединяем отчёты
          function (dbReport, callback) {
            // Функция сохраняет объединённый отчёт
            function saveSess(loginHTML, mongoRec) {
              models.PCModel.findByIdAndUpdate({"_id": loginHTML},
                { $set: { "resources": mongoRec }},
                { "upsert": true },
                function(err, updatedDoc) {
                  if (err) { callback(err) };
                }
              );
            }

            for ( let loginHTML in queryRes.sessions) { // для каждого пользователя из Openfire
              var liveSess = queryRes.sessions[loginHTML];  // массив сессий из Openfire
              // объединяем сессии
              dbReport.forEach(function(dbRecord){  // для каждого пользователя из БД
                var dbSess = dbRecord.resources;    // массив сессий пользователя из БД
                if (loginHTML == dbRecord["_id"]) {
                  for (var i=0; i < liveSess.length; i++) { // для каждой сессии Openfire
                    for (var j=0; j < dbSess.length; j++) { // проверяем сессии из БД
                      // Ищём хост из БД в текущих сессиях
                      var dbMatchLive = false;
                      for (var n=0; n < liveSess.length; n++) {
                        dbMatchLive += (dbSess[j].hostname == liveSess[n].hostname);
                      }
                      if (!dbMatchLive) {
                        liveSess = liveSess.concat(dbSess[j]);
                      }
                    }
                  } // for i,j

                } // для совпадающих логинов
              })  // dbReport.forEach

              saveSess(loginHTML, liveSess);
            } // для каждого пользователя из Openfire
            callback(null);
          }
          ],
          function (err, result) {
            if (err) { res.status(200).send("Ошибка")
              } else { res.status(200).send("Обновлено") }
            querySessions.kill("SIGTERM");
          }
        );  // waterfall

      }      // res.status(200)
    });
  });

  ////////////////////////////////////////////////////////////////////////////////
}
