import React, { useState, useEffect } from "react";
import FieldhorseLogo from "./components/FieldhorseLogo";
import LoginScreen from "./components/LoginScreen";
import Icon from "./components/Icon";
import PartnerTracker from "./screens/PartnerTracker";
import InspectionTracker from "./screens/InspectionTracker";
import { useTheme } from "./context/ThemeContext";
// Design system — tokens, primitives, domain config — single source of truth.
import {
  T, SP, R, FS, LS, MO, FF, ELEV,
  Card, Btn, Input, TextArea, Select, Field, Pill, Stat, SectionHeader, SectionLabel,
  IconButton, Avatar, Badge, TypeBadge, EmptyState, NoAccess, Divider, Page, Row, Toggle,
} from "./ui";
import {
  STATUS_CFG, STATUS_BORDER, TYPE_CFG, MILESTONES, RATES, INSPECTION_TYPES_BY_JOB_TYPE,
} from "./lib/domain";

const LOGO = "data:image/png;base64,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";

// ─── STORAGE ─────────────────────────────────────────────
const S = {
  async get(k) { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } },
  async set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* quota / private mode */ } },
};

// Per-user data key — every user has their own isolated dataset.
// v2 prefix forces a clean slate (abandons any v1 data contaminated with seed content).
const getCurrentDataKey = () => {
  try {
    const u = JSON.parse(localStorage.getItem("fh_current_user") || "null");
    return u?.id ? `fieldcap:data:v2:${u.id}` : null;
  } catch { return null; }
};

// ─── AI CALL ─────────────────────────────────────────────
// All AI requests go through the Netlify Function at /.netlify/functions/ai.
// We hit the function path directly (not the /api/ai rewrite) because the
// rewrite isn't being applied in the deployed environment. The frontend must
// NEVER call api.anthropic.com directly — the API key lives server-side.
async function ai(system, prompt, tokens = 1024) {
  try {
    const r = await fetch("/.netlify/functions/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, prompt, tokens }),
    });
    let d;
    try {
      d = await r.json();
    } catch (e) {
      console.error("[fh-ai] non-JSON response", r.status, e);
      return null;
    }
    if (!r.ok) {
      console.error("[fh-ai] error", r.status, d?.error, d?.detail);
      return null;
    }
    const text = d?.content?.map(b => b.text || "").join("\n") || null;
    if (!text) {
      console.warn("[fh-ai] empty content", d);
    }
    return text;
  } catch (err) {
    console.error("[fh-ai] network failure", err);
    return null;
  }
}

// ─── DEFAULT DATA ────────────────────────────────────────
// Sample data for first-run experience. Realistic, professional contractor scenarios.
const INIT = {
  contacts: [
    { id:"p1", name:"Robin Kumar",      phone:"(615) 555-0142", email:"r.kumar@northstar.com",    job:"Storm damage — roof reinspection",         type:"insurance",       amount:12400, cost:0,     status:"follow-up", notes:"Awaiting supplemental approval from adjuster.",     lastContact:"2026-03-26", photos:[], milestones:[],                                              referredBy:"" },
    { id:"p2", name:"Johnnie Wallace",  phone:"(615) 555-0333", email:"jwallace@cumberland.co",   job:"Garage conversion — 28×22 ADU",            type:"renovation",      amount:28500, cost:14200, status:"active",    notes:"Framing complete, electrical rough-in scheduled.",  lastContact:"2026-03-28", photos:[], milestones:["Demo complete","Framing complete"],                referredBy:"John Johnson" },
    { id:"p3", name:"Sarah Probst",     phone:"(615) 555-0271", email:"sarah.probst@gmail.com",   job:"Three-car detached garage build",          type:"new-construction",amount:45000, cost:0,     status:"follow-up", notes:"Three-tier proposal delivered, awaiting decision.", lastContact:"2026-03-22", photos:[], milestones:[],                                              referredBy:"" },
    { id:"p4", name:"John Johnson",     phone:"(615) 555-0198", email:"jjohnson@example.com",     job:"Master suite addition with full bath",     type:"renovation",      amount:32000, cost:15800, status:"active",    notes:"On schedule. Drywall delivery confirmed Tuesday.",  lastContact:"2026-03-27", photos:[], milestones:["Demo complete","Framing complete","Electrical rough-in"], referredBy:"" },
    { id:"p5", name:"Wendy Calhoun",    phone:"(615) 555-0312", email:"wendy.calhoun@gmail.com",  job:"Kitchen and powder room remodel",          type:"renovation",      amount:18400, cost:0,     status:"follow-up", notes:"Final scope and finish selections needed.",         lastContact:"2026-03-25", photos:[], milestones:[],                                              referredBy:"" },
    { id:"p6", name:"David Park",       phone:"(615) 555-0501", email:"david.park@parkhome.io",   job:"Backyard patio with cedar pergola",        type:"outdoor-living",  amount:14200, cost:0,     status:"new",       notes:"Initial walkthrough Tuesday morning.",              lastContact:"2026-03-25", photos:[], milestones:[],                                              referredBy:"" },
    { id:"p7", name:"Mark Stevens",     phone:"(615) 555-0677", email:"mstevens@stevenshvac.com", job:"Driveway, walkway, and front step pour",   type:"concrete",        amount:9800,  cost:4200,  status:"active",    notes:"Pour scheduled Thursday, weather permitting.",      lastContact:"2026-03-29", photos:[], milestones:["Demo complete","Grade complete"],                  referredBy:"Johnnie Wallace" },
  ],
  notes: [
    { id:"n1", text:"Send Wendy the kitchen and powder room proposal with three pricing tiers.",       job:"Wendy Calhoun",   action:"Send proposal",        when:"ASAP",      cat:"Quote",     time:"Today",     done:false },
    { id:"n2", text:"Call adjuster on Robin Kumar storm-damage supplemental — confirm decking allowance.", job:"Robin Kumar",     action:"Call adjuster",        when:"Tomorrow",  cat:"Insurance", time:"Today",     done:false },
    { id:"n3", text:"Confirm Thursday concrete pour with Stevens driveway crew and verify rebar delivery.", job:"Mark Stevens",    action:"Confirm crew schedule",when:"This week", cat:"Schedule",  time:"Yesterday", done:false },
  ],
  messages: [],
  subs: [
    { id:"s1", name:"Ramirez Framing",     trade:"Framing",    phone:"(615) 555-0811", activeJob:"John Johnson",     status:"on-site",   rate:"$4.50 / lf" },
    { id:"s2", name:"TN Electrical Co.",   trade:"Electrical", phone:"(615) 555-0922", activeJob:"Johnnie Wallace",  status:"scheduled", rate:"$180 / point" },
    { id:"s3", name:"Cumberland Concrete", trade:"Concrete",   phone:"(615) 555-0755", activeJob:"Mark Stevens",     status:"on-site",   rate:"$9 / sqft" },
  ],
  weeklyTarget: 45000,
  mileageLog: [
    { id:"m1", job:"John Johnson",  miles:12, date:"2026-04-07", notes:"Job-site walkthrough and material check." },
    { id:"m2", job:"Mark Stevens",  miles:8,  date:"2026-04-08", notes:"Morning grade verification before pour." },
  ],
  referrals: [],
  scheduled: [
    { id:"ev1", job:"Wendy Calhoun",   desc:"Deliver kitchen proposal in person",        day:0, time:"10:00 AM", date:"" },
    { id:"ev2", job:"Robin Kumar",     desc:"Call adjuster on supplemental claim",       day:1, time:"2:00 PM",  date:"" },
    { id:"ev3", job:"John Johnson",    desc:"Drywall delivery and electrical inspection",day:2, time:"9:00 AM",  date:"" },
    { id:"ev4", job:"Johnnie Wallace", desc:"Review revised ADU floor plan changes",     day:0, time:"3:30 PM",  date:"" },
    { id:"ev5", job:"Mark Stevens",    desc:"Concrete pour — driveway and walkway",      day:3, time:"7:30 AM",  date:"" },
    { id:"ev6", job:"David Park",      desc:"Initial site walkthrough for pergola",      day:4, time:"11:00 AM", date:"" },
  ],
};

// Blank starting state for all non-Jesse users.
// Partner/Inspect data lives in Supabase (already scoped by owner).
const BLANK_INIT = {
  contacts: [], notes: [], messages: [], subs: [],
  mileageLog: [], referrals: [], scheduled: [], weeklyTarget: 45000,
};

// Domain config (STATUS_CFG / TYPE_CFG / MILESTONES / RATES / INSPECTION_TYPES_BY_JOB_TYPE)
// is now imported from ./lib/domain. UI primitives + tokens come from ./ui.


// ─── WEATHER WIDGET ──────────────────────────────────────
function WeatherWidget() {
  const [wx, setWx] = useState(null);
  useEffect(() => {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=35.8456&longitude=-86.3903&current=temperature_2m,weathercode,windspeed_10m&temperature_unit=fahrenheit&windspeed_unit=mph")
      .then(r=>r.json()).then(d => {
        const code = d.current?.weathercode;
        const iconName = code===0 ? "sun" : code<=3 ? "cloud" : code<=67 ? "cloudRain" : code<=77 ? "cloudSnow" : "cloudRain";
        setWx({ temp: Math.round(d.current?.temperature_2m), wind: Math.round(d.current?.windspeed_10m), iconName, label: code===0?"Clear":code<=3?"Partly cloudy":code<=67?"Rainy":code<=77?"Snow":"Stormy" });
      }).catch(()=>setWx({ temp:72, wind:8, iconName:"cloud", label:"Partly cloudy" }));
  }, []);

  const pourable = wx && wx.temp > 45 && !["Rainy","Stormy","Snow"].includes(wx.label);

  if (!wx) return (
    <div style={{
      background:"rgba(255,255,255,.04)",
      borderRadius:R.md,
      padding:`${SP[4]}px ${SP[5]}px`,
      border:"1px solid rgba(255,255,255,.08)",
      color:"rgba(255,255,255,.4)",
      fontSize:FS.body,
    }}>Loading weather…</div>
  );

  return (
    <div style={{
      background:"rgba(255,255,255,.035)",
      borderRadius:R.md,
      padding:`${SP[3]+1}px ${SP[4]}px`,
      border:"1px solid rgba(255,255,255,.07)",
      display:"flex", alignItems:"center", gap:SP[4],
    }}>
      <div style={{ color:"#fff", opacity:.85, flexShrink:0 }}>
        <Icon name={wx.iconName} size={26} stroke={1.4} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          color:"#fff", fontWeight:700, fontSize:FS.h2,
          letterSpacing:LS.tight, lineHeight:1,
          fontVariantNumeric:"tabular-nums",
        }}>{wx.temp}°<span style={{
          color:"rgba(255,255,255,.5)", fontSize:FS.lead, fontWeight:500,
          marginLeft:SP[2], letterSpacing:0,
        }}>{wx.label}</span></div>
        <div style={{
          color:"rgba(255,255,255,.4)", fontSize:FS.meta,
          marginTop:SP[1]+2, fontVariantNumeric:"tabular-nums",
        }}>
          Wind {wx.wind} mph · Murfreesboro, TN
        </div>
      </div>
      <div style={{
        background: pourable ? "rgba(45,122,79,.18)" : "rgba(192,57,43,.18)",
        border:`1px solid ${pourable ? "rgba(45,122,79,.45)" : "rgba(192,57,43,.45)"}`,
        borderRadius:R.sm,
        padding:`${SP[1]+1}px ${SP[2]+2}px`,
        textAlign:"center", flexShrink:0,
      }}>
        <div style={{
          color: pourable ? "#6EC98A" : "#E87E74",
          fontSize:FS.meta-1, fontWeight:800, letterSpacing:LS.uppercase,
          textTransform:"uppercase", lineHeight:1,
        }}>{pourable ? "Good" : "Poor"}</div>
        <div style={{
          color:"rgba(255,255,255,.35)", fontSize:FS.meta-3,
          letterSpacing:LS.uppercase, textTransform:"uppercase",
          marginTop:SP[1], lineHeight:1,
        }}>Conditions</div>
      </div>
    </div>
  );
}

// ─── MORNING BRIEF ───────────────────────────────────────
function MorningBrief({ data, currentUser }) {
  const contacts = data.contacts || [];
  const target = data.weeklyTarget || 45000;
  const activeRevenue = contacts.filter(c=>c.status==="active").reduce((s,c)=>s+(c.amount||0),0);
  const pipeline = contacts.reduce((s,c)=>s+(c.amount||0),0);
  const followUps = contacts.filter(c=>c.status==="follow-up");
  const pct = Math.min(100, Math.round((activeRevenue/target)*100));
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const now = new Date();
  const firstName = (currentUser?.name || "").split(" ")[0] || "Jesse";

  // Stat tile (dark surface variant)
  const StatTile = ({ label, value, accent }) => (
    <div style={{
      background:"rgba(255,255,255,.035)",
      border:"1px solid rgba(255,255,255,.07)",
      borderRadius:R.md,
      padding:`${SP[3]+1}px ${SP[3]+1}px`,
      minWidth:0,
    }}>
      <div style={{
        fontSize:FS.h1, fontWeight:700, color: accent || "#fff",
        fontFamily:FF.sans, letterSpacing:LS.tight, lineHeight:1,
        fontVariantNumeric:"tabular-nums",
        whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
      }}>{value}</div>
      <div style={{
        fontSize:FS.meta-1, fontWeight:700, color:"rgba(255,255,255,.45)",
        textTransform:"uppercase", letterSpacing:LS.uppercase,
        marginTop:SP[2]+1,
        lineHeight:1,
      }}>{label}</div>
    </div>
  );

  return (
    <section style={{
      background:"linear-gradient(160deg, #141414 0%, #1a1508 100%)",
      padding:`${SP[6]}px ${SP[5]}px ${SP[5]+SP[1]}px`,
      position:"relative", overflow:"hidden",
      borderBottom:"1px solid rgba(201,150,58,.18)",
      boxShadow:"0 1px 0 rgba(201,150,58,.05)",
    }}>
      {/* Radial gold glow */}
      <div style={{
        position:"absolute", top:-100, right:-80,
        width:340, height:340,
        background:"radial-gradient(circle, rgba(201,150,58,0.12) 0%, transparent 65%)",
        pointerEvents:"none",
      }} />

      {/* Greeting */}
      <div style={{ marginBottom:SP[5], position:"relative" }}>
        <div style={{
          fontSize:FS.meta, color:"rgba(255,255,255,.38)",
          fontWeight:600, letterSpacing:LS.uppercase,
          textTransform:"uppercase", marginBottom:SP[2]+1,
          lineHeight:1,
        }}>{days[now.getDay()]}, {months[now.getMonth()]} {now.getDate()}</div>
        <div style={{
          fontFamily:FF.display, fontSize:42, fontWeight:400,
          color:"#fff", lineHeight:.92, letterSpacing:LS.tight,
        }}>
          Good morning,<br/>
          <span style={{ color:T.gold }}>{firstName}.</span>
        </div>
      </div>

      <WeatherWidget />

      {/* Weekly target bar */}
      <div style={{ marginTop:SP[5], position:"relative" }}>
        <div style={{
          display:"flex", justifyContent:"space-between",
          alignItems:"center", marginBottom:SP[2]+1,
        }}>
          <span style={{
            fontSize:FS.meta-1, color:"rgba(255,255,255,.5)",
            fontWeight:700, letterSpacing:LS.uppercase, textTransform:"uppercase",
            lineHeight:1,
          }}>Weekly Target</span>
          <span style={{
            fontSize:FS.body, color:"#fff", fontWeight:700, letterSpacing:LS.tight,
            fontVariantNumeric:"tabular-nums", lineHeight:1,
          }}>
            ${(activeRevenue/1000).toFixed(0)}K
            <span style={{ color:"rgba(255,255,255,.3)", fontWeight:500 }}> / ${(target/1000).toFixed(0)}K</span>
          </span>
        </div>
        <div style={{
          height:5, background:"rgba(255,255,255,.07)",
          borderRadius:R.full, overflow:"hidden",
        }}>
          <div style={{
            width:`${pct}%`, height:"100%",
            background:`linear-gradient(90deg, ${T.goldDk}, ${T.gold})`,
            borderRadius:R.full,
            transition:`width ${MO.slow}`,
          }} />
        </div>
        <div style={{
          fontSize:FS.meta,
          color: activeRevenue >= target ? "#6EC98A" : "rgba(255,255,255,.4)",
          marginTop:SP[2], fontWeight: activeRevenue >= target ? 700 : 500,
          fontVariantNumeric:"tabular-nums",
        }}>
          {activeRevenue >= target
            ? `${pct}% · $${((activeRevenue - target)/1000).toFixed(0)}K over target`
            : `${pct}% · $${((target - activeRevenue)/1000).toFixed(0)}K to go`}
        </div>
      </div>

      {/* Stat tiles — two stats only. Pipeline and Active carry full weight. */}
      <div style={{
        display:"grid", gridTemplateColumns:"1fr 1fr",
        gap:SP[2], marginTop:SP[5], position:"relative",
      }}>
        <StatTile label="Pipeline" value={`$${(pipeline/1000).toFixed(0)}K`} accent={T.gold} />
        <StatTile label="Active Jobs" value={contacts.filter(c=>c.status==="active").length} accent="#6EC98A" />
      </div>

      {followUps.length > 0 && (
        <div style={{
          marginTop:SP[4],
          background:"rgba(201,150,58,.08)",
          border:"1px solid rgba(201,150,58,.22)",
          borderRadius:R.md,
          padding:`${SP[3]}px ${SP[4]}px ${SP[3]+1}px`,
          position:"relative",
        }}>
          <div style={{
            fontSize:FS.meta-2, fontWeight:700, color:T.gold,
            letterSpacing:LS.uppercase, textTransform:"uppercase",
            marginBottom:SP[2],
            lineHeight:1,
          }}>Today's Priorities</div>
          {followUps.slice(0,3).map(c => (
            <div key={c.id} style={{
              display:"flex", alignItems:"center", gap:SP[2]+1,
              padding:`${SP[1]}px 0`,
            }}>
              <div style={{
                width:5, height:5, borderRadius:R.full,
                background:T.gold, flexShrink:0,
              }} />
              <span style={{ fontSize:FS.body, color:"#fff" }}>{c.name}</span>
              <span style={{ fontSize:FS.meta, color:"rgba(255,255,255,.45)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>· {c.job}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── HOME SCREEN ─────────────────────────────────────────
function HomeScreen({ data, setScreen, setSel, currentUser }) {
  const contacts = data.contacts || [];
  const notes = (data.notes||[]).filter(n=>!n.done);
  const subs = data.subs || [];

  // Quick action card — uses Icon, single padding, top accent line
  const QA = ({ iconName, title, sub, color, onClick, badge }) => (
    <button
      onClick={onClick}
      style={{
        background:T.bgCard,
        borderRadius:R.lg,
        padding:`${SP[5]}px ${SP[4]}px ${SP[4]+1}px`,
        border:`1px solid ${T.border}`,
        cursor:"pointer", textAlign:"left", width:"100%",
        position:"relative", overflow:"hidden",
        fontFamily:FF.sans,
        transition:`border-color ${MO.fast}, transform ${MO.fast}, background ${MO.fast}`,
      }}
      onMouseEnter={(e)=>{
        e.currentTarget.style.borderColor = "rgba(201,150,58,.35)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e)=>{
        e.currentTarget.style.borderColor = T.border;
        e.currentTarget.style.transform = "translateY(0)";
      }}
      onMouseDown={(e)=>{ e.currentTarget.style.transform="scale(.98)"; }}
      onMouseUp={(e)=>{ e.currentTarget.style.transform="translateY(-1px)"; }}
    >
      <div style={{
        position:"absolute", top:0, left:0, right:0, height:2,
        background:`linear-gradient(90deg, ${color} 0%, transparent 70%)`,
      }} />
      {badge != null && (
        <span style={{
          position:"absolute", top:SP[3], right:SP[3],
          background:T.red, color:"#fff",
          fontSize:FS.meta-2, fontWeight:700,
          padding:"2px 6px", borderRadius:R.full,
          letterSpacing:LS.tight,
          fontVariantNumeric:"tabular-nums",
        }}>{badge}</span>
      )}
      <div style={{
        width:36, height:36,
        background:color+"1a",
        borderRadius:R.sm,
        border:`1px solid ${color}33`,
        display:"flex", alignItems:"center", justifyContent:"center",
        color, marginBottom:SP[3]+1,
      }}>
        <Icon name={iconName} size={18} />
      </div>
      <div style={{
        fontSize:FS.lead, fontWeight:700, color:T.text,
        marginBottom:SP[1]+1, letterSpacing:LS.tight,
        lineHeight:1.2,
      }}>{title}</div>
      <div style={{ fontSize:FS.meta, color:T.textSecondary, lineHeight:1.4 }}>{sub}</div>
    </button>
  );

  // Note category styles — single source
  const NOTE_CAT = {
    Insurance: { color:T.red, bg:T.redLt, border:T.redBorder },
    Quote:     { color:T.gold, bg:T.goldBg, border:T.goldBorder },
    Call:      { color:T.green, bg:T.greenLt, border:T.greenBorder },
    Schedule:  { color:T.teal, bg:T.tealLt, border:"rgba(32,160,154,.4)" },
    "Follow Up": { color:T.amber, bg:T.amberLt, border:T.amberBorder },
    Material:  { color:T.purple, bg:T.purpleLt, border:"rgba(124,58,237,.4)" },
    Other:     { color:T.textSecondary, bg:T.borderSubtle, border:T.border },
  };
  const noteStyle = (cat) => NOTE_CAT[cat] || NOTE_CAT.Other;

  return (
    <div>
      <MorningBrief data={data} currentUser={currentUser} />

      <div style={{ padding:`${SP[5]+SP[1]}px ${SP[5]}px ${SP[5]}px` }}>
        <SectionHeader>Quick Actions</SectionHeader>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:SP[3], marginBottom:SP[3] }}>
          <QA iconName="note"      title="Field Notes"   sub="AI-parsed capture"     color={T.gold}   onClick={()=>setScreen("capture")} />
          <QA iconName="briefcase" title="Jobs & CRM"    sub="Full pipeline"          color={T.green}  onClick={()=>setScreen("leads")} badge={contacts.filter(c=>c.status==="follow-up").length||null} />
          <QA iconName="clipboard" title="AI Bid Engine" sub="With your rate card"    color={T.purple} onClick={()=>setScreen("bid")} />
          <QA iconName="message"   title="AI Compose"    sub="Texts, emails, scripts" color={T.blue}   onClick={()=>setScreen("compose")} />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:SP[3], marginBottom:SP[6] }}>
          <QA iconName="calendar" title="Schedule" sub="7-day view"                                  color={T.teal} onClick={()=>setScreen("schedule")} />
          <QA iconName="wrench"   title="Subs"     sub={`${subs.filter(s=>s.status==="on-site").length} on site`} color={T.amber} onClick={()=>setScreen("subs")} />
          <QA iconName="barChart" title="CEO View" sub="Revenue & stats"                              color={T.red}  onClick={()=>setScreen("analytics")} />
        </div>

        {notes.length > 0 && (
          <>
            <SectionHeader action={
              <button
                onClick={()=>setScreen("capture")}
                style={{
                  background:"none", border:"none", padding:0, cursor:"pointer",
                  color:T.gold, fontSize:FS.meta, fontWeight:700,
                  letterSpacing:LS.label, textTransform:"uppercase",
                  fontFamily:FF.sans,
                  display:"inline-flex", alignItems:"center", gap:SP[1],
                }}
              >See all <Icon name="arrowRight" size={14} stroke={2} /></button>
            }>Open Notes</SectionHeader>
            <div style={{ display:"flex", flexDirection:"column", gap:SP[2], marginBottom:SP[6] }}>
              {notes.slice(0,3).map(n=>{
                const ns = noteStyle(n.cat);
                return (
                  <Card key={n.id} accent={ns.color} style={{ padding:`${SP[3]+1}px ${SP[4]}px` }}>
                    <div style={{ fontSize:FS.body, fontWeight:600, color:T.text, marginBottom:SP[2], lineHeight:1.4 }}>{n.text}</div>
                    <div style={{ display:"flex", gap:SP[2], alignItems:"center" }}>
                      <span style={{ fontSize:FS.meta, fontWeight:600, color:T.gold }}>{n.job}</span>
                      <span style={{ width:3, height:3, borderRadius:R.full, background:T.textMuted }} />
                      <span style={{ fontSize:FS.meta, color:T.textSecondary }}>{n.when}</span>
                      <span style={{
                        marginLeft:"auto",
                        background:ns.bg, color:ns.color, border:`1px solid ${ns.border}`,
                        fontSize:FS.meta-2, fontWeight:700,
                        padding:"2px 8px", borderRadius:R.full,
                        textTransform:"uppercase", letterSpacing:LS.label,
                      }}>{n.cat}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        <SectionHeader action={
          <button
            onClick={()=>setScreen("leads")}
            style={{
              background:"none", border:"none", padding:0, cursor:"pointer",
              color:T.gold, fontSize:FS.meta, fontWeight:700,
              letterSpacing:LS.label, textTransform:"uppercase",
              fontFamily:FF.sans,
              display:"inline-flex", alignItems:"center", gap:SP[1],
            }}
          >View all <Icon name="arrowRight" size={14} stroke={2} /></button>
        }>Customer Queue</SectionHeader>
        <div style={{ display:"flex", flexDirection:"column", gap:SP[2] }}>
          {contacts.filter(c=>["follow-up","new"].includes(c.status)).slice(0,5).map(c=>(
            <Card key={c.id} interactive style={{ padding:`${SP[3]+1}px ${SP[4]}px`, cursor:"pointer" }} onClick={()=>{ setSel(c); setScreen("detail"); }}>
              <div style={{ display:"flex", alignItems:"center", gap:SP[3] }}>
                <Avatar name={c.name} size={40} type={c.type} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:FS.lead, fontWeight:700, color:T.text, letterSpacing:LS.tight }}>{c.name}</div>
                  <div style={{ fontSize:FS.meta, color:T.textSecondary, marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                    {c.job} <span style={{ color:T.textMuted }}>· ${c.amount?.toLocaleString()}</span>
                  </div>
                </div>
                <Badge s={c.status} />
              </div>
            </Card>
          ))}
          {contacts.filter(c=>["follow-up","new"].includes(c.status)).length === 0 && (
            <EmptyState title="Nothing in queue" body="Customers needing follow-up will appear here." />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CAPTURE / NOTES ────────────────────────────────────
function CaptureScreen({ data, setData }) {
  const [inp, setInp] = useState(""); const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState(null); const [saved, setSaved] = useState(false);
  const contacts = data.contacts || [];
  const notes = data.notes || [];

  const parse = async () => {
    if (!inp.trim()) return;
    setLoading(true); setParsed(null);
    const jobs = contacts.map(c=>c.name).join(", ");
    const r = await ai("Return ONLY valid JSON, no markdown.", `Parker Construction jobs: ${jobs}. Note: "${inp}". Extract: {"job":"client name or General","action":"1 sentence","when":"Today/Tomorrow/ASAP/This week","category":"Call|Quote|Insurance|Schedule|Follow Up|Material|Inspection|Other"}`);
    try { setParsed(JSON.parse((r||"{}").replace(/```json|```/g,"").trim())); }
    catch { setParsed({ job:"General", action:inp, when:"ASAP", category:"Other" }); }
    setLoading(false);
  };

  const save = async () => {
    const note = { id:"n"+Date.now(), text:inp, job:parsed?.job||"General", action:parsed?.action||inp, when:parsed?.when||"ASAP", cat:parsed?.category||"Other", time:"Just now", done:false };
    const updated = { ...data, notes:[note,...notes] };
    await S.set(getCurrentDataKey(), updated); setData(updated);
    setInp(""); setParsed(null); setSaved(true); setTimeout(()=>setSaved(false),2000);
  };

  const toggle = async (id) => {
    const updated = { ...data, notes:notes.map(n=>n.id===id?{...n,done:!n.done}:n) };
    await S.set(getCurrentDataKey(), updated); setData(updated);
  };

  const del = async (id) => {
    const updated = { ...data, notes:notes.filter(n=>n.id!==id) };
    await S.set(getCurrentDataKey(), updated); setData(updated);
  };

  const CAT_COLOR = {
    Insurance:T.red, Quote:T.gold, Call:T.green, Schedule:T.teal,
    "Follow Up":T.amber, Material:T.purple, Inspection:T.textSecondary, Other:T.textMuted,
  };
  const openCount = notes.filter(n=>!n.done).length;

  return (
    <Page>
      {/* Capture composer */}
      <Card padded accent={T.gold} style={{ marginBottom:SP[5] }}>
        <SectionHeader>Quick Capture</SectionHeader>
        <TextArea
          value={inp}
          onChange={e=>setInp(e.target.value)}
          rows={3}
          placeholder={"Brain dump. AI parses to a structured note.\nExample: call adjuster on Robin Kumar job tomorrow."}
        />
        <div style={{ marginTop:SP[3] }}>
          <Btn variant="primary" full disabled={loading||!inp.trim()} onClick={parse}>
            {loading ? "Parsing…" : "Parse with AI"}
          </Btn>
        </div>
        {parsed && (
          <div style={{
            marginTop:SP[3],
            background:T.bgSection,
            borderRadius:R.md,
            padding:SP[4],
            border:`1px solid ${T.border}`,
          }}>
            {[["Job",parsed.job],["Action",parsed.action],["When",parsed.when],["Category",parsed.category]].map(([k,v])=>(
              <div key={k} style={{
                display:"flex", justifyContent:"space-between",
                padding:`${SP[1]+2}px 0`,
                fontSize:FS.body,
              }}>
                <span style={{
                  color:T.textMuted,
                  fontSize:FS.meta-1, fontWeight:700,
                  textTransform:"uppercase", letterSpacing:LS.uppercase,
                }}>{k}</span>
                <span style={{ color:T.text, fontWeight:600, maxWidth:"65%", textAlign:"right" }}>{v}</span>
              </div>
            ))}
            <div style={{ display:"flex", gap:SP[2], marginTop:SP[3] }}>
              <Btn variant="ghost" size="sm" onClick={()=>setParsed(null)}>Edit</Btn>
              <Btn variant="primary" size="sm" full onClick={save} leftIcon={saved ? <Icon name="check" size={14} stroke={2.5} /> : null}>
                {saved ? "Saved" : "Save Note"}
              </Btn>
            </div>
          </div>
        )}
      </Card>

      <SectionHeader action={
        <span style={{
          fontSize:FS.meta-1, color:T.textMuted, fontWeight:700,
          letterSpacing:LS.uppercase, textTransform:"uppercase",
        }}>{openCount} open</span>
      }>All Notes</SectionHeader>

      <div style={{ display:"flex", flexDirection:"column", gap:SP[2] }}>
        {notes.length===0 && (
          <EmptyState
            icon={<Icon name="note" size={32} />}
            title="No notes yet"
            body="Capture a thought above. AI will parse it into a structured note."
          />
        )}
        {notes.map(n => {
          const c = CAT_COLOR[n.cat] || T.textSecondary;
          return (
            <Card key={n.id} accent={c} style={{ padding:`${SP[3]+1}px ${SP[4]}px`, opacity: n.done ? 0.5 : 1 }}>
              <div style={{
                fontSize:FS.body, fontWeight:600, color:T.text,
                marginBottom:SP[2],
                textDecoration: n.done ? "line-through" : "none",
                lineHeight:1.4,
              }}>{n.text}</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", gap:SP[2], alignItems:"center", minWidth:0 }}>
                  <span style={{ fontSize:FS.meta, fontWeight:700, color:T.gold, whiteSpace:"nowrap" }}>{n.job}</span>
                  <span style={{ width:3, height:3, borderRadius:R.full, background:T.textMuted }} />
                  <span style={{ fontSize:FS.meta, color:T.textSecondary }}>{n.when}</span>
                  <span style={{
                    background:c+"1a", color:c, border:`1px solid ${c}33`,
                    fontSize:FS.meta-2, fontWeight:700,
                    padding:"3px 9px", borderRadius:R.full,
                    textTransform:"uppercase", letterSpacing:LS.label,
                  }}>{n.cat}</span>
                </div>
                <div style={{ display:"flex", gap:SP[1], marginLeft:SP[2] }}>
                  <button
                    onClick={()=>toggle(n.id)}
                    aria-label={n.done ? "Reopen" : "Mark done"}
                    style={{
                      background:"none", border:"none", padding:SP[2], cursor:"pointer",
                      color: n.done ? T.textMuted : T.green,
                      display:"flex", alignItems:"center",
                    }}
                  ><Icon name="check" size={16} stroke={2.5} /></button>
                  <button
                    onClick={()=>del(n.id)}
                    aria-label="Delete"
                    style={{
                      background:"none", border:"none", padding:SP[2], cursor:"pointer",
                      color:T.textMuted,
                      display:"flex", alignItems:"center",
                    }}
                  ><Icon name="trash" size={16} /></button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </Page>
  );
}

// ─── LEADS / CRM ─────────────────────────────────────────
function LeadsScreen({ data, setData, setScreen, setSel }) {
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name:"", phone:"", email:"", job:"", type:"renovation", amount:"", cost:"", status:"new", notes:"", referredBy:"" });
  const contacts = data.contacts || [];
  const filtered = filter==="all" ? contacts : contacts.filter(c=>c.status===filter);

  const add = async () => {
    if (!form.name.trim()) return;
    const c = { ...form, id:"c"+Date.now(), amount:parseInt(form.amount)||0, cost:parseInt(form.cost)||0, lastContact:new Date().toISOString().split("T")[0], photos:[], milestones:[] };
    const updated = { ...data, contacts:[...contacts, c] };
    await S.set(getCurrentDataKey(), updated); setData(updated);
    setForm({ name:"", phone:"", email:"", job:"", type:"renovation", amount:"", cost:"", status:"new", notes:"", referredBy:"" }); setShowAdd(false);
  };

  const pipelineTotal = contacts.reduce((s,c)=>s+(c.amount||0),0);
  const activeCount = contacts.filter(c=>c.status==="active").length;
  const wonYTD = contacts.filter(c=>c.status==="won").reduce((s,c)=>s+(c.amount||0),0);
  const withCost = contacts.filter(c=>c.cost>0);
  const totalRev = withCost.reduce((s,c)=>s+(c.amount||0),0);
  const totalCost = withCost.reduce((s,c)=>s+(c.cost||0),0);
  const avgMargin = totalRev > 0 ? Math.round(((totalRev-totalCost)/totalRev)*100) : 0;

  const STATUS_BORDER = { active:T.green, "follow-up":T.gold, new:T.blue, won:T.green, lost:T.red, pending:T.purple };
  const FILTERS = ["all","new","active","follow-up","won","lost"];

  return (
    <div style={{ padding:`${SP[5]}px ${SP[5]}px ${SP[2]}px` }}>
      {/* Pipeline strip — uses Stat primitive. First stat gets a gold top bar
          to mark it as the headline number. */}
      <div style={{
        background:T.bgCard,
        border:`1px solid ${T.border}`,
        borderRadius:R.lg,
        marginBottom:SP[4],
        display:"grid",
        gridTemplateColumns:"1fr 1fr 1fr 1fr",
        overflow:"hidden",
        position:"relative",
      }}>
        <div style={{
          position:"absolute", top:0, left:0,
          width:"25%", height:2,
          background:`linear-gradient(90deg, ${T.gold} 0%, rgba(201,150,58,0) 100%)`,
        }} />
        {[
          { label:"Pipeline",   value:`$${(pipelineTotal/1000).toFixed(0)}K`, accent:T.gold },
          { label:"Active",     value:activeCount, accent:"#6EC98A" },
          { label:"Avg Margin", value:`${avgMargin}%`, accent: avgMargin>25 ? "#6EC98A" : avgMargin>15 ? T.gold : "#E87E74" },
          { label:"Won YTD",    value:`$${(wonYTD/1000).toFixed(0)}K`, accent:T.gold },
        ].map((s,i,arr)=>(
          <div key={s.label} style={{
            borderRight: i<arr.length-1 ? `1px solid ${T.border}` : "none",
          }}>
            <Stat label={s.label} value={s.value} accent={s.accent} align="center" />
          </div>
        ))}
      </div>

      {/* Filter row */}
      <div style={{ display:"flex", gap:SP[2], marginBottom:SP[4], overflowX:"auto", paddingBottom:SP[1] }}>
        {FILTERS.map(f => (
          <Pill
            key={f}
            active={filter===f}
            onClick={()=>setFilter(f)}
            count={f==="all" ? null : contacts.filter(c=>c.status===f).length}
          >{f}</Pill>
        ))}
      </div>

      {/* Add contact button */}
      <Btn
        variant="primary"
        full
        onClick={()=>setShowAdd(!showAdd)}
        leftIcon={<Icon name={showAdd ? "x" : "plus"} size={16} stroke={2} />}
        style={{ marginBottom:SP[3] }}
      >{showAdd ? "Cancel" : "New Contact"}</Btn>

      {showAdd && (
        <Card padded style={{ padding:SP[4], marginBottom:SP[4] }}>
          <div style={{ display:"flex", flexDirection:"column", gap:SP[3] }}>
            <Field label="Full name">
              <Input placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
            </Field>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:SP[3] }}>
              <Field label="Phone">
                <Input placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} />
              </Field>
              <Field label="Email">
                <Input placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
              </Field>
            </div>
            <Field label="Job / Project">
              <Input placeholder="Project description" value={form.job} onChange={e=>setForm({...form,job:e.target.value})} />
            </Field>
            <Field label="Type">
              <Select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                {Object.entries(TYPE_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </Select>
            </Field>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:SP[3] }}>
              <Field label="Contract $">
                <Input placeholder="0" type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} />
              </Field>
              <Field label="Est. cost $">
                <Input placeholder="0" type="number" value={form.cost} onChange={e=>setForm({...form,cost:e.target.value})} />
              </Field>
            </div>
            <Field label="Referred by">
              <Input placeholder="Optional" value={form.referredBy} onChange={e=>setForm({...form,referredBy:e.target.value})} />
            </Field>
            <Field label="Notes">
              <TextArea placeholder="Notes" rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
            </Field>
            <Btn variant="primary" full onClick={add}>Save Contact</Btn>
          </div>
        </Card>
      )}

      {/* Job list */}
      <div style={{ display:"flex", flexDirection:"column", gap:SP[2] }}>
        {filtered.map(c=>{
          const margin = c.cost > 0 ? Math.round(((c.amount-c.cost)/c.amount)*100) : null;
          return (
            <Card
              key={c.id}
              accent={STATUS_BORDER[c.status]||T.blue}
              interactive
              style={{ padding:`${SP[3]+1}px ${SP[4]}px`, cursor:"pointer" }}
              onClick={()=>{ setSel(c); setScreen("detail"); }}
            >
              <div style={{ display:"flex", alignItems:"center", gap:SP[3] }}>
                <Avatar name={c.name} size={40} type={c.type} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:FS.lead, fontWeight:700, color:T.text, letterSpacing:LS.tight }}>{c.name}</div>
                  <div style={{
                    fontSize:FS.meta, color:T.textSecondary, marginTop:2,
                    whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                  }}>{c.job}</div>
                  <div style={{ display:"flex", gap:SP[1]+2, marginTop:SP[2], alignItems:"center", flexWrap:"wrap" }}>
                    <TypeBadge t={c.type} />
                    {margin !== null && (
                      <span style={{
                        background: margin>30 ? T.greenLt : margin>15 ? T.amberLt : T.redLt,
                        color: margin>30 ? T.green : margin>15 ? T.amber : T.red,
                        border: `1px solid ${margin>30 ? T.greenBorder : margin>15 ? T.amberBorder : T.redBorder}`,
                        fontSize:FS.meta-2, fontWeight:700,
                        padding:"3px 9px", borderRadius:R.full,
                        textTransform:"uppercase", letterSpacing:LS.label,
                      }}>{margin}% margin</span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{
                    fontSize:FS.h4, fontWeight:700, color:T.text,
                    marginBottom:SP[2], letterSpacing:LS.tight,
                    fontVariantNumeric:"tabular-nums",
                  }}>${(c.amount/1000).toFixed(0)}K</div>
                  <Badge s={c.status} />
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length===0 && (
          <EmptyState
            icon={<Icon name="briefcase" size={32} />}
            title="No contacts"
            body="Add a new contact to start building your pipeline."
          />
        )}
      </div>
    </div>
  );
}

// ─── CONTACT DETAIL ──────────────────────────────────────
function DetailScreen({ contact, data, setData, setScreen, currentUser }) {
  const [action, setAction] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...contact });
  const [tab, setTab] = useState("overview");
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [inspectionDraft, setInspectionDraft] = useState({ type: "", date: new Date().toISOString().split("T")[0], inspector: "", status: "pending", notes: "", reinspectionDate: "" });
  const [editingInspId, setEditingInspId] = useState(null);
  const [milestoneConfirm, setMilestoneConfirm] = useState(null);

  const milestones = MILESTONES[contact.type] || MILESTONES.renovation;
  const completed = contact.milestones || [];
  const inspections = contact.inspections || [];
  const pct = milestones.length > 0 ? Math.round((completed.length / milestones.length) * 100) : 0;
  const margin = contact.cost > 0 ? Math.round(((contact.amount - contact.cost) / contact.amount) * 100) : null;
  const inspectionTypes = INSPECTION_TYPES_BY_JOB_TYPE[contact.type] || [];

  const quickAI = async (type) => {
    setAction(type); setLoading(true); setResult("");
    const prompts = {
      text:`Write a follow-up text under 160 chars to ${contact.name} about ${contact.job} ($${contact.amount?.toLocaleString()}).${contact.notes?" Context: "+contact.notes:""}`,
      email:`Write a professional follow-up email to ${contact.name} about ${contact.job} ($${contact.amount?.toLocaleString()}).`,
      call:`Write a phone call script to follow up with ${contact.name} about ${contact.job}.`,
      payment:`Write a friendly firm payment reminder to ${contact.name} for $${contact.amount?.toLocaleString()} on ${contact.job}.`,
      review:`Write a review request text to ${contact.name} after completing ${contact.job}. Ask for Google review.`,
    };
    const r = await ai("You write professional messages for Parker Construction Co. Murfreesboro TN. Owner Jesse Parker. Warm, direct, professional.", prompts[type]);
    setResult(r || `Hi ${contact.name}, this is Jesse with Parker Construction. Following up on ${contact.job}. — Jesse`);
    setLoading(false);
  };

  const toggleMilestone = async (m) => {
    const wasCompleted = completed.includes(m);
    const ms = wasCompleted ? completed.filter(x=>x!==m) : [...completed, m];
    const updated = { ...data, contacts:data.contacts.map(c=>c.id===contact.id?{...c,milestones:ms}:c) };
    await S.set(getCurrentDataKey(), updated); setData(updated);
    if (!wasCompleted) {
      // Offer inspection logging
      setMilestoneConfirm(m);
    }
  };

  const logInspectionForMilestone = async (milestone, status) => {
    const insp = {
      id: Math.random().toString(36).slice(2, 10),
      type: milestone,
      date: new Date().toISOString().split("T")[0],
      inspector: currentUser?.name || "",
      status,
      notes: "",
      reinspectionDate: "",
    };
    const updated = { ...data, contacts: data.contacts.map(c => c.id === contact.id ? { ...c, inspections: [...(c.inspections||[]), insp] } : c) };
    await S.set(getCurrentDataKey(), updated); setData(updated);
    setMilestoneConfirm(null);
  };

  const saveInspection = async () => {
    if (!inspectionDraft.type.trim()) return;
    let newList;
    if (editingInspId) {
      newList = inspections.map(i => i.id === editingInspId ? { ...i, ...inspectionDraft } : i);
    } else {
      newList = [...inspections, { id: Math.random().toString(36).slice(2, 10), ...inspectionDraft }];
    }
    const updated = { ...data, contacts: data.contacts.map(c => c.id === contact.id ? { ...c, inspections: newList } : c) };
    await S.set(getCurrentDataKey(), updated); setData(updated);
    setInspectionDraft({ type: "", date: new Date().toISOString().split("T")[0], inspector: "", status: "pending", notes: "", reinspectionDate: "" });
    setShowInspectionForm(false);
    setEditingInspId(null);
  };

  const deleteInspection = async (id) => {
    const newList = inspections.filter(i => i.id !== id);
    const updated = { ...data, contacts: data.contacts.map(c => c.id === contact.id ? { ...c, inspections: newList } : c) };
    await S.set(getCurrentDataKey(), updated); setData(updated);
  };

  const startEditInspection = (insp) => {
    setInspectionDraft({
      type: insp.type || "",
      date: insp.date || "",
      inspector: insp.inspector || "",
      status: insp.status || "pending",
      notes: insp.notes || "",
      reinspectionDate: insp.reinspectionDate || "",
    });
    setEditingInspId(insp.id);
    setShowInspectionForm(true);
  };

  const updateStatus = async (s) => {
    const updated = { ...data, contacts:data.contacts.map(c=>c.id===contact.id?{...c,status:s,lastContact:new Date().toISOString().split("T")[0]}:c) };
    await S.set(getCurrentDataKey(), updated); setData(updated);
  };

  const saveEdit = async () => {
    const updated = { ...data, contacts:data.contacts.map(c=>c.id===contact.id?{...form,amount:parseInt(form.amount)||0,cost:parseInt(form.cost)||0}:c) };
    await S.set(getCurrentDataKey(), updated); setData(updated); setEditing(false);
  };

  const tc = TYPE_CFG[contact.type] || TYPE_CFG.renovation;

  return (
    <div style={{ padding:"0 16px" }}>
      <button onClick={()=>setScreen("leads")} style={{ background:"none", border:"none", color:T.goldDk, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", padding:"0 0 14px", display:"block", letterSpacing:".04em" }}>{"←"} BACK</button>

      <Card style={{ padding:18, marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
          <Avatar name={contact.name} size={52} type={contact.type} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:20, fontWeight:800, color:T.charcoal }}>{contact.name}</div>
            <TypeBadge t={contact.type} />
          </div>
          <button onClick={()=>setEditing(!editing)} style={{ background:T.bgSection, border:`1.5px solid ${T.creamMid}`, color:T.stone, padding:"8px 12px", borderRadius:T.r8, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{"✏️"} Edit</button>
        </div>

        {margin !== null && (
          <div style={{ background:margin>30?T.greenLt:margin>20?T.amberLt:T.redLt, borderRadius:T.r8, padding:"10px 14px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:12, fontWeight:600, color:T.charcoal }}>Job Profit Margin</span>
            <span style={{ fontSize:20, fontWeight:800, color:margin>30?T.green:margin>20?T.amber:T.red, fontFamily:"Georgia,serif" }}>{margin}%</span>
          </div>
        )}

        {pct > 0 && (
          <div style={{ marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:12 }}>
              <span style={{ color:T.stone, fontWeight:600 }}>Job Progress</span>
              <span style={{ color:T.charcoal, fontWeight:700 }}>{completed.length}/{milestones.length} milestones · {pct}%</span>
            </div>
            <div style={{ height:8, background:T.creamDk, borderRadius:10, overflow:"hidden" }}>
              <div style={{ width:`${pct}%`, height:"100%", background:`linear-gradient(90deg,${T.goldDk},${T.gold})`, borderRadius:10 }} />
            </div>
          </div>
        )}

        {editing ? (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {[["name","Name"],["phone","Phone"],["email","Email"],["job","Job"],["amount","Contract $"],["cost","Cost $"]].map(([k,p])=>(
              <Input key={k} placeholder={p} value={form[k]||""} onChange={e=>setForm({...form,[k]:e.target.value})} />
            ))}
            <TextArea placeholder="Notes" rows={2} value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})} />
            <Btn gold full onClick={saveEdit}>Save Changes</Btn>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[
              ["Contract", `$${contact.amount?.toLocaleString()}`, T.charcoal],
              ["Est. Cost", contact.cost > 0 ? `$${contact.cost?.toLocaleString()}` : "Not set", T.stone],
              ["Phone", contact.phone, T.charcoal],
              ["Last Contact", contact.lastContact, T.stone],
              ["Status", null, null],
              ["Referred By", contact.referredBy||"—", T.stone],
              ["Notes", contact.notes||"—", T.stone],
            ].map(([l,v,vc])=>(
              <div key={l} style={{ background:T.bgSection, borderRadius:T.r8, padding:"10px 12px", gridColumn:["Notes"].includes(l)?"1/3":"auto" }}>
                <div style={{ color:T.stoneXlt, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:".08em" }}>{l}</div>
                <div style={{ color:vc||T.charcoal, fontWeight:600, marginTop:4, fontSize:12, wordBreak:"break-all" }}>
                  {l==="Status" ? <Badge s={contact.status} /> : v}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {!editing && (
        <>
          <div style={{ display:"flex", gap:SP[2], marginBottom:SP[4], overflowX:"auto", paddingBottom:SP[1] }}>
            {["overview","milestones","messages"].map(t=>(
              <Pill key={t} active={tab===t} onClick={()=>setTab(t)}>{t}</Pill>
            ))}
          </div>

          {tab==="overview" && (
            <>
              <SectionLabel>Update Stage</SectionLabel>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
                {["new","active","follow-up","won","lost"].map(s=>{
                  const sc = STATUS_CFG[s];
                  return <button key={s} onClick={()=>updateStatus(s)} style={{ padding:"7px 14px", borderRadius:20, border:`1.5px solid ${contact.status===s?sc.color:T.creamMid}`, background:contact.status===s?sc.bg:"transparent", color:contact.status===s?sc.color:T.stone, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", textTransform:"capitalize" }}>{sc.label}</button>;
                })}
              </div>

              <SectionLabel>AI Actions</SectionLabel>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:14 }}>
                {[["text","💬 Text"],["email","✉️ Email"],["call","📞 Script"],["payment","💰 Chase $"],["review","⭐ Review Ask"]].map(([t,l])=>(
                  <button key={t} onClick={()=>quickAI(t)} style={{ padding:"11px 8px", borderRadius:T.r12, border:`1.5px solid ${action===t?T.gold:T.creamMid}`, background:action===t?T.goldBg:"transparent", color:action===t?T.goldDk:T.stone, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", textAlign:"center" }}>{l}</button>
                ))}
              </div>

              {(loading||result) && (
                <Card style={{ padding:14, border:`1px solid ${T.goldBorder}`, marginBottom:14 }}>
                  {loading ? <div style={{ textAlign:"center", color:T.stoneXlt, padding:14 }}>{"⏳"} Generating…</div> : (
                    <>
                      <div style={{ fontSize:13, color:T.charcoal, whiteSpace:"pre-wrap", lineHeight:1.7 }}>{result}</div>
                      <div style={{ display:"flex", gap:8, marginTop:12 }}>
                        <Btn gold sm onClick={()=>navigator.clipboard?.writeText(result)} style={{ flex:1 }}>{"📋"} Copy</Btn>
                        <Btn ghost sm onClick={()=>quickAI(action)}>{"🔄"}</Btn>
                      </div>
                    </>
                  )}
                </Card>
              )}
            </>
          )}

          {tab==="milestones" && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {/* Inspections Section */}
              <div style={{ background:T.bgCard, borderRadius:T.r12, padding:"12px 14px", marginBottom:4, border:`1px solid ${T.creamMid}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <span style={{ fontSize:11, fontWeight:800, color:T.stoneXlt, textTransform:"uppercase", letterSpacing:".12em" }}>Inspections</span>
                  <button onClick={()=>{ setShowInspectionForm(true); setEditingInspId(null); setInspectionDraft({ type: inspectionTypes[0]||"", date: new Date().toISOString().split("T")[0], inspector: currentUser?.name||"", status: "pending", notes: "", reinspectionDate: "" }); }} style={{ background:T.goldBg, border:`1px solid ${T.goldBorder}`, color:T.goldDk, fontSize:11, fontWeight:800, padding:"5px 10px", borderRadius:T.r8, cursor:"pointer", fontFamily:"inherit" }}>+ Add Inspection</button>
                </div>
                <div style={{ display:"flex", gap:10, fontSize:11, marginBottom:10 }}>
                  <span style={{ color:T.green, fontWeight:800 }}>{inspections.filter(i=>i.status==="pass").length} passed</span>
                  <span style={{ color:T.amber, fontWeight:800 }}>{inspections.filter(i=>i.status==="pending").length} pending</span>
                  <span style={{ color:T.red, fontWeight:800 }}>{inspections.filter(i=>i.status==="fail").length} failed</span>
                </div>
                {inspections.length === 0 ? (
                  <div style={{ fontSize:11, color:T.stoneXlt, textAlign:"center", padding:"6px 0" }}>No inspections logged.</div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {inspections.map(ins => {
                      const col = ins.status==="pass"?T.green:ins.status==="fail"?T.red:T.amber;
                      return (
                        <div key={ins.id} style={{ background:T.bgSection, borderRadius:T.r8, padding:"8px 10px", borderLeft:`3px solid ${col}` }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <span style={{ fontSize:12, fontWeight:700, color:T.charcoal }}>{ins.type}</span>
                            <span style={{ fontSize:9, fontWeight:800, color:col, textTransform:"uppercase", letterSpacing:".06em", border:`1px solid ${col}`, padding:"2px 8px", borderRadius:20 }}>{ins.status}</span>
                          </div>
                          <div style={{ fontSize:10, color:T.stoneLt, marginTop:3 }}>
                            {ins.date} {ins.inspector && `· ${ins.inspector}`}
                          </div>
                          {ins.notes && <div style={{ fontSize:10, color:T.stoneLt, marginTop:3 }}>{ins.notes}</div>}
                          {ins.reinspectionDate && <div style={{ fontSize:10, color:T.amber, marginTop:3 }}>Re-inspection: {ins.reinspectionDate}</div>}
                          <div style={{ display:"flex", gap:6, marginTop:6 }}>
                            <button onClick={()=>startEditInspection(ins)} style={{ fontSize:10, background:"transparent", border:`1px solid ${T.creamMid}`, color:T.stone, padding:"3px 8px", borderRadius:6, cursor:"pointer", fontFamily:"inherit" }}>Edit</button>
                            <button onClick={()=>deleteInspection(ins.id)} style={{ fontSize:10, background:"transparent", border:`1px solid ${T.red}`, color:T.red, padding:"3px 8px", borderRadius:6, cursor:"pointer", fontFamily:"inherit" }}>Delete</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Inspection Form Modal */}
              {showInspectionForm && (
                <div onClick={()=>setShowInspectionForm(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", padding:20, zIndex:500 }}>
                  <div onClick={e=>e.stopPropagation()} style={{ background:T.bgCard, borderRadius:T.r16, border:`1px solid ${T.creamMid}`, padding:20, width:"100%", maxWidth:360 }}>
                    <div style={{ fontSize:14, fontWeight:800, color:T.charcoal, marginBottom:14 }}>{editingInspId?"Edit Inspection":"New Inspection"}</div>
                    <div style={{ fontSize:10, fontWeight:700, color:T.stoneXlt, textTransform:"uppercase", marginBottom:4 }}>Type</div>
                    {inspectionTypes.length > 0 ? (
                      <select value={inspectionDraft.type} onChange={e=>setInspectionDraft({...inspectionDraft, type:e.target.value})} style={{ width:"100%", padding:"10px 12px", borderRadius:T.r8, border:`1.5px solid ${T.creamMid}`, background:T.bgSection, color:T.charcoal, fontSize:13, fontFamily:"inherit", marginBottom:10, boxSizing:"border-box" }}>
                        <option value="">Select type…</option>
                        {inspectionTypes.map(t=><option key={t} value={t}>{t}</option>)}
                      </select>
                    ) : (
                      <Input placeholder="Inspection type" value={inspectionDraft.type} onChange={e=>setInspectionDraft({...inspectionDraft, type:e.target.value})} style={{ marginBottom:10 }} />
                    )}
                    <div style={{ fontSize:10, fontWeight:700, color:T.stoneXlt, textTransform:"uppercase", marginBottom:4 }}>Date</div>
                    <Input type="date" value={inspectionDraft.date} onChange={e=>setInspectionDraft({...inspectionDraft, date:e.target.value})} style={{ marginBottom:10 }} />
                    <div style={{ fontSize:10, fontWeight:700, color:T.stoneXlt, textTransform:"uppercase", marginBottom:4 }}>Inspector</div>
                    <Input placeholder="Inspector name" value={inspectionDraft.inspector} onChange={e=>setInspectionDraft({...inspectionDraft, inspector:e.target.value})} style={{ marginBottom:10 }} />
                    <div style={{ fontSize:10, fontWeight:700, color:T.stoneXlt, textTransform:"uppercase", marginBottom:4 }}>Status</div>
                    <select value={inspectionDraft.status} onChange={e=>setInspectionDraft({...inspectionDraft, status:e.target.value})} style={{ width:"100%", padding:"10px 12px", borderRadius:T.r8, border:`1.5px solid ${T.creamMid}`, background:T.bgSection, color:T.charcoal, fontSize:13, fontFamily:"inherit", marginBottom:10, boxSizing:"border-box" }}>
                      <option value="pending">Pending</option>
                      <option value="pass">Pass</option>
                      <option value="fail">Fail</option>
                    </select>
                    <div style={{ fontSize:10, fontWeight:700, color:T.stoneXlt, textTransform:"uppercase", marginBottom:4 }}>Notes</div>
                    <TextArea rows={2} value={inspectionDraft.notes} onChange={e=>setInspectionDraft({...inspectionDraft, notes:e.target.value})} style={{ marginBottom:10 }} />
                    <div style={{ fontSize:10, fontWeight:700, color:T.stoneXlt, textTransform:"uppercase", marginBottom:4 }}>Re-inspection Date</div>
                    <Input type="date" value={inspectionDraft.reinspectionDate} onChange={e=>setInspectionDraft({...inspectionDraft, reinspectionDate:e.target.value})} style={{ marginBottom:14 }} />
                    <div style={{ display:"flex", gap:8 }}>
                      <Btn gold onClick={saveInspection} style={{ flex:1 }}>Save</Btn>
                      <Btn ghost onClick={()=>{ setShowInspectionForm(false); setEditingInspId(null); }}>Cancel</Btn>
                    </div>
                  </div>
                </div>
              )}

              {/* Milestone confirm dialog */}
              {milestoneConfirm && (
                <div onClick={()=>setMilestoneConfirm(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", padding:20, zIndex:500 }}>
                  <div onClick={e=>e.stopPropagation()} style={{ background:T.bgCard, borderRadius:T.r16, border:`1px solid ${T.creamMid}`, padding:20, width:"100%", maxWidth:320 }}>
                    <div style={{ fontSize:14, fontWeight:800, color:T.charcoal, marginBottom:6 }}>Log inspection?</div>
                    <div style={{ fontSize:12, color:T.stoneLt, marginBottom:14 }}>Log an inspection for "{milestoneConfirm}"?</div>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={()=>logInspectionForMilestone(milestoneConfirm,"pass")} style={{ flex:1, background:T.greenLt, border:`1px solid ${T.greenBorder}`, color:T.green, padding:"10px 8px", borderRadius:T.r8, fontWeight:800, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Pass</button>
                      <button onClick={()=>logInspectionForMilestone(milestoneConfirm,"fail")} style={{ flex:1, background:T.redLt, border:`1px solid ${T.redBorder}`, color:T.red, padding:"10px 8px", borderRadius:T.r8, fontWeight:800, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Fail</button>
                      <button onClick={()=>logInspectionForMilestone(milestoneConfirm,"pending")} style={{ flex:1, background:T.amberLt, border:`1px solid ${T.amberBorder}`, color:T.amber, padding:"10px 8px", borderRadius:T.r8, fontWeight:800, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Pending</button>
                    </div>
                    <button onClick={()=>setMilestoneConfirm(null)} style={{ marginTop:10, background:"none", border:"none", color:T.stoneXlt, fontSize:11, cursor:"pointer", width:"100%", fontFamily:"inherit" }}>Skip</button>
                  </div>
                </div>
              )}

              <div style={{ background:T.bgCard, borderRadius:T.r12, padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4, boxShadow:"0 1px 6px rgba(0,0,0,.05)" }}>
                <span style={{ fontSize:12, fontWeight:600, color:T.stone }}>{tc.icon} {tc.label} Checklist</span>
                <span style={{ fontSize:13, fontWeight:800, color:pct===100?T.green:T.gold }}>{pct}% complete</span>
              </div>
              {milestones.map(m=>{
                const done = completed.includes(m);
                return (
                  <button key={m} onClick={()=>toggleMilestone(m)} style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 16px", background:done?T.greenLt:T.bgCard, borderRadius:T.r12, border:`1.5px solid ${done?T.greenBorder:T.creamMid}`, cursor:"pointer", textAlign:"left", fontFamily:"inherit", width:"100%", boxShadow:"0 1px 6px rgba(0,0,0,.04)" }}>
                    <div style={{ width:22, height:22, borderRadius:22, border:`2px solid ${done?T.green:T.creamMid}`, background:done?T.green:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      {done && <span style={{ color:"#fff", fontSize:12, fontWeight:800 }}>{"✓"}</span>}
                    </div>
                    <span style={{ fontSize:13, fontWeight:600, color:done?T.green:T.charcoal, textDecoration:done?"line-through":"none" }}>{m}</span>
                  </button>
                );
              })}
            </div>
          )}

          {tab==="messages" && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {(data.messages||[]).filter(m=>m.to===contact.name).length === 0 ? (
                <div style={{ textAlign:"center", color:T.stoneXlt, padding:"30px 0", fontSize:13 }}>No messages yet.</div>
              ) : (data.messages||[]).filter(m=>m.to===contact.name).reverse().map((m,i)=>(
                <Card key={i} accent={m.channel==="sms"?T.gold:m.channel==="email"?T.teal:T.green} style={{ padding:"12px 14px" }}>
                  <div style={{ fontSize:10, color:T.stoneLt, marginBottom:6, fontWeight:600, textTransform:"uppercase", letterSpacing:".06em" }}>{m.channel} · {new Date(m.sentAt).toLocaleDateString()}</div>
                  <div style={{ fontSize:12, color:T.charcoal, lineHeight:1.6 }}>{m.body?.slice(0,200)}</div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── BID ENGINE ──────────────────────────────────────────
function BidScreen() {
  const [scope, setScope] = useState(""); const [type, setType] = useState("renovation");
  const [result, setResult] = useState(""); const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!scope.trim()) return;
    setLoading(true); setResult("");
    const rateInfo = Object.entries(RATES).map(([k,v])=>`${k.replace(/_/g," ")}: ${v}`).join(", ");
    const tc = TYPE_CFG[type];
    const r = await ai(`You create detailed project bids for Parker Construction Co. in Murfreesboro TN. Jesse Parker, owner. EXACT rates: ${rateInfo}. Format as clean line-item estimate with quantities, unit rates, and totals. Include subtotal, 10% overhead/profit, and grand total. Be specific.`,
      `Job type: ${tc.label}. Scope: ${scope}`);
    setResult(r || `[Connect API]\n\nProject: ${scope}`);
    setLoading(false);
  };

  return (
    <Page>
      <Card padded style={{ marginBottom:SP[4] }}>
        <SectionHeader>Rate Card</SectionHeader>
        <div style={{ display:"flex", flexWrap:"wrap", gap:SP[1]+2 }}>
          {Object.entries(RATES).map(([k,v])=>(
            <span key={k} style={{
              background:T.bgSection,
              padding:`${SP[1]}px ${SP[2]+1}px`,
              borderRadius:R.sm,
              border:`1px solid ${T.border}`,
              fontSize:FS.meta-1,
              color:T.textSecondary,
              fontFamily:FF.sans,
            }}>
              <span style={{ color:T.gold, fontWeight:700 }}>{k.replace(/_/g," ")}</span>
              <span style={{ color:T.textMuted, margin:`0 ${SP[1]}px` }}>·</span>
              {v}
            </span>
          ))}
        </div>
      </Card>

      <SectionHeader>Project Type</SectionHeader>
      <div style={{ display:"flex", gap:SP[2], marginBottom:SP[4], flexWrap:"wrap" }}>
        {Object.entries(TYPE_CFG).map(([k,v])=>(
          <Pill key={k} active={type===k} onClick={()=>setType(k)}>{v.label}</Pill>
        ))}
      </div>

      <SectionHeader>Scope</SectionHeader>
      <TextArea
        value={scope}
        onChange={e=>setScope(e.target.value)}
        rows={5}
        placeholder={`Describe the ${TYPE_CFG[type]?.label} scope.\nExample: 24×24 garage conversion — demo existing wall, frame new, insulation, drywall, 8 outlets, 4 lights, LVP, paint, mini-split, permit.`}
        style={{ marginBottom:SP[3] }}
      />
      <Btn
        variant="primary"
        full
        disabled={loading||!scope.trim()}
        onClick={generate}
        leftIcon={loading ? null : <Icon name="clipboard" size={16} stroke={2} />}
      >{loading ? "Building bid…" : "Generate bid"}</Btn>

      {result && (
        <Card style={{ padding:SP[4], marginTop:SP[5] }} accent={T.gold}>
          <SectionHeader action={
            <div style={{ display:"flex", gap:SP[2] }}>
              <Btn variant="ghost" size="sm" onClick={()=>navigator.clipboard?.writeText(result)} leftIcon={<Icon name="copy" size={14} />}>Copy</Btn>
              <Btn variant="ghost" size="sm" onClick={generate} leftIcon={<Icon name="refresh" size={14} />}>Retry</Btn>
            </div>
          }>Generated Bid</SectionHeader>
          <div style={{
            fontSize:FS.ui,
            color:T.text,
            whiteSpace:"pre-wrap",
            lineHeight:1.7,
            fontFamily:FF.mono,
          }}>{result}</div>
        </Card>
      )}
    </Page>
  );
}

// ─── COMPOSE ─────────────────────────────────────────────
function ComposeScreen({ data, setData }) {
  const [ch, setCh] = useState("sms"); const [to, setTo] = useState("");
  const [body, setBody] = useState(""); const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false); const [sent, setSent] = useState(false);
  const contacts = data.contacts || [];

  const generate = async () => {
    if (!body.trim()) return; setLoading(true); setResult("");
    const sel = contacts.find(c=>c.name===to);
    const chType = ch==="sms"?"text message under 160 chars":ch==="email"?"professional email with subject line":"phone call script";
    const r = await ai(`You write ${chType}s for Parker Construction Co. in Murfreesboro TN. Owner Jesse Parker. Services: new construction, renovations, concrete, outdoor living, insurance claims, roofing. Warm, professional, direct.`,
      `${to?`To: ${to}${sel?` (${sel.job}, $${sel.amount?.toLocaleString()})`:""}`:""}
Context: ${body}
Write a ${chType}.`);
    setResult(r||`Hi${to?" "+to:""}, this is Jesse with Parker Construction. ${body} — Jesse`);
    setLoading(false);
  };

  const send = async () => {
    const msg = { id:"m"+Date.now(), channel:ch, to:to||"Unknown", body:result, status:"sent", sentAt:new Date().toISOString() };
    const updated = { ...data, messages:[...(data.messages||[]),msg] };
    await S.set(getCurrentDataKey(), updated); setData(updated);
    setSent(true); setResult(""); setBody("");
    setTimeout(()=>setSent(false),2000);
  };

  const CHANNELS = [
    { id:"sms",   label:"Text",   icon:"message" },
    { id:"email", label:"Email",  icon:"mail" },
    { id:"voice", label:"Script", icon:"phone" },
  ];

  return (
    <Page>
      <SectionHeader>Channel</SectionHeader>
      <div style={{ display:"flex", gap:SP[2], marginBottom:SP[4] }}>
        {CHANNELS.map(c => {
          const active = ch===c.id;
          return (
            <button
              key={c.id}
              onClick={()=>{ setCh(c.id); setResult(""); }}
              aria-pressed={active}
              style={{
                flex:1,
                padding:`${SP[3]}px ${SP[2]}px`,
                borderRadius:R.md,
                border:`1px solid ${active ? T.gold : T.border}`,
                background: active ? T.goldBg : T.bgCard,
                color: active ? T.gold : T.textSecondary,
                cursor:"pointer",
                fontFamily:FF.sans,
                display:"flex", alignItems:"center", justifyContent:"center", gap:SP[2],
                fontSize:FS.body, fontWeight:600,
                transition:`all ${MO.fast}`,
              }}
              onMouseEnter={(e)=>{
                if (active) return;
                e.currentTarget.style.borderColor = "rgba(201,150,58,.35)";
                e.currentTarget.style.color = T.text;
              }}
              onMouseLeave={(e)=>{
                if (active) return;
                e.currentTarget.style.borderColor = T.border;
                e.currentTarget.style.color = T.textSecondary;
              }}
            >
              <Icon name={c.icon} size={16} />
              {c.label}
            </button>
          );
        })}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:SP[3] }}>
        <Field label="Recipient">
          <Select value={to} onChange={e=>setTo(e.target.value)}>
            <option value="">— Select a contact —</option>
            {contacts.map(c => <option key={c.id} value={c.name}>{c.name} · {c.job}</option>)}
          </Select>
        </Field>

        <Field label="Context">
          <TextArea
            value={body}
            onChange={e=>setBody(e.target.value)}
            rows={3}
            placeholder={"What do you need to communicate?\nExample: Follow up on garage estimate, mention we can start next week."}
          />
        </Field>

        <Btn
          variant="primary"
          full
          disabled={loading||!body.trim()}
          onClick={generate}
        >{loading ? "Generating…" : "Generate with AI"}</Btn>
      </div>

      {result && (
        <div style={{ marginTop:SP[5] }}>
          <Card padded accent={T.gold}>
            <div style={{
              fontSize:FS.body,
              color:T.text,
              whiteSpace:"pre-wrap",
              lineHeight:1.7,
            }}>{result}</div>
          </Card>
          <div style={{ display:"flex", gap:SP[2], marginTop:SP[3] }}>
            <Btn
              variant="primary"
              style={{ flex:1 }}
              onClick={send}
              leftIcon={sent ? <Icon name="check" size={16} stroke={2.5} /> : null}
            >
              {sent ? "Sent" : ch==="sms" ? "Send Text" : ch==="email" ? "Send Email" : "Use Script"}
            </Btn>
            <Btn variant="ghost" onClick={generate} aria-label="Regenerate"><Icon name="refresh" size={16} /></Btn>
            <Btn variant="ghost" onClick={()=>navigator.clipboard?.writeText(result)} aria-label="Copy"><Icon name="copy" size={16} /></Btn>
          </div>
        </div>
      )}
    </Page>
  );
}

// ─── SCHEDULE ────────────────────────────────────────────
function ScheduleScreen({ data, setData }) {
  const [selDay, setSelDay] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ job:"", desc:"", day:0, time:"", date:"" });
  const contacts = data.contacts || [];
  const scheduled = data.scheduled || [];
  const today = new Date();
  const DNAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const MNAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const days = Array.from({length:7},(_,i)=>{ const d=new Date(today); d.setDate(today.getDate()+i); return d; });
  const selDateStr = days[selDay].toISOString().split("T")[0];
  const items = scheduled.filter(s=>s.date===selDateStr);

  const addEvent = async () => {
    if (!form.job.trim()) return;
    const ev = { id:"ev"+Date.now(), job:form.job, desc:form.desc, day:0, time:form.time, date:form.date };
    const updated = { ...data, scheduled:[...scheduled, ev] };
    await S.set(getCurrentDataKey(), updated); setData(updated);
    setForm({ job:"", desc:"", day:0, time:"", date:"" }); setShowAdd(false);
  };

  const delEvent = async (id) => {
    const updated = { ...data, scheduled:scheduled.filter(s=>s.id!==id) };
    await S.set(getCurrentDataKey(), updated); setData(updated);
  };

  const headerLabel = selDay===0
    ? "Today"
    : selDay===1
      ? "Tomorrow"
      : `${DNAMES[days[selDay].getDay()]}, ${MNAMES[days[selDay].getMonth()]} ${days[selDay].getDate()}`;

  return (
    <Page style={{ position:"relative" }}>
      {/* Day picker */}
      <div style={{ display:"flex", gap:SP[2], marginBottom:SP[5], overflowX:"auto", paddingBottom:SP[1] }}>
        {days.map((d,i)=>{
          const dateStr = d.toISOString().split("T")[0];
          const has = scheduled.some(s=>s.date===dateStr);
          const active = selDay===i;
          return (
            <button
              key={i}
              onClick={()=>setSelDay(i)}
              aria-pressed={active}
              style={{
                minWidth:52,
                padding:`${SP[2]+1}px ${SP[1]+2}px`,
                borderRadius:R.md,
                border:`1px solid ${active ? T.gold : T.border}`,
                background: active ? T.goldBg : T.bgCard,
                cursor:"pointer",
                textAlign:"center",
                flexShrink:0,
                transition:`all ${MO.fast}`,
                fontFamily:FF.sans,
              }}
            >
              <div style={{
                fontSize:FS.meta-2, fontWeight:700,
                color: active ? T.gold : T.textMuted,
                textTransform:"uppercase", letterSpacing:LS.uppercase,
              }}>{DNAMES[d.getDay()]}</div>
              <div style={{
                fontSize:FS.h2, fontWeight:700,
                color: active ? T.gold : T.text,
                lineHeight:1.2, marginTop:SP[1],
                letterSpacing:LS.tight,
              }}>{d.getDate()}</div>
              <div style={{
                width:4, height:4, borderRadius:R.full,
                background: has ? (active ? T.gold : T.textMuted) : "transparent",
                margin:`${SP[1]}px auto 0`,
              }} />
            </button>
          );
        })}
      </div>

      <SectionHeader>{headerLabel}</SectionHeader>

      {items.length === 0 ? (
        <EmptyState
          icon={<Icon name="calendar" size={32} />}
          title="Nothing scheduled"
          body="Tap the + button to add an event for this day."
        />
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:SP[2], marginBottom:SP[5] }}>
          {items.map((s)=>(
            <Card key={s.id} accent={T.gold} style={{ padding:`${SP[3]+1}px ${SP[4]}px` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:SP[3] }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:FS.lead, fontWeight:700, color:T.text, letterSpacing:LS.tight }}>{s.job}</div>
                  {s.desc && <div style={{ fontSize:FS.meta, color:T.textSecondary, marginTop:SP[1] }}>{s.desc}</div>}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:SP[2], flexShrink:0 }}>
                  <div style={{
                    background:T.goldBg,
                    color:T.gold,
                    padding:`${SP[1]+2}px ${SP[3]}px`,
                    borderRadius:R.sm,
                    border:`1px solid ${T.goldBorder}`,
                    fontSize:FS.meta, fontWeight:700,
                    fontVariantNumeric:"tabular-nums",
                    whiteSpace:"nowrap",
                  }}>{s.time}</div>
                  <button
                    onClick={()=>delEvent(s.id)}
                    aria-label="Delete event"
                    style={{
                      background:"none", border:"none", padding:SP[2],
                      cursor:"pointer", color:T.textMuted,
                      display:"flex", alignItems:"center",
                    }}
                  ><Icon name="trash" size={16} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <SectionHeader>Active Jobs on Site</SectionHeader>
      <div style={{ display:"flex", flexDirection:"column", gap:SP[2] }}>
        {contacts.filter(c=>c.status==="active").length === 0 && (
          <div style={{ fontSize:FS.meta, color:T.textMuted, padding:`${SP[3]}px 0` }}>
            No active jobs.
          </div>
        )}
        {contacts.filter(c=>c.status==="active").map(c=>(
          <Card key={c.id} style={{ padding:`${SP[3]+1}px ${SP[4]}px` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:SP[3] }}>
              <div style={{ display:"flex", alignItems:"center", gap:SP[3], minWidth:0 }}>
                <Avatar name={c.name} size={36} type={c.type} />
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:FS.body, fontWeight:700, color:T.text, letterSpacing:LS.tight }}>{c.name}</div>
                  <div style={{ fontSize:FS.meta, color:T.textSecondary, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.job}</div>
                </div>
              </div>
              <TypeBadge t={c.type} />
            </div>
          </Card>
        ))}
      </div>

      {/* FAB */}
      <button
        onClick={()=>{ setForm({ job:"", desc:"", day:0, time:"", date:selDateStr }); setShowAdd(true); }}
        aria-label="Add event"
        style={{
          position:"fixed", bottom:96, right:"calc(50% - 195px)",
          width:52, height:52, borderRadius:R.full,
          border:"none",
          background:T.gold,
          color:"#141414",
          cursor:"pointer",
          boxShadow:"0 8px 24px rgba(201,150,58,.4)",
          display:"flex", alignItems:"center", justifyContent:"center",
          zIndex:90,
          transition:`transform ${MO.fast}`,
        }}
        onMouseDown={(e)=>{ e.currentTarget.style.transform="scale(.94)"; }}
        onMouseUp={(e)=>{ e.currentTarget.style.transform="scale(1)"; }}
        onMouseLeave={(e)=>{ e.currentTarget.style.transform="scale(1)"; }}
      >
        <Icon name="plus" size={22} stroke={2.5} />
      </button>

      {/* Add Modal */}
      {showAdd && (
        <div style={{
          position:"fixed", top:0, left:0, right:0, bottom:0,
          background:"rgba(0,0,0,.6)",
          zIndex:200,
          display:"flex", alignItems:"center", justifyContent:"center",
          padding:SP[5],
        }}>
          <Card padded style={{
            width:"100%", maxWidth:360,
            padding:SP[5],
            boxShadow:ELEV.modal,
          }}>
            <div style={{
              fontSize:FS.h4, fontWeight:700, color:T.text,
              letterSpacing:LS.tight, marginBottom:SP[4],
            }}>Add Event</div>
            <div style={{ display:"flex", flexDirection:"column", gap:SP[3] }}>
              <Field label="Job / client">
                <Input placeholder="Client name" value={form.job} onChange={e=>setForm({...form,job:e.target.value})} />
              </Field>
              <Field label="Description">
                <Input placeholder="What is this for?" value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} />
              </Field>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:SP[3] }}>
                <Field label="Date">
                  <Input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} />
                </Field>
                <Field label="Time">
                  <Input placeholder="9:00 AM" value={form.time} onChange={e=>setForm({...form,time:e.target.value})} />
                </Field>
              </div>
              <div style={{ display:"flex", gap:SP[2], marginTop:SP[2] }}>
                <Btn variant="ghost" full size="sm" onClick={()=>setShowAdd(false)}>Cancel</Btn>
                <Btn variant="primary" full size="sm" onClick={addEvent}>Save Event</Btn>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Page>
  );
}

// ─── SUBS TRACKER ────────────────────────────────────────
function SubsScreen({ data, setData }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name:"", trade:"", phone:"", activeJob:"", status:"scheduled", rate:"" });
  const subs = data.subs || [];
  const contacts = data.contacts || [];
  const STATUS_S = {
    "on-site":   { bg:T.greenLt, color:T.green, border:T.greenBorder },
    "scheduled": { bg:T.amberLt, color:T.amber, border:T.amberBorder },
    "complete":  { bg:T.bgSection, color:T.textSecondary, border:T.border },
  };

  const add = async () => {
    if (!form.name.trim()) return;
    const s = { ...form, id:"s"+Date.now() };
    const updated = { ...data, subs:[...subs, s] };
    await S.set(getCurrentDataKey(), updated); setData(updated);
    setForm({ name:"", trade:"", phone:"", activeJob:"", status:"scheduled", rate:"" }); setShowAdd(false);
  };

  return (
    <Page>
      {/* Stat strip — first column gets the gold dominance bar */}
      <div style={{
        background:T.bgCard,
        border:`1px solid ${T.border}`,
        borderRadius:R.lg,
        marginBottom:SP[4],
        display:"grid",
        gridTemplateColumns:"1fr 1fr 1fr",
        overflow:"hidden",
        position:"relative",
      }}>
        <div style={{
          position:"absolute", top:0, left:0,
          width:"33.33%", height:2,
          background:`linear-gradient(90deg, ${T.gold} 0%, rgba(201,150,58,0) 100%)`,
        }} />
        {[
          { label:"On Site",   value:subs.filter(s=>s.status==="on-site").length, accent:"#6EC98A" },
          { label:"Scheduled", value:subs.filter(s=>s.status==="scheduled").length, accent:T.gold },
          { label:"Total",     value:subs.length, accent:T.text },
        ].map((s,i,arr)=>(
          <div key={s.label} style={{ borderRight: i<arr.length-1 ? `1px solid ${T.border}` : "none" }}>
            <Stat label={s.label} value={s.value} accent={s.accent} align="center" />
          </div>
        ))}
      </div>

      <Btn
        variant="primary"
        full
        onClick={()=>setShowAdd(!showAdd)}
        leftIcon={<Icon name={showAdd ? "x" : "plus"} size={16} stroke={2} />}
        style={{ marginBottom:SP[3] }}
      >{showAdd ? "Cancel" : "Add Sub-Contractor"}</Btn>

      {showAdd && (
        <Card padded style={{ padding:SP[4], marginBottom:SP[4] }}>
          <div style={{ display:"flex", flexDirection:"column", gap:SP[3] }}>
            <Field label="Company / Name">
              <Input placeholder="Company name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
            </Field>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:SP[3] }}>
              <Field label="Trade">
                <Input placeholder="e.g. Framing" value={form.trade} onChange={e=>setForm({...form,trade:e.target.value})} />
              </Field>
              <Field label="Phone">
                <Input placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} />
              </Field>
            </div>
            <Field label="Assigned job">
              <Select value={form.activeJob} onChange={e=>setForm({...form,activeJob:e.target.value})}>
                <option value="">— None —</option>
                {contacts.filter(c=>c.status==="active").map(c=>(
                  <option key={c.id} value={c.name}>{c.name} · {c.job}</option>
                ))}
              </Select>
            </Field>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:SP[3] }}>
              <Field label="Rate">
                <Input placeholder="e.g. $4.50/lf" value={form.rate} onChange={e=>setForm({...form,rate:e.target.value})} />
              </Field>
              <Field label="Status">
                <Select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                  <option value="scheduled">Scheduled</option>
                  <option value="on-site">On Site</option>
                  <option value="complete">Complete</option>
                </Select>
              </Field>
            </div>
            <Btn variant="primary" full onClick={add}>Save Sub</Btn>
          </div>
        </Card>
      )}

      {/* List */}
      <div style={{ display:"flex", flexDirection:"column", gap:SP[2] }}>
        {subs.length===0 && (
          <EmptyState
            icon={<Icon name="wrench" size={32} />}
            title="No sub-contractors"
            body="Add a sub to start assigning trades to active jobs."
          />
        )}
        {subs.map(s=>{
          const sc = STATUS_S[s.status] || STATUS_S.scheduled;
          return (
            <Card key={s.id} style={{ padding:`${SP[3]+1}px ${SP[4]}px` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:SP[3] }}>
                <div style={{ minWidth:0, flex:1 }}>
                  <div style={{ fontSize:FS.lead, fontWeight:700, color:T.text, letterSpacing:LS.tight }}>{s.name}</div>
                  <div style={{ fontSize:FS.meta, color:T.textSecondary, marginTop:2 }}>
                    {s.trade}{s.rate ? <> <span style={{ color:T.textMuted }}>·</span> {s.rate}</> : null}
                  </div>
                  {s.activeJob && (
                    <div style={{
                      display:"flex", alignItems:"center", gap:SP[1]+1,
                      fontSize:FS.meta, color:T.gold, fontWeight:600,
                      marginTop:SP[1]+2,
                    }}>
                      <Icon name="briefcase" size={12} />
                      {s.activeJob}
                    </div>
                  )}
                </div>
                <span style={{
                  background:sc.bg, color:sc.color, border:`1px solid ${sc.border}`,
                  padding:"3px 9px", borderRadius:R.full,
                  fontSize:FS.meta-2, fontWeight:700,
                  textTransform:"uppercase", letterSpacing:LS.label,
                  whiteSpace:"nowrap",
                }}>{s.status.replace("-"," ")}</span>
              </div>
              {s.phone && (
                <div style={{
                  fontSize:FS.meta, color:T.textSecondary,
                  marginTop:SP[3], paddingTop:SP[3],
                  borderTop:`1px solid ${T.border}`,
                  fontVariantNumeric:"tabular-nums",
                }}>{s.phone}</div>
              )}
            </Card>
          );
        })}
      </div>
    </Page>
  );
}

// ─── CEO ANALYTICS ───────────────────────────────────────
function AnalyticsScreen({ data }) {
  const contacts = data.contacts || [];
  const mileage = data.mileageLog || [];
  const pipeline = contacts.reduce((s,c)=>s+(c.amount||0),0);
  const won = contacts.filter(c=>c.status==="won").reduce((s,c)=>s+(c.amount||0),0);
  const lost = contacts.filter(c=>c.status==="lost").reduce((s,c)=>s+(c.amount||0),0);
  const withCost = contacts.filter(c=>c.cost>0);
  const totalCost = withCost.reduce((s,c)=>s+(c.cost||0),0);
  const totalRevWithCost = withCost.reduce((s,c)=>s+(c.amount||0),0);
  const avgMargin = totalRevWithCost > 0 ? Math.round(((totalRevWithCost-totalCost)/totalRevWithCost)*100) : 0;
  const winRate = (won + lost) > 0 ? Math.round((won / (won + lost)) * 100) : 0;
  const totalMiles = mileage.reduce((s,m)=>s+(m.miles||0),0);
  const taxDeduction = Math.round(totalMiles * 0.67);
  const statuses = ["new","active","follow-up","won","lost"];
  const stageCounts = statuses.map(s => ({ s, count: contacts.filter(c=>c.status===s).length }));
  const maxCount = Math.max(...stageCounts.map(x=>x.count), 1);
  const byType = Object.keys(TYPE_CFG)
    .map(t => ({ t, count:contacts.filter(c=>c.type===t).length, rev:contacts.filter(c=>c.type===t).reduce((s,c)=>s+(c.amount||0),0) }))
    .filter(x=>x.count>0)
    .sort((a,b)=>b.rev-a.rev);

  // Sub-components scoped to this screen — use shared primitives only
  const HeroStat = ({ label, value, accent }) => (
    <div style={{
      background:"rgba(255,255,255,.035)",
      border:"1px solid rgba(255,255,255,.07)",
      borderRadius:R.md,
      padding:`${SP[3]+1}px ${SP[3]+1}px`,
      minWidth:0,
    }}>
      <div style={{
        fontSize:FS.meta-2, fontWeight:700, color:"rgba(255,255,255,.45)",
        textTransform:"uppercase", letterSpacing:LS.uppercase,
        lineHeight:1,
      }}>{label}</div>
      <div style={{
        fontSize:FS.h1, fontWeight:700, color: accent || "#fff",
        fontFamily:FF.sans, letterSpacing:LS.tight, lineHeight:1,
        marginTop:SP[2]+1,
        fontVariantNumeric:"tabular-nums",
        whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
      }}>{value}</div>
    </div>
  );

  return (
    <Page>
      {/* CEO hero — always dark */}
      <section style={{
        background:"linear-gradient(160deg, #141414 0%, #1a1508 100%)",
        border:"1px solid rgba(201,150,58,.2)",
        borderRadius:R.lg,
        padding:`${SP[5]}px ${SP[5]}px ${SP[5]+SP[1]}px`,
        marginBottom:SP[5],
        position:"relative",
        overflow:"hidden",
      }}>
        <div style={{
          position:"absolute", top:-100, right:-80,
          width:280, height:280,
          background:"radial-gradient(circle, rgba(201,150,58,0.12) 0%, transparent 65%)",
          pointerEvents:"none",
        }} />
        <div style={{
          fontSize:FS.meta-1, color:"rgba(255,255,255,.5)",
          fontWeight:700, letterSpacing:LS.uppercase,
          textTransform:"uppercase", marginBottom:SP[2],
          lineHeight:1,
        }}>CEO Dashboard</div>
        <div style={{
          fontFamily:FF.display, fontSize:FS.hero, fontWeight:400,
          color:"#fff", letterSpacing:LS.tight, lineHeight:.95,
          marginBottom:SP[5], position:"relative",
          fontVariantNumeric:"tabular-nums",
        }}>
          ${(pipeline/1000).toFixed(0)}<span style={{ color:T.gold }}>K</span>
          <span style={{
            display:"block", fontFamily:FF.sans, fontSize:FS.meta,
            fontWeight:600, color:"rgba(255,255,255,.5)",
            letterSpacing:LS.uppercase, textTransform:"uppercase",
            marginTop:SP[2],
          }}>Total Pipeline</span>
        </div>
        <div style={{
          display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
          gap:SP[2], position:"relative",
        }}>
          <HeroStat label="Won" value={`$${(won/1000).toFixed(0)}K`} accent="#6EC98A" />
          <HeroStat label="Win Rate" value={`${winRate}%`} accent={winRate>50 ? "#6EC98A" : winRate>30 ? T.gold : "#E87E74"} />
          <HeroStat label="Margin" value={`${avgMargin}%`} accent={avgMargin>25 ? "#6EC98A" : avgMargin>15 ? T.gold : "#E87E74"} />
        </div>
      </section>

      {/* Pipeline by stage */}
      <SectionHeader>Pipeline by Stage</SectionHeader>
      <Card style={{ padding:SP[4], marginBottom:SP[5] }}>
        <div style={{ display:"flex", flexDirection:"column", gap:SP[3] }}>
          {stageCounts.map(({ s, count }) => {
            const sc = STATUS_CFG[s];
            const pct = (count / maxCount) * 100;
            return (
              <div key={s} style={{ display:"flex", alignItems:"center", gap:SP[3] }}>
                <span style={{
                  width:78, fontSize:FS.meta, color:T.textSecondary,
                  textTransform:"uppercase", letterSpacing:LS.label, fontWeight:700,
                  textAlign:"right", flexShrink:0,
                }}>{sc.label}</span>
                <div style={{
                  flex:1, height:22,
                  background:T.bgSection,
                  borderRadius:R.sm,
                  overflow:"hidden",
                  position:"relative",
                }}>
                  <div style={{
                    width:`${pct}%`, height:"100%",
                    background:sc.bg,
                    borderRight: count>0 ? `2px solid ${sc.color}` : "none",
                    minWidth: count>0 ? 32 : 0,
                    transition:`width ${MO.slow}`,
                  }} />
                  <span style={{
                    position:"absolute", right:SP[2]+1, top:"50%", transform:"translateY(-50%)",
                    fontSize:FS.meta, fontWeight:700,
                    color: count>0 ? sc.color : T.textMuted,
                  }}>{count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Revenue by service type */}
      <SectionHeader>Revenue by Service</SectionHeader>
      <div style={{ display:"flex", flexDirection:"column", gap:SP[2], marginBottom:SP[5] }}>
        {byType.length === 0 && (
          <EmptyState title="No revenue yet" body="Add jobs with contract amounts to see this breakdown." />
        )}
        {byType.map(x => {
          const tc = TYPE_CFG[x.t];
          const sharePct = pipeline > 0 ? Math.round((x.rev / pipeline) * 100) : 0;
          return (
            <Card key={x.t} accent={tc.color} style={{ padding:`${SP[3]+1}px ${SP[4]}px` }}>
              <div style={{ display:"flex", alignItems:"center", gap:SP[3] }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{
                    fontSize:FS.lead, fontWeight:700, color:T.text,
                    letterSpacing:LS.tight,
                  }}>{tc.label}</div>
                  <div style={{
                    fontSize:FS.meta, color:T.textSecondary,
                    marginTop:2,
                  }}>{x.count} job{x.count!==1?"s":""} · {sharePct}% of pipeline</div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{
                    fontSize:FS.h4, fontWeight:700, color:T.text,
                    letterSpacing:LS.tight,
                    fontVariantNumeric:"tabular-nums",
                  }}>${(x.rev/1000).toFixed(0)}K</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Mileage / tax */}
      <SectionHeader>Mileage & Tax</SectionHeader>
      <Card style={{ padding:SP[4], marginBottom:SP[5] }}>
        <div style={{
          display:"grid", gridTemplateColumns:"1fr 1fr",
          gap:0, marginBottom:SP[4],
          background:T.bgSection,
          borderRadius:R.md,
          overflow:"hidden",
        }}>
          <div style={{ borderRight:`1px solid ${T.border}` }}>
            <Stat label="Total Miles" value={totalMiles} align="center" />
          </div>
          <Stat label="Tax Deduction" value={`$${taxDeduction}`} accent={T.green} align="center" />
        </div>
        {mileage.length === 0 && (
          <div style={{ fontSize:FS.meta, color:T.textMuted, textAlign:"center", padding:`${SP[3]}px 0` }}>
            No mileage logged yet.
          </div>
        )}
        {mileage.map((m, i) => (
          <div key={m.id} style={{
            display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:`${SP[3]}px 0`,
            borderTop: i === 0 ? "none" : `1px solid ${T.border}`,
          }}>
            <div style={{ minWidth:0, flex:1 }}>
              <div style={{ fontSize:FS.body, fontWeight:600, color:T.text }}>{m.job}</div>
              {m.notes && (
                <div style={{ fontSize:FS.meta, color:T.textMuted, marginTop:2 }}>{m.notes}</div>
              )}
            </div>
            <span style={{
              fontSize:FS.body, color:T.gold, fontWeight:700,
              fontVariantNumeric:"tabular-nums",
            }}>{m.miles} mi</span>
          </div>
        ))}
      </Card>

      {/* Margin view — full table */}
      <SectionHeader>All Contacts</SectionHeader>
      <div style={{ display:"flex", flexDirection:"column", gap:SP[2] }}>
        {contacts.length === 0 && (
          <EmptyState title="No contacts yet" body="Add contacts in Jobs & CRM to see them listed here." />
        )}
        {contacts.map(c => {
          const margin = c.cost>0 ? Math.round(((c.amount-c.cost)/c.amount)*100) : null;
          return (
            <Card key={c.id} style={{ padding:`${SP[3]+1}px ${SP[4]}px` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:SP[3] }}>
                <div style={{ minWidth:0, flex:1 }}>
                  <div style={{
                    fontSize:FS.body, fontWeight:700, color:T.text,
                    letterSpacing:LS.tight,
                    whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                  }}>{c.name}</div>
                  <div style={{
                    fontSize:FS.meta, color:T.textSecondary, marginTop:2,
                    whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                  }}>{c.job}</div>
                </div>
                <div style={{
                  display:"flex", alignItems:"center", gap:SP[2],
                  flexShrink:0,
                }}>
                  <span style={{
                    fontSize:FS.body, fontWeight:700, color:T.text,
                    fontVariantNumeric:"tabular-nums",
                  }}>${(c.amount/1000).toFixed(0)}K</span>
                  {margin !== null && (
                    <span style={{
                      background: margin>30 ? T.greenLt : margin>15 ? T.amberLt : T.redLt,
                      color: margin>30 ? T.green : margin>15 ? T.amber : T.red,
                      border: `1px solid ${margin>30 ? T.greenBorder : margin>15 ? T.amberBorder : T.redBorder}`,
                      fontSize:FS.meta-2, fontWeight:700,
                      padding:"2px 8px", borderRadius:R.full,
                      letterSpacing:LS.label, textTransform:"uppercase",
                    }}>{margin}%</span>
                  )}
                  <Badge s={c.status} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </Page>
  );
}

// ─── ERROR BOUNDARY ──────────────────────────────────────
// Catches runtime crashes in Partner/Inspection screens so the whole app
// doesn't go white. Shows the error message inline instead.
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e?.message || String(e) }; }
  componentDidCatch(e, info) { console.error("[ErrorBoundary]", e, info?.componentStack); }
  render() {
    if (this.state.error) return (
      <div style={{ padding:40, fontFamily:"'DM Sans', sans-serif" }}>
        <div style={{ fontSize:18, fontWeight:700, color:"#C0392B", marginBottom:8 }}>Screen Error</div>
        <div style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.6, marginBottom:16 }}>{this.state.error}</div>
        <button onClick={() => this.setState({ error: null })} style={{
          padding:"10px 20px", borderRadius:10, border:"1px solid var(--border)",
          background:"var(--bg-card)", color:"var(--text-primary)", cursor:"pointer",
          fontSize:13, fontWeight:600, fontFamily:"inherit",
        }}>Try Again</button>
      </div>
    );
    return this.props.children;
  }
}

// ═══════ MAIN APP ══════════════════════════════════════════
const NAV = [
  { id:"home",     icon:"home",      label:"Home" },
  { id:"capture",  icon:"note",      label:"Notes" },
  { id:"leads",    icon:"briefcase", label:"Jobs" },
  { id:"schedule", icon:"calendar",  label:"Schedule" },
  { id:"partner",  icon:"handshake", label:"Partner" },
  { id:"inspect",  icon:"clipboard", label:"Inspect" },
];

const SCREEN_TO_NAV = { home:"home", capture:"capture", leads:"leads", detail:"leads", compose:"home", schedule:"schedule", bid:"home", analytics:"home", subs:"home", settings:"home", partner:"partner", inspect:"inspect" };

// SCREEN_BACK is for the top-bar back arrow — where each screen returns to
const SCREEN_BACK = { capture:"home", leads:"home", detail:"leads", compose:"home", schedule:"home", bid:"home", analytics:"home", subs:"home", settings:"home", partner:"home", inspect:"home" };

const SCREEN_TITLES = { capture:"Field Notes", leads:"Jobs & CRM", detail:null, compose:"AI Compose", schedule:"Schedule", bid:"Bid Engine", analytics:"CEO Dashboard", subs:"Sub-Contractors", settings:"Settings", partner:"Partner Jobs", inspect:"Inspections" };

// ─── SETTINGS SCREEN ────────────────────────────────────
function SettingsScreen({ companyName, setCompanyName, currentUser, onSwitchUser }) {
  const [name, setName] = useState(companyName || "");
  const [saved, setSaved] = useState(false);
  const { isDark, toggle } = useTheme();

  const save = () => {
    const trimmed = name.trim();
    localStorage.setItem("fh:company", trimmed);
    setCompanyName(trimmed);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Settings card wrapper — consistent inner spacing
  // Local wrapper — Card with section header. Screen-specific.
  const SettingsCard = ({ title, children }) => (
    <Card style={{ padding:`${SP[5]}px ${SP[5]}px`, marginBottom:SP[3] }}>
      <SectionHeader>{title}</SectionHeader>
      {children}
    </Card>
  );
  // Row + Toggle now come from the shared primitives import.

  return (
    <div style={{ padding:`${SP[5]}px ${SP[5]}px ${SP[6]}px` }}>
      <SettingsCard title="Account">
        <Row
          title={currentUser?.name || "—"}
          description={currentUser?.company || "Field Operations"}
          control={
            <Btn variant="ghost" size="sm" onClick={onSwitchUser} leftIcon={<Icon name="switchUser" size={14} />}>
              Switch
            </Btn>
          }
        />
      </SettingsCard>

      <SettingsCard title="Appearance">
        <Row
          title="Dark mode"
          description={isDark ? "Dark theme active" : "Light theme active"}
          control={<Toggle on={isDark} onClick={toggle} />}
        />
      </SettingsCard>

      <SettingsCard title="Company">
        <div style={{ fontSize:FS.meta, color:T.textMuted, marginBottom:SP[3], lineHeight:1.5 }}>
          Used in the app header and on generated messages.
        </div>
        <Field label="Company name">
          <Input placeholder="e.g. Parker Construction Co." value={name} onChange={e => setName(e.target.value)} />
        </Field>
        <div style={{ marginTop:SP[4] }}>
          <Btn variant="primary" full onClick={save} leftIcon={saved ? <Icon name="check" size={16} stroke={2.5} /> : null}>
            {saved ? "Saved" : "Save"}
          </Btn>
        </div>
      </SettingsCard>

      <SettingsCard title="About">
        <div style={{ fontSize:FS.body, color:T.text, fontWeight:600, marginBottom:SP[1]+1 }}>
          Fieldhorse
        </div>
        <div style={{ fontSize:FS.meta, color:T.textMuted, lineHeight:1.6 }}>
          Field Operations Platform · Premium contractor management for jobs, bids, scheduling, AI messaging, inspections, and partner tracking.
        </div>
      </SettingsCard>
    </div>
  );
}

// ─── AUTH WRAPPER ────────────────────────────────────────
export default function AuthWrapper() {
  const [currentUser, setCurrentUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("fh_current_user");
      if (raw) {
        const u = JSON.parse(raw);
        if (u && u.id && u.name) setCurrentUser(u);
      }
    } catch { /* corrupt session — fall through to login */ }
    setChecking(false);
  }, []);

  if (checking) return (
    <div style={{ minHeight:"100vh", background:"#0d0d0d", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
      <FieldhorseLogo size={36} surface="dark" showSub={true} />
    </div>
  );

  if (!currentUser) {
    return (
      <LoginScreen
        onLogin={(user) => {
          localStorage.setItem("fh_current_user", JSON.stringify(user));
          setCurrentUser(user);
        }}
      />
    );
  }

  return <App currentUser={currentUser} setCurrentUser={setCurrentUser} />;
}

function App({ currentUser, setCurrentUser }) {
  const [screen, setScreen] = useState("home");
  const [sel, setSel] = useState(null);
  const [data, setData] = useState({ contacts:[], notes:[], messages:[], subs:[], mileageLog:[], weeklyTarget:45000, scheduled:[] });
  const [loaded, setLoaded] = useState(false);
  const [companyName, setCompanyName] = useState(currentUser?.company || localStorage.getItem("fh:company") || "");

  const switchUser = () => {
    localStorage.removeItem("fh_current_user");
    setCurrentUser(null);
  };

  useEffect(() => {
    if (!currentUser?.id) return;
    setLoaded(false);
    (async () => {
      const key = `fieldcap:data:v2:${currentUser.id}`;
      let d = await S.get(key);
      if (!d) {
        if (currentUser.id === "jesse") {
          // Migrate Jesse's old v1 data if it exists, otherwise use the sample seed.
          const legacy = await S.get(`fieldcap:data:jesse`);
          d = legacy || INIT;
        } else {
          // All other users (partner, guest) start with a completely blank slate.
          d = BLANK_INIT;
        }
        await S.set(key, d);
      }
      setData(d);
      setLoaded(true);
    })();
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser?.company) setCompanyName(currentUser.company);
  }, [currentUser]);

  useEffect(() => {
    if (sel && data.contacts) {
      const u = data.contacts.find(c=>c.id===sel.id);
      if (u) setSel(u);
    }
    // Adding `sel` to deps would loop (effect calls setSel). Re-finding only on data change is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const title = screen==="detail" ? sel?.name : SCREEN_TITLES[screen];

  if (!loaded) return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
      <div style={{ marginBottom:24 }}>
        <FieldhorseLogo size={32} surface="light" showSub={true} />
      </div>
      <div style={{ fontSize:12, color:T.stoneXlt, letterSpacing:".2em", fontWeight:700, fontFamily:"'Bebas Neue',Georgia,serif" }}>LOADING…</div>
    </div>
  );

  return (
    <div style={{ maxWidth:430, margin:"0 auto", minHeight:"100vh", background:T.bg, fontFamily:FF.sans, color:T.text, display:"flex", flexDirection:"column", position:"relative" }}>

      {/* TOP BAR */}
      <header style={{
        padding:`${SP[4]+1}px ${SP[5]}px ${SP[4]}px`,
        display:"flex", justifyContent:"space-between", alignItems:"center",
        background:T.bgHeader,
        borderBottom:"1px solid rgba(201,150,58,.18)",
        position:"sticky", top:0, zIndex:100,
        boxShadow:"0 1px 0 rgba(201,150,58,.04)",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:SP[3], minWidth:0 }}>
          {screen !== "home" && SCREEN_BACK[screen] && (
            <button
              onClick={()=>setScreen(SCREEN_BACK[screen])}
              aria-label="Back"
              style={{
                background:"none", border:"none", padding:0, cursor:"pointer",
                color:T.gold, display:"flex", alignItems:"center",
                marginRight: -SP[1],
              }}
            >
              <Icon name="chevronLeft" size={24} stroke={2} />
            </button>
          )}
          {screen==="home" ? (
            <div style={{ display:"flex", flexDirection:"column", minWidth:0 }}>
              <FieldhorseLogo size={22} showSub={false} />
              <div style={{
                fontSize:FS.meta-2, color:T.textSecondary,
                fontWeight:600, letterSpacing:LS.uppercase,
                marginTop:SP[1]+1, textTransform:"uppercase",
                whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
              }}>
                {currentUser ? `${currentUser.name}${currentUser.company ? " · " + currentUser.company : ""}` : companyName}
              </div>
            </div>
          ) : (
            <h1 style={{
              fontSize:FS.h4, fontWeight:700, color:T.text,
              letterSpacing:LS.tight, margin:0, lineHeight:1.2,
              whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
            }}>{title}</h1>
          )}
        </div>
        <div style={{ display:"flex", gap:SP[2], flexShrink:0 }}>
          {currentUser?.role !== "guest" && (
            <IconButton
              icon={<Icon name="barChart" size={18} />}
              active={screen==="analytics"}
              onClick={()=>setScreen("analytics")}
              label="Analytics"
            />
          )}
          <IconButton
            icon={<Icon name="wrench" size={18} />}
            active={screen==="subs"}
            onClick={()=>setScreen("subs")}
            label="Subs"
          />
          <IconButton
            icon={<Icon name="settings" size={18} />}
            active={screen==="settings"}
            onClick={()=>setScreen("settings")}
            label="Settings"
          />
        </div>
      </header>

      {/* CONTENT */}
      <div style={{ flex:1, overflowY:"auto", paddingBottom:80 }}>
        {screen==="home"     && <HomeScreen data={data} setScreen={setScreen} setSel={setSel} currentUser={currentUser} />}
        {screen==="capture"  && <CaptureScreen data={data} setData={setData} />}
        {screen==="leads"    && <LeadsScreen data={data} setData={setData} setScreen={setScreen} setSel={setSel} />}
        {screen==="detail"   && sel && <DetailScreen contact={sel} data={data} setData={setData} setScreen={setScreen} currentUser={currentUser} />}
        {screen==="compose"  && <ComposeScreen data={data} setData={setData} />}
        {screen==="bid"      && <BidScreen />}
        {screen==="schedule" && <ScheduleScreen data={data} setData={setData} currentUser={currentUser} />}
        {screen==="analytics"&& (currentUser?.role==="guest" ? <NoAccess label="CEO Analytics" /> : <AnalyticsScreen data={data} />)}
        {screen==="subs"     && <SubsScreen data={data} setData={setData} />}
        {screen==="partner"  && (currentUser?.role==="guest" ? <NoAccess label="Partner Tracker" /> : <ErrorBoundary><PartnerTracker currentUser={currentUser} /></ErrorBoundary>)}
        {screen==="inspect"  && <ErrorBoundary><InspectionTracker currentUser={currentUser} /></ErrorBoundary>}
        {screen==="settings" && <SettingsScreen companyName={companyName} setCompanyName={setCompanyName} currentUser={currentUser} onSwitchUser={switchUser} />}
      </div>

      {/* BOTTOM NAV */}
      <nav style={{
        position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
        width:"100%", maxWidth:430,
        display:"flex",
        background:T.bgHeader,
        borderTop:`1px solid ${T.border}`,
        padding:`${SP[2]+1}px ${SP[2]}px ${SP[6]}px`,
        zIndex:100,
      }}>
        {NAV.filter(tab=> !(currentUser?.role==="guest" && tab.id==="partner")).map(tab=>{
          const active = SCREEN_TO_NAV[screen]===tab.id || screen===tab.id;
          return (
            <button
              key={tab.id}
              onClick={()=>setScreen(tab.id)}
              aria-label={tab.label}
              aria-current={active ? "page" : undefined}
              style={{
                background:"none", border:"none", cursor:"pointer",
                display:"flex", flexDirection:"column", alignItems:"center", gap:SP[1],
                padding:`${SP[1]+2}px ${SP[1]}px`,
                fontFamily:FF.sans,
                flex:1, minWidth:0,
                position:"relative",
                color: active ? T.gold : T.textMuted,
                transition:`color ${MO.fast}`,
              }}
            >
              <Icon name={tab.icon} size={20} stroke={active ? 2 : 1.6} />
              <span style={{
                fontSize:FS.meta-2, fontWeight:700,
                letterSpacing:LS.uppercase, textTransform:"uppercase",
                color:"inherit",
              }}>{tab.label}</span>
              <div style={{
                position:"absolute", bottom:-SP[2]-1, left:"50%", transform:"translateX(-50%)",
                width: active ? 24 : 0, height:2,
                borderRadius:R.full,
                background:T.gold,
                transition:`width ${MO.base}`,
              }} />
            </button>
          );
        })}
      </nav>
    </div>
  );
}
