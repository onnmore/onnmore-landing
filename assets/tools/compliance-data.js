/* ══════════ ONNMORE TOOLS — COMPLIANCE CALENDAR DATA ══════════
   Centralized so due-date wording only needs updating in one place.
   Deliberately described as recurring patterns ("11th of the following
   month") rather than hard calendar dates, since fixed dates go stale
   and the tool page already tells users to verify current due dates. */
var COMPLIANCE_ITEMS = [
  { id: 'gstr1', category: 'GST', title: 'GSTR-1 (Outward supplies)', frequency: 'Monthly (or quarterly under QRMP)', appliesTo: 'GST-registered businesses', dueNote: 'Generally by the 11th of the following month (13th for QRMP filers).' },
  { id: 'gstr3b', category: 'GST', title: 'GSTR-3B (Summary return & tax payment)', frequency: 'Monthly (or quarterly under QRMP)', appliesTo: 'GST-registered businesses', dueNote: 'Generally by the 20th of the following month; QRMP dates vary by state group (22nd/24th).' },
  { id: 'gstAnnual', category: 'GST', title: 'GSTR-9 (Annual Return)', frequency: 'Annually', appliesTo: 'GST-registered businesses above the applicable turnover threshold', dueNote: 'Generally by 31 December following the financial year end.' },
  { id: 'tdsPayment', category: 'TDS', title: 'TDS Payment', frequency: 'Monthly', appliesTo: 'Businesses deducting TDS on salaries, rent, contracts, etc.', dueNote: 'Generally by the 7th of the following month (30 April for March).' },
  { id: 'tdsReturn', category: 'TDS', title: 'TDS Return (Form 24Q/26Q)', frequency: 'Quarterly', appliesTo: 'Businesses deducting TDS', dueNote: 'Generally within a month of quarter-end (31 May for Q4).' },
  { id: 'advanceTax', category: 'Company', title: 'Advance Tax Instalments', frequency: '4 times a year', appliesTo: 'Businesses and professionals with tax liability above the threshold', dueNote: 'Generally 15 June, 15 September, 15 December and 15 March.' },
  { id: 'itr', category: 'Company', title: 'Income Tax Return Filing', frequency: 'Annually', appliesTo: 'All registered businesses and proprietors', dueNote: 'Generally 31 July (non-audit cases) or 31 October (audit cases) following the financial year.' },
  { id: 'taxAudit', category: 'Company', title: 'Tax Audit Report (if applicable)', frequency: 'Annually', appliesTo: 'Businesses above the tax-audit turnover threshold', dueNote: 'Generally 30 September following the financial year, ahead of the audit-case ITR deadline.' },
  { id: 'aoc4', category: 'Company', title: 'AOC-4 (Filing of Financial Statements)', frequency: 'Annually', appliesTo: 'Private Limited Companies / OPCs', dueNote: 'Generally within 30 days of the Annual General Meeting.' },
  { id: 'mgt7', category: 'Company', title: 'MGT-7 / MGT-7A (Annual Return)', frequency: 'Annually', appliesTo: 'Private Limited Companies / OPCs', dueNote: 'Generally within 60 days of the Annual General Meeting.' },
  { id: 'dinKyc', category: 'Company', title: 'DIN KYC (DIR-3 KYC)', frequency: 'Annually', appliesTo: 'Company directors/designated partners', dueNote: 'Generally by 30 September each year.' },
  { id: 'llp8', category: 'LLP', title: 'Form 8 (Statement of Accounts & Solvency)', frequency: 'Annually', appliesTo: 'LLPs', dueNote: 'Generally by 30 October following the financial year.' },
  { id: 'llp11', category: 'LLP', title: 'Form 11 (Annual Return)', frequency: 'Annually', appliesTo: 'LLPs', dueNote: 'Generally by 30 May following the financial year.' },
  { id: 'pfEsi', category: 'Other', title: 'PF / ESI Contribution & Return', frequency: 'Monthly', appliesTo: 'Businesses registered under PF/ESI (based on employee count)', dueNote: 'Generally by the 15th of the following month.' },
  { id: 'profTax', category: 'Other', title: 'Professional Tax Payment/Return', frequency: 'Monthly or annually (state-specific)', appliesTo: 'Employers and professionals in states levying professional tax, incl. West Bengal', dueNote: 'Frequency and due date vary by state — confirm with the state professional tax authority.' },
  { id: 'fssaiRenewal', category: 'FSSAI', title: 'FSSAI Registration/Licence Renewal', frequency: 'Before expiry (1–5 year validity)', appliesTo: 'Food businesses with an FSSAI registration or licence', dueNote: 'Apply for renewal before your current validity period ends — check your certificate for the exact date.' },
  { id: 'tradeLicenceRenewal', category: 'Trade Licence', title: 'Trade Licence Renewal', frequency: 'Annually', appliesTo: 'Businesses holding a municipal trade licence', dueNote: 'Renewal window is set by the local municipal body — commonly around the start of the financial year.' },
  { id: 'udyamUpdate', category: 'Other', title: 'Udyam Registration Update', frequency: 'As needed / annually recommended', appliesTo: 'Udyam-registered MSMEs', dueNote: 'Update turnover and investment figures on the Udyam portal when they change, ideally at least once a year.' }
];
