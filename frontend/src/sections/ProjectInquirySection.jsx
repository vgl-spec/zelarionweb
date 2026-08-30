import React, { lazy, Suspense, useId, useMemo, useRef, useState } from 'react';
import {
  User,
  Mail,
  Building2,
  Calendar as CalendarIcon,
  Users,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '../components/ui/popover';
import { Calendar } from '../components/ui/calendar';
import { Combobox } from '../components/ui/combobox';
import { sanitizeText } from '../lib/sanitize';
import { cn } from '../lib/utils';

// three/@react-three pull ~30MB of source into whichever chunk imports them (see
// App.js's TravellingCore comment) -- this backdrop is purely decorative, so it's
// lazy-loaded to keep `three` out of the section's own bundle chunk.
const ShaderAnimation = lazy(() => import('../components/ui/shader-animation'));

const PROJECT_TYPES = ['Web Application', 'Mobile App', 'Brand Design', 'Strategy Consulting'];
const TEAM_SIZES = ['Solo', 'Small (2-4)', 'Medium (5-8)', 'Large (9+)'];

// Mirrors backend/server.js's SUPPORTED_CURRENCIES exactly -- that Set is the
// server's fail-closed allowlist (idempotency-concurrency.md rule 14: an
// unrecognized enum is rejected, never passed through), so offering anything
// this list doesn't contain would just be a guaranteed 422 round-trip.
const CURRENCIES = [
  { code: 'PHP', name: 'Philippine peso' },
  { code: 'USD', name: 'US dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British pound' },
  { code: 'AUD', name: 'Australian dollar' },
  { code: 'SGD', name: 'Singapore dollar' },
  { code: 'CAD', name: 'Canadian dollar' },
  { code: 'JPY', name: 'Japanese yen' },
  { code: 'AED', name: 'UAE dirham' },
];
const DEFAULT_CURRENCY = 'PHP';
// Mirrors backend/server.js's BUDGET_AMOUNT_MAX -- catching an out-of-range
// amount here surfaces it as an inline field error instead of a round-trip
// to the server for something the client already knows is invalid.
const BUDGET_AMOUNT_MAX = 100_000_000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_MAX = 120;
const EMAIL_MAX = 254;
const COMPANY_MAX = 160;
const PROJECT_TYPE_MAX = 120;
const MESSAGE_MAX = 1000;
const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api/demo`;

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

// Backend field name -> our form field name, so a 422's `detail: [{field,
// message}]` (see .claude/rules/idempotency-concurrency.md, rule 9: validate
// at the boundary) lands under the control the user actually sees, instead
// of as a generic "something went wrong".
const SERVER_FIELD_MAP = {
  name: 'fullName',
  email: 'email',
  company: 'company',
  team_size: 'teamSize',
  preferred_date: 'timeline',
  message: 'projectDetails',
  project_type: 'projectType',
  budget_currency: 'budgetCurrency',
  budget_amount: 'budgetAmount',
};

const INITIAL_FORM = {
  fullName: '',
  email: '',
  company: '',
  projectType: '',
  budgetCurrency: DEFAULT_CURRENCY,
  budgetAmount: '',
  timeline: null, // Date | null -- see Calendar/Popover field below
  teamSize: '',
  projectDetails: '',
};

function generateIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for browsers without crypto.randomUUID (older Safari, non-HTTPS
  // contexts) -- not cryptographically strong, but unique enough for a
  // client-generated idempotency key.
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

// Local calendar midnight, not UTC midnight -- the `disabled={{ before }}`
// matcher below needs a same-timezone boundary to compare each rendered day
// against, or "today" in the calendar's own local rendering would disagree
// with it near midnight.
function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// `date.toISOString()` converts to UTC first -- for anyone east of Greenwich
// (this studio is UTC+8) that rolls a locally-selected "today" back to
// "yesterday" for part of the day. Building the string from the Date
// object's own local getters instead keeps the wire value matching what the
// calendar actually showed the user as selected.
function toLocalISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function validate(form) {
  const errors = {};
  if (!form.fullName.trim()) errors.fullName = 'Full name is required.';
  if (!form.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_RE.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (!form.company.trim()) errors.company = 'Company is required.';
  if (!form.teamSize) errors.teamSize = 'Select a team size.';

  const amountRaw = form.budgetAmount.trim();
  if (amountRaw) {
    const amountNum = Number(amountRaw);
    // budget_currency/budget_amount are sent as a pair or not at all (see
    // buildPayload) -- currency always has a default value, so its mere
    // presence can't mean "the user wants to specify a budget" the way a
    // typed amount can. That makes "amount without a valid number" the only
    // client-side check that means anything; "currency without amount" is
    // impossible by construction, matching the mutual-dependency rule
    // backend/server.js enforces.
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      errors.budgetAmount = 'Enter a positive amount.';
    } else if (amountNum > BUDGET_AMOUNT_MAX) {
      errors.budgetAmount = `Amount must be at most ${BUDGET_AMOUNT_MAX.toLocaleString()}.`;
    }
  }

  return errors;
}

function buildPayload(form) {
  const payload = {
    name: sanitizeText(form.fullName, { maxLength: NAME_MAX }),
    email: sanitizeText(form.email, { maxLength: EMAIL_MAX }),
    company: sanitizeText(form.company, { maxLength: COMPANY_MAX }),
    team_size: form.teamSize,
  };

  if (form.timeline) {
    payload.preferred_date = toLocalISODate(form.timeline);
  }

  const message = sanitizeText(form.projectDetails, { maxLength: MESSAGE_MAX, allowNewlines: true });
  if (message) payload.message = message;

  const projectType = sanitizeText(form.projectType, { maxLength: PROJECT_TYPE_MAX });
  if (projectType) payload.project_type = projectType;

  const amountRaw = form.budgetAmount.trim();
  if (amountRaw) {
    payload.budget_currency = form.budgetCurrency;
    payload.budget_amount = Number(amountRaw);
  }

  return payload;
}

async function defaultSubmit(payload, idempotencyKey) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(payload),
  });

  if (res.status === 201 || res.status === 200) return;

  let body = null;
  try {
    body = await res.json();
  } catch {
    // Non-JSON error body -- fall through to the generic error below.
  }

  if (res.status === 422 && Array.isArray(body?.detail)) {
    const err = new Error('Validation failed');
    err.fieldErrors = body.detail;
    throw err;
  }

  throw new Error('Request failed');
}

function FieldIcon({ icon: Icon }) {
  return <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />;
}

// The full inquiry form the site's "Contact us" CTA leads to. `onSubmit`,
// when supplied, replaces the network call so this component can be tested
// without a live backend.
export default function ProjectInquirySection({ onSubmit, className }) {
  const uid = useId();
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const dateContentRef = useRef(null);
  const pending = status === 'submitting';

  // One idempotency key per user intent, not per attempt: created lazily on
  // first render (before any submit can happen) and held in a ref so it
  // survives re-renders untouched. A retry after a failed/timed-out submit
  // reuses this same key so the server replays instead of double-booking;
  // it only rotates after a *successful* submit, starting a fresh intent.
  const idempotencyKeyRef = useRef(null);
  if (idempotencyKeyRef.current === null) {
    idempotencyKeyRef.current = generateIdempotencyKey();
  }

  const setField = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((errs) => ({ ...errs, [key]: undefined }));
  };

  const setSelectField = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((errs) => ({ ...errs, [key]: undefined }));
  };

  const handleTimelineSelect = (date) => {
    setForm((f) => ({ ...f, timeline: date }));
    setDatePopoverOpen(false);
    if (fieldErrors.timeline) setFieldErrors((errs) => ({ ...errs, timeline: undefined }));
  };

  // Live preview only -- this never writes back into the amount input's own
  // value, which is what would fight the caret while the user is typing.
  const amountHint = useMemo(() => {
    const amountNum = Number(form.budgetAmount.trim());
    if (!form.budgetAmount.trim() || !Number.isFinite(amountNum)) return null;
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: form.budgetCurrency }).format(amountNum);
  }, [form.budgetAmount, form.budgetCurrency]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // In-flight guard, half 2 of 2: the submit button is also `disabled`
    // while pending, but that alone doesn't stop a keyboard Enter from
    // re-firing the handler -- this early return is the real guard.
    if (pending) return;

    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setStatus('submitting');
    setGeneralError('');
    setFieldErrors({});

    const payload = buildPayload(form);

    try {
      if (onSubmit) {
        await onSubmit(payload, idempotencyKeyRef.current);
      } else {
        await defaultSubmit(payload, idempotencyKeyRef.current);
      }
      setStatus('success');
      // Fresh intent for any subsequent submission -- reusing the old key
      // here would make a *new* inquiry replay as the previous one.
      idempotencyKeyRef.current = generateIdempotencyKey();
    } catch (err) {
      setStatus('error');
      if (Array.isArray(err?.fieldErrors)) {
        const mapped = {};
        let hasUnmapped = false;
        for (const { field, message } of err.fieldErrors) {
          const uiField = SERVER_FIELD_MAP[field];
          if (uiField) {
            mapped[uiField] = message;
          } else {
            hasUnmapped = true;
          }
        }
        setFieldErrors(mapped);
        if (hasUnmapped || Object.keys(mapped).length === 0) {
          setGeneralError('Some details could not be validated. Please review the form and try again.');
        }
      } else {
        // Never surface raw error internals to the user, and never log form
        // contents -- this is intentionally the only thing we show or keep.
        setGeneralError('Something went wrong sending your inquiry. Please try again.');
      }
    }
  };

  const handleSendAnother = () => {
    setForm(INITIAL_FORM);
    setFieldErrors({});
    setGeneralError('');
    setStatus('idle');
  };

  return (
    <section id="contact" className={cn('relative overflow-hidden py-24 md:py-32', className)} data-testid="project-inquiry-section">
      {/* Decorative backdrop only: absolutely positioned behind the content well
          (z-0), never in its stacking context, and pointer-events are killed on
          it and everything it renders -- @react-three/fiber's own canvas resets
          `pointer-events: auto` on itself, so the blanket [&_*] selector is what
          actually stops it from swallowing clicks (see
          .claude/rules/lessons.md, TravellingCore entry). A dark scrim sits on
          top of it, under the content, so the shader reads as texture rather
          than competing with form labels for contrast. */}
      <Suspense fallback={null}>
        <ShaderAnimation className="pointer-events-none absolute inset-0 z-0 opacity-60 [&_*]:pointer-events-none" />
      </Suspense>
      {/* Two scrims rather than one flat wash. A single opaque overlay strong enough
          to protect the form also erased the shader everywhere — 0.15 opacity under
          bg-ink/70 left roughly 4% of it visible, which is not a background. Instead
          the shader runs at 60% and the darkening is placed where the text is: a
          horizontal ramp that is near-opaque over the left-hand form column and
          clears toward the right, plus a light vertical wash so the section still
          meets the pages above and below it. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[1] bg-gradient-to-r from-ink via-ink/85 to-ink/25"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[1] bg-gradient-to-b from-ink via-transparent to-ink"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5 lg:gap-12">
          {/* The two right-hand columns were empty at every width above `lg`, which left
              the form floating against bare shader. Sticky so it stays in view while the
              form scrolls past it, and hidden below `lg` where it would only push the
              first field further down the page. Decorative, so `alt` is empty and it is
              hidden from assistive tech rather than described. */}
          <div className="hidden lg:col-span-2 lg:order-last lg:block">
            <img
              src="/assets/photos/contact-skyline.webp"
              alt=""
              aria-hidden="true"
              width="900"
              height="1350"
              loading="lazy"
              decoding="async"
              className="sticky top-28 h-[32rem] w-full rounded-2xl border border-line object-cover opacity-80"
            />
          </div>

          <div className="lg:col-span-3">
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Start Your Project
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Tell us what you're building. We reply within one business day with next steps, not a sales
              deck.
            </p>

            {status === 'success' ? (
              <div className="mt-10 rounded-xl border border-border bg-card p-8 text-center" data-testid="inquiry-success">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-aurora-teal/40 bg-aurora-teal/10 text-aurora-teal">
                  <CheckCircle2 className="h-7 w-7" strokeWidth={2.2} aria-hidden="true" />
                </div>
                <h2 className="mt-6 font-display text-xl font-semibold text-foreground">Inquiry received.</h2>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Thanks{form.fullName ? `, ${form.fullName.split(' ')[0]}` : ''}. We'll be in touch shortly.
                </p>
                <Button variant="outline" size="md" className="mt-7" onClick={handleSendAnother}>
                  Send another inquiry
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="mt-10 space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <Label htmlFor={`${uid}-fullName`}>Full Name</Label>
                    <div className="relative mt-1.5">
                      <FieldIcon icon={User} />
                      <Input
                        id={`${uid}-fullName`}
                        className="pl-10"
                        value={form.fullName}
                        onChange={setField('fullName')}
                        placeholder="Ada Lovelace"
                        maxLength={NAME_MAX}
                        aria-invalid={Boolean(fieldErrors.fullName)}
                        aria-describedby={fieldErrors.fullName ? `${uid}-fullName-error` : undefined}
                        data-testid="inquiry-input-fullName"
                      />
                    </div>
                    {fieldErrors.fullName && (
                      <p id={`${uid}-fullName-error`} className="mt-1.5 text-xs text-destructive">
                        {fieldErrors.fullName}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`${uid}-email`}>Email Address</Label>
                    <div className="relative mt-1.5">
                      <FieldIcon icon={Mail} />
                      <Input
                        id={`${uid}-email`}
                        type="email"
                        className="pl-10"
                        value={form.email}
                        onChange={setField('email')}
                        placeholder="ada@company.com"
                        maxLength={EMAIL_MAX}
                        aria-invalid={Boolean(fieldErrors.email)}
                        aria-describedby={fieldErrors.email ? `${uid}-email-error` : undefined}
                        data-testid="inquiry-input-email"
                      />
                    </div>
                    {fieldErrors.email && (
                      <p id={`${uid}-email-error`} className="mt-1.5 text-xs text-destructive">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`${uid}-company`}>Company</Label>
                    <div className="relative mt-1.5">
                      <FieldIcon icon={Building2} />
                      <Input
                        id={`${uid}-company`}
                        className="pl-10"
                        value={form.company}
                        onChange={setField('company')}
                        placeholder="Company name"
                        maxLength={COMPANY_MAX}
                        aria-invalid={Boolean(fieldErrors.company)}
                        aria-describedby={fieldErrors.company ? `${uid}-company-error` : undefined}
                        data-testid="inquiry-input-company"
                      />
                    </div>
                    {fieldErrors.company && (
                      <p id={`${uid}-company-error`} className="mt-1.5 text-xs text-destructive">
                        {fieldErrors.company}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`${uid}-projectType`}>Project Type</Label>
                    <div className="mt-1.5">
                      <Combobox
                        id={`${uid}-projectType`}
                        value={form.projectType}
                        onValueChange={setSelectField('projectType')}
                        options={PROJECT_TYPES}
                        placeholder="Select or type a project type"
                        maxLength={PROJECT_TYPE_MAX}
                        data-testid="inquiry-input-projectType"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`${uid}-timeline`}>Expected Start Date</Label>
                    <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          id={`${uid}-timeline`}
                          type="button"
                          variant="outline"
                          className={cn(
                            'mt-1.5 w-full justify-start gap-2 rounded-md border-input bg-white/[0.02] px-4 text-left text-sm font-normal hover:bg-white/[0.05]',
                            !form.timeline && 'text-muted-foreground'
                          )}
                          data-testid="inquiry-input-timeline"
                        >
                          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                          {form.timeline ? DATE_FORMATTER.format(form.timeline) : 'Select a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        ref={dateContentRef}
                        align="start"
                        className="w-auto p-0"
                        onOpenAutoFocus={(e) => {
                          // Radix's default is "focus the first tabbable
                          // descendant", which in DOM order is the previous-
                          // month nav button, not a day -- that would make
                          // arrow keys do nothing on open. Focus the day
                          // react-day-picker itself designates as the
                          // roving-tabindex target (the only day rendered
                          // with a literal tabindex="0") instead, so ArrowUp/
                          // ArrowDown/ArrowLeft/ArrowRight work immediately.
                          e.preventDefault();
                          dateContentRef.current?.querySelector('button[tabindex="0"]')?.focus();
                        }}
                      >
                        <Calendar
                          selected={form.timeline ?? undefined}
                          onSelect={handleTimelineSelect}
                          disabled={{ before: startOfToday() }}
                          defaultMonth={form.timeline ?? undefined}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor={`${uid}-budgetCurrency`}>Budget Currency</Label>
                    <Select value={form.budgetCurrency} onValueChange={setSelectField('budgetCurrency')}>
                      <SelectTrigger id={`${uid}-budgetCurrency`} className="mt-1.5" data-testid="inquiry-select-budgetCurrency">
                        <SelectValue placeholder="Select a currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(({ code, name }) => (
                          <SelectItem key={code} value={code}>
                            {code} · {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`${uid}-budgetAmount`}>Budget Amount</Label>
                    <Input
                      id={`${uid}-budgetAmount`}
                      type="text"
                      inputMode="decimal"
                      className="mt-1.5"
                      value={form.budgetAmount}
                      onChange={setField('budgetAmount')}
                      placeholder="e.g. 150000"
                      aria-invalid={Boolean(fieldErrors.budgetAmount)}
                      aria-describedby={
                        fieldErrors.budgetAmount
                          ? `${uid}-budgetAmount-error`
                          : amountHint
                            ? `${uid}-budgetAmount-hint`
                            : undefined
                      }
                      data-testid="inquiry-input-budgetAmount"
                    />
                    {fieldErrors.budgetAmount ? (
                      <p id={`${uid}-budgetAmount-error`} className="mt-1.5 text-xs text-destructive">
                        {fieldErrors.budgetAmount}
                      </p>
                    ) : (
                      amountHint && (
                        <p id={`${uid}-budgetAmount-hint`} className="mt-1.5 text-xs text-muted-foreground">
                          {amountHint}
                        </p>
                      )
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor={`${uid}-teamSize`}>Team Size Required</Label>
                    <div className="relative mt-1.5">
                      <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground">
                        <Users className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <Select value={form.teamSize} onValueChange={setSelectField('teamSize')}>
                        <SelectTrigger
                          id={`${uid}-teamSize`}
                          className="pl-10"
                          aria-invalid={Boolean(fieldErrors.teamSize)}
                          aria-describedby={fieldErrors.teamSize ? `${uid}-teamSize-error` : undefined}
                          data-testid="inquiry-select-teamSize"
                        >
                          <SelectValue placeholder="Select a team size" />
                        </SelectTrigger>
                        <SelectContent>
                          {TEAM_SIZES.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {fieldErrors.teamSize && (
                      <p id={`${uid}-teamSize-error`} className="mt-1.5 text-xs text-destructive">
                        {fieldErrors.teamSize}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor={`${uid}-projectDetails`}>Project Details</Label>
                    <Textarea
                      id={`${uid}-projectDetails`}
                      rows={5}
                      className="mt-1.5"
                      value={form.projectDetails}
                      onChange={setField('projectDetails')}
                      placeholder="What are you building, and what does success look like?"
                      maxLength={MESSAGE_MAX}
                      aria-invalid={Boolean(fieldErrors.projectDetails)}
                      aria-describedby={fieldErrors.projectDetails ? `${uid}-projectDetails-error` : undefined}
                      data-testid="inquiry-input-projectDetails"
                    />
                    {fieldErrors.projectDetails && (
                      <p id={`${uid}-projectDetails-error`} className="mt-1.5 text-xs text-destructive">
                        {fieldErrors.projectDetails}
                      </p>
                    )}
                  </div>
                </div>

                {generalError && (
                  <p className="flex items-center gap-2 text-sm text-destructive" role="alert" data-testid="inquiry-error">
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {generalError}
                  </p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  disabled={pending}
                  className="w-full sm:w-auto"
                  data-testid="inquiry-submit"
                >
                  {pending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Sending
                    </>
                  ) : (
                    <>
                      Send inquiry
                      <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="flex flex-col gap-6 lg:sticky lg:top-8">
              <Card>
                <CardHeader>
                  <CardTitle>Why partner with us?</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                      React and Node engineering, not templated widgets.
                    </li>
                    <li className="flex gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                      Design and build under one roof. No handoff gaps.
                    </li>
                    <li className="flex gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                      Transparent timelines with fixed milestones.
                    </li>
                    <li className="flex gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                      Direct access to the team building your product.
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* The reference's `inset_0_1px_0_0_rgba(255,255,255,1)` was a
                  full-opacity light-theme top highlight -- on a dark,
                  saturated primary background that reads as a harsh white
                  seam instead of a subtle edge. Dropped the opacity to 0.25
                  (a believable glass highlight in the dark palette) and
                  paired it with a soft aurora-tinted drop shadow instead of
                  the reference's neutral one, so the card still reads as
                  "lifted" against the page's dark background. */}
              <Card className="relative overflow-hidden border-transparent bg-primary text-primary-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_20px_60px_-20px_rgba(6,182,212,0.45)]">
                <div
                  aria-hidden="true"
                  className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"
                />
                <div
                  aria-hidden="true"
                  className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/10 blur-2xl"
                />
                <CardHeader className="relative">
                  <CardTitle className="text-primary-foreground">Response Time</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-2xl font-bold tracking-tight">Under 4 hours</p>
                  <p className="mt-2 text-sm text-primary-foreground/80">
                    Average first response during business hours.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
