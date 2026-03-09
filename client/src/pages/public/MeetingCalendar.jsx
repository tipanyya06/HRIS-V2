import React, { useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';

const TIMEZONE_OPTIONS = [
  'Asia/Manila',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Dubai',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Australia/Sydney',
  'Pacific/Auckland',
];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DEFAULT_SLOTS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

const extractErrorMessage = (error, fallback) => {
  const payload = error?.response?.data;

  if (typeof payload?.message === 'string') {
    return payload.message;
  }

  if (typeof payload?.error === 'string') {
    return payload.error;
  }

  if (typeof payload?.error?.message === 'string') {
    return payload.error.message;
  }

  if (typeof error?.message === 'string') {
    return error.message;
  }

  return fallback;
};

export default function MeetingCalendar() {
  const now = new Date();
  const [candidateEmail, setCandidateEmail] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [isValidated, setIsValidated] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedTimezone, setSelectedTimezone] = useState('Asia/Manila');

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [availability, setAvailability] = useState({
    availableDates: [],
    availableTimeSlots: {},
  });

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(null);

  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected && TIMEZONE_OPTIONS.includes(detected)) {
      setSelectedTimezone(detected);
    }
  }, []);

  useEffect(() => {
    if (!isValidated) {
      return;
    }

    const loadAvailability = async () => {
      setLoadingSlots(true);
      setSlotsError('');

      try {
        const response = await api.get('/interviews/availability', {
          params: {
            month: currentMonth,
            year: currentYear,
          },
        });

        const data = response?.data?.data || { availableDates: [], availableTimeSlots: {} };
        setAvailability(data);
      } catch (error) {
        const message = extractErrorMessage(error, 'Failed to load available interview slots.');
        setSlotsError(message);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadAvailability();
  }, [isValidated, currentMonth, currentYear]);

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth, 0).getDate();
  }, [currentMonth, currentYear]);

  const firstDayIndex = useMemo(() => {
    return new Date(currentYear, currentMonth - 1, 1).getDay();
  }, [currentMonth, currentYear]);

  const selectedDaySlots = selectedDate
    ? availability.availableTimeSlots?.[selectedDate] || []
    : [];

  const validateCandidate = async () => {
    setValidationError('');
    setBookingSuccess(null);

    if (!candidateEmail || !receiverName) {
      setValidationError('Please provide both your email and full name.');
      return;
    }

    setValidationLoading(true);

    try {
      await api.get('/applications', {
        params: { email: candidateEmail },
      });

      setIsValidated(true);
    } catch (error) {
      const message = extractErrorMessage(
        error,
        'Email not found. Please check your application email.'
      );
      setValidationError(message);
      setIsValidated(false);
    } finally {
      setValidationLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setSelectedDate(null);
    setSelectedSlot('');
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((prev) => prev - 1);
      return;
    }
    setCurrentMonth((prev) => prev - 1);
  };

  const handleNextMonth = () => {
    setSelectedDate(null);
    setSelectedSlot('');
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((prev) => prev + 1);
      return;
    }
    setCurrentMonth((prev) => prev + 1);
  };

  const handleDateSelect = (day) => {
    if (!availability.availableDates.includes(day)) {
      return;
    }
    setSelectedDate(day);
    setSelectedSlot('');
  };

  const handleConfirmBooking = async () => {
    setBookingError('');
    setBookingSuccess(null);

    if (!selectedDate || !selectedSlot) {
      setBookingError('Please select an available date and time first.');
      return;
    }

    setBookingLoading(true);

    try {
      const isoDate = new Date(
        `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}T${selectedSlot}:00`
      ).toISOString();

      const response = await api.post('/interviews', {
        applicantEmail: candidateEmail,
        scheduledAt: isoDate,
        timezone: selectedTimezone,
        receiverName,
      });

      setBookingSuccess({
        name: receiverName,
        email: candidateEmail,
        date: `${MONTH_NAMES[currentMonth - 1]} ${selectedDate}, ${currentYear}`,
        time: selectedSlot,
        timezone: selectedTimezone,
        bookingId: response?.data?.data?._id,
      });
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to confirm booking. Please try again.');
      setBookingError(message);
    } finally {
      setBookingLoading(false);
    }
  };

  const calendarCells = [];

  for (let i = 0; i < firstDayIndex; i += 1) {
    calendarCells.push(
      <div key={`blank-${i}`} className="h-12 rounded-lg bg-gray-100" />
    );
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const isAvailable = availability.availableDates.includes(day);
    const isSelected = selectedDate === day;

    calendarCells.push(
      <button
        key={day}
        type="button"
        disabled={!isAvailable}
        onClick={() => handleDateSelect(day)}
        className={`h-12 rounded-lg border text-sm font-semibold transition ${
          isSelected
            ? 'border-blue-600 bg-blue-600 text-white'
            : isAvailable
              ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
              : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {day}
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Meeting Calendar</h1>
          <p className="text-gray-600">Validate your application email, choose a schedule, and confirm your interview booking.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">1. Candidate Validation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="email"
              value={candidateEmail}
              onChange={(e) => setCandidateEmail(e.target.value)}
              placeholder="Application email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder="Your full name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={validateCandidate}
            disabled={validationLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-5 py-2 rounded-lg"
          >
            {validationLoading ? 'Checking...' : 'Continue'}
          </button>
          {validationError && (
            <p className="text-red-600 text-sm">{validationError}</p>
          )}
        </div>

        {isValidated && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-gray-900">2. Calendar and Slot Picker</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                  >
                    Prev
                  </button>
                  <span className="font-semibold text-gray-800 min-w-44 text-center">
                    {MONTH_NAMES[currentMonth - 1]} {currentYear}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                  >
                    Next
                  </button>
                </div>
              </div>

              {loadingSlots && <p className="text-gray-600">Loading available slots...</p>}
              {slotsError && <p className="text-red-600">{slotsError}</p>}

              {!loadingSlots && !slotsError && (
                <div className="space-y-4">
                  <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-gray-500">
                    <span>Sun</span>
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                  </div>
                  <div className="grid grid-cols-7 gap-2">{calendarCells}</div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Available time slots {selectedDate ? `for ${MONTH_NAMES[currentMonth - 1]} ${selectedDate}` : ''}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {DEFAULT_SLOTS.map((slot) => {
                        const isOpen = selectedDaySlots.includes(slot);
                        const isChosen = selectedSlot === slot;

                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={!isOpen}
                            onClick={() => setSelectedSlot(slot)}
                            className={`px-3 py-2 rounded-lg border text-sm font-medium ${
                              isChosen
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : isOpen
                                  ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                                  : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">3. Timezone</h2>
              <select
                value={selectedTimezone}
                onChange={(e) => setSelectedTimezone(e.target.value)}
                className="w-full md:w-80 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TIMEZONE_OPTIONS.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-600">Selected timezone: <span className="font-semibold">{selectedTimezone}</span></p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">4. Confirmation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <p><span className="font-semibold text-gray-700">Name:</span> {receiverName || '-'}</p>
                <p><span className="font-semibold text-gray-700">Email:</span> {candidateEmail || '-'}</p>
                <p><span className="font-semibold text-gray-700">Selected Date:</span> {selectedDate ? `${MONTH_NAMES[currentMonth - 1]} ${selectedDate}, ${currentYear}` : '-'}</p>
                <p><span className="font-semibold text-gray-700">Selected Time:</span> {selectedSlot || '-'}</p>
                <p className="md:col-span-2"><span className="font-semibold text-gray-700">Timezone:</span> {selectedTimezone}</p>
              </div>

              <button
                type="button"
                disabled={bookingLoading}
                onClick={handleConfirmBooking}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-5 py-2 rounded-lg"
              >
                {bookingLoading ? 'Confirming...' : 'Confirm Booking'}
              </button>

              {bookingError && <p className="text-red-600 text-sm">{bookingError}</p>}

              {bookingSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 text-sm space-y-1">
                  <p className="font-semibold">Interview booked successfully.</p>
                  <p>Name: {bookingSuccess.name}</p>
                  <p>Email: {bookingSuccess.email}</p>
                  <p>Date: {bookingSuccess.date}</p>
                  <p>Time: {bookingSuccess.time}</p>
                  <p>Timezone: {bookingSuccess.timezone}</p>
                  {bookingSuccess.bookingId && <p>Reference: {bookingSuccess.bookingId}</p>}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
