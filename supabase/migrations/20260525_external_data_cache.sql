-- 20260525_external_data_cache.sql
-- 외부 공공데이터 캐시 테이블
CREATE TABLE IF NOT EXISTS public.external_data_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_ssot_lite_id UUID,
  pnu VARCHAR(19),
  legal_dong_code VARCHAR(10),
  road_address TEXT,
  jibun_address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  building_register JSONB DEFAULT '{}',
  building_register_fetched_at TIMESTAMPTZ,
  official_land_price JSONB DEFAULT '{}',
  land_price_fetched_at TIMESTAMPTZ,
  land_use_plan JSONB DEFAULT '{}',
  land_use_fetched_at TIMESTAMPTZ,
  comparable_transactions JSONB DEFAULT '[]',
  transactions_fetched_at TIMESTAMPTZ,
  market_statistics JSONB DEFAULT '{}',
  market_stats_fetched_at TIMESTAMPTZ,
  location_poi JSONB DEFAULT '{}',
  location_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_edc_building ON public.external_data_cache(building_ssot_lite_id);
CREATE INDEX IF NOT EXISTS idx_edc_pnu ON public.external_data_cache(pnu);

-- 모바일 IM 열람 로그
CREATE TABLE IF NOT EXISTS public.mobile_im_view_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile_im_project_id UUID,
  viewer_fingerprint TEXT,
  viewer_email TEXT,
  session_id TEXT,
  section_viewed TEXT,
  dwell_time_seconds INTEGER,
  device_type TEXT,
  event_type TEXT DEFAULT 'section_view',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mivl_project ON public.mobile_im_view_logs(mobile_im_project_id);
CREATE INDEX IF NOT EXISTS idx_mivl_session ON public.mobile_im_view_logs(session_id);

-- 관심 표명 테이블
CREATE TABLE IF NOT EXISTS public.mobile_im_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile_im_project_id UUID,
  viewer_email TEXT,
  viewer_name TEXT,
  viewer_phone TEXT,
  interest_level TEXT DEFAULT 'interested',
  message TEXT,
  broker_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mii_project ON public.mobile_im_interests(mobile_im_project_id);

-- 실시간 Q&A 질문 테이블
CREATE TABLE IF NOT EXISTS public.mobile_im_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile_im_project_id UUID,
  section_type TEXT,
  viewer_email TEXT,
  question_text TEXT,
  answer_text TEXT,
  answered_at TIMESTAMPTZ,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_miq_project ON public.mobile_im_questions(mobile_im_project_id);

-- 미팅 예약 테이블
CREATE TABLE IF NOT EXISTS public.mobile_im_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile_im_project_id UUID,
  viewer_email TEXT,
  viewer_phone TEXT,
  meeting_type TEXT, -- 'onsite' or 'online'
  preferred_date TEXT,
  preferred_time TEXT,
  status TEXT DEFAULT 'pending', -- pending, confirmed, cancelled
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mim_project ON public.mobile_im_meetings(mobile_im_project_id);
