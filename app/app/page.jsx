import { Users, FileText, Plus, ArrowRight, Sparkles, ChevronRight } from "lucide-react";
import { eq, count } from "drizzle-orm";
import { TopBar } from "../../components/workspace/TopBar";
import { ClientStatusBadge } from "../../components/workspace/ClientStatusBadge";
import { TOKENS, FONTS } from "../../components/wizard/shared/tokens";
import { getCurrentUser } from "../../lib/server/auth";
import { getRecentClientsForFirm } from "../../lib/server/clients";
import { db } from "../../lib/db";
import { clients, documents, wizardSessions } from "../../lib/db/schema";

/**
 * /app — Overview / Dashboard
 *
 * The workspace home. Shows a quick-glance summary of the firm's activity:
 *   - Client count
 *   - Document count
 *   - Active wizard sessions
 *   - A welcome banner for first-time users
 *   - Quick action cards for the most common workflows
 *
 * As features get built across sprints, this page evolves to show real activity
 * data. For now (Sprint 2), counts are real but most metrics will be zero
 * since clients/documents UIs don't exist yet.
 */

export default async function AppOverviewPage() {
  const user = await getCurrentUser();
  // Auth check happens in the layout, but we read user here for content

  // Quick stats — these queries will run very fast on small datasets
  const [clientCount, documentCount, activeSessionCount, recentClients] = await Promise.all([
    user?.firmId
      ? db
          .select({ count: count() })
          .from(clients)
          .where(eq(clients.firmId, user.firmId))
          .then((r) => r[0]?.count || 0)
      : Promise.resolve(0),
    user?.firmId
      ? db
          .select({ count: count() })
          .from(documents)
          .where(eq(documents.firmId, user.firmId))
          .then((r) => r[0]?.count || 0)
      : Promise.resolve(0),
    user?.firmId
      ? db
          .select({ count: count() })
          .from(wizardSessions)
          .where(eq(wizardSessions.firmId, user.firmId))
          .then((r) => r[0]?.count || 0)
      : Promise.resolve(0),
    user?.firmId
      ? getRecentClientsForFirm(5).catch(() => [])
      : Promise.resolve([]),
  ]);

  const isFirstTime = clientCount === 0 && documentCount === 0;
  const hasRecentClients = recentClients && recentClients.length > 0;

  return (
    <>
      <TopBar
        title={`Welcome back, ${user?.firstName || "friend"}.`}
        subtitle={`Here's what's happening at ${user?.firm?.name || "your workspace"}.`}
      />

      <div style={{ padding: "28px 32px 60px", maxWidth: 1080 }}>
        {isFirstTime && <WelcomeBanner firmName={user?.firm?.name} />}

        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
            marginBottom: 28,
            fontFamily: FONTS.SANS,
          }}
        >
          <StatCard
            label="Clients"
            value={clientCount}
            sublabel="active in your workspace"
            icon={Users}
          />
          <StatCard
            label="Documents"
            value={documentCount}
            sublabel="created across all clients"
            icon={FileText}
          />
          <StatCard
            label="Active sessions"
            value={activeSessionCount}
            sublabel="wizard sessions in progress"
            icon={Sparkles}
          />
        </div>

        {/* Quick actions */}
        <SectionHeader title="Quick actions" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 14,
            marginBottom: 28,
          }}
        >
          <ActionCard
            href="/app/clients"
            icon={Plus}
            title="Add a client"
            description="Create a new client record to start their POA process."
            ctaLabel="Open clients"
          />
          <ActionCard
            href="/wizard"
            icon={Sparkles}
            title="Walk the wizard"
            description="Preview the client-facing experience. See exactly what your clients see."
            ctaLabel="Open wizard"
          />
          <ActionCard
            href="/app/settings"
            icon={ArrowRight}
            title="Customize branding"
            description="Add your firm's logo and contact info so client emails feel like yours."
            ctaLabel="Open settings"
          />
        </div>

        {/* Recent clients widget */}
        {hasRecentClients && (
          <>
            <SectionHeader title="Recent clients" />
            <div
              style={{
                background: TOKENS.PAPER,
                border: `1px solid ${TOKENS.LINE}`,
                borderRadius: 10,
                marginBottom: 28,
                overflow: "hidden",
                fontFamily: FONTS.SANS,
              }}
            >
              {recentClients.map((client, i) => (
                <a
                  key={client.id}
                  href={`/app/clients/${client.id}`}
                  className="recent-client-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 18px",
                    borderTop: i === 0 ? "none" : `1px solid ${TOKENS.LINE}`,
                    textDecoration: "none",
                    color: "inherit",
                    transition: "background 0.12s",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: TOKENS.PAPER_2,
                      border: `1px solid ${TOKENS.LINE}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 600,
                      color: TOKENS.INK_60,
                      flexShrink: 0,
                      fontFamily: FONTS.MONO,
                    }}
                  >
                    {getInitials(client.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: TOKENS.INK,
                        marginBottom: 1,
                      }}
                    >
                      {client.name}
                    </div>
                    {client.email && (
                      <div
                        style={{
                          fontSize: 12,
                          color: TOKENS.INK_60,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {client.email}
                      </div>
                    )}
                  </div>
                  <ClientStatusBadge status={client.status} size="sm" />
                  <ChevronRight
                    size={14}
                    strokeWidth={1.8}
                    color={TOKENS.INK_40}
                    style={{ flexShrink: 0 }}
                  />
                </a>
              ))}
              <a
                href="/app/clients"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "10px 14px",
                  background: TOKENS.PAPER_2,
                  borderTop: `1px solid ${TOKENS.LINE}`,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: TOKENS.INK_60,
                  textDecoration: "none",
                }}
              >
                View all clients
                <ArrowRight size={12} strokeWidth={2.2} />
              </a>
            </div>
            <style suppressHydrationWarning>{`
              .recent-client-row:hover {
                background: ${TOKENS.PAPER_2};
              }
            `}</style>
          </>
        )}
        <SectionHeader title="What's building" />
        <div
          style={{
            background: TOKENS.PAPER_2,
            border: `1px solid ${TOKENS.LINE}`,
            borderRadius: 10,
            padding: "20px 24px",
            fontFamily: FONTS.SANS,
          }}
        >
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <RoadmapItem
              sprint="Sprint 3"
              status="done"
              item="Client management — create, search, profile pages"
            />
            <RoadmapItem
              sprint="Sprint 4"
              status="next"
              item="PDF generation for the Texas POA"
            />
            <RoadmapItem
              sprint="Sprint 5"
              status="planned"
              item="Two intake flows: fill-for-client and send-link-to-client"
            />
            <RoadmapItem
              sprint="Sprint 6"
              status="planned"
              item="Stripe Checkout for consumers and subscriptions for firms"
            />
            <RoadmapItem
              sprint="Sprint 7"
              status="planned"
              item="Proof RON integration and email orchestration"
            />
          </ul>
        </div>
      </div>
    </>
  );
}

function WelcomeBanner({ firmName }) {
  return (
    <div
      style={{
        background: TOKENS.PAPER_2,
        border: `1px solid ${TOKENS.LINE}`,
        borderLeft: `3px solid ${TOKENS.ACCENT}`,
        borderRadius: 10,
        padding: "20px 24px",
        marginBottom: 28,
        fontFamily: FONTS.SANS,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: TOKENS.LIVE_GREEN,
          color: TOKENS.PAPER,
          padding: "3px 10px",
          borderRadius: 100,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        <Sparkles size={11} strokeWidth={2.4} />
        New workspace
      </div>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: "-0.015em",
          margin: "0 0 6px",
          color: TOKENS.INK,
        }}
      >
        {firmName} is ready to go.
      </h2>
      <p style={{ fontSize: 14, color: TOKENS.INK_60, lineHeight: 1.55, margin: 0 }}>
        Your workspace is set up. The client management features are building over
        the next few sprints. In the meantime, walk the consumer wizard yourself to
        see what your clients will experience, and customize your branding in
        Settings so emails feel like yours.
      </p>
    </div>
  );
}

function StatCard({ label, value, sublabel, icon: Icon }) {
  return (
    <div
      style={{
        background: TOKENS.PAPER,
        border: `1px solid ${TOKENS.LINE}`,
        borderRadius: 10,
        padding: "18px 20px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <Icon size={14} strokeWidth={1.8} color={TOKENS.INK_60} />
        <div
          style={{
            fontSize: 11,
            fontFamily: FONTS.MONO,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: TOKENS.INK_40,
            fontWeight: 600,
          }}
        >
          {label}
        </div>
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: "-0.025em",
          color: TOKENS.INK,
          lineHeight: 1,
          marginBottom: 6,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: TOKENS.INK_60, lineHeight: 1.4 }}>
        {sublabel}
      </div>
    </div>
  );
}

function ActionCard({ href, icon: Icon, title, description, ctaLabel, disabled, disabledReason }) {
  const Tag = disabled ? "div" : "a";
  return (
    <Tag
      href={disabled ? undefined : href}
      style={{
        display: "block",
        background: TOKENS.PAPER,
        border: `1px solid ${TOKENS.LINE}`,
        borderRadius: 10,
        padding: "18px 20px",
        textDecoration: "none",
        color: "inherit",
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.15s",
        fontFamily: FONTS.SANS,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: TOKENS.PAPER_2,
            color: TOKENS.INK_60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={16} strokeWidth={1.8} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: TOKENS.INK,
              letterSpacing: "-0.01em",
              marginBottom: 2,
            }}
          >
            {title}
          </div>
        </div>
      </div>
      <div
        style={{
          fontSize: 13,
          color: TOKENS.INK_60,
          lineHeight: 1.5,
          marginBottom: 14,
        }}
      >
        {description}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          fontWeight: 600,
          color: disabled ? TOKENS.INK_40 : TOKENS.INK,
        }}
      >
        {ctaLabel}
        {!disabled && <ArrowRight size={13} strokeWidth={2.4} />}
      </div>
      {disabled && disabledReason && (
        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            color: TOKENS.INK_40,
            fontStyle: "italic",
          }}
        >
          {disabledReason}
        </div>
      )}
    </Tag>
  );
}

function SectionHeader({ title }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontFamily: FONTS.MONO,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: TOKENS.INK_40,
        fontWeight: 600,
        marginBottom: 12,
        marginTop: 4,
      }}
    >
      {title}
    </div>
  );
}

function RoadmapItem({ sprint, status, item }) {
  const statusColors = {
    next: { bg: TOKENS.LIVE_GREEN, text: TOKENS.PAPER },
    planned: { bg: TOKENS.LINE, text: TOKENS.INK_60 },
    done: { bg: TOKENS.LIVE_GREEN, text: TOKENS.PAPER },
  };
  const c = statusColors[status] || statusColors.planned;

  return (
    <li style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div
        style={{
          fontSize: 10,
          fontFamily: FONTS.MONO,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: c.text,
          background: c.bg,
          padding: "3px 8px",
          borderRadius: 4,
          flexShrink: 0,
          marginTop: 1,
          minWidth: 70,
          textAlign: "center",
        }}
      >
        {sprint}
      </div>
      <span
        style={{
          fontSize: 13,
          color: TOKENS.INK_60,
          lineHeight: 1.5,
        }}
      >
        {item}
      </span>
    </li>
  );
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
