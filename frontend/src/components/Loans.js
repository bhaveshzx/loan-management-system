import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Loans() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loans, setLoans] = useState([]);
  const [showForm, setShowForm] = useState(searchParams.get('new') === 'true');
  const [formData, setFormData] = useState({ amount: '', purpose: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const prevLocationRef = useRef();

  useEffect(() => {
    fetchLoans();
    
    // Listen for loan updates from detail page
    const handleLoansUpdated = () => {
      fetchLoans();
    };
    window.addEventListener('loansUpdated', handleLoansUpdated);
    
    return () => {
      window.removeEventListener('loansUpdated', handleLoansUpdated);
    };
  }, []);

  // Refresh when navigating back from detail page
  useEffect(() => {
    // If we're coming back from a detail page, refresh the loans
    if (prevLocationRef.current && prevLocationRef.current.pathname.startsWith('/loans/') && location.pathname === '/loans') {
      fetchLoans();
    }
    prevLocationRef.current = location;
  }, [location]);

  const fetchLoans = async () => {
    try {
      const response = await api.get('/loans');
      setLoans(response.data.loans);
    } catch (error) {
      console.error('Failed to fetch loans:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/loans', formData);
      setFormData({ amount: '', purpose: '' });
      setShowForm(false);
      fetchLoans();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create loan');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: <span className="badge badge-pending">Pending</span>,
      approved: <span className="badge badge-approved">Approved</span>,
      rejected: <span className="badge badge-rejected">Rejected</span>,
    };
    return badges[status] || status;
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>{user?.role === 'admin' ? 'All Loans' : 'My Loans'}</h1>
        {user?.role !== 'admin' && (
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : 'New Loan Application'}
          </button>
        )}
      </div>

      {showForm && user?.role !== 'admin' && (
        <div className="card">
          <h2>New Loan Application</h2>
          {error && <div className="error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Amount ($)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label>Purpose</label>
              <textarea
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h2>Loan Applications</h2>
        {loans.length === 0 ? (
          <p>No loans found.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                {user?.role === 'admin' && <th>User</th>}
                <th>Amount</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Created At</th>
                {user?.role === 'admin' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <td>
                    {user?.role === 'admin' ? (
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/loans/${loan.id}`);
                        }}
                        style={{ color: '#007bff', textDecoration: 'underline', cursor: 'pointer' }}
                      >
                        {loan.id}
                      </a>
                    ) : (
                      loan.id
                    )}
                  </td>
                  {user?.role === 'admin' && <td>{loan.user?.username}</td>}
                  <td>${loan.amount.toLocaleString()}</td>
                  <td>{loan.purpose}</td>
                  <td>{getStatusBadge(loan.status)}</td>
                  <td>{new Date(loan.created_at).toLocaleDateString()}</td>
                  {user?.role === 'admin' && loan.status === 'pending' && (
                    <td>
                      <LoanActions loan={loan} onUpdate={fetchLoans} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function LoanActions({ loan, onUpdate }) {
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReasons();
  }, []);

  const fetchReasons = async () => {
    try {
      const response = await api.get('/admin/rejection-reasons');
      setReasons(response.data.reasons);
    } catch (error) {
      console.error('Failed to fetch reasons:', error);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post(`/admin/loans/${loan.id}/approve`, { admin_notes: adminNotes });
      setShowApprove(false);
      onUpdate();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve loan');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      setError('Please select a rejection reason');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post(`/admin/loans/${loan.id}/reject`, {
        rejection_reason: rejectionReason,
        admin_notes: adminNotes,
      });
      setShowReject(false);
      onUpdate();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject loan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!showApprove && !showReject && (
        <>
          <button
            className="btn btn-success"
            style={{ marginRight: '5px', padding: '5px 10px', fontSize: '14px' }}
            onClick={() => setShowApprove(true)}
          >
            Approve
          </button>
          <button
            className="btn btn-danger"
            style={{ padding: '5px 10px', fontSize: '14px' }}
            onClick={() => setShowReject(true)}
          >
            Reject
          </button>
        </>
      )}

      {showApprove && (
        <div style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
          <div className="form-group">
            <label>Admin Notes (optional)</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows="3"
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button
            className="btn btn-success"
            onClick={handleApprove}
            disabled={loading}
            style={{ marginRight: '5px' }}
          >
            Confirm Approve
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setShowApprove(false);
              setAdminNotes('');
              setError('');
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {showReject && (
        <div style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
          <div className="form-group">
            <label>Rejection Reason *</label>
            <select
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
            >
              <option value="">Select reason...</option>
              {reasons.map((reason) => (
                <option key={reason.code} value={reason.code}>
                  {reason.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Admin Notes (optional)</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows="3"
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button
            className="btn btn-danger"
            onClick={handleReject}
            disabled={loading}
            style={{ marginRight: '5px' }}
          >
            Confirm Reject
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setShowReject(false);
              setRejectionReason('');
              setAdminNotes('');
              setError('');
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default Loans;

