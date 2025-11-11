import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './dashboard.css';

function Loans() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loans, setLoans] = useState([]);
  const [showForm, setShowForm] = useState(searchParams.get('new') === 'true');
  const [formData, setFormData] = useState({ amount: '', purpose: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});
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
    setFetching(true);
    try {
      const response = await api.get('/loans');
      setLoans(response.data.loans || []);
    } catch (error) {
      console.error('Failed to fetch loans:', error);
      setError('Failed to load loans. Please try again.');
    } finally {
      setFetching(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Amount must be greater than 0';
      isValid = false;
    }
    if (!formData.purpose || formData.purpose.trim().length < 10) {
      errors.purpose = 'Purpose must be at least 10 characters';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setError('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      await api.post('/loans', {
        amount: parseFloat(formData.amount),
        purpose: formData.purpose.trim()
      });
      setSuccess('Loan application submitted successfully!');
      setFormData({ amount: '', purpose: '' });
      setFieldErrors({});
      setTimeout(() => {
        setShowForm(false);
        setSuccess('');
        fetchLoans();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create loan application');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: <span className="status-badge pending">Pending</span>,
      approved: <span className="status-badge approved">Approved</span>,
      rejected: <span className="status-badge rejected">Rejected</span>,
    };
    return badges[status] || status;
  };

  if (fetching) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="loading-spinner-large"></div>
          <p className="loading-text">Loading loans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>{user?.role === 'admin' ? 'All Loans' : 'My Loans'}</h1>
          <p className="dashboard-welcome">
            {user?.role === 'admin' ? 'Manage all loan applications' : 'View and manage your loan applications'}
          </p>
        </div>
        {user?.role !== 'admin' && (
          <button
            className="btn-action btn-action-success"
            onClick={() => {
              setShowForm(!showForm);
              setError('');
              setSuccess('');
              setFieldErrors({});
            }}
          >
            <span>{showForm ? '' : ''}</span>
            {showForm ? 'Cancel' : 'New Loan Application'}
          </button>
        )}
      </div>

      {showForm && user?.role !== 'admin' && (
        <div className="quick-actions-card" style={{ marginBottom: '30px', animation: 'slideDown 0.3s' }}>
          <h2>New Loan Application</h2>
          {error && <div className="error-message">⚠️ {error}</div>}
          {success && <div className="success-message">✓ {success}</div>}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className={`form-group ${fieldErrors.amount ? 'error' : formData.amount ? 'success' : ''}`}>
              <label>Amount ($) *</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => {
                  setFormData({ ...formData, amount: e.target.value });
                  setFieldErrors({ ...fieldErrors, amount: '' });
                  setError('');
                }}
                onBlur={() => {
                  if (formData.amount && parseFloat(formData.amount) <= 0) {
                    setFieldErrors({ ...fieldErrors, amount: 'Amount must be greater than 0' });
                  }
                }}
                min="0"
                step="0.01"
                placeholder="Enter loan amount"
                required
              />
              {fieldErrors.amount && <div className="validation-error">⚠️ {fieldErrors.amount}</div>}
            </div>
            <div className={`form-group ${fieldErrors.purpose ? 'error' : formData.purpose && formData.purpose.length >= 10 ? 'success' : ''}`}>
              <label>Purpose *</label>
              <textarea
                value={formData.purpose}
                onChange={(e) => {
                  setFormData({ ...formData, purpose: e.target.value });
                  setFieldErrors({ ...fieldErrors, purpose: '' });
                  setError('');
                }}
                onBlur={() => {
                  if (formData.purpose && formData.purpose.trim().length < 10) {
                    setFieldErrors({ ...fieldErrors, purpose: 'Purpose must be at least 10 characters' });
                  }
                }}
                placeholder="Describe the purpose of this loan (minimum 10 characters)"
                rows="4"
                required
              />
              {fieldErrors.purpose && <div className="validation-error">⚠️ {fieldErrors.purpose}</div>}
              {formData.purpose && formData.purpose.length < 10 && (
                <div className="validation-error">⚠️ {10 - formData.purpose.length} more characters needed</div>
              )}
            </div>
            <button type="submit" className="btn-auth" disabled={loading}>
              {loading && <span className="loading-spinner"></span>}
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      )}

      <div className="dashboard-table-card">
        <h2>
          Loan Applications
          <span className="table-count-badge">{loans.length}</span>
        </h2>
        {loans.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <p className="empty-state-text">No loans found</p>
            <p className="empty-state-subtext">
              {user?.role === 'admin' 
                ? 'No loan applications have been submitted yet' 
                : 'You haven\'t applied for any loans yet'}
            </p>
            {user?.role !== 'admin' && !showForm && (
              <button
                className="btn-action btn-action-success"
                onClick={() => setShowForm(true)}
                style={{ marginTop: '20px' }}
              >
                <span>➕</span>
                Apply for Your First Loan
              </button>
            )}
          </div>
        ) : (
          <table className="dashboard-table">
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
                        className="table-link"
                      >
                        #{loan.id}
                      </a>
                    ) : (
                      <span 
                        onClick={() => navigate(`/loans/${loan.id}`)}
                        style={{ cursor: 'pointer', color: '#667eea', fontWeight: '600' }}
                      >
                        #{loan.id}
                      </span>
                    )}
                  </td>
                  {user?.role === 'admin' && <td>{loan.user?.username}</td>}
                  <td><strong>${loan.amount.toLocaleString()}</strong></td>
                  <td>{loan.purpose.length > 50 ? `${loan.purpose.substring(0, 50)}...` : loan.purpose}</td>
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
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
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
      setReasons(response.data.reasons || []);
    } catch (error) {
      console.error('Failed to fetch reasons:', error);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post(`/admin/loans/${loan.id}/approve`, { admin_notes: adminNotes });
      setShowApproveModal(false);
      setAdminNotes('');
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
      setShowRejectModal(false);
      setRejectionReason('');
      setAdminNotes('');
      onUpdate();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject loan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="table-actions">
        <button
          className="btn-table btn-table-success"
          onClick={() => {
            setShowApproveModal(true);
            setShowRejectModal(false);
            setError('');
          }}
        >
          Approve
        </button>
        <button
          className="btn-table btn-table-danger"
          onClick={() => {
            setShowRejectModal(true);
            setShowApproveModal(false);
            setError('');
          }}
        >
          Reject
        </button>
      </div>

      {showApproveModal && (
        <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Approve Loan #{loan.id}</h3>
              <button className="modal-close" onClick={() => setShowApproveModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p><strong>Amount:</strong> ${loan.amount.toLocaleString()}</p>
              <p><strong>Purpose:</strong> {loan.purpose}</p>
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label>Admin Notes (optional)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows="4"
                  placeholder="Add any notes about this approval..."
                />
              </div>
              {error && <div className="error-message">⚠️ {error}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowApproveModal(false)} disabled={loading}>
                Cancel
              </button>
              <button className="btn btn-success" onClick={handleApprove} disabled={loading}>
                {loading ? 'Approving...' : 'Approve Loan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject Loan #{loan.id}</h3>
              <button className="modal-close" onClick={() => setShowRejectModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p><strong>Amount:</strong> ${loan.amount.toLocaleString()}</p>
              <p><strong>Purpose:</strong> {loan.purpose}</p>
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label>Rejection Reason *</label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                >
                  <option value="">Select a reason...</option>
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
                  rows="4"
                  placeholder="Add any additional notes about this rejection..."
                />
              </div>
              {error && <div className="error-message">⚠️ {error}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRejectModal(false)} disabled={loading}>
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleReject} 
                disabled={loading || !rejectionReason}
              >
                {loading ? 'Rejecting...' : 'Reject Loan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Loans;

