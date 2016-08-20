"use strict";
window.addEventListener("load", function () {

  // Очистка фильтра
  function clearFilterFn() {
    document.getElementById("login").value="";
    document.getElementById("hostname").value="";
    document.getElementById("ip").value="";
  }

  // Поиск в базе данных сессий и вывод на экран
  function searchDBFn(){
    var loginElm = document.getElementById("login");
    var hostElm = document.getElementById("hostname");
    var ipElm = document.getElementById("ip");

    var query = {
      "username":  loginElm.value,
      "hostname":  hostElm.value,
      "ip":       ipElm.value
    };

    //console.log(query);
    // Сохраняем в localStorage массив последних запросов
    if (Boolean(localStorage.searchHistory)) {
      var searchHistoryArr = JSON.parse(localStorage.searchHistory);
    } else {
      var searchHistoryArr = [];
    }
    searchHistoryArr.unshift({
      "username":  query.username,
      "hostname":  query.hostname,
      "ip":       query.ip,
      "date":      new Date()
    });

    while (searchHistoryArr.length > 30) {
      searchHistoryArr.pop();
    }
    localStorage.searchHistory = JSON.stringify(searchHistoryArr);

    // XHR POST
    var req = new XMLHttpRequest();
    req.open("POST", "/search");
    req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    req.send(JSON.stringify(query));

    req.onreadystatechange = function() {
      if (req.readyState === 4 && req.status === 200) {
        document.getElementById("crt").innerHTML = req.responseText;

        // Подсвечиваем слова, которые есть в запросе
        var tdElms = document.getElementsByTagName("td");
        var hlArr = [];

        for (var p in query ) {
          if (query[p]) { hlArr.push(query[p]) }
        }

        if (hlArr.length) {
          var hlRegExp = new RegExp(hlArr.join("|"), "i");
          for(var i=0; i < tdElms.length; i++){
            var tdElm = tdElms[i];
            if ( tdElm.firstChild &&
                 (tdElm.firstChild.nodeName == "#text") &&
                 (tdElm.textContent.match(hlRegExp)) )
             {
              tdElm.style.color = "green";
              tdElm.style.fontWeight = "bold";
              //tdElm.style.backgroundColor = "yellow";
             }
          }
        }
      }
    }
}

  // Обновления базы данных сессий
  function updateDBFn() {
    var updateElm = document.getElementById("update");
    updateElm.disabled = true;
    // XHR POST
    var req = new XMLHttpRequest();
    req.open("POST", "/update");
    req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    req.send(JSON.stringify({"update": true}));

    req.onreadystatechange = function() {
      if (req.readyState === 4 && req.status === 200) {
        updateElm.innerHTML = req.responseText;
        setTimeout(function() {
          updateElm.disabled = false;
          updateElm.innerHTML = "Обновить БД";
        }, 1500 );
      } else { console.log(req.responseText) }
    }
  }

  // Проверяем нажатия клавиш
  function checkInputFn(event) {
    var code = event.charCode || event.keyCode;
    if (code == 13) searchDBFn(); // поиск по Enter
  }

  // Показ истории
  function showHistoryFn(event){
    if (Boolean(localStorage.searchHistory)) {
      var searchHistoryArr = JSON.parse(localStorage.searchHistory);
      var histWinElm = document.getElementById("histWindow");
      if (histWinElm.hidden) {
        // Показываем окно истории
        histWinElm.hidden = false;
        histWinElm.innerHTML = "";

        // Выводим историю
        var tableElm = document.createElement("table");
        var trElm = document.createElement("tr");

        histWinElm.appendChild(tableElm);
        tableElm.appendChild(trElm);

        // Заголовок таблицы
        for (var i=0; i < 4; i++) {
            var thElm = document.createElement("th");
            if (i==0) { thElm.innerHTML = "Дата запроса" };
            if (i==1) { thElm.innerHTML = "Логин" };
            if (i==2) { thElm.innerHTML = "Имя компьютера" };
            if (i==3) { thElm.innerHTML = "IP адрес" };
            trElm.appendChild(thElm);
        }

        // Содержимое таблицы
        searchHistoryArr.forEach(function(histRec){
          var trElm = document.createElement("tr");
          tableElm.appendChild(trElm);
          var dateRec = new Date(histRec.date);

          for (var j=0; j < 4; j++) {
              var tdElm = document.createElement("td");
              if (j==0) { tdElm.innerHTML = dateRec.toLocaleString() };
              if (j==1) { tdElm.innerHTML = histRec.username };
              if (j==2) { tdElm.innerHTML = histRec.hostname };
              if (j==3) { tdElm.innerHTML = histRec.ip };
              trElm.appendChild(tdElm);
          }
        })   // for

      } else {
        histWinElm.hidden = true;
      }
    } else { return false; }
  }

  // Параметры
  var loginElm = document.getElementById("login");
  var hostElm = document.getElementById("hostname");
  var ipElm = document.getElementById("ip");
  var clearElm = document.getElementById("clear");
  var searchElm = document.getElementById("search");
  var updateElm = document.getElementById("update");
  var historyElm = document.getElementById("history");

  // Поиск при нажатии на Enter
  loginElm.addEventListener("keypress", checkInputFn, false);
  hostElm.addEventListener("keypress", checkInputFn, false);
  ipElm.addEventListener("keypress", checkInputFn, false);

  // Очистка полей при нажатии на кнопку
  clearElm.addEventListener("click", clearFilterFn, false);

  // Поиск при нажатии на кнопку
  searchElm.addEventListener("click", searchDBFn, false);

  // Обновление БД при нажатии на кнопку
  updateElm.addEventListener("click", updateDBFn, false);

  // Показ истории
  historyElm.addEventListener("click", showHistoryFn, false);
  if (!Boolean(localStorage.searchHistory)) { historyElm.hidden = true };
}, false);
