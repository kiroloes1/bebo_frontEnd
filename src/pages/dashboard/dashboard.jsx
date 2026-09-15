import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { showAlert } from '../../services/alert';
import {
  Calendar,
  RefreshCw,
  Loader2,
  Users,
  UserCheck,
  Truck,
  HandCoins,
  ShoppingCart,
  FileText,
  RotateCcw,
  Package,
  PackageX,
  CalendarX2,
  AlarmClockCheck,
  Cloud,
  CheckCircle,
  Settings,
  CloudLightning,
} from 'lucide-react';
import { isLastBackupValid } from '../../services/lastBackupNotification';
import NotificationWidget from '../notification/NotificationWidget';
import NotificationsPanel from '../notification/notification';

// خيارات فترة العرض
const PERIOD_OPTIONS = [
  { value: 'today', label: 'اليوم' },
  { value: 'week', label: 'الأسبوع' },
  { value: 'month', label: 'الشهر' },
  { value: 'custom', label: 'فترة مخصصة' },
];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

      const [showNotifications, setShowNotifications] = useState(false);
    const [isLastBackup, setIsLastBackup] = useState(true);
  const [filters, setFilters] = useState({
    period: 'today',
    from: '',
    to: '',
  });

  
  const MakeSureIsLastBackup = async () => {
    const res = await isLastBackupValid();
    setIsLastBackup(res);
  };

  useEffect(() => {
    MakeSureIsLastBackup();

  }, []);

  // ==========================================
  // جلب بيانات لوحة التحكم
  // ==========================================
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { period, from, to } = filters;
      let url = `/dashboard?period=${period}`;
      if (period === 'custom' && from && to) {
        url += `&from=${from}&to=${to}`;
      }
      const response = await api.get(url);
      if (response.data.success) {
        setData(response.data);
      }
    } catch (error) {
      showAlert({
        title: error.response?.data?.message || 'خطأ في تحميل بيانات لوحة التحكم',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filters.period !== 'custom') fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.period]);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen bg-ligth flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-accent" />
      </div>
    );
  }


  const { customers, suppliers, purchases, invoices, returns, products } = data;

  return (
    <div className="min-h-screen bg-ligth p-4 md:p-8" dir="rtl">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-dark">لوحة التحكم</h1>
          <p className="text-gray-500 font-bold">نظرة عامة على العملاء والموردين والمخزون</p>
      
                  <div className="flex justify-between border-t-1 border-slate-100 my-5 items-center mb-4">
        <h1 className="text-2xl font-bold">لوحة التحكم</h1>
        <NotificationsPanel />
      </div>
        </div>



        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-[#E0E7D0] w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-ligth px-3 rounded-xl border border-gray-300">
            <Calendar className="w-4 h-4 text-brown" />
            <select
              className="bg-transparent p-2 font-bold text-dark outline-none cursor-pointer"
              value={filters.period}
              onChange={(e) => setFilters({ ...filters, period: e.target.value })}
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          

          {filters.period === 'custom' && (
            <div className="flex gap-2">
              <input
                type="date"
                className="p-2 bg-ligth rounded-xl border-none font-bold text-xs"
                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              />
              <input
                type="date"
                className="p-2 bg-ligth rounded-xl border-none font-bold text-xs"
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              />
              <button onClick={fetchDashboardData} className="bg-accent text-white px-3 rounded-xl">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================= أرصدة العملاء والموردين ================= */}
      <SectionTitle>الأرصدة</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-6 mb-8">
      
      <NotificationWidget onViewAll={() => setShowNotifications(true)} />
        <StatCard
          title="عملاء عليهم فلوس لينا"
          value={`${(customers?.oweUsAmount || 0).toLocaleString()} ج.م`}
          count={`${customers?.oweUsCount || 0} عميل`}
          icon={<UserCheck className="text-white" />}
          bgColor="bg-green-600"
          subtitle="مديونين لينا"
        />
        <StatCard
          title="عملاء لهم فلوس عندنا"
          value={`${(customers?.weOweAmount || 0).toLocaleString()} ج.م`}
          count={`${customers?.weOweCount || 0} عميل`}
          icon={<Users className="text-white" />}
          bgColor="bg-red-500"
          subtitle="إحنا مديونين لهم"
        />
        <StatCard
          title="موردين إحنا مديونين لهم"
          value={`${(suppliers?.weOweAmount || 0).toLocaleString()} ج.م`}
          count={`${suppliers?.weOweCount || 0} مورد`}
          icon={<Truck className="text-white" />}
          bgColor="bg-amber-500"
          subtitle="مستحقات موردين"
        />
        <StatCard
          title="موردين مديونين لينا"
          value={`${(suppliers?.oweUsAmount || 0).toLocaleString()} ج.م`}
          count={`${suppliers?.oweUsCount || 0} مورد`}
          icon={<HandCoins className="text-white" />}
          bgColor="bg-blue-500"
          subtitle="دفعات زيادة للموردين"
        />
      </div>

      {/* ================= الحركة خلال الفترة ================= */}
      <SectionTitle>الحركة خلال الفترة المختارة</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="فواتير المشتريات"
          value={purchases?.count || 0}
          icon={<ShoppingCart className="text-white" />}
          bgColor="bg-dark"
          subtitle={`${(purchases?.totalAmount || 0).toLocaleString()} ج.م`}
        />
        <StatCard
          title="فواتير البيع"
          value={invoices?.count || 0}
          icon={<FileText className="text-white" />}
          bgColor="bg-accent"
          subtitle={`${(invoices?.totalAmount || 0).toLocaleString()} ج.م`}
        />
        <StatCard
          title="مرتجعات البيع"
          value={returns?.invoiceReturnsCount || 0}
          icon={<RotateCcw className="text-white" />}
          bgColor="bg-blue-500"
          subtitle={`${(returns?.invoiceReturnsAmount || 0).toLocaleString()} ج.م`}
        />
        <StatCard
          title="مرتجعات المشتريات"
          value={returns?.purchaseReturnsCount || 0}
          icon={<RotateCcw className="text-white" />}
          bgColor="bg-amber-500"
          subtitle={`${(returns?.purchaseReturnsAmount || 0).toLocaleString()} ج.م`}
        />
      </div>

      {/* ================= المخزون ================= */}
      <SectionTitle>المخزون</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="عدد المنتجات"
          value={products?.totalProducts || 0}
          icon={<Package className="text-white" />}
          bgColor="bg-dark"
          subtitle="إجمالي الأصناف"
        />
        <StatCard
          title="الكمية داخل المخزون"
          value={products?.totalStockUnits || 0}
          icon={<Package className="text-white" />}
          bgColor="bg-accent"
          subtitle="إجمالي الوحدات"
        />
        <StatCard
          title="نفذ من المخزون"
          value={products?.outOfStockCount || 0}
          icon={<PackageX className="text-white" />}
          bgColor="bg-red-500"
          subtitle="منتجات محتاجة تعويض"
        />
        <StatCard
          title="منتهي الصلاحية"
          value={products?.expiredCount || 0}
          icon={<CalendarX2 className="text-white" />}
          bgColor="bg-red-600"
          subtitle="لازم تتراجع فورًا"
        />
        <StatCard
          title="قرب على الانتهاء"
          value={products?.nearExpiryCount || 0}
          count={`${products?.nearExpiryPercentage || 0}% من الأصناف`}
          icon={<AlarmClockCheck className="text-white" />}
          bgColor="bg-amber-500"
          subtitle={`خلال ${products?.nearExpiryDays || 30} يوم`}
        />
      </div>

         {/* Backup Status Card */}
      <div className='mt-8'>
        <div className="bg-white p-8 rounded-[1.5rem] border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 ${isLastBackup ? 'bg-green-50' : 'bg-orange-50'} rounded-2xl`}>
                  <Cloud size={32} className={isLastBackup ? 'text-green-600' : 'text-orange-500'} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-dark">النسخ الاحتياطي السحابي</h3>
                  <p className="text-gray-400 font-bold text-sm">تأمين بيانات النظام على Cloud</p>
                </div>
              </div>
              <span className={`px-4 py-1 rounded-full text-xs font-black ${isLastBackup ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {isLastBackup ? 'متصل وآمن' : 'غير متصل'}
              </span>
            </div>

            {isLastBackup ? (
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-dark mb-2">
                  البيانات محمية <span className="text-green-600">بنجاح</span>
                </h2>
                <div className="flex items-center gap-2 text-gray-500 font-bold bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200">
                  <CheckCircle size={20} className="text-green-600" />
                  يتم رفع النسخ التلقائية يوميًا دون تدخل منك.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-red-600 mb-2">
                  تنبيه: حماية <span className="text-dark">معطلة</span>
                </h2>
                <p className="text-gray-500 font-bold text-sm leading-relaxed">
                  النظام لا يقوم بالنسخ الاحتياطي حاليًا. يرجى ربط حسابك لتجنب فقدان البيانات في حالة الطوارئ.
                </p>
                <a
                  href="/setting"
                  className="inline-flex items-center gap-2 bg-dark text-white px-6 py-3 rounded-xl font-black hover:bg-opacity-90 transition-all active:scale-95 shadow-lg shadow-gray-200"
                >
                  <Settings size={18} />
                  ربط الحساب من الإعدادات
                </a>
              </div>
            )}
          </div>
          <CloudLightning
            className={`absolute -left-10 -bottom-10 w-48 h-48 opacity-5 ${isLastBackup ? 'text-green-600' : 'text-red-600'}`}
          />
        </div>
      </div>
    </div>
  );
};

// عنوان قسم
const SectionTitle = ({ children }) => (
  <h2 className="text-lg font-black text-dark mb-3">{children}</h2>
);

// كارت إحصائية
const StatCard = ({ title, value, count, icon, bgColor, subtitle }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-300 flex items-center gap-5 hover:translate-y-[-2px] transition-all duration-300">
    <div className={`p-4 ${bgColor} rounded-xl shadow-lg shrink-0`}>
      {React.cloneElement(icon, { size: 28 })}
    </div>
    <div className="text-right">
      <p className="text-gray-400 font-bold text-xs mb-1">{title}</p>
      <h3 className="text-xl font-black text-dark">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </h3>
      {count && <p className="text-xs font-black text-accent mt-0.5">{count}</p>}
      {subtitle && <p className="text-[10px] text-brown font-bold mt-1">{subtitle}</p>}
    </div>
  </div>
);

export default Dashboard;
