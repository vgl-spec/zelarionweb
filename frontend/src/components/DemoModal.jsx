import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Check, ArrowUpRight, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

const DemoContext = createContext({ openDemo: () => {} });
export const useDemo = () => useContext(DemoContext);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const TEAM_SIZES = ['1–10', '11–50', '51–200', '201–500', '500+'];

const EASE = [0.16, 1, 0.3, 1];

export function DemoProvider({ children }) {
  const [open, setOpen] = useState(false);
  const openDemo = useCallback(() => setOpen(true), []);
  const closeDemo = useCallback(() => setOpen(false), []);

  return (
    <DemoContext.Provider value={{ openDemo }}>
      {children}
      <DemoModal open={open} onClose={closeDemo} />
    </DemoContext.Provider>
  );
}

function DemoModal({ open, onClose }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    team_size: '11–50',
    preferred_date: '',
    message: '',
  });
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const reset = () => {
    setStatus('idle');
    setError('');
    setForm({ name: '', email: '', company: '', team_size: '11–50', preferred_date: '', message: '' });
  };

  const handleClose = () => {
    onClose();
    // small delay so the success/reset isn't seen during exit
    setTimeout(reset, 300);
  };

  const submit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      const res = await fetch(`${API}/demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Request failed');
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          data-testid="demo-modal"
        >
          <div
            className="absolute inset-0 bg-ink/80 backdrop-blur-md"
            onClick={handleClose}
            data-testid="demo-modal-overlay"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Book a demo"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-surface p-7 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] sm:p-9"
          >
            <button
              onClick={handleClose}
              className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full border border-line text-text-dim transition-colors duration-300 hover:border-white/20 hover:text-text"
              aria-label="Close"
              data-testid="demo-modal-close"
            >
              <X size={18} />
            </button>

            {status !== 'done' ? (
              <>
                <p className="text-[12px] font-medium uppercase tracking-[0.2em] text-text-dim">
                  Book a demo
                </p>
                <h3 className="mt-3 font-display text-2xl font-bold tracking-tightest text-text">
                  See a live run in 90 seconds.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-dim">
                  Tell us where to reach you. We confirm your slot within one business day.
                </p>

                <form onSubmit={submit} className="mt-7 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Full name" required>
                      <input
                        required
                        value={form.name}
                        onChange={set('name')}
                        className={inputCls}
                        placeholder="Ada Lovelace"
                        data-testid="demo-input-name"
                      />
                    </Field>
                    <Field label="Work email" required>
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={set('email')}
                        className={inputCls}
                        placeholder="ada@company.com"
                        data-testid="demo-input-email"
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Company" required>
                      <input
                        required
                        value={form.company}
                        onChange={set('company')}
                        className={inputCls}
                        placeholder="Company"
                        data-testid="demo-input-company"
                      />
                    </Field>
                    <Field label="Team size">
                      <select
                        value={form.team_size}
                        onChange={set('team_size')}
                        className={inputCls}
                        data-testid="demo-input-team-size"
                      >
                        {TEAM_SIZES.map((s) => (
                          <option key={s} value={s} className="bg-surface">
                            {s} engineers
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field label="Preferred date">
                    <input
                      type="date"
                      value={form.preferred_date}
                      onChange={set('preferred_date')}
                      className={`${inputCls} [color-scheme:dark]`}
                      data-testid="demo-input-date"
                    />
                  </Field>

                  <Field label="Anything we should know?">
                    <textarea
                      rows={3}
                      value={form.message}
                      onChange={set('message')}
                      className={`${inputCls} resize-none`}
                      placeholder="Your stack, test suite size, timeline…"
                      data-testid="demo-input-message"
                    />
                  </Field>

                  {status === 'error' && (
                    <p className="text-sm text-red-400" data-testid="demo-error">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    variant="solid"
                    size="lg"
                    className="w-full"
                    disabled={status === 'loading'}
                    data-testid="demo-submit"
                  >
                    {status === 'loading' ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Sending
                      </>
                    ) : (
                      <>
                        Request my slot
                        <ArrowUpRight size={18} strokeWidth={2.2} />
                      </>
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <div className="py-6 text-center" data-testid="demo-success">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-aurora-teal/40 bg-aurora-teal/10 text-aurora-teal">
                  <Check size={26} strokeWidth={2.4} />
                </div>
                <h3 className="mt-6 font-display text-2xl font-bold tracking-tightest text-text">
                  Request received.
                </h3>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-text-dim">
                  Thanks, {form.name.split(' ')[0] || 'there'}. We'll confirm your slot at{' '}
                  <span className="text-text">{form.email}</span> within one business day.
                </p>
                <Button
                  variant="outline"
                  size="md"
                  className="mt-7"
                  onClick={handleClose}
                  data-testid="demo-done-close"
                >
                  Done
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const inputCls =
  'w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-text placeholder:text-text-dim/60 outline-none transition-[border-color,box-shadow] duration-300 focus:border-aurora-cyan/50 focus:shadow-[0_0_0_3px_rgba(6,182,212,0.12)]';

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] text-text-dim">
        {label}
        {required && <span className="text-aurora-teal"> *</span>}
      </span>
      {children}
    </label>
  );
}
