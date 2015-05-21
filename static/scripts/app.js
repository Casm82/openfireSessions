window.addEventListener("load", function () {
	function searchDB(){
		var loginElm = document.getElementById("login");
		var hostElm = document.getElementById("hostname");
		var ipElm = document.getElementById("ip");

		var query = {
			"username":	loginElm.value,
			"hostname":	hostElm.value,
			"ip": 			ipElm.value
		};

	console.log(query);
		// XHR POST
		var req = new XMLHttpRequest();
		req.open("POST", "/search");
		req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
		req.send(JSON.stringify(query));
		
		req.onreadystatechange = function() {
			if (req.readyState === 4 && req.status === 200) {
				document.getElementById("crt").innerHTML = req.responseText;
			};
		};
	}

	function updateDB() {
		console.log("start update");
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

	function checkInput(event) {
		// Проверяем нажатия клавиш
		var code = event.charCode || event.keyCode;
		if (code == 13) searchDB();
	}

	var loginElm = document.getElementById("login");
	var hostElm = document.getElementById("hostname");
	var ipElm = document.getElementById("ip");
	var searchElm = document.getElementById("search");
	var updateElm = document.getElementById("update");

	// Поиск при нажатии на Enter
	loginElm.addEventListener("keypress", checkInput, false);
	hostElm.addEventListener("keypress", checkInput, false);
	ipElm.addEventListener("keypress", checkInput, false);

	// Поиск при нажатии на кнопку
	searchElm.addEventListener("click", searchDB, false);
	
	// Обновление БД при нажатии на кнопку
	updateElm.addEventListener("click", updateDB, false);
}, false);
