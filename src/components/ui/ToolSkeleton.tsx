/**
 * What a tool page shows in the file picker's place while the tool's code downloads: the same
 * dashed box the real picker draws, with two pulsing bars, so the page does not jump when the
 * tool appears. `src/pages/[tool].astro` renders identical markup as the server-side fallback
 * of the island, so there is no blank gap before React starts and no change when it takes over.
 * Keep the two in step. The text is for screen readers; the bars are CSS pseudo-elements, which
 * keeps this markup (repeated in every tool page's HTML) as small as it can be.
 */
export function ToolSkeleton({ label }: { label: string }) {
  return (
    <div className="dropzone tool-skeleton" role="status" aria-busy="true">
      <span className="visually-hidden">{label}</span>
    </div>
  );
}
