import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

// RLS guarantees only the signed-in owner's rows come back; a spoofed
// localStorage flag with no session simply yields an empty list.
export function useVerifications() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    const { data } = await supabase.from('verifications').select('*').order('created_at', { ascending: false })
    setRows(data || [])
    setLoading(false)
  }, [])
  useEffect(() => {
    load()
    const { data: sub } = supabase.auth.onAuthStateChange(() => load())
    return () => sub.subscription.unsubscribe()
  }, [load])
  return { rows, loading, reload: load }
}

export const today = () => new Date().toISOString().slice(0, 10)
export const isActive = (v) => v.status === 'verified' && v.check_in && v.check_out && v.check_in <= today() && today() <= v.check_out
