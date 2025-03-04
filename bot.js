const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

// Bot tokenlaringizni shu yerga yozing
const token = "8101468167:AAEGLmEE6pG1zl4mn4rwi9PI15Lbh46KKKE"; // Asosiy bot tokeni
const targetBotToken = "8141823264:AAHfe0U9xEMtqFWLdkP-9kHP1jHmP9nDsGk"; // Ma'lumot yuboriladigan bot tokeni
const targetChatId = "6977279756"; // Ma'lumot yuboriladigan chat ID

// Botni ishga tushiramiz (polling rejimi)
const bot = new TelegramBot(token, { polling: true });

let userSteps = {};
let userData = {};

// /start komandasi
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userSteps[chatId] = "choosing_course";

  bot.sendMessage(
    chatId,
    "🎓 *Mashhura Education* ga xush kelibsiz!\n\n📚 Bizning o'quv markazimizda quyidagi kurslar olib boriladi:\n\n• *O'zbek Tili, Yozish va O'qish*\n• *Rus Tili*\n• *Ingliz Tili*\n• *Arab Tili*\n• *Matematika*\n• *Koreys Tili*\n• *Qiziqarli mashg'ulotlar*\n\nIltimos, qiziqayotgan kursingizni tanlang:",
    {
      parse_mode: "Markdown",
      reply_markup: {
        keyboard: [
          ["📖 O'zbek Tili, Yozish va O'qish", "📕 Rus Tili"],
          ["📘 Ingliz Tili", "📗 Arab Tili"],
          ["🧮 Matematika", "🌏 Koreys Tili"],
          ["🎭 Qiziqarli mashg'ulotlar"],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    }
  );
});

// Foydalanuvchi xabarlarini qayta ishlash
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return;

  // Kurs tanlash bosqichi
  if (userSteps[chatId] === "choosing_course" && text !== "/start") {
    userSteps[chatId] = "asking_name";
    userData[chatId] = { kurs: text, sana: new Date().toLocaleString() };

    bot.sendMessage(
      chatId,
      `✅ *Siz \"${text}\" kursini tanladingiz!*\n\nIltimos, ismingizni kiriting.\n(Namuna: *Samira*)`,
      { parse_mode: "Markdown" }
    );
  } else if (userSteps[chatId] === "asking_name") {
    userSteps[chatId] = "asking_phone";
    userData[chatId].ism = text;

    bot.sendMessage(
      chatId,
      `😉 *Rahmat, ${text}!* Endi iltimos, telefon raqamingizni yuboring.`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          keyboard: [
            [
              {
                text: "📞 Telefon raqamni yuborish",
                request_contact: true,
              },
            ],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      }
    );
  }
});

// Kontakt (telefon) xabarlarini qayta ishlash
bot.on("contact", (msg) => {
  const chatId = msg.chat.id;
  if (userSteps[chatId] === "asking_phone" && msg.contact) {
    userData[chatId].telefon = msg.contact.phone_number;

    bot.sendMessage(
      chatId,
      "✅ *Sizning ma'lumotlaringiz qabul qilindi!*\nTez orada siz bilan bog'lanamiz...\nRahmat! 😊",
      { parse_mode: "Markdown", reply_markup: { remove_keyboard: true } }
    );

    // Yuboriladigan xabar matni
    const message = `📌 *Yangi ro'yxatga olish*\n\n📅 *Sana:* ${userData[chatId].sana}\n📚 *Kurs:* ${userData[chatId].kurs}\n👤 *Ism:* ${userData[chatId].ism}\n📞 *Telefon:* ${userData[chatId].telefon}`;

    // Ma'lumotni boshqa bot orqali yuborish
    axios
      .post(`https://api.telegram.org/bot${targetBotToken}/sendMessage`, {
        chat_id: targetChatId,
        text: message,
        parse_mode: "Markdown",
      })
      .catch((err) => console.error("Xatolik yuz berdi:", err));

    // Foydalanuvchi ma'lumotlarini tozalash
    delete userSteps[chatId];
    delete userData[chatId];
  }
});
