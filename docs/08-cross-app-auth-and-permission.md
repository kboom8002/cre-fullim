# 08. Cross-app Auth and Permission

## 1. Purpose

This document defines how identity, roles, and permissions should work across JS Building SSoT MVP and JS Full IM Studio.

The apps are separate, but users may move from MVP to Full IM Studio through a handoff.

---

## 2. Identity Principle

> Identity may be shared. Permissions must be app-specific.

The same person may exist in both apps, but their role in each app can differ.

Example:

```text
MVP role: broker
Full IM Studio role: broker + im_editor

MVP role: public_user
Full IM Studio role: owner

MVP role: admin
Full IM Studio role: reviewer + admin
```

---

## 3. Shared Identity Fields

Use shared identifiers where possible:

```text
auth_user_id
profile_id
email
phone
workspace_id
broker_profile_id
```

Full IM Studio should maintain its own role mapping:

```text
full_im_user_roles
project_members
expert_profiles
reviewer_profiles
```

---

## 4. Cross-app Role Mapping

| MVP Role | Possible Full IM Role |
|---|---|
| anonymous | none / invite required |
| public_user | owner |
| broker | broker / im_editor |
| admin | reviewer / admin |
| system | system |

Role mapping should occur during import.

---

## 5. Handoff Permission Rules

A user can import a handoff if:

```text
- token is valid
- token is not expired
- token is not revoked
- user is authenticated or allowed by handoff policy
- user matches created_by OR has workspace permission OR has admin/reviewer role
```

Anonymous handoffs should require account creation before project creation.

---

## 6. Project Roles

Full IM Studio project-level roles:

```text
project_owner
broker
im_editor
expert
reviewer
admin
viewer
```

Project membership schema should support:

```text
project_id
user_id
role
status
invited_by
created_at
```

---

## 7. Permission Matrix

| Action | Owner | Broker | IM Editor | Expert | Reviewer | Admin |
|---|---|---|---|---|---|---|
| Import handoff | Limited | Yes | Yes | No | Yes | Yes |
| View project | Own | Assigned | Assigned | Assigned section | Assigned/all | All |
| Edit B-SSoT | Limited | Yes | Yes | No | Yes | Yes |
| Generate AI draft | No | Yes | Yes | No | Yes | Yes |
| Edit section | No | Yes | Yes | Assigned only | Yes | Yes |
| Submit expert patch | No | No | No | Assigned only | No | Yes |
| Run gate review | No | Request | Request | No | Yes | Yes |
| Approve buyer-ready | No | No | No | No | Yes | Yes |
| Export buyer-ready | View/request | Request | Request | No | Yes | Yes |
| Manage roles | No | No | No | No | No | Yes |

---

## 8. RLS Strategy

Every Full IM Studio table should be protected by RLS.

Core rules:

```text
- user can read projects they are a member of
- expert can read only assigned sections/evidence
- reviewer can read projects assigned for review
- admin can manage all
- system service role can run controlled background jobs only
```

Evidence files require additional access rules.

---

## 9. Evidence Access

Evidence access should be scoped by:

```text
project role
gate level
evidence visibility
expert assignment
review status
```

Expert should not automatically see all project evidence.

Expert can see:

```text
assigned section evidence
evidence explicitly linked to assignment
redacted summaries if full evidence is restricted
```

---

## 10. Handoff Token and Auth UX

### Authenticated User

```text
click handoff link
→ Full IM Studio validates session
→ imports project
```

### Unauthenticated User

```text
click handoff link
→ preview safe summary
→ sign in / create account
→ import project
```

### Permission Failure

```text
show safe message
do not reveal source details
log handoff_permission_denied
```

---

## 11. Admin Override

Admin may import or recover failed handoff only if:

```text
- reason is recorded
- activity event is emitted
- source data remains protected
```

---

## 12. Acceptance Criteria

Cross-app auth and permission is accepted when:

```text
- identity can be shared without sharing all permissions.
- handoff import requires valid token and permission.
- anonymous users cannot create unrestricted Full IM project.
- expert access is assignment-scoped.
- buyer-ready approval is reviewer/admin-only.
- all permission failures are logged safely.
```
