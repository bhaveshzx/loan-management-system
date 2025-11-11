import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './dashboard.css';

function LoanDetail() {
  const { loanId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [reasons, setReasons] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    fetchLoanDetails();
    if (user?.role === 'admin') {
      fetchReasons();
    }
  }, [loanId, user]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    const toast = { id, message, type };
    setToasts(prev => [...prev, toast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const fetchLoanDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/loans/${loanId}`);
      setLoan(response.data.loan);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load loan details');
      showToast('Failed to load loan details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchReasons = async () => {
    try {
      const response = await api.get('/admin/rejection-reasons');
      setReasons(response.data.reasons);
    } catch (error) {
      console.error('Failed to fetch reasons:', error);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    setError('');
    try {
      await api.post(`/admin/loans/${loanId}/approve`, { admin_notes: adminNotes });
      setShowApproveModal(false);
      setAdminNotes('');
      showToast('Loan approved successfully!', 'success');
      await fetchLoanDetails();
      window.dispatchEvent(new Event('loansUpdated'));
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to approve loan';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      setError('Please select a rejection reason');
      showToast('Please select a rejection reason', 'error');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await api.post(`/admin/loans/${loanId}/reject`, {
        rejection_reason: rejectionReason,
        admin_notes: adminNotes,
      });
      setShowRejectModal(false);
      setRejectionReason('');
      setAdminNotes('');
      showToast('Loan rejected successfully!', 'success');
      await fetchLoanDetails();
      window.dispatchEvent(new Event('loansUpdated'));
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to reject loan';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const closeModals = () => {
    setShowApproveModal(false);
    setShowRejectModal(false);
    setAdminNotes('');
    setRejectionReason('');
    setError('');
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: <span className="status-badge pending">Pending</span>,
      approved: <span className="status-badge approved">Approved</span>,
      rejected: <span className="status-badge rejected">Rejected</span>,
    };
    return badges[status] || status;
  };

  const getRejectionReasonLabel = (code) => {
    const reasonMap = {
      'INSUFFICIENT_INCOME': 'Insufficient Income',
      'POOR_CREDIT_HISTORY': 'Poor Credit History',
      'INCOMPLETE_DOCUMENTATION': 'Incomplete Documentation',
      'EXCEEDS_LIMIT': 'Exceeds Maximum Limit',
      'AUTO_REJECTED': 'Automatic Rejection (No response within 5 days)'
    };
    return reasonMap[code] || code;
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="loading-spinner-large"></div>
          <p className="loading-text">Loading loan details...</p>
        </div>
      </div>
    );
  }

  if (error && !loan) {
    return (
      <div className="dashboard-container">
        <div className="quick-actions-card">
          <div className="error-message">⚠️ {error}</div>
          <button className="btn-action btn-action-secondary" onClick={() => navigate('/loans')}>
            <span>←</span>
            Back to Loans
          </button>
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="dashboard-container">
        <div className="quick-actions-card">
          <div className="empty-state">
            <div className="empty-state-icon">❌</div>
            <p className="empty-state-text">Loan not found</p>
            <button className="btn-action btn-action-secondary" onClick={() => navigate('/loans')}>
              <span>←</span>
              Back to Loans
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span className="toast-icon">
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : 'ℹ️'}
            </span>
            <span className="toast-message">{toast.message}</span>
            <button className="toast-close" onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Approve Loan #{loan.id}</h3>
              <button className="modal-close" onClick={closeModals}>×</button>
            </div>
            <div className="modal-body">
              <p><strong>User:</strong> {loan.user?.username}</p>
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
              <button className="btn btn-secondary" onClick={closeModals} disabled={actionLoading}>
                Cancel
              </button>
              <button className="btn btn-success" onClick={handleApprove} disabled={actionLoading}>
                {actionLoading ? 'Approving...' : 'Approve Loan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject Loan #{loan.id}</h3>
              <button className="modal-close" onClick={closeModals}>×</button>
            </div>
            <div className="modal-body">
              <p><strong>User:</strong> {loan.user?.username}</p>
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
              <button className="btn btn-secondary" onClick={closeModals} disabled={actionLoading}>
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleReject} 
                disabled={actionLoading || !rejectionReason}
              >
                {actionLoading ? 'Rejecting...' : 'Reject Loan'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-header">
        <div>
          <h1>Loan Application Details</h1>
          <p className="dashboard-welcome">Application ID: #{loan.id}</p>
        </div>
        <button className="btn-action btn-action-secondary" onClick={() => navigate('/loans')}>
          <span>←</span>
          Back to Loans
        </button>
      </div>

      <div className="quick-actions-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Application Information</h2>
          {getStatusBadge(loan.status)}
        </div>
        
        {error && <div className="error-message">⚠️ {error}</div>}
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
          <div className="info-item">
            <div className="info-label">Application ID</div>
            <div className="info-value">#{loan.id}</div>
          </div>
          
          {user?.role === 'admin' && (
            <>
              <div className="info-item">
                <div className="info-label">Applicant</div>
                <div className="info-value">{loan.user?.username}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Email</div>
                <div className="info-value">{loan.user?.email || 'N/A'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">User ID</div>
                <div className="info-value">#{loan.user_id}</div>
              </div>
            </>
          )}
          
          <div className="info-item">
            <div className="info-label">Loan Amount</div>
            <div className="info-value" style={{ color: '#667eea', fontSize: '24px', fontWeight: '700' }}>
              ${loan.amount.toLocaleString()}
            </div>
          </div>
          
          <div className="info-item" style={{ gridColumn: '1 / -1' }}>
            <div className="info-label">Purpose</div>
            <div className="info-value" style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px', lineHeight: '1.6' }}>
              {loan.purpose}
            </div>
          </div>
          
          <div className="info-item">
            <div className="info-label">Created At</div>
            <div className="info-value">{new Date(loan.created_at).toLocaleString()}</div>
          </div>
          
          <div className="info-item">
            <div className="info-label">Last Updated</div>
            <div className="info-value">{new Date(loan.updated_at).toLocaleString()}</div>
          </div>
          
          {loan.reviewed_at && (
            <>
              <div className="info-item">
                <div className="info-label">Reviewed At</div>
                <div className="info-value">{new Date(loan.reviewed_at).toLocaleString()}</div>
              </div>
              {loan.reviewed_by && (
                <div className="info-item">
                  <div className="info-label">Reviewed By</div>
                  <div className="info-value">Admin #{loan.reviewed_by}</div>
                </div>
              )}
            </>
          )}
          
          {loan.rejection_reason && (
            <div className="info-item" style={{ gridColumn: '1 / -1' }}>
              <div className="info-label">Rejection Reason</div>
              <div className="info-value">
                <span className="status-badge rejected">{getRejectionReasonLabel(loan.rejection_reason)}</span>
              </div>
            </div>
          )}
          
          {loan.admin_notes && (
            <div className="info-item" style={{ gridColumn: '1 / -1' }}>
              <div className="info-label">Admin Notes</div>
              <div className="info-value" style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px', lineHeight: '1.6' }}>
                {loan.admin_notes}
              </div>
            </div>
          )}
        </div>
      </div>

      {user?.role === 'admin' && loan.status === 'pending' && (
        <div className="quick-actions-card">
          <h2>Admin Actions</h2>
          <div className="quick-actions">
            <button
              className="btn-action btn-action-success"
              onClick={() => {
                setShowApproveModal(true);
                setShowRejectModal(false);
                setError('');
              }}
            >
              <span>✓</span>
              Approve Loan
            </button>
            <button
              className="btn-action btn-action-danger"
              onClick={() => {
                setShowRejectModal(true);
                setShowApproveModal(false);
                setError('');
              }}
            >
              <span>✗</span>
              Reject Loan
            </button>
          </div>
        </div>
      )}

      {loan.status !== 'pending' && (
        <div className="quick-actions-card">
          <h2>Application Status</h2>
          <div style={{ padding: '20px', background: loan.status === 'approved' ? '#d4edda' : '#f8d7da', borderRadius: '8px', border: `2px solid ${loan.status === 'approved' ? '#28a745' : '#dc3545'}` }}>
            <p style={{ fontSize: '18px', margin: 0, color: loan.status === 'approved' ? '#155724' : '#721c24' }}>
              <strong>Status: {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}</strong>
            </p>
            {loan.status === 'rejected' && loan.rejection_reason && (
              <p style={{ marginTop: '10px', color: '#721c24' }}>
                <strong>Reason:</strong> {getRejectionReasonLabel(loan.rejection_reason)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LoanDetail;

