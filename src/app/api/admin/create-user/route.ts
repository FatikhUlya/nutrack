import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');

    if (!token) {
      return NextResponse.json({ error: 'Tidak memiliki izin otentikasi.' }, { status: 401 });
    }

    // 1. Verify caller session with authenticated client
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });

    const { data: { user: callerUser }, error: authError } = await userClient.auth.getUser();

    if (authError || !callerUser) {
      return NextResponse.json({ error: 'Sesi tidak valid atau telah kedaluwarsa. Silakan login ulang.' }, { status: 401 });
    }

    // 2. Check admin status:
    // Check metadata, or profiles table
    let isAdmin = callerUser.user_metadata?.role === 'admin';

    if (!isAdmin) {
      const { data: profile } = await userClient
        .from('profiles')
        .select('role')
        .eq('id', callerUser.id)
        .maybeSingle();

      if (profile?.role === 'admin') {
        isAdmin = true;
      } else {
        // If profile doesn't have role yet or table is still fresh, check total profiles count
        const { count } = await userClient
          .from('profiles')
          .select('id', { count: 'exact', head: true });

        // If there is only 1 user (or 0), the current user is the owner/admin
        if (count === null || count <= 1) {
          isAdmin = true;
          // Auto update caller profile to admin
          await userClient
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', callerUser.id);
        }
      }
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Hanya Administrator yang berhak membuat akun baru.' },
        { status: 403 }
      );
    }

    // 3. Parse payload
    const body = await req.json();
    const { email, password, fullName, role = 'user' } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan kata sandi wajib diisi.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Kata sandi minimal 6 karakter.' }, { status: 400 });
    }

    // 4. Create User
    // Method A: If Service Role Key is configured, use admin client (auto-confirms user)
    if (supabaseServiceRoleKey) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role },
      });

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 400 });
      }

      if (newUser?.user?.id) {
        await supabaseAdmin
          .from('profiles')
          .upsert({
            id: newUser.user.id,
            display_name: fullName || email.split('@')[0],
            role: role,
          });
      }

      return NextResponse.json({
        success: true,
        message: `Akun untuk ${email} berhasil dibuat! Pengguna dapat langsung masuk dengan kata sandi tersebut.`,
      });
    }

    // Method B: Fallback via server-side isolated signUp without requiring Service Role Key
    const serverAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: newUser, error: signUpError } = await serverAuthClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Akun untuk ${email} berhasil dibuat! Pengguna sekarang dapat login ke NUTRACK.`,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
