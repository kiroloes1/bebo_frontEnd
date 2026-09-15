// components/Notifications/NotificationWidget.jsx

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Bell,
  AlertCircle,
  AlertTriangle,
  Info,
  Package,
  Clock,
  Loader2,
} from 'lucide-react';

const NotificationWidget = ({ onViewAll }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    
    // تحديث كل 30 ثانية
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/notifications/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 -sm border border-gray-200">
        <div className="flex items-center justify-center h-20">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  const hasNotifications = stats?.totalNotifications > 0;

  return (
    <div 
      className="bg-white rounded-xl p-4 -sm border border-gray-200 hover:-md transition-all cursor-pointer"
      onClick={onViewAll}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className={`w-5 h-5 ${hasNotifications ? 'text-accent' : 'text-gray-400'}`} />
          <h3 className="font-bold text-dark">الإشعارات</h3>
        </div>
        {hasNotifications && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {stats.totalNotifications}
          </span>
        )}
      </div>

      {!hasNotifications ? (
        <p className="text-sm text-gray-400 text-center py-4">
          🎉 لا توجد إشعارات جديدة
        </p>
      ) : (
        <div className="space-y-2">
          {/* إشعارات حرجة */}
          {stats.critical > 0 && (
            <div className="flex items-center justify-between bg-red-50 p-2 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-bold text-red-700">حرجة</span>
              </div>
              <span className="text-sm font-bold text-red-700">{stats.critical}</span>
            </div>
          )}

          {/* إشعارات تحذير */}
          {stats.warning > 0 && (
            <div className="flex items-center justify-between bg-yellow-50 p-2 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-bold text-yellow-700">تحذير</span>
              </div>
              <span className="text-sm font-bold text-yellow-700">{stats.warning}</span>
            </div>
          )}

          {/* تفاصيل سريعة */}
          <div className="grid grid-cols-2 gap-1 mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              <span>نفذ: {stats.details?.outOfStock || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>منخفض: {stats.details?.lowStock || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>ينتهي: {stats.details?.expiringSoon || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>منتهي: {stats.details?.expired || 0}</span>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default NotificationWidget;