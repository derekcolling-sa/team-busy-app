import { generateText } from "ai";
import { getBanner, setBanner, addMessage } from "@/lib/redis";

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

// Role context for each team member
const MEMBER_ROLES: Record<string, string> = {
  Kerry:   "copywriter — lives in words, hates bad briefs",
  Erin:    "copywriter — chaotic creative energy, very online",
  Maddie:  "copywriter — sarcastic, dry humor, overly caffeinated",
  Brendan: "art director — pixel-perfect, suffers through revisions",
  Callie:  "art director — color theory obsessed, InDesign warrior",
  Chris:   "art director — vibes first, kerning second",
  KC:      "account manager — holds everything together somehow",
  Derek:   "VP of Creative — managing up, holding the vision, on too many calls",
};

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

  // Generate banner
  const existing = await getBanner();
  if (!(existing?.type === "feature" && existing.date === date)) {
    const { text } = await generateText({
      model: "anthropic/claude-haiku-4.5",
      prompt: `Write a single short Gen Z banner message (max 12 words, no quotes, no hashtags) for a team dashboard. It's ${today}, ${temp}°F and ${condition} in Overland Park KS. Make it fun, relatable, a little chaotic. Reference the day and weather naturally.${meetingNote}`,
    });
    await setBanner(text.trim(), date);
  }

  // Generate a ticker message for each team member in one call
  const memberList = Object.entries(MEMBER_ROLES)
    .map(([name, role]) => `- ${name}: ${role}`)
    .join("\n");

  const { text: messagesRaw } = await generateText({
    model: "anthropic/claude-haiku-4.5",
    prompt: `You are writing first-person status messages for a team dashboard ticker. It's ${today} morning, ${temp}°F and ${condition} in Overland Park KS.${meetingNote}

Team members and their roles:
${memberList}

Write one short Gen Z status message (max 12 words) for EACH person. Messages should be first-person, reflect their role, the day, and the weather naturally. Keep it chaotic, relatable, and a little unhinged. No hashtags. No quotes around the message.

Respond with ONLY a JSON object like:
{"Kerry":"message here","Erin":"message here","Maddie":"message here","Brendan":"message here","Callie":"message here","Chris":"message here","KC":"message here","Derek":"message here"}`,
  });

  // Parse and save messages
  try {
    const jsonMatch = messagesRaw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const messages = JSON.parse(jsonMatch[0]) as Record<string, string>;
      await Promise.all(
        Object.entries(messages).map(([name, msg]) =>
          typeof msg === "string" ? addMessage(name, msg.trim()) : Promise.resolve()
        )
      );
    }
  } catch { /* non-critical — ticker will just be empty */ }

  return Response.json({ ok: true });
}
