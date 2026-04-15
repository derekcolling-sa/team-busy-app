const DAY_PARTS = [
  "sunday?? go back to sleep 😴 —",
  "monday 💀 we're here tho —",
  "tuesday check ☕ —",
  "hump day 🐪 halfway there —",
  "thursday push 👀 one more day —",
  "FRIDAY 🔥 LET'S GOOO —",
  "saturday?? oof 😬 —",
];

const FALLBACKS = [
  "let's get it fr 💪",
  "locked in today no cap 🧠",
  "big day energy ✨ let's cook",
  "we are so that team 💅",
  "main character energy today bestie",
];

export async function buildWelcomeMessage(): Promise<string> {
  const day = new Date().getDay();
  const dayPart = DAY_PARTS[day];

  let weatherPart = FALLBACKS[day % FALLBACKS.length];

  try {
    const res = await fetch("https://wttr.in/Overland+Park+KS?format=j1", {
      signal: AbortSignal.timeout(4000),
      headers: { "User-Agent": "team-busy-app" },
    });
    if (res.ok) {
      const data = await res.json();
      const desc = (data.current_condition?.[0]?.weatherDesc?.[0]?.value ?? "").toLowerCase();
      const tempF = parseInt(data.current_condition?.[0]?.temp_F ?? "70");

      if (desc.includes("blizzard") || (desc.includes("snow") && tempF < 20)) {
        weatherPart = "frozen outside ❄️🥶 stay warm fr we are NOT built for this";
      } else if (desc.includes("snow")) {
        weatherPart = "snow day energy ❄️ bundle up and lock in bestie";
      } else if (desc.includes("thunder") || desc.includes("storm")) {
        weatherPart = "thunderstorm ⛈️ the drama is outside today not in here";
      } else if (desc.includes("rain") || desc.includes("drizzle")) {
        weatherPart = "it's raining 🌧️ cozy desk szn activated fr";
      } else if (desc.includes("fog") || desc.includes("mist") || desc.includes("haze")) {
        weatherPart = "foggy 🌫️ mysterious vibes out there stay unbothered";
      } else if (desc.includes("overcast") || desc.includes("cloudy")) {
        weatherPart = "grey skies ☁️ but make it fashion we still slay";
      } else if (desc.includes("partly")) {
        weatherPart = "partly cloudy ⛅ giving moody aesthetic and we are here for it";
      } else if (desc.includes("sunny") || desc.includes("clear")) {
        weatherPart = tempF > 88
          ? "sun is BLAZING ☀️🥵 it's hot girl summer out there hydrate"
          : "sun is out ☀️ window open szn let's cook";
      } else if (tempF >= 88) {
        weatherPart = "it's 🥵 hot out there — AC is a right not a privilege bestie";
      } else if (tempF < 32) {
        weatherPart = "it's freezing ❄️🥶 cozy szn is upon us stay warm";
      }
    }
  } catch {
    // weather fetch failed — use fallback, no biggie
  }

  return `${dayPart} ${weatherPart}`;
}
