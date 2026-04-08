import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

async function main() {
  const val = await redis.get("team-busy-urgent");
  console.log("Raw Redis value:", JSON.stringify(val));
}
main();
