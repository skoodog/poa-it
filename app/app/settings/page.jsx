import { Settings as SettingsIcon, Check } from "lucide-react";
import { TopBar } from "../../../components/workspace/TopBar";
import { TOKENS, FONTS } from "../../../components/wizard/shared/tokens";
import { getCurrentUser } from "../../../lib/server/auth";

/**
 * /app/settings
 *
 * Real editable form for firm details. This is the only Sprint 2 page that
 * does real work — it lets the professional update their firm name, tier,
 * and primary contact info.
 *
 * Logo upload is stubbed (UI present, Vercel Blob integration deferred to
 * Sprint 7 alongside email branding work).
 *
 * Form submits to /api/workspace/update-firm via standard POST. Success
 * round-trips via ?saved=1 query param.
 */

export default async function SettingsPage({ searchParams }) {
  const user = await getCurrentUser();
  const firm = user?.firm;
  const params = await searchParams;
  const justSaved = params?.saved === "1";

  return (
    <>
      <TopBar
        title="Settings"
        subtitle="Firm details, branding, and account preferences."
      />

      <div style={{ padding: "28px 32px 60px", maxWidth: 720, fontFamily: FONTS.SANS }}>
        {justSaved && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              background: "#ECFDF5",
              border: `1px solid #A7F3D0`,
              borderRadius: 8,
              marginBottom: 20,
              fontSize: 13.5,
              color: "#065F46",
            }}
          >
            <Check size={15} strokeWidth={2.4} />
            Settings saved.
          </div>
        )}

        <form action="/api/workspace/update-firm" method="POST">
          {/* Firm details */}
          <SectionCard
            label="Firm details"
            description="The name and category of your practice. The firm name appears in client-facing emails and on the wizard header when you send sessions to clients."
          >
            <FormField
              label="Firm name"
              name="firmName"
              defaultValue={firm?.name || ""}
              placeholder="e.g. Campbell Law PLLC"
              required
            />

            <FormField
              label="Tier"
              name="firmTier"
              defaultValue={firm?.tier || "solo"}
              type="select"
              options={[
                { value: "solo", label: "Solo practitioner" },
                { value: "family_office", label: "Family office" },
                { value: "firm", label: "Law firm" },
              ]}
              helpText="Determines workspace defaults and pricing tier. Contact us if you need to change this after subscribing."
            />
          </SectionCard>

          {/* Primary contact */}
          <SectionCard
            label="Primary contact"
            description="Where notifications about your workspace are sent. Defaults to your account email."
          >
            <FormField
              label="Contact email"
              name="primaryContactEmail"
              type="email"
              defaultValue={firm?.primaryContactEmail || user?.email || ""}
              placeholder="you@yourfirm.com"
            />

            <FormField
              label="Contact phone"
              name="primaryContactPhone"
              type="tel"
              defaultValue={firm?.primaryContactPhone || ""}
              placeholder="(512) 555-0123"
              optional
            />

            <FormField
              label="Mailing address"
              name="address"
              defaultValue={firm?.address || ""}
              placeholder="Street, City, State, ZIP"
              optional
              helpText="Used on document letterhead when white-label branding ships."
            />
          </SectionCard>

          {/* Branding (stubbed) */}
          <SectionCard
            label="Branding"
            description="Your firm's logo and brand colors, applied to client-facing emails and the wizard."
            comingSoon="Sprint 7"
          >
            <div
              style={{
                padding: "20px 22px",
                background: TOKENS.PAPER_2,
                border: `1px dashed ${TOKENS.LINE}`,
                borderRadius: 8,
                fontSize: 13,
                color: TOKENS.INK_60,
                lineHeight: 1.5,
              }}
            >
              Logo upload, color picker, and email-template preview will appear
              here in Sprint 7 when Resend email integration ships. The Settings
              changes you make today will carry forward — branding just gets
              layered on top.
            </div>
          </SectionCard>

          {/* Save button */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button
              type="submit"
              style={{
                padding: "11px 22px",
                fontSize: 14,
                fontWeight: 600,
                background: TOKENS.INK,
                color: TOKENS.PAPER,
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function SectionCard({ label, description, comingSoon, children }) {
  return (
    <div
      style={{
        background: TOKENS.PAPER,
        border: `1px solid ${TOKENS.LINE}`,
        borderRadius: 10,
        padding: "24px 28px",
        marginBottom: 16,
      }}
    >
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "-0.015em",
              margin: 0,
              color: TOKENS.INK,
            }}
          >
            {label}
          </h2>
          {comingSoon && (
            <span
              style={{
                fontSize: 10,
                fontFamily: FONTS.MONO,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontWeight: 600,
                color: TOKENS.INK_60,
                background: TOKENS.PAPER_2,
                border: `1px solid ${TOKENS.LINE}`,
                padding: "2px 8px",
                borderRadius: 4,
              }}
            >
              {comingSoon}
            </span>
          )}
        </div>
        {description && (
          <p style={{ fontSize: 13, color: TOKENS.INK_60, margin: 0, lineHeight: 1.5 }}>
            {description}
          </p>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{children}</div>
    </div>
  );
}

function FormField({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
  required,
  optional,
  helpText,
  options,
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 500,
          color: TOKENS.INK,
          marginBottom: 6,
        }}
      >
        {label}
        {optional && (
          <span style={{ fontSize: 11, color: TOKENS.INK_40, fontWeight: 400, marginLeft: 6 }}>
            optional
          </span>
        )}
      </label>

      {type === "select" ? (
        <select
          name={name}
          defaultValue={defaultValue}
          required={required}
          style={{
            width: "100%",
            padding: "10px 12px",
            fontSize: 14,
            fontFamily: "inherit",
            color: TOKENS.INK,
            background: TOKENS.PAPER,
            border: `1px solid ${TOKENS.LINE}`,
            borderRadius: 7,
            outline: "none",
            cursor: "pointer",
          }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          required={required}
          style={{
            width: "100%",
            padding: "10px 12px",
            fontSize: 14,
            fontFamily: "inherit",
            color: TOKENS.INK,
            background: TOKENS.PAPER,
            border: `1px solid ${TOKENS.LINE}`,
            borderRadius: 7,
            outline: "none",
          }}
        />
      )}

      {helpText && (
        <div style={{ fontSize: 12, color: TOKENS.INK_40, marginTop: 6, lineHeight: 1.45 }}>
          {helpText}
        </div>
      )}
    </div>
  );
}
