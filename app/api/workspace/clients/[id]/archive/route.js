/**
 * POST /api/workspace/clients/[id]/archive
 *
 * Soft-deletes a client by setting status to "archived". Client and all
 * related data (documents, audit events) remain in the database; just hidden
 * from default list views.
 *
 * Returns: { client: {...} } on success
 */

import { NextResponse } from "next/server";
import { archiveClient } from "../../../../../../lib/server/clients";

export async function POST(_request, { params }) {
  try {
    const { id } = await params;
    const client = await archiveClient(id);
    return NextResponse.json({ client });
  } catch (err) {
    console.error("[/api/workspace/clients/[id]/archive] error:", err.message);

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
