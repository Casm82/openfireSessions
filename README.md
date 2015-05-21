# openfireSessions
Сохраняет статистику подключений к Openfire в MongoDB.

Подключается к web-консоли сервера Openfire, анализирует html страницу сессий.
Сохраняет результаты в MongoDB.
Запускает web-сервер, после подключения к которому можно осуществлять поиск по сохранённым данным.

Все настройки в файле settings.json
В папке install шаблоны для systemd и cron.

Требования:
Node.js
MongoDB
glibc x86 (/lib/ld-linux.so.2) для HtmlTidy