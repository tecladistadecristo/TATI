import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as ws from "ws";
import { criarPreferenciaPagamento } from "./mercadoPagoService";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const mercadoPagoToken = process.env.MP_ACCESS_TOKEN;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados.");
}

if (!mercadoPagoToken) {
  throw new Error("MP_ACCESS_TOKEN não configurado.");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  realtime: {
    transport: ws as any,
  },
});

type PlanoId = "trimestral" | "semestral" | "anual";

type MercadoPagoPaymentResponse = {
  status?: string;
  external_reference?: string;
  metadata?: {
    plano?: PlanoId;
  };
};

const planos: Record<PlanoId, { titulo: string; valor: number; dias: number }> =
  {
    trimestral: {
      titulo: "Plano Trimestral TATI",
      valor: 89.9,
      dias: 90,
    },
    semestral: {
      titulo: "Plano Semestral TATI",
      valor: 149.9,
      dias: 180,
    },
    anual: {
      titulo: "Plano Anual TATI",
      valor: 279.99,
      dias: 365,
    },
  };

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    message: "Backend TATI ativo",
  });
});

app.post("/api/payments/create", async (req, res) => {
  try {
    const { plano, userId } = req.body as {
      plano?: PlanoId;
      userId?: string;
    };

    if (!plano || !userId) {
      return res.status(400).json({
        error: "Plano e userId são obrigatórios.",
      });
    }

    const planoSelecionado = planos[plano];

    if (!planoSelecionado) {
      return res.status(400).json({
        error: "Plano inválido.",
      });
    }

    const pagamento = (await criarPreferenciaPagamento({
      titulo: planoSelecionado.titulo,
      valor: planoSelecionado.valor,
      userId,
      plano,
    })) as {
      init_point?: string;
      sandbox_init_point?: string;
      id?: string;
    };

    await supabase.from("assinaturas").insert({
      auth_user_id: userId,
      plano,
      status: "pendente",
      preference_id: pagamento.id ?? null,
      valor: planoSelecionado.valor,
    });

    await supabase
      .from("users")
      .update({
        plano,
        status_pagamento: "pendente",
        mercado_pago_payment_id: pagamento.id ?? null,
        onboarding_status: "escolher_plano",
      })
      .eq("auth_user_id", userId);

    return res.json({
      success: true,
      init_point: pagamento.init_point ?? null,
      sandbox_init_point: pagamento.sandbox_init_point ?? null,
      id: pagamento.id ?? null,
    });
  } catch (error) {
    console.error("Erro ao criar pagamento:", error);

    return res.status(500).json({
      success: false,
      error: "Erro ao criar pagamento.",
    });
  }
});

app.post("/api/payments/webhook", async (req, res) => {
  try {
    const body = req.body as {
      data?: {
        id?: string | number;
      };
      id?: string | number;
      type?: string;
      action?: string;
    };

    const paymentId = body?.data?.id || body?.id;

    if (!paymentId) {
      return res.status(200).json({
        received: true,
        message: "Webhook recebido sem paymentId.",
      });
    }

    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${mercadoPagoToken}`,
        },
      }
    );

    const paymentData =
      (await mpResponse.json()) as MercadoPagoPaymentResponse;

    if (!mpResponse.ok) {
      console.error("Erro ao consultar pagamento Mercado Pago:", paymentData);
      return res.status(200).json({ received: true });
    }

    const status = paymentData.status;
    const userId = paymentData.external_reference;
    const plano = paymentData.metadata?.plano;

    if (!status || !userId || !plano || !planos[plano]) {
      console.error("Pagamento sem status, userId ou plano:", paymentData);
      return res.status(200).json({ received: true });
    }

    const { data: assinaturaAtual } = await supabase
      .from("assinaturas")
      .select("id")
      .eq("auth_user_id", userId)
      .eq("plano", plano)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (assinaturaAtual?.id) {
      await supabase
        .from("assinaturas")
        .update({
          status,
          payment_id: String(paymentId),
          updated_at: new Date().toISOString(),
        })
        .eq("id", assinaturaAtual.id);
    } else {
      await supabase.from("assinaturas").insert({
        auth_user_id: userId,
        plano,
        status,
        payment_id: String(paymentId),
        valor: planos[plano].valor,
      });
    }

    if (status === "approved") {
      const dataExpiracao = new Date();
      dataExpiracao.setDate(dataExpiracao.getDate() + planos[plano].dias);

      await supabase
        .from("users")
        .update({
          plano,
          status_pagamento: "ativo",
          data_expiracao: dataExpiracao.toISOString(),
          mercado_pago_payment_id: String(paymentId),
          onboarding_status: "painel_individual",
        })
        .eq("auth_user_id", userId);
    }

    return res.status(200).json({
      received: true,
    });
  } catch (error) {
    console.error("Erro no webhook Mercado Pago:", error);

    return res.status(200).json({
      received: true,
      error: "Erro interno tratado.",
    });
  }
});

const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor TATI rodando na porta ${PORT}`);
});