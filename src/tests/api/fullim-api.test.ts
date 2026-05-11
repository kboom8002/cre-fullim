import { describe, test, expect } from 'vitest';

/**
 * FI-L3 API 엔드포인트 E2E 테스트 (P0)
 */

const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3001'; // Assuming fullim runs on 3001
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || 'dummy-token';
const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AUTH_TOKEN}`
};

describe('FI-L3 FullIM API (P0)', () => {
  let projectId = '';

  test('FI-L3-01: IM 프로젝트 생성', async () => {
    if (AUTH_TOKEN === 'dummy-token') return;

    const res = await fetch(`${BASE_URL}/api/im-projects`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        building_ssot_lite_id: 'test-building',
        target_output: 'full_im'
      })
    });
    
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.projectId).toBeDefined();
    projectId = data.projectId;
  });

  test('FI-L3-02: 섹션 초안 생성', async () => {
    if (AUTH_TOKEN === 'dummy-token') return;
    if (!projectId) return;

    const res = await fetch(`${BASE_URL}/api/im-sections/generate`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        projectId,
        sectionType: 'executive_summary'
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(typeof data.markdown).toBe('string');
  });

  test('FI-L3-03: Gate 체크 실행', async () => {
    if (AUTH_TOKEN === 'dummy-token') return;
    if (!projectId) return;

    const res = await fetch(`${BASE_URL}/api/im-projects/${projectId}/gate-check`, {
      method: 'POST',
      headers: HEADERS
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.overall_status).toBeDefined();
  });

  test('FI-L3-04: 모바일 IM 생성', async () => {
    if (AUTH_TOKEN === 'dummy-token') return;

    const res = await fetch(`${BASE_URL}/api/mobile-im/generate`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        building_ssot_lite_id: 'test-building'
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.sections.length).toBe(7);
  });
});
