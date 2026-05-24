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

## New Driver Flow

- **Self-service driver registration** — водій сам проходить реєстрацію за business invite code.
- **Глобальна адреса та локальні телефони** — форма реєстрації враховує country, state/province, city, ZIP/postal code, address autocomplete і phone formatting під країну бізнесу.
- **Вікова валідація** — для CDL / truck categories потрібно 21+, для інших категорій 18+.
- **Driver documents upload** — водій може завантажувати avatar, license photo, medical card photo і обов’язковий signature image під час реєстрації.
- **Residence address flow** — після дати народження форма реєстрації збирає саме адресу проживання водія.
- **Pending approval** — після реєстрації водій потрапляє в статус `pending`, а owner/admin підтверджує, переводить назад у `pending` або відхиляє заявку.
- **Auto-pending for expired documents** — якщо driver license або medical card прострочені, система примусово тримає статус водія в `pending` до оновлення документів.
- **Driver self-profile** — після входу водій може редагувати свій профіль, документи і підпис без зміни системного `auth_user_id`.

## Owner/Admin Driver Management

- **Direct admin uploads** — owner/admin може оновлювати avatar, driver license photo і medical card photo прямо з driver detail та edit modal, без входу в акаунт водія.
- **Driver detail restoration** — owner/admin driver detail page працює напряму з Supabase, показує avatar, документи, підпис, emergency contact і ключові дані водія.
- **Inspection-aware sorting** — список водіїв сортується з урахуванням pre-trip activity, а також показує вік водія і тривалість роботи в компанії.
- **Compliance hints in UI** — якщо статус `pending` викликаний простроченими документами, owner/admin бачить окреме пояснення в списку і на detail page.

## Invitations And Notifications

- **Invite modal on Drivers page** — громіздкий invite block прибрано з верхньої частини Drivers page і винесено в окрему modal flow з кодом, registration link, copy actions і rotate/generate code.
- **Business-scoped invite links** — driver registration link автоматично містить business invite code для поточного active business.
- **Birthday notifications** — у день народження водія інші учасники того самого бізнесу отримують notification у bell dropdown.

## Inspection Activity

- **Persisted pre-trip inspections** — PreTrip inspection форма тепер записує inspections у базу замість локального demo-flow.
- **Driver and admin inspection submissions** — pre-trip і post-trip можуть виконувати як водії, так і owner/admin користувачі в межах active business.
- **Shared inspection entry points** — inspection доступний з driver dashboard cards, mobile bottom nav і desktop sidebar, щоб однаково відкриватися на планшеті та desktop.
- **Performer attribution** — inspection result і reports UI окремо показують прив’язаного driver та того, хто фактично виконав і відправив inspection.
- **Driver activity badges** — owner/admin бачить стани `pre-trip done today`, `pre-trip pending` і `inactive 5d+` на основі inspection history та останньої активності.

## Inspection Templates And Units

- **Business-scoped inspection templates** — кожен бізнес має власні inspection templates для окремих типів транспорту, без спільного глобального чекліста на всіх.
- **Vehicle-type matching** — template автоматично підбирається під category вибраного авто (`Sedan`, `Semi Truck`, `Crane`, `Boom Lift`, etc.).
- **Photo rules per checklist item** — для кожного пункту template можна вмикати `Allow photo` і `Photo required`.
- **Optional template auto-translation** — preset items перекладаються з вбудованого каталогу, а custom section/item text і template names можна авто-перекладати через backend provider і зберігати прямо в JSON payload шаблону.
- **Distance and dimension units** — template підтримує переключалки одиниць виміру (`mi/km`, `ft/yd/m`) залежно від бізнесу або країни.
- **Fallback checklist** — якщо для типу авто template не знайдено, driver отримує default checklist замість помилкового або випадкового template.

## Shared Fleet Across Businesses

- **One vehicle, multiple businesses** — один і той самий vehicle record може бути підв’язаний до кількох бізнесів одного owner через `vehicle_company_assignments`.
- **Explicit existing-vehicle link flow** — owner може не створювати дубль авто, а вибрати `Existing vehicle` і додати вже наявне авто в інший бізнес.
- **Business-scoped fleet list** — список Fleet Vehicles показує лише авто, прив’язані до поточного active business, навіть якщо фізично це той самий shared vehicle.
- **Legacy assignment backfill** — старі авто, що були створені до vehicle assignment flow, автоматично отримують assignment для поточного бізнеса, щоб не зникати зі списку.

## Vehicle Integrity Rules

- **Immutable vehicle identity** — у vehicle не можна змінювати `VIN`, `year`, `make`, `model`, `type`, `odometer` та `engine_hours` вручну з owner/admin UI.
- **Editable business fields only** — owner/admin може змінювати лише `unit`, `plate`, `status` і `photo`.
- **Protected removal from business** — видалення авто більше не стирає `vehicles` record з БД, а лише відчіпляє його від активного бізнеса.
- **Manual destructive confirmation** — remove-from-business flow тепер вимагає ручного підтвердження через current password і точний `VIN` авто.

## Shared Vehicle Telemetry

- **Current odometer and engine hours in inspection** — driver під час inspection вказує поточний odometer і engine hours для вибраного авто.
- **Cross-business latest reading** — після submit inspection система оновлює сам `vehicles` record, тому наступний бізнес бачить останнє фактичне значення по авто.
- **Rollback protection** — inspection не дає зберегти odometer або engine hours менші за останні зафіксовані значення.
- **Telemetry saved into inspections** — inspection record зберігає `vehicle_odometer`, `vehicle_engine_hours`, `distance_unit`, `dimension_unit` і structured `responses`.

## Driver Fleet Visibility

- **Live driver vehicles page** — `/driver/vehicles` більше не використовує demo data і показує реальний fleet поточного active business через `vehicle_company_assignments`.
- **Live dashboard fleet preview** — блок `Available vehicles` на driver dashboard також підтягує реальні авто бізнесу, а не статичні mock cards.
- **Live driver reports surfaces** — driver dashboard `Recent Reports` і сторінка `/driver/reports` тепер читають реальні inspections із Supabase замість placeholder таблиць.
- **Template visibility during inspection** — driver бачить active vehicle template прямо у `/inspect/pre` та `/inspect/post`, де template підбирається під тип вибраного авто.

## Multi-Business Access

- **Один driver account, кілька бізнесів** — один і той самий водій може бути доданий до кількох бізнесів.
- **Підтримка різних owner** — driver account більше не обмежений лише одним owner.
- **Один активний business context** — водій працює тільки в одному активному бізнесі за раз і може перемикати active business у UI.
- **Scoped vehicles and data** — список машин, доступ і driver detail залежать від поточного active business.

## Supabase Setup

Після оновлення driver onboarding потрібно виконати SQL з [docs/multi-company-schema.sql](docs/multi-company-schema.sql).

Це створює або оновлює:

- `companies`, `company_memberships`, `drivers`, `driver_company_assignments`, `vehicle_company_assignments`, `operations`, `inspections`, `inspection_templates`
- `companies.driver_invite_code`
- поля документів у `drivers`
- `profiles.signature_url`
- `inspections.responses`, `inspections.vehicle_odometer`, `inspections.vehicle_engine_hours`, `inspections.distance_unit`, `inspections.dimension_unit`
- `inspection_templates.distance_unit`, `inspection_templates.dimension_unit`
- storage buckets `driver-documents`, `vehicle-photos`
- storage policies для читання, завантаження, оновлення і видалення driver documents
- storage policies для vehicle photos upload/update/delete
- RLS policies для business-scoped inspection templates і shared vehicle assignments

Якщо SQL не виконаний, можливі такі помилки:

- `Bucket not found`
- `new row violates row-level security policy`
- помилки з відсутніми колонками або таблицями multi-company flow

## Current Notes

- `drivers.owner_user_id` лишається legacy-compatible полем і більше не повинен використовуватися як обмеження для multi-owner membership.
- Driver registration is a two-step flow: спочатку auth signup/join business, потім upload avatar/documents/signature, щоб не ламатися на storage RLS.
- Не можна передавати placeholder `null` asset URLs у driver registration save-flow, інакше вже збережені avatar/license/medical links можуть бути затерті до етапу upload.
- Для dev/test сценаріїв Supabase Auth може тимчасово повертати email rate limit errors після великої кількості signup attempts.
- Shared vehicles should be linked between businesses через `vehicle_company_assignments`, а не дублюватися новими `vehicles` rows без потреби.
- Vehicle odometer and engine hours повинні оновлюватися з inspection flow, щоб усі бізнеси бачили останні фактичні значення по shared vehicle.
- Для optional auto-translation template names і custom template items налаштуйте або `DEEPL_API_KEY` (і за потреби `DEEPL_API_URL`), або `LIBRETRANSLATE_URL` (та опційно `LIBRETRANSLATE_API_KEY`) на backend.

