"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowRight, ArrowUpRight, Check, Activity, Lock, Users, FileText,
  Stethoscope, Building2, Plane, Briefcase, Heart, ChevronRight,
  RefreshCw, Hospital, Landmark, HandCoins, Search, AlertCircle, Shield,
  Minus, Plus, Circle, HelpCircle,
} from "lucide-react";

/* ============================================
   PALETTE — modern minimalist, lawyer mindset
   ============================================ */
const PAPER  = "#FFFFFF";
const PAPER_2 = "#FAFAFA";
const INK    = "#0A0A0A";
const INK_80 = "#27272A";
const INK_60 = "#52525B";
const INK_40 = "#71717A";
const INK_20 = "#A1A1AA";
const LINE   = "#E4E4E7";
const LINE_2 = "#D4D4D8";
const ACCENT = "#2563EB"; // institutional blue — used very sparingly
const LIVE_GREEN = "#10B981"; // for the live indicator only

const SANS = `'Geist', 'Inter', -apple-system, system-ui, sans-serif`;
const MONO = `'Geist Mono', 'JetBrains Mono', ui-monospace, monospace`;

export default function PoaItSite() {
  const [stage, setStage] = useState(2);
  const [poaIdx, setPoaIdx] = useState(0);
  const [stateIdx, setStateIdx] = useState(0);
  const [pricingMode, setPricingMode] = useState("txn");
  const [channelIdx, setChannelIdx] = useState(0);

  // Live counter — central marketing/fundraising hook
  const [todayCount, setTodayCount] = useState(347);
  const [yearCount, setYearCount] = useState(38212);
  const [revenueToday, setRevenueToday] = useState(27413);

  // ===== WIZARD STATE =====
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0); // 0–4 wizard, 5 = payment, 6 = success
  const [wizardData, setWizardData] = useState({
    poaType: "financial",
    state: "FL",
    principalName: "",
    principalAddress: "",
    principalDob: "",
    agentName: "",
    agentRelationship: "",
    agentEmail: "",
    altAgentName: "",
    altAgentRelationship: "",
    powers: ["banking", "realestate", "tax", "insurance"],
    plan: "single", // "single" $79 or "full" $179
  });
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const openWizard = (plan = "single") => {
    setWizardData((d) => ({ ...d, plan }));
    setWizardStep(0);
    setWizardOpen(true);
  };
  const closeWizard = () => setWizardOpen(false);
  const updateWizardData = (patch) => setWizardData((d) => ({ ...d, ...patch }));

  // When a "purchase" completes, push into the live feed
  const onPaymentSuccess = () => {
    const price = wizardData.plan === "full" ? 179 : 79;
    setTodayCount((c) => c + 1);
    setYearCount((c) => c + 1);
    setRevenueToday((r) => r + price);
    setWizardStep(6);
  };

  useEffect(() => {
    const id = setInterval(() => setStage((s) => (s + 1) % 7), 3400);
    return () => clearInterval(id);
  }, []);

  // Real-time ticker — gives the page its pulse
  useEffect(() => {
    const tick = setInterval(() => {
      const inc = Math.random() > 0.55 ? 1 : 0;
      if (inc) {
        setTodayCount((c) => c + 1);
        setYearCount((c) => c + 1);
        setRevenueToday((r) => r + Math.floor(39 + Math.random() * 140));
      }
    }, 4500);
    return () => clearInterval(tick);
  }, []);

  return (
    <div style={{ background: PAPER, color: INK, fontFamily: SANS, minHeight: "100vh", WebkitFontSmoothing: "antialiased" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        body { background: ${PAPER}; margin: 0; -webkit-font-smoothing: antialiased; }
        button { cursor: pointer; border: none; background: none; font-family: inherit; color: inherit; padding: 0; }
        .mono { font-family: ${MONO}; font-feature-settings: "tnum"; }
        .num { font-variant-numeric: tabular-nums; font-feature-settings: "tnum","lnum"; }
        .pulse-dot { animation: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        .tick { animation: tickFlash 0.6s ease-out; }
        @keyframes tickFlash {
          0% { color: ${LIVE_GREEN}; transform: translateY(-2px); }
          100% { color: ${INK}; transform: translateY(0); }
        }
        .hov-row { transition: background 0.15s ease; }
        .hov-row:hover { background: ${PAPER_2}; }
        .underline-link::after {
          content: ''; position: absolute; left: 0; bottom: -2px; width: 100%; height: 1px;
          background: currentColor; transform: scaleX(0); transform-origin: left;
          transition: transform 0.25s ease;
        }
        .underline-link { position: relative; }
        .underline-link:hover::after { transform: scaleX(1); }
        .scroll-marquee { animation: marquee 48s linear infinite; }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .dot-grid {
          background-image: radial-gradient(circle, rgba(10,10,10,0.05) 1px, transparent 1px);
          background-size: 22px 22px;
        }
        .activity-enter {
          animation: slideIn 0.4s ease-out;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <Nav onStart={() => openWizard("single")} />
      <Hero todayCount={todayCount} yearCount={yearCount} revenueToday={revenueToday} onStart={() => openWizard("single")} />
      <SocialProof />
      <Problem />
      <Lifecycle stage={stage} setStage={setStage} />
      <PoaTypes idx={poaIdx} setIdx={setPoaIdx} />
      <Coverage idx={stateIdx} setIdx={setStateIdx} />
      <Pricing mode={pricingMode} setMode={setPricingMode} onStart={openWizard} />
      <Channels idx={channelIdx} setIdx={setChannelIdx} />
      <Trajectory />
      <PartnerStrip />
      <Footer />

      {/* === WIZARD / PAYMENT / SUCCESS OVERLAY === */}
      {wizardOpen && (
        <WizardModal
          step={wizardStep}
          setStep={setWizardStep}
          data={wizardData}
          updateData={updateWizardData}
          onClose={closeWizard}
          paymentProcessing={paymentProcessing}
          setPaymentProcessing={setPaymentProcessing}
          onPaymentSuccess={onPaymentSuccess}
        />
      )}
    </div>
  );
}

/* ============================================
   BRAND MARK
   ============================================ */
function Mark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="0" y="0" width="24" height="24" rx="4" fill={INK} />
      <rect x="13" y="13" width="7" height="7" rx="1" fill={PAPER} />
    </svg>
  );
}

/* ============================================
   NAV
   ============================================ */
function Nav({ onStart }) {
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "rgba(255,255,255,0.84)",
      backdropFilter: "blur(12px)",
      borderBottom: `1px solid ${LINE}`,
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Mark size={22} />
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em" }}>poa-it</div>
          <div style={{
            marginLeft: 4, padding: "3px 8px", fontSize: 10, fontWeight: 500,
            color: INK_60, border: `1px solid ${LINE_2}`, borderRadius: 4,
            letterSpacing: "0.06em", textTransform: "uppercase",
          }}>Beta · Florida</div>
        </div>

        <div style={{ display: "flex", gap: 30, fontSize: 14, color: INK_60, fontWeight: 450 }}>
          <span className="underline-link">Product</span>
          <span className="underline-link">States</span>
          <span className="underline-link">Pricing</span>
          <span className="underline-link">Partners</span>
          <span className="underline-link">Attorneys</span>
          <span className="underline-link">Docs</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span style={{ fontSize: 14, color: INK_60 }}>Sign in</span>
          <button onClick={onStart} style={{
            fontSize: 14, fontWeight: 500, padding: "8px 16px",
            background: INK, color: PAPER, borderRadius: 6,
            display: "inline-flex", alignItems: "center", gap: 8,
          }}>
            Start a POA <ArrowRight size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ============================================
   HERO + LIVE COUNTER
   ============================================ */
function Hero({ todayCount, yearCount, revenueToday, onStart }) {
  return (
    <section style={{ position: "relative", overflow: "hidden" }}>
      <div className="dot-grid" style={{ position: "absolute", inset: 0, opacity: 0.6 }} />
      <div style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "96px 32px 72px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 56, alignItems: "start" }}>

          <div>
            <Kicker text="Power of attorney, on demand" />

            <h1 style={{
              fontSize: "clamp(3.2rem, 7vw, 6.8rem)",
              fontWeight: 600,
              lineHeight: 0.92,
              letterSpacing: "-0.045em",
              margin: "28px 0 24px",
            }}>
              POA it.
            </h1>

            <p style={{
              fontSize: 20, lineHeight: 1.45, color: INK_60, fontWeight: 400,
              maxWidth: 540, margin: "0 0 40px",
            }}>
              State-specific power of attorney. Notarized online in eleven minutes.
              Revocable in one click. Verifiable by banks and hospitals in real time.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 56 }}>
              <button onClick={onStart} style={{
                fontSize: 15, fontWeight: 500, padding: "13px 22px",
                background: INK, color: PAPER, borderRadius: 8,
                display: "inline-flex", alignItems: "center", gap: 10,
              }}>
                Start in eleven minutes <ArrowRight size={15} strokeWidth={2} />
              </button>
              <button style={{
                fontSize: 15, fontWeight: 500, padding: "13px 22px",
                background: "transparent", color: INK, border: `1px solid ${LINE_2}`,
                borderRadius: 8,
              }}>
                Sample document (PDF)
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, background: LINE, border: `1px solid ${LINE}`, borderRadius: 8, overflow: "hidden", maxWidth: 660 }}>
              <SmallStat top="49" bottom="States with RON" />
              <SmallStat top="11m" bottom="Median time" />
              <SmallStat top="$79" bottom="Per document" />
              <SmallStat top="24/7" bottom="Notary on call" />
            </div>
          </div>

          {/* === LIVE COUNTER — the centerpiece === */}
          <LiveCounter todayCount={todayCount} yearCount={yearCount} revenueToday={revenueToday} />
        </div>
      </div>
    </section>
  );
}

function Kicker({ text }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "5px 12px", fontSize: 12, fontWeight: 500,
      color: INK_60, background: PAPER, border: `1px solid ${LINE_2}`, borderRadius: 100,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: ACCENT, display: "inline-block" }}></span>
      {text}
    </div>
  );
}

function SmallStat({ top, bottom }) {
  return (
    <div style={{ background: PAPER, padding: "18px 16px" }}>
      <div className="num" style={{ fontSize: 26, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.02em" }}>{top}</div>
      <div style={{ fontSize: 11, color: INK_60, marginTop: 6, fontWeight: 500 }}>{bottom}</div>
    </div>
  );
}

function LiveCounter({ todayCount, yearCount, revenueToday }) {
  const [recentEvents, setRecentEvents] = useState([
    { id: 1, type: "Financial POA", loc: "Sarasota, FL", time: "now", Icon: HandCoins },
    { id: 2, type: "Medical POA",   loc: "Dallas, TX",   time: "2m", Icon: Stethoscope },
    { id: 3, type: "Real estate POA", loc: "Phoenix, AZ", time: "6m", Icon: Building2 },
    { id: 4, type: "Banking POA",   loc: "Charlotte, NC", time: "14m", Icon: Landmark },
    { id: 5, type: "Business POA",  loc: "Tampa, FL", time: "22m", Icon: Briefcase },
  ]);

  // Cycle in new events periodically
  useEffect(() => {
    const eventTypes = [
      { type: "Financial POA",  Icon: HandCoins },
      { type: "Medical POA",    Icon: Stethoscope },
      { type: "Real estate POA", Icon: Building2 },
      { type: "Banking POA",    Icon: Landmark },
      { type: "Business POA",   Icon: Briefcase },
      { type: "Springing POA",  Icon: AlertCircle },
      { type: "Hospital POA",   Icon: Hospital },
    ];
    const locs = ["Sarasota, FL", "Dallas, TX", "Phoenix, AZ", "Charlotte, NC", "Tampa, FL", "Austin, TX", "Tucson, AZ", "Raleigh, NC"];

    const id = setInterval(() => {
      const newEvt = {
        id: Date.now(),
        ...eventTypes[Math.floor(Math.random() * eventTypes.length)],
        loc: locs[Math.floor(Math.random() * locs.length)],
        time: "now",
      };
      setRecentEvents((prev) => {
        const aged = prev.map((e, i) => ({ ...e, time: i === 0 ? "1m" : i === 1 ? "3m" : i === 2 ? "7m" : i === 3 ? "16m" : "26m" }));
        return [newEvt, ...aged.slice(0, 4)];
      });
    }, 9000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      background: SURFACE_OR_WHITE(),
      border: `1px solid ${LINE}`,
      borderRadius: 12,
      overflow: "hidden",
      boxShadow: "0 4px 24px -8px rgba(10,10,10,0.06), 0 1px 2px rgba(10,10,10,0.04)",
    }}>
      {/* Header bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px", borderBottom: `1px solid ${LINE}`, background: PAPER_2,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: LIVE_GREEN, display: "inline-block" }}></span>
          <span style={{ fontSize: 12, fontWeight: 600, color: INK, letterSpacing: "-0.005em" }}>LIVE</span>
        </div>
        <span className="mono" style={{ fontSize: 10, color: INK_40, letterSpacing: "0.05em", textTransform: "uppercase" }}>POA-IT/v1 · public feed</span>
      </div>

      {/* The big number */}
      <div style={{ padding: "28px 24px 20px" }}>
        <div style={{ fontSize: 11, color: INK_40, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 14 }}>
          POAs created today
        </div>
        <div className="num tick" key={todayCount} style={{
          fontSize: 80, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.05em",
          color: INK, fontFamily: MONO,
        }}>
          {todayCount.toLocaleString()}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: LINE, marginTop: 24, border: `1px solid ${LINE}`, borderRadius: 6, overflow: "hidden" }}>
          <CounterCell label="Year-to-date" value={yearCount.toLocaleString()} />
          <CounterCell label="Revenue today" value={`$${revenueToday.toLocaleString()}`} />
        </div>
      </div>

      {/* Activity feed */}
      <div style={{ borderTop: `1px solid ${LINE}`, padding: "12px 18px 18px" }}>
        <div style={{
          fontSize: 10, color: INK_40, letterSpacing: "0.1em", textTransform: "uppercase",
          fontWeight: 600, marginBottom: 10, display: "flex", justifyContent: "space-between",
        }}>
          <span>Recent activity</span>
          <span className="mono">{recentEvents.length} of 347</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {recentEvents.map((e, i) => {
            const Icon = e.Icon;
            return (
              <div
                key={e.id}
                className={i === 0 ? "activity-enter" : ""}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
                  borderBottom: i < recentEvents.length - 1 ? `1px solid ${LINE}` : "none",
                }}
              >
                <Icon size={14} strokeWidth={1.6} color={INK_60} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}>{e.type}</div>
                  <div style={{ fontSize: 11, color: INK_40 }}>{e.loc}</div>
                </div>
                <span className="mono" style={{ fontSize: 11, color: e.time === "now" ? LIVE_GREEN : INK_40, fontWeight: e.time === "now" ? 600 : 400 }}>
                  {e.time}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SURFACE_OR_WHITE() { return PAPER; }

function CounterCell({ label, value }) {
  return (
    <div style={{ background: PAPER, padding: "14px 14px" }}>
      <div style={{ fontSize: 10, color: INK_40, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div className="num" style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em" }}>{value}</div>
    </div>
  );
}

/* ============================================
   SOCIAL PROOF STRIP
   ============================================ */
function SocialProof() {
  return (
    <section style={{ borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}`, background: PAPER_2 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
        <div style={{ fontSize: 11, color: INK_40, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
          Pilot partners · Q3 2026
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 40, flexWrap: "wrap" }}>
          {["MEMORIAL HERMANN", "NAVY FEDERAL", "BROOKDALE", "MERCER", "STEWART TITLE", "AARP"].map((l) => (
            <div key={l} style={{ fontSize: 12, fontWeight: 600, color: INK_20, letterSpacing: "0.08em" }}>{l}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================
   PROBLEM — the data section, factual not editorial
   ============================================ */
function Problem() {
  return (
    <section style={{ background: INK, color: PAPER }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "112px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 72, alignItems: "start" }}>

          <div>
            <div style={{
              display: "inline-flex", padding: "5px 12px", fontSize: 12, fontWeight: 500,
              color: PAPER, border: `1px solid rgba(255,255,255,0.2)`, borderRadius: 100, marginBottom: 28,
              alignItems: "center", gap: 8,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: ACCENT, display: "inline-block" }}></span>
              The market
            </div>
            <h2 style={{
              fontSize: "clamp(2.8rem, 5.2vw, 4.8rem)",
              fontWeight: 600,
              lineHeight: 0.94,
              letterSpacing: "-0.04em",
              margin: 0,
            }}>
              62% of Gen X have nothing.
            </h2>
          </div>

          <div>
            <p style={{ fontSize: 20, lineHeight: 1.45, fontWeight: 400, color: "rgba(255,255,255,0.78)", margin: "0 0 48px" }}>
              No power of attorney. No healthcare directive. No plan. Each is one ER visit away from a six-figure legal disaster. The category has been measured at $109B (2025) and is growing 4.5% annually, while the digital subset compounds at 8.2%. Demand exists. Distribution does not.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32, marginBottom: 56 }}>
              <DarkStat n="56%" l="Adults with no estate documents" cite="Caring.com, 2024" />
              <DarkStat n="70M" l="Boomers retiring this decade" cite="US Census" />
              <DarkStat n="$10T" l="Great Wealth Transfer underway" cite="Cerulli Associates" />
              <DarkStat n="29pt" l="Gap: importance vs. ownership" cite="WealthCounsel" />
            </div>

            <div style={{ padding: 28, border: `1px solid rgba(255,255,255,0.14)`, borderRadius: 10 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: ACCENT, marginBottom: 12, fontWeight: 600 }}>
                The trigger event
              </div>
              <p style={{ fontSize: 17, lineHeight: 1.5, fontWeight: 400, color: "rgba(255,255,255,0.88)", margin: 0 }}>
                "I'm in the hospital lobby. My mom's in surgery. The social worker just asked if I'm her power of attorney. I'm not. They can't tell me anything."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DarkStat({ n, l, cite }) {
  return (
    <div>
      <div className="num" style={{ fontSize: 34, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.03em" }}>{n}</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 12, lineHeight: 1.4 }}>{l}</div>
      {cite && <div className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>{cite}</div>}
    </div>
  );
}

/* ============================================
   LIFECYCLE — 7 stages
   ============================================ */
const STAGES = [
  { num: "01", name: "Plan",     desc: "Decide what authority to grant, to whom, under what conditions. State law shapes every choice.", icon: FileText,    time: "—",       channel: "Self-serve" },
  { num: "02", name: "Create",   desc: "State-specific decision tree. Plain English. Eleven minutes from start to signature-ready PDF.", icon: Activity,    time: "11 min",  channel: "Wizard" },
  { num: "03", name: "Execute",  desc: "Remote online notary or in-person. Witnesses where required. Tamper-evident digital seal.",      icon: Check,       time: "8 min",   channel: "RON" },
  { num: "04", name: "Store",    desc: "Encrypted vault. Shareable with named agents, attorneys, hospitals, banks. Version-controlled.", icon: Lock,        time: "Instant", channel: "Encrypted" },
  { num: "05", name: "Activate", desc: "Springing triggers. Physician attestation. Banks and hospitals can verify in real time.",        icon: AlertCircle, time: "Trigger", channel: "API + UI" },
  { num: "06", name: "Operate",  desc: "Agent dashboard. Action logs. Quarterly check-ins. Annual review reminders for the principal.",   icon: Users,       time: "Ongoing", channel: "Dashboard" },
  { num: "07", name: "Revoke",   desc: "One click. Automatic notification to every party of record. Audit trail preserved forever.",      icon: RefreshCw,   time: "Instant", channel: "One click" },
];

function Lifecycle({ stage, setStage }) {
  const active = STAGES[stage];
  const ActiveIcon = active.icon;
  return (
    <section style={{ maxWidth: 1280, margin: "0 auto", padding: "112px 32px" }}>
      <SectionHeader kicker="The product" title="Seven stages, end to end." subtitle="Trust & Will and LegalZoom stop at document generation. POA-IT owns the document through its entire legal life — from intent to revocation, with verification in between." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: 40, marginTop: 56 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {STAGES.map((s, i) => {
            const isActive = i === stage;
            const Icon = s.icon;
            return (
              <button
                key={s.num}
                onClick={() => setStage(i)}
                style={{
                  display: "flex", alignItems: "center", gap: 16, padding: "16px 18px",
                  background: isActive ? INK : "transparent",
                  color: isActive ? PAPER : INK,
                  border: `1px solid ${isActive ? INK : LINE}`,
                  borderRadius: 8,
                  transition: "all 0.18s ease",
                  textAlign: "left",
                }}
              >
                <span className="mono" style={{ fontSize: 12, fontWeight: 500, color: isActive ? "rgba(255,255,255,0.55)" : INK_40, minWidth: 22 }}>{s.num}</span>
                <Icon size={16} strokeWidth={1.8} color={isActive ? PAPER : INK_60} />
                <span style={{ fontSize: 16, fontWeight: 500 }}>{s.name}</span>
                <ChevronRight size={14} strokeWidth={1.8} style={{ marginLeft: "auto", opacity: isActive ? 1 : 0.3 }} />
              </button>
            );
          })}
        </div>

        <div style={{ background: PAPER_2, border: `1px solid ${LINE}`, borderRadius: 12, padding: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
            <div style={{ width: 48, height: 48, background: INK, color: PAPER, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ActiveIcon size={22} strokeWidth={1.6} />
            </div>
            <div>
              <div className="mono" style={{ fontSize: 11, color: INK_40, letterSpacing: "0.06em" }}>STAGE {active.num}</div>
              <div style={{ fontSize: 32, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.025em" }}>{active.name}</div>
            </div>
          </div>
          <p style={{ fontSize: 17, lineHeight: 1.5, color: INK_60, fontWeight: 400, margin: "0 0 28px" }}>
            {active.desc}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <DetailCell label="Time" value={active.time} />
            <DetailCell label="Channel" value={active.channel} />
          </div>
        </div>
      </div>
    </section>
  );
}

function DetailCell({ label, value }) {
  return (
    <div style={{ background: PAPER, border: `1px solid ${LINE}`, padding: "14px 16px", borderRadius: 6 }}>
      <div style={{ fontSize: 10, color: INK_40, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 500 }}>{value}</div>
    </div>
  );
}

/* ============================================
   POA TYPES
   ============================================ */
const POA_TYPES = [
  { name: "Financial (durable)",    tag: "Most common, highest urgency",      Icon: HandCoins,
    desc: "Authority over banking, real estate, taxes, contracts. Effective through incapacity.",
    freq: "73% of POAs", notary: "RON OK", time: "Same day", users: ["Adult children","Spouses","Fiduciaries"] },
  { name: "Healthcare directive",    tag: "Bundled with HIPAA + living will",   Icon: Stethoscope,
    desc: "Medical decisions when you can't speak. HIPAA authorization and advance directive included.",
    freq: "61% add this", notary: "Varies", time: "Hours", users: ["Spouses","Adult children","Proxies"] },
  { name: "Real estate (limited)",   tag: "Single-transaction",                 Icon: Building2,
    desc: "Authority for one specific closing or transfer. Auto-expires when the transaction completes.",
    freq: "Closing-spike", notary: "RON OK", time: "5–14 days", users: ["Out-of-state buyers","Snowbirds","Title cos."] },
  { name: "Military deployment",     tag: "Federally privileged",               Icon: Shield,
    desc: "Pre-deployment authority. Recognized in every state under 10 U.S.C. § 1044b.",
    freq: "Deploy-tied", notary: "JAG or RON", time: "Deploy-length", users: ["Service members","Reservists","Mil. spouses"] },
  { name: "Parental delegation",     tag: "Childcare while traveling",          Icon: Heart,
    desc: "Temporary authority for a caregiver to make decisions for minor children.",
    freq: "Seasonal", notary: "Varies", time: "Hours", users: ["Traveling parents","Single parents"] },
  { name: "Business operations",     tag: "Continuity",                         Icon: Briefcase,
    desc: "Authority for a partner or trusted employee to operate the business in your absence.",
    freq: "SMB owners", notary: "Required", time: "Indefinite", users: ["Founders","SMB owners","Solo pros."] },
];

function PoaTypes({ idx, setIdx }) {
  const t = POA_TYPES[idx];
  const ActiveIcon = t.Icon;
  return (
    <section style={{ background: PAPER_2, borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "112px 32px" }}>
        <SectionHeader kicker="Coverage" title="Twelve types. One platform." subtitle="Competitors offer two — general financial and healthcare. POA-IT covers the full taxonomy of delegated authority required by US law." />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 40, marginTop: 56 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {POA_TYPES.map((p, i) => {
              const isActive = i === idx;
              const Icon = p.Icon;
              return (
                <button
                  key={p.name}
                  onClick={() => setIdx(i)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "16px 18px",
                    background: isActive ? INK : PAPER,
                    color: isActive ? PAPER : INK,
                    border: `1px solid ${isActive ? INK : LINE}`,
                    borderRadius: 8,
                    transition: "all 0.18s ease",
                    textAlign: "left",
                  }}
                >
                  <Icon size={18} strokeWidth={1.7} color={isActive ? PAPER : INK_60} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: isActive ? "rgba(255,255,255,0.65)" : INK_40, marginTop: 2 }}>{p.tag}</div>
                  </div>
                  <ChevronRight size={14} strokeWidth={1.8} style={{ opacity: isActive ? 1 : 0.3 }} />
                </button>
              );
            })}
            <div style={{ padding: "14px 18px", border: `1px dashed ${LINE_2}`, borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: INK_40 }}>
                <span style={{ color: INK_60, fontWeight: 500 }}>+ 6 more types</span> · pet, tax (IRS 2848), vehicle/DMV, digital assets, springing, university
              </div>
            </div>
          </div>

          <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, padding: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, background: INK, color: PAPER, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ActiveIcon size={26} strokeWidth={1.6} />
              </div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: INK_40, fontWeight: 600 }}>{t.tag}</div>
                <div style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.025em" }}>{t.name}</div>
              </div>
            </div>
            <p style={{ fontSize: 17, lineHeight: 1.5, color: INK_60, fontWeight: 400, margin: "0 0 28px" }}>
              {t.desc}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
              <MiniStat label="Frequency" value={t.freq} />
              <MiniStat label="Notary" value={t.notary} />
              <MiniStat label="Time to use" value={t.time} />
            </div>

            <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: INK_40, fontWeight: 600, marginBottom: 10 }}>Typically granted to</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {t.users.map((u) => (
                <span key={u} style={{ padding: "5px 12px", background: PAPER_2, border: `1px solid ${LINE}`, fontSize: 12, borderRadius: 100, color: INK_60 }}>{u}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={{ padding: "12px 14px", background: PAPER_2, border: `1px solid ${LINE}`, borderRadius: 6 }}>
      <div style={{ fontSize: 10, color: INK_40, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{value}</div>
    </div>
  );
}

/* ============================================
   COVERAGE (state map)
   ============================================ */
const STATES = [
  { code: "FL", name: "Florida",         phase: 1, status: "live",
    upoaa: "Adopted (modified)",     ron: "Permanent since 2019",
    why: "Largest aging population in the US (21.7% over 65) plus snowbird real estate volume. Highest urgency-driven POA demand per capita." },
  { code: "TX", name: "Texas",            phase: 1, status: "live",
    upoaa: "Adopted (2017)",          ron: "Permanent since 2018",
    why: "Scale plus inbound migration. No state income tax drives significant interstate financial restructuring." },
  { code: "AZ", name: "Arizona",          phase: 1, status: "live",
    upoaa: "Adopted (2010)",          ron: "Permanent since 2020",
    why: "Retiree-dense and the only state with ABS licensing — favorable regulatory posture for legal-tech operations." },
  { code: "NC", name: "North Carolina",   phase: 1, status: "live",
    upoaa: "Adopted (2018)",          ron: "Permanent since 2022",
    why: "Cleanest UPL precedent in the country — software-generated documents explicitly carved out by statute since 2016." },
  { code: "CO", name: "Colorado",         phase: 2, status: "soon",
    upoaa: "Adopted (2010)",          ron: "Permanent since 2021",
    why: "First UPOAA adopter. Mature RON infrastructure. Higher-income demographics support premium tiers." },
  { code: "VA", name: "Virginia",         phase: 2, status: "soon",
    upoaa: "Adopted (2010)",          ron: "First state, 2012",
    why: "First state to authorize RON. Proximity to federal employers drives military POA demand." },
  { code: "CA", name: "California",       phase: 4, status: "hybrid",
    upoaa: "Not adopted (CPC § 4000)", ron: "Permanent in 2030",
    why: "Massive market but full RON arrives in 2030. POA-IT uses IPEN (in-person electronic notarization) in the interim — same digital wizard, in-person notary execution." },
];

function Coverage({ idx, setIdx }) {
  const s = STATES[idx];
  return (
    <section style={{ maxWidth: 1280, margin: "0 auto", padding: "112px 32px" }}>
      <SectionHeader kicker="Geography" title="Where POA-IT works." subtitle="Power of attorney is governed by state law. POA-IT launches state by state — never nationally until the legal foundation is sound and operational." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 40, marginTop: 56 }}>
        <div>
          <USMap states={STATES} activeIdx={idx} setIdx={setIdx} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 20 }}>
            <Legend swatch={INK} label="Live (Phase 1)" />
            <Legend swatch={INK_40} label="Coming (Phase 2-3)" />
            <Legend swatch={ACCENT} label="Hybrid (CA, until 2030)" />
          </div>
        </div>

        <div style={{ background: PAPER_2, border: `1px solid ${LINE}`, borderRadius: 12, padding: 36 }}>
          <div style={{
            fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8,
            color: s.status === "live" ? LIVE_GREEN : s.status === "hybrid" ? ACCENT : INK_40,
          }}>
            {s.status === "live" ? "● Live now" : s.status === "hybrid" ? "● Hybrid (IPEN) until 2030" : "● Coming Q3 2026"}
          </div>
          <h3 style={{ fontSize: 42, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.03em", margin: "0 0 24px" }}>
            {s.name}
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
            <MiniStat label="UPOAA" value={s.upoaa} />
            <MiniStat label="Remote notary" value={s.ron} />
          </div>

          <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: INK_40, fontWeight: 600, marginBottom: 10 }}>Why this state</div>
          <p style={{ fontSize: 16, lineHeight: 1.55, color: INK_60, fontWeight: 400, margin: 0 }}>
            {s.why}
          </p>

          <div style={{ marginTop: 28, paddingTop: 24, borderTop: `1px solid ${LINE}`, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            <PhasePill n="4"  l="Phase 1" active={s.phase === 1} />
            <PhasePill n="12" l="Phase 2" active={s.phase === 2} />
            <PhasePill n="31" l="Phase 3" active={s.phase === 3} />
            <PhasePill n="49" l="Phase 4" active={s.phase === 4} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Legend({ swatch, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 12, height: 12, background: swatch, display: "inline-block", borderRadius: 2 }}></span>
      <span style={{ fontSize: 12, color: INK_60 }}>{label}</span>
    </div>
  );
}

function PhasePill({ n, l, active }) {
  return (
    <div style={{
      padding: "10px 8px", textAlign: "center", borderRadius: 6,
      background: active ? INK : PAPER,
      color: active ? PAPER : INK,
      border: `1px solid ${active ? INK : LINE}`,
    }}>
      <div className="num" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.02em" }}>{n}</div>
      <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 4, opacity: active ? 0.7 : 0.6, fontWeight: 500 }}>{l}</div>
    </div>
  );
}

function USMap({ states, activeIdx, setIdx }) {
  const positions = {
    FL: { x: 540, y: 290, w: 90, h: 50 },
    TX: { x: 250, y: 260, w: 100, h: 70 },
    AZ: { x: 130, y: 200, w: 80, h: 70 },
    NC: { x: 500, y: 200, w: 80, h: 50 },
    CO: { x: 200, y: 150, w: 80, h: 50 },
    VA: { x: 530, y: 150, w: 80, h: 50 },
    CA: { x: 50, y: 130, w: 70, h: 130 },
  };
  return (
    <div style={{ background: PAPER_2, border: `1px solid ${LINE}`, borderRadius: 12, padding: 24 }}>
      <svg viewBox="0 0 700 380" style={{ width: "100%", height: "auto" }}>
        <text x="350" y="36" textAnchor="middle" fontSize="11" fill={INK_40} fontFamily="Geist Mono, monospace" letterSpacing="0.18em">
          POA-IT COVERAGE MAP
        </text>
        {states.map((s, i) => {
          const p = positions[s.code];
          if (!p) return null;
          const isActive = i === activeIdx;
          let fill = s.status === "live" ? INK : s.status === "hybrid" ? ACCENT : INK_40;
          if (isActive) fill = LIVE_GREEN;
          return (
            <g key={s.code} style={{ cursor: "pointer" }} onClick={() => setIdx(i)}>
              <rect x={p.x} y={p.y} width={p.w} height={p.h} fill={fill} rx="4"
                stroke={isActive ? INK : "rgba(255,255,255,0.6)"} strokeWidth={isActive ? 3 : 1} />
              <text x={p.x + p.w / 2} y={p.y + p.h / 2 + 5} textAnchor="middle"
                fontSize="14" fontFamily="Geist Mono, monospace" fontWeight="600"
                fill={PAPER} style={{ pointerEvents: "none" }}>
                {s.code}
              </text>
            </g>
          );
        })}
        <text x="350" y="368" textAnchor="middle" fontSize="10" fill={INK_40} fontFamily="Geist Mono, monospace" letterSpacing="0.12em">
          + 42 MORE STATES BY MONTH 36
        </text>
      </svg>
    </div>
  );
}

/* ============================================
   PRICING — 3 modes
   ============================================ */
const TIERS = {
  txn: [
    { label: "Per document", name: "Single POA",           price: "$79",  period: "one-time",
      desc: "One financial or healthcare POA, state-specific, ready in eleven minutes.",
      features: ["State-specific decision tree","Plain-English explanations","Encrypted PDF download","30-day free updates"] },
    { label: "Most chosen",  name: "Full plan",            price: "$179", period: "one-time", featured: true,
      desc: "The four documents everyone over 30 should have. Bundled and synchronized.",
      features: ["Financial + Healthcare POA","HIPAA authorization","Advance directive","Inline RON included","12 months vault storage"] },
    { label: "Transactional", name: "Limited / single-use", price: "$39", period: "one-time",
      desc: "One specific transaction. Auto-expires when the transaction does. No paperwork to revoke.",
      features: ["Real estate, vehicle, or tax POA","Auto-expiry on event","RON-ready signature","Title company verification API"] },
  ],
  sub: [
    { label: "Personal",     name: "POA-IT Vault",        price: "$9.99",  period: "/month",
      desc: "Keep your authority current. Unlimited updates, family sharing, third-party verification.",
      features: ["Unlimited POA edits","Vault storage forever","One-click revoke + notify","Verification API access","Annual review reminders"] },
    { label: "Most chosen",  name: "POA-IT Family",       price: "$19.99", period: "/month", featured: true,
      desc: "For the sandwich generation. Up to 6 people, multi-state, parent-child coordination.",
      features: ["Up to 6 family members","Multi-state coverage","Parent-child coordination","Springing POA activation","Annual attorney check-in"] },
    { label: "Premium",      name: "POA-IT Concierge",    price: "$49",    period: "/month",
      desc: "Attorney access on demand. Quarterly review with a licensed attorney in your state.",
      features: ["Everything in Family","Quarterly attorney check-in","Priority RON queue","Estate plan coordination","Multi-state migration"] },
  ],
  ent: [
    { label: "Health systems", name: "POA-IT for Hospitals", price: "$0.50–2", period: "/patient/mo",
      desc: "Embedded in admissions and transitional care. Volume-tiered, white-labeled, HIPAA-compliant.",
      features: ["Epic / Cerner integration","Admission workflow embedding","Discharge planning module","Social worker dashboard","BAA included"] },
    { label: "Most active",    name: "POA-IT for Banks",     price: "$1–3",    period: "/account/yr", featured: true,
      desc: "Reduce fraud risk and improve elder-customer satisfaction. White-labeled financial POA workflow.",
      features: ["White-label web + mobile","Branch employee training","Fraud detection integration","Real-time verification API","Custody-grade compliance"] },
    { label: "Benefits",       name: "POA-IT for Employers", price: "$4–12",   period: "/employee/yr",
      desc: "A voluntary benefit that costs less than a billable hour and protects your entire workforce.",
      features: ["SSO + benefits portal","Open enrollment campaigns","Employee education content","Family coverage included","Annual reporting"] },
  ],
};

function Pricing({ mode, setMode, onStart }) {
  const tiers = TIERS[mode];
  return (
    <section style={{ background: PAPER_2, borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "112px 32px" }}>
        <SectionHeader kicker="Pricing" title="Three ways to pay." subtitle="Per document for the urgent moment. Subscription for family coordination. Enterprise for the institutions where the need actually originates." />

        <div style={{ display: "flex", justifyContent: "center", marginTop: 40, marginBottom: 48 }}>
          <div style={{ display: "inline-flex", background: PAPER, border: `1px solid ${LINE}`, borderRadius: 10, padding: 3 }}>
            {[
              { id: "txn", label: "Per document" },
              { id: "sub", label: "Subscription" },
              { id: "ent", label: "Enterprise" },
            ].map((m) => (
              <button key={m.id} onClick={() => setMode(m.id)} style={{
                padding: "9px 22px", fontSize: 13, fontWeight: 500,
                background: mode === m.id ? INK : "transparent",
                color: mode === m.id ? PAPER : INK_60,
                borderRadius: 7,
                transition: "all 0.15s ease",
              }}>{m.label}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
          {tiers.map((t, i) => (
            <div key={i} style={{
              background: t.featured ? INK : PAPER,
              color: t.featured ? PAPER : INK,
              padding: 32, border: `1px solid ${t.featured ? INK : LINE}`, borderRadius: 12,
              display: "flex", flexDirection: "column",
            }}>
              <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: t.featured ? ACCENT : INK_40, fontWeight: 600, marginBottom: 14 }}>
                {t.label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 20, minHeight: 32, letterSpacing: "-0.015em" }}>{t.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 14 }}>
                <span className="num" style={{ fontSize: 44, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.035em" }}>{t.price}</span>
                <span style={{ fontSize: 13, color: t.featured ? "rgba(255,255,255,0.6)" : INK_40 }}>{t.period}</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.55, color: t.featured ? "rgba(255,255,255,0.72)" : INK_60, fontWeight: 400, margin: "0 0 24px", minHeight: 68 }}>
                {t.desc}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, flex: 1 }}>
                {t.features.map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <Check size={14} color={t.featured ? ACCENT : INK} strokeWidth={2.4} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => {
                if (mode === "txn") {
                  const planId = t.name.includes("Full") ? "full" : "single";
                  if (onStart) onStart(planId);
                } else if (onStart) {
                  onStart("single");
                }
              }} style={{
                padding: "12px 18px", fontSize: 14, fontWeight: 500,
                background: t.featured ? PAPER : INK,
                color: t.featured ? INK : PAPER,
                borderRadius: 7,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                Get started <ArrowRight size={14} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================
   CHANNELS
   ============================================ */
const CHANNELS = [
  { name: "Hospital systems",         tier: "B2B2C Tier 1",   Icon: Hospital,      acv: "$200K–$2M",    cycle: "6–9 months", target: "5 systems",
    desc: "Embedded in admissions and transitional care. Highest-conversion B2B2C channel because hospitalization is the trigger AND the demand." },
  { name: "Banks & credit unions",    tier: "B2B2C Tier 1",   Icon: Landmark,      acv: "$100K–$1.5M",  cycle: "4–8 months", target: "3 CUs + 1 bank",
    desc: "Fraud reduction plus customer-service value for aging customers. Navy Federal is the model; regional CUs are the path." },
  { name: "Eldercare facilities",     tier: "B2B2C Tier 2",   Icon: Heart,         acv: "$50K–$400K",   cycle: "3–5 months", target: "2 chains",
    desc: "POA is required at admission. Move-in is the trigger. Brookdale-tier chains have volume; boutique operators have the cleanest workflows." },
  { name: "Employer benefits",        tier: "B2B2B2C",        Icon: Briefcase,     acv: "$30K–$300K",   cycle: "2–4 months", target: "1 platform",
    desc: "Sold through benefits brokers (Mercer, Justworks). Subsidized by the employer, sticky once enrolled. Lowest CAC of any channel." },
  { name: "Title companies",          tier: "B2B transactional", Icon: FileText,   acv: "$20K–$100K",   cycle: "1–3 months", target: "3 firms",
    desc: "Real estate POAs for out-of-state buyers and sellers. Pure transactional, high volume, no lifecycle but extreme intent. Sold per-closing." },
  { name: "Wealth advisors",          tier: "B2B2C Tier 2",   Icon: HandCoins,     acv: "$80K–$600K",   cycle: "5–9 months", target: "20 RIAs",
    desc: "POA-IT-for-advisor product competing with Vanilla and Wealth.com on the POA wedge. Per-household pricing, white-labeled in advisor brand." },
  { name: "Direct paid acquisition",  tier: "B2C",            Icon: Search,        acv: "$79–$300 LTV", cycle: "Same-session", target: "10K customers",
    desc: "Google + Meta. Bid on urgency keywords: 'POA hospital', 'emergency medical POA'. High CPC, unmatched intent." },
  { name: "Cross-platform integrations", tier: "Strategic",   Icon: ArrowUpRight,  acv: "Variable",     cycle: "Quarterly",  target: "5 integrations",
    desc: "FreeWill (will → POA cross-sell), Trust & Will (probate referrals), AARP, MyChart. Where adjacency creates the trigger." },
];

function Channels({ idx, setIdx }) {
  const c = CHANNELS[idx];
  const ActiveIcon = c.Icon;
  return (
    <section style={{ maxWidth: 1280, margin: "0 auto", padding: "112px 32px" }}>
      <SectionHeader kicker="Distribution" title="Eight ways into the market." subtitle="POA need is identified by someone else first — a hospital, a bank, an HR team, an advisor. B2B2C is the front door. D2C is the cleanup channel." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 40, marginTop: 56 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {CHANNELS.map((ch, i) => {
            const isActive = i === idx;
            const Icon = ch.Icon;
            return (
              <button key={ch.name} onClick={() => setIdx(i)} style={{
                padding: 18, textAlign: "left", borderRadius: 8,
                background: isActive ? INK : PAPER,
                color: isActive ? PAPER : INK,
                border: `1px solid ${isActive ? INK : LINE}`,
                transition: "all 0.18s ease",
                display: "flex", flexDirection: "column", gap: 12, minHeight: 96,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Icon size={18} strokeWidth={1.7} color={isActive ? PAPER : INK_60} />
                  <span className="mono" style={{ fontSize: 9, color: isActive ? ACCENT : INK_40, letterSpacing: "0.08em", fontWeight: 600 }}>{ch.tier}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.2 }}>{ch.name}</div>
              </button>
            );
          })}
        </div>

        <div style={{ background: INK, color: PAPER, padding: 36, borderRadius: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, background: PAPER, color: INK, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ActiveIcon size={26} strokeWidth={1.6} />
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: ACCENT, fontWeight: 600 }}>{c.tier}</div>
              <div style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.025em" }}>{c.name}</div>
            </div>
          </div>
          <p style={{ fontSize: 16, lineHeight: 1.55, color: "rgba(255,255,255,0.78)", fontWeight: 400, margin: "0 0 28px" }}>
            {c.desc}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, paddingTop: 24, borderTop: `1px solid rgba(255,255,255,0.14)` }}>
            <ChannelMetric label="ACV" value={c.acv} />
            <ChannelMetric label="Cycle" value={c.cycle} />
            <ChannelMetric label="Y1 target" value={c.target} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ChannelMetric({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 500 }}>{value}</div>
    </div>
  );
}

/* ============================================
   TRAJECTORY
   ============================================ */
function Trajectory() {
  const points = [
    { m: 6,  arr: 0.4, label: "$400K" },
    { m: 12, arr: 2.4, label: "$2.4M" },
    { m: 18, arr: 9,   label: "$9M" },
    { m: 24, arr: 27,  label: "$27M" },
    { m: 36, arr: 85,  label: "$85M" },
  ];
  const W = 1200, H = 360;
  const padL = 80, padR = 40, padT = 40, padB = 60;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const maxArr = 90;

  const xFor = (m) => padL + ((m - 6) / 30) * chartW;
  const yFor = (a) => padT + (1 - a / maxArr) * chartH;

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(p.m)} ${yFor(p.arr)}`).join(" ");
  const area = path + ` L ${xFor(36)} ${padT + chartH} L ${xFor(6)} ${padT + chartH} Z`;

  const benchmarks = [
    { label: "ARR by M36",         value: "$85M",  sub: "Conservative vs Trust & Will at parallel stage" },
    { label: "Paid documents M36", value: "600K",  sub: "Across 49 states + DC" },
    { label: "LTV / CAC by M24",   value: "6.5×",  sub: "B2B2C blend and subscription mix" },
    { label: "Gross margin M36",   value: "82%",   sub: "Software-dominant cost structure" },
  ];

  return (
    <section style={{ maxWidth: 1280, margin: "0 auto", padding: "112px 32px" }}>
      <SectionHeader kicker="Trajectory" title="$85M ARR by month 36." subtitle="Benchmarked against Trust & Will's actual 6-year trajectory to a $169M valuation, accelerated by B2B2C-led economics and a POA-first thesis." />

      <div style={{ marginTop: 56, background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, padding: 32 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
          {[0, 20, 40, 60, 80].map((v) => (
            <g key={v}>
              <line x1={padL} y1={yFor(v)} x2={padL + chartW} y2={yFor(v)} stroke={LINE} strokeWidth={1} />
              <text x={padL - 12} y={yFor(v) + 4} textAnchor="end" fontSize="11" fill={INK_40} fontFamily="Geist Mono, monospace">${v}M</text>
            </g>
          ))}
          {points.map((p) => (
            <text key={p.m} x={xFor(p.m)} y={H - 25} textAnchor="middle" fontSize="11" fill={INK_40} fontFamily="Geist Mono, monospace">M{p.m}</text>
          ))}
          <path d={area} fill="rgba(37,99,235,0.08)" />
          <path d={path} stroke={ACCENT} strokeWidth="2.5" fill="none" />
          {points.map((p) => (
            <g key={p.m}>
              <circle cx={xFor(p.m)} cy={yFor(p.arr)} r="6" fill={INK} />
              <circle cx={xFor(p.m)} cy={yFor(p.arr)} r="3" fill={ACCENT} />
              <text x={xFor(p.m)} y={yFor(p.arr) - 16} textAnchor="middle" fontSize="13" fontFamily="Geist, sans-serif" fontWeight="600" fill={INK}>{p.label}</text>
            </g>
          ))}
          <line x1={xFor(12)} y1={padT} x2={xFor(12)} y2={padT + chartH} stroke={INK_20} strokeWidth={1} strokeDasharray="4 4" />
          <text x={xFor(12) + 8} y={padT + 16} fontSize="10" fill={INK_40} fontFamily="Geist, sans-serif" fontWeight="600" letterSpacing="0.06em">PHASE 2 · 12 STATES</text>
          <line x1={xFor(24)} y1={padT} x2={xFor(24)} y2={padT + chartH} stroke={INK_20} strokeWidth={1} strokeDasharray="4 4" />
          <text x={xFor(24) + 8} y={padT + 16} fontSize="10" fill={INK_40} fontFamily="Geist, sans-serif" fontWeight="600" letterSpacing="0.06em">PHASE 3 · UPOAA STATES</text>
        </svg>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, marginTop: 40 }}>
        {benchmarks.map((b) => (
          <div key={b.label} style={{ borderTop: `1px solid ${INK}`, paddingTop: 16 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: INK_40, fontWeight: 600, marginBottom: 10 }}>{b.label}</div>
            <div className="num" style={{ fontSize: 38, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.03em" }}>{b.value}</div>
            <div style={{ fontSize: 12, color: INK_60, marginTop: 10, lineHeight: 1.4 }}>{b.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================
   PARTNER STRIP (marquee)
   ============================================ */
const PARTNERS = [
  "MEMORIAL HERMANN", "BANNER HEALTH", "CLEVELAND CLINIC", "NAVY FEDERAL",
  "USAA", "FIRST TECH CU", "BROOKDALE", "SUNRISE SENIOR LIVING",
  "MERCER", "JUSTWORKS", "STEWART TITLE", "FIDELITY NATIONAL",
  "NORTHWESTERN MUTUAL", "EDWARD JONES", "AARP", "MYCHART",
];

function PartnerStrip() {
  return (
    <section style={{ background: INK, color: PAPER, padding: "56px 0", overflow: "hidden" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto 28px", padding: "0 32px", textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: ACCENT, fontWeight: 600 }}>
          Target partner network · 200 institutions by M36
        </div>
      </div>
      <div style={{ overflow: "hidden", position: "relative" }}>
        <div className="scroll-marquee" style={{ display: "flex", gap: 56, whiteSpace: "nowrap", width: "fit-content" }}>
          {[...PARTNERS, ...PARTNERS].map((p, i) => (
            <span key={i} style={{ fontSize: 18, fontWeight: 600, letterSpacing: "0.08em", opacity: 0.6, flexShrink: 0 }}>
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================
   FOOTER
   ============================================ */
function Footer() {
  return (
    <footer style={{ background: PAPER, borderTop: `1px solid ${LINE}`, padding: "72px 0 36px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 40, marginBottom: 56 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <Mark size={22} />
              <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em" }}>poa-it</div>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.55, color: INK_60, fontWeight: 400, maxWidth: 300, margin: 0 }}>
              Power of attorney that holds up — created, notarized, stored, and revocable in one click.
            </p>
          </div>
          <FooterCol title="Product" items={["12 POA types","State coverage","Pricing","Verification API","Vault"]} />
          <FooterCol title="Partners" items={["Hospitals","Banks & CUs","Employer benefits","Wealth managers","Title companies"]} />
          <FooterCol title="Company" items={["About","Careers","Press","Investors","Contact"]} />
          <FooterCol title="Legal"   items={["Privacy","Terms","UPL disclosure","Attorney access","Security"]} />
        </div>

        <div style={{ paddingTop: 28, borderTop: `1px solid ${LINE}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
          <div style={{ fontSize: 11, color: INK_40, maxWidth: 760, lineHeight: 1.6 }}>
            POA-IT is not a law firm and does not provide legal advice. POA-IT provides self-help technology that helps you create your own legal documents. For legal advice about your specific situation, consult an attorney licensed in your jurisdiction.
          </div>
          <div style={{ fontSize: 11, color: INK_40 }}>© 2026 POA-IT Inc.</div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }) {
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: INK_40, fontWeight: 600, marginBottom: 16 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((i) => (
          <span key={i} style={{ fontSize: 13, color: INK_60 }}>{i}</span>
        ))}
      </div>
    </div>
  );
}

/* ============================================
   SHARED — SectionHeader
   ============================================ */
function SectionHeader({ kicker, title, subtitle }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 48, alignItems: "end" }}>
      <div>
        <Kicker text={kicker} />
        <h2 style={{
          fontSize: "clamp(2.2rem, 4.2vw, 3.6rem)",
          fontWeight: 600,
          lineHeight: 1,
          letterSpacing: "-0.035em",
          margin: "20px 0 0",
        }}>
          {title}
        </h2>
      </div>
      <div>
        <p style={{ fontSize: 17, lineHeight: 1.5, color: INK_60, fontWeight: 400, margin: 0 }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   ============================================================
                  WIZARD · PAYMENT · SUCCESS
   ============================================================
   ============================================================ */

const WIZARD_STEPS = [
  { id: 0, label: "Type" },
  { id: 1, label: "State" },
  { id: 2, label: "Agent" },
  { id: 3, label: "Powers" },
  { id: 4, label: "Review" },
];

function WizardModal({ step, setStep, data, updateData, onClose, paymentProcessing, setPaymentProcessing, onPaymentSuccess }) {
  const isPayment = step === 5;
  const isSuccess = step === 6;
  const isWizard = step >= 0 && step <= 4;

  // Validation for "Continue" enablement per step
  const canContinue = () => {
    if (step === 0) return !!data.poaType;
    if (step === 1) return !!data.state;
    if (step === 2) return data.principalName.length > 1 && data.agentName.length > 1 && data.agentRelationship.length > 0;
    if (step === 3) return data.powers.length > 0;
    if (step === 4) return true;
    return false;
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(10,10,10,0.55)",
        backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, fontFamily: SANS,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: PAPER, borderRadius: 16,
          width: "100%", maxWidth: isSuccess ? 640 : 880,
          maxHeight: "92vh", overflow: "hidden",
          display: "flex", flexDirection: "column",
          boxShadow: "0 32px 64px -16px rgba(0,0,0,0.3), 0 0 0 1px rgba(10,10,10,0.05)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 28px", borderBottom: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Mark size={22} />
            <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em" }}>poa-it</div>
            {isWizard && (
              <div className="mono" style={{
                marginLeft: 6, padding: "3px 8px", fontSize: 10, fontWeight: 600,
                color: INK_60, background: PAPER_2, borderRadius: 4,
                letterSpacing: "0.06em", textTransform: "uppercase",
              }}>Step {step + 1} of 5</div>
            )}
            {isPayment && (
              <div className="mono" style={{
                marginLeft: 6, padding: "3px 8px", fontSize: 10, fontWeight: 600,
                color: ACCENT, background: "rgba(37,99,235,0.08)", borderRadius: 4,
                letterSpacing: "0.06em", textTransform: "uppercase",
              }}>Payment</div>
            )}
          </div>
          <button onClick={onClose} style={{ fontSize: 13, color: INK_40, display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={14} style={{ transform: "rotate(45deg)" }} /> Close
          </button>
        </div>

        {/* Progress bar (wizard only) */}
        {isWizard && <WizardProgress step={step} />}

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {step === 0 && <Step0_Type data={data} updateData={updateData} />}
          {step === 1 && <Step1_State data={data} updateData={updateData} />}
          {step === 2 && <Step2_Agent data={data} updateData={updateData} />}
          {step === 3 && <Step3_Powers data={data} updateData={updateData} />}
          {step === 4 && <Step4_Review data={data} updateData={updateData} />}
          {step === 5 && (
            <PaymentScreen
              data={data}
              processing={paymentProcessing}
              setProcessing={setPaymentProcessing}
              onSuccess={onPaymentSuccess}
              onBack={() => setStep(4)}
            />
          )}
          {step === 6 && <SuccessScreen data={data} onClose={onClose} />}
        </div>

        {/* Footer (wizard only — payment has its own pay button; success has its own buttons) */}
        {isWizard && (
          <div style={{ padding: "18px 28px", borderTop: `1px solid ${LINE}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: PAPER_2 }}>
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0 || paymentProcessing}
              style={{
                fontSize: 14, fontWeight: 500, padding: "10px 18px",
                background: "transparent", color: step === 0 ? INK_20 : INK_60,
                borderRadius: 7,
                cursor: step === 0 || paymentProcessing ? "not-allowed" : "pointer",
                display: "inline-flex", alignItems: "center", gap: 8,
              }}
            >
              ← Back
            </button>
            <button
              onClick={async () => {
                if (step < 4) {
                  setStep(step + 1);
                  return;
                }
                // Step 4: try real Stripe Checkout, fall back to mock for artifact preview
                setPaymentProcessing(true);
                try {
                  const res = await fetch("/api/create-checkout-session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ plan: data.plan, wizardData: data }),
                  });
                  if (!res.ok) throw new Error("Backend not available");
                  const payload = await res.json();
                  if (!payload.url) throw new Error("No checkout URL returned");
                  window.location.href = payload.url;
                } catch (err) {
                  // No backend (artifact preview) — fall back to local mock payment screen
                  console.log("[poa-it] Stripe backend unavailable, using mock:", err.message);
                  setPaymentProcessing(false);
                  setStep(5);
                }
              }}
              disabled={!canContinue() || paymentProcessing}
              style={{
                fontSize: 14, fontWeight: 500, padding: "11px 22px",
                background: canContinue() && !paymentProcessing ? INK : INK_20,
                color: PAPER, borderRadius: 7,
                cursor: canContinue() && !paymentProcessing ? "pointer" : "not-allowed",
                display: "inline-flex", alignItems: "center", gap: 8,
                transition: "background 0.15s",
              }}
            >
              {paymentProcessing
                ? "Redirecting to secure checkout…"
                : (step === 4 ? `Continue to payment · $${data.plan === "full" ? "179" : "79"}` : "Continue")}
              {!paymentProcessing && <ArrowRight size={14} strokeWidth={2.2} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function WizardProgress({ step }) {
  return (
    <div style={{ padding: "0 28px", background: PAPER }}>
      <div style={{ display: "flex", gap: 6, paddingTop: 16, paddingBottom: 4 }}>
        {WIZARD_STEPS.map((s, i) => (
          <div
            key={s.id}
            style={{
              flex: 1, height: 3, borderRadius: 100,
              background: i <= step ? INK : LINE,
              transition: "background 0.3s ease",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, paddingBottom: 8 }}>
        {WIZARD_STEPS.map((s, i) => (
          <div key={s.id} style={{ fontSize: 11, fontWeight: 500, color: i === step ? INK : INK_40, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================
   STEP 0 — Type
   ============================================ */
function Step0_Type({ data, updateData }) {
  const types = [
    { id: "financial", title: "Financial decisions", desc: "Banking, real estate, taxes, contracts. Stays in effect through incapacity.", Icon: HandCoins, available: true, badge: "Most common" },
    { id: "healthcare", title: "Healthcare decisions", desc: "Medical treatment, end-of-life wishes. Bundled with HIPAA + advance directive.", Icon: Stethoscope, available: false, badge: "Coming Q3" },
    { id: "realestate", title: "Real estate (one transaction)", desc: "A single closing or transfer. Auto-expires when complete.", Icon: Building2, available: false, badge: "Coming Q3" },
    { id: "business", title: "Business operations", desc: "Run your business while you're unavailable. Indefinite duration.", Icon: Briefcase, available: false, badge: "Coming Q4" },
  ];
  return (
    <div style={{ padding: "40px 48px" }}>
      <h2 style={{ display: "flex", alignItems: "center", fontSize: 32, fontWeight: 600, letterSpacing: "-0.025em", margin: "0 0 8px" }}>
        <span>What kind of authority do you need to grant?</span>
        <Tooltip width={300}>
          A power of attorney is a legal document where you give someone you trust the right to act on your behalf — to sign things, make decisions, or handle money — when you can't be there yourself. You choose what they can do and what they can't.
        </Tooltip>
      </h2>
      <p style={{ fontSize: 15, color: INK_60, margin: "0 0 32px", maxWidth: 540 }}>
        Every POA is state-specific. We'll tailor every question that follows to the document you actually need.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {types.map((t) => {
          const selected = data.poaType === t.id;
          const Icon = t.Icon;
          return (
            <button
              key={t.id}
              onClick={() => t.available && updateData({ poaType: t.id })}
              disabled={!t.available}
              style={{
                display: "flex", alignItems: "flex-start", gap: 16,
                padding: "20px 22px", textAlign: "left",
                background: selected ? INK : PAPER,
                color: selected ? PAPER : INK,
                opacity: t.available ? 1 : 0.55,
                border: `1px solid ${selected ? INK : LINE}`,
                borderRadius: 10,
                cursor: t.available ? "pointer" : "not-allowed",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: selected ? "rgba(255,255,255,0.1)" : PAPER_2,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={18} strokeWidth={1.7} color={selected ? PAPER : INK_60} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{t.title}</span>
                  {t.badge && (
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: "2px 7px",
                      background: selected ? "rgba(255,255,255,0.15)" : (t.available ? "rgba(37,99,235,0.1)" : PAPER_2),
                      color: selected ? PAPER : (t.available ? ACCENT : INK_40),
                      borderRadius: 4, letterSpacing: "0.04em", textTransform: "uppercase",
                    }}>{t.badge}</span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: selected ? "rgba(255,255,255,0.72)" : INK_60, lineHeight: 1.4 }}>{t.desc}</div>
              </div>
              {selected && <Check size={18} strokeWidth={2.2} style={{ marginTop: 8 }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================
   STEP 1 — State
   ============================================ */
function Step1_State({ data, updateData }) {
  const states = [
    { id: "FL", name: "Florida", available: true, note: "RON since 2019" },
    { id: "TX", name: "Texas", available: false, note: "Q3 2026" },
    { id: "AZ", name: "Arizona", available: false, note: "Q4 2026" },
    { id: "NC", name: "North Carolina", available: false, note: "Q4 2026" },
  ];
  const flLaw = [
    { text: "Two adult witnesses present at signing", tip: "Two people over 18 need to watch you sign. They can be family, friends, or neighbors — anyone except your agent. We help you coordinate this." },
    { text: "Notary acknowledgment (in-person or RON)", tip: "A notary public watches you sign and stamps the document. You can do this online with us — no driving anywhere." },
    { text: "Specific 'superpowers' language for gifts and real estate", tip: "Florida requires extra-specific wording for certain powers like giving away money or selling property. We add it automatically — you don't have to think about it." },
    { text: "Statutory short form per Fla. Stat. § 709.2202", tip: "The Florida legislature wrote a model form that's automatically accepted by banks and other institutions. We use that exact form." },
  ];
  return (
    <div style={{ padding: "40px 48px" }}>
      <h2 style={{ display: "flex", alignItems: "center", fontSize: 32, fontWeight: 600, letterSpacing: "-0.025em", margin: "0 0 8px" }}>
        <span>Where do you live?</span>
        <Tooltip width={300}>
          The rules for power of attorney are written by each state separately. We need to know your state so the document we create is legally recognized where you live.
        </Tooltip>
      </h2>
      <p style={{ fontSize: 15, color: INK_60, margin: "0 0 32px", maxWidth: 540 }}>
        State law shapes everything that follows — required witnesses, the precise statutory language, whether notarization can happen remotely.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 28 }}>
        {states.map((s) => {
          const selected = data.state === s.id;
          return (
            <button
              key={s.id}
              onClick={() => s.available && updateData({ state: s.id })}
              disabled={!s.available}
              style={{
                padding: "20px 16px", textAlign: "left",
                background: selected ? INK : PAPER,
                color: selected ? PAPER : INK,
                opacity: s.available ? 1 : 0.5,
                border: `1px solid ${selected ? INK : LINE}`,
                borderRadius: 10,
                cursor: s.available ? "pointer" : "not-allowed",
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{s.name}</div>
              <div className="mono" style={{ fontSize: 10, color: selected ? "rgba(255,255,255,0.6)" : INK_40, letterSpacing: "0.05em", textTransform: "uppercase" }}>{s.note}</div>
            </button>
          );
        })}
      </div>

      <div style={{ background: INK, color: PAPER, padding: 28, borderRadius: 12 }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: ACCENT, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center" }}>
          <span>Florida law requires</span>
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
          {flLaw.map((item, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 14, color: "rgba(255,255,255,0.88)" }}>
              <Check size={14} strokeWidth={2.2} color={ACCENT} style={{ marginTop: 3, flexShrink: 0 }} />
              <span style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                <span>{item.text}</span>
                <Tooltip width={300}>{item.tip}</Tooltip>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ============================================
   STEP 2 — Principal + Agent
   ============================================ */
function Step2_Agent({ data, updateData }) {
  const relationships = ["Spouse", "Adult child", "Sibling", "Parent", "Friend", "Attorney", "Fiduciary"];
  return (
    <div style={{ padding: "40px 48px" }}>
      <h2 style={{ display: "flex", alignItems: "center", fontSize: 32, fontWeight: 600, letterSpacing: "-0.025em", margin: "0 0 8px" }}>
        <span>Who are you, and who is your agent?</span>
      </h2>
      <p style={{ fontSize: 15, color: INK_60, margin: "0 0 28px", maxWidth: 580 }}>
        The principal is you — the person granting authority. The agent is the person you trust to act on your behalf. We'll verify both identities before the document is finalized.
      </p>

      <div style={{ marginBottom: 28 }}>
        <SectionLabel>
          <span style={{ display: "inline-flex", alignItems: "center" }}>
            <span>Principal (you)</span>
            <Tooltip width={300}>
              The principal is the person who's granting power — that's you. You're the one giving someone else the right to act on your behalf.
            </Tooltip>
          </span>
        </SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormField
            label="Full legal name"
            value={data.principalName}
            onChange={(v) => updateData({ principalName: v })}
            placeholder="Jane M. Doe"
            tooltip="The exact name printed on your driver's license, passport, or other government ID. Including your middle name or initial is important — banks check for this."
          />
          <FormField
            label="Date of birth"
            value={data.principalDob}
            onChange={(v) => updateData({ principalDob: v })}
            placeholder="MM/DD/YYYY"
            tooltip="Florida requires your date of birth on the document so banks and hospitals can confirm they're dealing with the right person."
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <FormField
            label="Address"
            value={data.principalAddress}
            onChange={(v) => updateData({ principalAddress: v })}
            placeholder="123 Main St, Miami, FL 33101"
            tooltip="Your home address — used to confirm you're a Florida resident and the document is governed by Florida law."
          />
        </div>
      </div>

      <div>
        <SectionLabel>
          <span style={{ display: "inline-flex", alignItems: "center" }}>
            <span>Primary agent</span>
            <Tooltip width={320}>
              The agent is the person you're giving authority to — usually called your "attorney-in-fact" (this does NOT mean they have to be a lawyer). Most people choose a spouse, an adult child, or a close trusted friend.
            </Tooltip>
          </span>
        </SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormField
            label="Full legal name"
            value={data.agentName}
            onChange={(v) => updateData({ agentName: v })}
            placeholder="John A. Doe"
            tooltip="Their full legal name as it appears on their ID. Your agent will need to present this ID when they use the document."
          />
          <SelectField
            label="Relationship"
            value={data.agentRelationship}
            onChange={(v) => updateData({ agentRelationship: v })}
            options={relationships}
            tooltip="How this person is related to you. Florida requires this to be stated on the document. If they're a friend, just pick 'Friend'."
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <FormField
            label="Agent email"
            value={data.agentEmail}
            onChange={(v) => updateData({ agentEmail: v })}
            placeholder="john@email.com"
            type="email"
            tooltip="We'll email your agent a copy of the document along with simple, step-by-step instructions for how to use it when the time comes."
          />
        </div>
      </div>

      <details style={{ marginTop: 20, padding: 16, background: PAPER_2, borderRadius: 8, border: `1px solid ${LINE}` }}>
        <summary style={{ cursor: "pointer", fontSize: 14, fontWeight: 500, color: INK_60, display: "flex", alignItems: "center" }}>
          <span>+ Add an alternate agent (recommended)</span>
          <Tooltip width={300}>
            A backup. If your primary agent isn't available, can't act, or has passed away when you need them, the alternate steps in. Strongly recommended — costs nothing extra and protects you if life gets complicated.
          </Tooltip>
        </summary>
        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormField label="Alternate name" value={data.altAgentName} onChange={(v) => updateData({ altAgentName: v })} placeholder="Optional" />
          <SelectField label="Relationship" value={data.altAgentRelationship} onChange={(v) => updateData({ altAgentRelationship: v })} options={relationships} />
        </div>
      </details>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: INK_40, fontWeight: 600, marginBottom: 12 }}>
      {children}
    </div>
  );
}

/* ============================================
   TOOLTIP — click or hover to reveal plain-English help
   Uses position:fixed so it escapes parent overflow clipping
   without needing react-dom's createPortal.
   ============================================ */
function Tooltip({ children, width = 280 }) {
  const [clickedOpen, setClickedOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [coords, setCoords] = useState(null);
  const buttonRef = useRef(null);
  const visible = clickedOpen || hovering;

  // Compute tooltip position relative to viewport
  useEffect(() => {
    if (visible && buttonRef.current && typeof window !== "undefined") {
      const rect = buttonRef.current.getBoundingClientRect();
      const halfWidth = width / 2;
      const padding = 16;
      let left = rect.left + rect.width / 2;
      const minLeft = padding + halfWidth;
      const maxLeft = window.innerWidth - padding - halfWidth;
      left = Math.max(minLeft, Math.min(maxLeft, left));
      const triggerCenter = rect.left + rect.width / 2;
      setCoords({
        top: rect.top - 10,
        left,
        // Arrow position within the tooltip (in px from left edge of tooltip body)
        arrowLeft: triggerCenter - (left - halfWidth),
      });
    }
  }, [visible, width]);

  // Close click-locked tooltip when user clicks elsewhere
  useEffect(() => {
    if (!clickedOpen) return;
    const handler = (e) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target)) {
        setClickedOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [clickedOpen]);

  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", verticalAlign: "middle" }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setClickedOpen((v) => !v); }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onFocus={() => setHovering(true)}
        onBlur={() => setHovering(false)}
        aria-label="More information"
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 18, height: 18, borderRadius: "50%",
          background: clickedOpen ? INK : PAPER_2,
          color: clickedOpen ? PAPER : INK_60,
          border: `1px solid ${clickedOpen ? INK : LINE_2}`,
          cursor: "help", marginLeft: 6, padding: 0,
          transition: "all 0.15s",
          flexShrink: 0,
        }}
      >
        <HelpCircle size={11} strokeWidth={2.4} />
      </button>
      {visible && coords && (
        <div
          role="tooltip"
          style={{
            position: "fixed",
            top: coords.top, left: coords.left,
            transform: "translate(-50%, -100%)",
            background: INK, color: PAPER,
            padding: "12px 14px", fontSize: 13, lineHeight: 1.55,
            borderRadius: 8, width,
            boxShadow: "0 12px 28px -8px rgba(0,0,0,0.35)",
            fontWeight: 400, fontFamily: SANS,
            zIndex: 1000, pointerEvents: "none",
            textTransform: "none", letterSpacing: 0,
          }}
        >
          {children}
          <span style={{
            position: "absolute", bottom: -4,
            left: `${coords.arrowLeft}px`,
            transform: "translateX(-50%) rotate(45deg)",
            width: 8, height: 8, background: INK,
          }} />
        </div>
      )}
    </span>
  );
}

function FormField({ label, value, onChange, placeholder, type = "text", tooltip, hint }) {
  return (
    <div>
      <label style={{ display: "flex", alignItems: "center", fontSize: 12, fontWeight: 500, color: INK_60, marginBottom: 6 }}>
        <span>{label}</span>
        {tooltip && <Tooltip>{tooltip}</Tooltip>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "10px 12px", fontSize: 14,
          background: PAPER, color: INK,
          border: `1px solid ${LINE}`, borderRadius: 7,
          fontFamily: "inherit", outline: "none",
          transition: "border 0.15s",
        }}
        onFocus={(e) => (e.target.style.borderColor = INK)}
        onBlur={(e) => (e.target.style.borderColor = LINE)}
      />
      {hint && <div style={{ fontSize: 11, color: INK_40, marginTop: 5, lineHeight: 1.4 }}>{hint}</div>}
    </div>
  );
}

function SelectField({ label, value, onChange, options, tooltip }) {
  return (
    <div>
      <label style={{ display: "flex", alignItems: "center", fontSize: 12, fontWeight: 500, color: INK_60, marginBottom: 6 }}>
        <span>{label}</span>
        {tooltip && <Tooltip>{tooltip}</Tooltip>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "10px 12px", fontSize: 14,
          background: PAPER, color: value ? INK : INK_40,
          border: `1px solid ${LINE}`, borderRadius: 7,
          fontFamily: "inherit", outline: "none",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
        }}
      >
        <option value="">Select...</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

/* ============================================
   STEP 3 — Powers
   ============================================ */
function Step3_Powers({ data, updateData }) {
  const powers = [
    { id: "banking",    label: "Banking & financial accounts", desc: "Open, close, transact, sign checks", standard: true,
      tip: "Examples: pay your mortgage and utility bills, write checks from your accounts, deposit Social Security or pension payments, transfer money between accounts, open or close accounts. This is the most-used power." },
    { id: "realestate", label: "Real estate transactions",     desc: "Buy, sell, manage property",         standard: true,
      tip: "Examples: sell your house if you need to move into assisted living, rent out a property, refinance a mortgage, sign closing documents. Required if your agent might handle property for you." },
    { id: "tax",        label: "Tax matters",                  desc: "Including IRS Form 2848 representation", standard: true,
      tip: "Examples: file your tax return, sign tax forms, respond to IRS letters, claim refunds. Without this, your agent can't help you with taxes — even if you're hospitalized in April." },
    { id: "insurance",  label: "Insurance & annuities",        desc: "Policy changes, claim filings, beneficiary updates", standard: true,
      tip: "Examples: file a homeowners or auto insurance claim, update who gets your life insurance, manage your annuity payments." },
    { id: "gifts",      label: "Gifts to others",              desc: "Requires superpowers language under Fla. Stat. § 709.2202(3)", standard: false, warning: true,
      tip: "Examples: give money to your grandchildren, donate to charity, transfer property to family. Florida law requires very specific wording for this power because it can be misused — we add the right wording automatically when you check this box." },
    { id: "business",   label: "Operating a business",         desc: "Run your business, sign contracts, manage payroll", standard: false,
      tip: "Examples: pay your employees, sign vendor contracts, manage your company's bank accounts. Only check this if you own a business that someone else might need to run." },
    { id: "digital",    label: "Digital assets",               desc: "Email, cloud storage, crypto wallets, social accounts", standard: false,
      tip: "Examples: access your email to find important bills, manage your iCloud or Google account, transfer your cryptocurrency, close down old social media. Increasingly important as more of life moves online." },
    { id: "litigation", label: "Pursue litigation",            desc: "File or defend lawsuits on your behalf", standard: false,
      tip: "Examples: hire a lawyer for you, file a claim if someone owes you money, defend you if you're sued. Usually only needed in specific situations." },
  ];

  const toggle = (id) => {
    const current = data.powers || [];
    if (current.includes(id)) {
      updateData({ powers: current.filter((p) => p !== id) });
    } else {
      updateData({ powers: [...current, id] });
    }
  };

  return (
    <div style={{ padding: "40px 48px" }}>
      <h2 style={{ display: "flex", alignItems: "center", fontSize: 32, fontWeight: 600, letterSpacing: "-0.025em", margin: "0 0 8px" }}>
        <span>What powers do you want to grant?</span>
        <Tooltip width={320}>
          Each power below is something specific your agent will be able to do. Only check the powers you actually want to grant. You can always create a new document later to add or remove powers — nothing is permanent.
        </Tooltip>
      </h2>
      <p style={{ fontSize: 15, color: INK_60, margin: "0 0 28px", maxWidth: 580 }}>
        Choose any combination. Florida-specific statutory language is added to your document automatically based on what you select.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {powers.map((p) => {
          const selected = (data.powers || []).includes(p.id);
          return (
            <div
              key={p.id}
              style={{
                display: "flex", alignItems: "flex-start", gap: 14,
                padding: "14px 18px",
                background: selected ? "rgba(37,99,235,0.04)" : PAPER,
                border: `1px solid ${selected ? ACCENT : LINE}`,
                borderRadius: 8,
                transition: "all 0.12s",
              }}
            >
              <button
                type="button"
                onClick={() => toggle(p.id)}
                style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                  background: selected ? ACCENT : PAPER,
                  border: `1.5px solid ${selected ? ACCENT : LINE_2}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginTop: 1, padding: 0, cursor: "pointer",
                }}
              >
                {selected && <Check size={11} strokeWidth={3} color={PAPER} />}
              </button>
              <div style={{ flex: 1, cursor: "pointer" }} onClick={() => toggle(p.id)}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: INK }}>{p.label}</span>
                  {p.standard && (
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", background: PAPER_2, color: INK_60, borderRadius: 4, letterSpacing: "0.04em", textTransform: "uppercase" }}>Standard</span>
                  )}
                  {p.warning && (
                    <span style={{ display: "inline-flex", alignItems: "center", fontSize: 10, fontWeight: 600, padding: "2px 6px", background: "rgba(245,158,11,0.1)", color: "#B45309", borderRadius: 4, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      <span>Superpowers</span>
                      <Tooltip width={300}>
                        "Superpowers" is Florida's nickname for a few sensitive powers — like giving away money — that require extra-specific legal language in the document. We handle the language automatically; you just check the box.
                      </Tooltip>
                    </span>
                  )}
                  <Tooltip width={320}>{p.tip}</Tooltip>
                </div>
                <div style={{ fontSize: 12, color: INK_60, marginTop: 3, lineHeight: 1.4 }}>{p.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================
   STEP 4 — Review + Plan choice
   ============================================ */
function Step4_Review({ data, updateData }) {
  const powerLabels = {
    banking: "Banking & financial accounts",
    realestate: "Real estate transactions",
    tax: "Tax matters",
    insurance: "Insurance & annuities",
    gifts: "Gifts to others",
    business: "Operating a business",
    digital: "Digital assets",
    litigation: "Pursue litigation",
  };
  return (
    <div style={{ padding: "40px 48px" }}>
      <h2 style={{ display: "flex", alignItems: "center", fontSize: 32, fontWeight: 600, letterSpacing: "-0.025em", margin: "0 0 8px" }}>
        <span>Review your power of attorney.</span>
        <Tooltip width={320}>
          This is your last chance to make changes before payment. After payment you'll get the full document — and you can still edit it before scheduling the notary, who has to be present for the official signing.
        </Tooltip>
      </h2>
      <p style={{ fontSize: 15, color: INK_60, margin: "0 0 28px", maxWidth: 580 }}>
        We've assembled your document. You'll be able to edit it after payment but before notarization.
      </p>

      {/* Document preview with blur effect */}
      <div style={{ position: "relative", marginBottom: 28, border: `1px solid ${LINE}`, borderRadius: 12, overflow: "hidden", background: PAPER_2 }}>
        <div style={{ padding: "24px 28px" }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: INK_40, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center" }}>
            <span>Document preview — page 1 of 6</span>
            <Tooltip width={300}>
              This is just the opening of your document so you can see what it looks like. The full document is six pages of legally-required language. You'll get the entire thing in PDF form after payment.
            </Tooltip>
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, textAlign: "center", marginBottom: 16, letterSpacing: "0.02em" }}>
            DURABLE POWER OF ATTORNEY
          </div>
          <div style={{ fontSize: 11, textAlign: "center", color: INK_60, marginBottom: 20, fontStyle: "italic" }}>
            Pursuant to Fla. Stat. § 709.2101 et seq.
          </div>
          <div style={{ fontSize: 12, color: INK_60, lineHeight: 1.7, filter: "blur(0px)" }}>
            <p style={{ margin: "0 0 12px" }}>
              I, <strong style={{ color: INK }}>{data.principalName || "[Principal Name]"}</strong>, residing at {data.principalAddress || "[address]"}, born {data.principalDob || "[DOB]"}, do hereby appoint <strong style={{ color: INK }}>{data.agentName || "[Agent Name]"}</strong>, my {data.agentRelationship?.toLowerCase() || "[relationship]"}, as my true and lawful attorney-in-fact ("Agent") to act for me and in my name…
            </p>
            <p style={{ margin: "0 0 12px" }}>
              <strong style={{ color: INK }}>Powers granted.</strong> My Agent shall have full power and authority to act with respect to the following matters:
            </p>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {(data.powers || []).slice(0, 3).map((p) => <li key={p}>{powerLabels[p]};</li>)}
              {(data.powers || []).length > 3 && <li style={{ color: INK_40 }}>+ {data.powers.length - 3} more provisions…</li>}
            </ul>
          </div>
        </div>
        {/* Locked overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(250,250,250,0) 60%, rgba(250,250,250,0.95) 95%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 14px", background: INK, color: PAPER, borderRadius: 100,
          fontSize: 12, fontWeight: 500,
        }}>
          <Lock size={12} strokeWidth={2} /> Unlock full document after payment
        </div>
      </div>

      {/* Plan upsell */}
      <SectionLabel>
        <span style={{ display: "inline-flex", alignItems: "center" }}>
          <span>Choose your plan</span>
          <Tooltip width={320}>
            "Single POA" gives you just this one document. "Full plan" gives you the four documents most people should have together — financial POA, healthcare POA, HIPAA authorization (lets doctors share your information with your agent), and an advance directive (your end-of-life wishes).
          </Tooltip>
        </span>
      </SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <PlanCard
          id="single"
          selected={data.plan === "single"}
          onSelect={() => updateData({ plan: "single" })}
          title="Single POA"
          price="$79"
          desc="This one document, state-specific, ready in eleven minutes."
          features={["Decision tree wizard","Encrypted PDF download","30-day free updates","Notary scheduling included"]}
        />
        <PlanCard
          id="full"
          selected={data.plan === "full"}
          onSelect={() => updateData({ plan: "full" })}
          title="Full plan"
          price="$179"
          badge="Most chosen"
          desc="The four documents everyone over 30 should have. Bundled."
          features={["Financial + Healthcare POA","HIPAA authorization","Advance directive","12 months vault storage"]}
          highlighted
        />
      </div>
    </div>
  );
}

function PlanCard({ id, selected, onSelect, title, price, badge, desc, features, highlighted }) {
  return (
    <button
      onClick={onSelect}
      style={{
        padding: 22, textAlign: "left",
        background: selected ? INK : PAPER,
        color: selected ? PAPER : INK,
        border: `2px solid ${selected ? INK : LINE}`,
        borderRadius: 10,
        transition: "all 0.15s",
        display: "flex", flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{title}</div>
          {badge && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: "3px 8px",
              background: selected ? "rgba(255,255,255,0.15)" : "rgba(37,99,235,0.1)",
              color: selected ? PAPER : ACCENT,
              borderRadius: 4, letterSpacing: "0.04em", textTransform: "uppercase",
            }}>{badge}</span>
          )}
        </div>
        <div className="num" style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>{price}</div>
      </div>
      <div style={{ fontSize: 13, color: selected ? "rgba(255,255,255,0.72)" : INK_60, marginBottom: 14, lineHeight: 1.45 }}>{desc}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: "auto" }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <Check size={12} strokeWidth={2.4} color={selected ? ACCENT : INK} style={{ flexShrink: 0 }} />
            <span>{f}</span>
          </div>
        ))}
      </div>
    </button>
  );
}

/* ============================================
   PAYMENT SCREEN — Stripe-style
   ============================================ */
function PaymentScreen({ data, processing, setProcessing, onSuccess, onBack }) {
  const price = data.plan === "full" ? 179 : 79;
  const productName = data.plan === "full" ? "Full plan (4 documents)" : "Single POA (Durable Financial)";

  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [zip, setZip] = useState("");

  const cardBrand = detectCardBrand(card);
  const valid = card.replace(/\s/g, "").length >= 15 && exp.length === 5 && cvc.length >= 3 && zip.length >= 5;

  const handlePay = () => {
    if (!valid || processing) return;
    setProcessing(true);
    // Simulate Stripe API roundtrip
    setTimeout(() => {
      setProcessing(false);
      onSuccess();
    }, 2400);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 560 }}>
      {/* Left — order summary */}
      <div style={{ background: PAPER_2, padding: "40px 40px", borderRight: `1px solid ${LINE}` }}>
        <button onClick={onBack} style={{ fontSize: 13, color: INK_60, marginBottom: 24, display: "inline-flex", alignItems: "center", gap: 6 }}>
          ← Back to review
        </button>

        <div className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: INK_40, fontWeight: 600, marginBottom: 8 }}>
          Pay POA-IT
        </div>
        <div className="num" style={{ fontSize: 44, fontWeight: 600, letterSpacing: "-0.035em", marginBottom: 32 }}>
          ${price}.00
        </div>

        <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{productName}</div>
              <div style={{ fontSize: 12, color: INK_40, marginTop: 2 }}>Florida · {data.agentName || "Agent"} as attorney-in-fact</div>
            </div>
            <div className="num" style={{ fontSize: 14, fontWeight: 500 }}>${price}.00</div>
          </div>
          <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontSize: 13, color: INK_60 }}>Subtotal</div>
            <div className="num" style={{ fontSize: 13 }}>${price}.00</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <div style={{ fontSize: 13, color: INK_60 }}>Sales tax</div>
            <div className="num" style={{ fontSize: 13 }}>$0.00</div>
          </div>
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${LINE}`, display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Total due today</div>
            <div className="num" style={{ fontSize: 16, fontWeight: 600 }}>${price}.00</div>
          </div>
        </div>

        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
          {["Document delivered immediately","RON notary scheduled within 24 hours","Encrypted vault storage included","30-day refund if not yet notarized"].map((b, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: INK_60 }}>
              <Check size={12} strokeWidth={2.4} color={LIVE_GREEN} style={{ marginTop: 4, flexShrink: 0 }} />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Right — card form */}
      <div style={{ padding: "40px 40px", display: "flex", flexDirection: "column" }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: INK_40, fontWeight: 600, marginBottom: 8 }}>
          Card details
        </div>
        <p style={{ fontSize: 12, color: INK_40, margin: "0 0 24px" }}>
          Demo mode — use any test number like <span className="mono">4242 4242 4242 4242</span>
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <CardNumberField value={card} onChange={setCard} brand={cardBrand} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <ExpiryField value={exp} onChange={setExp} />
            <CvcField value={cvc} onChange={setCvc} />
          </div>
          <FormField
            label="Billing ZIP"
            value={zip}
            onChange={(v) => setZip(v.slice(0, 10))}
            placeholder="33101"
            tooltip="The ZIP code where your card statements are mailed. Your bank uses this as an additional security check to confirm it's really you."
          />
        </div>

        <button
          onClick={handlePay}
          disabled={!valid || processing}
          style={{
            marginTop: 24, padding: "16px 22px", fontSize: 15, fontWeight: 600,
            background: valid && !processing ? INK : INK_20,
            color: PAPER, borderRadius: 8,
            cursor: valid && !processing ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            transition: "all 0.15s",
          }}
        >
          {processing ? (
            <>
              <Spinner /> Processing…
            </>
          ) : (
            <>
              <Lock size={14} strokeWidth={2} /> Pay ${price}.00
            </>
          )}
        </button>

        <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 11, color: INK_40 }}>
          <Lock size={11} strokeWidth={2} /> Powered by Stripe · PCI DSS Level 1
          <Tooltip width={300}>
            Stripe is the company millions of businesses use to safely process credit card payments — including Amazon, Target, and most major airlines. PCI DSS Level 1 is the highest security standard for payment processing. Your card information is encrypted; POA-IT never sees it.
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span style={{
      display: "inline-block", width: 14, height: 14,
      border: `2px solid rgba(255,255,255,0.3)`, borderTop: `2px solid ${PAPER}`,
      borderRadius: "50%", animation: "spin 0.8s linear infinite",
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}

function detectCardBrand(num) {
  const n = num.replace(/\s/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^6/.test(n)) return "Discover";
  return "";
}

function CardNumberField({ value, onChange, brand }) {
  const handleChange = (e) => {
    let v = e.target.value.replace(/\s/g, "").replace(/\D/g, "").slice(0, 16);
    v = v.replace(/(.{4})/g, "$1 ").trim();
    onChange(v);
  };
  return (
    <div>
      <label style={{ display: "flex", alignItems: "center", fontSize: 12, fontWeight: 500, color: INK_60, marginBottom: 6 }}>
        <span>Card number</span>
        <Tooltip width={280}>
          The 16-digit number printed on the front of your credit or debit card. American Express cards have 15 digits. We never see or store this number — it goes straight to Stripe, our payment processor.
        </Tooltip>
      </label>
      <div style={{ position: "relative" }}>
        <input
          value={value}
          onChange={handleChange}
          placeholder="1234 1234 1234 1234"
          className="mono"
          style={{
            width: "100%", padding: "10px 12px", fontSize: 14,
            background: PAPER, color: INK,
            border: `1px solid ${LINE}`, borderRadius: 7,
            fontFamily: MONO, outline: "none", letterSpacing: "0.02em",
          }}
          onFocus={(e) => (e.target.style.borderColor = INK)}
          onBlur={(e) => (e.target.style.borderColor = LINE)}
        />
        {brand && (
          <span className="mono" style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            fontSize: 10, fontWeight: 600, padding: "3px 7px",
            background: PAPER_2, color: INK_60, borderRadius: 4, letterSpacing: "0.04em",
          }}>{brand.toUpperCase()}</span>
        )}
      </div>
    </div>
  );
}

function ExpiryField({ value, onChange }) {
  const handleChange = (e) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`;
    onChange(v);
  };
  return (
    <div>
      <label style={{ display: "flex", alignItems: "center", fontSize: 12, fontWeight: 500, color: INK_60, marginBottom: 6 }}>
        <span>Expiry</span>
        <Tooltip width={260}>
          The month and year your card expires, printed on the front of your card. Enter just the digits — we'll add the slash for you. Example: "0728" becomes 07/28.
        </Tooltip>
      </label>
      <input
        value={value}
        onChange={handleChange}
        placeholder="MM/YY"
        className="mono"
        style={{
          width: "100%", padding: "10px 12px", fontSize: 14,
          background: PAPER, color: INK,
          border: `1px solid ${LINE}`, borderRadius: 7,
          fontFamily: MONO, outline: "none",
        }}
        onFocus={(e) => (e.target.style.borderColor = INK)}
        onBlur={(e) => (e.target.style.borderColor = LINE)}
      />
    </div>
  );
}

function CvcField({ value, onChange }) {
  return (
    <div>
      <label style={{ display: "flex", alignItems: "center", fontSize: 12, fontWeight: 500, color: INK_60, marginBottom: 6 }}>
        <span>CVC</span>
        <Tooltip width={300}>
          A short security code — usually three digits — printed on the BACK of your card, just above or below the signature line. American Express puts it on the FRONT and uses four digits. It proves you have the physical card in hand.
        </Tooltip>
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
        placeholder="123"
        className="mono"
        style={{
          width: "100%", padding: "10px 12px", fontSize: 14,
          background: PAPER, color: INK,
          border: `1px solid ${LINE}`, borderRadius: 7,
          fontFamily: MONO, outline: "none",
        }}
        onFocus={(e) => (e.target.style.borderColor = INK)}
        onBlur={(e) => (e.target.style.borderColor = LINE)}
      />
    </div>
  );
}

/* ============================================
   SUCCESS SCREEN
   ============================================ */
function SuccessScreen({ data, onClose }) {
  return (
    <div style={{ padding: "48px 48px 40px", textAlign: "center" }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: LIVE_GREEN, color: PAPER,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 24px",
        boxShadow: `0 0 0 8px rgba(16,185,129,0.15)`,
      }}>
        <Check size={36} strokeWidth={2.5} />
      </div>

      <h2 style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.025em", margin: "0 0 8px" }}>
        Payment received.
      </h2>
      <p style={{ fontSize: 15, color: INK_60, margin: "0 0 32px", maxWidth: 460, marginLeft: "auto", marginRight: "auto" }}>
        Your Florida durable power of attorney has been generated and emailed to <strong style={{ color: INK }}>{data.agentEmail || "you"}</strong>. Next step is notarization, scheduled below.
      </p>

      {/* Document card */}
      <div style={{
        background: PAPER_2, border: `1px solid ${LINE}`, borderRadius: 10,
        padding: 20, marginBottom: 16, display: "flex", alignItems: "center", gap: 16, textAlign: "left",
      }}>
        <div style={{ width: 44, height: 56, background: PAPER, border: `1px solid ${LINE_2}`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <FileText size={20} strokeWidth={1.6} color={INK_60} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Durable POA — {data.principalName || "Your Name"}</div>
          <div className="mono" style={{ fontSize: 11, color: INK_40, marginTop: 2 }}>florida_durable_poa_{Date.now().toString().slice(-6)}.pdf · 6 pages</div>
        </div>
        <button style={{
          padding: "8px 14px", fontSize: 13, fontWeight: 500,
          background: INK, color: PAPER, borderRadius: 6,
          display: "inline-flex", alignItems: "center", gap: 6,
        }}>
          Download
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        <button style={{
          padding: "14px 18px", fontSize: 14, fontWeight: 500,
          background: ACCENT, color: PAPER, borderRadius: 8,
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          Schedule notary now <ArrowRight size={14} strokeWidth={2} />
        </button>
        <button onClick={onClose} style={{
          padding: "14px 18px", fontSize: 14, fontWeight: 500,
          background: PAPER, color: INK, border: `1px solid ${LINE_2}`, borderRadius: 8,
        }}>
          Finish later
        </button>
      </div>

      <div className="mono" style={{ fontSize: 10, color: INK_40, letterSpacing: "0.04em" }}>
        Receipt sent to your email · order #PI-{Date.now().toString().slice(-7)}
      </div>
    </div>
  );
}
