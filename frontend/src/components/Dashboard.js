import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './dashboard.css';

function Dashboard() {
  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && !user.profile_completed) {
      navigate('/profile');
      return;
    }
    if (user && user.profile_completed) {
      fetchStats();
    }
  }, [user, navigate]);

  const fetchStats = async () => {
    setLoading(true);
    setError('');
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
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !user.profile_completed) {
    return null;
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="loading-spinner-large"></div>
          <p className="loading-text">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {user.username}!</h1>
          <p className="dashboard-welcome">Here's an overview of your loan applications</p>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '20px', padding: '12px', borderRadius: '8px', background: '#fee', color: '#c33', border: '1px solid #fcc' }}>
          ⚠️ {error}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Loans</span>
            <span className="stat-card-icon"></span>
          </div>
          <p className="stat-card-value">{stats.total}</p>
          <p className="stat-card-change">All your loan applications</p>
        </div>

        <div className="stat-card pending">
          <div className="stat-card-header">
            <span className="stat-card-title">Pending</span>
            <span className="stat-card-icon"></span>
          </div>
          <p className="stat-card-value">{stats.pending}</p>
          <p className="stat-card-change">Awaiting review</p>
        </div>

        <div className="stat-card approved">
          <div className="stat-card-header">
            <span className="stat-card-title">Approved</span>
            <span className="stat-card-icon"></span>
          </div>
          <p className="stat-card-value">{stats.approved}</p>
          <p className="stat-card-change">Successfully approved</p>
        </div>

        <div className="stat-card rejected">
          <div className="stat-card-header">
            <span className="stat-card-title">Rejected</span>
            <span className="stat-card-icon"></span>
          </div>
          <p className="stat-card-value">{stats.rejected}</p>
          <p className="stat-card-change">Not approved</p>
        </div>
      </div>

      <div className="quick-actions-card">
        <h2>Quick Actions</h2>
        <div className="quick-actions">
          <button
            className="btn-action btn-action-primary"
            onClick={() => navigate('/loans')}
          >
            <span></span>
            View My Loans
          </button>
          <button
            className="btn-action btn-action-success"
            onClick={() => navigate('/loans?new=true')}
          >
            <span></span>
            Apply for New Loan
          </button>
          <button
            className="btn-action btn-action-secondary"
            onClick={() => navigate('/profile')}
          >
            <span></span>
            Update Profile
          </button>
        </div>
      </div>

      {stats.total === 0 && (
        <div className="quick-actions-card">
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <p className="empty-state-text">You haven't applied for any loans yet</p>
            <p className="empty-state-subtext">Get started by applying for your first loan</p>
            <button
              className="btn-action btn-action-success"
              onClick={() => navigate('/loans?new=true')}
              style={{ marginTop: '20px' }}
            >
              <span></span>
              Apply for Your First Loan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

