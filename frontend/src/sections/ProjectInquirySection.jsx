import React, { useId, useRef, useState } from 'react';
import {
  User,
  Mail,
  Building2,
  Calendar,
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
import { cn } from '../lib/utils';

const PROJECT_TYPES = ['Web Application', 'Mobile App', 'Brand Design', 'Strategy Consulting'];
const BUDGET_RANGES = ['$10k-$25k', '$25k-$50k', '$50k-$100k', '$100k+'];
const TEAM_SIZES = ['Solo', 'Small (2-4)', 'Medium (5-8)', 'Large (9+)'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MESSAGE_MAX = 1000;
const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api/demo`;

// Backend field name -> our form field name, so a 422's `detail: [{field,
// message}]` (see .claude/rules/idempotency-concurrency.md, rule 9: validate
// at the boundary) lands under the control the user actually sees, instead
// of as a generic "something went wrong".
const SERVER_FIELD_MAP = { name: 'fullName', email: 'email', company: 'company', team_size: 'teamSize' };

const INITIAL_FORM = {
  fullName: '',
  email: '',
  company: '',
  projectType: '',
  budget: '',
  timeline: '',
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
  return errors;
}

// The `/api/demo` contract (POST { name, email, company, team_size,
// preferred_date?, message? }) has no first-class fields yet for project
// type or budget. Folding them into `message` -- capped at the server's
// 1000-char limit -- keeps that input instead of the server silently
// dropping it. TEMPORARY: replace with real fields once the schema is
// extended; tracked as a mapping shim, not a design choice.
function buildPayload(form) {
  const extras = [];
  if (form.projectType) extras.push(`Project type: ${form.projectType}`);
  if (form.budget) extras.push(`Budget range: ${form.budget}`);
  const details = form.projectDetails.trim();
  const message = [...extras, details].filter(Boolean).join('\n').slice(0, MESSAGE_MAX);

  return {
    name: form.fullName.trim(),
    email: form.email.trim(),
    company: form.company.trim(),
    team_size: form.teamSize,
    ...(form.timeline ? { preferred_date: form.timeline } : {}),
    ...(message ? { message } : {}),
  };
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
    <section id="contact" className={cn('py-24 md:py-32', className)} data-testid="project-inquiry-section">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5 lg:gap-12">
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
                    <Select value={form.projectType} onValueChange={setSelectField('projectType')}>
                      <SelectTrigger id={`${uid}-projectType`} className="mt-1.5" data-testid="inquiry-select-projectType">
                        <SelectValue placeholder="Select a project type" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROJECT_TYPES.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`${uid}-budget`}>Budget Range</Label>
                    <Select value={form.budget} onValueChange={setSelectField('budget')}>
                      <SelectTrigger id={`${uid}-budget`} className="mt-1.5" data-testid="inquiry-select-budget">
                        <SelectValue placeholder="Select a budget range" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUDGET_RANGES.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`${uid}-timeline`}>Expected Start Date</Label>
                    <div className="relative mt-1.5">
                      <FieldIcon icon={Calendar} />
                      <Input
                        id={`${uid}-timeline`}
                        type="date"
                        className="pl-10 [color-scheme:dark]"
                        value={form.timeline}
                        onChange={setField('timeline')}
                        data-testid="inquiry-input-timeline"
                      />
                    </div>
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
                      data-testid="inquiry-input-projectDetails"
                    />
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
                      Design and build under one roof -- no handoff gaps.
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
