// Функция парсинга html страницы и сохранения отчёта в MongoDB
module.exports = function (body) {
	var xpath = require('xpath');
	var dom = require('xmldom').DOMParser;
	var doc = new dom().parseFromString(body);
	
	// JSON представление html страницы сессий
	var jsonHtml = {};

	// 
	var tablecontent =
		(xpath.select("//div[@id='jive-main-content']/div[@class='jive-table']/table/tbody", doc)[0].childNodes);

	// Просматриваем таблицу сессий и запоминаем login, hostname, ip
	for (var trNum=1; trNum < tablecontent.length; trNum=trNum+2) {
		// tr.jive-odd:nth-child(1) > td:nth-child(2) > a:nth-child(1)
		var login 		= tablecontent[trNum].childNodes[3].firstChild.firstChild.nodeValue;
		var hostname	= tablecontent[trNum].childNodes[5].firstChild.nodeValue.trim();
		var ip				= tablecontent[trNum].childNodes[19].firstChild.nodeValue.trim();
		
		// Если данных о пользователе в отчёте нет, то создаём массив
		// иначе добавляем в массив
		var ts = new Date();
		var resource = { "hostname": hostname, "ip": ip, "ts": ts.toLocaleString()};
		if (!jsonHtml[login]) {
			jsonHtml[login] = [ resource ];
		} else {
			jsonHtml[login].push( resource );
		}
	}
	return jsonHtml;
}

