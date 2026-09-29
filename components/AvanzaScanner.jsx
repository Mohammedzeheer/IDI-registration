'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Camera, CameraOff, CheckCircle, AlertTriangle, XCircle, Search, RefreshCw, LogOut, LayoutDashboard } from 'lucide-react';

const RESULT_STYLES = {
  ok: { bg: 'bg-green-600', Icon: CheckCircle, title: 'Checked in' },
  duplicate: { bg: 'bg-amber-500', Icon: AlertTriangle, title: 'Already checked in' },
  invalid: { bg: 'bg-red-600', Icon: XCircle, title: 'Invalid pass' }
};

const formatTime = d => (d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');

export default function AvanzaScanner(){
  const [tab, setTab] = useState('scan');
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [result, setResult] = useState(null);
  const [manual, setManual] = useState('');
  const [data, setData] = useState({ stats: { total: 0, checkedIn: 0, pending: 0 }, delegates: [] });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const busyRef = useRef(false);
  const lastRef = useRef({ code: '', at: 0 });

  const loadList = useCallback(async () => {
    try {
      const res = await fetch('/api/avanza/checkin', { credentials: 'include' });
      const json = await res.json();
      if (json.success) setData(json);
    } catch {}
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  const checkIn = useCallback(async code => {
    busyRef.current = true;
    try {
      const res = await fetch('/api/avanza/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code })
      });
      const json = await res.json();
      const status = json.status || (res.ok ? 'ok' : 'invalid');
      setResult({ status, message: json.message, delegate: json.delegate, code });
      if (navigator.vibrate) navigator.vibrate(status === 'ok' ? 120 : [80, 60, 80]);
      if (status === 'ok') loadList();
    } catch {
      setResult({ status: 'invalid', message: 'Network error – try again', code });
    } finally {
      // short cooldown so the same QR isn't read repeatedly
      setTimeout(() => { busyRef.current = false; }, 1500);
    }
  }, [loadList]);

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setCameraOn(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError('');
    try {
      const reader = new BrowserQRCodeReader();
      controlsRef.current = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' } } },
        videoRef.current,
        res => {
          if (!res || busyRef.current) return;
          const code = res.getText().trim();
          const now = Date.now();
          if (code === lastRef.current.code && now - lastRef.current.at < 5000) return;
          lastRef.current = { code, at: now };
          checkIn(code);
        }
      );
      setCameraOn(true);
    } catch (err) {
      setCameraError(
        err?.name === 'NotAllowedError'
          ? 'Camera permission denied. Allow camera access in your browser settings.'
          : 'Could not start camera. Camera needs HTTPS (or localhost).'
      );
      setCameraOn(false);
    }
  }, [checkIn]);

  // Stop camera when leaving the scan tab or the page
  useEffect(() => {
    if (tab !== 'scan') stopCamera();
  }, [tab, stopCamera]);
  useEffect(() => () => controlsRef.current?.stop(), []);

  const handleManual = e => {
    e.preventDefault();
    if (!manual.trim()) return;
    checkIn(manual.trim());
    setManual('');
  };

  const logout = async () => {
    stopCamera();
    await fetch('/api/admin/login', { method: 'DELETE' });
    localStorage.removeItem('admin_user');
    window.location.href = '/admin/login';
  };

  const q = search.trim().toLowerCase();
  const list = data.delegates.filter(d =>
    (filter === 'all' || (filter === 'in' ? d.checkedIn : !d.checkedIn)) &&
    (!q || [d.name, d.sector, d.unit, d.passId, d.phone, d.designation].some(v => v?.toLowerCase().includes(q)))
  );

  const style = result && RESULT_STYLES[result.status];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-[#1f4fd1] px-4 pb-3 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-widest opacity-80">Avanza · Check-in</p>
              <p className="text-lg font-bold">
                {data.stats.checkedIn} <span className="font-normal opacity-80">/ {data.stats.total} arrived</span>
              </p>
            </div>
            <div className="flex gap-1">
              <a href="/admin/dashboard" aria-label="Dashboard" className="rounded-lg p-2 hover:bg-white/10">
                <LayoutDashboard size={20} />
              </a>
              <button onClick={logout} aria-label="Log out" className="rounded-lg p-2 hover:bg-white/10">
                <LogOut size={20} />
              </button>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 rounded-xl bg-white/15 p-1 text-sm font-semibold">
            {[['scan', 'Scanner'], ['list', 'Delegates']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setTab(key); if (key === 'list') loadList(); }}
                className={`rounded-lg py-2 ${tab === key ? 'bg-white text-[#1f4fd1]' : 'text-white'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        {tab === 'scan' ? (
          <main className="flex flex-1 flex-col gap-4 p-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black">
              <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
              {cameraOn ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-2/3 w-2/3 rounded-2xl border-4 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <Camera size={48} className="opacity-60" />
                  {cameraError && <p className="text-sm text-red-300">{cameraError}</p>}
                  <button
                    onClick={startCamera}
                    className="rounded-xl bg-[#1f4fd1] px-6 py-3 font-semibold active:scale-[0.98]"
                  >
                    Start camera
                  </button>
                </div>
              )}

              {/* Result overlay */}
              {style && (
                <button
                  onClick={() => setResult(null)}
                  className={`absolute inset-x-0 bottom-0 ${style.bg} px-4 py-4 text-left`}
                >
                  <div className="flex items-start gap-3">
                    <style.Icon size={32} className="shrink-0" />
                    <div className="min-w-0">
                      <p className="text-lg font-bold leading-tight">{style.title}</p>
                      {result.delegate ? (
                        <>
                          <p className="truncate text-base font-semibold">{result.delegate.name}</p>
                          <p className="text-sm opacity-90">
                            {result.delegate.designation} · {result.delegate.sector ? `${result.delegate.sector} · ` : ''}{result.delegate.unit}
                          </p>
                          <p className="text-xs opacity-80">
                            {result.delegate.passId}
                            {result.status === 'duplicate' && ` · at ${formatTime(result.delegate.checkedInAt)}`}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm opacity-90">{result.message} ({result.code})</p>
                      )}
                    </div>
                  </div>
                </button>
              )}
            </div>

            {cameraOn && (
              <button
                onClick={stopCamera}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/20 py-3 text-sm font-semibold"
              >
                <CameraOff size={18} /> Stop camera
              </button>
            )}

            <form onSubmit={handleManual} className="flex gap-2">
              <input
                value={manual}
                onChange={e => setManual(e.target.value)}
                placeholder="Pass ID (AVZ1234) or mobile"
                autoCapitalize="characters"
                className="min-w-0 flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-base placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#4f7bff]"
              />
              <button type="submit" className="rounded-xl bg-white px-4 font-semibold text-[#1f4fd1]">
                Check in
              </button>
            </form>
          </main>
        ) : (
          <main className="flex flex-1 flex-col gap-3 bg-gray-50 p-4 text-gray-900">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[['Total', data.stats.total, 'text-gray-900'], ['Arrived', data.stats.checkedIn, 'text-green-700'], ['Pending', data.stats.pending, 'text-amber-600']].map(([k, v, c]) => (
                <div key={k} className="rounded-xl bg-white p-3 shadow-sm">
                  <p className={`text-2xl font-bold ${c}`}>{v}</p>
                  <p className="text-xs text-gray-500">{k}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search name, sector, unit, pass…"
                  className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                />
              </div>
              <button onClick={loadList} aria-label="Refresh" className="rounded-xl border border-gray-300 bg-white px-3">
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="flex gap-2 text-sm">
              {[['all', 'All'], ['in', 'Arrived'], ['pending', 'Pending']].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`rounded-full px-3 py-1.5 font-medium ${filter === key ? 'bg-[#1f4fd1] text-white' : 'bg-white text-gray-600 shadow-sm'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <ul className="flex flex-col gap-2">
              {list.map(d => (
                <li key={d.passId} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{d.name}</p>
                    <p className="truncate text-xs text-gray-500">
                      {d.designation} · {d.sector ? `${d.sector} · ` : ''}{d.unit} · {d.passId}
                    </p>
                  </div>
                  {d.checkedIn ? (
                    <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                      {formatTime(d.checkedInAt)}
                    </span>
                  ) : (
                    <button
                      onClick={() => checkIn(d.passId).then(() => setTab('scan'))}
                      className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700"
                    >
                      Check in
                    </button>
                  )}
                </li>
              ))}
              {list.length === 0 && <li className="py-8 text-center text-sm text-gray-500">No delegates found</li>}
            </ul>
          </main>
        )}
      </div>
    </div>
  );
}
