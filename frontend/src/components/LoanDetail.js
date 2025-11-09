import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function LoanDetail() {
  const { loanId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loan, setLoan] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [reasons, setReasons] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchLoanDetails();
    if (user?.role === 'admin') {
      fetchReasons();
    }
  }, [loanId]);

  const fetchLoanDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/loans/${loanId}`);
      setLoan(response.data.loan);
      
      // If admin, fetch user profile for additional context
      if (user?.role === 'admin' && response.data.loan.user_id) {
        try {
          // Note: We don't have a direct endpoint to get user profile by ID
          // But we can show the user info from the loan response
        } catch (err) {
          console.error('Failed to fetch user profile:', err);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load loan details');
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
      setShowApprove(false);
      setAdminNotes('');
      // Refresh loan details
      await fetchLoanDetails();
      // Show success message and refresh parent list
      alert('Loan approved successfully!');
      // Trigger a custom event to refresh the loans list
      window.dispatchEvent(new Event('loansUpdated'));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve loan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      setError('Please select a rejection reason');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await api.post(`/admin/loans/${loanId}/reject`, {
        rejection_reason: rejectionReason,
        admin_notes: adminNotes,
      });
      setShowReject(false);
      setRejectionReason('');
      setAdminNotes('');
      // Refresh loan details
      await fetchLoanDetails();
      // Show success message and refresh parent list
      alert('Loan rejected successfully!');
      // Trigger a custom event to refresh the loans list
      window.dispatchEvent(new Event('loansUpdated'));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject loan');
    } finally {
      setActionLoading(false);
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
      <div className="container">
        <div className="card">Loading loan details...</div>
      </div>
    );
  }

  if (error && !loan) {
    return (
      <div className="container">
        <div className="card">
          <div className="error">{error}</div>
          <button className="btn btn-secondary" onClick={() => navigate('/loans')}>
            Back to Loans
          </button>
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="container">
        <div className="card">Loan not found</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Loan Application Details</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/loans')}>
          Back to Loans
        </button>
      </div>

      <div className="card">
        <h2>Application Information</h2>
        {error && <div className="error">{error}</div>}
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
          <div>
            <strong>Application ID:</strong>
            <p>{loan.id}</p>
          </div>
          <div>
            <strong>Status:</strong>
            <p>{getStatusBadge(loan.status)}</p>
          </div>
          {user?.role === 'admin' && (
            <>
              <div>
                <strong>Applicant:</strong>
                <p>{loan.user?.username} ({loan.user?.email})</p>
              </div>
              <div>
                <strong>User ID:</strong>
                <p>{loan.user_id}</p>
              </div>
            </>
          )}
          <div>
            <strong>Loan Amount:</strong>
            <p>${loan.amount.toLocaleString()}</p>
          </div>
          <div>
            <strong>Purpose:</strong>
            <p>{loan.purpose}</p>
          </div>
          <div>
            <strong>Created At:</strong>
            <p>{new Date(loan.created_at).toLocaleString()}</p>
          </div>
          <div>
            <strong>Last Updated:</strong>
            <p>{new Date(loan.updated_at).toLocaleString()}</p>
          </div>
          {loan.reviewed_at && (
            <>
              <div>
                <strong>Reviewed At:</strong>
                <p>{new Date(loan.reviewed_at).toLocaleString()}</p>
              </div>
              {loan.reviewed_by && (
                <div>
                  <strong>Reviewed By:</strong>
                  <p>Admin (ID: {loan.reviewed_by})</p>
                </div>
              )}
            </>
          )}
          {loan.rejection_reason && (
            <div style={{ gridColumn: '1 / -1' }}>
              <strong>Rejection Reason:</strong>
              <p>{getRejectionReasonLabel(loan.rejection_reason)}</p>
            </div>
          )}
          {loan.admin_notes && (
            <div style={{ gridColumn: '1 / -1' }}>
              <strong>Admin Notes:</strong>
              <p>{loan.admin_notes}</p>
            </div>
          )}
        </div>
      </div>

      {user?.role === 'admin' && loan.status === 'pending' && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h2>Admin Actions</h2>
          
          {!showApprove && !showReject && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-success"
                onClick={() => {
                  setShowApprove(true);
                  setShowReject(false);
                  setError('');
                }}
              >
                Approve Loan
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  setShowReject(true);
                  setShowApprove(false);
                  setError('');
                }}
              >
                Reject Loan
              </button>
            </div>
          )}

          {showApprove && (
            <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}>
              <h3>Approve Loan Application</h3>
              <div className="form-group">
                <label>Admin Notes (optional)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows="4"
                  placeholder="Add any notes about this approval..."
                />
              </div>
              {error && <div className="error">{error}</div>}
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button
                  className="btn btn-success"
                  onClick={handleApprove}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Processing...' : 'Confirm Approval'}
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
            </div>
          )}

          {showReject && (
            <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}>
              <h3>Reject Loan Application</h3>
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
                  rows="4"
                  placeholder="Add any notes about this rejection..."
                />
              </div>
              {error && <div className="error">{error}</div>}
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button
                  className="btn btn-danger"
                  onClick={handleReject}
                  disabled={actionLoading || !rejectionReason}
                >
                  {actionLoading ? 'Processing...' : 'Confirm Rejection'}
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
            </div>
          )}
        </div>
      )}

      {loan.status !== 'pending' && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h3>Application Status</h3>
          <p>
            This loan application has been <strong>{loan.status}</strong>.
            {loan.status === 'rejected' && loan.rejection_reason && (
              <> Reason: {getRejectionReasonLabel(loan.rejection_reason)}</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

export default LoanDetail;

