// src/lib/domain.js
// Domain configuration — what the app knows about contractor projects.
// Imported by primitives (Badge, TypeBadge, Avatar) AND screens (App.jsx, PartnerTracker, InspectionTracker).

import { T } from "../ui/tokens";

// Project status — used in CRM, analytics, partner tracker.
export const STATUS_CFG = {
  "new":       { bg:T.blueLt,  color:T.blue,  border:"rgba(37,99,235,.4)",  label:"New" },
  "active":    { bg:T.greenLt, color:T.green, border:T.greenBorder,         label:"Active" },
  "follow-up": { bg:T.amberLt, color:T.amber, border:T.amberBorder,         label:"Follow-up" },
  "won":       { bg:T.greenLt, color:T.green, border:T.greenBorder,         label:"Won" },
  "lost":      { bg:T.redLt,   color:T.red,   border:T.redBorder,           label:"Lost" },
  "pending":   { bg:T.purpleLt,color:T.purple,border:"rgba(124,58,237,.4)", label:"Pending" },
};

// Stage left-border colors for job cards in lists.
export const STATUS_BORDER = {
  active: T.green,
  "follow-up": T.gold,
  new: T.blue,
  won: T.green,
  lost: T.red,
  pending: T.purple,
};

// Project type — drives Avatar color, TypeBadge, milestones.
export const TYPE_CFG = {
  "new-construction": { label:"New Construction", color:T.teal },
  "renovation":       { label:"Renovation",       color:T.purple },
  "concrete":         { label:"Concrete",         color:T.textSecondary },
  "outdoor-living":   { label:"Outdoor Living",   color:T.green },
  "insurance":        { label:"Insurance",        color:T.amber },
  "roofing":          { label:"Roofing",          color:T.red },
};

// Per-type milestone checklists used in the contact detail screen.
export const MILESTONES = {
  "new-construction": ["Permits pulled","Site prep","Foundation","Framing","Roof","MEP rough-in","Insulation","Drywall","Trim & doors","Flooring","Paint","Fixtures","Final punch","CO received"],
  "renovation":       ["Demo","Framing","MEP rough-in","Insulation","Drywall","Trim & doors","Flooring","Paint","Fixtures","Final punch"],
  "concrete":         ["Layout & demo","Excavation / grade","Form set","Rebar","Pour","Finish & cure","Seal"],
  "outdoor-living":   ["Design approved","Site prep","Foundation / footings","Structure frame","Decking / hardscape","Electrical & lighting","Finish details","Final walkthrough"],
  "insurance":        ["Claim filed","Adjuster inspection","Scope approved","Materials ordered","Work start","Work complete","Final invoice","Supplement filed","Payment received"],
  "roofing":          ["Inspection","Insurance approval","Materials ordered","Tear-off","Decking check","Install","Flashing & ridge","Final inspection","Invoice sent"],
};

// Per-type inspection checklists for the in-detail inspection log.
export const INSPECTION_TYPES_BY_JOB_TYPE = {
  "new-construction": ["Footing/Foundation","Framing","Electrical rough-in","Plumbing rough-in","HVAC rough-in","Insulation","Drywall","Final Building","Certificate of Occupancy"],
  "renovation":       ["Demo permit","Framing","Electrical rough-in","Plumbing rough-in","Final"],
  "concrete":         ["Form and rebar (before pour)","Footing","Foundation","Final flatwork"],
  "outdoor-living":   ["Footing/pier","Structural framing","Electrical rough-in","Final"],
  "roofing":          ["Decking","Underlayment","Final roof","Insurance adjuster"],
  "insurance":        ["Initial adjuster","Re-inspection after supplement","Work completion","Final sign-off"],
};

// Bid engine standard rate card.
export const RATES = {
  concrete_sqft:"$8-12", framing_lf:"$4-7", drywall_sqft:"$2.50-4",
  demo_sqft:"$3-6", roofing_sqft:"$5-9", electrical_point:"$150-250",
  plumbing_rough:"$800-1500", insulation_sqft:"$1.50-3", lvp_flooring_sqft:"$4-7",
  paint_sqft:"$1.50-3", permits:"$200-800", outdoor_living_sqft:"$25-65",
  concrete_pour_sqft:"$8-12",
};
