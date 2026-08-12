import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const FilterSchema = z.object({
  sector: z.string().max(40).optional(),
  category: z.string().max(40).optional(),
  difficulty: z.string().max(20).optional(),
});

export const listQuestions = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => FilterSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const supabase = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
            headers.delete("Authorization");
          }
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    });

    let query = supabase
      .from("questions")
      .select("id, sector, category, difficulty, prompt, tip")
      .order("sector")
      .limit(300);

    if (data.sector && data.sector !== "all") query = query.eq("sector", data.sector);
    if (data.category && data.category !== "all") query = query.eq("category", data.category);
    if (data.difficulty && data.difficulty !== "all") query = query.eq("difficulty", data.difficulty);

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
