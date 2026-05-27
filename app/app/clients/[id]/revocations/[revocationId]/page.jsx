import { notFound } from "next/navigation";
import { RevocationDetailView } from "../../../../../../components/revocation/RevocationDetailView";
import { getRevocationById } from "../../../../../../lib/server/revocations";

/**
 * /app/clients/[id]/revocations/[revocationId]
 *
 * The post-execution lifecycle view for a single revocation. Shows summary
 * metadata + notice tracker + recording tracker. Users navigate here from
 * the Revocations section on the client profile.
 *
 * Sprint 4c — Round 3.
 */

export const dynamic = "force-dynamic";

export default async function RevocationDetailPage({ params }) {
  const { id: clientId, revocationId } = await params;

  const revocation = await getRevocationById(revocationId);
  if (!revocation) notFound();
  if (revocation.clientId !== clientId) notFound();
  if (!revocation.client) notFound();

  return <RevocationDetailView revocation={revocation} client={revocation.client} />;
}
