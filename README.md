# FleetCheck

FleetCheck — веборієнтована SaaS-платформа для цифрової інспекції транспортних засобів. Проєкт реалізує MVP-сценарій, у якому водій проходить передрейсову або післярейсову інспекцію, додає фото, коментарі, пробіг і рукописний підпис у формі на екрані, а менеджер переглядає звіт, проблеми, ремонти та результати перевірки фотоматеріалів.

## Основні можливості

- рольові інтерфейси для водія, менеджера та власника компанії;
- реєстрація компанії та робота користувачів у межах своєї організації;
- керування транспортними засобами, водіями, шаблонами інспекцій і правилами доступу;
- проходження `pre-trip` та `post-trip` інспекцій;
- checklist з відповідями `pass`, `fail`, `not_applicable`;
- додавання фото, коментарів, пробігу та підпису водія;
- збереження фото у Supabase Storage;
- перевірка фотоматеріалів і формування `risk_score`, `risk_level`, `flags`;
- перегляд inspection reports і експорт звіту в PDF;
- робота з issues та repairs після виявлення проблем.

## Технології

**Frontend:** Vue 3, TypeScript, Vite, Pinia, Vue Router, Tailwind CSS, Lucide Vue Icons, pdfmake.  
**Backend:** Node.js, TypeScript, Fastify.  
**Data / Auth / Storage:** Supabase, PostgreSQL, Supabase Auth, Row Level Security, Supabase Storage.  
**Deploy:** Render, `render.yaml`.

## Структура проєкту

```text
FleetCheck/
├── backend/                # Fastify backend/API
│   ├── app.ts              # створення Fastify app
│   ├── index.ts            # запуск backend-сервера
│   ├── lib/                # Supabase admin client, email/invite логіка
│   ├── plugins/            # Vite/dev і production dist middleware
│   └── routes/             # API routes
│
├── frontend/               # Vue 3 frontend
│   ├── index.html
│   ├── vite.config.ts
│   └── src/
│       ├── api/            # frontend API-утиліти
│       ├── components/     # UI-компоненти
│       ├── lib/            # photoFraud, reportPdf, Supabase helpers
│       ├── router/         # Vue Router маршрути
│       ├── stores/         # Pinia stores
│       └── views/          # сторінки застосунку
│
├── scripts/                # dev scripts
├── supabase/               # папка для SQL/міграцій
├── render.yaml             # налаштування Render deploy
├── package.json
└── README.md
```

## Основні маршрути

Маршрути описані у файлі:

```text
frontend/src/router/index.ts
```

Manager/owner routes:

```text
/dashboard
/vehicles
/drivers
/reports
/issues
/repairs
/settings
```

Driver routes:

```text
/driver
/driver/vehicles
/driver/reports
/inspect/pre
/inspect/post
/inspect/result
```

## Логіка інспекції

1. Водій авторизується та бачить доступні транспортні засоби.
2. Обирає транспортний засіб і тип інспекції: `pre-trip` або `post-trip`.
3. Система підтягує відповідний inspection template.
4. Водій заповнює checklist, додає фото, коментарі, пробіг і підпис.
5. Після відправлення формується inspection report.
6. Менеджер переглядає звіт, фотоматеріали та anti-fraud summary.
7. Якщо є failed items, створюється issue, яке менеджер може передати в repair workflow.

## Фото та anti-fraud перевірка

Фото не зберігаються в базі даних як великі файли. Вони завантажуються у Supabase Storage, а в результатах інспекції зберігаються шляхи або посилання на файли. У поточній версії фото пов’язані з inspection results через `photo_urls`; окрема таблиця `inspection_photos` не використовується.

Перевірка фотоматеріалів реалізована у файлі:

```text
frontend/src/lib/photoFraud.ts
```

Система формує ознаки ризику для фото: хеші, метадані, GPS-ознаки, повторне використання, `flags`, `risk_score`, `risk_level` і `verification_status`. Результати зберігаються у таблиці:

```text
inspection_photo_verifications
```

Anti-fraud перевірка не приймає рішення замість менеджера, а лише допомагає швидше знайти звіти, які потребують уважнішого перегляду.

## PDF-звіти

Генерація PDF-звітів реалізована у файлі:

```text
frontend/src/lib/reportPdf.ts
```

PDF-звіт містить інформацію про інспекцію, транспортний засіб, водія, результати checklist, фото та підпис водія.

## Backend API

Основні backend-файли:

```text
backend/app.ts
backend/index.ts
backend/lib/supabase-admin.ts
backend/lib/approval-email.ts
backend/routes/driver-invitations.route.ts
backend/routes/delete-inspections.route.ts
```

Backend використовується для службових API-операцій, зокрема запрошення водіїв, email-повідомлень, захищеного видалення inspection reports і health check.

## Змінні середовища

Для локального запуску потрібно створити `.env` на основі `.env.example`:

```bash
cp .env.example .env
```

Основні змінні:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
APP_URL=http://localhost:5173
RESEND_API_KEY=
APPROVAL_EMAIL_FROM=
```

## Локальний запуск

Встановити залежності:

```bash
npm install
```

Запустити frontend і backend разом:

```bash
npm run dev
```

Окремий запуск:

```bash
npm run dev:frontend
npm run dev:backend
```

Зупинка dev-процесів:

```bash
npm run stop
```

## Збірка та запуск production-версії

```bash
npm run build
npm run start
```

Render використовує команди:

```bash
npm ci && npm run build
npm run start
```

## Короткий результат

FleetCheck демонструє MVP цифрової інспекції транспортних засобів: водійський мобільний сценарій, менеджерський перегляд звітів, збереження фотодоказів у Supabase Storage, PDF-звітність і базову anti-fraud перевірку фотоматеріалів.