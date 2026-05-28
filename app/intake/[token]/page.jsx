import { eq } from "drizzle-orm";
import { db } from "../../../lib/db";
import { wizardSessions, firms, clients } from "../../../lib/db/schema";
import {
  hashIntakeToken,
  classifyIntakeToken,
} from "../../../lib/server/intakeToken";
import { IntakeGate } from "../../../components/intake/IntakeGate";

/**
 * /intake/[token]
 *
 * Public, unauthenticated entry point for send-link intake. Validates the
 * token server-side and renders the appropriate state:
 *   - valid     → the client wizard (intake mode)
 *   - expired   → "this link has expired" gate
 *   - consumed  → "already submitted, thank you" gate
 *   - invalid   → "link not found" gate
 *
 * The session id is never exposed; the wizard runs purely off the token.
 *
 * Sprint 5 Round 3.
 */

export const dynamic = "force-dynamic";

export default async function IntakePage({ params }) {
  const { token } = await params;

  const tokenHash = hashIntakeToken(token);
  const [session] = await db
    .select()
    .from(wizardSessions)
    .where(eq(wizardSessions.intakeTokenHash, tokenHash))
    .limit(1);

  const status = classifyIntakeToken(session);

  // Resolve the firm name for friendly client-facing copy (best-effort).
  let firmName = null;
  if (session?.firmId) {
    const [firm] = await db
      .select()
      .from(firms)
      .where(eq(firms.id, session.firmId))
      .limit(1);
    firmName = firm?.name || null;
  }

  return <IntakeGate token={token} status={status} firmName={firmName} />;
}
