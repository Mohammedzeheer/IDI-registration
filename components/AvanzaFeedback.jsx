'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Star, MessageSquare, CheckCircle } from 'lucide-react';

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

export default function AvanzaFeedback({ delegate }) {
  const storageKey = `avanzaFeedback:${delegate.passId}`;
  const [submitted, setSubmitted] = useState(false);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  // Remembered on this device; confirmed with the server in case it was sent from another device
  useEffect(() => {
    try { if (localStorage.getItem(storageKey)) setSubmitted(true); } catch {}
    fetch('/api/avanza/feedback/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passId: delegate.passId, phone: delegate.phone })
    })
      .then(res => res.json())
      .then(data => { if (data.submitted) markSubmitted(); })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delegate.passId]);

  const markSubmitted = () => {
    setSubmitted(true);
    setOpen(false);
    try { localStorage.setItem(storageKey, '1'); } catch {}
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!rating) return toast.error('Tap a star to rate the camp');
    setLoading(true);
    try {
      const res = await fetch('/api/avanza/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passId: delegate.passId, phone: delegate.phone, rating, comment })
      });
      const data = await res.json();
      if (res.ok || res.status === 409) {
        markSubmitted();
        toast.success(data.message);
      } else {
        toast.error(data.message || 'Something went wrong');
      }
    } catch {
      toast.error('Network error – try again');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-4 text-sm shadow-sm">
        <CheckCircle size={20} className="shrink-0 text-green-600" />
        <p className="text-gray-700">Thanks for your feedback on Avanza!</p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#1f4fd1] bg-white py-3 font-semibold text-[#1f4fd1] active:scale-[0.98]"
      >
        <MessageSquare size={18} /> Give feedback
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Your feedback</h3>
        <p className="text-sm text-gray-500">How was Avanza – The Leaders Camp?</p>
      </div>

      <div className="flex flex-col items-center gap-1">
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              onClick={() => setRating(n)}
              className="p-1 active:scale-90"
            >
              <Star
                size={36}
                className={n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
              />
            </button>
          ))}
        </div>
        <p className="h-5 text-sm font-semibold text-[#1f4fd1]">{RATING_LABELS[rating]}</p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-gray-700">Comments (optional)</span>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value.slice(0, 500))}
          rows={4}
          placeholder="What did you like? What can we improve?"
          className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
        />
        <span className="text-right text-xs text-gray-400">{comment.length}/500</span>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-gray-300 bg-white py-3 font-semibold text-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[#1f4fd1] py-3 font-bold text-white disabled:opacity-60 active:scale-[0.98]"
        >
          {loading ? 'Sending…' : 'Submit'}
        </button>
      </div>
    </form>
  );
}
