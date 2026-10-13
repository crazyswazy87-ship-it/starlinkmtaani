export interface Chapter {
  /** Small uppercase label, e.g. "Scene 01 — Ascent" */
  eyebrow: string;
  /** Main line. Wrap the muted half in <em> for the two-weight treatment. */
  line: string;
}

export const chapters: Chapter[] = [
  {
    eyebrow: "Scene 01 — Ascent",
    line: "Somewhere above the treeline,<br /><em>the day forgets its edges.</em>",
  },
  {
    eyebrow: "Scene 02 — Threshold",
    line: "A ring of steel holds its breath<br /><em>in the mist.</em>",
  },
  {
    eyebrow: "Scene 03 — Hold",
    line: "Every frame is exactly<br /><em>where you leave it.</em>",
  },
  {
    eyebrow: "Scene 04 — Vantage",
    line: "This is the view from<br /><em>as far as the fog allows.</em>",
  },
];
