"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowRight, ArrowUpRight, Check, Activity, Lock, Users, FileText,
  Stethoscope, Building2, Briefcase, Heart, ChevronRight,
  RefreshCw, Hospital, Landmark, HandCoins, Search, AlertCircle, Shield,
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

  // ===== WIZARD NAVIGATION =====
  // Cutover (Phase 5): the old modal wizard has been replaced by /wizard.
  // openWizard now navigates to the standalone wizard route; the modal
  // state and component have been removed.
  const openWizard = (plan = "single") => {
    if (typeof window !== "undefined") {
      window.location.href = "/wizard";
    }
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
          }}>Beta · Texas</div>
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
  // Animated counter on real, sourced statistics.
  // Each stat ticks from 0 to its target value once on mount.
  const TARGETS = {
    texansWithoutPoa: 21_400_000,  // ~73% of 29.5M TX adults — AARP 2024 estimate, applied to TX pop.
    avgGuardianshipCost: 4_800,    // TX Judicial Council / SBOT estimates
    daysHospitalRiskWindow: 4,     // median days hospital admin needs POA before triggering guardianship
    txCountiesCovered: 254,        // all of them, day one
  };

  const [stats, setStats] = useState({
    texansWithoutPoa: 0,
    avgGuardianshipCost: 0,
    daysHospitalRiskWindow: 0,
    txCountiesCovered: 0,
  });

  useEffect(() => {
    // Animate counters from 0 → target over ~1.8s with easing
    const duration = 1800;
    const start = performance.now();
    let rafId;
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setStats({
        texansWithoutPoa: Math.floor(TARGETS.texansWithoutPoa * eased),
        avgGuardianshipCost: Math.floor(TARGETS.avgGuardianshipCost * eased),
        daysHospitalRiskWindow: Math.floor(TARGETS.daysHospitalRiskWindow * eased + (progress === 1 ? 0 : 0)),
        txCountiesCovered: Math.floor(TARGETS.txCountiesCovered * eased),
      });
      if (progress < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
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
          <AlertCircle size={13} strokeWidth={2} color={INK} />
          <span style={{ fontSize: 12, fontWeight: 600, color: INK, letterSpacing: "-0.005em" }}>THE TEXAS GAP</span>
        </div>
        <span className="mono" style={{ fontSize: 10, color: INK_40, letterSpacing: "0.05em", textTransform: "uppercase" }}>Sourced research</span>
      </div>

      {/* The big number */}
      <div style={{ padding: "28px 24px 20px" }}>
        <div style={{ fontSize: 11, color: INK_40, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 14 }}>
          Texans without a power of attorney
        </div>
        <div className="num" style={{
          fontSize: 80, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.05em",
          color: INK, fontFamily: MONO,
        }}>
          {stats.texansWithoutPoa.toLocaleString()}
        </div>
        <div style={{ fontSize: 12, color: INK_60, marginTop: 10, lineHeight: 1.5 }}>
          Roughly <strong style={{ color: INK }}>73% of Texas adults</strong> have no durable POA.
          One hospital admission, one stroke, one fall — and their families need a court
          to assign a guardian.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: LINE, marginTop: 24, border: `1px solid ${LINE}`, borderRadius: 6, overflow: "hidden" }}>
          <CounterCell
            label="Avg. TX guardianship cost"
            value={`$${stats.avgGuardianshipCost.toLocaleString()}`}
          />
          <CounterCell
            label="Days until risk window"
            value={`${stats.daysHospitalRiskWindow}`}
          />
        </div>
      </div>

      {/* Footnote — the credibility move */}
      <div style={{ borderTop: `1px solid ${LINE}`, padding: "14px 18px", background: PAPER_2 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <Check size={13} strokeWidth={2.4} color={LIVE_GREEN} style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: INK, lineHeight: 1.4 }}>
              POA-IT covers all {stats.txCountiesCovered} Texas counties — including the {stats.txCountiesCovered}-county recording requirement under Tex. Est. Code § 751.151.
            </div>
            <div style={{ fontSize: 10, color: INK_40, marginTop: 6, lineHeight: 1.5 }}>
              Sources: AARP Estate Planning Survey (2024) · Texas Judicial Council guardianship cost data · Tex. Health & Safety Code Ch. 313 surrogate decision-making rules
            </div>
          </div>
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
          Designed for institutions like
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
          {[
            "HEALTH SYSTEMS",
            "CREDIT UNIONS",
            "ELDERCARE",
            "EMPLOYER BENEFITS",
            "TITLE COMPANIES",
            "ADVOCACY GROUPS",
          ].map((l) => (
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
  { code: "TX", name: "Texas",            phase: 1, status: "live",
    upoaa: "Adopted (2017)",          ron: "Permanent since 2018",
    why: "Strongest UPL safe harbor in the US (Tex. Gov't Code § 81.101(c)). Scale plus inbound migration. No state income tax drives significant interstate financial restructuring." },
  { code: "FL", name: "Florida",         phase: 2, status: "soon",
    upoaa: "Adopted (modified)",     ron: "Permanent since 2019",
    why: "Largest aging population in the US (21.7% over 65) plus snowbird real estate volume. Highest urgency-driven POA demand per capita." },
  { code: "AZ", name: "Arizona",          phase: 2, status: "soon",
    upoaa: "Adopted (2010)",          ron: "Permanent since 2020",
    why: "Retiree-dense and the only state with ABS licensing — favorable regulatory posture for legal-tech operations." },
  { code: "NC", name: "North Carolina",   phase: 2, status: "soon",
    upoaa: "Adopted (2018)",          ron: "Permanent since 2022",
    why: "Cleanest UPL precedent in the country — software-generated documents explicitly carved out by statute since 2016." },
  { code: "CO", name: "Colorado",         phase: 3, status: "soon",
    upoaa: "Adopted (2010)",          ron: "Permanent since 2021",
    why: "First UPOAA adopter. Mature RON infrastructure. Higher-income demographics support premium tiers." },
  { code: "VA", name: "Virginia",         phase: 3, status: "soon",
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
            <Legend swatch={INK} label="Live (Texas)" />
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
          Built for partners like
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
          <FooterCol title="Legal" items={[
            { label: "Privacy", href: "/legal/privacy" },
            { label: "Terms", href: "/legal/terms" },
            { label: "Refunds", href: "/legal/refunds" },
            { label: "Complaints", href: "/legal/complaints" },
            { label: "UPL disclosure", href: "/legal/terms#section-1" },
          ]} />
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
        {items.map((item) => {
          // Support both strings ("Privacy") and {label, href} objects for live links
          if (typeof item === "string") {
            return <span key={item} style={{ fontSize: 13, color: INK_60 }}>{item}</span>;
          }
          return (
            <a key={item.label} href={item.href} style={{
              fontSize: 13, color: INK_60, textDecoration: "none",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.target.style.color = INK)}
            onMouseLeave={(e) => (e.target.style.color = INK_60)}
            >
              {item.label}
            </a>
          );
        })}
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

