Щоб перемкнутися на водія і увімкнути локально

У браузері відкрити DevTools → Console.
Виконати:


Надрукуй вручну: allow pasting

localStorage.setItem('fleetcheck.dev.driverPreview', '1')
Оновити сторінку і зайди на:
http://localhost:5173/driver


Як вимкнути

У Console:
localStorage.removeItem('fleetcheck.dev.driverPreview')
Оновити сторінку.
Важливо

Це працює тільки в локальному dev режимі.
Для нормального тесту бажано бути залогіненим у свій робочий акаунт (owner) з активною компанією.


або ще npm run dev terminal exited
