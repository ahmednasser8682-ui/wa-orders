import express from "express";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
app.use(express.json({ limit: "2mb" }));

const {
  PORT = 3000,
  VERIFY_TOKEN,
  WHATSAPP_TOKEN,
  PHONE_NUMBER_ID,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env;

function must(name, v) {
  if (!v) throw new Error(`Missing env: ${name}`);
}

must("VERIFY_TOKEN", VERIFY_TOKEN);
must("WHATSAPP_TOKEN", WHATSAPP_TOKEN);
must("PHONE_NUMBER_ID", PHONE_NUMBER_ID);

// Optional: if you don't want DB yet, you can leave SUPABASE_* empty and it will just log.
const useSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
const SB_HEADERS = useSupabase
  ? {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    }
  : null;

async function sbInsert(table, row) {
  if (!useSupabase) return;
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  await axios.post(url, [row], {
    headers: { ...SB_HEADERS, Prefer: "return=minimal" },
    timeout: 15000,
  });
}

async function waSendText(to, body) {
  const url = `https://graph.facebook.com/v24.0/${PHONE_NUMBER_ID}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body },
  };
  await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    timeout: 15000,
  });
}

// Health
app.get("/", (_, res) => res.status(200).send("OK"));
app.get("/health", (_, res) => res.status(200).json({ ok: true }));

// Webhook verification (Meta)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Webhook receiver (WhatsApp messages)
app.post("/webhook", async (req, res) => {
  // Respond immediately
  res.sendStatus(200);

  try {
    const data = req.body;

    const entry = data?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    const messages = value?.messages || [];
    if (!messages.length) {
      await sbInsert("wa_events", { event_type: "no_message", raw: data });
      return;
    }

    const msg = messages[0];
    const from = msg.from || "";
    const type = msg.type || "";
    const text = type === "text" ? (msg.text?.body || "") : `[${type}]`;

    console.log("Inbound:", { from, type, text });

    // Save inbound + create order (optional)
    await sbInsert("wa_inbound", { wa_from: from, msg_type: type, text, raw: data });

    const orderNo = `PK-${Date.now().toString().slice(-8)}`;
    await sbInsert("orders", {
      order_no: orderNo,
      customer_phone: from,
      customer_message: text,
      status: "new",
      raw: data,
    });

    // Auto-reply
    await waSendText(
      from,
      `تم استلام رسالتك ✅\nرقم الطلب: ${orderNo}\n\nاكتب الطلب بالشكل:\nالمدينة - العنوان - الطلب`
    );
  } catch (err) {
    console.error("Webhook error:", err?.response?.data || err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on :${PORT}`);
});
