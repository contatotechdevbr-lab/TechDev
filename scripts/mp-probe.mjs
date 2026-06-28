// Sonda a Orders API para descobrir onde inserir endereço e data de cadastro.
const ACCESS = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const PUBLIC = process.env.VITE_MERCADO_PAGO_PUBLIC_KEY;
const AMOUNT = "109.90";

async function newCardToken() {
  const r = await fetch(`https://api.mercadopago.com/v1/card_tokens?public_key=${PUBLIC}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      card_number: "5031433215406351",
      cardholder: { name: "APRO", identification: { type: "CPF", number: "12345678909" } },
      expiration_month: 11,
      expiration_year: 2030,
      security_code: "123",
    }),
  });
  const d = await r.json();
  if (!d.id) throw new Error("token fail: " + JSON.stringify(d));
  return d.id;
}

async function tryOrder(label, extra) {
  const token = await newCardToken();
  const body = {
    type: "online",
    total_amount: AMOUNT,
    external_reference: "probe-" + Date.now() + Math.random().toString(36).slice(2, 6),
    processing_mode: "automatic",
    description: "Probe",
    payer: {
      email: "test_user_probe@testuser.com",
      first_name: "Yago",
      last_name: "Penha",
      identification: { type: "CPF", number: "12345678909" },
    },
    items: [{ title: "Plano", unit_price: AMOUNT, quantity: 1, category_id: "services", description: "Plano" }],
    transactions: { payments: [{ amount: AMOUNT, payment_method: { id: "master", type: "credit_card", token, installments: 1, statement_descriptor: "TECHDEV" } }] },
    ...extra,
  };
  const r = await fetch("https://api.mercadopago.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Bearer ${ACCESS}`, "Content-Type": "application/json", "X-Idempotency-Key": body.external_reference },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  console.log(`\n=== ${label} ===`);
  console.log("status:", r.status, "ok:", r.ok, "order.status:", d.status ?? "-");
  if (!r.ok) console.log("erro:", JSON.stringify(d).slice(0, 400));
}

const regDate = new Date("2024-01-15T10:30:00.000Z").toISOString();

await tryOrder("E) chave plana payer.registration_date + shipment.address", {
  shipment: { address: { city: "São Paulo", state: "SP", zip_code: "01310100" } },
  additional_info: { "payer.registration_date": regDate },
});

await tryOrder("F) flat shipments.receiver_address.* + payer.registration_date", {
  additional_info: {
    "payer.registration_date": regDate,
    "shipments.receiver_address.zip_code": "01310100",
    "shipments.receiver_address.city_name": "São Paulo",
    "shipments.receiver_address.state_name": "SP",
  },
});
