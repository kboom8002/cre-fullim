// src/domain/mobile-im/scenario-calculator.ts

export interface ScenarioInput {
  baseMonthlyRent: number;       // 기본 총 월세 (KRW)
  vacancyRatePct: number;        // 공실률 (%)
  opexRatePct: number;           // 운영비 비율 (%)
  purchasePrice: number;         // 매입가 (KRW)
  interestRatePct: number;       // 대출 금리 (%)
  ltvPct: number;                // LTV 비율 (%)
}

export interface ScenarioOutput {
  grossIncome: number;           // 잠재 연임대수입 (GPR)
  effectiveIncome: number;       // 실질 연임대수입 (EGI)
  noi: number;                   // 순운영소득 (NOI)
  capRate: number;               // 자본환원율 (%)
  cashOnCash: number;            // 세전 자기자본수익률 (%)
  dscr: number;                  // 부채감당률 (DSCR)
}

/**
 * What-if 시뮬레이션 산출 연산 엔진
 */
export function calculateScenario(input: ScenarioInput): ScenarioOutput {
  const {
    baseMonthlyRent,
    vacancyRatePct,
    opexRatePct,
    purchasePrice,
    interestRatePct,
    ltvPct
  } = input;

  // 1. 잠재 연수입 (Gross Potential Rent)
  const grossIncome = baseMonthlyRent * 12;

  // 2. 실질 연수입 (Effective Gross Income) - 공실 반영
  const vacancyLoss = grossIncome * (vacancyRatePct / 100);
  const effectiveIncome = Math.max(0, grossIncome - vacancyLoss);

  // 3. 순운영소득 (Net Operating Income) - 운영비(OPEX) 공제
  const opex = effectiveIncome * (opexRatePct / 100);
  const noi = Math.max(0, effectiveIncome - opex);

  // 4. 자본환원율 (Cap Rate)
  const capRate = purchasePrice > 0 ? (noi / purchasePrice) * 100 : 0;

  // 5. 대출액 및 이자비용 산정
  const debtPrincipal = purchasePrice * (ltvPct / 100);
  const annualInterest = debtPrincipal * (interestRatePct / 100);

  // 6. 부채감당률 (Debt Service Coverage Ratio)
  const dscr = annualInterest > 0 ? noi / annualInterest : 99.9; // 이자비용이 없으면 무한대 준하는 값

  // 7. 세전 현금흐름 및 자기자본수익률 (Cash on Cash)
  const equity = Math.max(1, purchasePrice - debtPrincipal);
  const cashFlowBeforeTax = noi - annualInterest;
  const cashOnCash = (cashFlowBeforeTax / equity) * 100;

  return {
    grossIncome,
    effectiveIncome,
    noi,
    capRate: parseFloat(capRate.toFixed(2)),
    cashOnCash: parseFloat(cashOnCash.toFixed(2)),
    dscr: parseFloat(dscr.toFixed(2))
  };
}
