import { put } from "@vercel/blob";
import { getAllPhotos, setMemberPhoto } from "@/lib/redis";

export const dynamic = "force-dynamic";

const ALLOWED_NAMES = ["Brendan", "Callie", "Chris", "Derek", "Erin", "KC", "Kerry", "Maddie"];

export async function GET() {
  const photos = await getAllPhotos();
  return Response.json({ photos });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const name = form.get("name") as string;
  const file = form.get("file") as File;

  if (!ALLOWED_NAMES.includes(name) || !file) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  const blob = await put(`photos/${name.toLowerCase()}`, file, {
    access: "public",
    allowOverwrite: true,
  });

  const urlWithBust = `${blob.url}?v=${Date.now()}`;
  await setMemberPhoto(name, urlWithBust);
  return Response.json({ ok: true, url: urlWithBust });
}
