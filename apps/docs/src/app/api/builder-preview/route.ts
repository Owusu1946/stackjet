import { buildCreatePlan, createInputSchema, materializePlan } from "create-expojet/generation";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = createInputSchema.safeParse(await request.json());
    if (!input.success) {
      return NextResponse.json(
        { error: "Invalid builder configuration", issues: input.error.issues },
        { status: 400 },
      );
    }

    const files = materializePlan(buildCreatePlan(input.data));
    return NextResponse.json(
      { files },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to build preview";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
