interface ActionBarProps {
  onExportCsv: () => void;
  onCopyManagerSummary: () => void;
  onPrintPlan: () => void;
  statusMessage: string;
}

export function ActionBar({
  onExportCsv,
  onCopyManagerSummary,
  onPrintPlan,
  statusMessage
}: ActionBarProps) {
  return (
    <section className="panel action-panel" aria-labelledby="action-panel-heading">
      <div className="action-head">
        <div>
          <p className="eyebrow">Action Deck</p>
          <h3 id="action-panel-heading">Export and Share</h3>
        </div>

        <div className="shortcut-row" aria-label="Keyboard shortcuts">
          <span>
            <kbd>/</kbd> focus planner
          </span>
          <span>
            <kbd>g</kbd> jump calendar
          </span>
          <span>
            <kbd>e</kbd> export csv
          </span>
          <span>
            <kbd>m</kbd> copy summary
          </span>
          <span>
            <kbd>?</kbd> onboarding
          </span>
        </div>
      </div>

      <div className="action-buttons">
        <button type="button" className="action-btn primary" onClick={onExportCsv}>
          Export PTO CSV
        </button>
        <button type="button" className="action-btn" onClick={onCopyManagerSummary}>
          Copy Manager Summary
        </button>
        <button type="button" className="action-btn" onClick={onPrintPlan}>
          Print Plan
        </button>
      </div>

      <p className="action-status" aria-live="polite">
        {statusMessage}
      </p>
    </section>
  );
}
