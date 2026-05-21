/**
 * POST /api/workspace/clients/create
 *
 * Creates a new client for the current professional's firm. Returns the
 * created client record as JSON.
 *
 * Body: { name, email?, phone?, relationship?, notes? }
 * Returns: { client: {...} } on success
 *          { error: "..." } on failure
 */

import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/server/clients";

export async function POST(request) {
  try {
    const body = await request.json();
    const client = await createClient(body);
    return NextResponse.json({ client });
  } catch (err) {
    console.error("[/api/workspace/clients/create] error:", err.message);

    if (err.message === "unauthenticated") {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    if (err.message.startsWith("forbidden")) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err.message.startsWith("validation")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "internal_error", message: err.message },
      { status: 500 }
    );
  }
}
