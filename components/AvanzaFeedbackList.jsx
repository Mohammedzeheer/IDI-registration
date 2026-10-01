'use client';
import { useCallback, useEffect, useState } from 'react';
import { Star, RefreshCw, Download } from 'lucide-react';

const Stars = ({ rating, size = 14 }) => (
  <span className="flex gap-0.5" aria-label={`${rating} of 5`}>
    {[1, 2, 3, 4, 5].map(n => (
      <Star key={n} size={size} className={n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
    ))}
  </span>
);

const csvCell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;

export default function AvanzaFeedbackList() {
  const [data, setData] = useState({ stats: { total: 0, average: 0, distribution: {} }, feedbacks: [] });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/avanza/feedback', { credentials: 'include' });
      const json = await res.json();
      if (json.success) setData(json);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const exportCSV = () => {
    const header = ['Pass ID', 'Name', 'Designation', 'Sector', 'Unit', 'Rating', 'Comment', 'Submitted'];
    const rows = data.feedbacks.map(f => [
      f.passId, f.name, f.designation, f.sector, f.unit, f.rating, f.comment, new Date(f.createdAt).toLocaleString()
    ]);
    const csv = [header, ...rows].map(r => r.map(csvCell).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = 'avanza-feedback.csv';
    link.click();
  };

  const { total, average, distribution } = data.stats;

  return (
    <main className="flex flex-1 flex-col gap-3 bg-gray-50 p-4 text-gray-900">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold">{average.toFixed(1)}</p>
            <Stars rating={Math.round(average)} />
            <p className="mt-1 text-xs text-gray-500">{total} responses</p>
          </div>
          <div className="flex flex-1 flex-col gap-1">
            {[5, 4, 3, 2, 1].map(n => {
              const count = distribution[n] || 0;
              return (
                <div key={n} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-gray-600">{n}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-yellow-400" style={{ width: `${total ? (count / total) * 100 : 0}%` }} />
                  </div>
                  <span className="w-6 text-right text-gray-500">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={exportCSV}
          disabled={!total}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1f4fd1] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Download size={16} /> Export CSV
        </button>
        <button onClick={load} aria-label="Refresh" className="rounded-xl border border-gray-300 bg-white px-3">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {data.feedbacks.map(f => (
          <li key={f.passId} className="rounded-xl bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{f.name || f.passId}</p>
                <p className="truncate text-xs text-gray-500">
                  {f.designation} · {f.sector ? `${f.sector} · ` : ''}{f.unit} · {f.passId}
                </p>
              </div>
              <Stars rating={f.rating} />
            </div>
            {f.comment && <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{f.comment}</p>}
          </li>
        ))}
        {!loading && total === 0 && <li className="py-8 text-center text-sm text-gray-500">No feedback yet</li>}
      </ul>
    </main>
  );
}
