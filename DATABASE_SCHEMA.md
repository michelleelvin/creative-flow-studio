# Creative Flow Studio Database Schema

## Users

* id (UUID, PK)
* name
* email (unique)
* department
* position
* avatar_url
* status
* last_login
* created_at
* updated_at

---

## Roles

* id (UUID, PK)
* name
* description
* created_at

---

## User Roles

* user_id (FK -> Users.id)
* role_id (FK -> Roles.id)

---

## Projects

* id (UUID, PK)
* name
* client
* type (video/static)
* current_stage
* progress
* owner_id (FK -> Users.id)
* deadline
* created_at
* updated_at

---

## Project Members

* project_id (FK -> Projects.id)
* user_id (FK -> Users.id)

---

## Tasks

* id (UUID, PK)
* project_id (FK -> Projects.id)
* title
* description
* assignee_id (FK -> Users.id)
* stage
* status
* priority
* deadline
* started_at
* completed_at
* time_spent_minutes
* created_at
* updated_at

---

## Task Comments

* id (UUID, PK)
* task_id (FK -> Tasks.id)
* user_id (FK -> Users.id)
* comment
* created_at

---

## Task Attachments

* id (UUID, PK)
* task_id (FK -> Tasks.id)
* file_name
* file_url
* uploaded_by
* created_at

---

## Reviews

* id (UUID, PK)
* task_id (FK -> Tasks.id)
* reviewer_id (FK -> Users.id)
* status
* feedback
* created_at

---

## Notifications

* id (UUID, PK)
* user_id (FK -> Users.id)
* message
* type
* is_read
* created_at

---

## Audit Logs

* id (UUID, PK)
* user_id (FK -> Users.id)
* action
* target
* details
* ip_address
* created_at

---

## Permissions
- id (UUID, PK)
- role_id (FK -> Roles.id)
- module
- action
- allowed