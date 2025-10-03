import { NextRequest, NextResponse } from 'next/server';

// Login hardcoded - simples e funcional
const ADMIN_LOGIN = 'admin';
const ADMIN_SENHA = 'admin123';

export async function POST(request: NextRequest) {
  try {
    const { login, senha } = await request.json();

    if (!login || !senha) {
      return NextResponse.json(
        { error: 'Login e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificação direta
    if (login === ADMIN_LOGIN && senha === ADMIN_SENHA) {
      const adminData = {
        id: '1',
        nome: 'Administrador',
        email: 'admin@globoagua.com',
        login: 'admin',
      };

      return NextResponse.json({ admin: adminData });
    }

    return NextResponse.json(
      { error: 'Login ou senha inválidos' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Erro no login admin:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
