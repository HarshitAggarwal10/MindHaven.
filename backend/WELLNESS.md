# MindHaven Wellness Hub

The wellness feature is an authenticated Django API and a Next.js hub at
`/wellness`. The dashboard's Wellness Hub navigation opens the same feature.
Published events and providers come from database records; no camps, providers,
attendance counts, or booking examples are inserted automatically.

## Set up

From `backend`:

```powershell
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py test wellness
```

To populate original, optional free practice content for a development
environment:

```powershell
.\.venv\Scripts\python.exe manage.py seed_wellness_resources
.\.venv\Scripts\python.exe manage.py seed_wellness_resources --publish
```

The first command creates the categories and saves four original resources as
drafts. The second explicitly publishes those free resources. The command is
idempotent and never creates provider or event records. Curate or unpublish the
resources through Django admin before using them in another environment.

To populate three free sample camps for testing the complete registration flow:

```powershell
.\.venv\Scripts\python.exe backend\manage.py seed_wellness_experiences
```

This idempotent command is allowed only when `DEBUG=True`. The camps and host
are fictional, visibly labeled as demos in the hub and booking details, and do
not represent real venues or events. A registration creates a test booking
only; it does not reserve attendance at a real camp or charge money. Each demo
listing can be booked once per account. The command does not create a user
account for participants; register or sign in through the app to test booking.

## Providers and events

Use Django admin to create categories and provider profiles. Link each provider
to its Django user, then explicitly mark the profile verified only after the
MindHaven verification process has taken place. Verification is off by default.
Verified providers can create and manage their own draft experiences through
the authenticated organizer API:

- `GET, POST /api/wellness/organizer/experiences/`
- `GET, PATCH, PUT, DELETE /api/wellness/organizer/experiences/{slug}/`
- `GET /api/wellness/organizer/bookings/`

An organizer profile must first be created and linked by an administrator.
Non-staff organizers can publish only after verification. Staff can manage
providers and experiences in Django admin. Events must include accurate venue,
schedule, accessibility, cancellation, and safety details. Virtual meeting
links and access instructions are returned only for a user's confirmed
registration; never place credentials or unconfigured meeting URLs in an event.

The API accepts `INR` only. Listing filters include `search`, `category`,
`format`, `location`, `start_date`, `end_date`, `min_price`, `max_price`,
`free`, `available`, and `sort` (`upcoming`, `price_low`, or `featured`).
Responses are paginated.

## Participant reviews and media

Participants with a confirmed booking can leave one rating and review after the
experience ends. Reviews appear publicly as soon as they are submitted, while
the participant's account name and booking reference stay private. Authors may
remove their own review; staff can remove inappropriate content in Django
admin. An optional single JPG, PNG, or WebP image (up to 12 MB), or MP4/WebM
video (up to 50 MB), can accompany a review. The API checks the declared type,
extension, and file signature.

Uploaded media is stored below `MEDIA_ROOT` and served by Django only in debug
mode. Production deployments must configure durable media storage and an
appropriate content-scanning and moderation process before exposing user
uploads publicly. Public, immediate posting is the selected product behavior;
the development setup is not a substitute for production media operations.

## Razorpay payments (India / INR)

The backend integration creates Razorpay Orders, loads Razorpay Checkout in the
browser, verifies the Checkout signature, fetches the payment from Razorpay,
and confirms registrations only after a captured payment is verified. The
webhook verifies `X-Razorpay-Signature` and handles `payment.captured` and
`payment.failed` events idempotently.

Set these values in the backend environment (never in `NEXT_PUBLIC_*`):

```text
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

Use Razorpay test-mode credentials for sandbox work. Configure the webhook URL
as `https://<your-backend-host>/api/wellness/webhooks/razorpay/` and subscribe
to `payment.captured`, `payment.failed`, `refund.processed`, and `refund.failed`. Paid booking creation is disabled
with an explicit configuration-required response until the server key ID and
secret are set; no payment success is simulated. Free registrations work
without payment credentials. Razorpay account eligibility, settlement, and
payment-method availability must be confirmed for the operating business.

Cancellation of an eligible paid booking requests a full refund through
Razorpay. The experience's `refund_before_hours` controls the cutoff; refund
states remain visible as pending until the provider completes processing.
Card data is never handled or stored by MindHaven.

## Privacy and safety

Bookings are scoped to the authenticated user. Server-side prices, booking
states, and provider ownership are authoritative. Active registrations reserve
capacity transactionally; unpaid reservations expire after 15 minutes.
Published virtual access information is omitted from public responses.

Reflections are optional, mood-only check-ins are integrated with the existing
`mood.MoodCheckIn` model, and free-text reflection content is encrypted with
the configured `FERNET_KEY` before storage. Reflection text is not sent to the
mood AI provider. Add `FERNET_KEY` to the backend environment before accepting
reflection text; otherwise the API reports that private reflection storage is
not configured. Users can open the existing diary for longer private entries.

Practices are optional wellbeing resources and are not medical treatment.
Cold-exposure events must provide provider-authored safety guidance; the hub
also advises users to seek qualified medical guidance when health concerns
apply. Do not encourage users to ignore warning symptoms.

## Routes

- `/wellness` — published experiences, API-backed search/filtering, free
  resources, and current-user bookings.
- `/wellness/{slug}` — experience details and booking/payment flow.
- `/wellness/bookings` — current-user registrations, eligible cancellation,
  authorized virtual access, and post-experience reflections.
- `/api/wellness/` — Django REST API; see `wellness/urls.py`.
