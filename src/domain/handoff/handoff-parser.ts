import { OpenAI } from "openai";

interface StructuredBuyerFit {
  fit_types: string[];
  misfit_types: string[];
  buyer_messages: string[];
}

interface StructuredRiskUnknown {
  risk_items: Array<{
    category: string;
    risk: string;
    evidence_needed: string[];
    expert_required: boolean;
  }>;
}

/**
 * Deterministic Fallback Parser for fit_summary
 */
function parseFitSummaryFallback(text: string): StructuredBuyerFit {
  const cleanText = text || "";
  const fit_types: string[] = [];
  const misfit_types: string[] = [];
  const buyer_messages: string[] = [];

  // Split by common delimiters
  const lines = cleanText.split(/[,\n·•\-]+/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Check for common fit keywords
    if (line.includes("수익") || line.includes("임대") || line.includes("배당")) {
      fit_types.push("수익형");
    } else if (line.includes("개발") || line.includes("신축") || line.includes("리모델링") || line.includes("밸류")) {
      fit_types.push("개발형");
    } else if (line.includes("직접") || line.includes("사옥") || line.includes("실사용")) {
      fit_types.push("직접사용형");
    } else if (line.includes("증여") || line.includes("상속") || line.includes("가족")) {
      fit_types.push("증여형");
    }

    // Check for misfit keywords
    if (line.includes("불적합") || line.includes("비선호") || line.includes("어려움") || line.includes("제한")) {
      misfit_types.push(line);
    } else {
      buyer_messages.push(line);
    }
  }

  // Ensure default values if empty
  if (fit_types.length === 0) fit_types.push("수익형");

  return {
    fit_types,
    misfit_types,
    buyer_messages: buyer_messages.length > 0 ? buyer_messages : [cleanText],
  };
}

/**
 * Deterministic Fallback Parser for caution_summary
 */
function parseCautionSummaryFallback(text: string): StructuredRiskUnknown {
  const cleanText = text || "";
  const risk_items: StructuredRiskUnknown["risk_items"] = [];

  const lines = cleanText.split(/[,\n·•\-]+/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    let category = "기타";
    let expert_required = false;
    const evidence_needed: string[] = [];

    // Category inference
    if (line.includes("공실") || line.includes("임대") || line.includes("세입자") || line.includes("임차")) {
      category = "임대차";
      evidence_needed.push("임대차현황표", "임대차계약서");
    } else if (line.includes("등기") || line.includes("근저당") || line.includes("압류") || line.includes("권리")) {
      category = "권리관계";
      expert_required = true;
      evidence_needed.push("등기부등본");
    } else if (line.includes("위반") || line.includes("대장") || line.includes("건축") || line.includes("조정")) {
      category = "물리적상태";
      expert_required = true;
      evidence_needed.push("건축물대장");
    }

    if (evidence_needed.length === 0) {
      evidence_needed.push("관련 확인 서류");
    }

    risk_items.push({
      category,
      risk: line,
      evidence_needed,
      expert_required,
    });
  }

  if (risk_items.length === 0 && cleanText) {
    risk_items.push({
      category: "기타",
      risk: cleanText,
      evidence_needed: ["기타 증빙 서류"],
      expert_required: false,
    });
  }

  return { risk_items };
}

/**
 * AI-powered parser for fit_summary using OpenAI
 */
export async function parseFitSummary(text: string): Promise<StructuredBuyerFit> {
  const fallback = parseFitSummaryFallback(text);
  if (!text || !process.env.OPENAI_API_KEY) return fallback;

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: process.env.AI_DEFAULT_MODEL || "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a specialized commercial real estate AI that structures text summaries into JSON fields. Output ONLY valid raw JSON.",
        },
        {
          role: "user",
          content: `Parse this real estate broker's fit summary: "${text}".
Return a JSON object with:
- fit_types: array of strings (choose from: "수익형", "개발형", "직접사용형", "증여형")
- misfit_types: array of strings describing non-ideal conditions
- buyer_messages: array of key investment selling points
Ensure the JSON is strictly compliant.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const content = response.choices[0].message.content;
    if (content) {
      const parsed = JSON.parse(content);
      return {
        fit_types: Array.isArray(parsed.fit_types) ? parsed.fit_types : fallback.fit_types,
        misfit_types: Array.isArray(parsed.misfit_types) ? parsed.misfit_types : fallback.misfit_types,
        buyer_messages: Array.isArray(parsed.buyer_messages) ? parsed.buyer_messages : fallback.buyer_messages,
      };
    }
  } catch (err) {
    console.warn("[parseFitSummary] AI parsing failed, using fallback:", err);
  }
  return fallback;
}

/**
 * AI-powered parser for caution_summary using OpenAI
 */
export async function parseCautionSummary(text: string): Promise<StructuredRiskUnknown> {
  const fallback = parseCautionSummaryFallback(text);
  if (!text || !process.env.OPENAI_API_KEY) return fallback;

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: process.env.AI_DEFAULT_MODEL || "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a specialized commercial real estate AI that structures risk and caution text into JSON fields. Output ONLY valid raw JSON.",
        },
        {
          role: "user",
          content: `Parse this real estate caution summary: "${text}".
Return a JSON object with:
- risk_items: array of objects containing:
  - category: string (choose from: "임대차", "권리관계", "물리적상태", "금융대출", "법규제한", "기타")
  - risk: string (concise description of the specific risk)
  - evidence_needed: array of strings (e.g. ["등기부등본", "건축물대장", "임대차계약서"])
  - expert_required: boolean (true if legal, architectural or tax expert is needed to verify)
Ensure the JSON is strictly compliant.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const content = response.choices[0].message.content;
    if (content) {
      const parsed = JSON.parse(content);
      return {
        risk_items: Array.isArray(parsed.risk_items) ? parsed.risk_items : fallback.risk_items,
      };
    }
  } catch (err) {
    console.warn("[parseCautionSummary] AI parsing failed, using fallback:", err);
  }
  return fallback;
}
