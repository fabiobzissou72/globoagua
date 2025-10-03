import { NextRequest, NextResponse } from 'next/server';
import { loginEmpresa } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { login, senha } = await request.json();

    if (!login || !senha) {
      return NextResponse.json(
        { error: 'Login e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const empresa = await loginEmpresa(login, senha);

    if (!empresa) {
      return NextResponse.json(
        { error: 'Login ou senha inválidos' },
        { status: 401 }
      );
    }

    return NextResponse.json({ empresa });
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
