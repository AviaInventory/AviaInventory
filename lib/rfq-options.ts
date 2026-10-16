// Choices shared by the RFQ create and edit forms.

/** Release / certification paperwork a buyer can ask for. "Not required" keeps urgent requests moving. */
export const RFQ_CERTIFICATION_OPTIONS = [
  "Not required",
  "FAA 8130-3",
  "EASA Form 1",
  "Dual release (FAA 8130-3 + EASA Form 1)",
  "Certificate of Conformity (CoC)",
  "OEM Certificate of Conformity",
  "Any valid airworthiness release",
] as const;
