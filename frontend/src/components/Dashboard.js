import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Dashboard() {
  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  useEffect(() => {
    if (user && !user.profile_completed) {
      navigate('/profile');
      return;
    }
    fetchStats();
  }, [user]);

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

  if (!user || !user.profile_completed) {
    return null;
  }

  return (
    <div className="container">
      <h1>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <div className="card">
          <h3>Total Loans</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.total}</p>
        </div>
        <div className="card">
          <h3>Pending</h3>
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
        <h2>Quick Actions</h2>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/loans')}
          style={{ marginRight: '10px' }}
        >
          View My Loans
        </button>
        <button
          className="btn btn-success"
          onClick={() => navigate('/loans?new=true')}
        >
          Apply for New Loan
        </button>
      </div>
    </div>
  );
}

export default Dashboard;

