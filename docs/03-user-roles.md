# 03. User Roles

## 1. Purpose

This document defines the user roles, permissions, and workflows for JS Full IM Studio.

Full IM Studio is a professional production workspace. It needs more granular roles than the MVP.

---

## 2. Role Overview

```text
owner
broker
im_editor
expert
reviewer
admin
system
```

Optional future roles:

```text
buyer_viewer
dealroom_guest
external_partner
```

---

## 3. Owner

### Description

The building owner or seller-side client.

### Primary Jobs

```text
- provide building information
- upload evidence
- review missing data
- approve project direction
- request Full IM or Expert Review
```

### Permissions

Can:

```text
- view own project dashboard
- upload evidence files
- complete owner checklist
- view readiness result
- view approved outputs
- request expert/full build service
```

Cannot:

```text
- approve buyer-ready status
- edit expert patches
- bypass disclosure gate
- view internal broker notes unless allowed
```

---

## 4. Broker

### Description

JS broker or authorized broker coordinating the deal document.

### Primary Jobs

```text
- create/import IM projects
- coordinate building data
- manage client context
- review AI drafts
- request expert patches
- prepare buyer sharing
```

### Permissions

Can:

```text
- import MVP handoff
- create IM project
- edit project metadata
- add evidence
- generate AI drafts
- request expert patch
- view gate review results
- request export
```

Cannot:

```text
- approve buyer-ready output without reviewer role
- bypass P0 disclosure issues
- override legal/tax/financial gate without reviewer/admin permission
```

---

## 5. IM Editor

### Description

Professional editor or internal operator responsible for section-by-section document production.

### Primary Jobs

```text
- edit Full IM sections
- organize source refs
- fix structure
- prepare draft for expert/reviewer
```

### Permissions

Can:

```text
- edit im_sections
- create section versions
- run section rewrite
- mark missing data
- assign expert review request draft
```

Cannot:

```text
- approve final buyer-ready status
- change protected disclosure policy
- approve expert patches
```

---

## 6. Expert

### Description

Professional reviewer such as CRE consultant, lawyer, tax accountant, architect, valuation expert, market expert, or financing expert.

### Expert Roles

```text
cre_consultant
legal_expert
tax_accounting_expert
valuation_expert
architect_building_expert
market_research_expert
debt_financing_expert
broker_expert
```

### Primary Jobs

```text
- review assigned section
- patch AI draft
- add risk/evidence notes
- tag edit reasons
- select visibility after review
```

### Permissions

Can:

```text
- view assigned sections only
- view evidence needed for assigned section
- submit expert patch
- add edit tags
- mark additional review required
```

Cannot:

```text
- view all project data by default
- approve full project
- access unrelated evidence
- change gate policy
```

---

## 7. Reviewer

### Description

Internal JS reviewer responsible for quality, risk, and buyer-ready approval.

### Primary Jobs

```text
- run gate review
- approve/reject buyer-ready status
- verify disclosure
- verify risk and financial consistency
- approve export
```

### Permissions

Can:

```text
- view full project
- review all sections
- run Data Gate
- run Disclosure Gate
- run Risk Gate
- run Financial Consistency Gate
- approve buyer-ready output
- block export
```

Cannot:

```text
- bypass system logging
- silently delete expert patch history
```

---

## 8. Admin

### Description

System operator with workspace-level management authority.

### Primary Jobs

```text
- manage users
- manage experts
- monitor analytics
- resolve escalations
- manage templates and prompt versions
```

### Permissions

Can:

```text
- manage all projects
- manage roles
- manage expert assignments
- view audit events
- view AI runs
- configure templates
```

Admin actions must be auditable.

---

## 9. System

### Description

Automated worker or AI orchestration process.

### Allowed Actions

```text
- create AI draft
- run readiness check
- run guardrail checks
- create gate review suggestions
- create activity events
- create golden candidates after allowed inputs
```

System cannot:

```text
- approve buyer-ready final output
- bypass reviewer approval
- change user roles
```

---

## 10. Permission Matrix

| Action | Owner | Broker | IM Editor | Expert | Reviewer | Admin |
|---|---|---|---|---|---|---|
| Import handoff | No | Yes | Yes | No | Yes | Yes |
| Create project | Limited | Yes | Yes | No | Yes | Yes |
| Upload evidence | Yes | Yes | Yes | Limited | Yes | Yes |
| Generate AI draft | No | Yes | Yes | No | Yes | Yes |
| Edit section | No | Yes | Yes | Assigned only | Yes | Yes |
| Submit expert patch | No | No | No | Assigned only | No | Yes |
| Run gate review | No | Request only | Request only | No | Yes | Yes |
| Approve buyer-ready | No | No | No | No | Yes | Yes |
| Export buyer-ready IM | View only | Request only | Request only | No | Yes | Yes |
| Manage roles | No | No | No | No | No | Yes |

---

## 11. Role-based UX

### Owner UX

```text
simple dashboard
missing data checklist
upload evidence
request expert/full IM
```

### Broker UX

```text
project dashboard
readiness
sections
expert patch request
export request
```

### IM Editor UX

```text
section editor
source panel
risk/disclosure panel
section status controls
```

### Expert UX

```text
assignment list
section review
evidence view
patch submission
edit tags
```

### Reviewer UX

```text
gate review console
violations
required actions
buyer-ready approval
```

### Admin UX

```text
workspace console
users
experts
projects
analytics
audit events
```

---

## 12. Acceptance Criteria

User roles are accepted when:

```text
- Each role has clear jobs and permissions.
- Expert access is assignment-scoped.
- Buyer-ready approval is restricted to reviewer/admin.
- System actions cannot approve final output.
- Permission model supports RLS and UI routing.
```
