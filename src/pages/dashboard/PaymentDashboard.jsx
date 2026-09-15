import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { showAlert } from '../../services/alert';
import {
  Calendar,
  RefreshCw,
  Loader2,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  Banknote,
  Smartphone,
  Landmark,
  Clock3,
  Receipt,
  HandCoins,
  FileText,
  ShoppingCart,
  BarChart3,
} from 'lucide-react';
import ExportExcelButton from '../../services/ExportExcelButton';

// خيارات فترة العرض
const PERIOD_OPTIONS = [
  { value: 'today', label: 'اليوم' },
  { value: 'week', label: 'الأسبوع' },
  { value: 'month', label: 'الشهر' },
  { value: 'custom', label: 'فترة مخصصة' },
];

// أسماء وأيقونات طرق الدفع
const METHOD_LABELS = {
  cash: { label: 'نقدي', icon: Banknote },
  wallet: { label: 'محفظة إلكترونية', icon: Smartphone },
  instapay: { label: 'إنستاباي', icon: Landmark },
  work: { label: 'آجل', icon: Clock3 },
};

// أسماء وأيقونات أنواع العمليات
const MODULE_LABELS = {
  pay: { label: 'دفعة', icon: HandCoins },
  debt: { label: 'مديونية', icon: Receipt },
  invoices: { label: 'فواتير بيع', icon: FileText },
  purchase: { label: 'مشتريات', icon: ShoppingCart },
  purchases: { label: 'مشتريات', icon: ShoppingCart },
};

const PaymentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    period: 'today',
    from: '',
    to: '',
  });

  // ==========================================
  // جلب بيانات لوحة المدفوعات
  // ==========================================
  const fetchPaymentsDashboard = async () => {
    setLoading(true);
    try {
      const { period, from, to } = filters;
      let url = `/paymentDashboard?period=${period}`;
      if (period === 'custom' && from && to) {
        url += `&from=${from}&to=${to}`;
      }
      const response = await api.get(url);
      if (response.data.success) {
        setData(response.data);
      }
    } catch (error) {
      showAlert({
        title: error.response?.data?.message || 'خطأ في تحميل بيانات لوحة المدفوعات',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filters.period !== 'custom') fetchPaymentsDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.period]);

  useEffect(() => {
    fetchPaymentsDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen bg-ligth flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-accent" />
      </div>
    );
  }

  const { summary, byMethod, byModule, dailyTrend } = data;
  const maxDayAmount = Math.max(1, ...dailyTrend.map((d) => Math.max(d.incoming, d.outgoing)));

  return (
    <div className="min-h-screen bg-ligth p-4 md:p-8" dir="rtl">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-dark">لوحة المدفوعات</h1>
          <p className="text-gray-500 font-bold">نظرة عامة على الوارد والمنصرف</p>
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
              <button onClick={fetchPaymentsDashboard} className="bg-accent text-white px-3 rounded-xl">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================= الإجمالي العام ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
        <StatCard
          title="إجمالي الوارد"
          value={`${(summary.totalIncoming || 0).toLocaleString()} ج.م`}
          count={`${summary.incomingCount || 0} عملية`}
          icon={<ArrowDownCircle className="text-white" />}
          bgColor="bg-green-600"
          subtitle="فلوس داخلة"
        />
        <StatCard
          title="إجمالي المنصرف"
          value={`${(summary.totalOutgoing || 0).toLocaleString()} ج.م`}
          count={`${summary.outgoingCount || 0} عملية`}
          icon={<ArrowUpCircle className="text-white" />}
          bgColor="bg-red-500"
          subtitle="فلوس خارجة"
        />

      </div>

      {/* ================= تفصيل حسب طريقة الدفع ================= */}
      <div  className='flex justify-between my-2'>
              <SectionTitle>حسب طريقة الدفع</SectionTitle>
      <ExportExcelButton
          data={byMethod}
          fileName="طرق الدفع في السيستم"
          sheetName="'طرق الدفع في السيستم"
      />
      </div>
      <div className="bg-white rounded-2xl border border-brwonLight shadow-sm overflow-hidden mb-8">
        {byMethod.length === 0 ? (
          <EmptyState text="لا توجد مدفوعات في الفترة المختارة" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-ligth/40 text-dark font-black text-xs border-b border-brown/10">
                  <th className="p-4">طريقة الدفع</th>
                  <th className="p-4">الوارد</th>
                  <th className="p-4">المنصرف</th>
                  <th className="p-4">الصافي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown/5 text-sm font-bold text-dark">
                {byMethod.map((row) => {
                  const meta = METHOD_LABELS[row.method] || { label: row.method, icon: Wallet };
                  const Icon = meta.icon;
                  const net = row.incomingAmount - row.outgoingAmount;
                  return (
                    <tr key={row.method} className="hover:bg-ligth/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-ligth rounded-md text-brown">
                            <Icon size={16} />
                          </div>
                          {meta.label}
                        </div>
                      </td>
                      <td className="p-4 text-green-700">
                        {row.incomingAmount.toLocaleString()} ج.م
                        <span className="text-xs text-dark/40 font-bold block">{row.incomingCount} عملية</span>
                      </td>
                      <td className="p-4 text-red-600">
                        {row.outgoingAmount.toLocaleString()} ج.م
                        <span className="text-xs text-dark/40 font-bold block">{row.outgoingCount} عملية</span>
                      </td>
                      <td className={`p-4 font-black ${net >= 0 ? 'text-dark' : 'text-red-600'}`}>
                        {net.toLocaleString()} ج.م
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= تفصيل حسب نوع العملية ================= */}

            <div  className='flex justify-between my-2'>
      <SectionTitle>حسب نوع العملية</SectionTitle>
      <ExportExcelButton
          data={byModule}
          fileName="  نوع العملية في السيستم"
          sheetName=" نوع العملية في السيستم"
      />
      </div>
      <div className="bg-white rounded-2xl border border-brwonLight shadow-sm overflow-hidden mb-8">
        {byModule.length === 0 ? (
          <EmptyState text="لا توجد عمليات في الفترة المختارة" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-ligth/40 text-dark font-black text-xs border-b border-brown/10">
                  <th className="p-4">نوع العملية</th>
                  <th className="p-4">الوارد</th>
                  <th className="p-4">المنصرف</th>
                  <th className="p-4">الصافي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown/5 text-sm font-bold text-dark">
                {byModule.map((row) => {
                  const meta = MODULE_LABELS[row.module] || { label: row.module, icon: Receipt };
                  const Icon = meta.icon;
                  const net = row.incomingAmount - row.outgoingAmount;
                  return (
                    <tr key={row.module} className="hover:bg-ligth/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-ligth rounded-md text-brown">
                            <Icon size={16} />
                          </div>
                          {meta.label}
                        </div>
                      </td>
                      <td className="p-4 text-green-700">
                        {row.incomingAmount.toLocaleString()} ج.م
                        <span className="text-xs text-dark/40 font-bold block">{row.incomingCount} عملية</span>
                      </td>
                      <td className="p-4 text-red-600">
                        {row.outgoingAmount.toLocaleString()} ج.م
                        <span className="text-xs text-dark/40 font-bold block">{row.outgoingCount} عملية</span>
                      </td>
                      <td className={`p-4 font-black ${net >= 0 ? 'text-dark' : 'text-red-600'}`}>
                        {net.toLocaleString()} ج.م
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= الحركة اليومية ================= */}
      <SectionTitle>الحركة </SectionTitle>
      <div className="bg-white rounded-2xl border border-brwonLight shadow-sm p-6 mb-8">
        {dailyTrend.length === 0 ? (
          <EmptyState text="لا توجد حركة في الفترة المختارة" />
        ) : (
          <div className="space-y-3">
            {dailyTrend.map((day) => (
              <div key={day.date} className="space-y-1">
                <div className="flex justify-between items-center text-xs font-black text-dark">
                  <span className="flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-brown" />
                    {day.date}
                  </span>
                  <span className="text-dark/50">
                    وارد {day.incoming.toLocaleString()} / منصرف {day.outgoing.toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-1 h-2.5">
                  <div
                    className="bg-green-500 rounded-full transition-all"
                    style={{ width: `${(day.incoming / maxDayAmount) * 100}%` }}
                  />
                  <div
                    className="bg-red-400 rounded-full transition-all"
                    style={{ width: `${(day.outgoing / maxDayAmount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// عنوان قسم
const SectionTitle = ({ children }) => (
  <h2 className="text-lg font-black text-dark mb-3">{children}</h2>
);

// حالة فارغة
const EmptyState = ({ text }) => (
  <div className="text-center py-16 text-dark/40">
    <p className="text-sm font-bold">{text}</p>
  </div>
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

export default PaymentDashboard;
