import type { Ticket, CalendarEvent, Summary } from '../components/pm/types';

// ─────────────────────────────────────────────────────────────────────────────
// DEMO TICKETS — realistic dental IT MSP support queue
// 15 tickets across 8 fake practices, mix of open/pending/closed
// ─────────────────────────────────────────────────────────────────────────────
export const DEMO_TICKETS: Ticket[] = [
  // ── URGENT / HIGH PRIORITY ──────────────────────────────────────────────
  {
    id: 1001,
    ticket_key: 'TKT-2891',
    title: 'Eaglesoft not launching after Windows update',
    title_clean: 'Eaglesoft not launching after Windows update',
    status: 'open',
    priority: 'high',
    client_key: 'sunrise-family',
    client_display_name: 'Sunrise Family Dentistry',
    contact_phone: '(205) 555-3421',
    sender_name: 'Dr. Amanda Chen',
    sender_email: 'dr.chen@sunrisefamilydental.com',
    readiness_signal: 'HIGH',
    readiness_score: 88,
    trust_signal: 'RISING',
    trust_score: 82,
    expectation_signal: 'ALIGNED',
    constraint_signal: 'TIME',
    decision_signal: 'RESOLVE',
    decision_label: 'RESOLVE/VERIFY',
    decision_detail: 'Patterson SQL service not starting. KB5034441 rollback required.',
    lifecycle_status: 'active',
    appointment_at: null,
    due_date: '2026-02-27',
    needs_response: 1,
    created_at: '2026-02-27T07:12:00',
    last_updated: '2026-02-27T07:45:00',
    notes_count: 3,
  visit_datetime: '2026-02-28T09:00:00',
  },
  {
    id: 1002,
    ticket_key: 'TKT-2887',
    title: 'RANSOMWARE WARNING POPUP — please advise URGENT',
    title_clean: 'Ransomware warning popup — please advise URGENT',
    status: 'closed',
    priority: 'critical',
    client_key: 'pinnacle-dental',
    client_display_name: 'Pinnacle Dental Group',
    contact_phone: '(205) 555-7890',
    sender_name: 'Office Manager - Lisa Park',
    sender_email: 'lisa@pinnacledental.com',
    readiness_signal: 'HIGH',
    readiness_score: 91,
    trust_signal: 'RISING',
    trust_score: 87,
    expectation_signal: 'ALIGNED',
    constraint_signal: 'SECURITY',
    decision_signal: 'RESOLVE',
    decision_label: 'RESOLVE/VERIFY',
    decision_detail: 'Isolated to one workstation. False positive from expired Malwarebytes license. Renewed + full scan completed clean.',
    lifecycle_status: 'resolved',
    appointment_at: null,
    due_date: '2026-02-25',
    needs_response: 0,
    created_at: '2026-02-25T14:22:00',
    last_updated: '2026-02-25T16:55:00',
    notes_count: 7,
  visit_datetime: null,
  },
  {
    id: 1003,
    ticket_key: 'TKT-2893',
    title: 'Eaglesoft slow since Monday — whole office affected',
    title_clean: 'Eaglesoft slow since Monday — whole office affected',
    status: 'open',
    priority: 'high',
    client_key: 'heritage-smiles',
    client_display_name: 'Heritage Smiles Dental',
    contact_phone: '(256) 555-2341',
    sender_name: 'James Thornton',
    sender_email: 'dr.thornton@heritagesmiles.com',
    readiness_signal: 'HIGH',
    readiness_score: 85,
    trust_signal: 'DECLINING',
    trust_score: 54,
    expectation_signal: 'MISALIGNED',
    constraint_signal: 'TIME',
    decision_signal: 'RESOLVE',
    decision_label: 'RESOLVE/VERIFY',
    decision_detail: 'Linked to KB5034441 — Patterson SQL service degraded. 4 ops chairs impacted.',
    lifecycle_status: 'active',
    appointment_at: null,
    due_date: '2026-02-27',
    needs_response: 1,
    created_at: '2026-02-27T08:05:00',
    last_updated: '2026-02-27T09:10:00',
    notes_count: 4,
  visit_datetime: '2026-02-28T11:30:00',
  },
  {
    id: 1004,
    ticket_key: 'TKT-2889',
    title: 'DEXIS sensor not recognized after driver update',
    title_clean: 'DEXIS sensor not recognized after driver update',
    status: 'open',
    priority: 'high',
    client_key: 'lakefront-oral',
    client_display_name: 'Lakefront Oral Surgery',
    contact_phone: '(205) 555-8812',
    sender_name: 'Dr. Patricia Novak',
    sender_email: 'p.novak@lakefrontoralsurgery.com',
    readiness_signal: 'MEDIUM',
    readiness_score: 67,
    trust_signal: 'NEUTRAL',
    trust_score: 71,
    expectation_signal: 'ALIGNED',
    constraint_signal: 'TECHNICAL',
    decision_signal: 'ASSESS',
    decision_label: 'ASSESS/RECOMMEND',
    decision_detail: 'DEXIS Platinum sensor unresponsive in op 2. Driver v4.1.2 may conflict with Win 11 22H2.',
    lifecycle_status: 'active',
    appointment_at: null,
    due_date: '2026-02-27',
    needs_response: 1,
    created_at: '2026-02-26T16:44:00',
    last_updated: '2026-02-27T08:30:00',
    notes_count: 2,
  visit_datetime: '2026-02-28T14:00:00',
  },
  // ── MEDIUM PRIORITY ──────────────────────────────────────────────────────
  {
    id: 1005,
    ticket_key: 'TKT-2885',
    title: 'Backup job failed — drive full on server',
    title_clean: 'Backup job failed — drive full on server',
    status: 'open',
    priority: 'medium',
    client_key: 'westside-pediatric',
    client_display_name: 'Westside Pediatric Dental',
    contact_phone: '(205) 555-6634',
    sender_name: 'Dr. Marcus Webb',
    sender_email: 'm.webb@westsidepediatric.com',
    readiness_signal: 'MEDIUM',
    readiness_score: 61,
    trust_signal: 'NEUTRAL',
    trust_score: 68,
    expectation_signal: 'ALIGNED',
    constraint_signal: 'RESOURCE',
    decision_signal: 'PROCEED',
    decision_label: 'PROCEED/HALT',
    decision_detail: 'Veeam backup failed 3 nights in a row. D:\ drive at 97% capacity. Imaging archive cleanup needed.',
    lifecycle_status: 'active',
    appointment_at: null,
    due_date: '2026-02-28',
    needs_response: 1,
    created_at: '2026-02-26T08:15:00',
    last_updated: '2026-02-27T06:00:00',
    notes_count: 3,
  visit_datetime: '2026-03-01T10:00:00',
  },
  {
    id: 1006,
    ticket_key: 'TKT-2890',
    title: 'Mango Voice calls dropping intermittently',
    title_clean: 'Mango Voice calls dropping intermittently',
    status: 'open',
    priority: 'medium',
    client_key: 'clearwater-ortho',
    client_display_name: 'Clearwater Orthodontics',
    contact_phone: '(256) 555-4490',
    sender_name: 'Sofia Reyes',
    sender_email: 'dr.reyes@clearwaterortho.com',
    readiness_signal: 'MEDIUM',
    readiness_score: 58,
    trust_signal: 'NEUTRAL',
    trust_score: 72,
    expectation_signal: 'ALIGNED',
    constraint_signal: 'TECHNICAL',
    decision_signal: 'ASSESS',
    decision_label: 'ASSESS/RECOMMEND',
    decision_detail: 'VoIP drops every 20-40 min. Likely QoS config on Meraki. ISP bandwidth test normal.',
    lifecycle_status: 'active',
    appointment_at: null,
    due_date: '2026-02-28',
    needs_response: 0,
    created_at: '2026-02-26T11:30:00',
    last_updated: '2026-02-26T14:20:00',
    notes_count: 2,
  visit_datetime: '2026-03-01T13:00:00',
  },
  {
    id: 1007,
    ticket_key: 'TKT-2883',
    title: 'New hire workstation setup needed by Friday',
    title_clean: 'New hire workstation setup needed by Friday',
    status: 'pending',
    priority: 'medium',
    client_key: 'summit-implant',
    client_display_name: 'Summit Implant Center',
    contact_phone: '(205) 555-1122',
    sender_name: 'David Okafor',
    sender_email: 'dr.okafor@summitimplant.com',
    readiness_signal: 'HIGH',
    readiness_score: 79,
    trust_signal: 'RISING',
    trust_score: 84,
    expectation_signal: 'ALIGNED',
    constraint_signal: 'TIME',
    decision_signal: 'PROCEED',
    decision_label: 'PROCEED/HALT',
    decision_detail: 'New clinical coordinator starts Friday. Needs Eaglesoft access, HIPAA training workstation, email setup.',
    lifecycle_status: 'scheduled',
    appointment_at: '2026-02-28T09:00:00',
    due_date: '2026-02-28',
    needs_response: 0,
    created_at: '2026-02-24T10:00:00',
    last_updated: '2026-02-25T09:30:00',
    notes_count: 5,
  visit_datetime: '2026-02-28T16:00:00',
  },
  {
    id: 1008,
    ticket_key: 'TKT-2886',
    title: 'CEREC design software license expired',
    title_clean: 'CEREC design software license expired',
    status: 'pending',
    priority: 'medium',
    client_key: 'pinnacle-dental',
    client_display_name: 'Pinnacle Dental Group',
    contact_phone: '(205) 555-7890',
    sender_name: 'Robert Hayes',
    sender_email: 'dr.hayes@pinnacledental.com',
    readiness_signal: 'MEDIUM',
    readiness_score: 63,
    trust_signal: 'RISING',
    trust_score: 80,
    expectation_signal: 'ALIGNED',
    constraint_signal: 'LICENSING',
    decision_signal: 'PROCEED',
    decision_label: 'PROCEED/HALT',
    decision_detail: 'Dentsply Sirona CEREC Ortho SW expired 02/24. Renewal invoice sent to Dr. Hayes. Awaiting PO.',
    lifecycle_status: 'waiting_client',
    appointment_at: null,
    due_date: '2026-03-01',
    needs_response: 0,
    created_at: '2026-02-25T09:00:00',
    last_updated: '2026-02-25T15:00:00',
    notes_count: 4,
  visit_datetime: null,
  },
  {
    id: 1009,
    ticket_key: 'TKT-2892',
    title: 'Printer offline in operatory 3',
    title_clean: 'Printer offline in operatory 3',
    status: 'open',
    priority: 'low',
    client_key: 'heritage-smiles',
    client_display_name: 'Heritage Smiles Dental',
    contact_phone: '(256) 555-2341',
    sender_name: 'James Thornton',
    sender_email: 'dr.thornton@heritagesmiles.com',
    readiness_signal: 'MEDIUM',
    readiness_score: 55,
    trust_signal: 'DECLINING',
    trust_score: 54,
    expectation_signal: 'ALIGNED',
    constraint_signal: null,
    decision_signal: 'VERIFY',
    decision_label: 'VERIFY/SIGN-OFF',
    decision_detail: 'HP LaserJet Pro M404n offline. Likely IP conflict after router change last week.',
    lifecycle_status: 'active',
    appointment_at: null,
    due_date: '2026-02-27',
    needs_response: 0,
    created_at: '2026-02-27T09:30:00',
    last_updated: '2026-02-27T09:30:00',
    notes_count: 1,
  visit_datetime: null,
  },
  {
    id: 1010,
    ticket_key: 'TKT-2894',
    title: 'Eaglesoft error on imaging workstation after update',
    title_clean: 'Eaglesoft error on imaging workstation after update',
    status: 'open',
    priority: 'high',
    client_key: 'pinnacle-dental',
    client_display_name: 'Pinnacle Dental Group',
    contact_phone: '(205) 555-7890',
    sender_name: 'Lisa Park',
    sender_email: 'lisa@pinnacledental.com',
    readiness_signal: 'HIGH',
    readiness_score: 86,
    trust_signal: 'RISING',
    trust_score: 87,
    expectation_signal: 'ALIGNED',
    constraint_signal: 'TIME',
    decision_signal: 'RESOLVE',
    decision_label: 'RESOLVE/VERIFY',
    decision_detail: 'Imaging station WS-04 throwing SQL connection error. Same KB5034441 root cause. Fix in progress.',
    lifecycle_status: 'active',
    appointment_at: null,
    due_date: '2026-02-27',
    needs_response: 1,
    created_at: '2026-02-27T08:55:00',
    last_updated: '2026-02-27T09:15:00',
    notes_count: 2,
  visit_datetime: null,
  },
  {
    id: 1011,
    ticket_key: 'TKT-2880',
    title: 'Cannot access patient records remotely — VPN broken',
    title_clean: 'Cannot access patient records remotely — VPN broken',
    status: 'closed',
    priority: 'high',
    client_key: 'summit-implant',
    client_display_name: 'Summit Implant Center',
    contact_phone: '(205) 555-1122',
    sender_name: 'David Okafor',
    sender_email: 'dr.okafor@summitimplant.com',
    readiness_signal: 'HIGH',
    readiness_score: 81,
    trust_signal: 'RISING',
    trust_score: 84,
    expectation_signal: 'ALIGNED',
    constraint_signal: 'ACCESS',
    decision_signal: 'RESOLVE',
    decision_label: 'RESOLVE/VERIFY',
    decision_detail: 'Fortinet SSL-VPN cert expired 02/21. Renewed + tested. Remote access restored for Dr. Okafor.',
    lifecycle_status: 'resolved',
    appointment_at: null,
    due_date: '2026-02-22',
    needs_response: 0,
    created_at: '2026-02-21T18:30:00',
    last_updated: '2026-02-22T11:45:00',
    notes_count: 6,
  visit_datetime: null,
  },
  {
    id: 1012,
    ticket_key: 'TKT-2877',
    title: 'DEXIS imaging system freezing during x-ray capture',
    title_clean: 'DEXIS imaging system freezing during x-ray capture',
    status: 'closed',
    priority: 'high',
    client_key: 'coastal-kids',
    client_display_name: 'Coastal Kids Dentistry',
    contact_phone: '(205) 555-9901',
    sender_name: 'Yuki Tanaka',
    sender_email: 'dr.tanaka@coastalkids.com',
    readiness_signal: 'MEDIUM',
    readiness_score: 64,
    trust_signal: 'NEUTRAL',
    trust_score: 69,
    expectation_signal: 'ALIGNED',
    constraint_signal: 'TECHNICAL',
    decision_signal: 'RESOLVE',
    decision_label: 'RESOLVE/VERIFY',
    decision_detail: 'RAM upgrade resolved freezing issue. Also updated DEXIS drivers to v4.1.1 stable. Monitoring.',
    lifecycle_status: 'resolved',
    appointment_at: null,
    due_date: '2026-02-20',
    needs_response: 0,
    created_at: '2026-02-19T11:00:00',
    last_updated: '2026-02-20T14:30:00',
    notes_count: 8,
  visit_datetime: null,
  },
  {
    id: 1013,
    ticket_key: 'TKT-2878',
    title: 'Server room overheating — UPS beeping',
    title_clean: 'Server room overheating — UPS beeping',
    status: 'closed',
    priority: 'high',
    client_key: 'lakefront-oral',
    client_display_name: 'Lakefront Oral Surgery',
    contact_phone: '(205) 555-8812',
    sender_name: 'Patricia Novak',
    sender_email: 'p.novak@lakefrontoralsurgery.com',
    readiness_signal: 'HIGH',
    readiness_score: 77,
    trust_signal: 'NEUTRAL',
    trust_score: 71,
    expectation_signal: 'ALIGNED',
    constraint_signal: 'ENVIRONMENT',
    decision_signal: 'PROCEED',
    decision_label: 'PROCEED/HALT',
    decision_detail: 'HVAC unit failed over weekend. Portable AC unit deployed. HVAC repair scheduled 02/26. UPS battery healthy.',
    lifecycle_status: 'resolved',
    appointment_at: null,
    due_date: '2026-02-24',
    needs_response: 0,
    created_at: '2026-02-22T09:00:00',
    last_updated: '2026-02-24T16:00:00',
    notes_count: 9,
  visit_datetime: null,
  },
  {
    id: 1014,
    ticket_key: 'TKT-2881',
    title: 'Email not syncing on front desk iPad',
    title_clean: 'Email not syncing on front desk iPad',
    status: 'closed',
    priority: 'low',
    client_key: 'clearwater-ortho',
    client_display_name: 'Clearwater Orthodontics',
    contact_phone: '(256) 555-4490',
    sender_name: 'Sofia Reyes',
    sender_email: 'dr.reyes@clearwaterortho.com',
    readiness_signal: 'MEDIUM',
    readiness_score: 55,
    trust_signal: 'NEUTRAL',
    trust_score: 72,
    expectation_signal: 'ALIGNED',
    constraint_signal: null,
    decision_signal: 'VERIFY',
    decision_label: 'VERIFY/SIGN-OFF',
    decision_detail: 'M365 MDM profile expired on iPad. Re-enrolled via Intune. Email syncing normally.',
    lifecycle_status: 'resolved',
    appointment_at: null,
    due_date: '2026-02-24',
    needs_response: 0,
    created_at: '2026-02-23T08:00:00',
    last_updated: '2026-02-23T10:30:00',
    notes_count: 3,
  visit_datetime: null,
  },
  {
    id: 1015,
    ticket_key: 'TKT-2884',
    title: 'Veeam backup job failing — cannot connect to repository',
    title_clean: 'Veeam backup job failing — cannot connect to repository',
    status: 'pending',
    priority: 'medium',
    client_key: 'westside-pediatric',
    client_display_name: 'Westside Pediatric Dental',
    contact_phone: '(205) 555-6634',
    sender_name: 'Marcus Webb',
    sender_email: 'm.webb@westsidepediatric.com',
    readiness_signal: 'MEDIUM',
    readiness_score: 58,
    trust_signal: 'NEUTRAL',
    trust_score: 65,
    expectation_signal: 'ALIGNED',
    constraint_signal: 'RESOURCE',
    decision_signal: 'PROCEED',
    decision_label: 'PROCEED/HALT',
    decision_detail: 'Veeam B&R v12 — NAS repository credential mismatch after AD password rotation. Credentials updated, job re-testing overnight.',
    lifecycle_status: 'active',
    appointment_at: null,
    due_date: '2026-02-28',
    needs_response: 0,
    created_at: '2026-02-25T19:30:00',
    last_updated: '2026-02-26T22:00:00',
    notes_count: 4,
  visit_datetime: null,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DEMO CALENDAR EVENTS
// ─────────────────────────────────────────────────────────────────────────────
export const DEMO_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 501,
    ticket_id: 1007,
    ticket_key: 'TKT-2883',
    title: 'New hire workstation setup — Summit Implant',
    starts_at_raw: 'Fri 2/28/2026 9:00AM',
    starts_at_iso_utc: '2026-02-28T09:00:00',
    assigned_to: 'Tyler M.',
    assigned_by: 'Dispatch',
    status: 'confirmed',
    client_name: 'Summit Implant Center',
    ticket_title: 'New hire workstation setup needed by Friday',
    decision_label: 'PROCEED/HALT',
  },
  {
    id: 502,
    ticket_id: 1006,
    ticket_key: 'TKT-2890',
    title: 'VoIP QoS review — Clearwater Ortho',
    starts_at_raw: 'Mon 3/2/2026 10:00AM',
    starts_at_iso_utc: '2026-03-02T10:00:00',
    assigned_to: 'Tyler M.',
    assigned_by: 'Dispatch',
    status: 'confirmed',
    client_name: 'Clearwater Orthodontics',
    ticket_title: 'Mango Voice calls dropping intermittently',
    decision_label: 'ASSESS/RECOMMEND',
  },
  {
    id: 503,
    ticket_id: null,
    ticket_key: null,
    title: 'Quarterly Business Review — Sunrise Family',
    starts_at_raw: 'Wed 3/4/2026 2:00PM',
    starts_at_iso_utc: '2026-03-04T14:00:00',
    assigned_to: null,
    assigned_by: null,
    status: 'tentative',
    client_name: 'Sunrise Family Dentistry',
    ticket_title: null,
    decision_label: null,
  },
  {
    id: 504,
    ticket_id: 1005,
    ticket_key: 'TKT-2885',
    title: 'Storage expansion consult — Westside Pediatric',
    starts_at_raw: 'Thu 3/5/2026 11:00AM',
    starts_at_iso_utc: '2026-03-05T11:00:00',
    assigned_to: 'Chris R.',
    assigned_by: 'Dispatch',
    status: 'confirmed',
    client_name: 'Westside Pediatric Dental',
    ticket_title: 'Backup job failed — drive full on server',
    decision_label: 'PROCEED/HALT',
  },
  {
    id: 505,
    ticket_id: null,
    ticket_key: null,
    title: 'Annual security audit — Heritage Smiles',
    starts_at_raw: 'Mon 3/9/2026 9:00AM',
    starts_at_iso_utc: '2026-03-09T09:00:00',
    assigned_to: 'Tyler M.',
    assigned_by: 'Account',
    status: 'confirmed',
    client_name: 'Heritage Smiles Dental',
    ticket_title: null,
    decision_label: null,
  },
  {
    id: 506,
    ticket_id: null,
    ticket_key: null,
    title: 'Eaglesoft version upgrade planning — Pinnacle Dental',
    starts_at_raw: 'Tue 3/10/2026 3:00PM',
    starts_at_iso_utc: '2026-03-10T15:00:00',
    assigned_to: null,
    assigned_by: null,
    status: 'tentative',
    client_name: 'Pinnacle Dental Group',
    ticket_title: null,
    decision_label: null,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DEMO SUMMARY — matches Summary type exactly
// ─────────────────────────────────────────────────────────────────────────────
export const DEMO_SUMMARY: Summary = {
  total_open: 7,
  declining_trust_count: 1,
  today_count: 4,
  signals: {
    'RESOLVE/VERIFY': 4,
    'PROCEED/HALT': 3,
    'ASSESS/RECOMMEND': 2,
    'VERIFY/SIGN-OFF': 1,
  },
  readiness: { high: 5, medium: 4, low: 0 },
  last_updated: new Date().toISOString(),
};

// ─────────────────────────────────────────────────────────────────────────────
// DEMO OUTBREAKS — the showstopper demo feature
// ─────────────────────────────────────────────────────────────────────────────
export const DEMO_OUTBREAKS = [
  {
    id: 'evt-demo-001',
    tool_id: 'eaglesoft',
    tool_name: 'Eaglesoft',
    status: 'active',
    classification: 'update_related',
    affected_clients: [
      'Sunrise Family Dentistry',
      'Heritage Smiles Dental',
      'Pinnacle Dental Group',
    ],
    at_risk_clients: [
      'Westside Pediatric Dental',
      'Coastal Kids Dentistry',
    ],
    first_seen: '2026-02-27T07:45:00',
    last_seen: '2026-02-27T09:15:00',
    ticket_count: 6,
    root_cause:
      'Windows Update KB5034441 (released 2026-02-25) conflicts with Patterson SQL Server 2019 service startup. ' +
      'Affects all Eaglesoft 21.x installations on Windows 11 22H2.',
    recommended_action:
      'Restart Patterson SQL Service via services.msc. If persistent, rollback KB5034441 via Windows Update history. ' +
      'Proactively check Westside Pediatric and Coastal Kids — both on same OS/Eaglesoft version.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DEMO TOOL RISK SCORES — matches ToolRow shape for IntelPanel
// ─────────────────────────────────────────────────────────────────────────────
export const DEMO_TOOL_SCORES = [
  {
    id: 'eaglesoft',
    name: 'Eaglesoft',
    vendor: 'Patterson Dental',
    category: 'Practice Mgmt',
    risk_score: 78,
    level: 'HIGH',
    active_tickets: 6,
    clients_affected: 3,
    clients_total: 6,
  },
  {
    id: 'veeam',
    name: 'Veeam Backup',
    vendor: 'Veeam Software',
    category: 'Backup & DR',
    risk_score: 44,
    level: 'MEDIUM',
    active_tickets: 2,
    clients_affected: 2,
    clients_total: 8,
  },
  {
    id: 'dexis',
    name: 'DEXIS Imaging',
    vendor: 'Dentsply Sirona',
    category: 'Dental Imaging',
    risk_score: 31,
    level: 'MEDIUM',
    active_tickets: 2,
    clients_affected: 2,
    clients_total: 4,
  },
  {
    id: 'mango-voice',
    name: 'Mango Voice',
    vendor: 'Mango Voice',
    category: 'VoIP',
    risk_score: 18,
    level: 'LOW',
    active_tickets: 1,
    clients_affected: 1,
    clients_total: 3,
  },
  {
    id: 'windows-server',
    name: 'Windows Server',
    vendor: 'Microsoft',
    category: 'Infrastructure',
    risk_score: 22,
    level: 'LOW',
    active_tickets: 1,
    clients_affected: 1,
    clients_total: 8,
  },
  {
    id: 'microsoft-365',
    name: 'Microsoft 365',
    vendor: 'Microsoft',
    category: 'Productivity',
    risk_score: 12,
    level: 'LOW',
    active_tickets: 1,
    clients_affected: 1,
    clients_total: 8,
  },
  {
    id: 'cerec',
    name: 'CEREC Ortho SW',
    vendor: 'Dentsply Sirona',
    category: 'CAD/CAM',
    risk_score: 35,
    level: 'MEDIUM',
    active_tickets: 1,
    clients_affected: 1,
    clients_total: 2,
  },
  {
    id: 'fortinet-vpn',
    name: 'Fortinet FortiGate',
    vendor: 'Fortinet',
    category: 'Network Security',
    risk_score: 8,
    level: 'LOW',
    active_tickets: 0,
    clients_affected: 0,
    clients_total: 5,
  },
  {
    id: 'malwarebytes',
    name: 'Malwarebytes EDR',
    vendor: 'Malwarebytes',
    category: 'Endpoint Security',
    risk_score: 15,
    level: 'LOW',
    active_tickets: 1,
    clients_affected: 1,
    clients_total: 8,
  },
  {
    id: 'intune',
    name: 'Microsoft Intune',
    vendor: 'Microsoft',
    category: 'MDM',
    risk_score: 9,
    level: 'LOW',
    active_tickets: 0,
    clients_affected: 0,
    clients_total: 6,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DEMO STATS — for future stats endpoint
// ─────────────────────────────────────────────────────────────────────────────
export const DEMO_STATS = {
  total_tickets: 47,
  open_tickets: 7,
  pending_tickets: 3,
  closed_today: 2,
  clients_total: 8,
  tools_tracked: 21,
  active_outbreaks: 1,
  at_risk_clients: 2,
  avg_resolution_hours: 3.2,
  sla_compliance_pct: 94,
};


// ---------------------------------------------------------------------------
// DEMO PREP BRIEFS — keyed by ticket_key
// ---------------------------------------------------------------------------
export const DEMO_BRIEFS: Record<string, string> = {

'TKT-2891': `# Onsite Prep Brief — Ticket #TKT-2891

## CLIENT SNAPSHOT
| Field | Detail |
|---|---|
| Practice | Sunrise Family Dentistry |
| Contact | Dr. Amanda Chen — (205) 334-8821 |
| SLA Tier | Managed IT — Priority Response |
| Readiness | 🟢 HIGH (score: 84) |
| Trust | 📈 RISING (score: 78) |

---

## SITUATION
**Eaglesoft fails to launch on all 6 workstations** following Windows Update KB5034441 (released 2026-02-25). Patterson SQL Server 2019 service is not starting automatically on the server. Staff cannot access patient records. Hygienists are documenting on paper.

> Dr. Chen called at 7:12 AM. Front desk is managing 8 morning appointments manually. She was calm but firm — expects resolution before 9 AM.

---

## ROOT CAUSE (CONFIRMED)
Windows Update **KB5034441** modifies SQL Server startup dependencies. Patterson SQL service startup type remains Automatic but the service dependency on Windows Firewall is broken by the update. **This is a known cross-client issue — 3 practices affected this morning.**

---

## RESOLUTION STEPS
**Step 1 — Remote (2 min)**
- RDP to server: \`\\SUNRISE-SERVER\`
- Open Services (services.msc)
- Find **Patterson Technology SQL Server** → Right-click → Start
- If fails: check Event Viewer → Windows Logs → Application for SQL error code

**Step 2 — If SQL won't start**
- Run as Admin: \`net start MSSQL$PATTERSON\`
- If error 1053: restart Windows Firewall service first, then retry

**Step 3 — Verify**
- Launch Eaglesoft on any workstation
- Confirm patient records load
- Check backup job status in EagleBackup

**Step 4 — Prevent recurrence**
- Pause Windows Update via Group Policy for 7 days
- Add to Eaglesoft node KB: "KB5034441 breaks Patterson SQL startup — restart SQL first"

---

## CLIENT HISTORY
- **2025-11-14** — Same issue after Patch Tuesday. Resolved by SQL restart in 12 min.
- **2025-09-02** — Server migration to new Dell PowerEdge. Clean install.
- **2025-07-18** — Eaglesoft license renewal — upgraded to v21.2.
- Trust has been **rising** since the fast September server migration.

---

## DECISION REQUIRED
> [RESOLVE] Restore Eaglesoft access before 9 AM patient appointments. Document KB5034441 workaround. Assess whether to roll back update or apply permanent fix.

---

## RISK FLAGS
- ⚠️ 3 other practices affected by same update — coordinate parallel resolution
- ⚠️ Paper charting creates HIPAA documentation gap if not resolved quickly
- ✅ Client trust is rising — a fast resolution reinforces that trajectory
`,

'TKT-2889': `# Onsite Prep Brief — Ticket #TKT-2889

## CLIENT SNAPSHOT
| Field | Detail |
|---|---|
| Practice | Lakefront Oral Surgery |
| Contact | Dr. Patricia Novak — (205) 778-4401 |
| SLA Tier | Managed IT — Standard |
| Readiness | 🟡 MEDIUM (score: 61) |
| Trust | ➡️ NEUTRAL (score: 55) |

---

## SITUATION
**DEXIS sensor (intraoral X-ray) not recognized** after a Windows driver update pushed Tuesday night. Sensor shows as "Unknown Device" in Device Manager. Practice is running without digital X-ray capability — using fallback film for urgent cases.

> Dr. Novak's office manager Sandra emailed at 8:44 AM. No phone call yet — they are managing but frustrated. Two crown prep appointments this afternoon depend on digital imaging.

---

## ROOT CAUSE (LIKELY)
Windows pushed **Intel USB driver update (v5.1.7)** which conflicts with the DEXIS Platinum sensor USB 3.0 handshake. Known issue with DEXIS firmware < v7.2 on Windows 11.

---

## RESOLUTION STEPS
**Step 1 — Roll back USB driver**
- Device Manager → Universal Serial Bus controllers
- Find Intel USB 3.x Host Controller → Properties → Driver → Roll Back Driver
- Unplug/replug DEXIS sensor

**Step 2 — If rollback unavailable**
- Uninstall USB controller driver → reboot → let Windows reinstall generic driver
- Reinstall DEXIS Platinum software: \`C:\Program Files\DEXIS\Setup.exe\`
- Reboot and test sensor on each operatory workstation

**Step 3 — Verify**
- Open DEXIS → Acquire → sensor should show green LED
- Take test exposure on calibration block
- Confirm image appears in DEXIS within 3 seconds

**Step 4 — Update group policy**
- Block automatic driver updates for USB controllers via WSUS/Group Policy

---

## CLIENT HISTORY
- **2025-12-01** — DEXIS sensor replacement under warranty (previous sensor crack).
- **2025-08-15** — Workstation upgrade — DEXIS reinstalled cleanly.
- **2025-03-10** — Similar USB issue — resolved by driver rollback (18 min).
- Trust is **neutral** — practice is satisfied but not enthusiastic. A fast resolution on the afternoon appointment deadline will matter.

---

## DECISION REQUIRED
> [RESOLVE] Restore DEXIS imaging before 1 PM crown prep appointments. If driver rollback fails, bring USB 2.0 extension cable as workaround (forces USB 2.0 enumeration).

---

## RISK FLAGS
- ⚠️ Crown prep appointments at 1 PM and 2:30 PM depend on working sensor
- ⚠️ Film fallback creates workflow delay and additional cost
- 🔧 Bring USB 2.0 hub as backup — has resolved this pattern before
`,

'TKT-2883': `# Onsite Prep Brief — Ticket #TKT-2883

## CLIENT SNAPSHOT
| Field | Detail |
|---|---|
| Practice | Summit Implant Center |
| Contact | Dr. David Okafor — (205) 512-9934 |
| SLA Tier | Managed IT — Priority Response |
| Readiness | 🔴 LOW (score: 28) |
| Trust | 📉 DECLINING (score: 34) |

---

## SITUATION
**Ransomware warning popup appeared on front desk workstation** at 6:47 AM. Office manager Marcus called immediately. Workstation has been isolated. Network shares still accessible from other machines — likely a scare/adware, not active encryption.

> **This is the highest priority ticket this morning.** Trust score is declining — this practice has had 3 incidents in 4 months. Dr. Okafor mentioned "considering other IT options" in last month's call.

---

## ASSESSMENT
Initial indicators suggest **Malwarebytes detected a PUP (potentially unwanted program)** misidentified as ransomware. No encrypted files detected on network shares. However — **treat as real until confirmed otherwise.**

---

## RESOLUTION STEPS
**Step 1 — Immediate containment (remote)**
- Confirm workstation is network-isolated (unplug ethernet or disable WiFi)
- RDP to a clean machine on same network
- Check shared drives: \`\\SUMMIT-SERVER\patients\` — verify no .encrypted extensions
- Check Event Viewer on server for mass file access events in last 2 hours

**Step 2 — Scan isolated workstation**
- Boot from USB with Malwarebytes Rescue Scanner
- Run full scan — quarantine all findings
- Check %AppData%, %Temp%, Startup folder for suspicious executables

**Step 3 — Determine scope**
- If PUP/adware only: clean, document, reconnect, reset browser extensions
- If active ransomware: invoke backup recovery protocol — call Dr. Okafor directly

**Step 4 — Remediation**
- Deploy updated endpoint policy via Sophos/Bitdefender
- Review how PUP entered: browser download, email attachment, USB?
- Send staff phishing awareness reminder

---

## CLIENT HISTORY
- **2025-11-30** — Slow workstations — resolved (aging RAM, upgraded).
- **2025-10-14** — Email phishing click — password reset, no breach.
- **2025-09-08** — Server backup failure — 3 days of backups missing.
- **Trust is declining.** Three incidents in 4 months. Dr. Okafor is watching.

---

## DECISION REQUIRED
> [RESOLVE + RELATIONSHIP] Resolve the immediate threat AND schedule a 15-minute call with Dr. Okafor after resolution to walk him through what happened, what was done, and what's being put in place. This is a retention moment.

---

## RISK FLAGS
- 🔴 CRITICAL — Declining trust, practice considering alternatives
- 🔴 HIPAA exposure if patient data was accessed
- ⚠️ Third incident in 4 months — root cause analysis required
- 💼 Prepare written incident summary for Dr. Okafor
`,

'TKT-2893': `# Onsite Prep Brief — Ticket #TKT-2893

## CLIENT SNAPSHOT
| Field | Detail |
|---|---|
| Practice | Heritage Smiles Dental |
| Contact | Dr. James Thornton — (205) 445-7723 |
| SLA Tier | Managed IT — Standard |
| Readiness | 🟢 HIGH (score: 79) |
| Trust | 📉 DECLINING (score: 41) |

---

## SITUATION
**Server backup job failed** — backup drive at 98% capacity. Last successful backup was 4 days ago. Veeam backup log shows error: \`VSS_E_INSUFFICIENT_STORAGE\`.

---

## RESOLUTION STEPS
**Step 1 — Immediate**
- RDP to \`\\HERITAGE-SERVER\`
- Open Veeam → Jobs → check last run details
- Clear old restore points: Veeam → Backups → Disk → delete restore points older than 60 days

**Step 2 — Free space**
- Check D:\ backup drive — remove temp/staging files
- Compress or archive Q1 2025 backup sets to cold storage
- Target: get backup drive below 70% before running job

**Step 3 — Run emergency backup**
- Veeam → Jobs → Heritage-Full → Start
- Monitor to completion — do not leave until first backup succeeds

**Step 4 — Long-term fix**
- Recommend backup drive upgrade: current 2TB → 4TB (~$180)
- Present to Dr. Thornton as a proposal

---

## RISK FLAGS
- ⚠️ 4 days without backup — any data loss event in this window is unrecoverable
- ⚠️ Trust declining — third issue this quarter
- 📋 Bring upgrade proposal — frame it proactively
`,

'TKT-2887': `# Onsite Prep Brief — Ticket #TKT-2887

## CLIENT SNAPSHOT
| Field | Detail |
|---|---|
| Practice | Pinnacle Dental Group |
| Contact | Dr. Robert Hayes — (205) 881-3390 |
| SLA Tier | Managed IT — Priority Response |
| Readiness | 🟢 HIGH (score: 88) |
| Trust | 📈 RISING (score: 82) |

---

## SITUATION
**Eaglesoft slow since Monday** — whole office affected. 12-20 second load times on patient records. Server CPU is spiking to 95% during Eaglesoft queries. SQL query optimization needed.

---

## RESOLUTION STEPS
**Step 1 — SQL diagnostics**
- RDP to server → SQL Server Management Studio
- Run: \`sp_who2\` — identify blocking processes
- Check: \`sys.dm_exec_query_stats\` — find expensive queries

**Step 2 — Quick wins**
- Restart Patterson SQL service (clears plan cache)
- Check for runaway Eaglesoft reporting jobs running in background
- Disable scheduled Eaglesoft reports during business hours

**Step 3 — Index maintenance**
- Run: \`EXEC sp_updatestats\`
- Schedule index rebuild for tonight after hours

---

## RISK FLAGS
- ✅ Trust is rising — strong relationship, practice is receptive
- ℹ️ This is the second performance issue in 6 months — SQL server may be underpowered for 8-chair practice
`,

'TKT-2885': `# Onsite Prep Brief — Ticket #TKT-2885

## CLIENT SNAPSHOT
| Field | Detail |
|---|---|
| Practice | Westside Pediatric Dental |
| Contact | Office Manager: Lisa Park |
| SLA Tier | Managed IT — Standard |
| Readiness | 🟡 MEDIUM (score: 66) |
| Trust | ➡️ NEUTRAL (score: 59) |

---

## SITUATION
**New hire workstation setup needed by Friday.** Front desk position filled — workstation needs Eaglesoft access, email, printer mapping, and HIPAA training module installation.

---

## SETUP CHECKLIST
- [ ] Join domain: \`WESTSIDE-DOMAIN\`
- [ ] Create AD account: firstname.lastname@westsidepediatric.com
- [ ] Install Eaglesoft client, map to \`\\WESTSIDE-SERVER\eaglesoft\`
- [ ] Configure Outlook → Exchange server
- [ ] Map printers: Front-Desk-HP, Receipt-Star
- [ ] Install HIPAA training: \`\\WESTSIDE-SERVER\Training\HIPAA2025.exe\`
- [ ] Set up MFA via Microsoft Authenticator
- [ ] Test Eaglesoft login with new credentials
- [ ] Confirm with Lisa Park before leaving

---

## NOTES
- Previous new hire setup (Nov 2024) took 2.5 hours — parts are on server share
- Lisa prefers a quick walkthrough at the end — factor in 15 min
`,



'TKT-2890': `## SITUATION
Mango Voice calls are dropping every 20-40 minutes across all 6 handsets at Clearwater Orthodontics. Staff are missing patient calls during active appointment slots. The issue began after a Meraki firmware update three days ago. ISP bandwidth tests are normal.

## EXPECTATION
Dr. Clearwater expects stable phone service restored before the afternoon rush. This is a recurring complaint — the last VoIP issue took two visits to resolve and eroded confidence.

## CONSTRAINTS
Front desk is the only area affected — clinical ops continue. Meraki dashboard access requires admin credentials (stored in Bitwarden). QoS rules must not be changed during patient hours.

## DECISION
Audit QoS configuration on Meraki MX. Reprioritize Mango Voice traffic (DSCP EF). If firmware is the root cause, schedule rollback after 5 PM.

## RISK FLAGS
This client had a similar VoIP issue in October. A second miss will likely trigger an escalation.

## TECHNICAL NOTES
Mango Voice uses SIP over UDP port 5060. Meraki firmware v18.1.x changed default QoS behavior. Check if voice VLAN is tagged correctly on all downstream switches.

## CLIENT HISTORY
Trust: NEUTRAL. Previous VoIP issue resolved Oct 2025 — took two visits. Client was understanding but noted it in their last QBR. Relationship is stable but watching.
`,

'TKT-2886': `## SITUATION
CEREC Ortho software license expired on 02/24 at Pinnacle Dental Group. The chairside milling unit is offline. Dr. Hayes cannot fabricate same-day crowns. Renewal invoice was sent — awaiting purchase order approval.

## EXPECTATION
Dr. Hayes expects the license renewed and activated same day once PO is approved. She has two same-day crown cases scheduled this week and cannot postpone them.

## CONSTRAINTS
License cannot be activated until Dentsply Sirona receives payment confirmation. PO is with the business office — ETA unknown. On-site presence is not required until activation is ready.

## DECISION
Waiting on client PO. Once received, activate license remotely via Dentsply Sirona portal. Verify CEREC Connect cloud sync after activation.

## TECHNICAL NOTES
CEREC Ortho SW v5.3.1 — license tied to dongle serial DTS-4421-X. Activation key delivered via email to admin account. If dongle is not detected post-renewal, USB re-seat or driver reinstall may be needed.

## CLIENT HISTORY
Trust: RISING. Pinnacle is a high-value account with 3 active tickets this week. Previous license issue in 2024 was resolved same day. Dr. Hayes is direct — she prefers text updates over email.
`,

'TKT-2892': `## SITUATION
HP LaserJet Pro M404n in Operatory 3 shows offline on all workstations at Heritage Smiles Dental. The printer was working Friday. A router replacement was performed last Tuesday which likely caused an IP conflict.

## EXPECTATION
Staff expects the printer back online today. Operatory 3 is fully booked and treatment plans cannot be printed from that room.

## CONSTRAINTS
Router change was performed by a third party — admin credentials for the new router are unknown. Printer does not have a static IP assigned.

## DECISION
Assign static IP to printer via HP EWS. Update print queue on all affected workstations. Confirm new gateway credentials with office manager before proceeding.

## RISK FLAGS
Heritage Smiles trust is DECLINING — two open tickets this week. Keep visit efficient and communication clear.

## TECHNICAL NOTES
HP EWS accessible at current DHCP address (check router DHCP table). Recommend assigning 192.168.1.250 outside DHCP range. Update port 9100 TCP on all 4 operatory workstations.
`,

'TKT-2894': `## SITUATION
Imaging workstation WS-04 at Pinnacle Dental Group is throwing a SQL connection error in Eaglesoft following the KB5034441 Windows update. This is the same root cause affecting Sunrise Family Dentistry and Heritage Smiles — a known cross-client outbreak.

## EXPECTATION
Dr. Hayes expects this resolved during today's remote session. The imaging workstation is used for all digital X-ray capture — it cannot remain down.

## CONSTRAINTS
RDP access to WS-04 is available. SQL fix must be applied without rebooting the Patterson server during patient hours.

## DECISION
Apply KB5034441 SQL dependency fix remotely. Restart Patterson SQL service. Verify Eaglesoft and DEXIS imaging launch cleanly on WS-04.

## TECHNICAL NOTES
Same fix as TKT-2891: net start MSSQL$PATTERSON after restarting Windows Firewall. WS-04 hostname: PINNACLE-IMG-04. DEXIS sensor also connected to this workstation — verify after fix.

## CLIENT HISTORY
Pinnacle has 3 active tickets this week. Bryant is primary contact for technical issues. Coordinate with TKT-2886 (CEREC license) visit if possible to consolidate.
`,

'TKT-2880': `## SITUATION
This ticket is resolved. Fortinet SSL-VPN certificate expired on 02/21 at Summit Implant Center, preventing Dr. Okafor from accessing patient records remotely. Certificate was renewed and remote access was restored.

## EXPECTATION
Expectation was met — Dr. Okafor confirmed remote access is working. No follow-up required.

## CONSTRAINTS
None active. Resolved remotely in one session.

## DECISION
Mark complete. Set calendar reminder for SSL-VPN cert renewal 30 days before expiry (next: 02/21/2027).

## TECHNICAL NOTES
FortiGate 60F. SSL-VPN portal: vpn.summitimplant.net. New cert issued via Let's Encrypt. Auto-renewal script deployed at /etc/cron.d/certbot-renew. Verified with Dr. Okafor direct login test.

## CLIENT HISTORY
Trust: RISING. Summit is a growth account — added DR backup service in January. Dr. Okafor is detail-oriented and appreciates written confirmation of resolutions.
`,

'TKT-2877': `## SITUATION
This ticket is resolved. DEXIS imaging system was freezing during X-ray capture at Coastal Kids Dentistry. Root cause was insufficient RAM (4GB) causing memory pressure during concurrent DEXIS and Eaglesoft operation.

## EXPECTATION
Expectation was met — imaging is stable post-upgrade. Hygienists confirmed no freezing during morning X-ray sessions.

## CONSTRAINTS
None active. RAM upgrade required brief workstation downtime (15 min) during lunch.

## DECISION
Complete. RAM upgraded from 4GB to 16GB. DEXIS drivers updated to v4.1.1 stable. Monitor for one week.

## TECHNICAL NOTES
HP EliteDesk 800 G4 — upgraded to 2x8GB DDR4-2666. DEXIS Platinum sensor on USB 3.0 port. DEXIS v4.1.1 driver installed. Previous v4.1.2 had known Win11 conflict — avoid updating until vendor releases patch.
`,

'TKT-2878': `## SITUATION
This ticket is resolved. Server room at Lakefront Oral Surgery overheated over the weekend when the HVAC unit failed. UPS units were beeping due to high ambient temperature. A portable AC unit was deployed immediately and HVAC repair was scheduled.

## EXPECTATION
Expectation was met — server room temperature stabilized. HVAC repair completed 02/26. No data loss occurred.

## CONSTRAINTS
None active. Permanent HVAC repair is complete.

## DECISION
Complete. Recommend quarterly server room temperature checks. Document HVAC vendor contact in client profile.

## TECHNICAL NOTES
Server room target: 68-72°F. UPS batteries tested healthy during incident. Portable AC (8000 BTU) maintained 74°F until permanent repair. HVAC vendor: Lakefront Cooling & Heating, (251) 445-9900.
`,

'TKT-2881': `## SITUATION
This ticket is resolved. Front desk iPad at Clearwater Orthodontics stopped syncing Microsoft 365 email after an MDM profile expired. The device was re-enrolled via Intune and email sync was restored.

## EXPECTATION
Expectation was met — front desk confirmed email and calendar are syncing normally.

## CONSTRAINTS
None active. Re-enrollment required device passcode reset (coordinated with office manager).

## DECISION
Complete. Set MDM profile expiry alert for 30 days before next renewal. Update Intune device record with correct enrollment date.

## TECHNICAL NOTES
Apple iPad Air (M1). M365 MDM profile re-enrolled via Intune Company Portal. Exchange ActiveSync account re-authenticated. Calendar and Outlook verified syncing. Next profile renewal: 02/28/2027.
`,

'TKT-2884': `## SITUATION
Veeam Backup & Replication v12 at Westside Pediatric Dental is failing to connect to the NAS repository after an Active Directory password rotation last week. Three nights of backup jobs have failed. Patient data is currently unprotected.

## EXPECTATION
The office manager expects backup jobs to be confirmed running tonight. They are aware of the risk and are understandably concerned.

## CONSTRAINTS
NAS credentials must be rotated across all backup jobs — there are 4 scheduled jobs total. No access to the NAS admin panel remotely; requires on-site or owner-provided credentials.

## DECISION
Update NAS repository credentials in Veeam B&R console. Re-run all 4 backup jobs manually to confirm success before leaving. Send written confirmation to office manager.

## RISK FLAGS
Three consecutive backup failures. If a fourth failure occurs tonight, this becomes a critical incident. Do not leave until at least one successful backup job is confirmed.

## TECHNICAL NOTES
Veeam B&R v12. NAS: Synology DS923+. Repository path: \\WPD-NAS\VeeamBackup. Service account: veeam-svc@wpd.local — password updated in AD, not yet in Veeam. Also check scheduled job credentials for jobs: Full-Daily, Incremental-Nightly, SQL-Backup, Exchange-Backup.

## CLIENT HISTORY
Trust: NEUTRAL. Westside Pediatric has a second open ticket (TKT-2885) for drive capacity. Both issues stem from the same server. Consider combining visits.
`,
};


// ─── Phase 11/12 Demo Data ───────────────────────────────────────────────────

export const DEMO_INTEL_ENTRIES = [
  {
    id: 'intel-demo-001',
    client_key: 'hooverfamilydentistry',
    tool_id: 'eaglesoft',
    pattern: 'Eaglesoft service stops after power outages',
    observation: 'Server unreachable from all workstations after UPS failure. Eaglesoft DB path verification required after every power event.',
    resolution: 'Restart Eaglesoft service via Windows Services. Verify DB path in Eaglesoft settings. Perform full UPS battery audit before leaving.',
    confidence: 'high' as const,
    tags: ['eaglesoft', 'power', 'ups', 'server', 'recurrence'],
    source_ticket: '4112718',
    observed_at: '2026-02-15T10:30:00',
    created_by: 'pilot',
    created_at: '2026-02-15T11:00:00',
  },
  {
    id: 'intel-demo-002',
    client_key: 'hooverfamilydentistry',
    tool_id: null,
    pattern: 'UPS backup batteries failing across multiple workstations',
    observation: 'Three workstations in exam rooms 1, 2, and 4 showed battery failure warnings. APC Back-UPS units approximately 4 years old.',
    resolution: 'Replace APC Back-UPS batteries. Schedule proactive replacement across all 6 units. Client approved full battery audit.',
    confidence: 'high' as const,
    tags: ['ups', 'battery', 'power', 'recurrence', 'hardware'],
    source_ticket: '4114075',
    observed_at: '2026-02-20T09:15:00',
    created_by: 'pilot',
    created_at: '2026-02-20T12:00:00',
  },
  {
    id: 'intel-demo-003',
    client_key: null,
    tool_id: 'eaglesoft',
    pattern: 'Eaglesoft 21.x crashes on Windows 11 22H2 after update KB5034441',
    observation: 'Multiple clients reported Eaglesoft crashing at startup after Windows Update applied overnight. Error: runtime exception in EagleSoft.exe.',
    resolution: 'Uninstall KB5034441 via Windows Update history. Block update via GPO or WSUS. Vendor patch expected within 2 weeks.',
    confidence: 'high' as const,
    tags: ['eaglesoft', 'windows-update', 'windows-11', 'crash', 'cross-client'],
    source_ticket: null,
    observed_at: '2026-01-28T08:00:00',
    created_by: 'pilot',
    created_at: '2026-01-28T10:30:00',
  },
  {
    id: 'intel-demo-004',
    client_key: 'foundation-dental-partners-wh',
    tool_id: 'dexis',
    pattern: 'DEXIS sensor calibration drift after 18 months',
    observation: 'Sensor producing slightly overexposed images. Calibration log showed last calibration 19 months ago.',
    resolution: 'Run DEXIS sensor calibration wizard. If drift persists after 3 calibrations, escalate to vendor for sensor replacement under warranty.',
    confidence: 'medium' as const,
    tags: ['dexis', 'sensor', 'calibration', 'imaging', 'clinical'],
    source_ticket: '3972572',
    observed_at: '2026-02-10T14:00:00',
    created_by: 'pilot',
    created_at: '2026-02-10T16:00:00',
  },
  {
    id: 'intel-demo-005',
    client_key: 'westside-pediatric-dental',
    tool_id: null,
    pattern: 'Veeam backup credential failure after AD password rotation',
    observation: 'Service account password updated in AD but not propagated to Veeam job credentials. Three consecutive nightly backup failures before discovery.',
    resolution: 'Update NAS repository credentials in Veeam B&R console for all 4 scheduled jobs. Implement credential rotation checklist — AD changes must include Veeam audit.',
    confidence: 'high' as const,
    tags: ['veeam', 'backup', 'credentials', 'active-directory', 'nas'],
    source_ticket: '4001',
    observed_at: '2026-02-25T11:00:00',
    created_by: 'pilot',
    created_at: '2026-02-25T13:00:00',
  },
];

export const DEMO_FILTER_OPTIONS = {
  client_keys: [
    'hooverfamilydentistry',
    'foundation-dental-partners-wh',
    'westside-pediatric-dental',
    'jayashree-srinivasan-dmd',
    'shades-creek-dental',
  ],
  tool_ids: [
    'eaglesoft',
    'dexis',
    'dentrix',
    'carestream',
    'veeam',
    'windows-server',
  ],
};

export const DEMO_CONTEXT = {
  ticket_key: 'TKT-2891',
  client_key: 'hooverfamilydentistry',
  situation: 'Eaglesoft server unreachable — all workstations offline',
  expectation: 'Client expects full system restoration during this visit. Dr. Hoover has back-to-back patients starting at 9 AM.',
  constraints: 'Visit window 7:30–9:00 AM before patients arrive. No remote access available — must be onsite.',
  emotion_tone: 'frustrated',
  impact_level: 'high',
  clinical_workflow_impact: true,
  issue_category: 'server',
  risk_flags: [
    'Appointment schedule at risk — 12 patients booked before noon',
    'UPS units flagged as aging — potential repeat failure',
    'Client expressed frustration on prior ticket — trust score declining',
  ],
};

export const DEMO_SIGNALS = {
  urgency_score: 87,
  urgency_signal: 'HIGH',
  readiness_score: 62,
  readiness_signal: 'MEDIUM',
  trust_score: 58,
  trust_signal: 'DECLINING',
  friction_score: 71,
  friction_signal: 'ELEVATED',
};
