import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Bell, CheckCircle2, AlertTriangle, Info, CheckCheck, RefreshCw, AlertCircle } from 'lucide-react';
import type { INotification } from '@govconnect/shared-types';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => ((n._id || n.id) === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle2 size={18} color="#059669" />;
      case 'WARNING':
      case 'ERROR':
      case 'ACTION':
        return <AlertTriangle size={18} color="#dc2626" />;
      case 'INFO':
      default:
        return <Info size={18} color="#1d4ed8" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return '#ecfdf5';
      case 'WARNING':
      case 'ERROR':
      case 'ACTION':
        return '#fef2f2';
      case 'INFO':
      default:
        return '#eff6ff';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>
            Notifications & Multi-Channel Alerts
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: 4 }}>
            Direct updates from reviewing officers, automated inter-agency gateway processors, and background queues.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-secondary"
            onClick={fetchNotifications}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          {unreadCount > 0 && (
            <button
              className="btn-outline"
              onClick={handleMarkAllAsRead}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <CheckCheck size={16} />
              <span>Mark All as Read ({unreadCount})</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #ef4444',
            borderRadius: 8,
            color: '#991b1b',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <AlertCircle size={18} color="#ef4444" />
          <span>{error}</span>
        </div>
      )}

      <div className="gov-card" style={{ padding: 24 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p>Loading notification feed...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
            <Bell size={32} style={{ margin: '0 auto 12px', color: '#94a3b8' }} />
            <p style={{ fontWeight: 600, color: '#334155' }}>No Notifications</p>
            <p style={{ fontSize: '0.8125rem', marginTop: 4 }}>
              You are all caught up! Real-time application updates and queue alerts will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {notifications.map((n) => {
              const notifId = (n._id || n.id) as string;
              return (
                <div
                  key={notifId}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    background: n.read ? '#ffffff' : '#f8fafc',
                    border: '1px solid',
                    borderColor: n.read ? '#e2e8f0' : '#bfdbfe',
                    borderRadius: 10,
                    gap: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 8,
                        background: getBgColor(n.type),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {getIcon(n.type)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.9375rem', color: '#0f172a' }}>{n.title}</strong>
                        {!n.read && (
                          <span
                            style={{
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              border: '1px solid #bfdbfe',
                            }}
                          >
                            NEW
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.875rem', color: '#334155', marginTop: 4, lineHeight: 1.5 }}>
                        {n.message}
                      </p>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
                        {new Date(n.createdAt || Date.now()).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {!n.read && (
                    <button
                      className="btn-outline"
                      style={{ padding: '4px 10px', fontSize: '0.75rem', flexShrink: 0 }}
                      onClick={() => handleMarkAsRead(notifId)}
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
