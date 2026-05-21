/**
 * Audit Logger
 *
 * Append-only event log. Every meaningful wizard action creates an entry.
 * Persists to localStorage for Phase 1; will be replaced with server-side
 * append-only storage in Phase 6 / Sprint 2.
 *
 * The log is the evidentiary record. If UPLC ever inquires, this is what
 * we hand to counsel. Structure events to be readable years later by
 * someone who has never seen the wizard.
 *
 * What we log:
 *   - Every wizard step entry / completion
 *   - Every acknowledgment click (with the exact text acknowledged)
 *   - Every warning shown
 *   - Every attorney referral offered
 *   - Every validation block
 *   - Every state change of consequence
 *
 * What we do NOT log:
 *   - SSNs, credit cards, passwords (none in wizard scope, but as a rule)
 *   - Verbose state dumps (only changes, with PII flagged separately)
 */

const AUDIT_STORAGE_KEY = "poa-it.audit.v1";

/**
 * Generates a sortable, unique event ID.
 * Format: evt_<timestamp>_<random>
 */
function generateEventId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `evt_${ts}_${rand}`;
}

/**
 * Identifies sensitive fields in event data.
 * In Phase 1 we just flag them; in Phase 6 server-side we scrub them after retention.
 */
const PII_FIELDS = new Set([
  "principalFullLegalName",
  "principalDob",
  "principalAddress",
  "principalCity",
  "principalZip",
  "principalPhone",
  "principalEmail",
  "agentFullLegalName",
  "agentDob",
  "agentAddress",
  "agentCity",
  "agentZip",
  "agentPhone",
  "agentEmail",
  "successorAgentFullLegalName",
  "successorAgentAddress",
  "successorAgentPhone",
  "successorAgentEmail",
]);

function containsPii(data) {
  if (!data || typeof data !== "object") return false;
  return Object.keys(data).some(k => PII_FIELDS.has(k));
}

/**
 * Returns a copy of data with PII fields redacted.
 * The original (full) data is preserved server-side in Phase 6;
 * here we redact at write time since localStorage is client-visible.
 */
function scrubPii(data) {
  if (!data || typeof data !== "object") return data;
  const scrubbed = { ...data };
  for (const key of Object.keys(scrubbed)) {
    if (PII_FIELDS.has(key)) {
      scrubbed[key] = "[REDACTED]";
    }
  }
  return scrubbed;
}

/**
 * Logs an audit event.
 * Returns the event record (with generated ID and timestamp).
 *
 * @param {Object} params
 * @param {string} params.eventType - e.g., "step_completed", "acknowledgment_recorded"
 * @param {string} params.sessionId - wizard session ID
 * @param {string} [params.actor] - usually "user", but could be "system" or "support_agent"
 * @param {Object} [params.eventData] - the event-specific payload
 */
export function logEvent({ eventType, sessionId, actor = "user", eventData = {} }) {
  if (typeof window === "undefined") return null;

  const hasPii = containsPii(eventData);
  const event = {
    eventId: generateEventId(),
    eventType,
    sessionId: sessionId || null,
    actor,
    timestamp: new Date().toISOString(),
    eventData: hasPii ? scrubPii(eventData) : eventData,
    piiScrubStatus: hasPii ? "scrubbed_at_write" : "no_pii",
  };

  // 1. Persist to localStorage (fast, immediate, also works offline)
  try {
    const existing = window.localStorage.getItem(AUDIT_STORAGE_KEY);
    const log = existing ? JSON.parse(existing) : [];
    log.push(event);
    window.localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(log));
  } catch (err) {
    if (typeof console !== "undefined") {
      console.warn("[audit] Failed to persist event:", err.message);
    }
  }

  // 2. Persist to server (best-effort, non-blocking)
  // Fire-and-forget: we don't await this so the calling code isn't slowed.
  // The localStorage version is the immediate record; server is the durable copy.
  try {
    const anonymousId = window.localStorage.getItem("poa-it.anonymousId.v1");
    if (anonymousId) {
      fetch("/api/wizard/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymousId,
          sessionId,
          eventType,
          eventData: event.eventData,
          actor,
        }),
        keepalive: true, // Lets the request survive page unload
      }).catch(() => {
        // Silent — localStorage is still the immediate record
      });
    }
  } catch {
    // Non-fatal — localStorage already has the event
  }

  // Also dev-log for visibility during build
  if (typeof console !== "undefined" && console.log) {
    console.log(`[audit] ${eventType}`, event);
  }

  return event;
}

/**
 * Returns the full audit log for the current session.
 * Used by the AuditLogViewer (built in Phase 4).
 */
export function getAuditLog() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

/**
 * Filters the audit log to events for a specific session.
 */
export function getAuditLogForSession(sessionId) {
  return getAuditLog().filter(e => e.sessionId === sessionId);
}

/**
 * Clears the audit log. Used during testing / wizard reset.
 * In production, individual users cannot clear their own log.
 */
export function clearAuditLog() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(AUDIT_STORAGE_KEY);
  } catch (err) {
    // Silent
  }
}

/**
 * Common event-logging helpers — convenience wrappers around logEvent.
 * These standardize the eventType strings so all screens use the same vocabulary.
 */
export const audit = {
  stepEntered: (sessionId, step) =>
    logEvent({
      eventType: "step_entered",
      sessionId,
      eventData: { step },
    }),

  stepCompleted: (sessionId, step, stateSlice) =>
    logEvent({
      eventType: "step_completed",
      sessionId,
      eventData: { step, ...stateSlice },
    }),

  acknowledgmentRecorded: (sessionId, ruleId, exactText) =>
    logEvent({
      eventType: "acknowledgment_recorded",
      sessionId,
      eventData: { ruleId, exactText },
    }),

  warningShown: (sessionId, ruleId, message) =>
    logEvent({
      eventType: "warning_shown",
      sessionId,
      eventData: { ruleId, message },
    }),

  warningAcknowledged: (sessionId, ruleId) =>
    logEvent({
      eventType: "warning_acknowledged",
      sessionId,
      eventData: { ruleId },
    }),

  attorneyReferralOffered: (sessionId, ruleId, context) =>
    logEvent({
      eventType: "attorney_referral_offered",
      sessionId,
      eventData: { ruleId, context },
    }),

  attorneyReferralClicked: (sessionId, ruleId) =>
    logEvent({
      eventType: "attorney_referral_clicked",
      sessionId,
      eventData: { ruleId },
    }),

  validationBlocked: (sessionId, ruleId, message) =>
    logEvent({
      eventType: "validation_blocked",
      sessionId,
      eventData: { ruleId, message },
    }),

  tooltipOpened: (sessionId, tooltipKey) =>
    logEvent({
      eventType: "tooltip_opened",
      sessionId,
      eventData: { tooltipKey },
    }),

  fieldChanged: (sessionId, field, hasValue) =>
    logEvent({
      eventType: "field_changed",
      sessionId,
      eventData: { field, hasValue },
    }),

  wizardAbandoned: (sessionId, lastStep) =>
    logEvent({
      eventType: "wizard_abandoned",
      sessionId,
      eventData: { lastStep },
    }),

  wizardCompleted: (sessionId, summary) =>
    logEvent({
      eventType: "wizard_completed",
      sessionId,
      eventData: summary,
    }),
};
