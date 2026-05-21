/**
 * POST /api/workspace/clients/[id]/update
 *
 * Updates an existing client. Partial updates allowed — fields not in the
 * body are left alone.
 *
 * Body: { name?, email?, phone?, relationship?, notes?, status? }
 * Returns: { client: {...} } on success
 */

import { NextResponse } from "next/server";
import { updateClient } from "../../../../../../lib/server/clients";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const client = await updateClient(id, body);
    return NextResponse.json({ client });
  } catch (err) {
    console.error("[/api/workspace/clients/[id]/update] error:", err.message);

    if (err.message === "unauthenticated") {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    if (err.message.startsWith("forbidden")) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err.message === "not_found") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
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
