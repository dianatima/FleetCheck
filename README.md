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
- **Driver activity badges** — owner/admin бачить стани `pre-trip done today`, `pre-trip pending` і `inactive 5d+` на основі inspection history та останньої активності.

## Multi-Business Access

- **Один driver account, кілька бізнесів** — один і той самий водій може бути доданий до кількох бізнесів.
- **Підтримка різних owner** — driver account більше не обмежений лише одним owner.
- **Один активний business context** — водій працює тільки в одному активному бізнесі за раз і може перемикати active business у UI.
- **Scoped vehicles and data** — список машин, доступ і driver detail залежать від поточного active business.

## Supabase Setup

Після оновлення driver onboarding потрібно виконати SQL з [docs/multi-company-schema.sql](docs/multi-company-schema.sql).

Це створює або оновлює:

- `companies`, `company_memberships`, `drivers`, `driver_company_assignments`, `vehicle_company_assignments`, `operations`, `inspections`
- `companies.driver_invite_code`
- поля документів у `drivers`
- `profiles.signature_url`
- storage bucket `driver-documents`
- storage policies для читання, завантаження, оновлення і видалення driver documents

Якщо SQL не виконаний, можливі такі помилки:

- `Bucket not found`
- `new row violates row-level security policy`
- помилки з відсутніми колонками або таблицями multi-company flow

## Current Notes

- `drivers.owner_user_id` лишається legacy-compatible полем і більше не повинен використовуватися як обмеження для multi-owner membership.
- Driver registration is a two-step flow: спочатку auth signup/join business, потім upload avatar/documents/signature, щоб не ламатися на storage RLS.
- Не можна передавати placeholder `null` asset URLs у driver registration save-flow, інакше вже збережені avatar/license/medical links можуть бути затерті до етапу upload.
- Для dev/test сценаріїв Supabase Auth може тимчасово повертати email rate limit errors після великої кількості signup attempts.

