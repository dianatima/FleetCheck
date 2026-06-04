# FleetInspect

Fleet inspection SaaS platform with photo verification, PDF reports, and anti-fraud tools.

## Features

- **Чек-листи інспекції** — перевірка технічного стану авто перед виїздом.
- **Гнучкі форми інспекції** — створення власних шаблонів для різних типів техніки.
- **Прив’язка водія до авто** — водій бачить лише призначені транспортні засоби.
- **Фотофіксація** — завантаження фото пошкоджень або стану авто.
- **Відео-докази** — додавання коротких відео під час інспекції.
- **Цифровий підпис** — підтвердження завершення перевірки водієм.
- **PDF-звіти** — автоматичне формування звіту після інспекції.
- **Історія інспекцій** — збереження всіх попередніх перевірок.
- **Порівняння “до / після”** — відображення змін стану авто між звітами.
- **GPS-локація** — фіксація місця проведення інспекції.
- **Timestamp перевірка** — запис точної дати та часу створення звіту.
- **Перевірка дублікатів фото** — виявлення повторно використаних зображень.
- **EXIF metadata аналіз** — перевірка даних фото та пристрою зйомки.
- **Fraud Detection** — виявлення підозрілих або фальшивих звітів.
- **Авторизація користувачів** — окремі акаунти для водіїв і менеджерів.
- **Fleet Manager Dashboard** — панель управління автопарком і звітами.
- **Управління автопарком** — додавання машин, VIN-кодів та номерів.
- **Миттєва відправка звітів** — автоматичне надсилання менеджеру.
- **Offline режим** — робота без інтернету з подальшою синхронізацією.
- **PWA / Mobile-first** — адаптація під мобільні пристрої та браузер.

## Останні зміни (May 2026)

- **Редизайн модалки звіту та PDF**:
	- Heroбанер з фото авто, статусом і метаданими; ряд метрик (passed/failed/items/photos).
	- Двоколонкове розкладання: ліва частина — підпис, фото, чек-лист з кольоровими акцентами; права — anti-fraud rail для менеджерів.
	- PDF переписаний у "DOT-style" — без anti-fraud/EXIF/GPS, для зовнішніх отримувачів (DOT, страховики, водій).
- **GPS у звіті (anti-fraud)**:
	- Виправлено баг `exifr` — для витягування координат потрібен `gps: true`, додано fallback `dmsToDecimal()` для DMS-масивів.
	- Геозона ±300 м: обчислюється центроїд GPS-точок інспекції, фото за межами радіуса отримують flag `GPS_OUTLIER` (+35 до risk score).
	- Інтерактивна карта в anti-fraud rail (Leaflet + OpenStreetMap) з пінами по фото, кругом-геозоною та підсвічуванням виносних точок червоним.
	- Backfill існуючих записів з NULL GPS при першому відкритті модалки.
- **Re-analyze кнопка** — менеджер може примусово перерахувати anti-fraud аналіз без видалення записів.

- **Рукописний підпис водія при submit** — у pre-trip/post-trip додано підпис пальцем/мишею на екрані, підпис є обов'язковим для відправки звіту.
- **Fallback для підпису (legacy БД)** — якщо у середовищі ще немає колонок `signature_data_url/signed_at/signed_by_driver_id`, підпис зберігається локально і відображається у звіті та PDF.
- **Єдина модалка перегляду звітів** — додано спільний компонент `InspectionReportModal` для перегляду готових inspection-звітів.
- **Перегляд звіту без переходу на окрему сторінку** — звіти відкриваються у модальному вікні в таких екранах:
	- `Driver Reports`
	- `Driver Dashboard (Recent Reports)`
	- `Vehicle Detail (Inspection History)`
	- `Manager Reports`
- **Зведена фотогалерея звіту** — усі фото зі звіту показуються разом у блоці `Photos`.
- **Zoom для фото** — клік по фото відкриває збільшений перегляд через `PhotoLightbox`.
- **Порядок пунктів checklist збережено** — `Checklist Summary` у модалці йде за `sort_order` з inspection template.
- **Підпис у звіті та PDF** — підпис водія відображається у модальному перегляді звіту та в експортованому PDF.
- **Сумісність звітів після додавання signed_by_driver_id** — у запитах до Supabase додано явний embed через `drivers!inspections_driver_id_fkey`, щоб уникнути помилки "more than one relationship was found for inspections and drivers".
- **Антифрод-підсумок у менеджерському звіті**:
	- Розрахунок ризику по фото (`risk_score`, `risk_level`, `flags`).
	- Відображення топ причин ризику та найбільш підозрілих фото.
	- Порівняння `Previous vs Current` для exact/visual duplicate.
- **Backfill anti-fraud у модалці звіту** — якщо для inspection ще немає anti-fraud записів, модалка може автоматично дорахувати та зберегти аналіз на основі вже прикріплених фото.
- **Shared DB fallback для підпису** — додано таблицю `inspection_signature_fallbacks`, щоб підпис був доступний менеджеру між різними сесіями/ролями, навіть якщо локальний fallback недоступний.
- **Modal flow для інспекції водія** — pre-trip/post-trip відкривається як overlay-модалка (`?modal=1`) замість повного переходу на окремий екран.
- **Покращена валідація одометра**:
	- Заборонено зменшення пробігу нижче за історичний максимум.
	- Додано warning-підтвердження при великому стрибку пробігу (понад 1000 mi/km за добу/перевірку).
	- Помилки одометра показуються безпосередньо під полем введення.
- **Одиниці одометра (mi/km)**:
	- Додано `odometer_unit` для транспортних засобів.
	- Вибір одиниць у формі авто.
	- Коректне відображення одиниць у списках, деталях, dashboard та інспекції.
	- Додано fallback-сумісність для середовищ, де колонка ще не застосована.
- **Inspection templates: режими**:
	- Додано `inspection_mode` (`pre-trip` / `post-trip` / `custom`).
	- Тепер дозволено кілька шаблонів для одного типу авто (по одному на кожен режим).
	- Додано унікальність на рівні `(company_id, vehicle_type_id, inspection_mode)`.
- **Developer Driver Preview mode (DEV only)**:
	- У Settings додано toggle для швидкого входу в режим водія без консолі.
	- Додано явний вихід з preview mode у сайдбарі (`Exit Driver Preview`).
	- Оновлено router/navigation логіку для коректного preview-потоку.
- **Нова backend реєстрація компанії**:
	- Додано endpoint `POST /api/register/company`.
	- Створення owner user + company + profile + company owner link виконується на backend через admin client.
	- Frontend реєстрація переключена на цей API.

## Останні зміни (June 2026)

- **Запрошення водіїв / auth callback / fallback delivery**:
	- Frontend auth callback тепер коректно обробляє `code`, `token_hash` і direct session tokens з `/auth/callback`.
	- Для invite flow використовується `VITE_APP_URL` / `APP_URL`, щоб email-посилання не вказували на локальний `localhost` у production.
	- Для вже існуючих auth-користувачів resend invite генерує magic link замість password reset email.
	- Якщо кастомна email-відправка недоступна, backend повертає готовий invite link для ручної передачі водію замість hard-fail помилки.

- **Company-wide одиниці пробігу**:
	- Додано `companies.odometer_unit` (`mi` / `km` / `nm`) як єдине налаштування одиниць пробігу на рівні компанії.
	- У `Settings -> Company` з'явився селектор одиниць відстані.
	- Manager reports, inspection modal і driver inspection flow відображають пробіг з малим unit suffix (`mi`, `km`, `nm`) біля числа.
	- Для середовищ без нової колонки frontend має fallback на `mi`, щоб не ламати login/profile flow до застосування міграції.

- **Manager Reports: пробіг у списку звітів**:
	- Колонку `Photos` у менеджерському списку звітів замінено на odometer.
	- Під поточним значенням пробігу показується коротка різниця від попереднього звіту по тому ж авто у форматі `+980 mi`.
	- Детальна модалка звіту теж показує поточний пробіг і компактний приріст від попереднього звіту.

- **Legacy-сумісність фото у звітах (mobile/desktop)**:
	- Додано нормалізацію `photo_urls` для старих записів, де фото могли зберігатись як path-only значення.
	- Прев'ю фото у `InspectionResult`, `DriverReportDetail`, `InspectionReportModal`, `PreTripInspection` тепер стабільно працює для нових і старих звітів.
- **Reference photo для checklist item у Inspection Templates**:
	- Для кожного пункту шаблону можна завантажити еталонне фото (`reference_photo_url`).
	- Еталонне фото відображається у driver inspection flow як візуальна підказка.
- **Thumbnail/Avatar у списках звітів**:
	- У `Reports` та `DriverReports` додано мініатюру звіту (фото ТЗ або fallback на перше фото інспекції).
- **Повна локалізація нових UX-текстів (en/uk/es/fr)**:
	- Додано переклади для `Reference photo`, `Upload reference photo`, `Open/Hide details`, валідаційного повідомлення про обов'язкове фото та помилки завантаження еталонного фото.

- **Покращена генерація PDF-звітів**:
	- Перехід з кастомного PDF-генератора на pdfmake для надійної Unicode-обробки в multilingual звітах.
	- Preview по кліку відкривається через `iframe` замість `location.href`, що гарантує безпечне завантаження blob.
	- Share copy gracefully fallback на download при недоступності Web Share API.
	- Валідація non-empty blob перед preview/download/share запобігає білим екранам та пустим файлам.
	- Нормалізація photo URL в PDF-генераторі гарантує коректне завантаження legacy path-only фото.

- **Захист від повторного submit інспекції**:
	- Додано `submittingInspection` state для кнопки "Submit Inspection".
	- Під час відправки кнопка дизейблиться і показує `Submitting...` (локалізовано en/uk/es/fr).
	- Ранній return у `handleSubmit` блокує дублювання запитів при мультикліку.

- **Backward-compatible запити для `inspection_templates` в medio schema**:
	- Якщо у БД відсутня колонка `engine_hours_required`, frontend автоматично ретраїться з простішим запитом.
	- Insert/Update шаблонів пропускає `engine_hours_required` при fallback, а вбудована нормалізація ставить значення за замовчуванням `false`.
	- Сумісність з середовищами, де міграція `202605310001` ще не застосована.

- **Стабільність списку Inspection Templates**:
	- При зміні активної компанії список скидає старі фільтри (search, vehicle type filter, пагінація).
	- Індикатор поточної компанії в шапці блоку шаблонів уникає плутанини при multi-company сценаріях.
	- Fallback-запит активується автоматично, якщо список порожній через застарілий пошук/фільтр, гарантуючи, що шаблон не видається "зниклим".

- **Захищене видалення інспекцій (single + bulk)**:
	- Додано backend endpoint `POST /api/admin/delete-inspections`.
	- Підтвердження видалення через email + password адміністратора.
	- Видалення підтримує як одиночний звіт (з модалки), так і масове видалення зі сторінки `Reports`.
- **Bulk delete у Reports**:
	- Працює за вибраними чекбоксами або за фільтрами (дата, водій, тип, fraud-only).
	- Додано захист від повторного submit під час виконання запиту.
- **Покращена обробка помилок видалення**:
	- Явні повідомлення для `502/503` (backend недоступний).
	- Явні повідомлення для `403/500` (помилка прав або серверна помилка).
- **Перевірка ролі при видаленні**:
	- Роль читається з auth metadata з fallback на `profiles.role`.
	- Доступ до видалення дозволено `owner/admin/manager`.

### Нові SQL міграції

- `202605290001_vehicle_odometer_unit.sql` — додає `vehicles.odometer_unit` + check constraint.
- `202605290002_driver_vehicle_odometer_update_policy.sql` — додає policy, що дозволяє active driver оновлювати `vehicles` у своїй компанії.
- `202605290003_repair_inspection_signature_columns.sql` — додає колонки підпису в `inspections` + reload schema notify.
- `202605300001_inspection_template_modes.sql` — додає `inspection_mode`, backfill старих даних, замінює унікальний індекс на mode-aware.
- `202605300002_photo_fraud_verification.sql` — створює `inspection_photo_verifications`, індекси та RLS policy для anti-fraud по фото.
- `202605300003_inspection_signature_shared_fallback.sql` — створює `inspection_signature_fallbacks` для спільного fallback-підпису між ролями.
- `202605300004_fraud_and_signature_policy_preview_support.sql` — розширює policy під DEV Driver Preview сценарій.
- `202605300005_fraud_signature_policy_admin_owner_support.sql` — додає підтримку `owner/manager/admin` та `company_owners` у policy для anti-fraud/signature fallback.
- `202605300006_ensure_inspection_signature_columns.sql` — гарантує наявність signature-колонок у `inspections` у середовищах з частково застосованими міграціями.
- `202605310001_add_engine_hours_required_to_templates.sql` — додає `inspection_templates.engine_hours_required` boolean колонку (backend запит для inspection/engine-hours override режиму).
- `202606020001_template_item_reference_photo.sql` — додає `inspection_template_items.reference_photo_url` для еталонних фото пунктів шаблону.
- `202606030001_vehicles_driver_inspected_access.sql` — розширює доступ driver до пов'язаних vehicle даних у власних inspection flow сценаріях.
- `202606030002_company_odometer_unit.sql` — додає `companies.odometer_unit` + default `mi` + check constraint (`mi/km/nm`).

### Операційні SQL-скрипти (debug/hotfix)

- `supabase/hotfix_prod_signature_fraud.sql` — production hotfix для синхронізації schema + RLS політик по підпису та anti-fraud.
- `supabase/signature-fraud-diagnostics.sql` — діагностичний скрипт для перевірки колонок/таблиць, наявності anti-fraud даних, і стану активних policy (`PASS/FAIL` блок).

## Quick Start

### 1. Встановлення

```bash
npm install
```

### 2. Налаштування змінних середовища

Скопіюйте приклад у `.env`:

```bash
cp .env.example .env
```

Заповніть обов'язкові ключі:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Опційно для email-повідомлень:

- `RESEND_API_KEY`
- `APPROVAL_EMAIL_FROM`
- `APP_URL`
- `VITE_APP_URL` — рекомендований public app origin для auth callback / invitation links

### 3. Запуск у DEV

```bash
npm run dev
```

Це піднімає одночасно:

- frontend: `vite frontend`
- backend: `tsx watch backend/index.ts`

Запуск тепер керується одним wrapper-скриптом, тому `Ctrl+C` у цьому терміналі зупиняє frontend і backend разом. Frontend зафіксовано на порту `5173`, backend на `3000`.

Якщо після аварійного завершення залишились "сирітські" процеси dev-сервера, використовуйте:

```bash
npm run devstop
```

Або найкоротше:

```bash
npm run stop
```

Ці команди примусово звільняють порти `5173` (frontend) і `3000` (backend).

### 4. Production build

```bash
npm run build
```

Окремо:

```bash
npm run build:frontend
npm run build:backend
```

## Корисні Scripts

- `npm run dev` — frontend + backend в watch
- `npm run dev:stop` — примусово зупиняє dev-процеси на портах `5173` та `3000`
- `npm run devstop` — те саме, але без двокрапки
- `npm run stop` — найкоротший alias для зупинки dev-процесів
- `npm run dev:frontend` — лише frontend
- `npm run dev:backend` — лише backend
- `npm run build` — повний build
- `npm run preview` — preview frontend production build

## Deploy (Render)

Для поточної архітектури (Fastify + зібраний Vite frontend) найпростіший варіант деплою — один Web Service на Render.

У репозиторії вже додано `render.yaml`, тому достатньо:

1. Підключити GitHub репозиторій у Render.
2. Обрати Blueprint deploy (Render прочитає `render.yaml`).
3. Заповнити env vars:
	- `SUPABASE_URL`
	- `SUPABASE_SERVICE_ROLE_KEY`
	- `VITE_SUPABASE_URL`
	- `VITE_SUPABASE_ANON_KEY`
	- (опційно) `RESEND_API_KEY`, `APPROVAL_EMAIL_FROM`, `APP_URL`
4. Запустити deploy.

Після успішного деплою backend API і frontend будуть працювати з одного домену Render, що зручно для тестування з телефона.

## База Даних: Рекомендований Порядок

Для нових середовищ або після великих оновлень застосовуйте:

1. Основні schema/feature migration-и.
2. Signature/Fraud migration-и:
	- `202605300002_photo_fraud_verification.sql`
	- `202605300003_inspection_signature_shared_fallback.sql`
	- `202605300004_fraud_and_signature_policy_preview_support.sql`
	- `202605300005_fraud_signature_policy_admin_owner_support.sql`
	- `202605300006_ensure_inspection_signature_columns.sql`
3. Для hotfix у проді: `supabase/hotfix_prod_signature_fraud.sql`.
4. Для валідації стану: `supabase/signature-fraud-diagnostics.sql`.

## Anti-Fraud: Поточна Логіка

- Оригіналом вважається найраніший запис фото у системі (за timestamp), а не останній.
- Новіші входження того ж фото позначаються як дублікати.
- Якщо історичні записи були створені старою логікою, модалка звіту може автоматично перерахувати anti-fraud для поточного inspection.
- У менеджерському списку звітів є окремий індикатор підозрілості (`Fraud Flagged`) і фільтр по ньому.

## Driver Preview Mode (DEV)

- Доступний тільки в DEV.
- Вмикається в `Settings` -> `Driver Preview (DEV)`.
- Для виходу використовуйте `Exit Driver Preview` у sidebar.
- Якщо у компанії немає rule-ів доступу типів авто, використовується fallback на всі типи авто компанії, щоб preview не залишався пустим.

## Troubleshooting

### Вічний loading / помилки на driver pages

1. Зробіть hard reload (`Ctrl+F5`).
2. Перезапустіть dev server (`npm run dev`).
3. Перевірте консоль браузера на runtime помилки.
4. Перевірте, що у таблиці `drivers` існує запис для вашого профілю/користувача.

### Підпис не видно у звіті

- Переконайтесь, що застосовані migration-и `300003` і `300006`.
- Для legacy середовищ підпис може братись з fallback таблиці `inspection_signature_fallbacks`.

### Логін перекидає назад на /login після auth callback

- Переконайтесь, що застосована міграція `202606030002_company_odometer_unit.sql`.
- Frontend має fallback для середовищ без `companies.odometer_unit`, але після застосування міграції company settings і unit labels працюватимуть коректно без schema fallback.

### Invitation email could not be sent

- Перевірте `RESEND_API_KEY`, `APPROVAL_EMAIL_FROM`, `APP_URL`, `VITE_APP_URL`.
- Якщо email-провайдер тимчасово недоступний, invite flow повертає готовий invitation link для ручного відправлення водію.

### Anti-fraud показує неконсистентні дублікати

- Відкрийте модалку проблемного звіту, щоб запустився auto-recompute.
- Запустіть `supabase/signature-fraud-diagnostics.sql` і перевірте policy/дані.

### Помилка видалення звітів (`502 Bad Gateway`)

1. Переконайтесь, що backend запущений: `npm run dev:backend`.
2. Якщо працюєте через один скрипт, запустіть `npm run dev` і перевірте, що backend слухає `http://localhost:3000`.
3. У dev-mode frontend проксить `/api` на `127.0.0.1:3000`, тому 502 зазвичай означає недоступний backend.

### Помилка видалення звітів (`403 Forbidden`)

- Перевірте, що введено email/password користувача з роллю `owner/admin/manager`.
- Перевірте, що для цього користувача роль присутня в `auth metadata` або у `profiles.role`.

## API (Backend)

Ключовий endpoint реєстрації компанії:

- `POST /api/register/company`

Використовує server-side admin client для створення owner user + company + profile + company_owner link.

## Stack

- Frontend: Vue 3, Pinia, Vue Router, Vite, Tailwind
- Backend: Fastify, TypeScript
- Data/Auth/Storage: Supabase (Postgres + RLS)
- Reporting: PDF export + manager modal reports

