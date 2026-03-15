import React from 'react';
import { useEffect, useMemo, useState, useCallback } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import {
  Badge,
  Button,
  Card,
  LoadingSpinner,
  Modal,
  PageHeader,
  Select,
  Toast,
} from '../../components/ui';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'pending',     label: 'Pending' },
  { value: 'scheduled',   label: 'Scheduled' },
  { value: 'completed',   label: 'Completed' },
  { value: 'cancelled',   label: 'Cancelled' },
  { value: 'rescheduled', label: 'Rescheduled' },
];

const DAYS_SHORT   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_FULL    = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const HOURS        = Array.from({ length: 11 }, (_, i) => i + 8); // 8 AM – 6 PM

// Status → Tailwind color tokens (bg, text, border, dot)
const STATUS_STYLE = {
  pending:     { bg: 'bg-amber-50',  text: 'text-amber-800',  border: 'border-l-amber-400',  dot: 'bg-amber-400',  label: 'Pending'     },
  scheduled:   { bg: 'bg-blue-50',   text: 'text-blue-800',   border: 'border-l-blue-500',   dot: 'bg-blue-500',   label: 'Scheduled'   },
  rescheduled: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-l-purple-500', dot: 'bg-purple-500', label: 'Rescheduled' },
  completed:   { bg: 'bg-emerald-50',text: 'text-emerald-800',border: 'border-l-emerald-500',dot: 'bg-emerald-500',label: 'Completed'   },
  cancelled:   { bg: 'bg-slate-100', text: 'text-slate-500',  border: 'border-l-slate-400',  dot: 'bg-slate-400',  label: 'Cancelled'   },
};

const FILTER_PILLS = [
  { value: 'all',         label: 'All'         },
  { value: 'pending',     label: 'Pending'     },
  { value: 'scheduled',   label: 'Scheduled'   },
  { value: 'rescheduled', label: 'Rescheduled' },
  { value: 'completed',   label: 'Completed'   },
  { value: 'cancelled',   label: 'Cancelled'   },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const extractErrorMessage = (error, fallback) => {
  if (typeof error?.response?.data?.error === 'string')         return error.response.data.error;
  if (typeof error?.response?.data?.error?.message === 'string') return error.response.data.error.message;
  if (typeof error?.response?.data?.message === 'string')       return error.response.data.message;
  if (typeof error?.message === 'string')                       return error.message;
  return fallback;
};

const getWeekStart = (d) => {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  r.setHours(0, 0, 0, 0);
  return r;
};

const addDays = (d, n) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth()    === b.getMonth()    &&
  a.getDate()     === b.getDate();

const fmt12 = (h, m) => {
  const ap  = h >= 12 ? 'PM' : 'AM';
  const hr  = (h % 12) || 12;
  const min = m < 10 ? `0${m}` : m;
  return `${hr}:${min} ${ap}`;
};

const statusBadgeType = (status) => {
  if (status === 'completed')                         return 'hired';
  if (status === 'cancelled')                         return 'rejected';
  if (status === 'scheduled' || status === 'rescheduled') return 'interview';
  return 'pending';
};

const getInitials = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

// ─── Sub-components ───────────────────────────────────────────────────────────

function MiniCalendar({ baseDate, onShift, onDayClick, events }) {
  const y = baseDate.getFullYear();
  const m = baseDate.getMonth();
  const today      = new Date();
  const firstDay   = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const prevDays   = new Date(y, m, 0).getDate();

  const cells = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: prevDays - firstDay + 1 + i, cur: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, cur: true, date: new Date(y, m, d) });
  }
  const rem = (firstDay + daysInMonth) % 7;
  if (rem) {
    for (let d = 1; d <= 7 - rem; d++) cells.push({ day: d, cur: false });
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-700">
          {MONTHS_FULL[m]} {y}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onShift(-1)}
            className="w-6 h-6 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700 text-xs"
          >
            ‹
          </button>
          <button
            onClick={() => onShift(1)}
            className="w-6 h-6 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700 text-xs"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS_SHORT.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-slate-400 py-1">
            {d[0]}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell, idx) => {
          const isToday  = cell.cur ? sameDay(cell.date, today) : false;
          const hasEvent = cell.cur ? events.some((e) => {
            const raw = e.scheduledAt || e.createdAt;
            if (!raw) return false;
            const dt = new Date(raw);
            if (Number.isNaN(dt.getTime())) return false;
            return sameDay(dt, cell.date);
          }) : false;
          return (
            <button
              key={idx}
              onClick={cell.cur ? () => onDayClick(cell.date) : undefined}
              className={[
                'relative h-7 w-full flex items-center justify-center rounded-lg text-[11px] transition-colors',
                !cell.cur   ? 'text-slate-300 cursor-default'                                  : 'cursor-pointer hover:bg-slate-100',
                isToday     ? 'bg-teal-500 text-white font-semibold hover:bg-teal-600'         : '',
                !isToday && cell.cur ? 'text-slate-700' : '',
              ].join(' ')}
            >
              {cell.day}
              {hasEvent && !isToday ? (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal-400" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function UpcomingList({ interviews, onSelect }) {
  const now          = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  const upcoming = interviews
    .filter((e) => {
      if (!e.scheduledAt) return false;
      const dt = new Date(e.scheduledAt);
      if (isNaN(dt.getTime())) return false;
      return (
        dt >= startOfToday &&
        e.status !== 'completed' &&
        e.status !== 'cancelled'
      );
    })
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
    .slice(0, 5);

  const pendingUnscheduled = interviews
    .filter((e) => e.status === 'pending' && !e.scheduledAt)
    .slice(0, 3);

  const hasAnything = upcoming.length > 0 || pendingUnscheduled.length > 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Upcoming</p>

      {!hasAnything ? (
        <p className="text-xs text-slate-400 py-4 text-center">No upcoming interviews</p>
      ) : null}

      {pendingUnscheduled.length > 0 ? (
        <div className="mb-3">
          <p className="text-[10px] font-medium text-amber-600 uppercase tracking-wide mb-1.5">Needs scheduling</p>
          {pendingUnscheduled.map((ev) => {
            const sty = STATUS_STYLE.pending;
            return (
              <button
                key={ev._id}
                onClick={() => onSelect(ev)}
                className="w-full flex gap-3 py-2.5 border-b border-slate-100 last:border-0 text-left hover:bg-amber-50 rounded-lg px-1 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${sty.dot}`} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">
                    {ev.applicantId?.fullName || 'Candidate'}
                  </p>
                  <p className="text-[11px] text-amber-600">Tap to schedule</p>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

      {upcoming.length > 0 ? (
        <div>
          {pendingUnscheduled.length > 0 ? (
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1.5">Scheduled</p>
          ) : null}
          {upcoming.map((ev) => {
            const d   = new Date(ev.scheduledAt);
            const sty = STATUS_STYLE[ev.status] || STATUS_STYLE.scheduled;
            return (
              <button
                key={ev._id}
                onClick={() => onSelect(ev)}
                className="w-full flex gap-3 py-2.5 border-b border-slate-100 last:border-0 text-left hover:bg-slate-50 rounded-lg px-1 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${sty.dot}`} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">
                    {ev.applicantId?.fullName || 'Candidate'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {DAYS_SHORT[d.getDay()]}, {MONTHS_FULL[d.getMonth()].slice(0, 3)} {d.getDate()} · {fmt12(d.getHours(), d.getMinutes())}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function NeedsSchedulingList({ interviews, onSelect, onSchedule }) {
  const needsScheduling = interviews
    .filter((e) => e.status === 'pending' && !e.scheduledAt)
    .slice(0, 8);

  return (
    <div className="bg-white border border-amber-200 rounded-xl p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-700 mb-3">Needs Scheduling</p>
      {needsScheduling.length === 0 ? (
        <p className="text-xs text-slate-400 py-3 text-center">No pending interviews</p>
      ) : (
        <div className="space-y-2">
          {needsScheduling.map((ev) => (
            <div
              key={ev._id}
              className="rounded-lg border border-amber-100 bg-amber-50 p-2.5"
            >
              <button
                onClick={() => onSelect(ev)}
                className="w-full text-left"
              >
                <p className="text-xs font-semibold text-amber-900 truncate">
                  {ev.applicantId?.fullName || 'Candidate'}
                </p>
                <p className="text-[11px] text-amber-700 truncate">
                  {ev.jobId?.title || 'Unassigned role'}
                </p>
              </button>
              <div className="mt-2">
                <Button size="sm" variant="primary" onClick={() => onSchedule(ev)}>
                  Schedule
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EventBlock({ ev, isSelected, onClick }) {
  if (!ev.scheduledAt) return null;

  const d = new Date(ev.scheduledAt);
  if (Number.isNaN(d.getTime())) return null;

  const localHour = d.getHours();
  const localMin = d.getMinutes();
  const rawTop = ((localHour - 8) * 60 + localMin) / (10 * 60) * 100;
  const top = Math.max(0, Math.min(rawTop, 93));
  const ht  = Math.max((ev.dur || 60) / (10 * 60) * 100, 5);
  const sty = STATUS_STYLE[ev.status] || STATUS_STYLE.scheduled;

  const interviewerName = ev.adminId?.personalInfo?.firstName
    ? `${ev.adminId.personalInfo.firstName} ${ev.adminId.personalInfo.lastName || ''}`.trim()
    : ev.adminId?.email?.split('@')[0] || 'Unassigned';

  return (
    <button
      onClick={() => onClick(ev)}
      style={{ top: `${top.toFixed(1)}%`, height: `${ht.toFixed(1)}%` }}
      className={[
        'absolute left-1 right-1 rounded-lg px-2 py-1 text-left border-l-4 overflow-hidden transition-all',
        sty.bg,
        sty.text,
        sty.border,
        isSelected ? 'ring-2 ring-offset-1 ring-teal-500' : 'hover:brightness-95 hover:scale-[1.01]',
      ].join(' ')}
    >
      <p className="text-[11px] font-semibold leading-tight truncate">
        {ev.applicantId?.fullName || 'Candidate'}
      </p>
      {ht >= 5 ? (
        <p className="text-[10px] opacity-70 mt-0.5">
          {fmt12(localHour, localMin)}
        </p>
      ) : null}
      {ht >= 7 ? (
        <p className="text-[10px] opacity-60 truncate">
          {interviewerName}
        </p>
      ) : null}
    </button>
  );
}

function NowLine() {
  const now = new Date();
  const pct = ((now.getHours() - 8) * 60 + now.getMinutes()) / (10 * 60) * 100;
  if (pct < 0 || pct > 100) return null;
  return (
    <div
      style={{ top: `${pct.toFixed(1)}%` }}
      className="absolute left-0 right-0 z-20 pointer-events-none"
    >
      <div className="relative flex items-center">
        <div className="w-2 h-2 rounded-full bg-teal-500 -ml-1 flex-shrink-0" />
        <div className="flex-1 h-px bg-teal-500" />
      </div>
    </div>
  );
}

function DetailSlideOver({ interview, onClose, onSchedule, onUpdateStatus }) {
  if (!interview) return null;

  const d = interview.scheduledAt ? new Date(interview.scheduledAt) : null;
  const sty = STATUS_STYLE[interview.status] || STATUS_STYLE.pending;
  const isPending = interview.status === 'pending';
  const isActive = ['pending', 'scheduled', 'rescheduled'].includes(interview.status);
  const name = interview.applicantId?.fullName || 'Candidate';
  const initials = getInitials(name);

  const interviewerName = interview.adminId?.personalInfo?.firstName
    ? `${interview.adminId.personalInfo.firstName} ${interview.adminId.personalInfo.lastName || ''}`.trim()
    : interview.adminId?.email?.split('@')[0] || 'Unassigned';
  const interviewerEmail = interview.adminId?.email || '—';
  const interviewerInitials = getInitials(interviewerName);

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-end justify-center sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[88vh] overflow-y-auto shadow-xl">
        <div className="w-9 h-1 rounded-full bg-slate-200 mx-auto mt-3 mb-0 sm:hidden" />

        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-semibold flex-shrink-0 ${sty.bg} ${sty.text}`}>
              {initials}
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{name}</h3>
              <p className="text-sm text-slate-500">{interview.applicantId?.email || '—'}</p>
              <span className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${sty.bg} ${sty.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sty.dot}`} />
                {sty.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl leading-none p-1"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          <div className="px-6 py-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-4">Interview details</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs flex-shrink-0">&#128188;</div>
                <div>
                  <p className="text-[10px] text-slate-400">Position</p>
                  <p className="text-sm font-medium text-slate-800">{interview.jobId?.title || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs flex-shrink-0">&#127970;</div>
                <div>
                  <p className="text-[10px] text-slate-400">Department</p>
                  <p className="text-sm font-medium text-slate-800">{interview.jobId?.department || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs flex-shrink-0">&#128197;</div>
                <div>
                  <p className="text-[10px] text-slate-400">Date</p>
                  <p className="text-sm font-medium text-slate-800">
                    {d
                      ? `${DAYS_FULL[d.getDay()]}, ${MONTHS_FULL[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
                      : 'Not scheduled yet'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs flex-shrink-0">&#128336;</div>
                <div>
                  <p className="text-[10px] text-slate-400">Time</p>
                  <p className="text-sm font-medium text-slate-800">
                    {d ? fmt12(d.getHours(), d.getMinutes()) : '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs flex-shrink-0">&#127760;</div>
                <div>
                  <p className="text-[10px] text-slate-400">Timezone</p>
                  <p className="text-sm font-medium text-slate-800">{interview.timezone || 'Asia/Manila'}</p>
                </div>
              </div>
              {interview.meetingLink ? (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs flex-shrink-0">&#128279;</div>
                  <div>
                    <p className="text-[10px] text-slate-400">Meeting link</p>
                    <a
                      href={interview.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-blue-600 underline"
                    >
                      Join Teams meeting
                    </a>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="px-6 py-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-4">Interviewer</p>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-5">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {interviewerInitials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{interviewerName}</p>
                <p className="text-xs text-slate-500 truncate">{interviewerEmail}</p>
              </div>
            </div>

            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Notes</p>
            {interview.notes ? (
              <p className="text-sm text-slate-700 leading-relaxed">{interview.notes}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">No notes added</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap px-6 py-4 border-t border-slate-100">
          {isPending ? (
            <Button variant="primary" onClick={() => onSchedule(interview)}>
              Schedule Interview
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => onUpdateStatus(interview)}>
              Update Status
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Interviews() {
  const { user } = useAuthStore();

  const now = new Date();

  // ── server state
  const [isLoading,    setIsLoading]    = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType,    setToastType]    = useState('success');
  const [isUpdating,   setIsUpdating]   = useState(false);
  const [interviews,   setInterviews]   = useState([]);

  // ── filter / nav state
  const [statusFilter,  setStatusFilter]  = useState('');
  const [activeFilter,  setActiveFilter]  = useState('all');
  const [curWeekStart,  setCurWeekStart]  = useState(() => getWeekStart(now));
  const [miniBase,      setMiniBase]      = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));

  // ── modal / panel state
  const [detailItem,          setDetailItem]          = useState(null);
  const [selectedInterview,   setSelectedInterview]   = useState(null);
  const [selectedStatus,      setSelectedStatus]      = useState('');
  const [scheduleInterviewItem, setScheduleInterviewItem] = useState(null);
  const [scheduleDateTime,    setScheduleDateTime]    = useState('');
  const [scheduleTimezone,    setScheduleTimezone]    = useState('Asia/Manila');
  const [scheduleMeetingLink, setScheduleMeetingLink] = useState('');
  const [selectedEventId, setSelectedEventId] = useState(null);

  const yearOptions = useMemo(() => ([
    { value: String(now.getFullYear() - 1), label: String(now.getFullYear() - 1) },
    { value: String(now.getFullYear()),     label: String(now.getFullYear())     },
    { value: String(now.getFullYear() + 1), label: String(now.getFullYear() + 1) },
  ]), []);

  // ── derived week days
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(curWeekStart, i)),
    [curWeekStart]
  );

  // ── week title
  const weekTitle = useMemo(() => {
    const s = weekDays[0], e = weekDays[6];
    return s.getMonth() === e.getMonth()
      ? `${MONTHS_FULL[s.getMonth()]} ${s.getFullYear()}`
      : `${MONTHS_FULL[s.getMonth()].slice(0, 3)} – ${MONTHS_FULL[e.getMonth()].slice(0, 3)} ${e.getFullYear()}`;
  }, [weekDays]);

  // ── filtered events for calendar
  const calendarEvents = useMemo(() => {
    const base = ['admin', 'super-admin'].includes(user?.role) ? interviews : [];
    if (activeFilter === 'all') return base;
    return base.filter((e) => e.status === activeFilter);
  }, [interviews, activeFilter, user]);

  const pendingUnscheduled = useMemo(
    () => calendarEvents.filter((e) => e.status === 'pending' && !e.scheduledAt),
    [calendarEvents]
  );

  const stats = useMemo(() => {
    const counts = { pending: 0, scheduled: 0, rescheduled: 0, completed: 0, cancelled: 0 };
    interviews.forEach((e) => {
      if (counts[e.status] !== undefined) counts[e.status]++;
    });
    return {
      active: counts.pending + counts.scheduled + counts.rescheduled,
      pending: counts.pending,
      scheduled: counts.scheduled + counts.rescheduled,
      completed: counts.completed,
    };
  }, [interviews]);

  // ── events for a specific day column
  const eventsForDay = useMemo(() => {
    const lookup = {};
    weekDays.forEach((d, i) => {
      lookup[i] = calendarEvents.filter((e) => {
        if (!e.scheduledAt) return false;
        const dt = new Date(e.scheduledAt);
        if (Number.isNaN(dt.getTime())) return false;
        return sameDay(dt, d);
      });
    });
    return lookup;
  }, [calendarEvents, weekDays]);

  // ── load
  const loadInterviews = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');

      const params = {};

      // Only send status param for completed/cancelled — these are opt-in history views.
      // For all other filters (all, pending, scheduled, rescheduled):
      // fetch all active records and let the client-side activeFilter handle display.
      // This ensures interviews state always has the full picture for Upcoming.
      if (statusFilter === 'completed' || statusFilter === 'cancelled') {
        params.status = statusFilter;
      }

      const { data } = await api.get('/interviews', { params });

      // Handle both response shapes:
      // - direct array: res.json(interviews)         → data is the array
      // - wrapped object: res.json({ data: [...] })  → data.data is the array
      const result = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];

      setInterviews(result);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error, 'Unable to load interviews.'));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

  useEffect(() => {
    if (!Array.isArray(interviews) || interviews.length === 0) {
      return;
    }

    const sortedScheduled = interviews
      .filter((item) => item.scheduledAt)
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

    if (sortedScheduled.length === 0) {
      return;
    }

    const weekHasVisibleInterview = sortedScheduled.some((item) => {
      const eventDate = new Date(item.scheduledAt);
      return weekDays.some((day) => sameDay(eventDate, day));
    });

    if (!weekHasVisibleInterview) {
      const firstScheduled = new Date(sortedScheduled[0].scheduledAt);
      setCurWeekStart(getWeekStart(firstScheduled));
      setMiniBase(new Date(firstScheduled.getFullYear(), firstScheduled.getMonth(), 1));
    }
  }, [interviews, weekDays]);

  // ── schedule
  const handleScheduleInterview = async () => {
    if (!scheduleInterviewItem?._id || !scheduleDateTime) {
      setToastType('error');
      setToastMessage('Date and time are required to schedule an interview.');
      return;
    }
    try {
      setIsUpdating(true);
      const { data } = await api.patch(`/interviews/${scheduleInterviewItem._id}/schedule`, {
        scheduledAt:  scheduleDateTime,
        timezone:     scheduleTimezone,
        meetingLink:  scheduleMeetingLink,
      });
      const updated = data?.data;
      setInterviews((prev) =>
        prev.map((item) =>
          item._id === scheduleInterviewItem._id ? { ...item, ...updated } : item
        )
      );
      setScheduleInterviewItem(null);
      setScheduleDateTime('');
      setScheduleTimezone('Asia/Manila');
      setScheduleMeetingLink('');
      setToastType('success');
      setToastMessage('Interview scheduled successfully.');
    } catch (error) {
      setToastType('error');
      setToastMessage(extractErrorMessage(error, 'Failed to schedule interview.'));
    } finally {
      setIsUpdating(false);
    }
  };

  // ── update status
  const handleUpdateStatus = async () => {
    if (!selectedInterview?._id || !selectedStatus) return;
    try {
      setIsUpdating(true);
      await api.patch(`/interviews/${selectedInterview._id}/status`, { status: selectedStatus });
      setInterviews((prev) =>
        prev.map((item) =>
          item._id === selectedInterview._id ? { ...item, status: selectedStatus } : item
        )
      );
      setToastType('success');
      setToastMessage('Interview status updated.');
      setSelectedInterview(null);
      setSelectedStatus('');
    } catch (error) {
      setToastType('error');
      setToastMessage(extractErrorMessage(error, 'Failed to update interview status.'));
    } finally {
      setIsUpdating(false);
    }
  };

  // ── open detail from slide-over → schedule modal
  const openScheduleModal = (interview) => {
    setDetailItem(null);
    setSelectedEventId(null);
    setScheduleInterviewItem(interview);
    setScheduleDateTime('');
    setScheduleTimezone('Asia/Manila');
    setScheduleMeetingLink('');
  };

  // ── open detail from slide-over → status modal
  const openStatusModal = (interview) => {
    setDetailItem(null);
    setSelectedEventId(null);
    setSelectedInterview(interview);
    setSelectedStatus(interview.status || 'scheduled');
  };

  const handleFilterPill = (value) => {
    setActiveFilter(value);

    // For completed/cancelled: trigger a fresh API fetch to get historical records
    // For all other values: clear statusFilter so API returns all active records
    if (value === 'completed' || value === 'cancelled') {
      setStatusFilter(value);
    } else {
      setStatusFilter('');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader
        title="Interviews"
        subtitle="Track and manage scheduled interviews"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Card className="border border-slate-200">
          <p className="text-xs text-slate-500 mb-1">Total active</p>
          <p className="text-2xl font-semibold text-slate-900">{stats.active}</p>
        </Card>
        <Card className="border border-slate-200">
          <p className="text-xs text-slate-500 mb-1">Needs scheduling</p>
          <p className="text-2xl font-semibold text-slate-900">{stats.pending}</p>
        </Card>
        <Card className="border border-slate-200">
          <p className="text-xs text-slate-500 mb-1">Scheduled</p>
          <p className="text-2xl font-semibold text-slate-900">{stats.scheduled}</p>
        </Card>
        <Card className="border border-slate-200">
          <p className="text-xs text-slate-500 mb-1">Completed</p>
          <p className="text-2xl font-semibold text-slate-900">{stats.completed}</p>
        </Card>
      </div>

      {/* ── Error Banner */}
      {errorMessage ? (
        <Card className="border border-red-200 bg-red-50 mb-4">
          <p className="text-red-700 text-sm">{errorMessage}</p>
        </Card>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">

          {/* ── LEFT SIDEBAR ── */}
          <div className="flex flex-col gap-4">

            {/* Mini calendar */}
            <MiniCalendar
              baseDate={miniBase}
              onShift={(dir) => setMiniBase((prev) => {
                const next = new Date(prev);
                next.setMonth(next.getMonth() + dir);
                return next;
              })}
              onDayClick={(d) => setCurWeekStart(getWeekStart(d))}
              events={calendarEvents}
            />

            {/* Upcoming list */}
            <UpcomingList
              interviews={['admin', 'super-admin'].includes(user?.role) ? interviews : []}
              onSelect={(ev) => setDetailItem(ev)}
            />

            <NeedsSchedulingList
              interviews={calendarEvents}
              onSelect={(ev) => setDetailItem(ev)}
              onSchedule={openScheduleModal}
            />

            {/* Legend */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Legend</p>
              <div className="flex flex-col gap-2">
                {Object.entries(STATUS_STYLE).map(([key, sty]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-sm border-l-2 ${sty.bg} ${sty.border}`} />
                    <span className="text-xs text-slate-600">{sty.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Refresh + status quick-filter */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Filter by Status</p>
              <Select
                label=""
                name="statusFilter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setActiveFilter(e.target.value || 'all');
                }}
                options={[{ value: '', label: 'All Statuses' }, ...STATUS_OPTIONS]}
              />
              <Button onClick={loadInterviews} variant="primary" className="w-full">
                Refresh
              </Button>
            </div>
          </div>

          {/* ── MAIN CALENDAR ── */}
          <div className="flex flex-col gap-3">

            {/* Topbar */}
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-base font-bold text-slate-800">{weekTitle}</h2>
              <div className="flex gap-2 ml-auto items-center flex-wrap">
                <button
                  onClick={() => setCurWeekStart(getWeekStart(now))}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => setCurWeekStart((prev) => addDays(prev, -7))}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  ‹ Prev
                </button>
                <button
                  onClick={() => setCurWeekStart((prev) => addDays(prev, 7))}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Next ›
                </button>
              </div>
            </div>

            {/* Filter pills */}
            <div className="flex gap-2 flex-wrap">
              {FILTER_PILLS.map((pill) => (
                <button
                  key={pill.value}
                  onClick={() => handleFilterPill(pill.value)}
                  className={[
                    'px-3 py-1 text-xs font-medium rounded-full border transition-colors',
                    activeFilter === pill.value
                      ? 'bg-teal-500 border-teal-500 text-white'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800',
                  ].join(' ')}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Week grid */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">

              {pendingUnscheduled.length > 0 ? (
                <div className="border-b border-amber-100 bg-amber-50 px-4 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-700 mb-2">
                    Needs Scheduling - {pendingUnscheduled.length}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {pendingUnscheduled.map((ev) => (
                      <button
                        key={ev._id}
                        onClick={() => setDetailItem(ev)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-[11px] font-medium hover:bg-amber-200 transition-colors"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                        {ev.applicantId?.fullName || 'Candidate'} - {ev.jobId?.title || '-'}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Day headers */}
              <div className="grid border-b border-slate-200" style={{ gridTemplateColumns: '68px repeat(7, 1fr)' }}>
                <div className="border-r border-slate-100" />
                {weekDays.map((d, i) => {
                  const isToday = sameDay(d, now);
                  return (
                    <div key={i} className="py-2 px-1 text-center border-r border-slate-100 last:border-r-0">
                      <p className="text-[10px] font-medium text-slate-400">{DAYS_SHORT[d.getDay()]}</p>
                      <div className={[
                        'text-sm font-bold mx-auto mt-0.5 w-7 h-7 flex items-center justify-center rounded-full',
                        isToday ? 'bg-teal-500 text-white' : 'text-slate-700',
                      ].join(' ')}>
                        {d.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Hour grid + events */}
              <div
                className="grid overflow-y-auto"
                  style={{ gridTemplateColumns: '68px repeat(7, 1fr)', maxHeight: '560px' }}
              >
                {/* Time column */}
                <div className="border-r border-slate-100">
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="h-14 flex items-start justify-end pr-3 pt-1 border-b border-slate-100"
                    >
                      <span className="text-[10px] text-slate-400 pt-1 whitespace-nowrap">
                        {fmt12(h, 0)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {weekDays.map((d, di) => (
                  <div
                    key={di}
                    className="relative border-r border-slate-100 last:border-r-0"
                    style={{ height: `${HOURS.length * 56}px` }}
                  >
                    {/* Hour lines */}
                    {HOURS.map((h) => (
                      <div key={h} className="h-14 border-b border-slate-100" />
                    ))}

                    {/* Now line — only on today's column */}
                    {sameDay(d, now) ? <NowLine /> : null}

                    {/* Events */}
                    {(eventsForDay[di] || []).map((ev) => (
                      <EventBlock
                        key={ev._id}
                        ev={ev}
                        isSelected={selectedEventId === ev._id}
                        onClick={(item) => {
                          setSelectedEventId(item._id);
                          setDetailItem(item);
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Slide-Over */}
      {detailItem ? (
        <DetailSlideOver
          interview={detailItem}
          onClose={() => {
            setDetailItem(null);
            setSelectedEventId(null);
          }}
          onSchedule={openScheduleModal}
          onUpdateStatus={openStatusModal}
        />
      ) : null}

      {/* ── Schedule Modal (unchanged API contract) */}
      <Modal
        isOpen={Boolean(scheduleInterviewItem)}
        onClose={() => setScheduleInterviewItem(null)}
        title="Schedule Interview"
      >
        <div className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium text-slate-700 mb-1"
              htmlFor="scheduledAt"
            >
              Date and Time
            </label>
            <input
              id="scheduledAt"
              type="datetime-local"
              value={scheduleDateTime}
              onChange={(e) => setScheduleDateTime(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-slate-700 mb-1"
              htmlFor="timezone"
            >
              Timezone
            </label>
            <input
              id="timezone"
              type="text"
              value={scheduleTimezone}
              onChange={(e) => setScheduleTimezone(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-slate-700 mb-1"
              htmlFor="meetingLink"
            >
              Meeting Link
            </label>
            <input
              id="meetingLink"
              type="url"
              value={scheduleMeetingLink}
              onChange={(e) => setScheduleMeetingLink(e.target.value)}
              placeholder="https://"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setScheduleInterviewItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleInterview} isLoading={isUpdating}>
              Save Schedule
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Update Status Modal (unchanged API contract) */}
      <Modal
        isOpen={Boolean(selectedInterview)}
        onClose={() => setSelectedInterview(null)}
        title="Update Interview Status"
      >
        <div className="space-y-4">
          <Select
            label="New Status"
            name="newStatus"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            options={STATUS_OPTIONS}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setSelectedInterview(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} isLoading={isUpdating}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Toast */}
      {toastMessage ? (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      ) : null}
    </div>
  );
}