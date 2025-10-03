import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {

  try {
    // Hash da senha "admin123"
    const novoHash = '$2a$10$h4Ce5q.IHHubvCO5V.bskull0rNGyq46dDOYtxstFM7nSZ.QlRIli';

    // Primeiro, verifica se existe
    const { data: adminExiste } = await supabase
      .from('administradores')
      .select('*')
      .eq('login', 'admin')
      .single();

    if (!adminExiste) {
      return NextResponse.json(
        { error: 'Admin não encontrado no banco' },
        { status: 404 }
      );
    }

    // Tenta atualizar
    const { data, error } = await supabase
      .from('administradores')
      .update({ senha_hash: novoHash })
      .eq('login', 'admin')
      .select();

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao resetar senha', details: error.message, hint: 'Provavelmente RLS bloqueou. Execute o SQL manualmente no Supabase.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Senha resetada para: admin123',
      admin: data
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno', details: String(error) },
      { status: 500 }
    );
  }
}
