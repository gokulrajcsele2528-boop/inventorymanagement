import React from 'react';
import { Database, Server, Cpu, ShieldCheck, HardDrive, Terminal } from 'lucide-react';

export default function Settings({ user }) {
  const displayName = user?.fullName || user?.full_name || user?.name || 'User';
  const displayEmail = user?.email || '';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
      {/* Database & Architecture Card */}
      <div className="panel-card">
        <div className="panel-title" style={{ marginBottom: '1.25rem' }}>
          <Database size={20} style={{ color: 'var(--primary)' }} />
          <span>Database & Connection</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
          <div style={{ background: 'var(--bg-muted)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
              <HardDrive size={16} color="var(--primary)" />
              <span>PostgreSQL Database Schema</span>
            </div>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              <li><strong>users:</strong> id, full_name, email, password_hash, created_at, updated_at</li>
              <li><strong>products:</strong> id, user_id, product_name, product_id, category, supplier, price, quantity, minimum_stock, created_at, updated_at</li>
              <li><strong>inventory_history:</strong> id, user_id, product_id, action, quantity, created_at</li>
            </ul>
          </div>

          <div>
            <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Database Configuration (.env):</span>
            <code style={{ display: 'block', padding: '0.75rem', background: '#0f172a', color: '#38bdf8', borderRadius: '6px', fontSize: '0.8rem', wordBreak: 'break-all' }}>
              DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inventory_db
            </code>
          </div>
        </div>
      </div>

      {/* Tech Stack Card */}
      <div className="panel-card">
        <div className="panel-title" style={{ marginBottom: '1.25rem' }}>
          <Cpu size={20} style={{ color: 'var(--primary)' }} />
          <span>Full-Stack Architecture</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div className="activity-item">
            <div className="activity-info">
              <div className="activity-icon-badge" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <Server size={16} />
              </div>
              <div className="activity-meta">
                <span className="activity-title">Frontend</span>
                <span className="activity-subtitle">React 18 + Vite + Lucide Icons + Axios</span>
              </div>
            </div>
            <span className="badge badge-in-stock">Port 5173</span>
          </div>

          <div className="activity-item">
            <div className="activity-info">
              <div className="activity-icon-badge" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                <Terminal size={16} />
              </div>
              <div className="activity-meta">
                <span className="activity-title">Backend API</span>
                <span className="activity-subtitle">Python 3 + Flask + Flask-CORS + JWT Auth + SQLAlchemy</span>
              </div>
            </div>
            <span className="badge badge-in-stock">Port 5000</span>
          </div>

          <div className="activity-item">
            <div className="activity-info">
              <div className="activity-icon-badge" style={{ background: '#ecfdf5', color: '#059669' }}>
                <Database size={16} />
              </div>
              <div className="activity-meta">
                <span className="activity-title">Relational Database</span>
                <span className="activity-subtitle">PostgreSQL with Psycopg Driver</span>
              </div>
            </div>
            <span className="badge badge-in-stock">Port 5432</span>
          </div>
        </div>
      </div>

      {/* User & Session Information */}
      <div className="panel-card">
        <div className="panel-title" style={{ marginBottom: '1.25rem' }}>
          <ShieldCheck size={20} style={{ color: 'var(--primary)' }} />
          <span>Active Authenticated Session</span>
        </div>

        <div style={{ fontSize: '0.875rem', lineHeight: '1.8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Logged In User:</span>
            <strong>{displayName}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Email:</span>
            <strong>{displayEmail}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Authentication:</span>
            <span className="badge badge-in-stock">Active JWT Session</span>
          </div>
        </div>
      </div>
    </div>
  );
}
