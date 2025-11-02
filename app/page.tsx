"use client";

import React, { useEffect, useMemo, useState } from "react";
import { computeEvalRun, parseDatasetText, type EvalRun, type RawItem } from "../lib/metrics";
import { SimpleBarChart } from "../components/SimpleBarChart";
import { Tabs } from "../components/Tabs";

export default function Page() {
  const [runs, setRuns] = useState<EvalRun[]>([]);
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  useEffect(() => {
    const saved = localStorage.getItem("evalRuns");
    if (saved) setRuns(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("evalRuns", JSON.stringify(runs));
  }, [runs]);

  const aggregates = useMemo(() => {
    if (runs.length === 0) return null;
    const keys = ["exact", "f1", "jaccard", "rougeL"] as const;
    const avg: Record<typeof keys[number], number> = { exact: 0, f1: 0, jaccard: 0, rougeL: 0 };
    for (const run of runs) {
      for (const k of keys) avg[k] += run.aggregate[k];
    }
    for (const k of keys) avg[k] = avg[k] / runs.length;
    return avg;
  }, [runs]);

  return (
    <div className="stack-lg">
      <Tabs
        tabs={[
          { id: "dashboard", label: "Dashboard" },
          { id: "new", label: "New Evaluation" },
          { id: "runs", label: "All Runs" }
        ]}
        activeId={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "dashboard" && (
        <section className="stack-lg">
          <div className="grid-4">
            <MetricCard title="Avg Exact" value={pct(aggregates?.exact)} />
            <MetricCard title="Avg F1" value={pct(aggregates?.f1)} />
            <MetricCard title="Avg Jaccard" value={pct(aggregates?.jaccard)} />
            <MetricCard title="Avg ROUGE-L" value={pct(aggregates?.rougeL)} />
          </div>
          <div className="card">
            <h3>Recent Runs</h3>
            {runs.length === 0 ? (
              <p>No runs yet. Create one in the New Evaluation tab.</p>
            ) : (
              <div className="runs">
                {runs.slice(0, 5).map((run) => (
                  <RunRow key={run.id} run={run} onDelete={() => deleteRun(run.id, setRuns)} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === "new" && (
        <NewEval onCreate={(run) => setRuns((r) => [run, ...r])} />
      )}

      {activeTab === "runs" && (
        <section className="card">
          <h3>All Runs</h3>
          {runs.length === 0 ? (
            <p>No runs yet.</p>
          ) : (
            <div className="runs">
              {runs.map((run) => (
                <RunRow key={run.id} run={run} onDelete={() => deleteRun(run.id, setRuns)} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function deleteRun(id: string, setRuns: React.Dispatch<React.SetStateAction<EvalRun[]>>) {
  setRuns((r) => r.filter((x) => x.id !== id));
}

function pct(v?: number | null) {
  if (v == null) return "?";
  return `${(v * 100).toFixed(1)}%`;
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="card metric">
      <div className="metric-title">{title}</div>
      <div className="metric-value">{value}</div>
    </div>
  );
}

function RunRow({ run, onDelete }: { run: EvalRun; onDelete: () => void }) {
  return (
    <div className="run-row">
      <div className="run-main">
        <div className="run-title">{run.name}</div>
        <div className="run-sub">{new Date(run.createdAt).toLocaleString()} ? {run.items.length} items</div>
      </div>
      <div className="run-metrics">
        <SmallMetric label="Exact" value={run.aggregate.exact} color="#6366f1" />
        <SmallMetric label="F1" value={run.aggregate.f1} color="#10b981" />
        <SmallMetric label="Jaccard" value={run.aggregate.jaccard} color="#f59e0b" />
        <SmallMetric label="ROUGE-L" value={run.aggregate.rougeL} color="#ef4444" />
      </div>
      <div className="run-chart">
        <SimpleBarChart
          color="#6366f1"
          values={run.items.slice(0, 20).map((i) => i.scores.f1)}
          height={32}
        />
      </div>
      <div className="run-actions">
        <a className="btn" href={`/#run-${run.id}`}>Open</a>
        <button className="btn btn-danger" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}

function SmallMetric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="small-metric">
      <div className="small-metric-label">{label}</div>
      <div className="small-metric-bar">
        <div className="small-metric-fill" style={{ width: `${Math.round(value * 100)}%`, background: color }} />
      </div>
      <div className="small-metric-value">{(value * 100).toFixed(0)}%</div>
    </div>
  );
}

function NewEval({ onCreate }: { onCreate: (run: EvalRun) => void }) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    setError(null);
    setBusy(true);
    try {
      const items: RawItem[] = parseDatasetText(text);
      if (items.length === 0) throw new Error("No items parsed");
      const run = computeEvalRun(name.trim() || `Run ${new Date().toLocaleString()}`, items);
      onCreate(run);
      setName("");
      setText("");
    } catch (e: any) {
      setError(e?.message || "Failed to create evaluation");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card stack-md">
      <h3>New Evaluation</h3>
      <p>Paste JSON or CSV with headers: question, reference, response.</p>
      <div className="field">
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="E.g. GPT-4 vs baseline" />
      </div>
      <div className="field">
        <label>Dataset</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder='[\n  { "question": "What is 2+2?", "reference": "4", "response": "4" }\n]' rows={12} />
      </div>
      {error && <div className="error">{error}</div>}
      <div>
        <button className="btn" onClick={handleCreate} disabled={busy}>Evaluate</button>
      </div>
    </section>
  );
}
