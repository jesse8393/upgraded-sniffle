// Requires fh_partner_jobs table in Supabase.
// SQL is in the project README or run manually by the user.

import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { T, SP, R, FS, LS, MO, FF } from "../ui/tokens";

const GOLD = T.gold;
const GOLD_DK = T.goldDk;
const GREEN = T.green;
const RED = T.red;
const AMBER = T.amber;
const PARKER_CO = "Parker Construction Co.";
const PARTNER_CO = "Partner Co.";

const uid = () => Math.random().toString(36).slice(2, 10);
const fmt$ = (n) => "$" + (Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
const iso = (d) => new Date(d || Date.now()).toISOString();
const today = () => new Date().toISOString().split("T")[0];

// ─── jsPDF CDN LOADER ─────────────────────────────────────
let jsPdfPromise = null;
const loadJsPdf = () => {
  if (window.jspdf?.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  if (jsPdfPromise) return jsPdfPromise;
  jsPdfPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = () => resolve(window.jspdf.jsPDF);
    s.onerror = () => reject(new Error("Failed to load jsPDF"));
    document.body.appendChild(s);
  });
  return jsPdfPromise;
};

// ─── DEFAULT JOB ──────────────────────────────────────────
const emptyJob = (creator = "Unknown") => ({
  id: uid(),
  name: "Untitled Job",
  client: "",
  bidValue: 0,
  splitJesse: 50,
  splitBuddy: 50,
  status: "active",
  createdAt: iso(),
  owner: creator,
  createdBy: creator,
  collaborators: [creator],
  labor: [],
  subs: [],
  costs: [],
  invoices: [],
  payments: [],
  scheduleItems: [],
  notes: "",
});

// ─── STYLES ───────────────────────────────────────────────
// All values pulled from the shared design system (src/ui/tokens.js).
// Edit the system, not these — keeps PartnerTracker visually aligned with the rest of the app.
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
  pill: (active) => ({
    padding: `${SP[2]}px ${SP[3]+1}px`,
    borderRadius: R.full,
    border: `1px solid ${active ? T.gold : T.border}`,
    background: active ? T.goldBg : "transparent",
    color: active ? T.gold : T.textSecondary,
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

const TABS = ["overview", "labor", "subs", "costs", "invoices", "payments", "schedule", "notes"];

export default function PartnerTracker({ currentUser }) {
  const [jobs, setJobs] = useState([]);
  const [rowId, setRowId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [savingStatus, setSavingStatus] = useState("");
  const [invoiceView, setInvoiceView] = useState(null);

  const saveTimer = useRef(null);
  const skipNextSave = useRef(false);
  // Guard against undefined currentUser prop
  const user = currentUser || { name: "", company: "", role: "owner", id: "fallback" };
  const userName = user.name;
  const orgId = user.org_id || null;

  // Load row — with safety timeout so the screen never hangs.
  useEffect(() => {
    let resolved = false;
    const finish = (err) => {
      if (resolved) return;
      resolved = true;
      if (err) setLoadError(err);
      setLoading(false);
    };

    // Safety timeout — if Supabase doesn't respond in 10s, stop waiting.
    const timeout = setTimeout(() => {
      if (!resolved) {
        console.error("[PartnerTracker] load timed out after 10s — Supabase may be unreachable");
        finish("Connection timed out. Check Supabase configuration.");
      }
    }, 10000);

    (async () => {
      try {
        if (!orgId) {
          console.warn("[PartnerTracker] no org_id on currentUser — aborting load");
          finish("No organization on this account. Sign out and sign back in.");
          clearTimeout(timeout);
          return;
        }
        console.log("[PartnerTracker] querying fh_partner_jobs…", { orgId });
        const { data, error } = await supabase
          .from("fh_partner_jobs")
          .select("*")
          .eq("org_id", orgId)
          .order("updated_at", { ascending: false })
          .limit(1);
        if (error) {
          console.error("[PartnerTracker] query error:", error.message, error.code, error.hint);
          finish(`Database error: ${error.message}${error.hint ? " — " + error.hint : ""}`);
          clearTimeout(timeout);
          return;
        }
        console.log("[PartnerTracker] query OK, rows:", data?.length);
        if (data && data.length > 0) {
          setRowId(data[0].id);
          const arr = Array.isArray(data[0].job_data) ? data[0].job_data : [];
          skipNextSave.current = true;
          setJobs(arr);
          if (arr.length > 0) setSelectedId(arr[0].id);
        } else {
          console.log("[PartnerTracker] no rows — inserting initial empty row");
          const { data: inserted, error: insErr } = await supabase
            .from("fh_partner_jobs")
            .insert({
              job_data: [],
              updated_at: iso(),
              updated_by: userName,
              org_id: orgId,
            })
            .select()
            .single();
          if (insErr) {
            console.error("[PartnerTracker] insert error:", insErr.message, insErr.code);
          } else if (inserted) {
            console.log("[PartnerTracker] created initial row", inserted.id);
            setRowId(inserted.id);
          }
        }
        finish(null);
      } catch (e) {
        console.error("[PartnerTracker] load exception:", e);
        finish(`Unexpected error: ${e?.message || "unknown"}`);
      }
      clearTimeout(timeout);
    })();

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  // Realtime channel — wrapped in try/catch so a broken subscription
  // doesn't crash the whole component.
  useEffect(() => {
    if (!orgId) return;
    let channel;
    try {
      channel = supabase
        .channel("fh_partner_jobs_sync")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "fh_partner_jobs", filter: `org_id=eq.${orgId}` },
          (payload) => {
            const newRow = payload.new;
            if (!newRow) return;
            if (newRow.org_id !== orgId) return;
            if (newRow.updated_by === userName) return;
            const arr = Array.isArray(newRow.job_data) ? newRow.job_data : [];
            skipNextSave.current = true;
            setJobs(arr);
            setRowId(newRow.id);
          }
        )
        .subscribe();
    } catch (e) {
      console.error("[PartnerTracker] realtime channel error:", e);
    }
    return () => {
      if (channel) {
        try { supabase.removeChannel(channel); } catch { /* cleanup */ }
      }
    };
  }, [orgId, userName]);

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
            .from("fh_partner_jobs")
            .update({
              job_data: jobs,
              updated_at: iso(),
              updated_by: userName,
            })
            .eq("id", rowId);
          if (error) throw error;
        } else {
          if (!orgId) throw new Error("no org_id — cannot save");
          const { data, error } = await supabase
            .from("fh_partner_jobs")
            .insert({
              job_data: jobs,
              updated_at: iso(),
              updated_by: userName,
              org_id: orgId,
            })
            .select()
            .single();
          if (error) throw error;
          if (data) setRowId(data.id);
        }
        setSavingStatus("saved");
        setTimeout(() => setSavingStatus(""), 1200);
      } catch (e) {
        console.warn("PartnerTracker save error", e);
        setSavingStatus("error");
      }
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [jobs, rowId, loading, userName, orgId]);

  // Strict per-user visibility: you see a job ONLY if your name is
  // in its collaborators array. No legacy exceptions, no "show to everyone".
  const isVisible = (j) => {
    const collabs = Array.isArray(j.collaborators) ? j.collaborators : [];
    return collabs.includes(userName);
  };
  const visibleJobs = jobs.filter(isVisible);

  // Selected job must also pass the visibility check.
  const selected = visibleJobs.find((j) => j.id === selectedId) || null;

  const updateJob = (id, patch) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  };

  const addJob = () => {
    const j = emptyJob(userName);
    setJobs((prev) => [...prev, j]);
    setSelectedId(j.id);
    setTab("overview");
  };

  const deleteJob = (id) => {
    if (!window.confirm("Delete this job?")) return;
    setJobs((prev) => prev.filter((j) => j.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // Totals
  const pipelineTotal = visibleJobs.reduce((sum, j) => sum + (Number(j.bidValue) || 0), 0);

  if (loading) {
    return (
      <div style={{ ...s.wrap, textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
        Loading partner jobs…
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ ...s.wrap, textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: FS.h4, fontWeight: 700, color: T.text, marginBottom: SP[3] }}>
          Could not load Partner Tracker
        </div>
        <div style={{ fontSize: FS.body, color: T.textSecondary, lineHeight: 1.6, marginBottom: SP[4], maxWidth: 300, margin: "0 auto" }}>
          {loadError}
        </div>
        <div style={{ fontSize: FS.meta, color: T.textMuted, lineHeight: 1.5 }}>
          Make sure the <code style={{ color: T.gold }}>fh_partner_jobs</code> table exists in Supabase and RLS policies allow access.
        </div>
      </div>
    );
  }

  return (
    <div style={s.wrap}>
      {/* Header stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div style={s.stat}>
          <div style={s.statLabel}>Total Pipeline</div>
          <div style={{ ...s.statVal, color: GOLD }}>{fmt$(pipelineTotal)}</div>
        </div>
        <div style={s.stat}>
          <div style={s.statLabel}>Active Jobs</div>
          <div style={s.statVal}>{visibleJobs.filter((j) => j.status === "active").length}</div>
        </div>
      </div>

      {/* Save status */}
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

      {/* Job list */}
      <div
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          paddingBottom: 6,
          marginBottom: 14,
        }}
      >
        {visibleJobs.map((j) => {
          const active = j.id === selectedId;
          return (
            <div
              key={j.id}
              onClick={() => setSelectedId(j.id)}
              style={{
                flex: "0 0 auto",
                minWidth: 180,
                background: "var(--bg-card)",
                border: `1.5px solid ${active ? GOLD : "var(--border)"}`,
                borderRadius: 12,
                padding: "12px 14px",
                cursor: "pointer",
                boxShadow: active ? "0 4px 14px rgba(201,150,58,0.2)" : "none",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  marginBottom: 4,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {j.name}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 6 }}>
                {j.client || "No client"}
              </div>
              <div style={{ fontSize: 14, color: GOLD, fontWeight: 800 }}>
                {fmt$(j.bidValue)}
              </div>
            </div>
          );
        })}
        <button
          onClick={addJob}
          style={{
            flex: "0 0 auto",
            minWidth: 120,
            background: "transparent",
            border: `1.5px dashed ${GOLD}`,
            borderRadius: 12,
            padding: "12px 14px",
            color: GOLD,
            fontSize: 12,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          + NEW JOB
        </button>
      </div>

      {!selected && (
        <div style={{ ...s.card, textAlign: "center", padding: "48px 20px" }}>
          {visibleJobs.length === 0 ? (
            <>
              <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>⚒</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                No partner jobs yet
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Tap <span style={{ color: GOLD, fontWeight: 700 }}>+ NEW JOB</span> above to start one.
              </div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Select a job to view details.
            </div>
          )}
        </div>
      )}

      {selected && (
        <>
          {/* Tab strip */}
          <div
            style={{
              display: "flex",
              gap: 6,
              overflowX: "auto",
              marginBottom: 14,
              paddingBottom: 4,
            }}
          >
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} style={s.pill(tab === t)}>
                {t}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <OverviewTab
              job={selected}
              updateJob={updateJob}
              deleteJob={deleteJob}
              currentUser={currentUser}
            />
          )}
          {tab === "labor" && <LaborTab job={selected} updateJob={updateJob} />}
          {tab === "subs" && <SubsTab job={selected} updateJob={updateJob} />}
          {tab === "costs" && <CostsTab job={selected} updateJob={updateJob} />}
          {tab === "invoices" && (
            <InvoicesTab
              job={selected}
              updateJob={updateJob}
              onView={(inv) => setInvoiceView(inv)}
            />
          )}
          {tab === "payments" && <PaymentsTab job={selected} updateJob={updateJob} />}
          {tab === "schedule" && <ScheduleTab job={selected} updateJob={updateJob} />}
          {tab === "notes" && <NotesTab job={selected} updateJob={updateJob} />}
        </>
      )}

      {invoiceView && (
        <InvoiceModal
          invoice={invoiceView}
          job={selected}
          onClose={() => setInvoiceView(null)}
        />
      )}
    </div>
  );
}

// ─── Helpers for financial calculations ─────────────────
const totalLabor = (job) =>
  (job.labor || []).reduce((sum, w) => sum + (Number(w.rate) || 0) * (Number(w.hours) || 0), 0);
const totalLaborByCompany = (job, company) =>
  (job.labor || [])
    .filter((w) => w.company === company)
    .reduce((sum, w) => sum + (Number(w.rate) || 0) * (Number(w.hours) || 0), 0);
const totalSubs = (job) =>
  (job.subs || []).reduce((sum, x) => sum + (Number(x.paid) || 0), 0);
const totalSubsByCompany = (job, company) =>
  (job.subs || [])
    .filter((x) => x.paidByCompany === company)
    .reduce((sum, x) => sum + (Number(x.paid) || 0), 0);
const totalCosts = (job) =>
  (job.costs || []).reduce((sum, x) => sum + (Number(x.amount) || 0), 0);
const totalCostsByCompany = (job, company) =>
  (job.costs || [])
    .filter((x) => x.paidByCompany === company)
    .reduce((sum, x) => sum + (Number(x.amount) || 0), 0);
const totalRevenue = (job) =>
  (job.payments || [])
    .filter((p) => p.fromClient)
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

// ─── Overview Tab ────────────────────────────────────────
function OverviewTab({ job, updateJob, deleteJob, currentUser }) {
  const [partnerList, setPartnerList] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState("");
  const collaborators = Array.isArray(job.collaborators) ? job.collaborators : [];
  const ownerName = job.owner || job.createdBy || currentUser?.name;
  const isOwner = ownerName === currentUser?.name;

  // Load available partners from fh_users (scoped to the same org)
  useEffect(() => {
    const orgId = currentUser?.org_id;
    if (!orgId) { setPartnerList([]); return; }
    (async () => {
      try {
        const { data, error } = await supabase
          .from("fh_users")
          .select("name")
          .eq("org_id", orgId)
          .neq("name", currentUser?.name || "");
        if (!error && data) {
          setPartnerList(data.map(u => u.name));
        } else {
          console.warn("[PartnerTracker] could not load partner list:", error?.message);
          setPartnerList([]);
        }
      } catch (e) {
        console.warn("[PartnerTracker] partner list exception:", e);
        setPartnerList([]);
      }
    })();
  }, [currentUser?.name, currentUser?.org_id]);

  // Available partners = everyone NOT already a collaborator on this job
  const invitable = partnerList.filter(p => !collaborators.includes(p));

  const addCollaborator = () => {
    if (!selectedPartner) return;
    if (collaborators.includes(selectedPartner)) { setSelectedPartner(""); return; }
    updateJob(job.id, { collaborators: [...collaborators, selectedPartner] });
    setSelectedPartner("");
  };

  const removeCollaborator = (name) => {
    if (name === ownerName) return; // can't remove owner
    updateJob(job.id, { collaborators: collaborators.filter(c => c !== name) });
  };

  const laborTotal = totalLabor(job);
  const subsTotal = totalSubs(job);
  const costsTotal = totalCosts(job);
  const revenue = totalRevenue(job);
  const allCosts = laborTotal + subsTotal + costsTotal;
  const netProfit = revenue - allCosts;

  const jesseShare = (netProfit * (job.splitJesse || 0)) / 100;
  const buddyShare = (netProfit * (job.splitBuddy || 0)) / 100;

  // Out-of-pocket by each company
  const parkerOut =
    totalLaborByCompany(job, PARKER_CO) +
    totalSubsByCompany(job, PARKER_CO) +
    totalCostsByCompany(job, PARKER_CO);
  const partnerOut =
    totalLaborByCompany(job, PARTNER_CO) +
    totalSubsByCompany(job, PARTNER_CO) +
    totalCostsByCompany(job, PARTNER_CO);

  // Settlement: what each was supposed to contribute vs. what they contributed
  // Simpler settlement: share of revenue minus what they actually paid out
  const jesseRevShare = (revenue * (job.splitJesse || 0)) / 100;
  const buddyRevShare = (revenue * (job.splitBuddy || 0)) / 100;
  const jesseNet = jesseRevShare - parkerOut;
  const buddyNet = buddyRevShare - partnerOut;

  let settlement = null;
  const diff = jesseNet - buddyNet;
  if (Math.abs(diff) > 0.5) {
    if (diff > 0) {
      settlement = `Buddy owes Jesse ${fmt$(diff / 2)}`;
    } else {
      settlement = `Jesse owes Buddy ${fmt$(-diff / 2)}`;
    }
  } else {
    settlement = "Even";
  }

  const exportJobPdf = async () => {
    try {
      const JsPdf = await loadJsPdf();
      const doc = new JsPdf();
      // Gold header
      doc.setFillColor(201, 150, 58);
      doc.rect(0, 0, 210, 22, "F");
      doc.setTextColor(20, 20, 20);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("FIELDHORSE", 14, 14);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Partner Job Summary", 14, 19);

      doc.setTextColor(20, 20, 20);
      let y = 34;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(job.name || "Job", 14, y);
      y += 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Client: ${job.client || "—"}`, 14, y);
      y += 5;
      doc.text(`Bid: ${fmt$(job.bidValue)}`, 14, y);
      y += 5;
      doc.text(`Split: Jesse ${job.splitJesse}% / Buddy ${job.splitBuddy}%`, 14, y);
      y += 5;
      doc.text(`Status: ${job.status}`, 14, y);
      y += 10;

      doc.setFont("helvetica", "bold");
      doc.text("Financial Summary", 14, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      const rows = [
        ["Labor total", fmt$(laborTotal)],
        ["Subs total", fmt$(subsTotal)],
        ["Other costs", fmt$(costsTotal)],
        ["Total costs", fmt$(allCosts)],
        ["Revenue collected", fmt$(revenue)],
        ["Net profit", fmt$(netProfit)],
        ["Jesse share", fmt$(jesseShare)],
        ["Buddy share", fmt$(buddyShare)],
        ["Settlement", settlement],
      ];
      rows.forEach(([k, v]) => {
        doc.text(`${k}: ${v}`, 14, y);
        y += 5;
      });
      y += 4;

      if ((job.labor || []).length) {
        doc.setFont("helvetica", "bold");
        doc.text("Labor", 14, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        job.labor.forEach((w) => {
          const line = `${w.worker || "—"} (${w.company || "—"}) · ${w.hours}h @ ${fmt$(w.rate)}/hr = ${fmt$(
            (Number(w.rate) || 0) * (Number(w.hours) || 0)
          )}`;
          doc.text(line, 14, y);
          y += 5;
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
        });
        y += 4;
      }

      if ((job.subs || []).length) {
        doc.setFont("helvetica", "bold");
        doc.text("Subs", 14, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        job.subs.forEach((x) => {
          const line = `${x.name || "—"} · ${x.trade || ""} · contract ${fmt$(x.contractAmount)} · paid ${fmt$(x.paid)}`;
          doc.text(line, 14, y);
          y += 5;
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
        });
        y += 4;
      }

      if ((job.costs || []).length) {
        doc.setFont("helvetica", "bold");
        doc.text("Costs", 14, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        job.costs.forEach((c) => {
          const line = `${c.date || ""} · ${c.description || "—"} · ${fmt$(c.amount)} (${c.paidByCompany || "—"})`;
          doc.text(line, 14, y);
          y += 5;
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
        });
        y += 4;
      }

      if (job.notes) {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.text("Notes", 14, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(job.notes, 180);
        doc.text(lines, 14, y);
      }

      doc.save(`${(job.name || "job").replace(/\s+/g, "_")}_summary.pdf`);
    } catch (e) {
      alert("PDF export failed: " + e.message);
    }
  };

  return (
    <>
      <div style={s.card}>
        <div style={s.label}>Sharing & Access</div>
        <div style={{ fontSize:FS.meta, color:"var(--text-secondary)", marginBottom:SP[3], lineHeight:1.5 }}>
          Owner: <span style={{ color:GOLD, fontWeight:700 }}>{ownerName}</span>.
          Only listed collaborators can see this job.
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:SP[1]+2, marginBottom:SP[3] }}>
          {collaborators.map(c => (
            <div key={c} style={{ display:"flex", alignItems:"center", gap:SP[1]+2, background:"rgba(201,150,58,.12)", border:"1px solid rgba(201,150,58,.3)", borderRadius:R.full, padding:`${SP[1]+1}px ${SP[2]+2}px ${SP[1]+1}px ${SP[3]}px`, fontSize:FS.meta, color:GOLD, fontWeight:700 }}>
              <span>{c}</span>
              {c === ownerName && <span style={{ fontSize:FS.meta-2, color:"var(--text-muted)", fontWeight:600 }}>(owner)</span>}
              {isOwner && c !== ownerName && (
                <button onClick={()=>removeCollaborator(c)} style={{ background:"none", border:"none", color:GOLD, cursor:"pointer", fontSize:FS.body, padding:0, lineHeight:1, fontWeight:700 }}>×</button>
              )}
            </div>
          ))}
        </div>
        {isOwner && invitable.length > 0 && (
          <div style={{ display:"flex", gap:SP[2] }}>
            <select
              style={{ ...s.input, flex:1, marginBottom:0 }}
              value={selectedPartner}
              onChange={e => setSelectedPartner(e.target.value)}
            >
              <option value="">— Select a partner to invite —</option>
              {invitable.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button
              onClick={addCollaborator}
              disabled={!selectedPartner}
              style={{ padding:`${SP[2]+1}px ${SP[4]}px`, borderRadius:R.md, border:"none", background:GOLD, color:"#141414", fontWeight:700, fontSize:FS.ui, cursor: selectedPartner ? "pointer" : "not-allowed", opacity: selectedPartner ? 1 : .5, fontFamily:FF.sans, whiteSpace:"nowrap" }}
            >
              Invite
            </button>
          </div>
        )}
        {isOwner && invitable.length === 0 && collaborators.length > 1 && (
          <div style={{ fontSize:FS.meta, color:"var(--text-muted)" }}>
            All available partners have been invited.
          </div>
        )}
        {!isOwner && (
          <div style={{ fontSize:FS.meta, color:"var(--text-muted)", fontStyle:"italic" }}>
            Only the job owner can manage collaborators.
          </div>
        )}
      </div>

      <div style={s.card}>
        <div style={s.label}>Job Details</div>
        <input
          style={{ ...s.input, marginBottom: 10 }}
          placeholder="Job name"
          value={job.name}
          onChange={(e) => updateJob(job.id, { name: e.target.value })}
        />
        <input
          style={{ ...s.input, marginBottom: 10 }}
          placeholder="Client name"
          value={job.client}
          onChange={(e) => updateJob(job.id, { client: e.target.value })}
        />
        <input
          style={{ ...s.input, marginBottom: job.bidValue ? 4 : 10 }}
          type="number"
          placeholder="Bid value ($)"
          value={job.bidValue || ""}
          onChange={(e) => updateJob(job.id, { bidValue: Number(e.target.value) || 0 })}
        />
        {!!job.bidValue && (
          <div style={{
            fontSize: FS.meta, color: T.gold, fontWeight: 700,
            marginBottom: SP[3], fontVariantNumeric: "tabular-nums",
            letterSpacing: LS.tight,
          }}>{fmt$(job.bidValue)}</div>
        )}
        <select
          style={{ ...s.input, marginBottom: 10 }}
          value={job.status}
          onChange={(e) => updateJob(job.id, { status: e.target.value })}
        >
          <option value="active">Active</option>
          <option value="complete">Complete</option>
          <option value="on-hold">On Hold</option>
        </select>

        <div style={{ ...s.label, marginTop: 10 }}>Profit Split</div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "var(--text-secondary)",
            marginBottom: 6,
          }}
        >
          <span>Jesse {job.splitJesse}%</span>
          <span>Buddy {job.splitBuddy}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={job.splitJesse}
          onChange={(e) => {
            const v = Number(e.target.value);
            updateJob(job.id, { splitJesse: v, splitBuddy: 100 - v });
          }}
          style={{ width: "100%", accentColor: GOLD }}
        />
      </div>

      <div style={s.card}>
        <div style={s.label}>Financials</div>
        <Row k="Labor" v={fmt$(laborTotal)} />
        <Row k="Subs" v={fmt$(subsTotal)} />
        <Row k="Other costs" v={fmt$(costsTotal)} />
        <Row k="Total costs" v={fmt$(allCosts)} bold />
        <Row k="Revenue collected" v={fmt$(revenue)} bold />
        <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />
        <Row k="Net profit" v={fmt$(netProfit)} color={netProfit >= 0 ? GREEN : RED} bold />
        <Row k="Jesse share" v={fmt$(jesseShare)} />
        <Row k="Buddy share" v={fmt$(buddyShare)} />
      </div>

      <div style={s.card}>
        <div style={s.label}>Settlement</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
          Parker Construction out-of-pocket: {fmt$(parkerOut)}
          <br />
          Partner Co out-of-pocket: {fmt$(partnerOut)}
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: GOLD }}>{settlement}</div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <button style={s.btn(true)} onClick={exportJobPdf}>
          Export Job Summary PDF
        </button>
        <button
          style={{ ...s.btn(false), color: RED, borderColor: RED }}
          onClick={() => deleteJob(job.id)}
        >
          Delete Job
        </button>
      </div>
    </>
  );
}

const Row = ({ k, v, color, bold }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "6px 0",
      fontSize: 13,
    }}
  >
    <span style={{ color: "var(--text-secondary)", fontWeight: bold ? 700 : 500 }}>{k}</span>
    <span style={{ color: color || "var(--text-primary)", fontWeight: bold ? 800 : 600 }}>{v}</span>
  </div>
);

// ─── Labor Tab ───────────────────────────────────────────
function LaborTab({ job, updateJob }) {
  const [form, setForm] = useState({
    worker: "",
    company: PARKER_CO,
    role: "",
    rate: "",
    hours: "",
  });

  const add = () => {
    if (!form.worker.trim()) return;
    const w = {
      id: uid(),
      worker: form.worker.trim(),
      company: form.company,
      role: form.role.trim(),
      rate: Number(form.rate) || 0,
      hours: Number(form.hours) || 0,
      addedAt: iso(),
    };
    updateJob(job.id, { labor: [...(job.labor || []), w] });
    setForm({ worker: "", company: PARKER_CO, role: "", rate: "", hours: "" });
  };

  const adjust = (id, delta) => {
    updateJob(job.id, {
      labor: (job.labor || []).map((w) =>
        w.id === id ? { ...w, hours: Math.max(0, (Number(w.hours) || 0) + delta) } : w
      ),
    });
  };

  const remove = (id) => {
    updateJob(job.id, { labor: (job.labor || []).filter((w) => w.id !== id) });
  };

  return (
    <>
      <div style={s.card}>
        <div style={s.label}>Add Worker</div>
        <input
          style={{ ...s.input, marginBottom: 8 }}
          placeholder="Worker name"
          value={form.worker}
          onChange={(e) => setForm({ ...form, worker: e.target.value })}
        />
        <select
          style={{ ...s.input, marginBottom: 8 }}
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
        >
          <option>{PARKER_CO}</option>
          <option>{PARTNER_CO}</option>
        </select>
        <input
          style={{ ...s.input, marginBottom: 8 }}
          placeholder="Role / trade"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <input
            style={s.input}
            type="number"
            placeholder="Rate / hr"
            value={form.rate}
            onChange={(e) => setForm({ ...form, rate: e.target.value })}
          />
          <input
            style={s.input}
            type="number"
            placeholder="Hours"
            value={form.hours}
            onChange={(e) => setForm({ ...form, hours: e.target.value })}
          />
        </div>
        {!!(form.rate && form.hours) && (
          <div style={{
            fontSize: FS.meta, color: T.gold, fontWeight: 700,
            marginBottom: SP[2], fontVariantNumeric: "tabular-nums",
          }}>
            {fmt$(form.rate)}/hr × {form.hours}h = {fmt$(Number(form.rate) * Number(form.hours))}
          </div>
        )}
        <button style={s.btn(true)} onClick={add}>
          Add Worker
        </button>
      </div>

      <div style={s.card}>
        <div style={s.label}>Workers</div>
        {(job.labor || []).length === 0 && (
          <div style={{ color: "var(--text-muted)", fontSize: 12 }}>No workers yet.</div>
        )}
        {(job.labor || []).map((w) => {
          const total = (Number(w.rate) || 0) * (Number(w.hours) || 0);
          return (
            <div
              key={w.id}
              style={{
                background: "var(--bg-input)",
                borderRadius: 10,
                padding: 12,
                marginBottom: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>
                  {w.worker}
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: GOLD }}>{fmt$(total)}</div>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
                {w.company} · {w.role} · {fmt$(w.rate)}/hr · {w.hours}h
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={s.smallBtn} onClick={() => adjust(w.id, 8)}>
                  +8h
                </button>
                <button style={s.smallBtn} onClick={() => adjust(w.id, -8)}>
                  −8h
                </button>
                <button
                  style={{ ...s.smallBtn, color: RED, marginLeft: "auto" }}
                  onClick={() => remove(w.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={s.card}>
        <div style={s.label}>Company Breakdown</div>
        <Row k={PARKER_CO} v={fmt$(totalLaborByCompany(job, PARKER_CO))} />
        <Row k={PARTNER_CO} v={fmt$(totalLaborByCompany(job, PARTNER_CO))} />
        <div style={{ height: 1, background: "var(--border)", margin: "6px 0" }} />
        <Row k="Total labor" v={fmt$(totalLabor(job))} bold />
      </div>
    </>
  );
}

// ─── Subs Tab ────────────────────────────────────────────
function SubsTab({ job, updateJob }) {
  const [form, setForm] = useState({
    name: "",
    trade: "",
    contractAmount: "",
    paid: "",
    paidByCompany: PARKER_CO,
  });

  const add = () => {
    if (!form.name.trim()) return;
    const contract = Number(form.contractAmount) || 0;
    const paid = Number(form.paid) || 0;
    const status = paid === 0 ? "Pending" : paid >= contract ? "Paid" : "Partial";
    const sub = {
      id: uid(),
      name: form.name.trim(),
      trade: form.trade.trim(),
      contractAmount: contract,
      paid,
      paidByCompany: form.paidByCompany,
      status,
    };
    updateJob(job.id, { subs: [...(job.subs || []), sub] });
    setForm({ name: "", trade: "", contractAmount: "", paid: "", paidByCompany: PARKER_CO });
  };

  const remove = (id) => {
    updateJob(job.id, { subs: (job.subs || []).filter((x) => x.id !== id) });
  };

  return (
    <>
      <div style={s.card}>
        <div style={s.label}>Add Sub</div>
        <input
          style={{ ...s.input, marginBottom: 8 }}
          placeholder="Sub name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          style={{ ...s.input, marginBottom: 8 }}
          placeholder="Trade"
          value={form.trade}
          onChange={(e) => setForm({ ...form, trade: e.target.value })}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <input
            style={s.input}
            type="number"
            placeholder="Contract $"
            value={form.contractAmount}
            onChange={(e) => setForm({ ...form, contractAmount: e.target.value })}
          />
          <input
            style={s.input}
            type="number"
            placeholder="Paid $"
            value={form.paid}
            onChange={(e) => setForm({ ...form, paid: e.target.value })}
          />
        </div>
        {!!(form.contractAmount || form.paid) && (
          <div style={{
            fontSize: FS.meta, color: T.gold, fontWeight: 700,
            marginBottom: SP[2], fontVariantNumeric: "tabular-nums",
          }}>
            Contract {fmt$(form.contractAmount)} · Paid {fmt$(form.paid)} · Remaining {fmt$(Number(form.contractAmount || 0) - Number(form.paid || 0))}
          </div>
        )}
        <select
          style={{ ...s.input, marginBottom: 10 }}
          value={form.paidByCompany}
          onChange={(e) => setForm({ ...form, paidByCompany: e.target.value })}
        >
          <option>{PARKER_CO}</option>
          <option>{PARTNER_CO}</option>
        </select>
        <button style={s.btn(true)} onClick={add}>
          Add Sub
        </button>
      </div>

      <div style={s.card}>
        <div style={s.label}>Subs</div>
        {(job.subs || []).length === 0 && (
          <div style={{ color: "var(--text-muted)", fontSize: 12 }}>No subs yet.</div>
        )}
        {(job.subs || []).map((x) => {
          const remaining = (Number(x.contractAmount) || 0) - (Number(x.paid) || 0);
          const color =
            x.status === "Paid" ? GREEN : x.status === "Partial" ? AMBER : "var(--text-muted)";
          return (
            <div
              key={x.id}
              style={{
                background: "var(--bg-input)",
                borderRadius: 10,
                padding: 12,
                marginBottom: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>
                  {x.name}
                </div>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color,
                    background: "rgba(255,255,255,0.04)",
                    padding: "3px 8px",
                    borderRadius: 20,
                    border: `1px solid ${color}`,
                    textTransform: "uppercase",
                    letterSpacing: ".08em",
                  }}
                >
                  {x.status}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
                {x.trade} · Paid by {x.paidByCompany}
              </div>
              <div style={{ fontSize: 12 }}>
                Contract {fmt$(x.contractAmount)} · Paid {fmt$(x.paid)} · Remaining{" "}
                <span style={{ color: remaining > 0 ? AMBER : GREEN, fontWeight: 700 }}>
                  {fmt$(remaining)}
                </span>
              </div>
              <button
                style={{ ...s.smallBtn, marginTop: 6, color: RED }}
                onClick={() => remove(x.id)}
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Costs Tab ───────────────────────────────────────────
function CostsTab({ job, updateJob }) {
  const [form, setForm] = useState({
    description: "",
    amount: "",
    paidByCompany: PARKER_CO,
    date: today(),
    category: "materials",
  });

  const add = () => {
    if (!form.description.trim()) return;
    const c = {
      id: uid(),
      description: form.description.trim(),
      amount: Number(form.amount) || 0,
      paidByCompany: form.paidByCompany,
      date: form.date,
      category: form.category,
    };
    updateJob(job.id, { costs: [...(job.costs || []), c] });
    setForm({
      description: "",
      amount: "",
      paidByCompany: PARKER_CO,
      date: today(),
      category: "materials",
    });
  };

  const remove = (id) => {
    updateJob(job.id, { costs: (job.costs || []).filter((x) => x.id !== id) });
  };

  return (
    <>
      <div style={s.card}>
        <div style={s.label}>Add Cost</div>
        <input
          style={{ ...s.input, marginBottom: 8 }}
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <input
            style={s.input}
            type="number"
            placeholder="Amount"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <input
            style={s.input}
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>
        {!!form.amount && (
          <div style={{
            fontSize: FS.meta, color: T.gold, fontWeight: 700,
            marginBottom: SP[2], fontVariantNumeric: "tabular-nums",
          }}>{fmt$(form.amount)}</div>
        )}
        <select
          style={{ ...s.input, marginBottom: 8 }}
          value={form.paidByCompany}
          onChange={(e) => setForm({ ...form, paidByCompany: e.target.value })}
        >
          <option>{PARKER_CO}</option>
          <option>{PARTNER_CO}</option>
        </select>
        <select
          style={{ ...s.input, marginBottom: 10 }}
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          <option value="materials">Materials</option>
          <option value="equipment">Equipment</option>
          <option value="permit">Permit</option>
          <option value="other">Other</option>
        </select>
        <button style={s.btn(true)} onClick={add}>
          Add Cost
        </button>
      </div>

      <div style={s.card}>
        <div style={s.label}>Costs</div>
        {(job.costs || []).length === 0 && (
          <div style={{ color: "var(--text-muted)", fontSize: 12 }}>No costs logged.</div>
        )}
        {(job.costs || []).map((c) => (
          <div
            key={c.id}
            style={{
              background: "var(--bg-input)",
              borderRadius: 10,
              padding: 12,
              marginBottom: 8,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>
                {c.description}
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: GOLD }}>{fmt$(c.amount)}</div>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {c.date} · {c.category} · {c.paidByCompany}
            </div>
            <button
              style={{ ...s.smallBtn, marginTop: 6, color: RED }}
              onClick={() => remove(c.id)}
            >
              Remove
            </button>
          </div>
        ))}
        <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />
        <Row k={PARKER_CO} v={fmt$(totalCostsByCompany(job, PARKER_CO))} />
        <Row k={PARTNER_CO} v={fmt$(totalCostsByCompany(job, PARTNER_CO))} />
        <Row k="Total" v={fmt$(totalCosts(job))} bold />
      </div>
    </>
  );
}

// ─── Invoices Tab ────────────────────────────────────────
function InvoicesTab({ job, updateJob, onView }) {
  const [creating, setCreating] = useState(false);
  const [billTo, setBillTo] = useState("");
  const [lineItems, setLineItems] = useState([{ desc: "", qty: 1, rate: 0 }]);

  const nextNumber = () => {
    const n = (job.invoices || []).length + 1;
    return "INV-" + String(n).padStart(3, "0");
  };

  const save = () => {
    const items = lineItems.map((li) => ({
      desc: li.desc,
      qty: Number(li.qty) || 0,
      rate: Number(li.rate) || 0,
      amount: (Number(li.qty) || 0) * (Number(li.rate) || 0),
    }));
    const total = items.reduce((s, i) => s + i.amount, 0);
    const inv = {
      id: uid(),
      number: nextNumber(),
      billTo,
      lineItems: items,
      total,
      status: "draft",
      dueDate: "",
      sentAt: null,
    };
    updateJob(job.id, { invoices: [...(job.invoices || []), inv] });
    setCreating(false);
    setBillTo("");
    setLineItems([{ desc: "", qty: 1, rate: 0 }]);
  };

  const setStatus = (id, status) => {
    updateJob(job.id, {
      invoices: (job.invoices || []).map((i) =>
        i.id === id ? { ...i, status, sentAt: status === "sent" ? iso() : i.sentAt } : i
      ),
    });
  };

  const remove = (id) => {
    updateJob(job.id, { invoices: (job.invoices || []).filter((i) => i.id !== id) });
  };

  const exportInvoicePdf = async (inv) => {
    try {
      const JsPdf = await loadJsPdf();
      const doc = new JsPdf();
      doc.setFillColor(201, 150, 58);
      doc.rect(0, 0, 210, 26, "F");
      doc.setTextColor(20, 20, 20);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("FIELDHORSE", 14, 16);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Invoice", 14, 22);

      doc.setTextColor(20, 20, 20);
      let y = 40;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(inv.number, 14, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Bill To: ${inv.billTo || "—"}`, 14, y);
      y += 5;
      doc.text(`Job: ${job.name}`, 14, y);
      y += 5;
      doc.text(`Status: ${inv.status}`, 14, y);
      y += 10;

      // Header row
      doc.setFont("helvetica", "bold");
      doc.text("Description", 14, y);
      doc.text("Qty", 120, y);
      doc.text("Rate", 145, y);
      doc.text("Amount", 180, y, { align: "right" });
      y += 3;
      doc.setDrawColor(200);
      doc.line(14, y, 196, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      (inv.lineItems || []).forEach((li) => {
        doc.text((li.desc || "").slice(0, 50), 14, y);
        doc.text(String(li.qty), 120, y);
        doc.text(fmt$(li.rate), 145, y);
        doc.text(fmt$(li.amount), 196, y, { align: "right" });
        y += 6;
      });
      y += 4;
      doc.line(120, y, 196, y);
      y += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("TOTAL", 120, y);
      doc.text(fmt$(inv.total), 196, y, { align: "right" });

      doc.save(`${inv.number}.pdf`);
    } catch (e) {
      alert("PDF export failed: " + e.message);
    }
  };

  if (creating) {
    return (
      <div style={s.card}>
        <div style={s.label}>New Invoice</div>
        <input
          style={{ ...s.input, marginBottom: 8 }}
          placeholder="Bill to"
          value={billTo}
          onChange={(e) => setBillTo(e.target.value)}
        />
        <div style={{ ...s.label, marginTop: 6 }}>Line Items</div>
        {lineItems.map((li, idx) => (
          <div key={idx} style={{ marginBottom: 8 }}>
            <input
              style={{ ...s.input, marginBottom: 6 }}
              placeholder="Description"
              value={li.desc}
              onChange={(e) => {
                const arr = [...lineItems];
                arr[idx] = { ...li, desc: e.target.value };
                setLineItems(arr);
              }}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              <input
                style={s.input}
                type="number"
                placeholder="Qty"
                value={li.qty}
                onChange={(e) => {
                  const arr = [...lineItems];
                  arr[idx] = { ...li, qty: e.target.value };
                  setLineItems(arr);
                }}
              />
              <input
                style={s.input}
                type="number"
                placeholder="Rate"
                value={li.rate}
                onChange={(e) => {
                  const arr = [...lineItems];
                  arr[idx] = { ...li, rate: e.target.value };
                  setLineItems(arr);
                }}
              />
              <div
                style={{
                  ...s.input,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: GOLD,
                  fontWeight: 800,
                }}
              >
                {fmt$((Number(li.qty) || 0) * (Number(li.rate) || 0))}
              </div>
            </div>
          </div>
        ))}
        <button
          style={{ ...s.smallBtn, marginBottom: 10 }}
          onClick={() => setLineItems([...lineItems, { desc: "", qty: 1, rate: 0 }])}
        >
          + Add Line
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={s.btn(true)} onClick={save}>
            Save Invoice
          </button>
          <button style={s.btn(false)} onClick={() => setCreating(false)}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button style={{ ...s.btn(true), marginBottom: 14 }} onClick={() => setCreating(true)}>
        + New Invoice
      </button>
      {(job.invoices || []).length === 0 && (
        <div style={s.card}>
          <div style={{ color: "var(--text-muted)", fontSize: 12 }}>No invoices yet.</div>
        </div>
      )}
      {(job.invoices || []).map((inv) => {
        const statusColor =
          inv.status === "paid" ? GREEN : inv.status === "sent" ? GOLD : "var(--text-muted)";
        return (
          <div key={inv.id} style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
                {inv.number}
              </div>
              <span
                style={{
                  fontSize: 9,
                  color: statusColor,
                  border: `1px solid ${statusColor}`,
                  padding: "3px 8px",
                  borderRadius: 20,
                  textTransform: "uppercase",
                  fontWeight: 800,
                  letterSpacing: ".08em",
                }}
              >
                {inv.status}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
              Bill to: {inv.billTo || "—"}
            </div>
            <div style={{ fontSize: 16, color: GOLD, fontWeight: 800, marginBottom: 10 }}>
              {fmt$(inv.total)}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <button style={s.smallBtn} onClick={() => onView(inv)}>
                View
              </button>
              <button style={s.smallBtn} onClick={() => exportInvoicePdf(inv)}>
                PDF
              </button>
              <button style={s.smallBtn} onClick={() => setStatus(inv.id, "sent")}>
                Mark Sent
              </button>
              <button style={s.smallBtn} onClick={() => setStatus(inv.id, "paid")}>
                Mark Paid
              </button>
              <button style={{ ...s.smallBtn, color: RED }} onClick={() => remove(inv.id)}>
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
}

function InvoiceModal({ invoice, job, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          color: "#141414",
          borderRadius: 16,
          width: "100%",
          maxWidth: 420,
          maxHeight: "90vh",
          overflowY: "auto",
          fontFamily: "'DM Sans',sans-serif",
        }}
      >
        <div
          style={{
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DK})`,
            padding: "18px 22px",
            color: "#141414",
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "0.05em" }}>FIELDHORSE</div>
          <div style={{ fontSize: 10, fontWeight: 700 }}>INVOICE</div>
        </div>
        <div style={{ padding: 22 }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{invoice.number}</div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 14 }}>
            Job: {job?.name || "—"}
            <br />
            Bill To: {invoice.billTo || "—"}
            <br />
            Status: {invoice.status}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #ddd" }}>
                <th style={{ textAlign: "left", padding: "6px 4px" }}>Description</th>
                <th style={{ textAlign: "right", padding: "6px 4px" }}>Qty</th>
                <th style={{ textAlign: "right", padding: "6px 4px" }}>Rate</th>
                <th style={{ textAlign: "right", padding: "6px 4px" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.lineItems || []).map((li, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "6px 4px" }}>{li.desc}</td>
                  <td style={{ textAlign: "right", padding: "6px 4px" }}>{li.qty}</td>
                  <td style={{ textAlign: "right", padding: "6px 4px" }}>{fmt$(li.rate)}</td>
                  <td style={{ textAlign: "right", padding: "6px 4px" }}>{fmt$(li.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div
            style={{
              background: "#141414",
              color: "#fff",
              borderRadius: 10,
              padding: "14px 18px",
              marginTop: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: "0.1em" }}>TOTAL</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: GOLD }}>{fmt$(invoice.total)}</div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button
              style={{ ...s.btn(true), color: "#141414" }}
              onClick={() => window.print()}
            >
              Print
            </button>
            <button style={{ ...s.btn(false), color: "#141414" }} onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Payments Tab ────────────────────────────────────────
function PaymentsTab({ job, updateJob }) {
  const [form, setForm] = useState({
    amount: "",
    method: "Check",
    refNumber: "",
    fromClient: true,
    fromPartner: false,
    date: today(),
    note: "",
  });

  const add = () => {
    if (!form.amount) return;
    const p = {
      id: uid(),
      amount: Number(form.amount) || 0,
      method: form.method,
      refNumber: form.refNumber,
      fromClient: form.fromClient,
      fromPartner: form.fromPartner,
      date: form.date,
      note: form.note,
    };
    updateJob(job.id, { payments: [...(job.payments || []), p] });
    setForm({
      amount: "",
      method: "Check",
      refNumber: "",
      fromClient: true,
      fromPartner: false,
      date: today(),
      note: "",
    });
  };

  const remove = (id) => {
    updateJob(job.id, { payments: (job.payments || []).filter((p) => p.id !== id) });
  };

  const total = (job.payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);

  return (
    <>
      <div style={s.card}>
        <div style={s.label}>Log Payment</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <input
            style={s.input}
            type="number"
            placeholder="Amount"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <input
            style={s.input}
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>
        {!!form.amount && (
          <div style={{
            fontSize: FS.meta, color: T.gold, fontWeight: 700,
            marginBottom: SP[2], fontVariantNumeric: "tabular-nums",
          }}>{fmt$(form.amount)}</div>
        )}
        <select
          style={{ ...s.input, marginBottom: 8 }}
          value={form.method}
          onChange={(e) => setForm({ ...form, method: e.target.value })}
        >
          <option>Check</option>
          <option>ACH</option>
          <option>Zelle</option>
          <option>Cash</option>
        </select>
        <input
          style={{ ...s.input, marginBottom: 8 }}
          placeholder="Reference #"
          value={form.refNumber}
          onChange={(e) => setForm({ ...form, refNumber: e.target.value })}
        />
        <div style={{ display: "flex", gap: 12, marginBottom: 8, fontSize: 12, color: "var(--text-secondary)" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.fromClient}
              onChange={(e) => setForm({ ...form, fromClient: e.target.checked, fromPartner: e.target.checked ? false : form.fromPartner })}
            />
            From Client
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.fromPartner}
              onChange={(e) => setForm({ ...form, fromPartner: e.target.checked, fromClient: e.target.checked ? false : form.fromClient })}
            />
            From Partner
          </label>
        </div>
        <input
          style={{ ...s.input, marginBottom: 10 }}
          placeholder="Note"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />
        <button style={s.btn(true)} onClick={add}>
          Log Payment
        </button>
      </div>

      <div style={s.card}>
        <div style={s.label}>Payments</div>
        {(job.payments || []).length === 0 && (
          <div style={{ color: "var(--text-muted)", fontSize: 12 }}>No payments logged.</div>
        )}
        {(job.payments || []).map((p) => (
          <div
            key={p.id}
            style={{
              background: "var(--bg-input)",
              borderRadius: 10,
              padding: 12,
              marginBottom: 8,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: GREEN }}>{fmt$(p.amount)}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.date}</div>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {p.method} · {p.refNumber || "—"} · {p.fromClient ? "From Client" : p.fromPartner ? "From Partner" : "—"}
            </div>
            {p.note && <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>{p.note}</div>}
            <button
              style={{ ...s.smallBtn, marginTop: 6, color: RED }}
              onClick={() => remove(p.id)}
            >
              Remove
            </button>
          </div>
        ))}
        <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />
        <Row k="Total" v={fmt$(total)} bold color={GREEN} />
      </div>
    </>
  );
}

// ─── Schedule Tab ────────────────────────────────────────
function ScheduleTab({ job, updateJob }) {
  const [form, setForm] = useState({ title: "", date: today(), time: "", notes: "" });

  const add = () => {
    if (!form.title.trim()) return;
    const item = { id: uid(), ...form, title: form.title.trim() };
    updateJob(job.id, { scheduleItems: [...(job.scheduleItems || []), item] });
    setForm({ title: "", date: today(), time: "", notes: "" });
  };

  const remove = (id) => {
    updateJob(job.id, {
      scheduleItems: (job.scheduleItems || []).filter((x) => x.id !== id),
    });
  };

  return (
    <>
      <div style={s.card}>
        <div style={s.label}>Add Schedule Item</div>
        <input
          style={{ ...s.input, marginBottom: 8 }}
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <input
            style={s.input}
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <input
            style={s.input}
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
          />
        </div>
        <textarea
          style={{ ...s.input, minHeight: 60, marginBottom: 10, resize: "vertical" }}
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <button style={s.btn(true)} onClick={add}>
          Add
        </button>
      </div>

      <div style={s.card}>
        <div style={s.label}>Schedule</div>
        {(job.scheduleItems || []).length === 0 && (
          <div style={{ color: "var(--text-muted)", fontSize: 12 }}>No items scheduled.</div>
        )}
        {(job.scheduleItems || []).map((item) => (
          <div
            key={item.id}
            style={{
              background: "var(--bg-input)",
              borderRadius: 10,
              padding: 12,
              marginBottom: 8,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
              {item.title}
            </div>
            <div style={{ fontSize: 11, color: GOLD }}>
              {item.date} {item.time && `· ${item.time}`}
            </div>
            {item.notes && (
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{item.notes}</div>
            )}
            <button
              style={{ ...s.smallBtn, marginTop: 6, color: RED }}
              onClick={() => remove(item.id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Notes Tab ───────────────────────────────────────────
function NotesTab({ job, updateJob }) {
  return (
    <div style={s.card}>
      <div style={s.label}>Notes</div>
      <textarea
        style={{
          ...s.input,
          minHeight: 300,
          resize: "vertical",
          lineHeight: 1.6,
        }}
        placeholder="Free-form notes about this job…"
        value={job.notes || ""}
        onChange={(e) => updateJob(job.id, { notes: e.target.value })}
      />
    </div>
  );
}
