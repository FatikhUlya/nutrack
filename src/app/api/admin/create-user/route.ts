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

    // 1. Verify caller session with Anon client
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user: callerUser }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !callerUser) {
      return NextResponse.json({ error: 'Sesi tidak valid atau telah kedaluwarsa.' }, { status: 401 });
    }

    // 2. Check if caller is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', callerUser.id)
      .single();

    const isAdmin = profile?.role === 'admin' || callerUser.user_metadata?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Hanya Administrator yang berhak membuat akun baru.' }, { status: 403 });
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

    // 4. Create user using Service Role Key
    if (!supabaseServiceRoleKey) {
      return NextResponse.json(
        {
          error:
            'SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di Environment Variables server. Anda juga dapat menambahkan akun langsung dari Supabase Dashboard menu Authentication > Users > Add User.',
        },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
      },
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    // Ensure profile has matching role & name
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
      message: `Akun untuk ${email} berhasil dibuat! Pengguna dapat langsung masuk dengan email & kata sandi tersebut.`,
      user: {
        id: newUser.user?.id,
        email: newUser.user?.email,
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
