import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [pendingLoans, setPendingLoans] = useState([]);
  const [approvedLoans, setApprovedLoans] = useState([]);
  const [rejectedLoans, setRejectedLoans] = useState([]);
  const [reasons, setReasons] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchPendingLoans();
    fetchApprovedLoans();
    fetchRejectedLoans();
    fetchRejectionReasons();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/loans');
      const loans = response.data.loans;
      setStats({
        total: loans.length,
        pending: loans.filter(l => l.status === 'pending').length,
        approved: loans.filter(l => l.status === 'approved').length,
        rejected: loans.filter(l => l.status === 'rejected').length,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchPendingLoans = async () => {
    try {
      const response = await api.get('/admin/loans/pending');
      setPendingLoans(response.data.loans);
    } catch (error) {
      console.error('Failed to fetch pending loans:', error);
    }
  };

  const fetchApprovedLoans = async () => {
    try {
      const response = await api.get('/loans');
      const loans = response.data.loans || [];
      console.log('All loans fetched for approved:', loans.length);
      const approved = loans
        .filter(l => l.status === 'approved')
        .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
      console.log('Approved loans filtered:', approved.length, approved.map(l => ({ id: l.id, status: l.status })));
      // Use functional update to ensure React detects the change
      setApprovedLoans(prev => {
        const newApproved = [...approved];
        console.log('Setting approved loans:', newApproved.length);
        return newApproved;
      });
    } catch (error) {
      console.error('Failed to fetch approved loans:', error);
    }
  };

  const fetchRejectedLoans = async () => {
    try {
      const response = await api.get('/loans');
      const loans = response.data.loans || [];
      console.log('All loans fetched for rejected:', loans.length);
      const rejected = loans
        .filter(l => l.status === 'rejected')
        .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
      console.log('Rejected loans filtered:', rejected.length, rejected.map(l => ({ id: l.id, status: l.status })));
      // Use functional update to ensure React detects the change
      setRejectedLoans(prev => {
        const newRejected = [...rejected];
        console.log('Setting rejected loans:', newRejected.length);
        return newRejected;
      });
    } catch (error) {
      console.error('Failed to fetch rejected loans:', error);
    }
  };

  const fetchRejectionReasons = async () => {
    try {
      const response = await api.get('/admin/rejection-reasons');
      setReasons(response.data.reasons);
    } catch (error) {
      console.error('Failed to fetch rejection reasons:', error);
    }
  };

  const handleApprove = async (loanId, adminNotes = '') => {
    try {
      const response = await api.post(`/admin/loans/${loanId}/approve`, { admin_notes: adminNotes });
      console.log('Approval response:', response.data);
      // Small delay to ensure database is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      // Refresh stats and all loan lists
      await Promise.all([
        fetchStats(),
        fetchPendingLoans(),
        fetchApprovedLoans(),
        fetchRejectedLoans()
      ]);
      alert('Loan approved successfully!');
    } catch (error) {
      console.error('Approval error:', error);
      alert(error.response?.data?.error || 'Failed to approve loan');
    }
  };

  const handleReject = async (loanId, rejectionReason, adminNotes = '') => {
    if (!rejectionReason) {
      alert('Please select a rejection reason');
      return;
    }
    try {
      const response = await api.post(`/admin/loans/${loanId}/reject`, {
        rejection_reason: rejectionReason,
        admin_notes: adminNotes,
      });
      console.log('Rejection response:', response.data);
      // Small delay to ensure database is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      // Refresh stats and all loan lists
      await Promise.all([
        fetchStats(),
        fetchPendingLoans(),
        fetchApprovedLoans(),
        fetchRejectedLoans()
      ]);
      alert('Loan rejected successfully!');
    } catch (error) {
      console.error('Rejection error:', error);
      alert(error.response?.data?.error || 'Failed to reject loan');
    }
  };

  return (
    <div className="container">
      <h1>Admin Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <div className="card">
          <h3>Total Loans</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.total}</p>
        </div>
        <div className="card">
          <h3>Pending Review</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffc107' }}>{stats.pending}</p>
        </div>
        <div className="card">
          <h3>Approved</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>{stats.approved}</p>
        </div>
        <div className="card">
          <h3>Rejected</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc3545' }}>{stats.rejected}</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h2>Pending Loans ({pendingLoans.length})</h2>
        {pendingLoans.length === 0 ? (
          <p>No pending loans.</p>
        ) : (
          <table className="table">
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
                        style={{ color: '#007bff', textDecoration: 'underline', cursor: 'pointer' }}
                      >
                        {loan.id}
                      </a>
                    </td>
                    <td>{loan.user?.username}</td>
                    <td>${loan.amount.toLocaleString()}</td>
                    <td>{loan.purpose}</td>
                    <td>{new Date(loan.created_at).toLocaleDateString()}</td>
                    <td>
                      <span style={{ color: daysPending >= 4 ? '#dc3545' : '#ffc107', fontWeight: 'bold' }}>
                        {daysPending} day{daysPending !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td>
                      <LoanActionButtons
                        loan={loan}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        reasons={reasons}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h2>Approved Loans ({approvedLoans.length})</h2>
        {approvedLoans.length === 0 ? (
          <p>No approved loans.</p>
        ) : (
          <table className="table">
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
                      style={{ color: '#007bff', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      {loan.id}
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

      <div className="card" style={{ marginTop: '20px' }}>
        <h2>Rejected Loans ({rejectedLoans.length})</h2>
        {rejectedLoans.length === 0 ? (
          <p>No rejected loans.</p>
        ) : (
          <table className="table">
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
                      style={{ color: '#007bff', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      {loan.id}
                    </a>
                  </td>
                  <td>{loan.user?.username}</td>
                  <td>${loan.amount.toLocaleString()}</td>
                  <td>{loan.purpose}</td>
                  <td>{new Date(loan.created_at).toLocaleDateString()}</td>
                  <td>{loan.updated_at ? new Date(loan.updated_at).toLocaleDateString() : '-'}</td>
                  <td>
                    <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
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

function LoanActionButtons({ loan, onApprove, onReject, reasons }) {
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApproveClick = async () => {
    setLoading(true);
    await onApprove(loan.id, adminNotes);
    setShowApprove(false);
    setAdminNotes('');
    setLoading(false);
  };

  const handleRejectClick = async () => {
    if (!rejectionReason) {
      alert('Please select a rejection reason');
      return;
    }
    setLoading(true);
    await onReject(loan.id, rejectionReason, adminNotes);
    setShowReject(false);
    setRejectionReason('');
    setAdminNotes('');
    setLoading(false);
  };

  if (showApprove) {
    return (
      <div style={{ minWidth: '200px' }}>
        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '12px' }}>Admin Notes (optional)</label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows="2"
            style={{ fontSize: '12px', padding: '5px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            className="btn btn-success"
            onClick={handleApproveClick}
            disabled={loading}
            style={{ padding: '5px 10px', fontSize: '12px' }}
          >
            Confirm
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setShowApprove(false);
              setAdminNotes('');
            }}
            style={{ padding: '5px 10px', fontSize: '12px' }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (showReject) {
    return (
      <div style={{ minWidth: '250px' }}>
        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '12px' }}>Reason *</label>
          <select
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            style={{ fontSize: '12px', padding: '5px', width: '100%' }}
            required
          >
            <option value="">Select...</option>
            {reasons.map((reason) => (
              <option key={reason.code} value={reason.code}>
                {reason.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '12px' }}>Admin Notes (optional)</label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows="2"
            style={{ fontSize: '12px', padding: '5px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            className="btn btn-danger"
            onClick={handleRejectClick}
            disabled={loading || !rejectionReason}
            style={{ padding: '5px 10px', fontSize: '12px' }}
          >
            Confirm
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setShowReject(false);
              setRejectionReason('');
              setAdminNotes('');
            }}
            style={{ padding: '5px 10px', fontSize: '12px' }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '5px' }}>
      <button
        className="btn btn-success"
        onClick={() => {
          setShowApprove(true);
          setShowReject(false);
        }}
        style={{ padding: '5px 10px', fontSize: '12px' }}
      >
        Approve
      </button>
      <button
        className="btn btn-danger"
        onClick={() => {
          setShowReject(true);
          setShowApprove(false);
        }}
        style={{ padding: '5px 10px', fontSize: '12px' }}
      >
        Reject
      </button>
    </div>
  );
}

export default AdminDashboard;

