import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function SubmitReport({ initialReport = null, onCancel, onSuccess }) {
  const isEditing = Boolean(initialReport);

  const [title, setTitle] = useState(initialReport?.title || '');
  const [targetSystem, setTargetSystem] = useState(initialReport?.targetSystem || '');
  const [severity, setSeverity] = useState(initialReport?.severity || 'LOW');
  const [details, setDetails] = useState(initialReport?.details || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const url = isEditing
      ? `${API_URL}/api/reports/${initialReport.id}`
      : `${API_URL}/api/reports`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, targetSystem, severity, details })
      });

      if (res.status === 404) {
        // Backend Task 3.1/3.2 not merged yet — allow local UI preview flow
        if (onSuccess) {
          onSuccess({
            id: initialReport?.id || `preview-${Date.now()}`,
            title,
            targetSystem,
            severity,
            status: initialReport?.status || 'PENDING',
            bountyAmount: initialReport?.bountyAmount || '0.00',
            details,
            createdAt: initialReport?.createdAt || new Date().toISOString()
          });
        }
        return;
      }

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to save report');
      }

      const savedReport = json.data?.report || json.report || json.data || json;
      if (onSuccess) onSuccess(savedReport);
    } catch (err) {
      setError(err.message || 'Unable to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', fontFamily: 'sans-serif' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}
      >
        <h2 style={{ margin: 0 }}>
          {isEditing ? 'Edit Vulnerability Report' : 'Submit Vulnerability Report'}
        </h2>
        {onCancel && (
          <button type="button" onClick={onCancel} style={{ padding: '0.4rem 0.8rem' }}>
            Back to Dashboard
          </button>
        )}
      </div>

      {error && (
        <div role="alert" style={{ color: '#b91c1c', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="report-title" style={{ display: 'block', marginBottom: '0.25rem' }}>
            Vulnerability Title
          </label>
          <input
            id="report-title"
            type="text"
            placeholder="e.g., SQL Injection in Search Parameter"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="report-target" style={{ display: 'block', marginBottom: '0.25rem' }}>
            Target System / Scope
          </label>
          <input
            id="report-target"
            type="text"
            placeholder="e.g., api.example.com"
            value={targetSystem}
            onChange={(e) => setTargetSystem(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="report-severity" style={{ display: 'block', marginBottom: '0.25rem' }}>
            Severity
          </label>
          <select
            id="report-severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          >
            {SEVERITIES.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label htmlFor="report-details" style={{ display: 'block', marginBottom: '0.25rem' }}>
            Proof of Concept &amp; Reproduction Steps
          </label>
          <textarea
            id="report-details"
            rows={7}
            placeholder="Describe the vulnerability, steps to reproduce, and potential impact..."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', fontFamily: 'inherit' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="submit"
            disabled={submitting}
            style={{ padding: '0.5rem 1.25rem', cursor: 'pointer' }}
          >
            {submitting
              ? 'Saving...'
              : isEditing
              ? 'Update Report'
              : 'Submit Report'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}