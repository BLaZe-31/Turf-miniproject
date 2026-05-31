import type { SupabaseClient } from '@supabase/supabase-js'

const OFFICIAL_ROLES = new Set(['admin', 'turf_official'])

export type OfficialAuthResult =
  | { authorized: true; userId: string; role: string }
  | { authorized: false; error: string; status: number }

export async function verifyOfficial(
  supabase: SupabaseClient
): Promise<OfficialAuthResult> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { authorized: false, error: 'Unauthorized', status: 401 }
  }

  const { data: userData, error: roleError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (roleError) {
    console.error('[v0] Role check error:', roleError)
    return { authorized: false, error: 'Failed to verify user role', status: 500 }
  }

  const role = userData?.role?.trim() ?? ''
  if (!OFFICIAL_ROLES.has(role)) {
    return {
      authorized: false,
      error: 'Only admins or turf officials can perform this action',
      status: 403,
    }
  }

  return { authorized: true, userId: user.id, role }
}
