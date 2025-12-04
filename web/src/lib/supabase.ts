import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// 환경 변수 경고 (개발 모드에서만)
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    '⚠️ Supabase 환경 변수가 설정되지 않았습니다. 일부 기능이 작동하지 않을 수 있습니다.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

