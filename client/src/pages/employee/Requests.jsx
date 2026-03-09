import React, { useState } from 'react';
import { Button, Card, Input, PageHeader, Select, Toast } from '../../components/ui';

export default function Requests() {
  const [requestType, setRequestType] = useState('');
  const [requestDate, setRequestDate] = useState('');
  const [reason, setReason] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setErrorMessage('');
      if (!requestType || !requestDate || !reason) {
        setErrorMessage('Please complete all fields.');
      } else {
        setToastMessage('Request submitted locally. API endpoint integration is pending.');
        setRequestType('');
        setRequestDate('');
        setReason('');
      }
    } catch (error) {
      setErrorMessage('Unable to submit request right now.');
    }
  };

  return (
    <div>
      <PageHeader title="Employee Requests" subtitle="Submit time-off and support requests" />
      <Card className="border border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Request Type"
            name="requestType"
            value={requestType}
            onChange={(event) => setRequestType(event.target.value)}
            options={[
              { value: 'leave', label: 'Leave Request' },
              { value: 'overtime', label: 'Overtime Request' },
              { value: 'incident', label: 'Incident Report' },
            ]}
            error={errorMessage && !requestType ? 'Required' : ''}
          />

          <Input
            label="Date"
            name="requestDate"
            type="date"
            value={requestDate}
            onChange={(event) => setRequestDate(event.target.value)}
            error={errorMessage && !requestDate ? 'Required' : ''}
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="reason" className="text-sm font-medium text-gray-700">Reason</label>
            <textarea
              id="reason"
              name="reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
              rows={4}
              placeholder="Provide request details"
            />
          </div>

          {errorMessage ? <p className="text-red-600 text-sm">{errorMessage}</p> : null}

          <Button type="submit">Submit Request</Button>
        </form>
      </Card>
      {toastMessage ? <Toast message={toastMessage} type="success" onClose={() => setToastMessage('')} /> : null}
    </div>
  );
}
