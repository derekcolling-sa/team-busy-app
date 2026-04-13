import {
  getAllSOS, setMemberSOS,
  getAllNeedWork, setMemberNeedWork,
  getAllMetcalf, setMemberMetcalf,
  getAllDontTalkToMe, setDontTalkToMe,
  getAllMeds, setMemberMeds,
  getBodyDouble, setBodyDouble,
} from "@/lib/redis";
import { safeJson } from "@/lib/safe-json";

export const dynamic = "force-dynamic";

const FEATURES: Record<string, {
  getAll: () => Promise<unknown>;
  set: (name: string, active: boolean) => Promise<void>;
}> = {
  sos: { getAll: getAllSOS, set: setMemberSOS },
  "need-work": { getAll: getAllNeedWork, set: setMemberNeedWork },
  metcalf: { getAll: getAllMetcalf, set: setMemberMetcalf },
  "dont-talk": { getAll: getAllDontTalkToMe, set: setDontTalkToMe },
  meds: { getAll: getAllMeds, set: setMemberMeds },
  "body-double": { getAll: getBodyDouble, set: setBodyDouble },
};

export async function GET(_request: Request, { params }: { params: Promise<{ feature: string }> }) {
  const { feature } = await params;
  const config = FEATURES[feature];
  if (!config) return Response.json({ error: "Unknown feature" }, { status: 404 });
  const data = await config.getAll();
  return Response.json(data);
}

export async function POST(request: Request, { params }: { params: Promise<{ feature: string }> }) {
  const { feature } = await params;
  const config = FEATURES[feature];
  if (!config) return Response.json({ error: "Unknown feature" }, { status: 404 });

  const body = await safeJson(request);
  if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 });

  const { name } = body as { name?: string };
  const active = (body as Record<string, unknown>).active ?? (body as Record<string, unknown>).sos;
  if (typeof name !== "string" || typeof active !== "boolean") {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  await config.set(name, active);
  return Response.json({ ok: true });
}
