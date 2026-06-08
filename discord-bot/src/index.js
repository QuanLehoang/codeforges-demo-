import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client, EmbedBuilder, GatewayIntentBits } from "discord.js";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const announcedFile = path.join(dataDir, "announced-orders.json");

const requiredEnv = ["DISCORD_TOKEN", "DISCORD_CHANNEL_ID", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing env: ${key}`);
    process.exit(1);
  }
}

const pollMs = Math.max(Number(process.env.POLL_SECONDS ?? 60), 10) * 1000;
const announceExisting = process.env.ANNOUNCE_EXISTING === "true";
const sendStartupSummary = process.env.SEND_STARTUP_SUMMARY !== "false";
const paymentChannelId = process.env.DISCORD_PAYMENT_CHANNEL_ID || process.env.DISCORD_CHANNEL_ID;

const discord = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const formatPrice = (value) => `${new Intl.NumberFormat("vi-VN").format(Number(value ?? 0))} VND`;

const formatDate = (value) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Saigon",
  }).format(new Date(value));

const maskEmail = (email) => {
  if (!email) return "";
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;

  const visibleStart = name.slice(0, Math.min(3, name.length));
  const visibleEnd = name.length > 5 ? name.slice(-2) : "";
  const hiddenLength = Math.max(3, name.length - visibleStart.length - visibleEnd.length);
  return `${visibleStart}${"*".repeat(hiddenLength)}${visibleEnd}@${domain}`;
};

const getPaymentCode = (note) => note?.match(/PAYMENT_CODE:(\d{4})/)?.[1] ?? null;

const loadAnnounced = async () => {
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(announcedFile, "utf8");
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
};

const saveAnnounced = async (ids) => {
  await mkdir(dataDir, { recursive: true });
  await writeFile(announcedFile, JSON.stringify([...ids], null, 2));
};

const fetchPaidOrders = async () => {
  const { data, error } = await supabase
    .from("orders")
    .select("id, email, full_name, total, status, created_at, note, order_items(title, license, price)")
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
};

const buildOrderEmbed = (order) => {
  const paymentCode = getPaymentCode(order.note);
  const items = order.order_items?.length
    ? order.order_items.map((item) => `• ${item.title} (${item.license}) - ${formatPrice(item.price)}`).join("\n")
    : "• Không có sản phẩm";

  return new EmbedBuilder()
    .setColor(0x22d3ee)
    .setTitle("Đơn hàng đã thanh toán <a:ZLogo:1509404151128522862>")
    .setDescription(
      [
        `• Khách hàng: **${order.full_name || order.email}**`,
        `• Email: \`${maskEmail(order.email)}\``,
        `• Nội dung chuyển khoản: \`chuyển khoản đơn hàng số ${paymentCode || "----"}\``,
        "",
        "**Sản phẩm:**",
        items,
        "",
        `**Tổng tiền:** ${formatPrice(order.total)}`,
        `**Ngày tạo đơn:** ${formatDate(order.created_at)}`,
      ].join("\n"),
    )
    .setFooter({ text: "CodeForges - webhook ngân hàng" });
};

const buildPaymentAmountEmbed = (order) =>
  new EmbedBuilder()
    .setColor(0x22d3ee)
    .setTitle("Đã thanh toán")
    .setDescription(`CodeForges đã nhận **${formatPrice(order.total)}**`)
    .setFooter({ text: `CodeForges - ${formatDate(order.created_at)}` });

const sendSummary = async (channel, orders) => {
  const buyerEmails = new Set(orders.map((order) => order.email).filter(Boolean));
  const revenue = orders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
  const productCount = new Map();

  for (const order of orders) {
    for (const item of order.order_items ?? []) {
      productCount.set(item.title, (productCount.get(item.title) ?? 0) + 1);
    }
  }

  const topProducts = [...productCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([title, count], index) => `${index + 1}. ${title} - ${count} lượt`)
    .join("\n");

  const embed = new EmbedBuilder()
    .setColor(0x22d3ee)
    .setTitle("Thống kê mua hàng CodeForges")
    .setDescription(
      [
        `• Đơn đã thanh toán: **${orders.length}**`,
        `• Khách đã mua: **${buyerEmails.size}**`,
        `• Doanh thu: **${formatPrice(revenue)}**`,
        "",
        "**Top sản phẩm:**",
        topProducts || "Chưa có dữ liệu",
      ].join("\n"),
    )
    .setFooter({ text: `CodeForges - ${formatDate(new Date())}` });

  await channel.send({ embeds: [embed] });
};

const checkOrders = async (orderChannel, paymentAmountChannel, announcedIds) => {
  const orders = await fetchPaidOrders();

  if (sendStartupSummary && !checkOrders.summarySent) {
    checkOrders.summarySent = true;
    await sendSummary(orderChannel, orders);
  }

  if (!announceExisting && announcedIds.size === 0) {
    for (const order of orders) announcedIds.add(order.id);
    await saveAnnounced(announcedIds);
    console.log(`Marked ${orders.length} existing paid orders as announced.`);
    return;
  }

  const newOrders = orders
    .filter((order) => !announcedIds.has(order.id))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  for (const order of newOrders) {
    await orderChannel.send({ embeds: [buildOrderEmbed(order)] });
    await paymentAmountChannel.send({ embeds: [buildPaymentAmountEmbed(order)] });
    announcedIds.add(order.id);
    await saveAnnounced(announcedIds);
    console.log(`Announced paid order: ${order.id}`);
  }
};

discord.once("ready", async () => {
  console.log(`CodeForges bot is online as ${discord.user.tag}`);

  const orderChannel = await discord.channels.fetch(process.env.DISCORD_CHANNEL_ID);
  const paymentAmountChannel = await discord.channels.fetch(paymentChannelId);
  if (!orderChannel?.isTextBased() || !paymentAmountChannel?.isTextBased()) {
    console.error("Discord channel id is not a text channel.");
    process.exit(1);
  }

  const announcedIds = await loadAnnounced();

  const run = async () => {
    try {
      await checkOrders(orderChannel, paymentAmountChannel, announcedIds);
    } catch (error) {
      console.error("Failed to check orders:", error.message ?? error);
    }
  };

  await run();
  setInterval(run, pollMs);
});

discord.login(process.env.DISCORD_TOKEN);
