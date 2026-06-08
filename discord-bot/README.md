# CodeForges Discord Bot

Bot đọc các đơn `paid` từ Supabase và gửi thông báo vào Discord.

## Cài đặt

```bash
cd discord-bot
npm install
copy .env.example .env
npm start
```

## Biến môi trường

```env
DISCORD_TOKEN=bot_token_discord
DISCORD_CHANNEL_ID=id_kenh_thong_ke
DISCORD_PAYMENT_CHANNEL_ID=id_kenh_thanh_toan_rieng
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service_role_key_supabase
POLL_SECONDS=60
ANNOUNCE_EXISTING=false
SEND_STARTUP_SUMMARY=true
```

`DISCORD_CHANNEL_ID` là kênh thống kê tổng quan.
`DISCORD_PAYMENT_CHANNEL_ID` là kênh riêng để nhận thông báo đơn vừa được webhook xác nhận thanh toán.

## Quyền Discord

Mời bot vào server với quyền:

- View Channel
- Send Messages
- Embed Links

## Supabase

Dùng `SUPABASE_SERVICE_ROLE_KEY` trong Supabase Project Settings > API Keys > Secret keys.

Không đưa service role key vào frontend React. Bot phải chạy trên máy/VPS/server tin cậy.
