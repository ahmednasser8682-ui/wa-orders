# wa-orders (WhatsApp Cloud API Webhook + Auto Reply)

## 1) التعديل المطلوب فقط
انسخ `.env.example` إلى `.env` وغيّر:
- VERIFY_TOKEN (أي كلمة) — وحط نفس الكلمة في Meta Webhooks
- WHATSAPP_TOKEN (التوكن)
- PHONE_NUMBER_ID (عندك جاهز)
- (اختياري) SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY لو عايز تخزين

## 2) تشغيل محليًا
```bash
npm install
npm start
```
هتلاقيه شغال على:
- http://localhost:3000  (يرجع OK)
- GET/POST http://localhost:3000/webhook

## 3) الربط مع Meta
في WhatsApp > Webhooks:
- Callback URL: https://YOUR_DOMAIN/webhook
- Verify token: نفس VERIFY_TOKEN

## 4) Supabase (اختياري)
نفّذ SQL الموجود في `supabase.sql` ثم ضع قيم SUPABASE_* في `.env`.
