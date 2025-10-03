import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { webhookUrl } = await request.json();

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'URL do webhook é obrigatória' },
        { status: 400 }
      );
    }

    // Fazer requisição para o webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teste: true,
        mensagem: 'Teste de webhook do Globo Água',
        timestamp: new Date().toISOString(),
      }),
    });

    const data = await response.text();

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao testar webhook', details: String(error) },
      { status: 500 }
    );
  }
}
