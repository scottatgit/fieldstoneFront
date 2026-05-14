
// ─────────────────────────────────────────────────────────────────────────────
// DEMO BRIEFING ROOM DATA — Signal sales demo workspace
// Dental IT managed-services scenario: 4 clients, 6 open briefs, rich history
// ─────────────────────────────────────────────────────────────────────────────

const NOW = new Date();
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86400000).toISOString().slice(0, 19);
const hoursAgo = (n: number) => new Date(NOW.getTime() - n * 3600000).toISOString().slice(0, 19);

// ── Open Working Briefs (summary level) ──────────────────────────────────────

export const DEMO_OPEN_BRIEFS = [
  // ── Valley Dental Group ─────────────────────────────────────────────────
  {
    brief_id: 'wbl-demo-001',
    ticket_key: 'TK-4501',
    workspace_id: 'demo',
    status: 'open',
    ticket_status: 'open',
    client_key: 'valley-dental',
    client_display_name: 'Valley Dental Group',
    ticket_title: 'Dexis imaging server down – hygiene completely blocked',
    refresh_status: 'fresh',
    refresh_trigger: 'manual',
    confidence: 0.71,
    notes_since_refresh: 2,
    last_refreshed_at: hoursAgo(3),
    last_updated: hoursAgo(1),
    created_at: hoursAgo(5),
    situation: 'DEXIS imaging server on the main hygiene workstation has stopped responding. The hygienist cannot take or retrieve X-rays for any patient. Error code 1003 on startup. Three patients have already been rescheduled this morning.',
    expectation: 'Imaging restored before afternoon schedule. Client expects same-day resolution given business impact.',
    constraints: 'Dexis v10.0.3 installed. Windows 11 23H2 update was pushed automatically 2 days ago. No on-site tech available before 11am.',
    intel_link_count: 3,
  },
  {
    brief_id: 'wbl-demo-002',
    ticket_key: 'TK-4502',
    workspace_id: 'demo',
    status: 'open',
    ticket_status: 'open',
    client_key: 'valley-dental',
    client_display_name: 'Valley Dental Group',
    ticket_title: 'Dentrix extremely slow on front desk – billing cycle at risk',
    refresh_status: 'stale',
    refresh_trigger: 'notes',
    confidence: 0.58,
    notes_since_refresh: 3,
    last_refreshed_at: daysAgo(1),
    last_updated: hoursAgo(2),
    created_at: daysAgo(2),
    situation: 'Dentrix is running 4–6x slower than normal on the front desk billing station since Monday. Month-end billing export is due Friday. Office manager says some computers are affected but not all.',
    expectation: 'Normal Dentrix performance restored before billing cycle closes Friday. No data loss acceptable.',
    constraints: 'KB5034123 Windows update applied last week. Mix of 8GB and 16GB RAM workstations. Dentrix G7.4.',
    intel_link_count: 2,
  },

  // ── Sunrise Family Dentistry ─────────────────────────────────────────────
  {
    brief_id: 'wbl-demo-003',
    ticket_key: 'TK-4503',
    workspace_id: 'demo',
    status: 'open',
    ticket_status: 'open',
    client_key: 'sunrise-family',
    client_display_name: 'Sunrise Family Dentistry',
    ticket_title: 'Emergency workstation replacement – treatment room 3',
    refresh_status: 'fresh',
    refresh_trigger: 'auto',
    confidence: 0.63,
    notes_since_refresh: 1,
    last_refreshed_at: hoursAgo(4),
    last_updated: hoursAgo(4),
    created_at: daysAgo(1),
    situation: 'Workstation in treatment room 3 suffered a power surge during last night storm and will not POST. Dr. Patel needs the room back — it has the only intraoral camera in the office.',
    expectation: 'Replacement workstation configured and operational within 48 hours. Data recovery attempted. Insurance pre-authorization submitted.',
    constraints: 'Needs Dentrix and Dexis installed. Intraoral camera uses USB driver specific to Dexis dongle. Delta Dental insurance pre-auth required before hardware purchase.',
    intel_link_count: 1,
  },
  {
    brief_id: 'wbl-demo-004',
    ticket_key: 'TK-4504',
    workspace_id: 'demo',
    status: 'open',
    ticket_status: 'open',
    client_key: 'sunrise-family',
    client_display_name: 'Sunrise Family Dentistry',
    ticket_title: 'Suspicious phishing email – possible credential exposure',
    refresh_status: 'needs_refresh',
    refresh_trigger: 'notes',
    confidence: 0.44,
    notes_since_refresh: 4,
    last_refreshed_at: daysAgo(2),
    last_updated: hoursAgo(6),
    created_at: daysAgo(2),
    situation: 'Front desk staff received a convincing phishing email impersonating Delta Dental with a login link. Email reports suspicious email received but does not confirm whether anyone clicked.',
    expectation: 'Risk assessment completed. Credentials rotated if exposure confirmed. Security posture reviewed.',
    constraints: 'Last security audit was 14 months ago. Service agreement includes annual security review clause. 6 staff accounts use shared credentials.',
    intel_link_count: 2,
  },

  // ── Metro Oral Surgery ───────────────────────────────────────────────────
  {
    brief_id: 'wbl-demo-005',
    ticket_key: 'TK-4505',
    workspace_id: 'demo',
    status: 'open',
    ticket_status: 'open',
    client_key: 'metro-oral',
    client_display_name: 'Metro Oral Surgery',
    ticket_title: 'Post-op documentation system down – CRITICAL clinical impact',
    refresh_status: 'fresh',
    refresh_trigger: 'escalation',
    confidence: 0.82,
    notes_since_refresh: 0,
    last_refreshed_at: hoursAgo(1),
    last_updated: hoursAgo(1),
    created_at: hoursAgo(2),
    situation: 'The post-operative documentation system is completely unavailable. Surgical patients cannot have post-op care notes, medication orders, or follow-up instructions documented. Three surgeries are scheduled this afternoon.',
    expectation: 'System restored before first afternoon case at 1:30pm. Workaround paper documentation initiated immediately if resolution takes longer.',
    constraints: 'Escalation came from office manager and surgeon directly. Liability risk if post-op notes are not documented. FormDr integration and Dentrix charting both affected.',
    intel_link_count: 4,
  },

  // ── Lakeside Orthodontics ────────────────────────────────────────────────
  {
    brief_id: 'wbl-demo-006',
    ticket_key: 'TK-4506',
    workspace_id: 'demo',
    status: 'open',
    ticket_status: 'open',
    client_key: 'lakeside-ortho',
    client_display_name: 'Lakeside Orthodontics',
    ticket_title: 'Dolphin Imaging 11 setup + network assessment – new client onboarding',
    refresh_status: 'fresh',
    refresh_trigger: 'auto',
    confidence: 0.55,
    notes_since_refresh: 1,
    last_refreshed_at: daysAgo(1),
    last_updated: daysAgo(1),
    created_at: daysAgo(3),
    situation: 'New client onboarding. Lakeside is upgrading from Dolphin 9.x to Dolphin Imaging 11 across 4 treatment workstations. Network assessment has not been done yet. They are migrating from a previous IT provider.',
    expectation: 'Dolphin 11 installed and configured on all 4 workstations. Network topology documented. Database migration from 9.x validated. Done within 2 weeks.',
    constraints: 'No existing network documentation from prior IT provider. Dolphin 9.x uses a different DB schema than Dolphin 11 — migration script required. Firewall rules unknown.',
    intel_link_count: 0,
  },
];

// ── Working Brief Details (BriefDetailPanel + BriefingRoomView) ───────────────

export const DEMO_BRIEF_DETAILS: Record<string, object> = {
  'TK-4501': {
    ...DEMO_OPEN_BRIEFS[0],
    context_summary: 'Valley Dental is a high-volume multi-location practice with a documented pattern of Dexis imaging instability. Intel base confirms a known issue with DEXIS v10.0.3 on Windows 11 23H2: the imaging service fails to start due to a registry key conflict introduced by the KB5035853 patch. Fix involves a registry edit and service restart — typically 20 minutes remote. Patient X-ray database is on the shared NAS, not the local workstation, so data is not at risk.',
    resolution_direction: 'Remote session to affected workstation. Check DEXIS service status in services.msc. Apply known registry fix for v10.0.3/23H2 conflict. Restart DEXIS Imaging Server service. Confirm hygienist can take and retrieve images before closing.',
    follow_up_items: [
      'Verify KB5035853 is not re-applied on next Windows Update cycle — add to WSUS exclusion list',
      'Check all 3 Valley locations for same Windows 11 version — preemptive fix if needed',
      'Log resolution in intel as confirmed Dexis/Win11 pattern for future rapid response',
    ],
    risk_flags: [
      'Clinical workflow fully blocked — every hygiene appointment is impacted until resolved',
      'Three patients already rescheduled this morning — client relationship is time-sensitive',
    ],
    missing_context_flags: [
      'Should this follow the same Dexis v10.0.3 registry fix used in TK-4388 (March)? That ticket required a license server reset after the registry edit — confirm whether license error appears after applying the fix.',
      'Current email does not confirm whether the DEXIS database is on the local workstation or the shared NAS. Confirm before any uninstall/reinstall attempt to avoid data loss risk.',
      'Hygienist reported error code 1003 — request a screenshot of the full error dialog to confirm this matches the known Win11 23H2 conflict pattern before applying registry fix.',
    ],
    absorbed_note_count: 5,
    source_note_ids: ['note-1001', 'note-1002'],
    intel_link_count: 3,
    intel_snapshot: JSON.stringify([
      { entry_id: 'intel-dexis-win11', confidence: 'high', source: 'platform', tag: 'DEXIS v10.0.3 + Windows 11 23H2 registry conflict' },
      { entry_id: 'intel-valley-nas', confidence: 'confirmed', source: 'client', tag: 'Valley Dental NAS location: NAS01/DEXIS_DB' },
      { entry_id: 'intel-dexis-lic', confidence: 'medium', source: 'pattern', tag: 'Dexis license server reset required after registry edit in some cases' },
    ]),
    refresh_error: null,
  },

  'TK-4502': {
    ...DEMO_OPEN_BRIEFS[1],
    context_summary: 'Dentrix G7.4 performance degradation after KB5034123 is a documented pattern. The patch conflicts with Dentrix database connection pooling on machines with less than 16GB RAM. Front desk billing station is the primary affected machine. Valley Dental has a mix of 8GB and 16GB workstations — the 8GB machines are the likely culprits. Month-end billing export is due Friday.',
    resolution_direction: 'Identify affected workstations by RAM. On 8GB machines: apply Dentrix performance registry tweak and increase DB connection pool timeout. If immediate relief needed: temporarily pause Windows Update service and test. Escalate to Henry Schein if not resolved within 2 business days.',
    follow_up_items: [
      'Document which workstations have 8GB RAM and flag for hardware upgrade in next budget cycle',
      'Test Friday billing export on affected machine before EOD Thursday',
      'Submit KB5034123 exclusion to WSUS for all Valley locations until Henry Schein releases a patch',
    ],
    risk_flags: [
      'Month-end billing export due Friday — delays could affect cash flow and insurance claim deadlines',
      'Full scope unknown until workstation audit completed',
    ],
    missing_context_flags: [
      'Was KB5034123 applied to all workstations simultaneously or on different schedules? This determines how many machines are at risk.',
      'Does the slowness affect only Dentrix or is the entire workstation sluggish? System-wide slowness suggests the Windows update itself rather than a Dentrix conflict.',
      'Is the front desk billing station the only machine running the billing module, or do other operatory workstations also handle billing? Scope of impact depends on this.',
    ],
    absorbed_note_count: 3,
    source_note_ids: ['note-1003'],
    intel_link_count: 2,
    intel_snapshot: JSON.stringify([
      { entry_id: 'intel-kb5034123', confidence: 'high', source: 'platform', tag: 'KB5034123 conflicts with Dentrix G7.x on less than 16GB RAM' },
      { entry_id: 'intel-valley-hw', confidence: 'medium', source: 'client', tag: 'Valley Dental: 3 of 8 workstations have 8GB RAM' },
    ]),
    refresh_error: null,
  },

  'TK-4503': {
    ...DEMO_OPEN_BRIEFS[2],
    context_summary: 'Sunrise had a nearly identical workstation replacement in January (TK-4288) — that ticket required 3 revision cycles with Delta Dental because the hardware spec did not match their approved vendor list. The Dexis dongle model (USB-C Gen 2) requires a separate driver install that was missed in TK-4288 and caused a half-day delay. Hard drive is likely recoverable given it was a power surge, not mechanical failure.',
    resolution_direction: 'Step 1: Initiate Delta Dental pre-auth immediately using the corrected hardware spec template from TK-4288. Step 2: Attempt data recovery from failed drive using SATA-to-USB bridge. Step 3: Source replacement from approved vendor list. Step 4: Install Dentrix and Dexis with correct USB-C dongle driver before delivery.',
    follow_up_items: [
      'Pre-auth: use Sunrise Delta Dental provider portal account in vault — not the paper form',
      'Test Dexis intraoral camera connection specifically before declaring workstation ready',
      'Document correct dongle driver version in client record to avoid repeat issue',
    ],
    risk_flags: [
      'Treatment room 3 is the only room with an intraoral camera — delay impacts diagnostic capability for every patient',
      'Delta Dental pre-auth can take 3–5 business days — Dr. Patel may push for a loaner',
    ],
    missing_context_flags: [
      'Should this follow the same Delta Dental pre-auth process as TK-4288? That ticket required 3 revision cycles — confirm the hardware spec has been updated to the current approved model before submitting.',
      'Current email does not confirm whether the hard drive survived the surge. If unreadable, patient imaging history stored locally could be lost — confirm storage location before any physical handling.',
      'Confirm the exact Dexis dongle model (USB-C Gen 2 or Gen 3) so the correct driver version is staged before delivery — this was missed in TK-4288 and caused a half-day delay.',
    ],
    absorbed_note_count: 2,
    source_note_ids: ['note-1004'],
    intel_link_count: 1,
    intel_snapshot: JSON.stringify([
      { entry_id: 'intel-sunrise-insur', confidence: 'confirmed', source: 'client', tag: 'Sunrise Delta Dental pre-auth: use portal not paper form. Prior ticket TK-4288 required 3 revision cycles.' },
    ]),
    refresh_error: null,
  },

  'TK-4504': {
    ...DEMO_OPEN_BRIEFS[3],
    context_summary: 'Sunrise last formal security review was 14 months ago (TK-4099). Annual security review clause was not triggered at the 12-month mark. Six staff accounts use a shared front desk credential for the practice management portal — a known risk flagged but not remediated in TK-4099. If any staff member clicked the phishing link and entered credentials, all six accounts are potentially compromised.',
    resolution_direction: 'Immediate: determine whether any staff interacted with the phishing link. Check email gateway logs. If credential entry confirmed or suspected: force-rotate all 6 shared front desk credentials and enable MFA. Regardless of outcome: trigger the overdue annual security review. Document for HIPAA breach assessment.',
    follow_up_items: [
      'HIPAA breach assessment required if PHI was potentially exposed — document timeline and actions',
      'Annual security review is 2 months overdue — schedule as part of this incident response',
      'Eliminate shared front desk credentials: create individual accounts for each staff member',
    ],
    risk_flags: [
      'HIPAA breach risk if staff clicked and entered credentials — patient data accessible via compromised account',
      'Six staff share a single credential set — one compromise exposes all six sessions simultaneously',
      'Security review was 2 months overdue before this incident — service agreement compliance at risk',
    ],
    missing_context_flags: [
      'Did any staff member click the phishing link or enter credentials? The email reports only that the message was received. Risk classification changes from low to critical if credentials were entered.',
      'Sunrise last security audit was 14 months ago (TK-4099) — does this incident trigger the annual review clause in the service agreement, or is this treated as a separate incident response?',
      'Are the 6 shared front desk credentials also used to access patient-facing portals such as Dentrix Patient Portal or insurance eligibility systems? Scope of exposure depends on this.',
    ],
    absorbed_note_count: 4,
    source_note_ids: ['note-1005', 'note-1006'],
    intel_link_count: 2,
    intel_snapshot: JSON.stringify([
      { entry_id: 'intel-sunrise-creds', confidence: 'confirmed', source: 'client', tag: 'Sunrise: 6 staff share front desk portal credentials. Not remediated in TK-4099.' },
      { entry_id: 'intel-sunrise-audit', confidence: 'confirmed', source: 'client', tag: 'Sunrise last security review: TK-4099, 14 months ago. Annual review clause not triggered.' },
    ]),
    refresh_error: null,
  },

  'TK-4505': {
    ...DEMO_OPEN_BRIEFS[4],
    context_summary: 'Metro Oral Surgery had a nearly identical critical outage in January (TK-4441) traced to a failed domain controller. The backup DC had not been promoted and the primary was a single point of failure — took 4 hours to resolve. The current outage shares the same symptom pattern: multiple services down simultaneously, consistent with a DC failure rather than an application-level issue. Metro FormDr and Dentrix integration both require domain authentication.',
    resolution_direction: 'IMMEDIATE: Check domain controller status before any application-level troubleshooting. Run dcdiag on primary DC. If DC failing: promote backup DC (configured but not promoted since January fix). Do not troubleshoot FormDr or Dentrix until DC health is confirmed. Notify surgeon: paper documentation protocol should start now for 1:30pm cases.',
    follow_up_items: [
      'After resolution: set up DC health monitoring alert — second DC-related outage in 4 months',
      'Promote backup DC to secondary — January fix only deployed it, did not promote it',
      'Schedule quarterly DC health checks as part of Metro managed services agreement',
    ],
    risk_flags: [
      'CRITICAL: surgical patients cannot have post-op notes documented — liability and HIPAA compliance risk',
      'Three afternoon surgeries scheduled at 1:30pm — hard deadline for restoration or paper workaround decision',
      'Single-point-of-failure domain controller — same pattern as January 4-hour outage',
    ],
    missing_context_flags: [
      'Is the domain controller online? Most likely root cause based on TK-4441 — DC failure caused both FormDr and Dentrix to drop simultaneously. Check dcdiag before investigating application-level issues.',
      'Which specific system is described as the system in the escalation email — FormDr, Dentrix charting, or the shared drive where post-op templates are stored?',
      'Has the backup DC configured in January been promoted to secondary, or is it still in standby mode? If not promoted, Metro Oral is still operating with a single DC.',
    ],
    absorbed_note_count: 0,
    source_note_ids: [],
    intel_link_count: 4,
    intel_snapshot: JSON.stringify([
      { entry_id: 'intel-metro-dc', confidence: 'confirmed', source: 'client', tag: 'Metro Oral: single-point-of-failure DC caused 4h outage Jan (TK-4441). Backup DC deployed but NOT promoted.' },
      { entry_id: 'intel-metro-formdr', confidence: 'confirmed', source: 'client', tag: 'Metro FormDr and Dentrix integration requires domain auth — both fail when DC is unavailable.' },
      { entry_id: 'intel-metro-surgeon', confidence: 'medium', source: 'pattern', tag: 'Metro escalation pattern: office manager plus surgeon contact means critical impact, 2h SLA expected.' },
      { entry_id: 'intel-metro-paper', confidence: 'confirmed', source: 'client', tag: 'Metro has paper post-op documentation protocol approved for outage scenarios.' },
    ]),
    refresh_error: null,
  },

  'TK-4506': {
    ...DEMO_OPEN_BRIEFS[5],
    context_summary: 'Lakeside Orthodontics is a new client onboarded 3 weeks ago. No network documentation exists — previous IT provider transferred nothing. Dolphin Imaging 11 requires SQL Server 2019+ on a dedicated server, static IP for imaging server, inbound firewall rules on ports 1433 and 4000-4010, and a shared UNC path for patient image storage. Migration from Dolphin 9.x to 11 involves a database schema conversion requiring the practice to be closed (typically 2-4 hours).',
    resolution_direction: 'Phase 1: Network assessment — document current topology, confirm server hardware meets Dolphin 11 SQL requirements, identify static IP availability. Phase 2: Staging — install on test workstation first, validate DB migration script against copy of 9.x database. Phase 3: Production migration — schedule with office closed, run migration, validate all 4 workstations, confirm legacy data retrieval.',
    follow_up_items: [
      'Request network diagram from prior IT provider or conduct full audit before scheduling migration',
      'Confirm SQL Server version on existing server — Dolphin 11 requires 2019 plus, Dolphin 9.x commonly used 2012',
      'Schedule migration window when office is closed — weekend preferred',
    ],
    risk_flags: [
      'No network documentation from prior IT provider — unknown firewall rules could block Dolphin 11 connectivity',
      'Dolphin 9.x to 11 DB schema migration is irreversible without a full backup — backup validation required before migration window',
    ],
    missing_context_flags: [
      'What SQL Server version is running on the existing imaging server? Dolphin 11 requires SQL Server 2019 or newer — if the current server runs 2012 (common with Dolphin 9.x), a SQL Server upgrade is required before Dolphin 11 can be installed.',
      'Does Lakeside have a specific deadline for the Dolphin 11 migration, or is 2 weeks a soft target? The deadline determines whether the network assessment and staging can run sequentially or must overlap.',
      'Are the 4 treatment workstations all running the same OS? Dolphin 11 has known driver issues on Windows 10 21H1 — confirming OS versions before staging prevents last-minute compatibility blocks.',
    ],
    absorbed_note_count: 1,
    source_note_ids: ['note-1007'],
    intel_link_count: 0,
    intel_snapshot: JSON.stringify([]),
    refresh_error: null,
  },
};

// ── Client Stories (/api/clients/{key}/story) ─────────────────────────────────

const _ts = () => { const n = new Date(); return n.toISOString().slice(0, 19); };

export const DEMO_CLIENT_STORIES: Record<string, object> = {
  'valley-dental': {
    client_key: 'valley-dental',
    client_display_name: 'Valley Dental Group',
    generated_at: hoursAgo(2),
    window_days: 90,
    window_from: daysAgo(90),
    window_to: hoursAgo(2),
    data_quality: 'usable',
    has_pre_fcb_history: true,
    summary: {
      total_briefs: 14,
      outcome_distribution: { resolved: 9, mitigated: 3, at_risk: 1, escalated: 1 },
      open_risk_count: 1,
      trust: { avg_at_open: 0.74, avg_at_close: 0.81, delta: 0.07, trend: 'improving', latest: 0.84, min_in_window: 0.61 },
      expectation_drift: { met: 10, unmet: 2, shifted: 2, unknown: 0 },
      confidence_distribution: { high: 8, standard: 4, low: 2, incomplete: 0 },
      low_confidence_count: 2,
    },
    issue_patterns: {
      category_counts: [
        { category: 'imaging_software', count: 6 },
        { category: 'network_performance', count: 3 },
        { category: 'windows_update_compatibility', count: 3 },
        { category: 'billing_software', count: 2 },
      ],
      recurring_categories: ['imaging_software', 'network_performance', 'windows_update_compatibility'],
      impact_distribution: { high: 4, medium: 7, low: 3 },
      emotion_distribution: { neutral: 8, urgent: 4, frustrated: 2 },
      asset_type_counts: [{ type: 'workstation', count: 9 }, { type: 'server', count: 3 }, { type: 'network', count: 2 }],
      asset_hostname_counts: [{ hostname: 'HYGIENE-WS01', count: 4 }, { hostname: 'FRONTDESK-PC', count: 3 }],
    },
    risk_indicators: {
      unresolved_briefs: [{ brief_id: 'fcb-v-012', ticket_key: 'TK-4389', outcome_type: 'at_risk', issue_category: 'imaging_software', impact_level: 'high', closed_at: daysAgo(18) }],
      missing_context_pattern_counts: { dexis_license_status: 4, nas_path_confirmation: 3, windows_update_version: 3 },
      high_emotion_count: 2,
      risk_flag_summary: ['dexis_instability_recurrent', 'windows_update_wsus_gap', 'single_nas_no_redundancy'],
    },
    timeline: [
      { brief_id: 'fcb-v-014', ticket_key: 'TK-4488', outcome_type: 'resolved', issue_category: 'network_performance', impact_level: 'medium', trust_at_close: 0.84, confidence: 'high', missing_context_flags: [], ai_generated: true, closed_at: daysAgo(5), ai_close_note_scrubbed: null },
      { brief_id: 'fcb-v-013', ticket_key: 'TK-4451', outcome_type: 'resolved', issue_category: 'imaging_software', impact_level: 'high', trust_at_close: 0.81, confidence: 'high', missing_context_flags: [], ai_generated: true, closed_at: daysAgo(12), ai_close_note_scrubbed: null },
      { brief_id: 'fcb-v-012', ticket_key: 'TK-4389', outcome_type: 'at_risk', issue_category: 'imaging_software', impact_level: 'high', trust_at_close: 0.69, confidence: 'standard', missing_context_flags: ['dexis_license_server_not_confirmed'], ai_generated: true, closed_at: daysAgo(18), ai_close_note_scrubbed: null },
      { brief_id: 'fcb-v-011', ticket_key: 'TK-4355', outcome_type: 'mitigated', issue_category: 'windows_update_compatibility', impact_level: 'medium', trust_at_close: 0.76, confidence: 'standard', missing_context_flags: [], ai_generated: true, closed_at: daysAgo(31), ai_close_note_scrubbed: null },
      { brief_id: 'fcb-v-010', ticket_key: 'TK-4288', outcome_type: 'resolved', issue_category: 'billing_software', impact_level: 'medium', trust_at_close: 0.79, confidence: 'high', missing_context_flags: [], ai_generated: true, closed_at: daysAgo(45), ai_close_note_scrubbed: null },
    ],
  },

  'sunrise-family': {
    client_key: 'sunrise-family',
    client_display_name: 'Sunrise Family Dentistry',
    generated_at: hoursAgo(3),
    window_days: 90,
    window_from: daysAgo(90),
    window_to: hoursAgo(3),
    data_quality: 'usable',
    has_pre_fcb_history: true,
    summary: {
      total_briefs: 7,
      outcome_distribution: { resolved: 3, mitigated: 1, at_risk: 2, escalated: 1 },
      open_risk_count: 2,
      trust: { avg_at_open: 0.83, avg_at_close: 0.66, delta: -0.17, trend: 'declining', latest: 0.61, min_in_window: 0.55 },
      expectation_drift: { met: 3, unmet: 3, shifted: 1, unknown: 0 },
      confidence_distribution: { high: 2, standard: 3, low: 2, incomplete: 0 },
      low_confidence_count: 2,
    },
    issue_patterns: {
      category_counts: [
        { category: 'workstation_hardware', count: 3 },
        { category: 'security_posture', count: 2 },
        { category: 'billing_software', count: 2 },
      ],
      recurring_categories: ['workstation_hardware', 'security_posture'],
      impact_distribution: { high: 3, medium: 3, low: 1 },
      emotion_distribution: { frustrated: 3, urgent: 2, neutral: 2 },
      asset_type_counts: [{ type: 'workstation', count: 5 }, { type: 'network', count: 1 }],
      asset_hostname_counts: [{ hostname: 'TREATRM3-PC', count: 2 }, { hostname: 'FRONTDESK-01', count: 2 }],
    },
    risk_indicators: {
      unresolved_briefs: [
        { brief_id: 'fcb-s-006', ticket_key: 'TK-4399', outcome_type: 'at_risk', issue_category: 'workstation_hardware', impact_level: 'high', closed_at: daysAgo(22) },
        { brief_id: 'fcb-s-005', ticket_key: 'TK-4350', outcome_type: 'escalated', issue_category: 'billing_software', impact_level: 'high', closed_at: daysAgo(38) },
      ],
      missing_context_pattern_counts: { insurance_preauth_status: 3, credential_exposure_confirmed: 2 },
      high_emotion_count: 3,
      risk_flag_summary: ['aging_hardware_fleet', 'security_posture_below_baseline', 'trust_declining_pattern', 'shared_credentials_unresolved'],
    },
    timeline: [
      { brief_id: 'fcb-s-007', ticket_key: 'TK-4450', outcome_type: 'resolved', issue_category: 'billing_software', impact_level: 'medium', trust_at_close: 0.61, confidence: 'standard', missing_context_flags: [], ai_generated: true, closed_at: daysAgo(8), ai_close_note_scrubbed: null },
      { brief_id: 'fcb-s-006', ticket_key: 'TK-4399', outcome_type: 'at_risk', issue_category: 'workstation_hardware', impact_level: 'high', trust_at_close: 0.55, confidence: 'low', missing_context_flags: ['insurance_preauth_outcome_unknown'], ai_generated: true, closed_at: daysAgo(22), ai_close_note_scrubbed: null },
      { brief_id: 'fcb-s-005', ticket_key: 'TK-4350', outcome_type: 'escalated', issue_category: 'billing_software', impact_level: 'high', trust_at_close: 0.58, confidence: 'standard', missing_context_flags: [], ai_generated: true, closed_at: daysAgo(38), ai_close_note_scrubbed: null },
      { brief_id: 'fcb-s-004', ticket_key: 'TK-4288', outcome_type: 'resolved', issue_category: 'workstation_hardware', impact_level: 'high', trust_at_close: 0.72, confidence: 'high', missing_context_flags: [], ai_generated: true, closed_at: daysAgo(55), ai_close_note_scrubbed: null },
    ],
  },

  'metro-oral': {
    client_key: 'metro-oral',
    client_display_name: 'Metro Oral Surgery',
    generated_at: hoursAgo(1),
    window_days: 90,
    window_from: daysAgo(90),
    window_to: hoursAgo(1),
    data_quality: 'usable',
    has_pre_fcb_history: true,
    summary: {
      total_briefs: 9,
      outcome_distribution: { resolved: 6, mitigated: 1, at_risk: 0, escalated: 2 },
      open_risk_count: 0,
      trust: { avg_at_open: 0.62, avg_at_close: 0.83, delta: 0.21, trend: 'improving', latest: 0.91, min_in_window: 0.58 },
      expectation_drift: { met: 7, unmet: 1, shifted: 1, unknown: 0 },
      confidence_distribution: { high: 6, standard: 2, low: 1, incomplete: 0 },
      low_confidence_count: 1,
    },
    issue_patterns: {
      category_counts: [
        { category: 'network_infrastructure', count: 4 },
        { category: 'documentation_system', count: 3 },
        { category: 'domain_services', count: 2 },
      ],
      recurring_categories: ['network_infrastructure', 'documentation_system'],
      impact_distribution: { high: 5, medium: 3, low: 1 },
      emotion_distribution: { urgent: 5, anxious: 2, neutral: 2 },
      asset_type_counts: [{ type: 'server', count: 4 }, { type: 'network', count: 3 }, { type: 'workstation', count: 2 }],
      asset_hostname_counts: [{ hostname: 'DC01-METRO', count: 3 }, { hostname: 'FORMDR-SRV', count: 2 }],
    },
    risk_indicators: {
      unresolved_briefs: [],
      missing_context_pattern_counts: { dc_health_pre_confirmed: 3, backup_dc_promotion_status: 2 },
      high_emotion_count: 2,
      risk_flag_summary: ['domain_controller_single_point_of_failure', 'backup_dc_not_promoted', 'clinical_workflow_critical_dependency'],
    },
    timeline: [
      { brief_id: 'fcb-m-009', ticket_key: 'TK-4490', outcome_type: 'resolved', issue_category: 'network_infrastructure', impact_level: 'medium', trust_at_close: 0.91, confidence: 'high', missing_context_flags: [], ai_generated: true, closed_at: daysAgo(3), ai_close_note_scrubbed: null },
      { brief_id: 'fcb-m-008', ticket_key: 'TK-4460', outcome_type: 'resolved', issue_category: 'documentation_system', impact_level: 'high', trust_at_close: 0.88, confidence: 'high', missing_context_flags: [], ai_generated: true, closed_at: daysAgo(14), ai_close_note_scrubbed: null },
      { brief_id: 'fcb-m-007', ticket_key: 'TK-4441', outcome_type: 'escalated', issue_category: 'domain_services', impact_level: 'high', trust_at_close: 0.71, confidence: 'standard', missing_context_flags: ['backup_dc_not_promoted_after_fix'], ai_generated: true, closed_at: daysAgo(28), ai_close_note_scrubbed: null },
      { brief_id: 'fcb-m-006', ticket_key: 'TK-4412', outcome_type: 'resolved', issue_category: 'network_infrastructure', impact_level: 'medium', trust_at_close: 0.83, confidence: 'high', missing_context_flags: [], ai_generated: true, closed_at: daysAgo(42), ai_close_note_scrubbed: null },
    ],
  },

  'lakeside-ortho': {
    client_key: 'lakeside-ortho',
    client_display_name: 'Lakeside Orthodontics',
    generated_at: daysAgo(1),
    window_days: 90,
    window_from: daysAgo(90),
    window_to: daysAgo(1),
    data_quality: 'thin',
    has_pre_fcb_history: false,
    summary: {
      total_briefs: 1,
      outcome_distribution: { resolved: 1, mitigated: 0, at_risk: 0, escalated: 0 },
      open_risk_count: 0,
      trust: { avg_at_open: null, avg_at_close: 0.70, delta: null, trend: 'unknown', latest: 0.70, min_in_window: 0.70 },
      expectation_drift: { met: 1, unmet: 0, shifted: 0, unknown: 0 },
      confidence_distribution: { high: 0, standard: 1, low: 0, incomplete: 0 },
      low_confidence_count: 0,
    },
    issue_patterns: {
      category_counts: [{ category: 'onboarding', count: 1 }],
      recurring_categories: [],
      impact_distribution: { high: 0, medium: 1, low: 0 },
      emotion_distribution: { neutral: 1 },
      asset_type_counts: [{ type: 'network', count: 1 }],
      asset_hostname_counts: [],
    },
    risk_indicators: {
      unresolved_briefs: [],
      missing_context_pattern_counts: {},
      high_emotion_count: 0,
      risk_flag_summary: ['new_client_no_network_documentation', 'prior_it_provider_no_handoff'],
    },
    timeline: [
      { brief_id: 'fcb-l-001', ticket_key: 'TK-4480', outcome_type: 'resolved', issue_category: 'onboarding', impact_level: 'medium', trust_at_close: 0.70, confidence: 'standard', missing_context_flags: [], ai_generated: true, closed_at: daysAgo(14), ai_close_note_scrubbed: null },
    ],
  },
};

// ── Prior Closed Briefs per Client (/api/clients/{key}/briefs) ────────────────

export const DEMO_CLIENT_BRIEFS: Record<string, object> = {
  'valley-dental': {
    briefs: [
      { brief_id: 'fcb-v-014', ticket_key: 'TK-4488', primary_issue: 'Network switch port failure causing intermittent drops on operatory workstations', outcome_type: 'resolved', closed_at: daysAgo(5), confidence: 0.91, issue_category: 'network_performance', impact_level: 'medium', trust_at_open: 0.82, trust_at_close: 0.84, client_display_name: 'Valley Dental Group' },
      { brief_id: 'fcb-v-013', ticket_key: 'TK-4451', primary_issue: 'DEXIS imaging service crash after Windows Update — same pattern as prior incidents', outcome_type: 'resolved', closed_at: daysAgo(12), confidence: 0.88, issue_category: 'imaging_software', impact_level: 'high', trust_at_open: 0.78, trust_at_close: 0.81, client_display_name: 'Valley Dental Group' },
      { brief_id: 'fcb-v-012', ticket_key: 'TK-4389', primary_issue: 'DEXIS license server not responding — 2 hours imaging downtime', outcome_type: 'at_risk', closed_at: daysAgo(18), confidence: 0.65, issue_category: 'imaging_software', impact_level: 'high', trust_at_open: 0.74, trust_at_close: 0.69, client_display_name: 'Valley Dental Group' },
      { brief_id: 'fcb-v-011', ticket_key: 'TK-4355', primary_issue: 'KB5032189 Windows update broke Dentrix chart printing on all workstations', outcome_type: 'mitigated', closed_at: daysAgo(31), confidence: 0.79, issue_category: 'windows_update_compatibility', impact_level: 'medium', trust_at_open: 0.71, trust_at_close: 0.76, client_display_name: 'Valley Dental Group' },
      { brief_id: 'fcb-v-010', ticket_key: 'TK-4288', primary_issue: 'Dentrix billing module slow — month-end AR export failed twice', outcome_type: 'resolved', closed_at: daysAgo(45), confidence: 0.85, issue_category: 'billing_software', impact_level: 'medium', trust_at_open: 0.77, trust_at_close: 0.79, client_display_name: 'Valley Dental Group' },
    ],
    total: 14,
    limit: 50,
  },
  'sunrise-family': {
    briefs: [
      { brief_id: 'fcb-s-007', ticket_key: 'TK-4450', primary_issue: 'Dentrix billing portal login loop after password policy update', outcome_type: 'resolved', closed_at: daysAgo(8), confidence: 0.76, issue_category: 'billing_software', impact_level: 'medium', trust_at_open: 0.64, trust_at_close: 0.61, client_display_name: 'Sunrise Family Dentistry' },
      { brief_id: 'fcb-s-006', ticket_key: 'TK-4399', primary_issue: 'Front desk workstation fan failure — intermittent shutdowns disrupting check-in', outcome_type: 'at_risk', closed_at: daysAgo(22), confidence: 0.58, issue_category: 'workstation_hardware', impact_level: 'high', trust_at_open: 0.67, trust_at_close: 0.55, client_display_name: 'Sunrise Family Dentistry' },
      { brief_id: 'fcb-s-005', ticket_key: 'TK-4350', primary_issue: 'Dentrix scheduling module crash escalated to Henry Schein — 3-day open case', outcome_type: 'escalated', closed_at: daysAgo(38), confidence: 0.71, issue_category: 'billing_software', impact_level: 'high', trust_at_open: 0.72, trust_at_close: 0.58, client_display_name: 'Sunrise Family Dentistry' },
      { brief_id: 'fcb-s-004', ticket_key: 'TK-4288', primary_issue: 'Treatment room 3 workstation replacement after HDD failure — Delta Dental pre-auth required 3 revisions', outcome_type: 'resolved', closed_at: daysAgo(55), confidence: 0.82, issue_category: 'workstation_hardware', impact_level: 'high', trust_at_open: 0.81, trust_at_close: 0.72, client_display_name: 'Sunrise Family Dentistry' },
    ],
    total: 7,
    limit: 50,
  },
  'metro-oral': {
    briefs: [
      { brief_id: 'fcb-m-009', ticket_key: 'TK-4490', primary_issue: 'Firewall policy update blocked FormDr API access — auto-restored after rule correction', outcome_type: 'resolved', closed_at: daysAgo(3), confidence: 0.94, issue_category: 'network_infrastructure', impact_level: 'medium', trust_at_open: 0.88, trust_at_close: 0.91, client_display_name: 'Metro Oral Surgery' },
      { brief_id: 'fcb-m-008', ticket_key: 'TK-4460', primary_issue: 'FormDr post-op template corruption — patient care note fields clearing on save', outcome_type: 'resolved', closed_at: daysAgo(14), confidence: 0.87, issue_category: 'documentation_system', impact_level: 'high', trust_at_open: 0.83, trust_at_close: 0.88, client_display_name: 'Metro Oral Surgery' },
      { brief_id: 'fcb-m-007', ticket_key: 'TK-4441', primary_issue: 'Domain controller failure — 4-hour critical outage, all domain-auth systems down', outcome_type: 'escalated', closed_at: daysAgo(28), confidence: 0.79, issue_category: 'domain_services', impact_level: 'high', trust_at_open: 0.61, trust_at_close: 0.71, client_display_name: 'Metro Oral Surgery' },
      { brief_id: 'fcb-m-006', ticket_key: 'TK-4412', primary_issue: 'Switch uplink failure isolated operatory network segment from server VLAN', outcome_type: 'resolved', closed_at: daysAgo(42), confidence: 0.88, issue_category: 'network_infrastructure', impact_level: 'medium', trust_at_open: 0.79, trust_at_close: 0.83, client_display_name: 'Metro Oral Surgery' },
    ],
    total: 9,
    limit: 50,
  },
  'lakeside-ortho': {
    briefs: [
      { brief_id: 'fcb-l-001', ticket_key: 'TK-4480', primary_issue: 'Initial network audit and onboarding documentation for new client', outcome_type: 'resolved', closed_at: daysAgo(14), confidence: 0.70, issue_category: 'onboarding', impact_level: 'medium', trust_at_open: null, trust_at_close: 0.70, client_display_name: 'Lakeside Orthodontics' },
    ],
    total: 1,
    limit: 50,
  },
};

// ── Ticket Evidence Notes (/api/tickets/{key}/notes GET) ──────────────────────

export const DEMO_TICKET_NOTES: Record<string, object[]> = {
  'TK-4501': [
    { note_id: 'note-1001', content: 'Hygienist called at 8:14am — first patient of the day could not have X-rays taken. Error 1003 appeared on Dexis startup. Three patients rescheduled so far.', created_at: hoursAgo(5), author: 'Intake', note_type: 'intake' },
    { note_id: 'note-1002', content: 'Confirmed DEXIS service shows stopped in services.msc. Windows 11 version 23H2 was applied 2 days ago via automatic update. NAS connectivity verified — patient image DB is intact on NAS01/DEXIS_DB.', created_at: hoursAgo(3), author: 'Tech (Remote)', note_type: 'tech' },
  ],
  'TK-4502': [
    { note_id: 'note-1003', content: 'Office manager reports front desk billing station is 4-6x slower than usual. Dentrix takes 45 seconds to open the billing module. Other operatory workstations seem faster. KB5034123 was pushed last Tuesday.', created_at: daysAgo(1), author: 'Intake', note_type: 'intake' },
  ],
  'TK-4503': [
    { note_id: 'note-1004', content: 'Power surge during storm last night took out treatment room 3 workstation. Will not POST. Dr. Patel needs the room back ASAP — it has the only intraoral camera. Last workstation replacement was TK-4288 in January.', created_at: daysAgo(1), author: 'Intake', note_type: 'intake' },
  ],
  'TK-4504': [
    { note_id: 'note-1005', content: 'Front desk staff forwarded the phishing email. Subject: Delta Dental Provider Portal — Action Required. Link goes to delta-dental-providers.net (NOT Delta Dental). Very convincing — uses correct logo and formatting.', created_at: daysAgo(2), author: 'Tech (Security)', note_type: 'tech' },
    { note_id: 'note-1006', content: 'Reviewed email gateway logs. Unable to confirm click-through from gateway alone — need to check individual browser history on front desk machines. Staff interviews pending.', created_at: daysAgo(2), author: 'Tech (Security)', note_type: 'tech' },
  ],
  'TK-4505': [
    { note_id: 'note-1505-a', content: 'ESCALATION — Dr. Marcus and office manager both called within 5 minutes of each other. Post-op documentation is completely inaccessible. Three surgeries this afternoon starting at 1:30pm. Requesting immediate senior tech response.', created_at: hoursAgo(2), author: 'Intake (Escalation)', note_type: 'escalation' },
  ],
  'TK-4506': [
    { note_id: 'note-1007', content: 'New client onboarding call completed. Lakeside is running Dolphin 9.5 on a Windows Server 2012 R2 box. No documentation from prior IT provider. They want Dolphin 11 installed in the next 2 weeks. 4 treatment workstations, mix of Windows 10 and 11.', created_at: daysAgo(3), author: 'Tech (Onboarding)', note_type: 'intake' },
  ],
};
