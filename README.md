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

### Операційні SQL-скрипти (debug/hotfix)

- `supabase/hotfix_prod_signature_fraud.sql` — production hotfix для синхронізації schema + RLS політик по підпису та anti-fraud.
- `supabase/signature-fraud-diagnostics.sql` — діагностичний скрипт для перевірки колонок/таблиць, наявності anti-fraud даних, і стану активних policy (`PASS/FAIL` блок).

