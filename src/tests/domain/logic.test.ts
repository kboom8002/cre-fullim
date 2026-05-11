import { describe, test, expect } from 'vitest';
import { ReadinessService } from '@/domain/readiness/readiness-service';
import { planSections } from '@/domain/sections/section-planner';
import { runGateCheck, canApproveBuyerReady } from '@/domain/gate/gate-review-service';
import { generateMobileIM } from '@/domain/mobile-im/mobile-im-writer';

describe('FI-L2 Domain Logic', () => {
  test('FI-L2-01: Readiness score calculation', async () => {
    // Need to test missing rent_roll reduces score
    const ssot = {
      lease_income: {
        rent_roll_confirmed: false,
      }
    };
    const readiness = await ReadinessService.evaluateReadiness({
      project_id: 'test',
      target_output: 'full_im',
      building_ssot_full: ssot
    });
    
    expect(readiness.readiness_score).toBeLessThan(100);
    expect(readiness.missing_required_data).toContain('rent_roll');
  });

  test('FI-L2-02: 18 section planner', async () => {
    const ssot = { lease_income: { rent_roll_confirmed: true, operating_expenses_confirmed: true } };
    const readiness = await ReadinessService.evaluateReadiness({
      project_id: 'test',
      target_output: 'full_im',
      building_ssot_full: ssot
    });

    const sections = planSections({
      project_id: 'test',
      target_output: 'full_im',
      building_ssot_full: ssot,
      readiness_result: readiness
    });

    expect(sections.length).toBe(18);
    const uniqueTypes = new Set(sections.map(s => s.section_type));
    expect(uniqueTypes.size).toBe(18);
  });

  test('FI-L2-03 & FI-L2-04: Gate checks (Disclosure & Risk)', () => {
    const checkResult = runGateCheck({
      project_id: 'test',
      sections: [{ id: 's1', section_type: 'executive_summary', status: 'draft', requires_expert_patch: false, missing_data: [] }],
      building_ssot_full: { disclosure_gate: { protected_fields: ['exact_address'] }, lease_income: { rent_roll_confirmed: true, operating_expenses_confirmed: true } },
      expert_patches: [],
      section_markdown_samples: [
        { section_id: 's1', markdown: '강남구 역삼동 123-45 번지에 위치하며 수익률 보장합니다.', visibility: 'public' }
      ],
      readiness_score: 100
    });

    expect(checkResult.overall_status).toBe('blocked');
    expect(checkResult.has_p0_violation).toBe(true);
    
    const disclosureViolation = checkResult.violations.find(v => v.gate_type === 'disclosure_gate');
    expect(disclosureViolation).toBeDefined();
    
    const riskViolation = checkResult.violations.find(v => v.gate_type === 'risk_gate');
    expect(riskViolation).toBeDefined();
  });

  test('FI-L2-05: Mobile IM 7-section generation', async () => {
    const mobileIM = await generateMobileIM({
      building_ssot_lite: {
        asset_identity: { asset_type: '빌딩', area_signal: '강남구' }
      },
      supplemental: {
        monthly_rent_total_krw: 5000000
      },
      readiness: { score: 80, missing: [] }
    });

    expect(mobileIM.sections.length).toBe(7);
    expect(mobileIM.sections[0].section_type).toBe('property_overview');
    expect(mobileIM.sections[0].markdown).toContain('강남구');
  });

  test('FI-L2-06: Buyer-Ready Approval', () => {
    const approval = canApproveBuyerReady({
      actor_role: 'reviewer',
      gate_results: [{ gate_type: 'disclosure_gate', status: 'pass' }],
      has_p0_violation: false,
      missing_required_patches: []
    });
    
    expect(approval.can_approve).toBe(true);
    
    const invalidRole = canApproveBuyerReady({
      actor_role: 'broker', // only reviewer or admin
      gate_results: [],
      has_p0_violation: false,
      missing_required_patches: []
    });
    
    expect(invalidRole.can_approve).toBe(false);
  });
});
