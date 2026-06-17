# PsyLex MVP – Authentication, Users, Sessions, and Admin Dashboard Requirements

## 1. Authentication

### Login Format

User login must be generated automatically using the following format:

```text
psylex_<UUID>
```

Example:

```text
psylex_550e8400-e29b-41d4-a716-446655440000
```

### Password

* Password is stored as plain text.
* Password field type: string/text.
* No hashing or encryption is required for MVP.

---

## 2. User Management

### User Entity

| Field      | Type            | Description         |
| ---------- | --------------- | ------------------- |
| id         | UUID            | Unique identifier   |
| login      | String          | Unique login        |
| password   | String          | Plain text password |
| role       | Enum            | User role           |
| session_id | UUID (nullable) | Related session     |

### Roles

Supported roles:

* admin
* mediator
* plaintiff
* defendant

---

## 3. Session Management

### Session Entity

| Field      | Type     | Description        |
| ---------- | -------- | ------------------ |
| id         | UUID     | Session identifier |
| created_at | DateTime | Creation timestamp |

### Session Creation

When an admin creates a new session:

1. A new session record is created.
2. A plaintiff user is automatically generated.
3. A defendant user is automatically generated.
4. Login and password are automatically generated for both users.
5. Both users are linked to the created session using `session_id`.

---

## 4. Mediator Management

### Mediator Creation

Admin can create a mediator.

When a mediator is created:

1. Login is auto-generated.
2. Password is auto-generated.
3. Role is set to `mediator`.
4. Mediator is linked to a session through `session_id`.

---

## 5. Admin Dashboard

### Navigation Tabs

Admin dashboard contains the following tabs:

#### Settings

Placeholder page for application settings.

#### Sessions

Session management page.

---

## 6. Sessions Tab Features

### Create Session

Admin can create a new session.

System automatically:

* Creates session.
* Creates plaintiff user.
* Creates defendant user.
* Generates login and password for both users.

### Display Credentials

For every generated participant:

* Role
* Login
* Password

must be visible.

### Copy Credentials

For each generated participant there must be a button:

**Copy Credentials**

The button copies:

```text
Role: <role>
Login: <login>
Password: <password>
```

to clipboard.

### Share Credentials

For each generated participant there must be a button:

**Share / Magic Link**

The button prepares a shareable message containing:

```text
Role: <role>
Login: <login>
Password: <password>
```

for sending through external messengers.

---

## 7. Relationships

### Session → Users

One session can contain:

* One plaintiff
* One defendant
* One mediator

All participants are linked using `session_id`.

```text
Session
 ├── Plaintiff
 ├── Defendant
 └── Mediator
```

---

## 8. MVP Scope

Included:

* User table
* Session table
* Login generation
* Password generation
* Plain text password storage
* Admin dashboard
* Settings tab
* Sessions tab
* Session creation
* Plaintiff generation
* Defendant generation
* Mediator creation
* Session-to-user binding
* Copy credentials
* Share credentials

Not included:

* Password hashing
* Password reset
* Email delivery
* Messenger integrations
* Permission management beyond role field
* Audit logs
* Notifications
* Multi-session mediator assignment
* Advanced settings
