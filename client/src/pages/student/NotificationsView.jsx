import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { Bell, Check, CheckCheck, ArrowRight, MessageSquare, Award, Clock } from 'lucide-react';

export function NotificationsView() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNotifs() {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.notifications || []);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        setLoading(false);
      }
    }
    loadNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read', {});
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkOne = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`, {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-text-muted">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm">Loading activity updates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Notifications
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Updates on doubt answers, quiz scores, and homework reviews.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="py-12 text-center text-sm text-text-muted bg-surface rounded-lg border border-border p-6">
            No notifications yet. You will receive updates here when your tutor answers doubts or grades homework.
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleMarkOne(notif.id)}
              className={`p-4 rounded-lg border transition-colors flex items-start justify-between gap-3 ${
                notif.isRead
                  ? 'bg-surface border-border opacity-85'
                  : 'bg-accent-soft/30 border-accent/40 shadow-2xs'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-text">
                    {notif.title}
                  </span>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                  )}
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  {notif.body}
                </p>
                <span className="text-[11px] text-text-muted block pt-1">
                  {new Date(notif.createdAt).toLocaleDateString()}
                </span>
              </div>

              {notif.targetUrl && (
                <Link
                  to={notif.targetUrl}
                  className="p-1.5 rounded-md hover:bg-surface-muted text-accent shrink-0"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
