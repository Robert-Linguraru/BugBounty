import React, { useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Dashboard({ onNewReport, onEditReport }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/reports`, {
        method: 'GET',
        credentials: 'include'
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to load reports');
      }

      const list = Array.isArray(json)
        ? json
        : json.data?.reports || json.reports || json.data || [];
      setReports(list);
    } catch (err) {
      setError(err.message || 'Unable to fetch reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report?')) return;

    try {
      const res = await fetch(`${API_URL}/api/reports/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to delete report');
      }
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.message || 'Error deleting report');
    }
  };

  const totalEarned = reports.reduce(
    (sum, r) => sum + (parseFloat(r.bountyAmount) || 0),
    0
  );

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}
      >
        <h2 style={{ margin: 0 }}>Researcher Dashboard</h2>
        <button
          type="button"
          onClick={onNewReport}
          style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
        >
          + Submit New Report
        </button>
      </div>

      {error && (
        <div role="alert" style={{ color: '#b91c1c', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Summary Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        <div style={{ border: '1px solid #d1d5db', padding: '1rem', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>Submitted Reports</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{reports.length}</div>
        </div>
        <div style={{ border: '1px solid #d1d5db', padding: '1rem', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>Resolved</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            {reports.filter((r) => r.status === 'RESOLVED').length}
          </div>
        </div>
        <div style={{ border: '1px solid #d1d5db', padding: '1rem', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>Earned Bounties</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            ${totalEarned.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Reports Table */}
      {loading ? (
        <p>Loading your reports...</p>
      ) : reports.length === 0 ? (
        <p>No reports submitted yet. Click &ldquo;+ Submit New Report&rdquo; to create one.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #d1d5db' }}>
              <th style={{ padding: '0.5rem' }}>Title</th>
              <th style={{ padding: '0.5rem' }}>Target</th>
              <th style={{ padding: '0.5rem' }}>Severity</th>
              <th style={{ padding: '0.5rem' }}>Status</th>
              <th style={{ padding: '0.5rem' }}>Bounty</th>
              <th style={{ padding: '0.5rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.5rem' }}>{report.title}</td>
                <td style={{ padding: '0.5rem' }}>
                  <code>{report.targetSystem}</code>
                </td>
                <td style={{ padding: '0.5rem' }}>{report.severity}</td>
                <td style={{ padding: '0.5rem' }}>{report.status}</td>
                <td style={{ padding: '0.5rem' }}>
                  ${(parseFloat(report.bountyAmount) || 0).toFixed(2)}
                </td>
                <td style={{ padding: '0.5rem' }}>
                  {onEditReport && (
                    <button
                      type="button"
                      onClick={() => onEditReport(report)}
                      style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                    >
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(report.id)}
                    style={{ color: '#b91c1c', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}