import { createClient } from '@supabase/supabase-js'
import { demoClient } from './demo'
export const DEMO = import.meta.env.VITE_DEMO === 'true'
export const supabase = DEMO ? demoClient : createClient(
  import.meta.env.VITE_SUPABASE_URL || 'http://localhost',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'missing-anon-key'
)
