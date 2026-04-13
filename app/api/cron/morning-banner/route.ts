import { generateText } from "ai";
import { getBanner, setBanner } from "@/lib/redis";

export const dynamic = "force-dynamic";

const WMO_CODES: Record<number, string> = {
  0: "sunny", 1: "mostly clear", 2: "partly cloudy", 3: "overcast",
  45: "foggy", 48: "icy fog",
  51: "light drizzle", 53: "drizzle", 55: "heavy drizzle",
  61: "light rain", 63: "rain", 65: "heavy rain",
  71: "light snow", 73: "snow", 75: "heavy snow", 77: "snow grains",
  80: "showers", 81: "heavy showers", 82: "violent showers",
  85: "snow showers", 86: "heavy snow showers",
  95: "thunderstorms", 96: "thunderstorms with hail", 99: "thunderstorms with heavy hail",
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch weather for Overland Park, KS
  const weatherRes = await fetch(
    "https://api.open-meteo.com/v1/forecast?latitude=38.9822&longitude=-94.6708&current=temperature_2m,weathercode&temperature_unit=fahrenheit&timezone=America%2FChicago"
  );
  const weatherData = await weatherRes.json();
  const temp = Math.round(weatherData.current?.temperature_2m ?? 70);
  const condition = WMO_CODES[weatherData.current?.weathercode ?? 0] ?? "looking kinda weird out";

  const today = DAYS[new Date().getDay()];
  const date = new Date().toISOString().split("T")[0];
  const isMonday = new Date().getDay() === 1;
  const meetingNote = isMonday ? " There's a company meeting this morning." : "";

  // Generate scrolling banner — "welcome to [day]" vibe for the ticker
  const existing = await getBanner();
  if (!(existing?.type === "feature" && existing.date === date)) {
    const { text: bannerText } = await generateText({
      model: "anthropic/claude-haiku-4.5",
      prompt: `Write a short Gen Z "welcome to [day]" message (max 12 words, no quotes, no hashtags) for a creative agency team dashboard ticker. It's ${today}, ${temp}°F and ${condition} in Overland Park KS. Should feel like a hype intro to the day. Reference the day naturally.${meetingNote}`,
    });
    await setBanner(bannerText.trim(), date);
  }

  return Response.json({ ok: true });
}
