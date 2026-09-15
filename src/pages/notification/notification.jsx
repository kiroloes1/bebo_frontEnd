// components/Notifications/NotificationsPanel.jsx

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { showAlert } from '../../services/alert';
import {
  Bell,
  Loader2,
  X,
  AlertCircle,
  AlertTriangle,
  Info,
  Package,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const NotificationsPanel = () => {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // حالة التصفية والبحث الجديدة
  const [categoryFilter, setCategoryFilter] = useState('all'); // all | expire | stock
  const [severityFilter, setSeverityFilter] = useState('all'); // all | critical | warning | info
  const [searchQuery, setSearchQuery] = useState('');

  // ==========================================
  // جلب الإشعارات
  // ==========================================
  const fetchNotifications = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await api.get('/notifications');
      if (response.data.success) {
        setNotifications(response.data.notifications || []);
        setStats(response.data.stats || null);
        
        const storedRead = JSON.parse(localStorage.getItem('readNotifications') || '[]');
        const unread = response.data.notifications.filter(
          n => !storedRead.includes(n.id || n._id)
        );
        setUnreadCount(unread.length);
      }
    } catch (error) {
      showAlert({
        title: error.response?.data?.message || 'حدث خطأ أثناء جلب الإشعارات',
        icon: 'error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/notifications/stats');
      if (response.data.success) {
        setStats(response.data.stats);
        setUnreadCount(response.data.stats?.totalNotifications || 0);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchNotifications(true);
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
    markAsRead(id);
  };

  const markAsRead = (id) => {
    const storedRead = JSON.parse(localStorage.getItem('readNotifications') || '[]');
    if (!storedRead.includes(id)) {
      storedRead.push(id);
      localStorage.setItem('readNotifications', JSON.stringify(storedRead));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = () => {
    const ids = notifications.map(n => n.id || n._id);
    localStorage.setItem('readNotifications', JSON.stringify(ids));
    setUnreadCount(0);
    showAlert({
      title: 'تم تحديد جميع الإشعارات كمقروءة',
      icon: 'success',
      timer: 1500,
    });
  };

  // ==========================================
  // تصفية وحفظ البحث المتقدم
  // ==========================================
const getFilteredNotifications = () => {
  return notifications.filter(n => {
    // 1. فلترة حسب التصنيف (الصلاحية vs المخزون)
    if (categoryFilter === 'expire') {
      if (!['expiring_soon', 'expired'].includes(n.type)) return false;

      // إخفاء إشعارات الصلاحية إذا كانت كمية المنتج 0
      if (n.product && n.product.availableQuantity === 0) return false;

    } else if (categoryFilter === 'stock') {
      if (!['out_of_stock', 'low_stock'].includes(n.type)) return false;
    }

    // 2. فلترة حسب الأولوية
    if (severityFilter !== 'all' && n.severity !== severityFilter) {
      return false;
    }

    // 3. فلترة حسب كلمة البحث
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const titleMatch = n.title?.toLowerCase().includes(query);
      const messageMatch = n.message?.toLowerCase().includes(query);
      const productNameMatch = n.product?.productName?.toLowerCase().includes(query);
      const codeMatch = n.product?.code?.toLowerCase().includes(query);

      if (!titleMatch && !messageMatch && !productNameMatch && !codeMatch) {
        return false;
      }
    }

    return true;
  });
};

  const getTypeIcon = (type) => {
    switch (type) {
      case 'out_of_stock':
        return <Package className="w-5 h-5 text-red-500" />;
      case 'low_stock':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'expiring_soon':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'expired':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityColors = (severity) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          icon: 'text-red-500',
          badge: 'bg-red-500',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-700',
          icon: 'text-yellow-500',
          badge: 'bg-yellow-500',
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          icon: 'text-blue-500',
          badge: 'bg-blue-500',
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          icon: 'text-gray-500',
          badge: 'bg-gray-500',
        };
    }
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <div className="relative">
      {/* زر فتح اللوحة */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* اللوحة المنبثقة */}
      {showPanel && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPanel(false)}
          />

          <div className="absolute left-0 top-0 w-full max-w-2xl h-full bg-white shadow-2xl overflow-hidden animate-slideIn">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-6 h-6 text-accent" />
                  <h2 className="text-xl font-bold text-dark">الإشعارات</h2>
                  {stats && (
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {stats.total} إشعار
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchNotifications(false)}
                    disabled={refreshing}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-5 h-5 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-accent font-bold hover:underline"
                    >
                      تحديد الكل كمقروء
                    </button>
                  )}
                  <button
                    onClick={() => setShowPanel(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* شريط البحث */}
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="ابحث باسم المنتج، الكود..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                  >
                    إلغاء
                  </button>
                )}
              </div>

              {/* تصفية النوع (الصلاحية / المخزون) */}
              <div className="flex border-b border-gray-100 gap-4">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'stock', label: 'المخزون' },
                  { id: 'expire', label: 'الصلاحية (Expire)' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setCategoryFilter(tab.id)}
                    className={`pb-2 text-sm font-bold border-b-2 transition-colors ${
                      categoryFilter === tab.id
                        ? 'border-accent text-accent'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* تصفية حسب درجة الأهمية */}
              <div className="flex gap-2">
                {[
                  { id: 'all', label: 'جميع الأولويات' },
                  { id: 'critical', label: 'حرج' },
                  { id: 'warning', label: 'تحذير' },
                  { id: 'info', label: 'معلومات' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSeverityFilter(f.id)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                      severityFilter === f.id
                        ? 'bg-accent text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="h-full overflow-y-auto pb-36 pt-2 px-4">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-10 h-10 animate-spin text-accent" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-16">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-bold">لا توجد إشعارات مطابقة</p>
                  <p className="text-sm text-gray-400">جرب تغيير كلمات البحث أو الفلاتر</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((notification, index) => {
                    const id = notification._id || notification.id || index;
                    const isExpanded = expandedItems[id];
                    const colors = getSeverityColors(notification.severity);
                    const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale: ar,
                    });

                    return (
                      <div
                        key={id}
                        className={`border rounded-xl overflow-hidden transition-all ${colors.border} ${colors.bg}`}
                      >
                        <div
                          className="p-4 cursor-pointer hover:bg-black/5 transition-colors"
                          onClick={() => toggleExpand(id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 shrink-0">
                              {getTypeIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`font-bold text-sm ${colors.text}`}>
                                  {notification.title}
                                </p>
                                <span className={`${colors.badge} w-2 h-2 rounded-full shrink-0 mt-1.5`} />
                              </div>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                <span>{timeAgo}</span>
                                <span>•</span>
                                <span className="capitalize">{notification.type.replace('_', ' ')}</span>
                              </div>
                            </div>
                            <div className="shrink-0">
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>

                        {isExpanded && notification.product && (
                          <div className="px-4 pb-4 pt-2 border-t border-gray-200/50">
                            <div className="bg-white/70 rounded-lg p-3 space-y-2">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-400">المنتج:</span>
                                  <span className="font-bold mr-1">{notification.product.productName}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400">الكود:</span>
                                  <span className="font-mono text-xs mr-1">{notification.product.code}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400">الفئة:</span>
                                  <span className="mr-1">{notification.product.category || '-'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400">الكمية:</span>
                                  <span className="font-bold mr-1">{notification.product.availableQuantity}</span>
                                </div>
                                {notification.product.expiration && (
                                  <div className="col-span-2">
                                    <span className="text-gray-400">تاريخ الانتهاء:</span>
                                    <span className="mr-1">
                                      {format(new Date(notification.product.expiration), 'dd/MM/yyyy')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default NotificationsPanel;