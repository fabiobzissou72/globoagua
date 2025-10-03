import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const pedidoData = await request.json();

    // Salvar pedido no banco
    const { error: errorPedido } = await supabase
      .from('pedidos')
      .insert({ dados_json: pedidoData });

    if (errorPedido) {
      console.error('Erro ao salvar pedido:', errorPedido);
      throw errorPedido;
    }

    // Buscar URL do webhook
    const { data: config } = await supabase
      .from('configuracoes')
      .select('webhook_url')
      .single();

    // Enviar para webhook se configurado
    if (config?.webhook_url) {
      try {
        await fetch(config.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pedidoData),
        });
      } catch (webhookError) {
        console.error('Erro ao enviar webhook:', webhookError);
        // Continua mesmo se o webhook falhar
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao processar pedido:', error);
    return NextResponse.json(
      { error: 'Erro ao processar pedido' },
      { status: 500 }
    );
  }
}
