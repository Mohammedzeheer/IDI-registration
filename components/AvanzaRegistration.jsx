'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import { Calendar, MapPin, Download, LogOut, CheckCircle } from 'lucide-react';
import { DESIGNATIONS, SECTORS } from '../data/avanza';
import fontImage from '../public/fontssf.png';

const STORAGE_KEY = 'avanzaPass';

const postJSON = async (url, body) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
};

const inputClass =
  'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20';

export default function AvanzaRegistration() {
  const [tab, setTab] = useState('register');
  const [loading, setLoading] = useState(false);
  const [delegate, setDelegate] = useState(null);
  const [qrUrl, setQrUrl] = useState('');
  const [form, setForm] = useState({ name: '', sector: '', unit: '', designation: '', phone: '' });
  const [findPhone, setFindPhone] = useState('');
  const passRef = useRef(null);

  // Restore a saved pass on this device
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setDelegate(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    if (!delegate?.passId) return;
    QRCode.toDataURL(delegate.passId, { width: 480, margin: 1, color: { dark: '#0f2a8a' } })
      .then(setQrUrl)
      .catch(() => setQrUrl(''));
  }, [delegate]);

  const savePass = d => {
    setDelegate(d);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
  };

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleRegister = async e => {
    e.preventDefault();
    if (!form.designation) return toast.error('Select your designation');
    setLoading(true);
    try {
      const data = await postJSON('/api/avanza/register', form);
      savePass(data.delegate);
      toast.success('Registered! Show this pass at the venue.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFind = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await postJSON('/api/avanza/pass', { phone: findPhone });
      savePass(data.delegate);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPass = async () => {
    if (!passRef.current) return;
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(passRef.current, { scale: 2, backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    link.download = `Avanza-${delegate.passId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const signOut = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setDelegate(null);
    setQrUrl('');
    setForm({ name: '', sector: '', unit: '', designation: '', phone: '' });
  };

  return (
    <div className="min-h-screen bg-[#eef2fb]">
      <div className="mx-auto w-full max-w-md px-4 pb-10 pt-4">
        {/* Poster */}
        <div className="overflow-hidden rounded-2xl shadow-lg">
          <Image
            src="/avanza-poster.jpg"
            alt="Avanza – The Leaders Camp, 1 Oct 2026, Malhar Hifz Quran, Durgipalla"
            width={1024}
            height={1280}
            priority
            className="h-auto w-full"
          />
        </div>

        <div className="mt-4 flex flex-col gap-2 rounded-2xl bg-white p-4 text-sm text-gray-700 shadow-sm">
          <p className="flex items-center gap-2">
            <Calendar size={16} className="shrink-0 text-blue-700" />
            Thursday, 01 Oct 2026 · 4:30 PM
          </p>
          <p className="flex items-center gap-2">
            <MapPin size={16} className="shrink-0 text-blue-700" />
            Malhar Hifz Quran, Durgipalla
          </p>
        </div>

        {delegate ? (
          <section className="mt-5">
            <div ref={passRef} className="overflow-hidden rounded-2xl bg-white shadow-lg">
              <div className="bg-[#1f4fd1] px-5 py-4 text-white">
                <p className="text-xs uppercase tracking-widest opacity-80">SSF Manjeshwar Division</p>
                <h2 className="text-2xl font-extrabold lowercase tracking-tight">avanza</h2>
                <p className="text-sm">The Leaders Camp · Entry Pass</p>
              </div>
              <div className="flex flex-col items-center px-5 py-5">
                {qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrUrl} alt={`QR code for ${delegate.passId}`} className="h-56 w-56" />
                ) : (
                  <div className="h-56 w-56 animate-pulse rounded-lg bg-gray-100" />
                )}
                <p className="mt-2 font-mono text-2xl font-bold tracking-widest text-[#1f4fd1]">
                  {delegate.passId}
                </p>
                <dl className="mt-4 w-full divide-y divide-gray-100 text-sm">
                  {[
                    ['Name', delegate.name],
                    ['Sector', delegate.sector],
                    ['Unit', delegate.unit],
                    ['Designation', delegate.designation],
                    ['Mobile', delegate.phone]
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 py-2">
                      <dt className="text-gray-500">{k}</dt>
                      <dd className="text-right font-semibold text-gray-900">{v}</dd>
                    </div>
                  ))}
                </dl>
                {delegate.checkedIn && (
                  <p className="mt-3 flex items-center gap-1 text-sm font-semibold text-green-700">
                    <CheckCircle size={16} /> Checked in
                  </p>
                )}
              </div>
            </div>

            <p className="mt-3 text-center text-sm text-gray-600">
              Show this QR code at the entrance for check-in.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={downloadPass}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#1f4fd1] py-3 font-semibold text-white active:scale-[0.98]"
              >
                <Download size={18} /> Save pass
              </button>
              <button
                onClick={signOut}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-3 font-semibold text-gray-700 active:scale-[0.98]"
              >
                <LogOut size={18} /> New entry
              </button>
            </div>
          </section>
        ) : (
          <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-5 grid grid-cols-2 rounded-xl bg-gray-100 p-1 text-sm font-semibold">
              {[['register', 'Register'], ['find', 'Find my pass']].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`rounded-lg py-2.5 transition ${tab === key ? 'bg-white text-[#1f4fd1] shadow' : 'text-gray-500'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'register' ? (
              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-gray-700">Name</span>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    autoComplete="name"
                    placeholder="Your full name"
                    className={inputClass}
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-gray-700">Sector</span>
                  <select
                    name="sector"
                    value={form.sector}
                    onChange={handleChange}
                    required
                    className={`${inputClass} ${form.sector ? '' : 'text-gray-400'}`}
                  >
                    <option value="" disabled>Select your sector</option>
                    {SECTORS.map(s => (
                      <option key={s} value={s} className="text-gray-900">{s}</option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-gray-700">Unit</span>
                  <input
                    name="unit"
                    value={form.unit}
                    onChange={handleChange}
                    required
                    placeholder="Your unit"
                    className={inputClass}
                  />
                </label>

                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-1.5 text-sm font-medium text-gray-700">Designation</legend>
                  {DESIGNATIONS.map(d => (
                    <label
                      key={d}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-base transition ${
                        form.designation === d
                          ? 'border-[#1f4fd1] bg-blue-50 text-[#1f4fd1]'
                          : 'border-gray-300 text-gray-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="designation"
                        value={d}
                        checked={form.designation === d}
                        onChange={handleChange}
                        className="h-4 w-4 accent-[#1f4fd1]"
                      />
                      {d}
                    </label>
                  ))}
                </fieldset>

                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-gray-700">Mobile number</span>
                  <input
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
                    required
                    autoComplete="tel-national"
                    placeholder="10-digit mobile"
                    className={inputClass}
                  />
                  <span className="text-xs text-gray-500">Used to find your pass again.</span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 rounded-xl bg-[#1f4fd1] py-3.5 text-base font-bold text-white disabled:opacity-60 active:scale-[0.98]"
                >
                  {loading ? 'Registering…' : 'Register'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleFind} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-gray-700">Registered mobile number</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    value={findPhone}
                    onChange={e => setFindPhone(e.target.value.replace(/\D/g, ''))}
                    required
                    placeholder="10-digit mobile"
                    className={inputClass}
                  />
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-[#1f4fd1] py-3.5 text-base font-bold text-white disabled:opacity-60 active:scale-[0.98]"
                >
                  {loading ? 'Searching…' : 'Show my pass'}
                </button>
              </form>
            )}
          </section>
        )}

        <div className="mt-8 flex items-center justify-center gap-1.5">
          <Image src={fontImage} alt="SSF" className="h-auto w-10 shrink-0" />
          <span className="whitespace-nowrap text-sm font-bold text-gray-700">Manjeshwar Division</span>
        </div>
      </div>
    </div>
  );
}
