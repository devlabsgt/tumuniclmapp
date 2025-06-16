// app/api/test-auth-access/route.ts
import { NextResponse } from 'next/server';
import supabaseAdmin from '@/utils/supabase/admin';

export async function GET() {
  const { data, error } = await supabaseAdmin.from('auth.users').select('*').limit(1);

  if (error) {
    console.error('ERROR acceso directo a auth.users:', error);
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ data });
}
