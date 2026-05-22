import { TOKENS, FONTS } from "../wizard/shared/tokens";

/**
 * EmptyState
 *
 * Server-renderable empty-state for workspace sections. Receives icon as a
 * component reference — must be a server component (no "use client") so the
 * function reference doesn't cross the client boundary.
 *
 * Props:
 *   icon         — lucide icon component to display
 *   title        — primary message
 *   description  — secondary explanation
 *   action       — optional action element (JSX, serializes fine)
 *   roadmap      — optional array of upcoming features
 */
export function EmptyState({ icon: Icon, title, description, action, roadmap }) {
  return (
    <div
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "60px 32px 80px",
        textAlign: "center",
        fontFamily: FONTS.SANS,
      }}
    >
      {Icon && (
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: TOKENS.PAPER_2,
            border: `1px solid ${TOKENS.LINE}`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: TOKENS.INK_60,
            marginBottom: 20,
          }}
        >
          <Icon size={24} strokeWidth={1.6} />
        </div>
      )}

      {title && (
        <h2
          style={{
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.25,
            margin: "0 0 8px",
            color: TOKENS.INK,
          }}
        >
          {title}
        </h2>
      )}

      {description && (
        <p
          style={{
            fontSize: 14,
            color: TOKENS.INK_60,
            lineHeight: 1.55,
            margin: "0 auto",
            maxWidth: 480,
          }}
        >
          {description}
        </p>
      )}

      {action && <div style={{ marginTop: 24 }}>{action}</div>}

      {roadmap && roadmap.length > 0 && (
        <div
          style={{
            marginTop: 36,
            padding: "20px 24px",
            background: TOKENS.PAPER_2,
            border: `1px solid ${TOKENS.LINE}`,
            borderRadius: 10,
            textAlign: "left",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontFamily: FONTS.MONO,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: TOKENS.INK_40,
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            What's coming here
          </div>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {roadmap.map((item, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  fontSize: 13,
                  color: TOKENS.INK_60,
                  lineHeight: 1.5,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontFamily: FONTS.MONO,
                    color: TOKENS.INK_40,
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    background: TOKENS.PAPER,
                    border: `1px solid ${TOKENS.LINE}`,
                    padding: "2px 8px",
                    borderRadius: 4,
                    flexShrink: 0,
                    marginTop: 1,
                    minWidth: 60,
                    textAlign: "center",
                  }}
                >
                  {item.sprint || "Soon"}
                </div>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
