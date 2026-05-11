# 05. Integration with MVP

## 1. Purpose

This document defines how **JS Full IM Studio** integrates with the already-developed **JS Building SSoT MVP v0.1**.

The integration must preserve the boundary:

```text
MVP = lead generation and Building SSoT Lite creation
Full IM Studio = professional Full IM production
```

The two systems should be connected through explicit handoff contracts, not through direct imports of internal MVP code.

---

## 2. Integration Principle

> MVP creates a qualified Full IM opportunity. Full IM Studio converts it into a professional IM project.

The integration flow is:

```text
MVP user action
→ full_im_handoff_created
→ handoff token
→ Full IM Studio import
→ building_ssot_lite snapshot imported
→ building_ssot_full created
→ im_project created
→ readiness check runs
```

---

## 3. Integration Entry Points from MVP

MVP can send users to Full IM Studio from:

```text
1. Public Building Radar result
2. Blind Deal Card result
3. Owner Readiness result
4. Expert Note request result
5. Broker workspace deal card
6. Buyer Memo / candidate building link
```

Recommended CTA labels:

```text
Full IM 제작 가능 여부 확인
AI IM 초안 만들기
전문가 검토 의뢰하기
매각자료 제작 상담하기
Deal Room 패키지 준비하기
```

---

## 4. MVP Must Provide

When handoff is created, MVP should provide:

```text
building_ssot_lite_id
source document ids
owner_readiness_id if available
buyer_intent_id if available
requested output
user role / actor id
contracts version
payload version
expiry
```

MVP must not provide uncontrolled private fields in the handoff payload unless marked with visibility and gate requirements.

---

## 5. Full IM Studio Must Do

Full IM Studio must:

```text
1. validate handoff token
2. validate payload version
3. validate source app
4. validate user permission
5. import source snapshot
6. create building_ssot_full draft
7. create im_project
8. attach source document references
9. record handoff_imported event
10. run readiness check or queue readiness job
```

Full IM Studio must not mutate MVP source rows.

---

## 6. Data Ownership Boundary

### MVP owns:

```text
building_ssot_lite
building_signal_card
deal_curiosity_report
blind_teaser
buyer_intent_lite
owner_readiness_check
expert_note_request
handoff record
```

### Full IM Studio owns:

```text
handoff import record
building_ssot_full
im_project
im_section
expert_assignment
expert_patch
gate_review
export_job
qna_pack
golden_candidate
```

### Shared:

```text
auth identity
profile id
contracts version
activity event vocabulary
disclosure policy
```

---

## 7. Handoff Modes

### 7.1 Token Handoff

Recommended for web navigation.

```text
MVP creates handoff token
→ user clicks Full IM Studio link
→ Full IM Studio reads token
→ import workflow starts
```

Example link:

```text
https://fullim.js-oracle.ai/import?handoff_token=hof_abc123
```

### 7.2 Server-to-server Handoff

Recommended for back-office workflow.

```text
MVP backend creates handoff
→ Full IM Studio backend imports payload
→ user is notified
```

### 7.3 Manual Import

Fallback.

```text
user uploads exported JSON / source docs
→ Full IM Studio creates project
```

Manual import must still validate contracts.

---

## 8. Integration Security Rules

```text
- handoff token must expire
- handoff token must be single-use or revocable
- handoff payload must include source_app and payload_version
- protected fields must carry visibility metadata
- Full IM Studio must not trust raw payload blindly
- Full IM Studio must re-run disclosure policy on import
- import must create audit/activity event
```

---

## 9. Suggested User Experience

### From MVP

After a report or deal card:

```text
이 건물은 Full IM 초안 검토가 가능합니다.
현재 자료 상태로는 AI IM Lite 또는 전문가 검토형 Full IM을 시작할 수 있습니다.

[Full IM 제작 가능 여부 확인]
```

### In Full IM Studio

First screen after import:

```text
MVP에서 가져온 건물 자료를 확인했습니다.

다음 단계:
1. 자료 준비 상태 확인
2. 부족자료 보강
3. Full IM 초안 생성
4. 전문가 검토 요청
```

---

## 10. Integration Failure States

| Failure | User Message | System Action |
|---|---|---|
| expired token | 이 요청은 만료되었습니다. | allow user to request new handoff |
| invalid token | 유효하지 않은 요청입니다. | log security event |
| permission denied | 접근 권한이 없습니다. | block import |
| source missing | 원본 자료를 찾지 못했습니다. | retry or contact admin |
| contract mismatch | 데이터 형식이 맞지 않습니다. | show support code |
| disclosure violation | 민감정보 검토가 필요합니다. | import as internal_only and flag review |

---

## 11. Activity Events

MVP should emit:

```text
full_im_requested
full_im_handoff_created
```

Full IM Studio should emit:

```text
handoff_import_started
handoff_imported
handoff_import_failed
im_project_created
bssot_full_created
im_readiness_check_queued
```

---

## 12. Acceptance Criteria

Integration with MVP is accepted when:

```text
- MVP can create a handoff token.
- Full IM Studio can validate and import the handoff.
- Full IM Studio creates its own project objects.
- MVP source rows are not mutated.
- protected fields remain protected.
- events are recorded on both sides.
- failed imports are safely handled.
```
