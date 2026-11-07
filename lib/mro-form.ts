/**
 * The MRO Capabilities & Approvals form, as data. The sign-up pop-up, the account editor
 * and the public MRO pages all read from here, so the form is defined once.
 *
 * Capability items are stored by key (a slug of the label), so keep labels stable or the
 * stored selections stop matching.
 */

export type MroCapabilityGroup = { key: string; title: string; section: "components" | "other"; items: { key: string; label: string }[] };
export type MroApprovalGroup = "regulatory" | "quality" | "oem";
export type MroApproval = {
  group: MroApprovalGroup;
  /** Fixed option key, or "oem-1" … for OEM rows and "other-authority" for a named authority. */
  key: string;
  name: string;
  certificateNo: string;
  /** yyyy-mm-dd, or "" when not given. */
  expiry: string;
  scope: string;
};
export type MroProfile = {
  capabilities: string[];
  componentNotes: string;
  aircraftTypes: string;
  aogResponseHours: string;
  otherLocations: string;
  approvals: MroApproval[];
};

/** Public view of an approval. Certificate details are withheld from signed-out visitors. */
export type PublicMroApproval = { group: MroApprovalGroup; key: string; name: string; expired: boolean; certificateNo?: string; expiry?: string; scope?: string };
export type PublicMroProfile = {
  supplierId: string;
  capabilities: string[];
  componentNotes: string | null;
  aircraftTypes: string | null;
  aogResponseHours: number | null;
  otherLocations: string | null;
  approvals: PublicMroApproval[];
};

const slug = (label: string) => label.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const group = (title: string, section: MroCapabilityGroup["section"], labels: string[]): MroCapabilityGroup => ({
  key: slug(title),
  title,
  section,
  items: labels.map((label) => ({ key: `${slug(title)}:${slug(label)}`, label })),
});

export const MRO_CAPABILITY_GROUPS: MroCapabilityGroup[] = [
  group("Engines and propulsion", "components", [
    "Turbofan / turbojet engine overhaul", "Turboprop / turboshaft engine overhaul", "Piston engine overhaul", "Propellers (hubs, blades, governors)",
    "Starter generators", "Starters", "Accessory and reduction gearboxes", "Fuel controls and FADEC units",
    "Thrust reversers and nacelle components", "Ignition systems and exciters", "Oil coolers and heat exchangers", "Engine mounts and cowlings",
  ]),
  group("Auxiliary power units (APU)", "components", [
    "APU overhaul", "APU starter generators and starters", "APU fuel controls", "APU gearboxes", "APU inlet and exhaust components",
  ]),
  group("Landing gear, wheels and brakes", "components", [
    "Main landing gear overhaul", "Nose landing gear overhaul", "Retraction and steering actuators", "Shock struts and oleos",
    "Wheels (inspection, overhaul)", "Brakes (steel and carbon)", "Anti-skid and brake control units", "Tire retreading and servicing",
  ]),
  group("Hydraulics and pneumatics", "components", [
    "Hydraulic pumps and motors", "Hydraulic actuators (linear, rotary)", "Servo valves and control valves", "Accumulators and reservoirs",
    "Pneumatic and bleed air valves", "Pressure regulators and shut-off valves",
  ]),
  group("Flight controls", "components", [
    "Flap and slat actuators and drives", "Spoiler and aileron actuators", "Trim actuators", "Control surface repair and rebalancing", "Control cables, rods, and bellcranks",
  ]),
  group("Avionics and instruments", "components", [
    "Flight management and navigation computers", "Displays (EFIS, CRT, LCD)", "Communication radios and audio systems", "Radar (weather, radio altimeter)",
    "TCAS, transponders, and ADS-B", "Flight data and cockpit voice recorders", "Autopilot and flight control computers", "Inertial reference and air data units",
    "Pitot-static, gyro, and mechanical instruments",
  ]),
  group("Electrical power and lighting", "components", [
    "Generators, IDGs, and CSDs", "Batteries (lead-acid, NiCd, Li-ion)", "Inverters, TRUs, and converters", "Power distribution and contactors",
    "Wiring harness repair", "Interior and exterior lighting",
  ]),
  group("Environmental and pressurization", "components", [
    "Air conditioning packs and air cycle machines", "Heat exchangers", "Cabin pressure controllers and outflow valves", "Fans, blowers, and ducting", "Temperature controllers and sensors",
  ]),
  group("Fuel systems", "components", ["Fuel pumps (boost, transfer)", "Fuel valves and regulators", "Fuel quantity indication", "Fuel tank components and probes"]),
  group("Fire protection, oxygen, and safety", "components", [
    "Fire extinguishers and bottles", "Fire and smoke detection", "Oxygen cylinders and regulators", "Escape slides and life rafts", "Life vests and survival equipment",
  ]),
  group("Cabin equipment", "components", ["Passenger and crew seats", "Galley equipment and inserts", "Lavatory and water systems", "In-flight entertainment and cabin management"]),
  group("Rotary-wing components", "components", ["Main and tail rotor blades", "Rotor heads and swashplates", "Main and tail rotor gearboxes", "Rotor drive shafts and couplings"]),
  group("Structures and finishing", "other", [
    "Structural repair", "Composite repair", "Sheet metal fabrication and machining", "Corrosion treatment", "Windows and windshields",
    "Non-destructive testing (NDT) (Eddy current, ultrasonic, X-ray, penetrant, magnetic particle)", "Painting and livery", "Cabin and interior refurbishment",
  ]),
  group("Support", "other", [
    "Component pooling and exchange", "Calibration laboratory", "Engineering and technical records services", "Tooling and ground support equipment", "Logistics and customs handling",
  ]),
  group("Maintenance", "other", [
    "Line maintenance", "Base maintenance", "AOG recovery", "Modifications and retrofit", "Storage, preservation, and reactivation", "Pre-purchase and lease-return inspections",
  ]),
];

export const MRO_APPROVAL_OPTIONS: Record<Exclude<MroApprovalGroup, "oem">, { key: string; name: string; short: string }[]> = {
  regulatory: [
    { key: "faa-145", name: "FAA Part 145", short: "FAA 145" },
    { key: "easa-145", name: "EASA Part-145", short: "EASA 145" },
    { key: "kcaa-amo", name: "KCAA (Kenya) AMO", short: "KCAA AMO" },
    { key: "uk-caa-145", name: "UK CAA Part-145", short: "UK CAA 145" },
    { key: "tc-amo", name: "Transport Canada AMO", short: "TC AMO" },
    { key: "anac-145", name: "ANAC (Brazil) RBAC 145", short: "ANAC 145" },
    { key: "other-authority", name: "Other national authority", short: "Other authority" },
  ],
  quality: [
    { key: "iso-9001", name: "ISO 9001", short: "ISO 9001" },
    { key: "as9100", name: "AS9100", short: "AS9100" },
    { key: "nadcap", name: "NADCAP (special processes)", short: "NADCAP" },
    { key: "iso-45001", name: "ISO 45001 / OHS", short: "ISO 45001" },
    { key: "sms", name: "Safety Management System (SMS) accepted", short: "SMS" },
  ],
};

export const MRO_APPROVAL_GROUP_TITLES: Record<MroApprovalGroup, string> = {
  regulatory: "Regulatory approvals",
  quality: "Quality standards and certifications",
  oem: "OEM and type-specific authorizations",
};

export const MAX_OEM_APPROVALS = 10;

export const EMPTY_MRO_PROFILE: MroProfile = { capabilities: [], componentNotes: "", aircraftTypes: "", aogResponseHours: "", otherLocations: "", approvals: [] };

const ALL_ITEMS = new Map(MRO_CAPABILITY_GROUPS.flatMap((g) => g.items.map((item) => [item.key, { ...item, group: g }] as const)));

export function capabilityLabel(key: string): string | null {
  return ALL_ITEMS.get(key)?.label ?? null;
}

/** Capability groups with at least one selected item, in form order. */
export function selectedGroups(capabilities: string[]): { group: MroCapabilityGroup; items: { key: string; label: string }[] }[] {
  const chosen = new Set(capabilities);
  return MRO_CAPABILITY_GROUPS
    .map((g) => ({ group: g, items: g.items.filter((item) => chosen.has(item.key)) }))
    .filter((entry) => entry.items.length > 0);
}

/** Short badge text for an approval ("FAA 145", or the typed name for OEM / other). */
export function approvalShortName(approval: { group: MroApprovalGroup; key: string; name: string }): string {
  if (approval.group === "oem" || approval.key === "other-authority") return approval.name;
  return MRO_APPROVAL_OPTIONS[approval.group].find((option) => option.key === approval.key)?.short ?? approval.name;
}

/** Problems that stop the form being saved (empty when it can be saved). */
export function validateMroProfile(profile: MroProfile): string[] {
  const problems: string[] = [];
  if (!profile.capabilities.length) problems.push("Select at least one capability.");
  if (profile.aogResponseHours.trim() && !(Number(profile.aogResponseHours) >= 0)) problems.push("AOG response time must be a number of hours.");
  for (const approval of profile.approvals) {
    const label = approval.name.trim() || (approval.group === "oem" ? "Each OEM authorization" : "Each approval");
    if (!approval.name.trim()) problems.push(`${label} needs a name.`);
    else if (!approval.certificateNo.trim()) problems.push(`${label} needs a certificate number.`);
  }
  return problems;
}

/** Turns stored / untrusted JSON into a clean profile (unknown keys and bad values dropped). */
export function normalizeMroProfile(value: unknown): MroProfile {
  const raw = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const text = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : typeof v === "number" ? String(v) : "");
  const capabilities = Array.isArray(raw.capabilities) ? [...new Set(raw.capabilities.filter((key): key is string => typeof key === "string" && ALL_ITEMS.has(key)))] : [];
  const approvals = (Array.isArray(raw.approvals) ? raw.approvals : [])
    .filter((a): a is Record<string, unknown> => Boolean(a) && typeof a === "object")
    .map((a) => ({
      group: (["regulatory", "quality", "oem"].includes(a.group as string) ? a.group : "oem") as MroApprovalGroup,
      key: text(a.key, 40),
      name: text(a.name, 120),
      certificateNo: text(a.certificateNo, 80),
      expiry: /^\d{4}-\d{2}-\d{2}$/.test(text(a.expiry, 10)) ? text(a.expiry, 10) : "",
      scope: text(a.scope, 500),
    }))
    .slice(0, 30);
  return {
    capabilities,
    componentNotes: text(raw.componentNotes, 2000),
    aircraftTypes: text(raw.aircraftTypes, 1000),
    aogResponseHours: text(raw.aogResponseHours, 8),
    otherLocations: text(raw.otherLocations, 1000),
    approvals,
  };
}

/** Saved in this browser when a visitor fills the form before creating an account. */
export const MRO_DRAFT_KEY = "aviainventory_mro_profile_draft_v1";

export function readMroDraft(): MroProfile | null {
  try {
    const raw = localStorage.getItem(MRO_DRAFT_KEY);
    return raw ? normalizeMroProfile(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function writeMroDraft(profile: MroProfile | null) {
  try {
    if (profile) localStorage.setItem(MRO_DRAFT_KEY, JSON.stringify(profile));
    else localStorage.removeItem(MRO_DRAFT_KEY);
  } catch { /* storage unavailable */ }
}
