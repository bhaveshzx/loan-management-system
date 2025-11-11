import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './dashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [pendingLoans, setPendingLoans] = useState([]);
  const [approvedLoans, setApprovedLoans] = useState([]);
  const [rejectedLoans, setRejectedLoans] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchPendingLoans(),
        fetchApprovedLoans(),
        fetchRejectedLoans(),
        fetchRejectionReasons()
      ]);
    } catch (error) {
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    const toast = { id, message, type };
    setToasts(prev => [...prev, toast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/loans');
      const loans = response.data.loans || [];
      setStats({
        total: loans.length,
        pending: loans.filter(l => l.status === 'pending').length,
        approved: loans.filter(l => l.status === 'approved').length,
        rejected: loans.filter(l => l.status === 'rejected').length,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      throw error;
    }
  };

  const fetchPendingLoans = async () => {
    try {
      const response = await api.get('/admin/loans/pending');
      setPendingLoans(response.data.loans || []);
    } catch (error) {
      console.error('Failed to fetch pending loans:', error);
      throw error;
    }
  };

  const fetchApprovedLoans = async () => {
    try {
      const response = await api.get('/loans');
      const loans = response.data.loans || [];
      const approved = loans
        .filter(l => l.status === 'approved')
        .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
      setApprovedLoans(approved);
    } catch (error) {
      console.error('Failed to fetch approved loans:', error);
      throw error;
    }
  };

  const fetchRejectedLoans = async () => {
    try {
      const response = await api.get('/loans');
      const loans = response.data.loans || [];
      const rejected = loans
        .filter(l => l.status === 'rejected')
        .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
      setRejectedLoans(rejected);
    } catch (error) {
      console.error('Failed to fetch rejected loans:', error);
      throw error;
    }
  };

  const fetchRejectionReasons = async () => {
    try {
      const response = await api.get('/admin/rejection-reasons');
      setReasons(response.data.reasons || []);
    } catch (error) {
      console.error('Failed to fetch rejection reasons:', error);
      throw error;
    }
  };

  const handleApproveClick = (loan) => {
    setSelectedLoan(loan);
    setAdminNotes('');
    setShowApproveModal(true);
  };

  const handleRejectClick = (loan) => {
    setSelectedLoan(loan);
    setAdminNotes('');
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleApprove = async () => {
    if (!selectedLoan) return;
    
    setActionLoading(true);
    try {
      await api.post(`/admin/loans/${selectedLoan.id}/approve`, { admin_notes: adminNotes });
      showToast('Loan approved successfully!', 'success');
      setShowApproveModal(false);
      setSelectedLoan(null);
      setAdminNotes('');
      // Refresh all data
      await Promise.all([
        fetchStats(),
        fetchPendingLoans(),
        fetchApprovedLoans(),
        fetchRejectedLoans()
      ]);
    } catch (error) {
      console.error('Approval error:', error);
      showToast(error.response?.data?.error || 'Failed to approve loan', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedLoan) return;
    if (!rejectionReason) {
      showToast('Please select a rejection reason', 'error');
      return;
    }
    
    setActionLoading(true);
    try {
      await api.post(`/admin/loans/${selectedLoan.id}/reject`, {
        rejection_reason: rejectionReason,
        admin_notes: adminNotes,
      });
      showToast('Loan rejected successfully!', 'success');
      setShowRejectModal(false);
      setSelectedLoan(null);
      setAdminNotes('');
      setRejectionReason('');
      // Refresh all data
      await Promise.all([
        fetchStats(),
        fetchPendingLoans(),
        fetchApprovedLoans(),
        fetchRejectedLoans()
      ]);
    } catch (error) {
      console.error('Rejection error:', error);
      showToast(error.response?.data?.error || 'Failed to reject loan', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const closeModals = () => {
    setShowApproveModal(false);
    setShowRejectModal(false);
    setSelectedLoan(null);
    setAdminNotes('');
    setRejectionReason('');
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="loading-spinner-large"></div>
          <p className="loading-text">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const getDaysPendingClass = (days) => {
    if (days >= 4) return 'urgent';
    if (days >= 2) return 'warning';
    return 'normal';
  };

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
      {showApproveModal && selectedLoan && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Approve Loan #{selectedLoan.id}</h3>
              <button className="modal-close" onClick={closeModals}>×</button>
            </div>
            <div className="modal-body">
              <p><strong>User:</strong> {selectedLoan.user?.username}</p>
              <p><strong>Amount:</strong> ${selectedLoan.amount.toLocaleString()}</p>
              <p><strong>Purpose:</strong> {selectedLoan.purpose}</p>
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label>Admin Notes (optional)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows="4"
                  placeholder="Add any notes about this approval..."
                />
              </div>
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
      {showRejectModal && selectedLoan && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject Loan #{selectedLoan.id}</h3>
              <button className="modal-close" onClick={closeModals}>×</button>
            </div>
            <div className="modal-body">
              <p><strong>User:</strong> {selectedLoan.user?.username}</p>
              <p><strong>Amount:</strong> ${selectedLoan.amount.toLocaleString()}</p>
              <p><strong>Purpose:</strong> {selectedLoan.purpose}</p>
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
          <h1>Admin Dashboard</h1>
          <p className="dashboard-welcome">Manage and review loan applications</p>
        </div>
        <button className="btn-refresh" onClick={loadAllData} disabled={loading}>
          <span>🔄</span>
          Refresh
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Loans</span>
            <span className="stat-card-icon">📊</span>
          </div>
          <p className="stat-card-value">{stats.total}</p>
          <p className="stat-card-change">All loan applications</p>
        </div>

        <div className="stat-card pending">
          <div className="stat-card-header">
            <span className="stat-card-title">Pending Review</span>
            <span className="stat-card-icon">⏳</span>
          </div>
          <p className="stat-card-value">{stats.pending}</p>
          <p className="stat-card-change">Awaiting action</p>
        </div>

        <div className="stat-card approved">
          <div className="stat-card-header">
            <span className="stat-card-title">Approved</span>
            <span className="stat-card-icon">✓</span>
          </div>
          <p className="stat-card-value">{stats.approved}</p>
          <p className="stat-card-change">Successfully approved</p>
        </div>

        <div className="stat-card rejected">
          <div className="stat-card-header">
            <span className="stat-card-title">Rejected</span>
            <span className="stat-card-icon">✗</span>
          </div>
          <p className="stat-card-value">{stats.rejected}</p>
          <p className="stat-card-change">Not approved</p>
        </div>
      </div>

      <div className="dashboard-table-card">
        <h2>
          Pending Loans
          <span className="table-count-badge">{pendingLoans.length}</span>
        </h2>
        {pendingLoans.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✓</div>
            <p className="empty-state-text">No pending loans</p>
            <p className="empty-state-subtext">All loans have been reviewed</p>
          </div>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Amount</th>
                <th>Purpose</th>
                <th>Created At</th>
                <th>Days Pending</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingLoans.map((loan) => {
                const daysPending = Math.floor(
                  (new Date() - new Date(loan.created_at)) / (1000 * 60 * 60 * 24)
                );
                return (
                  <tr key={loan.id}>
                    <td>
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
                    </td>
                    <td>{loan.user?.username}</td>
                    <td>${loan.amount.toLocaleString()}</td>
                    <td>{loan.purpose}</td>
                    <td>{new Date(loan.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`days-pending ${getDaysPendingClass(daysPending)}`}>
                        {daysPending} day{daysPending !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-table btn-table-success"
                          onClick={() => handleApproveClick(loan)}
                        >
                          Approve
                        </button>
                        <button
                          className="btn-table btn-table-danger"
                          onClick={() => handleRejectClick(loan)}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboard-table-card">
        <h2>
          Approved Loans
          <span className="table-count-badge">{approvedLoans.length}</span>
        </h2>
        {approvedLoans.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p className="empty-state-text">No approved loans</p>
            <p className="empty-state-subtext">Approved loans will appear here</p>
          </div>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Amount</th>
                <th>Purpose</th>
                <th>Created At</th>
                <th>Approved At</th>
                <th>Reviewed By</th>
              </tr>
            </thead>
            <tbody>
              {approvedLoans.map((loan) => (
                <tr key={loan.id}>
                  <td>
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
                  </td>
                  <td>{loan.user?.username}</td>
                  <td>${loan.amount.toLocaleString()}</td>
                  <td>{loan.purpose}</td>
                  <td>{new Date(loan.created_at).toLocaleDateString()}</td>
                  <td>{loan.updated_at ? new Date(loan.updated_at).toLocaleDateString() : '-'}</td>
                  <td>{loan.reviewed_by ? `Admin #${loan.reviewed_by}` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboard-table-card">
        <h2>
          Rejected Loans
          <span className="table-count-badge">{rejectedLoans.length}</span>
        </h2>
        {rejectedLoans.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p className="empty-state-text">No rejected loans</p>
            <p className="empty-state-subtext">Rejected loans will appear here</p>
          </div>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Amount</th>
                <th>Purpose</th>
                <th>Created At</th>
                <th>Rejected At</th>
                <th>Reason</th>
                <th>Reviewed By</th>
              </tr>
            </thead>
            <tbody>
              {rejectedLoans.map((loan) => (
                <tr key={loan.id}>
                  <td>
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
                  </td>
                  <td>{loan.user?.username}</td>
                  <td>${loan.amount.toLocaleString()}</td>
                  <td>{loan.purpose}</td>
                  <td>{new Date(loan.created_at).toLocaleDateString()}</td>
                  <td>{loan.updated_at ? new Date(loan.updated_at).toLocaleDateString() : '-'}</td>
                  <td>
                    <span className="status-badge rejected">
                      {loan.rejection_reason || 'N/A'}
                    </span>
                  </td>
                  <td>{loan.reviewed_by ? `Admin #${loan.reviewed_by}` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}


export default AdminDashboard;

