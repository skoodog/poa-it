"use client";

import { useState, useMemo } from "react";
import { Users, Plus } from "lucide-react";
import { TopBar } from "./TopBar";
import { EmptyState } from "./EmptyState";
import { SearchInput } from "./SearchInput";
import { ClientListItem } from "./ClientListItem";
import { ClientStatusBadge } from "./ClientStatusBadge";
import { AddClientModal } from "./AddClientModal";
import { TOKENS, FONTS } from "../wizard/shared/tokens";

/**
 * ClientsPageView (Client Component)
 *
 * Receives the initial client list as a prop from the server page. Manages
 * the search input, status filter, and modal open state client-side.
 *
 * Search is implemented client-side over the already-fetched list — this
 * is fast and snappy for the under-1000-client case Sprint 3 targets. If
 * we ever exceed that, search moves server-side (we'd just paginate the
 * fetch and run the substring match in Postgres).
 *
 * Status filter is also client-side for the same reason.
 */

const STATUS_FILTERS = [
  { value: "active", label: "Active", description: "Everything except archived" },
  { value: "intake", label: "Intake" },
  { value: "in_progress", label: "In progress" },
  { value: "ready_for_review", label: "Ready for review" },
  { value: "signed", label: "Signed" },
  { value: "notarized", label: "Notarized" },
  { value: "archived", label: "Archived" },
];

export function ClientsPageView({ initialClients }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [modalOpen, setModalOpen] = useState(false);

  const filteredClients = useMemo(() => {
    let result = initialClients;

    // Status filter
    if (statusFilter === "active") {
      result = result.filter((c) => c.status !== "archived");
    } else if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (c) =>
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q))
      );
    }

    return result;
  }, [initialClients, search, statusFilter]);

  const totalNonArchivedCount = useMemo(
    () => initialClients.filter((c) => c.status !== "archived").length,
    [initialClients]
  );
  const isEmpty = initialClients.length === 0;
  const isFilteredEmpty = !isEmpty && filteredClients.length === 0;

  return (
    <>
      <TopBar
        title="Clients"
        subtitle={
          isEmpty
            ? "Manage the people your firm represents."
            : `${totalNonArchivedCount} active ${totalNonArchivedCount === 1 ? "client" : "clients"}`
        }
        actions={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 600,
              background: TOKENS.INK,
              color: TOKENS.PAPER,
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontFamily: FONTS.SANS,
            }}
          >
            <Plus size={13} strokeWidth={2.4} />
            Add client
          </button>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add your first client to start tracking POAs across your practice. You can fill out the wizard yourself or send your client a link to fill it out."
          action={
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 18px",
                fontSize: 13.5,
                fontWeight: 600,
                background: TOKENS.INK,
                color: TOKENS.PAPER,
                border: "none",
                borderRadius: 7,
                cursor: "pointer",
                fontFamily: FONTS.SANS,
              }}
            >
              <Plus size={14} strokeWidth={2.4} />
              Add your first client
            </button>
          }
        />
      ) : (
        <div style={{ padding: "20px 32px 60px", fontFamily: FONTS.SANS }}>
          {/* Search + filters */}
          <div
            style={{
              display: "flex",
              gap: 14,
              marginBottom: 18,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by name or email..."
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                fontSize: 13,
                fontFamily: FONTS.SANS,
                color: TOKENS.INK,
                background: TOKENS.PAPER,
                border: `1px solid ${TOKENS.LINE}`,
                borderRadius: 7,
                outline: "none",
                cursor: "pointer",
              }}
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <div
              style={{
                marginLeft: "auto",
                fontSize: 12,
                color: TOKENS.INK_40,
                fontFamily: FONTS.MONO,
                letterSpacing: "0.04em",
              }}
            >
              {filteredClients.length} {filteredClients.length === 1 ? "result" : "results"}
            </div>
          </div>

          {/* Client list */}
          {isFilteredEmpty ? (
            <div
              style={{
                padding: "40px 24px",
                textAlign: "center",
                background: TOKENS.PAPER_2,
                border: `1px solid ${TOKENS.LINE}`,
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 14, color: TOKENS.INK_60, marginBottom: 8 }}>
                No clients match your filters.
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("active");
                }}
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: TOKENS.INK,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredClients.map((client) => (
                <ClientListItem key={client.id} client={client} />
              ))}
            </div>
          )}
        </div>
      )}

      <AddClientModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <style suppressHydrationWarning>{`
        .hov-row-card { transition: all 0.12s ease; }
        .hov-row-card:hover {
          border-color: ${TOKENS.INK_40} !important;
          background: ${TOKENS.PAPER_2} !important;
        }
      `}</style>
    </>
  );
}
