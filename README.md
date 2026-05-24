# FleetCheck / FleetInspect

FleetCheck is a fleet inspection SaaS platform for companies that manage vehicles, drivers, equipment, inspections, repairs, and compliance reports.

The main idea of the project is to replace paper-based pre-trip and post-trip inspection forms with a digital system that supports driver onboarding, business-based access, vehicle assignment, inspection templates, photo evidence, report history, and fraud-prevention logic.

This project is being developed as an MVP for a diploma project.

---

## Project Status

Current working branch:

```bash
feature/driver-onboarding-multibusiness
```

### Implemented in the current MVP

- Multi-business driver onboarding
- Driver self-registration by business invite code
- Owner/admin driver approval flow
- Driver document upload flow
- Driver avatar, license photo, medical card photo, and signature upload
- Pending approval status for new drivers
- Auto-pending status when driver documents are expired
- Owner/admin driver detail page connected to Supabase
- Driver profile update flow
- Driver visibility by active business context
- Shared vehicle assignment across multiple businesses
- Vehicle-company assignment logic
- Business-scoped fleet list
- Protected vehicle removal from business
- Inspection templates by vehicle type
- Business-scoped inspection templates
- Default fallback inspection checklist
- Pre-trip and post-trip inspection flow
- Persisted inspection records in Supabase
- Odometer and engine hours validation during inspection
- Driver dashboard connected to live Supabase data
- Driver vehicles page connected to live Supabase data
- Driver reports page connected to live Supabase data
- Supabase schema support for multi-company flow
- Storage buckets and policies for driver documents and vehicle photos
- Basic PWA/mobile-first structure

### In progress

- Full PDF report generation
- CSV export
- Email report sending
- Advanced manager dashboard analytics
- Repair workflow from failed inspection items
- Issue tracking connected fully to inspection history
- More complete backend API layer
- Production-ready RLS policy review

### Planned features

- Duplicate photo detection
- Photo hash comparison
- EXIF metadata validation
- Fraud detection dashboard
- Before/after photo comparison
- Offline mode with later synchronization
- Advanced notification system
- Mechanic role workflow
- Full admin panel
- Digital compliance archive

---

## Features

### Inspection Checklists

Drivers can complete pre-trip and post-trip inspections using structured checklists. Each checklist can contain sections and items based on the selected vehicle type.

Examples of checklist areas:

- Tires and wheels
- Lights and signals
- Brakes
- Fluid levels
- Safety equipment
- Vehicle documents
- Boom lift / crane equipment checks
- Photos and notes for failed items

---

### Flexible Inspection Templates

The system supports business-scoped inspection templates.

Each business can have its own templates for different types of vehicles and equipment:

- Sedan
- Van
- Pickup truck
- Semi truck
- Boom lift
- Crane
- Trailer
- Custom equipment type

Each checklist item can have its own rules:

- Photo allowed
- Photo required
- Notes required
- Pass/fail status
- Custom section name
- Custom item name

If no template is found for a selected vehicle type, the system uses a default fallback checklist.

---

## Driver Onboarding

FleetCheck supports self-service driver registration.

A driver can register using a business invite code or invite link. After registration, the driver is connected to the correct business and receives a pending status until approval.

Driver onboarding includes:

- First name and last name
- Email
- Phone
- Date of birth
- Residence address
- Driver license number
- Driver license expiration date
- Medical card expiration date
- Avatar upload
- Driver license photo upload
- Medical card photo upload
- Signature image upload
- Emergency contact
- Business invite code

The registration flow supports country-based address and phone formatting.

---

## Age Validation

Driver registration includes age validation.

For CDL / truck-related categories, the driver must be at least 21 years old.

For other vehicle categories, the driver must be at least 18 years old.

---

## Pending Approval Flow

After registration, the driver receives `pending` status.

Owner/admin can:

- Review driver profile
- Review uploaded documents
- Approve driver
- Reject driver
- Return driver to pending status
- Update driver documents
- View compliance warnings

If driver license or medical card is expired, the system keeps the driver in `pending` status until documents are updated.

---

## Owner/Admin Driver Management

Owner/admin can manage drivers through the Drivers page and Driver Detail page.

Implemented management features:

- View driver list
- View driver profile
- View driver avatar
- View driver license photo
- View medical card photo
- View signature
- View emergency contact
- Edit driver details
- Upload driver documents
- Approve or reject driver
- See pending/compliance hints
- See inspection activity badges
- Sort drivers by activity and compliance status

---

## Driver Self-Profile

After login, the driver can update their own profile information and documents without changing the system `auth_user_id`.

This keeps authentication stable while allowing drivers to update:

- Avatar
- License photo
- Medical card photo
- Signature
- Contact information
- Address
- Emergency contact

---

## Invitations and Notifications

The project includes business-scoped invitation logic.

Owner/admin can generate and share invite links with drivers. The invite link contains the business invite code and connects the driver to the correct business.

Implemented invitation features:

- Invite modal on Drivers page
- Business invite code
- Registration link with invite code
- Copy invite link action
- Rotate/generate invite code
- Business-scoped driver registration

Notification-related logic includes birthday notification support for drivers in the same business.

---

## Multi-Business Access

FleetCheck supports a multi-business model.

One owner can manage multiple businesses, and one driver account can be connected to multiple businesses.

Main rules:

- One driver account can belong to several businesses.
- Different owners can invite the same driver.
- A driver works inside one active business context at a time.
- Vehicles, reports, inspections, and driver details are scoped by active business.
- Driver can switch active business in UI when connected to more than one business.

This makes the system suitable for companies where one operator, mechanic, or driver may work with more than one business or department.

---

## Shared Fleet Across Businesses

FleetCheck supports shared vehicles across several businesses.

Instead of duplicating the same vehicle in the database, one vehicle record can be linked to multiple businesses through `vehicle_company_assignments`.

Implemented shared fleet rules:

- One vehicle can be assigned to multiple businesses.
- Owner can link an existing vehicle to another business.
- Fleet list shows only vehicles assigned to the current active business.
- Legacy vehicles can be backfilled into the assignment system.
- Removing a vehicle from a business does not delete the vehicle record.
- Vehicle removal only detaches the vehicle from the current business.

This is important for businesses that use the same equipment across several departments or company entities.

---

## Vehicle Integrity Rules

Vehicle identity fields are protected.

Owner/admin cannot freely edit critical vehicle identity fields after creation.

Protected fields:

- VIN
- Year
- Make
- Model
- Type
- Odometer
- Engine hours

Editable business-level fields:

- Unit number
- Plate
- Status
- Photo

Vehicle removal from business requires manual destructive confirmation:

- Current password
- Exact VIN confirmation

This prevents accidental deletion or damage to important fleet data.

---

## Shared Vehicle Telemetry

The inspection flow updates shared vehicle telemetry.

During inspection, the driver or admin enters:

- Current odometer
- Current engine hours
- Distance unit
- Dimension unit

After inspection submission, the vehicle record is updated with the latest values.

Validation rules:

- Odometer cannot be lower than the last saved value.
- Engine hours cannot be lower than the last saved value.
- Shared businesses see the latest actual vehicle readings.

Inspection records store:

- `vehicle_odometer`
- `vehicle_engine_hours`
- `distance_unit`
- `dimension_unit`
- structured `responses`

---

## Inspection Activity

Pre-trip and post-trip inspections are saved to Supabase instead of only local demo state.

Inspection can be submitted by:

- Driver
- Owner
- Admin

Inspection result and report UI show two important identities:

- Assigned driver
- Actual performer who submitted the inspection

Owner/admin can see driver activity badges:

- Pre-trip done today
- Pre-trip pending
- Inactive 5d+

Inspection entry points are available from:

- Driver dashboard cards
- Mobile bottom navigation
- Desktop sidebar
- Vehicle pages
- Driver workflow

---

## Driver Fleet Visibility

Driver pages now use live Supabase data instead of static demo data.

Implemented driver visibility features:

- `/driver/vehicles` shows real fleet for the active business.
- Driver dashboard shows available vehicles from Supabase.
- Driver dashboard recent reports are loaded from inspections.
- `/driver/reports` reads real inspection records.
- Driver sees the correct template during inspection.
- Driver only sees vehicles and reports scoped to the active business.

---

## Reports

The system includes report surfaces for drivers and managers.

Current report features:

- Inspection result page
- Driver reports page
- Manager reports page
- Performer attribution
- Vehicle information
- Inspection status
- Odometer and engine hours
- Checklist responses
- Notes and failed items
- Report history from Supabase

Planned report features:

- PDF generation
- CSV export
- Email sending
- Report approval flow
- Report flagging
- Fraud warning labels
- Duplicate photo warning labels

---

## Photo Evidence

FleetCheck supports photo uploads for vehicles and driver documents.

Current implemented photo-related features:

- Vehicle photo upload
- Driver avatar upload
- Driver license photo upload
- Medical card photo upload
- Signature image upload
- Supabase Storage integration
- Storage policies for reading, uploading, updating, and deleting documents/photos

Planned inspection photo features:

- Real inspection item photo upload
- Required photo per checklist item
- Photo hash generation
- Duplicate photo detection
- EXIF metadata check
- Before/after comparison
- Suspicious photo flag in report

---

## Fraud Prevention Concept

One of the key planned features of FleetCheck is fraud prevention for inspection photos.

The system should prevent or flag cases where a driver tries to reuse old photos instead of taking new inspection photos.

Planned anti-fraud logic:

1. Driver uploads a photo during inspection.
2. System calculates photo hash or image fingerprint.
3. System compares the new photo against previous inspection photos.
4. If a match or high similarity is found, the report is flagged.
5. Manager sees a warning in the report review screen.
6. Suspicious reports can be marked for additional review.

Additional planned validation:

- EXIF date/time check
- GPS metadata check if available
- Upload timestamp comparison
- Device metadata check
- Same-photo reuse detection
- Repeated-photo pattern detection

---

## Repairs and Issues

FleetCheck includes the foundation for issue and repair workflows.

Planned repair flow:

1. Driver fails one or more inspection checklist items.
2. System creates an issue or repair request.
3. Owner/admin reviews the issue.
4. Vehicle can be marked as `Needs Repair` or `Out of Service`.
5. Mechanic receives or views the repair request.
6. Repair status is updated.
7. Vehicle is returned to active service after review.

Planned statuses:

- Open
- In Review
- Assigned
- In Repair
- Completed
- Closed

---

## User Roles

The system is designed around several user roles.

### Owner / Manager

Can manage business, vehicles, drivers, reports, inspections, and settings.

Main permissions:

- Create business
- Invite drivers
- Approve drivers
- Manage fleet
- View reports
- Review failed inspections
- Manage templates
- Manage vehicle assignments

### Driver

Can complete inspections and view assigned business data.

Main permissions:

- Register by invite code
- Upload documents
- View assigned vehicles
- Complete inspections
- View own reports
- Update own profile

### Mechanic

Planned role for repair workflow.

Expected permissions:

- View repair requests
- Update repair statuses
- Add mechanic notes
- Mark repairs as completed

### Admin

Planned extended role for global or system-level management.

Expected permissions:

- Manage users
- Manage businesses
- Review system-wide data
- Manage platform settings

---

## Tech Stack

### Frontend

- Vue 3
- TypeScript
- Vite
- Vue Router
- Pinia
- Tailwind CSS
- Lucide icons
- PWA-ready structure

### Backend

- Node.js
- Fastify
- TypeScript
- tsx for development

### Database / Auth / Storage

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Row Level Security policies

---

## Project Structure

```bash
FleetCheck/
├── backend/
│   ├── app.ts
│   └── index.ts
│
├── docs/
│   ├── api.md
│   └── multi-company-schema.sql
│
├── frontend/
│   ├── public/
│   │   └── manifest.json
│   │
│   └── src/
│       ├── api/
│       ├── assets/
│       ├── components/
│       ├── lib/
│       ├── router/
│       ├── stores/
│       ├── views/
│       └── main.ts
│
├── package.json
├── package-lock.json
├── tailwind.config.js
├── tsconfig.backend.json
└── README.md
```

---

## Important Pages

Main frontend pages include:

- Landing page
- Login page
- Company registration
- Driver registration
- Pending approval
- Manager dashboard
- Driver dashboard
- Driver vehicles
- Driver reports
- Drivers page
- Driver detail
- Vehicle list
- Vehicle detail
- Pre-trip inspection
- Post-trip inspection
- Inspection result
- Repair request
- Reports
- Issues list
- Issue detail
- Settings
- Operation launcher

---

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/dianatima/FleetCheck.git
cd FleetCheck
```

### 2. Switch to the working branch

```bash
git switch feature/driver-onboarding-multibusiness
```

If the branch does not exist locally:

```bash
git fetch --all
git switch -c feature/driver-onboarding-multibusiness origin/feature/driver-onboarding-multibusiness
```

### 3. Install dependencies

```bash
npm install
```

If development scripts fail because of missing packages, install:

```bash
npm install concurrently tsx --save-dev
```

### 4. Start development server

```bash
npm run dev
```

This command starts both:

- Frontend with Vite
- Backend with Fastify

---

## Available Scripts

Run frontend and backend together:

```bash
npm run dev
```

Run only the frontend:

```bash
npm run dev:frontend
```

Run only the backend:

```bash
npm run dev:backend
```

Build the project:

```bash
npm run build
```

Preview production frontend build:

```bash
npm run preview
```

---

## Environment Variables

Create a local `.env` file based on `.env.example`.

Do not commit real `.env` files to the repository.

Example:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

SUPABASE_URL=
SUPABASE_ANON_KEY=

DEEPL_API_KEY=
DEEPL_API_URL=

LIBRETRANSLATE_URL=
LIBRETRANSLATE_API_KEY=
```

Only `.env.example` should be committed.

Real credentials must stay local.

---

## Supabase Setup

After updating the driver onboarding and multi-company flow, run the SQL script:

```bash
docs/multi-company-schema.sql
```

This script creates or updates:

- `companies`
- `company_memberships`
- `drivers`
- `driver_company_assignments`
- `vehicle_company_assignments`
- `operations`
- `inspections`
- `inspection_templates`
- `companies.driver_invite_code`
- driver document fields
- `profiles.signature_url`
- `inspections.responses`
- `inspections.vehicle_odometer`
- `inspections.vehicle_engine_hours`
- `inspections.distance_unit`
- `inspections.dimension_unit`
- `inspection_templates.distance_unit`
- `inspection_templates.dimension_unit`
- storage bucket `driver-documents`
- storage bucket `vehicle-photos`
- storage policies for driver documents
- storage policies for vehicle photos
- RLS policies for business-scoped inspection templates
- RLS policies for shared vehicle assignments

If SQL is not executed, possible errors include:

- `Bucket not found`
- `new row violates row-level security policy`
- missing column errors
- missing table errors
- broken driver registration flow
- broken vehicle assignment flow
- broken inspection template loading

---

## Supabase Storage Buckets

Required buckets:

```bash
driver-documents
vehicle-photos
```

`driver-documents` is used for:

- Driver avatar
- Driver license photo
- Medical card photo
- Signature image

`vehicle-photos` is used for:

- Vehicle profile photos
- Fleet images

Planned future buckets may include:

```bash
inspection-photos
inspection-videos
report-exports
```

---

## Demo Scenario

Recommended demo flow for presentation:

1. Owner opens the application.
2. Owner creates or selects a business.
3. Owner generates a driver invite code.
4. Driver opens registration link.
5. Driver registers using the business invite code.
6. Driver uploads avatar, license photo, medical card photo, and signature.
7. Driver receives pending status.
8. Owner opens Drivers page.
9. Owner reviews driver documents.
10. Owner approves the driver.
11. Owner adds or links a vehicle to the active business.
12. Driver logs in and opens Driver Dashboard.
13. Driver sees available vehicles.
14. Driver starts pre-trip inspection.
15. System loads template based on selected vehicle type.
16. Driver enters odometer and engine hours.
17. Driver completes checklist.
18. Inspection is saved to Supabase.
19. Driver sees inspection result.
20. Owner sees inspection activity and report history.

---

## Diploma MVP Scope

The MVP focuses on proving the main business workflow:

- Company/business setup
- Driver onboarding
- Driver approval
- Vehicle management
- Shared fleet assignment
- Inspection template selection
- Pre-trip/post-trip inspection
- Inspection persistence
- Driver reports
- Manager visibility
- Supabase-based data model

The MVP does not need to include every planned enterprise feature in production-ready form.

The following features may be described as planned or future improvements:

- Full fraud detection engine
- Duplicate photo AI comparison
- EXIF analysis
- Full offline sync
- Full PDF generation
- Full mechanic workflow
- Full admin panel
- Enterprise notification system

---

## Current Notes

- `drivers.owner_user_id` remains as a legacy-compatible field and should not be used as the main limitation for multi-owner membership.
- Driver registration is a two-step flow: first auth signup/join business, then upload avatar/documents/signature.
- The two-step upload flow prevents issues with Supabase Storage RLS policies.
- Placeholder `null` asset URLs must not be passed into driver registration save flow.
- Otherwise already saved avatar/license/medical links may be overwritten before upload is completed.
- During development/testing, Supabase Auth may temporarily return email rate limit errors after many signup attempts.
- Shared vehicles should be linked between businesses through `vehicle_company_assignments`.
- Shared vehicles should not be duplicated as new `vehicles` rows unless necessary.
- Vehicle odometer and engine hours should be updated from inspection flow.
- This allows all businesses connected to the same shared vehicle to see the latest actual values.
- For optional auto-translation of template names and custom template items, configure either DeepL or LibreTranslate provider.
- DeepL uses `DEEPL_API_KEY` and optionally `DEEPL_API_URL`.
- LibreTranslate uses `LIBRETRANSLATE_URL` and optionally `LIBRETRANSLATE_API_KEY`.

---

## Git Workflow

Check current branch:

```bash
git branch
```

Check local changes:

```bash
git status
```

See code changes before commit:

```bash
git diff
```

Stage files:

```bash
git add .
```

Commit:

```bash
git commit -m "Update README documentation"
```

Push current feature branch:

```bash
git push -u origin feature/driver-onboarding-multibusiness
```

After upstream is set, use:

```bash
git push
```

---

## Security Notes

Do not commit:

- `.env`
- Supabase service role keys
- API keys
- private tokens
- passwords
- production credentials

Use `.env.example` for documentation only.

If real credentials were pushed by mistake, rotate/regenerate them in Supabase or the related provider.

---

## Future Improvements

Planned improvements for the next stages:

- Add complete inspection photo upload per checklist item
- Add required photo validation
- Add photo hash generation
- Add duplicate photo comparison
- Add EXIF metadata validation
- Add fraud warning labels in reports
- Add PDF report generation
- Add CSV export
- Add email report sending
- Add offline mode with local draft saving
- Add repair workflow connected to failed inspection items
- Add mechanic dashboard
- Add admin dashboard
- Add advanced notifications
- Add audit log
- Add stronger role-based permissions
- Add automated tests
- Add production deployment documentation

---

## Summary

FleetCheck is a digital fleet inspection platform designed to help companies manage vehicles, drivers, inspections, reports, and compliance workflows.

The current MVP already includes the core structure for:

- Multi-business access
- Driver onboarding
- Driver approval
- Shared fleet management
- Inspection templates
- Supabase-based inspection records
- Driver fleet visibility
- Driver reports
- Vehicle telemetry validation

The next major development step is to complete inspection photo handling, duplicate photo detection, PDF reports, and repair workflows.