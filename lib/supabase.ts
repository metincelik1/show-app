import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder"
  );
}

export const supabase = getSupabase();

export type Theme = {
  id: number;
  slug: string;
  name: string;
  name_tr: string;
  script_format: string;
  language: string;
};

export type Question = {
  id: number;
  theme_id: number;
  order_num: number;
  text: string;
};

export type Show = {
  id: string;
  theme_id: number;
  code: string;
  is_active: boolean;
  created_at: string;
  themes?: Theme;
};

export type Answer = {
  id: string;
  show_id: string;
  question_id: number;
  text: string;
  submitted_at: string;
  questions?: Question;
};
