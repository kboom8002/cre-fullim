# JS Full IM Studio

**CRE (Commercial Real Estate) Investment Memorandum 자동 생성 플랫폼**

AI 기반 IM 초안 생성, 전문가 패치, Gate 검토, 안전한 Buyer-ready 출력까지 — 완전한 딜 문서 워크플로우를 구현합니다.

---

## 빠른 시작

```bash
npm install
npm run dev          # http://localhost:3000
npm run test         # 전체 테스트 실행
npm run typecheck    # TypeScript 타입 검사
```

---

## 주요 기능 (Slice 3-14)

| Slice | 기능 | 상태 |
|---|---|---|
| 3 | Full B-SSoT Upgrade (Lite → Full) | ✅ |
| 4 | IM Readiness Engine (점수 + 가용 출력) | ✅ |
| 5 | 18-Section Planner | ✅ |
| 6 | AI Section Draft + Guardrails | ✅ |
| 7 | Section Editor (3-panel) | ✅ |
| 8 | Expert Workbench | ✅ |
| 9 | Gate Review Console | ✅ |
| 10 | Export System (Markdown/PDF/PPTX) | ✅ |
| 11 | Deal Room Q&A Pack | ✅ |
| 12 | Golden Dataset Pipeline | ✅ |
| 13 | Admin / Analytics Console | ✅ |
| 14 | QA / Commercial Polish | ✅ |

---

## 핵심 보안 원칙

### AI 안전 (docs/18, docs/19)

- **RiskBoundary**: 투자 추천, 수익률 보장, 대출 가능 확정 등 P0 클레임 자동 차단/재작성
- **DisclosureGuard**: 정확한 주소, 임차인명, 호실 임대료 → 공개 출력에서 자동 redact
- **Buyer-ready Guard**: P0 위반 또는 Gate 미통과 시 buyer-ready 승인 불가

### 데이터 보안

```text
storage_path → 외부 공개 출력에서 절대 미포함
exact_address → public_blind 출력에서 [권역]으로 대체
tenant_name → buyer_ready 출력에서 [업종]으로 대체
unit_rent → [호실 임대료]로 일반화
```

---

## 프로젝트 구조

```
src/
├── app/
│   ├── api/                        # API Routes
│   │   ├── handoff/                # Handoff import
│   │   ├── im-projects/[id]/       # Project + Readiness + Outline + Sections
│   │   ├── im-sections/[id]/       # Section draft
│   │   ├── expert/                 # Expert assignments
│   │   ├── golden-im-candidates/   # Golden dataset pipeline
│   │   └── admin/                  # Admin analytics + gate queue
│   ├── handoff/[token]/            # Handoff preview + import
│   ├── im-projects/[id]/           # Project dashboard + all sub-pages
│   │   ├── bssot/                  # Full B-SSoT viewer
│   │   ├── sections/               # 18-section editor
│   │   ├── gate-review/            # Gate review console
│   │   ├── export/                 # Export preview
│   │   └── qna-pack/               # Deal Room Q&A
│   ├── expert/assignments/         # Expert workbench
│   ├── reviewer/gate-reviews/      # Gate review queue
│   └── admin/                      # Admin hub + analytics + projects + experts
│       └── golden-candidates/      # Golden dataset admin
├── domain/                         # Pure business logic (no I/O)
│   ├── handoff/                    # Handoff validation + safe preview
│   ├── bssot/                      # B-SSoT upgrade (Lite → Full)
│   ├── readiness/                  # Readiness scoring
│   ├── sections/                   # Section planner + status transitions
│   ├── ai/                         # Draft writer + Risk/Disclosure guardrails
│   ├── expert/                     # Expert patch schema + validation
│   ├── gate/                       # Gate review engine
│   ├── export/                     # Export eligibility + markdown builder
│   ├── dealroom/                   # Q&A pack + evidence index
│   ├── golden/                     # Golden dataset service
│   ├── admin/                      # Admin access + analytics + next best action
│   └── qa/                         # Commercial readiness service + UX helpers
├── lib/
│   ├── supabase/                   # Supabase clients (server/service/client)
│   └── schema/                     # Shared schemas
└── __tests__/                      # All test files
    └── fixtures/                   # Demo fixtures
```

---

## 테스트

### 전체 테스트

```bash
npm run test
# 15개 테스트 파일, 339개 테스트 전체 통과
```

### 핵심 Regression Suite

```bash
# 타입 검사 + 전체 테스트
npm run test:regression

# AI Guardrail + Gate + Export 집중 테스트
npm run test:guardrails

# Commercial Readiness (Demo A-J + Pilot Score)
npm run test:commercial-readiness
```

---

## 주요 라우트

| URL | 설명 |
|---|---|
| `/handoff/[token]` | MVP 핸드오프 수신 + 프리뷰 + 임포트 |
| `/im-projects` | IM 프로젝트 목록 |
| `/im-projects/[id]` | 프로젝트 대시보드 (Readiness, Next Action) |
| `/im-projects/[id]/bssot` | Full B-SSoT 레이어 뷰어 |
| `/im-projects/[id]/sections` | 18섹션 에디터 |
| `/im-projects/[id]/gate-review` | Gate 검토 콘솔 |
| `/im-projects/[id]/export` | Export 미리보기 + 내보내기 |
| `/im-projects/[id]/qna-pack` | Deal Room Q&A Pack |
| `/expert/assignments` | 전문가 배정 목록 |
| `/expert/assignments/[id]` | 전문가 패치 작성 |
| `/reviewer/gate-reviews` | Reviewer Gate 검토 큐 |
| `/admin` | Admin 허브 |
| `/admin/analytics` | 퍼널 + Safety 이벤트 분석 |
| `/admin/golden-candidates` | Golden Dataset 후보 관리 |

---

## 역할 (Role)

| 역할 | 권한 |
|---|---|
| `broker` | 프로젝트 생성, 핸드오프 수신, 섹션 편집 요청 |
| `im_editor` | 섹션 편집, AI 초안 생성 |
| `expert` | 배정된 섹션만 열람 + 패치 제출 |
| `reviewer` | Gate 검토, Buyer-ready 승인, Golden 후보 검토 |
| `admin` | 전체 접근, Analytics, Admin 페이지 |

---

## 환경 변수

```env
NEXT_PUBLIC_SUPABASE_URL=<supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
MVP_BASE_URL=<js-building-ssot-mvp url>     # Handoff 연동
```

---

## Pilot Readiness

`npm run test:commercial-readiness`를 실행하면 20개 항목 체크리스트가 자동 검증됩니다.

**파일럿 기준**: 20점 중 16점 이상 + P0 공시 이슈 없음 + Buyer-ready Guard 동작

현재 구현 상태: **20/20 항목 구현 완료**

---

## 문서

| 문서 | 내용 |
|---|---|
| `docs/10-domain-model.md` | 도메인 모델 |
| `docs/15-ai-agent-contracts.md` | AI 에이전트 계약 |
| `docs/18-risk-boundary-policy.md` | Risk Boundary 정책 |
| `docs/19-disclosure-guard-policy.md` | Disclosure Guard 정책 |
| `docs/28-test-plan.md` | 테스트 계획 |
| `docs/33-demo-scenarios.md` | Demo A-J 시나리오 |
| `docs/34-commercial-readiness-checklist.md` | 파일럿 준비 체크리스트 |
