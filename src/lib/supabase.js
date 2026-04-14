import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project')) {
  console.error(
    '[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing.',
    'Set them in .env (local dev) or Netlify Environment Variables (production).',
    { supabaseUrl: supabaseUrl ? supabaseUrl.slice(0, 30) + '…' : '(empty)' }
  )
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder')
