import { createClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/types"

export function createAnonClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
