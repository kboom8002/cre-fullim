# JS Full IM Studio — 데모 시딩 & 시연 계획

## 개요

잠재 고객에게 **핸드오프 수신 → 18섹션 자동 생성 → 전문가 검토 → Buyer-ready Export** 전 과정을 끊김 없이 보여주기 위한 Supabase 시딩 계획과 데모 스크립트입니다.

---

## 1. 데모 픽스처 설계 (`DEMO_A` 물건)

**대상 물건**: 성수권역 복합 상업시설 (6층, 연면적 1,850㎡, 95억원)

### 1-1. 핸드오프 레코드 (MVP → Full IM)

| 필드 | 값 |
|---|---|
| `handoff_token` | `hof_demo_2026_sungsu_001` |
| `source_building_ssot_lite_id` | `bsl_demo_sungsu_001` |
| `requested_output` | `buyer_ready_full_im` |
| `package_intent` | `ai_expert_review` |
| `expires_at` | `2027-12-31` |
| `status` | `pending_import` (시연 전 리셋) |

### 1-2. Building SSoT Full 핵심 데이터

```json
{
  "asset_identity": {
    "disclosure_name": "성수권역 복합 상업시설",
    "area_signal": "성동구 성수권역",
    "gross_area_sqm": 1850,
    "net_leasable_area_sqm": 1320,
    "building_type": "mixed_use",
    "floors_above_ground": 6,
    "construction_year": 2018,
    "asking_price_krw": 9500000000
  },
  "lease_income": {
    "lease_count": 8,
    "anchor_tenant_type": "F&B",
    "monthly_rent_total_krw": 38000000,
    "operating_expense_monthly_krw": 4200000,
    "rent_roll_confirmed": true
  },
  "legal_registry": {
    "land_use_zone": "일반상업지역",
    "floor_area_ratio": 0.82,
    "registry_confirmed": true
  },
  "disclosure_gate": {
    "gate_level": "G3",
    "protected_fields": ["exact_address","tenant_name","unit_rent","owner_contact"]
  }
}
```

### 1-3. Readiness 결과 (사전 계산 시딩)

| 항목 | 값 |
|---|---|
| `readiness_score` | **81** |
| `score_band` | Full IM Draft 가능 |
| available outputs | blind_teaser, external_snapshot, im_lite, full_im_draft |
| blocked outputs | buyer_ready_full_im (전문가 패치 1건 필요) |

### 1-4. 18섹션 상태 배분 (데모 극적 효과 최적화)

| 섹션 | 상태 | 시연 포인트 |
|---|---|---|
| Cover & Confidentiality | `planned` | |
| Executive Summary | `ai_draft` ✅ | AI 초안 완성 예시 |
| Investment Thesis | `ai_draft` ✅ | |
| Property Fact Sheet | `ai_draft` ✅ | |
| Location & Market | `ai_draft` ✅ | |
| Building Condition | `planned` | |
| **Rent Roll & Lease Quality** | `needs_expert_patch` ⚠️ | 전문가 배정 필요 강조 |
| **Income, NOI & Yield** | `needs_expert_patch` ⚠️ | 금융 가드레일 트리거 |
| Operating Expense | `planned` | |
| Valuation & Cap Rate | `planned` | |
| Value-add Scenario | `planned` | |
| Debt & Financing | `planned` | |
| Risk Factors | `ai_draft` ✅ | |
| Tax Structure | `planned` | |
| Legal & Title | `planned` | |
| Evidence Index | `planned` | |
| Deal Process | `ai_draft` ✅ | |
| **Disclaimer & Contact** | `planned` | 필수 포함 확인 |

### 1-5. 전문가 배정 (시연용 사전 준비)

```json
{
  "assignment_id": "asgn_demo_2026_001",
  "expert_role": "cre_consultant",
  "section_type": "income_noi_yield_analysis",
  "status": "assigned",
  "instructions": "NOI 추정치 및 Cap Rate 근거 검토 후 가드레일 준수 여부 확인 요망"
}
```

**before_text** (AI 초안 — 위험 문구 포함):
> "NOI는 약 4억원으로 추정되며 수익률이 보장됩니다."

**after_text** (전문가 패치 — 준비 완료):
> "공개 임대수익(연간 약 4.56억원) 및 추정 운영비(연간 약 0.5억원) 기준 NOI는 약 4억원 내외로 추정됩니다. 실제 수익률은 임대조건, 공실기간, 운영비 변동에 따라 달라질 수 있으며, 별도 실사를 통해 확인하시기 바랍니다."

**edit_tags**: `["overclaim_removed", "risk_balance_added", "financial_assumption_added"]`

### 1-6. Golden Dataset 후보 (Admin 탭 시연용)

```json
{
  "section_type": "income_noi_yield_analysis",
  "redaction_status": "redacted",
  "training_rights": "allowed_anonymized",
  "review_status": "candidate"
}
```

---

## 2. Supabase 시딩 스크립트 구성

### 파일 구조

```
scripts/
  demo-seed.ts          ← 메인 시딩 실행기
  demo-reset.ts         ← 데모 후 초기화 (handoff status 리셋)
  fixtures/
    demo-handoff.ts
    demo-bssot-full.ts
    demo-im-project.ts
    demo-sections.ts    ← 18섹션 전부
    demo-expert.ts      ← 배정 + 패치
    demo-golden.ts
```

### `demo-seed.ts` 핵심 흐름

```typescript
// 1. handoff_source_snapshots 삽입 (status: pending_import)
// 2. building_ssot_full 삽입
// 3. im_projects 삽입 (status: outline_generated, readiness_score: 81)
// 4. im_sections 18건 삽입 (섹션별 상태 배분)
// 5. expert_profiles 삽입 (시연용 전문가 계정)
// 6. expert_assignments 삽입 (NOI 섹션)
// 7. expert_patches 삽입 (before/after 준비)
// 8. golden_im_candidates 삽입
// 9. activity_events 삽입 (타임라인 풍성하게)
```

### `demo-reset.ts` (시연 반복 시 사용)

```typescript
// handoff status → pending_import 리셋
// im_project status → readiness_pending 리셋
// expert_patch status → draft 리셋
// golden_candidate review_status → candidate 리셋
```

---

## 3. 데모 페르소나 & 계정

| 역할 | 이메일 | 비밀번호 | 시연 장면 |
|---|---|---|---|
| 브로커 (주연) | `broker@demo.im` | `Demo1234!` | 핸드오프 수신, 프로젝트 관리 |
| CRE 전문가 | `expert@demo.im` | `Demo1234!` | Expert Workbench 패치 제출 |
| 관리자 | `admin@demo.im` | `Demo1234!` | Golden Dataset 승인, Analytics |

---

## 4. 데모 시연 스크립트 (30분 구성)

### 🎬 Scene 1 — 핸드오프 수신 (5분)

**진행자 멘트**: "브로커가 MVP에서 '이 건물 Full IM 만들기'를 클릭하면, 핸드오프 토큰이 생성됩니다."

1. `/im-projects/import` 접속
2. 토큰 `hof_demo_2026_sungsu_001` 입력
3. **Import & Create Project** 클릭
4. ✅ 성수권역 복합 상업시설 프로젝트 생성 확인
5. → 자동으로 Project Dashboard로 이동

**강조 포인트**: 주소/테넌트명 등 민감정보는 처음부터 마스킹 처리됨을 보여줌

---

### 🎬 Scene 2 — Readiness Check & 자료 준비도 (5분)

**진행자 멘트**: "AI가 18개 섹션 작성을 위한 자료 준비도를 즉시 평가합니다."

1. Project Dashboard에서 **Run Readiness Check** 클릭
2. Readiness Score **81점** 표시
3. `full_im_draft` 가능 / `buyer_ready_full_im` 블록 상태 확인
4. "NOI 섹션에 전문가 검토 필요" 항목 강조

**강조 포인트**: 어떤 섹션이 AI 단독으로 가능하고, 어떤 섹션이 전문가 필요인지 즉시 파악 가능

---

### 🎬 Scene 3 — 18섹션 자동 생성 (7분)

**진행자 멘트**: "준비된 데이터를 기반으로 AI가 18개 섹션 아웃라인을 자동 생성합니다."

1. **Generate Outline** 클릭
2. 18개 섹션이 상태와 함께 리스트로 표시
3. `ai_draft` 상태 섹션(Executive Summary) 클릭 → 초안 내용 확인
4. `needs_expert_patch` 섹션(NOI & Yield) 클릭 → 위험 문구 표시
5. 금융 가드레일 작동: "수익률이 보장됩니다" → ⚠️ 경고 배지

**강조 포인트**: AI가 직접 쓸 수 없는 금융 과장 표현을 스스로 플래그 처리

---

### 🎬 Scene 4 — 전문가 검토 (Expert Workbench) (7분)

**진행자 멘트**: "전문가 계정으로 로그인하면 배정된 섹션만 보입니다."

1. `expert@demo.im`으로 전환 (또는 새 탭)
2. `/expert/assignments` → NOI 검토 배정 확인
3. 배정 클릭 → Expert Workbench 3열 레이아웃
4. AI 초안의 문제 문구 확인
5. Patch Type: `financial_assumption_fix` 선택
6. After Text 입력 (준비된 내용 붙여넣기)
7. Edit Tags: `overclaim_removed`, `risk_balance_added` 선택
8. **패치 제출** → Toast 성공 메시지

**강조 포인트**: 전문가는 필요한 섹션만 보고 수정, 원본은 보존됨

---

### 🎬 Scene 5 — Admin & Golden Dataset (3분)

**진행자 멘트**: "관리자는 전문가 패치를 익명화하여 AI 학습 데이터로 승인할 수 있습니다."

1. `admin@demo.im`으로 전환
2. `/admin/golden-candidates` 접속
3. NOI 패치 후보 확인 (redacted 상태)
4. **승인** 클릭 → 상태 변경 확인
5. `/admin/analytics` → 이벤트 현황 대시보드

---

### 🎬 Scene 6 — Export (3분)

**진행자 멘트**: "모든 Gate를 통과하면 Buyer-ready Full IM을 내보낼 수 있습니다."

1. Project Dashboard → **Export** 버튼
2. 포맷 선택 (Markdown / PDF)
3. 면책조항(Disclaimer) 자동 포함 확인
4. Export 완료 Toast

---

## 5. 데모 환경 준비 체크리스트

```
□ Supabase demo-seed.ts 실행 완료
□ 3개 데모 계정 생성 및 역할 설정 완료
□ .env.local NEXT_PUBLIC_SUPABASE_URL / ANON_KEY 확인
□ npm run dev 정상 가동 (localhost:3000)
□ 시연 전 demo-reset.ts 실행 (상태 초기화)
□ 브라우저 2탭 준비 (브로커 / 전문가)
□ 발표 노트북 화면 해상도 1440p 이상
□ 네트워크 안정성 확인 (또는 오프라인 Demo Mode 준비)
```

---

## 6. 다음 구현 우선순위

1. **`scripts/demo-seed.ts`** — 위 픽스처 기반 실제 Supabase INSERT 스크립트 작성
2. **`scripts/demo-reset.ts`** — 반복 시연용 상태 초기화
3. **Demo Mode API** — 실제 MVP 핸드오프 없이 토큰 `hof_demo_*` 패턴을 자동 통과시키는 로컬 Mock 레이어
4. **Export 페이지 완성** — Markdown 미리보기 + 면책조항 자동 삽입
