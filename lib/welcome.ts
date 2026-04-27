const DAY_PARTS = [
  "sunday. seriously. 🛋️ —",
  "monday. we survived the weekend. ☕ —",
  "tuesday. still here. ☕ —",
  "wednesday. halfway through. 🤙 —",
  "thursday. almost there. 👀 —",
  "friday. finally. 🍺 —",
  "saturday. why are you here. 😶 —",
];

const FALLBACKS = [
  "let's do this.",
  "focused. allegedly.",
  "big day. let's see how it goes.",
  "we're the team.",
  "everyone's showing up.",
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
        weatherPart = "frozen out there ❄️ – nobody's built for this";
      } else if (desc.includes("snow")) {
        weatherPart = "snowing ❄️ – bundle up and lock in";
      } else if (desc.includes("thunder") || desc.includes("storm")) {
        weatherPart = "thunderstorm ⛈️ – the drama's outside, not in here";
      } else if (desc.includes("rain") || desc.includes("drizzle")) {
        weatherPart = "raining 🌧️ – good desk weather, honestly";
      } else if (desc.includes("fog") || desc.includes("mist") || desc.includes("haze")) {
        weatherPart = "foggy out there 🌫️ – stay the course";
      } else if (desc.includes("overcast") || desc.includes("cloudy")) {
        weatherPart = "grey skies ☁️ – strong coffee weather";
      } else if (desc.includes("partly")) {
        weatherPart = "partly cloudy ⛅ – decent enough";
      } else if (desc.includes("sunny") || desc.includes("clear")) {
        weatherPart = tempF > 88
          ? "blazing hot ☀️🥵 – stay hydrated, you're not 22"
          : "sun's out ☀️ – not bad";
      } else if (tempF >= 88) {
        weatherPart = "brutally hot 🥵 – AC is non-negotiable";
      } else if (tempF < 32) {
        weatherPart = "freezing out there ❄️ – layers";
      }
    }
  } catch {
    // weather fetch failed — use fallback, no biggie
  }

  return `${dayPart} ${weatherPart}`;
}
