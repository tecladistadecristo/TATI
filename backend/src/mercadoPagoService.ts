type CriarPreferenciaParams = {
  titulo: string;
  valor: number;
  userId: string;
  plano: string;
};

async function criarPreferenciaPagamento(params: CriarPreferenciaParams) {
  const accessToken = process.env.MP_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("MP_ACCESS_TOKEN não encontrado no .env");
  }

  const baseUrl = process.env.FRONTEND_URL || "https://teste.somostati.com.br";

  const body = {
    items: [
      {
        id: params.plano,
        title: params.titulo,
        quantity: 1,
        unit_price: Number(params.valor),
        currency_id: "BRL",
      },
    ],
    external_reference: params.userId,
    metadata: {
      user_id: params.userId,
      plano: params.plano,
    },
    back_urls: {
      success: `${baseUrl}/pagamento/sucesso`,
      failure: `${baseUrl}/pagamento/erro`,
      pending: `${baseUrl}/pagamento/pendente`,
    },
    auto_return: "approved",
  };

  const response = await fetch(
    "https://api.mercadopago.com/checkout/preferences",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Erro Mercado Pago:", data);
    throw new Error("Erro ao criar pagamento no Mercado Pago");
  }

  return data;
}

export { criarPreferenciaPagamento };