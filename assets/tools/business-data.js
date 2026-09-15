/* ══════════ ONNMORE TOOLS — CENTRALIZED BUSINESS DATA ══════════
   Thresholds and reference data used across multiple tools live here,
   in ONE place, so they only need to be updated in a single file when
   government criteria change. Do not duplicate these numbers elsewhere. */

/* ── Udyam / MSME classification thresholds ──
   Source basis: government MSME classification criteria (investment in
   plant & machinery/equipment AND annual turnover — whichever is higher
   pushes the business to the higher category). Verify current figures
   on the official Udyam portal before relying on this for a filing. */
var UDYAM_THRESHOLDS = {
  lastReviewed: '2026',
  micro:  { investmentCr: 1,   turnoverCr: 5   },
  small:  { investmentCr: 10,  turnoverCr: 50  },
  medium: { investmentCr: 50,  turnoverCr: 250 }
};

function classifyUdyam(investmentLakh, turnoverLakh) {
  var invCr = parseNum(investmentLakh) / 100;
  var turnCr = parseNum(turnoverLakh) / 100;
  function fits(band) { return invCr <= band.investmentCr && turnCr <= band.turnoverCr; }
  if (fits(UDYAM_THRESHOLDS.micro)) return 'micro';
  if (fits(UDYAM_THRESHOLDS.small)) return 'small';
  if (fits(UDYAM_THRESHOLDS.medium)) return 'medium';
  return 'above-medium';
}

/* ── Business structures reference (used by Business Structure Selector) ── */
var BUSINESS_STRUCTURES = {
  proprietorship: {
    name: 'Proprietorship',
    summary: 'One owner, minimal paperwork, business and owner are legally the same person.',
    pros: ['Fastest and cheapest to start', 'Minimal ongoing compliance', 'Full control stays with one person', 'Simple income tax filing (in owner\u2019s own return)'],
    cons: ['No separation between personal and business liability', 'Harder to raise outside investment', 'Business effectively ends if the owner exits', 'Can look less credible to some large clients/banks'],
    bestFor: 'Solo founders, freelancers and small local businesses testing an idea with low risk.'
  },
  partnership: {
    name: 'Partnership',
    summary: 'Two or more owners sharing profits, responsibilities and liability under a partnership deed.',
    pros: ['Simple to set up with a partnership deed', 'Shared responsibility and capital', 'Moderate compliance compared to a company'],
    cons: ['Partners usually have unlimited personal liability', 'Disputes between partners can disrupt the business', 'Harder to raise institutional funding'],
    bestFor: 'A small group of founders who trust each other and don\u2019t need limited liability immediately.'
  },
  llp: {
    name: 'LLP (Limited Liability Partnership)',
    summary: 'A registered structure combining partnership flexibility with limited liability protection.',
    pros: ['Limited liability for partners', 'Lower compliance than a Private Limited Company', 'No mandatory audit below the prescribed turnover/contribution limits', 'Recognised, registered structure'],
    cons: ['Cannot issue equity shares, so raising VC funding is harder', 'Conversion to a company later involves extra process', 'Still needs an LLP agreement and annual filings'],
    bestFor: 'Professional services and small-to-mid businesses that want liability protection without company-level compliance.'
  },
  opc: {
    name: 'One Person Company (OPC)',
    summary: 'A single founder gets company status and limited liability without needing a co-founder.',
    pros: ['Limited liability for the sole owner', 'Separate legal entity, can look more credible', 'Full control stays with one person'],
    cons: ['Mandatory conversion to a private company once certain turnover/capital limits are crossed', 'More compliance than a proprietorship', 'Cannot directly bring in outside shareholders while remaining an OPC'],
    bestFor: 'A solo founder who wants limited liability and a company structure without a second founder.'
  },
  pvtltd: {
    name: 'Private Limited Company',
    summary: 'A separate legal entity with shareholders, suited to businesses planning to raise funding or scale.',
    pros: ['Limited liability for shareholders', 'Easiest structure to raise equity/VC funding into', 'Perceived as more credible by investors, large clients and banks', 'Ownership can be transferred via shares'],
    cons: ['Highest compliance burden of the common structures (mandatory audit, ROC filings, board processes)', 'Higher setup and annual maintenance cost', 'More disclosure requirements'],
    bestFor: 'Businesses expecting outside investment, significant growth, or multiple co-founders/employees with equity.'
  }
};

/* ── Business Licence Finder — simple rule set. Each rule fires based on the
   user's answers and suggests a registration/licence "to investigate" —
   never a final legal determination (see disclaimer on the tool page). ── */
var LICENCE_RULES = [
  { id: 'gst', label: 'GST Registration', category: 'Tax', when: function (a) { return a.turnoverBand !== 'under20l' || a.interstate === 'yes' || a.ecommerce === 'yes'; }, note: 'Likely relevant once turnover crosses the applicable threshold, or immediately if you sell inter-state or through e-commerce.' },
  { id: 'tradeLicence', label: 'Trade Licence (Municipal Corporation / Panchayat)', category: 'Local', when: function (a) { return a.physicalShop === 'yes'; }, note: 'Generally required for any physical shop, office or establishment operating in a municipal area.' },
  { id: 'shopEstablishment', label: 'Shop & Establishment Registration', category: 'Local', when: function (a) { return a.physicalShop === 'yes' || (a.employees && a.employees !== '0'); }, note: 'Commonly required once you have a place of business or employ staff.' },
  { id: 'udyam', label: 'Udyam (MSME) Registration', category: 'MSME', when: function () { return true; }, note: 'Free government registration — worth checking eligibility for almost every small/growing business, for scheme and lending benefits.' },
  { id: 'fssai', label: 'FSSAI Registration/Licence', category: 'Food', when: function (a) { return a.foodBusiness === 'yes'; }, note: 'Mandatory for any business that manufactures, stores, transports, distributes or sells food, including home kitchens.' },
  { id: 'iec', label: 'Import Export Code (IEC)', category: 'Trade', when: function (a) { return a.importExport === 'yes'; }, note: 'Required to legally import or export goods/services from India.' },
  { id: 'professionalTax', label: 'Professional Tax Registration', category: 'Tax', when: function (a) { return a.employees && a.employees !== '0'; }, note: 'Applicable in most states (including West Bengal) once you have employees or are a practising professional.' },
  { id: 'factoryLicence', label: 'Factory Licence', category: 'Manufacturing', when: function (a) { return a.manufacturing === 'yes'; }, note: 'Typically required for manufacturing units above certain worker/power-usage thresholds under the Factories Act.' },
  { id: 'pollutionNoc', label: 'Pollution Control Board NOC/Consent', category: 'Manufacturing', when: function (a) { return a.manufacturing === 'yes'; }, note: 'Often required for manufacturing or processing units, depending on the nature and scale of operations.' },
  { id: 'legalMetrology', label: 'Legal Metrology (Weights & Measures) Registration', category: 'Retail', when: function (a) { return a.physicalShop === 'yes' && a.businessType === 'trading'; }, note: 'Relevant for businesses that sell packaged goods or use weighing/measuring equipment.' },
  { id: 'onlineTerms', label: 'Website Terms, Privacy Policy & Return Policy', category: 'Online', when: function (a) { return a.onlineBusiness === 'yes'; }, note: 'Expected under Consumer Protection (E-Commerce) Rules for anyone selling online.' },
  { id: 'gumasta', label: 'Gumasta / Local Municipal Trade Permission', category: 'Local', when: function (a) { return a.physicalShop === 'yes'; }, note: 'Some states use a specific local name for the shop/establishment permission — confirm the exact requirement for your city.' }
];

/* ── FSSAI eligibility bands (very approximate, general-guidance only) ── */
var FSSAI_BANDS = [
  { id: 'registration', label: 'Basic FSSAI Registration', turnoverMax: 12, note: 'Typically for very small food businesses/home kitchens with annual turnover up to about ₹12 lakh.' },
  { id: 'stateLicence', label: 'State FSSAI Licence', turnoverMax: 2000, note: 'Typically for mid-sized food businesses with annual turnover roughly between ₹12 lakh and ₹20 crore, or certain production capacities.' },
  { id: 'centralLicence', label: 'Central FSSAI Licence', turnoverMax: Infinity, note: 'Typically for large manufacturers, importers/exporters, or businesses operating across multiple states, or above the state-licence turnover band.' }
];
