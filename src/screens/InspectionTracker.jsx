// Requires fh_inspections table in Supabase.
// SQL is in the project README or run manually by the user.

import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { T, SP, R, FS, LS, MO, FF } from "../ui/tokens";
import { Card, Btn, Pill, Stat, SectionHeader, EmptyState } from "../ui/primitives";
import Icon from "../components/Icon";

const GOLD = T.gold;
const GREEN = T.green;
const RED = T.red;
const AMBER = T.amber;

const uid = () => Math.random().toString(36).slice(2, 10);
const iso = () => new Date().toISOString();
const today = () => new Date().toISOString().split("T")[0];

// ─── TRADE CHECKPOINTS ────────────────────────────────────
const TRADE_DEFS = {
  CONCRETE: {
    label: "Concrete",
    icon: "layers",
    checkpoints: [
      { label: "Site layout per plans", critical: false },
      { label: "Excavation depth correct", critical: false },
      { label: "Sub-base compacted", critical: false },
      { label: "Formwork plumb and braced", critical: false },
      { label: "Rebar placement", critical: true },
      { label: "Rebar chairs / spacing", critical: false },
      { label: "Vapor barrier installed", critical: false },
      { label: "Embeds / sleeves in place", critical: false },
      { label: "Slump test recorded", critical: false },
      { label: "Concrete mix verified", critical: false },
      { label: "Finish quality acceptable", critical: false },
      { label: "Curing plan confirmed", critical: false },
    ],
  },
  FRAMING: {
    label: "Framing",
    icon: "hammer",
    checkpoints: [
      { label: "Sill plate anchor bolts", critical: true },
      { label: "Stud spacing per plans", critical: false },
      { label: "Header sizing correct", critical: false },
      { label: "Wall plumb and square", critical: false },
      { label: "Floor joists sized / spaced", critical: false },
      { label: "Ceiling joists installed", critical: false },
      { label: "Roof rafters / trusses", critical: false },
      { label: "Sheathing nailing pattern", critical: false },
      { label: "Fire blocking installed", critical: true },
      { label: "Hurricane ties / straps", critical: false },
      { label: "Openings framed correctly", critical: false },
      { label: "Structural hardware installed", critical: false },
    ],
  },
  ROOFING: {
    label: "Roofing",
    icon: "home",
    checkpoints: [
      { label: "Decking condition / nailing", critical: false },
      { label: "Ice and water shield", critical: false },
      { label: "Underlayment installed", critical: false },
      { label: "Drip edge in place", critical: false },
      { label: "Starter course correct", critical: false },
      { label: "Shingle pattern / exposure", critical: false },
      { label: "Valley flashing", critical: true },
      { label: "Step flashing at walls", critical: true },
      { label: "Pipe boots sealed", critical: false },
      { label: "Ridge vent installed", critical: false },
      { label: "Nailing pattern correct", critical: false },
      { label: "Clean up complete", critical: false },
    ],
  },
  ELECTRICAL: {
    label: "Electrical",
    icon: "bolt",
    checkpoints: [
      { label: "Service entrance conductors", critical: true },
      { label: "Panel grounding / bonding", critical: true },
      { label: "Circuit breaker sizing", critical: false },
      { label: "Wire gauge per circuit", critical: false },
      { label: "Box fill calculations", critical: false },
      { label: "Device box securing", critical: false },
      { label: "GFCI locations correct", critical: true },
      { label: "AFCI protection", critical: false },
      { label: "Smoke / CO detectors", critical: true },
      { label: "Wire staples and supports", critical: false },
      { label: "Cable entries sealed", critical: false },
      { label: "Labeling on panel", critical: false },
    ],
  },
  PLUMBING: {
    label: "Plumbing",
    icon: "wrench",
    checkpoints: [
      { label: "Supply pipe sizing", critical: false },
      { label: "DWV slope / sizing", critical: false },
      { label: "Vent stack pipe in place", critical: false },
      { label: "Pressure test passed", critical: true },
      { label: "Shut-offs on fixtures", critical: false },
      { label: "Water heater TPR valve", critical: true },
      { label: "Water heater venting", critical: true },
      { label: "Backflow prevention", critical: false },
      { label: "Cleanouts accessible", critical: false },
      { label: "Dielectric unions used", critical: false },
      { label: "Traps on all fixtures", critical: false },
      { label: "Drain test completed", critical: false },
    ],
  },
  HVAC: {
    label: "HVAC",
    icon: "cloudSnow",
    checkpoints: [
      { label: "Equipment sizing / Manual J", critical: false },
      { label: "Duct sizing per plans", critical: false },
      { label: "Duct sealing / mastic", critical: false },
      { label: "Register locations correct", critical: false },
      { label: "Refrigerant line set", critical: false },
      { label: "Condensate drain pitched", critical: false },
      { label: "Thermostat wired", critical: false },
      { label: "Combustion air provisions", critical: true },
      { label: "Flue / venting correct", critical: true },
      { label: "Gas line pressure test", critical: true },
      { label: "Disconnect within sight", critical: false },
      { label: "Equipment labeled", critical: false },
    ],
  },
  INSULATION: {
    label: "Insulation",
    icon: "shield",
    checkpoints: [
      { label: "R-value meets code", critical: false },
      { label: "Wall cavities filled", critical: false },
      { label: "Attic coverage uniform", critical: false },
      { label: "Rim joists insulated", critical: false },
      { label: "Vapor retarder correct", critical: false },
      { label: "Baffles at soffit vents", critical: false },
      { label: "No gaps or voids", critical: false },
      { label: "Air sealing complete", critical: false },
      { label: "Can lights IC-rated", critical: true },
      { label: "Ducts insulated", critical: false },
      { label: "Pipes in cold walls insulated", critical: false },
      { label: "Blower door prep", critical: false },
    ],
  },
  DRYWALL: {
    label: "Drywall",
    icon: "ruler",
    checkpoints: [
      { label: "Proper thickness per area", critical: false },
      { label: "Screw / nail pattern", critical: false },
      { label: "Moisture-resistant in wet areas", critical: false },
      { label: "Type X at garage / fire walls", critical: true },
      { label: "Seams staggered", critical: false },
      { label: "Corners square", critical: false },
      { label: "Outlet cutouts clean", critical: false },
      { label: "Tape and mud level 4+", critical: false },
      { label: "Sanding quality", critical: false },
      { label: "Joints bridged properly", critical: false },
      { label: "Ceiling sag / pop checked", critical: false },
      { label: "Ready for primer", critical: false },
    ],
  },
};

const TRADE_KEYS = Object.keys(TRADE_DEFS);

const newInspection = (trade) => ({
  id: uid(),
  trade,
  jobName: "",
  siteAddress: "",
  inspectionType: "",
  inspector: { name: "", phone: "", badge: "" },
  scheduledDate: today(),
  scheduledTime: "",
  checkpoints: (TRADE_DEFS[trade]?.checkpoints || []).map((cp) => ({
    id: uid(),
    label: cp.label,
    critical: cp.critical,
    status: null,
    notes: "",
  })),
  photos: [],
  finalResult: null,
  reInspection: { needed: false, date: "", notes: "" },
  inspectorNotes: "",
  contractorNotes: "",
  history: [],
  createdAt: iso(),
  updatedAt: iso(),
});

// ─── STYLES ───────────────────────────────────────────────
// All values pulled from src/ui/tokens.js — same system as the rest of the app.
const s = {
  wrap: { padding: `${SP[5]}px ${SP[5]}px ${SP[2]}px` },
  card: {
    background: T.bgCard,
    borderRadius: R.lg,
    border: `1px solid ${T.border}`,
    padding: SP[4],
    marginBottom: SP[4],
  },
  label: {
    fontSize: FS.meta - 1,
    fontWeight: 700,
    color: T.textMuted,
    textTransform: "uppercase",
    letterSpacing: LS.uppercase,
    marginBottom: SP[2],
  },
  input: {
    width: "100%",
    padding: `${SP[3]}px ${SP[3]+1}px`,
    borderRadius: R.md,
    border: `1px solid ${T.border}`,
    background: T.bgSection,
    color: T.text,
    fontSize: FS.body,
    fontFamily: FF.sans,
    boxSizing: "border-box",
    outline: "none",
    transition: `border-color ${MO.fast}`,
  },
  btn: (gold) => ({
    padding: `${SP[3]}px ${SP[5]-2}px`,
    borderRadius: R.md,
    border: gold ? "none" : `1px solid ${T.border}`,
    background: gold ? T.gold : T.bgSection,
    color: gold ? "#141414" : T.text,
    fontWeight: gold ? 700 : 600,
    fontSize: FS.ui,
    cursor: "pointer",
    fontFamily: FF.sans,
    letterSpacing: LS.normal,
    transition: `transform ${MO.fast}`,
  }),
  smallBtn: {
    padding: `${SP[1]+2}px ${SP[2]+2}px`,
    borderRadius: R.sm,
    border: `1px solid ${T.border}`,
    background: T.bgSection,
    color: T.text,
    fontSize: FS.meta,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: FF.sans,
  },
  chip: (active, color) => ({
    padding: `${SP[2]}px ${SP[3]+1}px`,
    borderRadius: R.full,
    border: `1px solid ${active ? color || T.gold : T.border}`,
    background: active ? (color ? color + "22" : T.goldBg) : "transparent",
    color: active ? color || T.gold : T.textSecondary,
    fontWeight: 600,
    fontSize: FS.meta,
    cursor: "pointer",
    fontFamily: FF.sans,
    textTransform: "uppercase",
    letterSpacing: LS.label,
    whiteSpace: "nowrap",
    transition: `all ${MO.fast}`,
  }),
  stat: {
    background: T.bgCard,
    border: `1px solid ${T.border}`,
    borderRadius: R.md,
    padding: `${SP[3]}px ${SP[3]+1}px`,
    textAlign: "center",
  },
  statLabel: {
    fontSize: FS.meta - 2,
    color: T.textMuted,
    fontWeight: 700,
    letterSpacing: LS.uppercase,
    textTransform: "uppercase",
  },
  statVal: {
    fontSize: FS.h2,
    fontWeight: 700,
    color: T.text,
    marginTop: SP[1] + 1,
    fontFamily: FF.sans,
    letterSpacing: LS.tight,
    lineHeight: 1.1,
  },
};

// ─── MAIN COMPONENT ───────────────────────────────────────
export default function InspectionTracker({ currentUser }) {
  const [inspections, setInspections] = useState([]);
  const [rowId, setRowId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [savingStatus, setSavingStatus] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [tradeFilter, setTradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const saveTimer = useRef(null);
  const skipNextSave = useRef(false);
  // Guard against undefined currentUser prop
  const user = currentUser || { name: "Jesse", company: "Parker Construction Co.", role: "owner", id: "fallback" };
  const userName = user.name;

  // Load — with safety timeout so the screen never hangs.
  useEffect(() => {
    let resolved = false;
    const finish = (err) => {
      if (resolved) return;
      resolved = true;
      if (err) setLoadError(err);
      setLoading(false);
    };

    const timeout = setTimeout(() => {
      if (!resolved) {
        console.error("[InspectionTracker] load timed out after 10s — Supabase may be unreachable");
        finish("Connection timed out. Check Supabase configuration.");
      }
    }, 10000);

    (async () => {
      try {
        console.log("[InspectionTracker] querying fh_inspections…");
        const { data, error } = await supabase
          .from("fh_inspections")
          .select("*")
          .eq("owner", userName)
          .order("updated_at", { ascending: false })
          .limit(1);
        if (error) {
          console.error("[InspectionTracker] query error:", error.message, error.code, error.hint);
          finish(`Database error: ${error.message}${error.hint ? " — " + error.hint : ""}`);
          clearTimeout(timeout);
          return;
        }
        console.log("[InspectionTracker] query OK, rows:", data?.length);
        if (data && data.length > 0) {
          setRowId(data[0].id);
          const arr = Array.isArray(data[0].inspection_data) ? data[0].inspection_data : [];
          skipNextSave.current = true;
          setInspections(arr);
        } else {
          console.log("[InspectionTracker] no rows — inserting initial empty row");
          const { data: inserted, error: insErr } = await supabase
            .from("fh_inspections")
            .insert({
              inspection_data: [],
              updated_at: iso(),
              updated_by: userName,
              owner: userName,
            })
            .select()
            .single();
          if (insErr) {
            console.error("[InspectionTracker] insert error:", insErr.message, insErr.code);
          } else if (inserted) {
            console.log("[InspectionTracker] created initial row", inserted.id);
            setRowId(inserted.id);
          }
        }
        finish(null);
      } catch (e) {
        console.error("[InspectionTracker] load exception:", e);
        finish(`Unexpected error: ${e?.message || "unknown"}`);
      }
      clearTimeout(timeout);
    })();

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime — wrapped in try/catch so a broken subscription
  // doesn't crash the whole component.
  useEffect(() => {
    let channel;
    try {
      channel = supabase
        .channel("fh_inspections_sync")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "fh_inspections", filter: `owner=eq.${userName}` },
          (payload) => {
            const newRow = payload.new;
            if (!newRow) return;
            if (newRow.owner !== userName) return;
            if (newRow.updated_by === userName) return;
            const arr = Array.isArray(newRow.inspection_data) ? newRow.inspection_data : [];
            skipNextSave.current = true;
            setInspections(arr);
            setRowId(newRow.id);
          }
        )
        .subscribe();
    } catch (e) {
      console.error("[InspectionTracker] realtime channel error:", e);
    }
    return () => {
      if (channel) {
        try { supabase.removeChannel(channel); } catch { /* cleanup */ }
      }
    };
  }, [userName]);

  // Debounced save
  useEffect(() => {
    if (loading) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSavingStatus("saving…");
    saveTimer.current = setTimeout(async () => {
      try {
        if (rowId) {
          const { error } = await supabase
            .from("fh_inspections")
            .update({
              inspection_data: inspections,
              updated_at: iso(),
              updated_by: userName,
            })
            .eq("id", rowId);
          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from("fh_inspections")
            .insert({
              inspection_data: inspections,
              updated_at: iso(),
              updated_by: userName,
              owner: userName,
            })
            .select()
            .single();
          if (error) throw error;
          if (data) setRowId(data.id);
        }
        setSavingStatus("saved");
        setTimeout(() => setSavingStatus(""), 1200);
      } catch (e) {
        console.warn("InspectionTracker save error", e);
        setSavingStatus("error");
      }
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [inspections, rowId, loading, userName]);

  const addHistory = (insp, action) => ({
    ...insp,
    history: [...(insp.history || []), { action, by: userName, at: iso() }],
    updatedAt: iso(),
  });

  const updateInspection = (id, patch, historyAction) => {
    setInspections((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        let next = { ...i, ...patch, updatedAt: iso() };
        if (historyAction) next = addHistory(next, historyAction);
        return next;
      })
    );
  };

  const createInspection = (trade) => {
    const insp = addHistory(newInspection(trade), "Created inspection");
    setInspections((prev) => [insp, ...prev]);
    setSelectedId(insp.id);
  };

  const deleteInspection = (id) => {
    if (!window.confirm("Delete this inspection?")) return;
    setInspections((prev) => prev.filter((i) => i.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const selected = inspections.find((i) => i.id === selectedId);

  // Dashboard stats
  const totals = {
    total: inspections.length,
    pass: inspections.filter((i) => i.finalResult === "pass").length,
    fail: inspections.filter((i) => i.finalResult === "fail").length,
    pendingRe: inspections.filter((i) => i.reInspection?.needed).length,
  };

  // Filtered list
  const filtered = inspections.filter((i) => {
    if (tradeFilter !== "all" && i.trade !== tradeFilter) return false;
    if (statusFilter !== "all") {
      if (statusFilter === "pending" && i.finalResult !== null) return false;
      if (statusFilter === "pass" && i.finalResult !== "pass") return false;
      if (statusFilter === "fail" && i.finalResult !== "fail") return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div style={{ ...s.wrap, textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
        Loading inspections…
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ ...s.wrap, textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: FS.h4, fontWeight: 700, color: T.text, marginBottom: SP[3] }}>
          Could not load Inspections
        </div>
        <div style={{ fontSize: FS.body, color: T.textSecondary, lineHeight: 1.6, marginBottom: SP[4], maxWidth: 300, margin: "0 auto" }}>
          {loadError}
        </div>
        <div style={{ fontSize: FS.meta, color: T.textMuted, lineHeight: 1.5 }}>
          Make sure the <code style={{ color: T.gold }}>fh_inspections</code> table exists in Supabase and RLS policies allow access.
        </div>
      </div>
    );
  }

  if (selected) {
    return (
      <InspectionDetail
        inspection={selected}
        onBack={() => setSelectedId(null)}
        onUpdate={updateInspection}
        onDelete={deleteInspection}
      />
    );
  }

  return (
    <div style={s.wrap}>
      {savingStatus && (
        <div
          style={{
            textAlign: "right",
            fontSize: 10,
            color: savingStatus === "error" ? RED : "var(--text-muted)",
            marginBottom: 6,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: ".1em",
          }}
        >
          {savingStatus}
        </div>
      )}

      {/* Stats — single bordered strip with gold dominance bar */}
      <div style={{
        background: T.bgCard,
        border: `1px solid ${T.border}`,
        borderRadius: R.lg,
        marginBottom: SP[5],
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr",
        overflow: "hidden",
        position: "relative",
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0,
          width: "25%", height: 2,
          background: `linear-gradient(90deg, ${T.gold} 0%, rgba(201,150,58,0) 100%)`,
        }} />
        {[
          { label: "Total",   value: totals.total,     accent: T.gold },
          { label: "Passed",  value: totals.pass,      accent: "#6EC98A" },
          { label: "Failed",  value: totals.fail,      accent: totals.fail > 0 ? "#E87E74" : T.text },
          { label: "Re-Insp", value: totals.pendingRe, accent: totals.pendingRe > 0 ? AMBER : T.text },
        ].map((st, i, arr) => (
          <div key={st.label} style={{
            borderRight: i < arr.length - 1 ? `1px solid ${T.border}` : "none",
          }}>
            <Stat label={st.label} value={st.value} accent={st.accent} align="center" />
          </div>
        ))}
      </div>

      {/* Trade Grid — matches HomeScreen QuickAction card pattern */}
      <SectionHeader>Start New Inspection</SectionHeader>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: SP[3], marginBottom: SP[5] }}>
        {TRADE_KEYS.map((k) => {
          const def = TRADE_DEFS[k];
          const count = inspections.filter((i) => i.trade === k).length;
          const passed = inspections.filter((i) => i.trade === k && i.finalResult === "pass").length;
          const failed = inspections.filter((i) => i.trade === k && i.finalResult === "fail").length;
          return (
            <button
              key={k}
              onClick={() => createInspection(k)}
              style={{
                background: T.bgCard,
                borderRadius: R.lg,
                padding: `${SP[5]}px ${SP[4]}px ${SP[4]+1}px`,
                border: `1px solid ${T.border}`,
                cursor: "pointer", textAlign: "left", width: "100%",
                position: "relative", overflow: "hidden",
                fontFamily: FF.sans,
                transition: `border-color ${MO.fast}, transform ${MO.fast}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(201,150,58,.35)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = T.border;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, ${T.gold} 0%, transparent 70%)`,
              }} />
              <div style={{
                width: 36, height: 36,
                background: T.goldBg,
                borderRadius: R.sm,
                border: `1px solid ${T.goldBorder}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: T.gold, marginBottom: SP[3]+1,
              }}>
                <Icon name={def.icon} size={18} />
              </div>
              <div style={{
                fontSize: FS.lead, fontWeight: 700, color: T.text,
                marginBottom: SP[1]+1, letterSpacing: LS.tight, lineHeight: 1.2,
              }}>{def.label}</div>
              <div style={{
                fontSize: FS.meta, color: T.textSecondary,
                fontVariantNumeric: "tabular-nums",
              }}>
                {count} total <span style={{ color: T.textMuted }}>·</span> <span style={{ color: GREEN, fontWeight: 600 }}>{passed} pass</span> <span style={{ color: T.textMuted }}>·</span> <span style={{ color: RED, fontWeight: 600 }}>{failed} fail</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <SectionHeader>Trade</SectionHeader>
      <div style={{
        display: "flex", gap: SP[2],
        overflowX: "auto",
        marginBottom: SP[3],
        paddingBottom: SP[1],
      }}>
        <Pill active={tradeFilter === "all"} onClick={() => setTradeFilter("all")}>All Trades</Pill>
        {TRADE_KEYS.map((k) => (
          <Pill key={k} active={tradeFilter === k} onClick={() => setTradeFilter(k)}>
            {TRADE_DEFS[k].label}
          </Pill>
        ))}
      </div>

      <SectionHeader>Status</SectionHeader>
      <div style={{
        display: "flex", gap: SP[2],
        overflowX: "auto", marginBottom: SP[5],
        paddingBottom: SP[1],
      }}>
        <Pill active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>All</Pill>
        <Pill active={statusFilter === "pending"} onClick={() => setStatusFilter("pending")}>Pending</Pill>
        <Pill active={statusFilter === "pass"} onClick={() => setStatusFilter("pass")}>Passed</Pill>
        <Pill active={statusFilter === "fail"} onClick={() => setStatusFilter("fail")}>Failed</Pill>
      </div>

      {/* List */}
      <SectionHeader>Inspections</SectionHeader>
      {filtered.length === 0 && (
        <EmptyState
          icon={<Icon name="clipboard" size={32} />}
          title="No inspections"
          body="Tap a trade above to start a new inspection log."
        />
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: SP[2] }}>
        {filtered.map((i) => {
          const def = TRADE_DEFS[i.trade];
          const resultColor =
            i.finalResult === "pass" ? GREEN
            : i.finalResult === "fail" ? RED
            : i.finalResult === "partial" ? AMBER
            : T.textMuted;
          const resultLabel = i.finalResult || "pending";
          return (
            <Card
              key={i.id}
              accent={resultColor}
              interactive
              style={{ padding: `${SP[3]+1}px ${SP[4]}px`, cursor: "pointer" }}
              onClick={() => setSelectedId(i.id)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: SP[3] }}>
                <div style={{
                  width: 36, height: 36,
                  borderRadius: R.sm,
                  background: T.goldBg,
                  border: `1px solid ${T.goldBorder}`,
                  color: T.gold,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Icon name={def?.icon || "clipboard"} size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: FS.lead, fontWeight: 700, color: T.text,
                    letterSpacing: LS.tight,
                  }}>{def?.label || i.trade}</div>
                  <div style={{
                    fontSize: FS.meta, color: T.textSecondary, marginTop: 2,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>{i.jobName || "Untitled job"}</div>
                  <div style={{
                    fontSize: FS.meta-1, color: T.textMuted, marginTop: 2,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>{i.siteAddress || "No address"} · {i.scheduledDate}</div>
                </div>
                <span style={{
                  fontSize: FS.meta-2, fontWeight: 700,
                  color: resultColor,
                  background: resultColor + "1a",
                  border: `1px solid ${resultColor}55`,
                  padding: "3px 9px",
                  borderRadius: R.full,
                  textTransform: "uppercase",
                  letterSpacing: LS.label,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}>{resultLabel}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── INSPECTION DETAIL ─────────────────────────────────────
function InspectionDetail({ inspection, onBack, onUpdate, onDelete }) {
  const def = TRADE_DEFS[inspection.trade] || { label: inspection.trade, icon: "clipboard" };
  const [newPhoto, setNewPhoto] = useState({ label: "", notes: "" });

  const setCheckpointStatus = (cpId, status) => {
    const cps = inspection.checkpoints.map((cp) =>
      cp.id === cpId ? { ...cp, status } : cp
    );
    onUpdate(inspection.id, { checkpoints: cps }, `Checkpoint set to ${status}`);
  };

  const setCheckpointNotes = (cpId, notes) => {
    const cps = inspection.checkpoints.map((cp) =>
      cp.id === cpId ? { ...cp, notes } : cp
    );
    onUpdate(inspection.id, { checkpoints: cps });
  };

  const updateField = (key, value) => {
    onUpdate(inspection.id, { [key]: value });
  };

  const updateInspector = (k, v) => {
    onUpdate(inspection.id, { inspector: { ...inspection.inspector, [k]: v } });
  };

  const updateReInsp = (k, v) => {
    onUpdate(inspection.id, { reInspection: { ...inspection.reInspection, [k]: v } });
  };

  const addPhoto = () => {
    if (!newPhoto.label.trim()) return;
    const p = { id: uid(), ...newPhoto, takenAt: iso() };
    onUpdate(inspection.id, { photos: [...(inspection.photos || []), p] }, "Added photo log");
    setNewPhoto({ label: "", notes: "" });
  };

  const removePhoto = (id) => {
    onUpdate(inspection.id, { photos: (inspection.photos || []).filter((p) => p.id !== id) });
  };

  const setFinalResult = (r) => {
    onUpdate(inspection.id, { finalResult: r }, `Final result: ${r}`);
  };

  return (
    <div style={s.wrap}>
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: GOLD,
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "inherit",
          padding: "0 0 14px",
          letterSpacing: ".04em",
        }}
      >
        {"\u2190"} BACK
      </button>

      <div style={s.card}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: SP[3]+1,
            marginBottom: SP[4],
          }}
        >
          <div style={{
            width: 48, height: 48,
            borderRadius: R.md,
            background: T.goldBg,
            border: `1px solid ${T.goldBorder}`,
            color: T.gold,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Icon name={def.icon} size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: FS.h3, fontWeight: 700, color: T.text,
              letterSpacing: LS.tight, lineHeight: 1.2,
            }}>{def.label} Inspection</div>
            <div style={{
              fontSize: FS.meta, color: T.textMuted, marginTop: SP[1],
            }}>
              Created {new Date(inspection.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        <input
          style={{ ...s.input, marginBottom: 8 }}
          placeholder="Job name"
          value={inspection.jobName}
          onChange={(e) => updateField("jobName", e.target.value)}
        />
        <input
          style={{ ...s.input, marginBottom: 8 }}
          placeholder="Site address"
          value={inspection.siteAddress}
          onChange={(e) => updateField("siteAddress", e.target.value)}
        />
        <input
          style={{ ...s.input, marginBottom: 8 }}
          placeholder="Inspection type (rough-in, final…)"
          value={inspection.inspectionType}
          onChange={(e) => updateField("inspectionType", e.target.value)}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input
            style={s.input}
            type="date"
            value={inspection.scheduledDate}
            onChange={(e) => updateField("scheduledDate", e.target.value)}
          />
          <input
            style={s.input}
            type="time"
            value={inspection.scheduledTime}
            onChange={(e) => updateField("scheduledTime", e.target.value)}
          />
        </div>
      </div>

      <div style={s.card}>
        <div style={s.label}>Inspector</div>
        <input
          style={{ ...s.input, marginBottom: 8 }}
          placeholder="Inspector name"
          value={inspection.inspector?.name || ""}
          onChange={(e) => updateInspector("name", e.target.value)}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input
            style={s.input}
            placeholder="Phone"
            value={inspection.inspector?.phone || ""}
            onChange={(e) => updateInspector("phone", e.target.value)}
          />
          <input
            style={s.input}
            placeholder="Badge #"
            value={inspection.inspector?.badge || ""}
            onChange={(e) => updateInspector("badge", e.target.value)}
          />
        </div>
      </div>

      <div style={s.card}>
        <div style={s.label}>Checklist</div>
        {inspection.checkpoints.map((cp) => {
          const color =
            cp.status === "pass"
              ? GREEN
              : cp.status === "fail"
                ? RED
                : cp.status === "na"
                  ? "var(--text-muted)"
                  : null;
          return (
            <div
              key={cp.id}
              style={{
                background: "var(--bg-input)",
                borderRadius: 10,
                padding: 10,
                marginBottom: 8,
                borderLeft: color ? `3px solid ${color}` : "3px solid transparent",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                {cp.critical && <span style={{ color: GOLD, marginRight: 4 }}>★</span>}
                {cp.label}
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <button
                  onClick={() => setCheckpointStatus(cp.id, "pass")}
                  style={{
                    ...s.smallBtn,
                    background: cp.status === "pass" ? GREEN : "var(--bg-input)",
                    color: cp.status === "pass" ? "#fff" : GREEN,
                    borderColor: GREEN,
                    flex: 1,
                  }}
                >
                  Pass
                </button>
                <button
                  onClick={() => setCheckpointStatus(cp.id, "fail")}
                  style={{
                    ...s.smallBtn,
                    background: cp.status === "fail" ? RED : "var(--bg-input)",
                    color: cp.status === "fail" ? "#fff" : RED,
                    borderColor: RED,
                    flex: 1,
                  }}
                >
                  Fail
                </button>
                <button
                  onClick={() => setCheckpointStatus(cp.id, "na")}
                  style={{
                    ...s.smallBtn,
                    background: cp.status === "na" ? "var(--text-muted)" : "var(--bg-input)",
                    color: cp.status === "na" ? "#fff" : "var(--text-muted)",
                    flex: 1,
                  }}
                >
                  N/A
                </button>
              </div>
              {cp.status === "fail" && (
                <input
                  style={{ ...s.input, fontSize: 12 }}
                  placeholder="Notes on failure…"
                  value={cp.notes || ""}
                  onChange={(e) => setCheckpointNotes(cp.id, e.target.value)}
                />
              )}
            </div>
          );
        })}
      </div>

      <div style={s.card}>
        <div style={s.label}>Photo Log</div>
        {(inspection.photos || []).map((p) => (
          <div
            key={p.id}
            style={{
              background: "var(--bg-input)",
              borderRadius: 10,
              padding: 10,
              marginBottom: 8,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{p.label}</div>
            {p.notes && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{p.notes}</div>}
            <button
              style={{ ...s.smallBtn, marginTop: 6, color: RED }}
              onClick={() => removePhoto(p.id)}
            >
              Remove
            </button>
          </div>
        ))}
        <input
          style={{ ...s.input, marginBottom: 8 }}
          placeholder="Photo label"
          value={newPhoto.label}
          onChange={(e) => setNewPhoto({ ...newPhoto, label: e.target.value })}
        />
        <input
          style={{ ...s.input, marginBottom: 8 }}
          placeholder="Photo notes"
          value={newPhoto.notes}
          onChange={(e) => setNewPhoto({ ...newPhoto, notes: e.target.value })}
        />
        <button style={s.btn(true)} onClick={addPhoto}>
          Add Photo Entry
        </button>
      </div>

      <div style={s.card}>
        <div style={s.label}>Final Result</div>
        <div style={{ display: "flex", gap: 8 }}>
          {["pass", "partial", "fail"].map((r) => {
            const color = r === "pass" ? GREEN : r === "fail" ? RED : AMBER;
            const active = inspection.finalResult === r;
            return (
              <button
                key={r}
                onClick={() => setFinalResult(r)}
                style={{
                  flex: 1,
                  padding: "12px 8px",
                  borderRadius: 10,
                  border: `1.5px solid ${color}`,
                  background: active ? color : "transparent",
                  color: active ? "#fff" : color,
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textTransform: "capitalize",
                }}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>

      <div style={s.card}>
        <div style={s.label}>Re-Inspection</div>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: "var(--text-secondary)",
            cursor: "pointer",
            marginBottom: 10,
          }}
        >
          <input
            type="checkbox"
            checked={!!inspection.reInspection?.needed}
            onChange={(e) => updateReInsp("needed", e.target.checked)}
          />
          Re-inspection needed
        </label>
        {inspection.reInspection?.needed && (
          <>
            <input
              style={{ ...s.input, marginBottom: 8 }}
              type="date"
              value={inspection.reInspection?.date || ""}
              onChange={(e) => updateReInsp("date", e.target.value)}
            />
            <textarea
              style={{ ...s.input, minHeight: 60, resize: "vertical" }}
              placeholder="Re-inspection notes"
              value={inspection.reInspection?.notes || ""}
              onChange={(e) => updateReInsp("notes", e.target.value)}
            />
          </>
        )}
      </div>

      <div style={s.card}>
        <div style={s.label}>Inspector Notes</div>
        <textarea
          style={{ ...s.input, minHeight: 80, resize: "vertical" }}
          value={inspection.inspectorNotes || ""}
          onChange={(e) => updateField("inspectorNotes", e.target.value)}
        />
      </div>

      <div style={s.card}>
        <div style={s.label}>Contractor Notes</div>
        <textarea
          style={{ ...s.input, minHeight: 80, resize: "vertical" }}
          value={inspection.contractorNotes || ""}
          onChange={(e) => updateField("contractorNotes", e.target.value)}
        />
      </div>

      <div style={s.card}>
        <div style={s.label}>Activity</div>
        {(inspection.history || []).length === 0 && (
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>No activity yet.</div>
        )}
        {(inspection.history || [])
          .slice()
          .reverse()
          .map((h, idx) => (
            <div
              key={idx}
              style={{
                fontSize: 11,
                color: "var(--text-secondary)",
                padding: "6px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span style={{ color: GOLD, fontWeight: 800 }}>{h.by}</span> — {h.action} ·{" "}
              {new Date(h.at).toLocaleString()}
            </div>
          ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button style={s.btn(true)} onClick={onBack}>
          Save & Back
        </button>
        <button
          style={{ ...s.btn(false), color: RED, borderColor: RED }}
          onClick={() => onDelete(inspection.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
