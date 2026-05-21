/**
 * POST /api/workspace/clients/[id]/restore
 *
 * Restores an archived client back to "intake" status. Use the profile page
 * to set a more specific status afterward.
 *
 * Returns: { client: {...} } on success
 */

import { NextResponse } from "next/server";
import { restoreClient } from "../../../../../../lib/server/clients";

export async function POST(_request, { params }) {
  try {
    const { id } = await params;
    const client = await restoreClient(id);
    return NextResponse.json({ client });
  } catch (err) {
    console.error("[/api/workspace/clients/[id]/restore] error:", err.message);

    if (err.message === "unauthenticated") {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    if (err.message.startsWith("forbidden")) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err.message === "not_found") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "internal_error", message: err.message },
      { status: 500 }
    );
  }
}
