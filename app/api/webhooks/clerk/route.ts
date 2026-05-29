import { Webhook } from "svix";
import { headers } from "next/headers";
import { seedDefaultCategories } from "@/lib/seed-defaults";

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(secret);

  let evt: { type: string; data: { id: string } };
  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data: { id: string } };
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("Bad signature", { status: 400 });
  }

  if (evt.type === "user.created") {
    await seedDefaultCategories(evt.data.id);
  }

  return new Response("ok", { status: 200 });
}
