import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.3";

type WebhookPayload = {
  provider?: string;
  order_id?: string;
  payment_code?: string | number;
  transaction_id?: string;
  reference?: string;
  tid?: string;
  id?: string;
  amount?: number | string;
  amount_in?: number | string;
  amount_out?: number | string;
  transferAmount?: number | string;
  value?: number | string;
  transaction_content?: string;
  content?: string;
  description?: string;
  transferContent?: string;
  note?: string;
  data?: Record<string, unknown>;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-codeforges-webhook-secret",
};

const getNestedValue = (payload: WebhookPayload, key: string) => {
  const data = payload.data;
  if (!data) return undefined;

  const transaction = data.transaction;
  if (transaction && typeof transaction === "object" && key in transaction) {
    return (transaction as Record<string, unknown>)[key];
  }

  return data[key];
};

const normalizeAmount = (payload: WebhookPayload) =>
  Number(
    payload.amount_in ??
      payload.amount ??
      payload.transferAmount ??
      payload.value ??
      getNestedValue(payload, "amount_in") ??
      getNestedValue(payload, "amount") ??
      getNestedValue(payload, "transferAmount") ??
      0,
  );

const normalizeContent = (payload: WebhookPayload) =>
  String(
    payload.transaction_content ??
      payload.content ??
      payload.description ??
      payload.transferContent ??
      payload.note ??
      getNestedValue(payload, "transaction_content") ??
      getNestedValue(payload, "content") ??
      getNestedValue(payload, "description") ??
      getNestedValue(payload, "transferContent") ??
      "",
  );

const normalizeTransactionId = (payload: WebhookPayload) =>
  String(
    payload.transaction_id ??
      payload.reference ??
      payload.tid ??
      payload.id ??
      getNestedValue(payload, "transaction_id") ??
      getNestedValue(payload, "reference") ??
      getNestedValue(payload, "tid") ??
      getNestedValue(payload, "id") ??
      crypto.randomUUID(),
  );

const normalizeProvider = (payload: WebhookPayload) =>
  String(payload.provider ?? getNestedValue(payload, "provider") ?? getNestedValue(payload, "gateway") ?? "bank_webhook");

const findPaymentCode = (payload: WebhookPayload, content: string) => {
  const direct = payload.payment_code ?? getNestedValue(payload, "payment_code");
  if (direct && /^\d{4}$/.test(String(direct))) return String(direct);

  const normalized = content.toLowerCase();
  const labeledMatch = normalized.match(/(?:chuyen\s*khoan\s*)?(?:don\s*hang\s*so|so)\s*(\d{4})/i);
  if (labeledMatch?.[1]) return labeledMatch[1];

  const looseMatch = normalized.match(/\b(\d{4})\b/);
  return looseMatch?.[1] ?? null;
};

const formatPrice = (value: number) => `${new Intl.NumberFormat("vi-VN").format(value)} VND`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const expectedSecret = Deno.env.get("PAYMENT_WEBHOOK_SECRET");
    const receivedSecret = req.headers.get("x-codeforges-webhook-secret");
    if (expectedSecret && receivedSecret !== expectedSecret) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return Response.json({ error: "Missing Supabase env" }, { status: 500, headers: corsHeaders });
    }

    const payload = (await req.json()) as WebhookPayload;
    const provider = normalizeProvider(payload);
    const amount = normalizeAmount(payload);
    const content = normalizeContent(payload);
    const transactionId = normalizeTransactionId(payload);
    const paymentCode = findPaymentCode(payload, content);

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let orderQuery = supabase
      .from("orders")
      .select("id, email, full_name, total, status, note")
      .eq("status", "pending")
      .limit(1);

    if (payload.order_id) {
      orderQuery = orderQuery.eq("id", payload.order_id);
    } else if (paymentCode) {
      orderQuery = orderQuery.ilike("note", `%PAYMENT_CODE:${paymentCode}%`);
    } else {
      return Response.json({ ok: false, reason: "No 4 digit payment code found" }, { status: 202, headers: corsHeaders });
    }

    const { data: orders, error: orderError } = await orderQuery;
    if (orderError) throw orderError;

    const order = orders?.[0];
    if (!order) {
      return Response.json({ ok: false, reason: "Pending order not found" }, { status: 202, headers: corsHeaders });
    }

    if (amount < Number(order.total)) {
      return Response.json({ ok: false, reason: "Amount is lower than order total" }, { status: 202, headers: corsHeaders });
    }

    const paidNote = [order.note, `PAID_BY:${provider}`, `TX:${transactionId}`].filter(Boolean).join(" | ");
    const { data: paidOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "paid",
        note: paidNote,
      })
      .eq("id", order.id)
      .select("id, email, full_name, total, note")
      .single();
    if (updateError) throw updateError;

    const discordWebhookUrl = Deno.env.get("DISCORD_PAYMENT_WEBHOOK_URL");
    if (discordWebhookUrl) {
      await fetch(discordWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              title: "CodeForges da nhan thanh toan",
              color: 0x22d3ee,
              fields: [
                { name: "Khach hang", value: paidOrder.full_name || paidOrder.email || "Khong ro", inline: true },
                { name: "Noi dung CK", value: `chuyen khoan don hang so ${paymentCode ?? "----"}`, inline: true },
                { name: "So tien", value: formatPrice(Number(paidOrder.total)), inline: true },
              ],
              footer: { text: `Provider: ${provider} - Transaction: ${transactionId}` },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
    }

    return Response.json({ ok: true, order_id: order.id, payment_code: paymentCode }, { headers: corsHeaders });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500, headers: corsHeaders },
    );
  }
});
