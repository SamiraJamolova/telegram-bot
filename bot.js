// Import required modules
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

// Your bot token
const token = "7693220231:AAE5frk_zr7wmawu3NbVSecYarFR7NROAss";
const bot = new TelegramBot(token, { polling: true });

// Regions in Uzbekistan
const regions = [
  ["Toshkent", "Toshkent viloyati", "Andijon"],
  ["Buxoro", "Fargʻona", "Xorazm"],
  ["Samarqand", "Namangan", "Qashqadaryo"],
  ["Surxondaryo", "Jizzax", "Sirdaryo"],
  ["Navoiy", "Qoraqalpogʻiston"],
];

// Start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendSticker(
    chatId,
    "CAACAgIAAxkBAAEJf7FlW_fqCZzvI6HDAFzD7_0D3ZAvdgACcRMAArV8OUhn-fVajChb1zAE"
  );

  goToMainMenu(chatId);
});

// Handle user messages
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;

  if (userMessage === "🌦️ Ob-havo") {
    const regionButtons = regions.map((row) =>
      row.map((region) => ({ text: region }))
    );

    bot.sendMessage(chatId, "Viloyatingizni tanlang:", {
      reply_markup: {
        keyboard: [...regionButtons, [{ text: "🔙 Orqaga" }]],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    });
  } else if (userMessage === "🎰 Mini-o'yin") {
    sendGameLink(chatId);
  } else if (userMessage === "🔙 Orqaga") {
    goToMainMenu(chatId);
  } else if (regions.flat().includes(userMessage)) {
    sendWeatherInfo(chatId, userMessage);
  }
});

// Go back to the main menu
function goToMainMenu(chatId) {
  bot.sendMessage(chatId, "🌟 Asosiy menyuga qaytdik", {
    reply_markup: {
      keyboard: [["🌦️ Ob-havo"], ["🎰 Mini-o'yin"]],
      resize_keyboard: true,
      one_time_keyboard: false,
    },
  });
}

// Fetch and send weather information
async function sendWeatherInfo(chatId, region) {
  try {
    const geoResponse = await axios.get(
      `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(
        region
      )}&country=Uzbekistan&format=json`
    );

    if (geoResponse.data.length === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Joylashuv topilmadi. Qaytadan urinib ko‘ring."
      );
    }

    const { lat, lon } = geoResponse.data[0];

    const weatherResponse = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
    );

    const weather = weatherResponse.data.current_weather;

    const weatherStatus =
      weather.weathercode < 3
        ? "☀️ Quyoshli"
        : weather.weathercode < 50
        ? "⛅ Bulutli"
        : "🌧️ Yomg‘irli";

    bot.sendMessage(
      chatId,
      `✅ ${region} uchun ob-havo ma'lumotlari:\n🌡️ Harorat: ${weather.temperature}°C\n💨 Shamol: ${weather.windspeed} m/s\n${weatherStatus}`
    );

    bot.sendMessage(chatId, "🔙 Orqaga qaytish uchun tugmani bosing.", {
      reply_markup: {
        keyboard: [["🔙 Orqaga"]],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    bot.sendMessage(
      chatId,
      "❌ Ob-havo ma’lumotlarini olishda xatolik yuz berdi. Keyinroq urinib ko‘ring."
    );
  }
}

// Send mini-game link
function sendGameLink(chatId) {
  bot.sendMessage(
    chatId,
    "🎰 Bu yerda qiziqarli mini-o'yin o'ynashingiz mumkin: [X va 0 o'yini](https://x-va-0-oyini.netlify.app)",
    {
      parse_mode: "Markdown",
      reply_markup: {
        keyboard: [["🔙 Orqaga"]],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    }
  );
}

console.log("🌦️ Ob-havo va mini-game boti ishga tushdi!");
