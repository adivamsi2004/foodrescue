import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, Check, Trash2, Calendar, MessageSquare, AlertCircle } from 'lucide-react';

export const NotificationsList: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, loading } = useNotifications();

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'CLAIM': return <MessageSquare className="w-4.5 h-4.5 text-emerald-600" />;
      case 'STATUS_CHANGE': return <Bell className="w-4.5 h-4.5 text-indigo-600" />;
      default: return <AlertCircle className="w-4.5 h-4.5 text-stone-500" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-6 animate-fade-in" id="notifications-panel">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">Your Notifications</h2>
          <p className="text-xs text-stone-500">Track real-time coordination and platform events.</p>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/60 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
            id="mark-all-read-btn"
          >
            <Check className="w-3.5 h-3.5" />
            Mark All Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-14 bg-stone-50 animate-pulse rounded-xl"></div>
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3" id="notifications-list-container">
          {notifications.map((notif) => (
            <div 
              key={notif.id}
              className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 justify-between ${
                notif.isRead 
                  ? 'bg-white border-stone-100 opacity-75' 
                  : 'bg-emerald-50/20 border-emerald-100 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${
                  notif.isRead ? 'bg-stone-50 text-stone-400' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {getNotifIcon(notif.type)}
                </div>

                <div className="space-y-1">
                  <p className={`text-xs font-extrabold ${notif.isRead ? 'text-stone-700' : 'text-emerald-950'}`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-stone-500 leading-relaxed">{notif.message}</p>
                  <span className="text-[9px] font-semibold text-stone-400 block flex items-center gap-1 pt-1">
                    <Calendar className="w-3 h-3" />
                    {notif.createdAt ? new Date(notif.createdAt.toDate ? notif.createdAt.toDate() : notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </span>
                </div>
              </div>

              {!notif.isRead && (
                <button
                  onClick={() => markAsRead(notif.id!)}
                  className="text-xs font-bold text-stone-400 hover:text-emerald-600 bg-stone-50 hover:bg-emerald-50 p-1 rounded-md shrink-0 transition-colors cursor-pointer"
                  title="Mark as read"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-stone-200 py-16 text-center space-y-3" id="notifications-empty-state">
          <div className="w-12 h-12 rounded-full bg-stone-50 text-stone-400 flex items-center justify-center mx-auto">
            🔔
          </div>
          <p className="text-xs text-stone-500 font-medium">You have zero unread notifications.</p>
        </div>
      )}

    </div>
  );
};
