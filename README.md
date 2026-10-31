# ACES DineLearn LMS

A static front-end learning management system for ACES Polytechnic College's
Hospitality Management program. The project includes student, teacher, and
admin interfaces.

## Project structure

```text
.
├── assets/
│   ├── css/       # Page stylesheets and shared mobile refinements
│   ├── images/    # Logos, illustrations, and other images
│   └── js/        # Page behavior and shared front-end scripts
├── index.html     # Role selection and application entry point
├── *.html         # Student, teacher, and admin pages
└── README.md
```

HTML pages remain in the root so page-to-page navigation works with simple
static hosting, including GitHub Pages.

## Run locally

Serve the project root with a local web server and open `index.html`. For
example, in VS Code, use the Live Server extension. A secure context such as
localhost or HTTPS is needed for browser features used by sign-in.

There is no build step or package installation.

## Deployment

Push the project to a GitHub repository, then enable GitHub Pages for the
branch and root folder containing `index.html`.

## Prototype data

This front-end prototype stores account, session, and profile data in browser
storage. It does not provide backend authentication or shared persistent
storage; use a server-side service before deploying it for real student data.

Student course enrollments, teacher class rosters, teacher-published
assessments and POS training, student submissions, gradebook results, materials,
and announcements use shared browser storage so they appear across the student,
teacher, and admin views when opened on the same browser origin. Demo course,
activity, resource, and announcement fallbacks are not shown as live records.
Attendance is outside this synchronization scope. This is not cross-device or
production data synchronization.

Admin school profile, active academic year, and date-format preferences are
stored in the `bshm.db` browser-local record. They are not synced to a server or
other devices, and Student and Teacher portals do not currently consume those
profile fields. Uploaded school logos are stored in that same browser record.

The student/teacher password-reset flow updates the stored account password
after verification. Since this prototype has no email service, its reset code
is displayed on screen for testing; production password recovery must send and
verify codes through a trusted backend.
