import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';
import { showAlert } from '../../services/alert';
import {
  Calendar,
  RefreshCw,
  Loader2,
  ShoppingCart,
  CreditCard,
  RotateCcw,
  PackageCheck,
  AlertCircle,
  Tag,
  Wallet,
  ArrowDownCircle,
  Search,
  ShoppingBag,
} from 'lucide-react';
import ExportExcelButton from '../../services/ExportExcelButton';

const PERIOD_OPTIONS = [
  { value: 'today', label: 'اليوم' },
  { value: 'week', label: 'الأسبوع' },
  { value: 'month', label: 'الشهر' },
  { value: 'custom', label: 'فترة مخصصة' },
];

const PurchasesReport = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // States للـ Pagination والبحث
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');

  // قوائم المنتجات
  const [topPurchasedProducts, setTopPurchasedProducts] = useState([]);
  const [topReturnedProducts, setTopReturnedProducts] = useState([]);

  const [filters, setFilters] = useState({
    period: 'today',
    from: '',
    to: '',
  });

  // إعادة ضبط حالة القوائم عند تغيير الفلاتر أو البحث
  const resetData = useCallback(() => {
    setPage(1);
    setHasMore(true);
    setTopPurchasedProducts([]);
    setTopReturnedProducts([]);
  }, []);

  useEffect(() => {
    resetData();
  }, [filters.period, search, resetData]);

  // ==========================================
  // جلب بيانات تقرير المشتريات
  // ==========================================
  const fetchPurchasesReport = async (pageNum = 1, isNewQuery = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const limit = 10;
      const { period, from, to } = filters;
      let url = `/reports/purchase/purchasesReport?period=${period}&page=${pageNum}&limit=${limit}&search=${encodeURIComponent(
        search
      )}`;

      if (period === 'custom' && from && to) {
        url += `&from=${from}&to=${to}`;
      }

      const response = await api.get(url);
      if (response.data.success) {
        const resData = response.data;
        setData(resData);

        const newPurchased = resData.topPurchasedProducts?.items || [];
        const newReturned = resData.topReturnedProducts?.items || [];

        setTopPurchasedProducts((prev) =>
          isNewQuery || pageNum === 1 ? newPurchased : [...prev, ...newPurchased]
        );
        setTopReturnedProducts((prev) =>
          isNewQuery || pageNum === 1 ? newReturned : [...prev, ...newReturned]
        );

        setHasMore(newPurchased.length === limit || newReturned.length === limit);
      }
    } catch (error) {
      showAlert({
        title: error.response?.data?.message || 'حدث خطأ أثناء جلب تقرير المشتريات',
        icon: 'error',
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (filters.period !== 'custom' || (filters.from && filters.to)) {
      const timer = setTimeout(() => {
        fetchPurchasesReport(page, page === 1);
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [filters.period, filters.from, filters.to, search, page]);

  // ==========================================
  // Infinite Scroll Observer Implementation
  // ==========================================
  const observer = useRef();
  const lastElementRef = useCallback(
    (node) => {
      if (loading || loadingMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, loadingMore, hasMore]
  );

  const { purchases, payments, returns } = data || {};

  return (
    <div className="w-[96vw] overview-auto md:w-full min-h-screen bg-ligth p-4 md:p-8" dir="rtl">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-dark">تقرير المشتريات والمدفوعات</h1>
          <p className="text-gray-500 font-bold">ملخص فواتير الشراء، مدفوعات الموردين، والمنتجات الواردة</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-[#E0E7D0] w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-ligth px-3 rounded-xl border border-gray-300">
            <Calendar className="w-4 h-4 text-brown" />
            <select
              className="bg-transparent p-2 font-bold text-dark outline-none cursor-pointer text-sm"
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
                className="p-2 bg-ligth rounded-xl border-none font-bold text-xs outline-none"
                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              />
              <input
                type="date"
                className="p-2 bg-ligth rounded-xl border-none font-bold text-xs outline-none"
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              />
              <button
                onClick={() => {
                  resetData();
                  fetchPurchasesReport(1, true);
                }}
                className="bg-accent text-white px-3 rounded-xl hover:opacity-90 transition-opacity"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================= شريط البحث ================= */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="ابحث باسم المنتج أو الكود..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-white rounded-xl border border-gray-300 font-bold text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      {loading && !data ? (
        <div className="py-20 flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-accent" />
        </div>
      ) : (
        <>
          {/* ================= الإحصائيات الرئيسية ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="إجمالي المشتريات"
              value={`${(purchases?.finalPrice || 0).toLocaleString()} ج.م`}
              count={`${purchases?.purchasesCount || 0} فاتورة شراء`}
              subtitle={`خصومات الموردين: ${(purchases?.totalDiscount || 0).toLocaleString()} ج.م`}
              icon={<ShoppingCart className="text-white" />}
              bgColor="bg-indigo-600"
            />
            <StatCard
              title="المدفوع الفعلي للموردين"
              value={`${(payments?.totalPaid || 0).toLocaleString()} ج.م`}
              subtitle="إجمالي النقدية الخارجة"
              icon={<CreditCard className="text-white" />}
              bgColor="bg-teal-600"
            />
            <StatCard
              title="صافي المشتريات  "
              value={`${(purchases?.netPurchasesAfterReturns || 0).toLocaleString()} ج.م`}
              subtitle="صافي تكلفة البضاعة الواردة"
              icon={<ArrowDownCircle className="text-white" />}
              bgColor="bg-blue-700"
            />

          </div>

          {/* ================= وسائل الدفع للموردين ================= */}
          {payments?.byMethod && payments.byMethod.length > 0 && (
            <div className="mb-8 bg-white p-6 rounded-2xl border border-brwonLight shadow-sm">
              <SectionTitle icon={<Wallet className="text-teal-600" />}>
                تفاصيل مدفوعات الموردين حسب طريقة الدفع
              </SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                {payments.byMethod.map((pay, idx) => (
                  <div
                    key={idx}
                    className="bg-ligth/50 p-4 rounded-xl border border-brown/10 flex justify-between items-center"
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">{pay.method || 'غير محدد'}</p>
                      <p className="text-base font-black text-dark mt-1">
                        {pay.totalAmount.toLocaleString()} ج.م
                      </p>
                    </div>
                    <span className="text-xs bg-white px-2 py-1 rounded-md border font-bold text-gray-600">
                      {pay.count} عملية
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= جدول المنتجات الأكثر شراءً ================= */}
          <div className="mb-8">

                       <div className='flex justify-between my-2'>
            <SectionTitle icon={<PackageCheck className="text-blue-600" />}>
              الأصناف الأكثر شراءً (الواردة)
            </SectionTitle>
                            <ExportExcelButton
                    data={
                      topPurchasedProducts

                    }
                    fileName= "الأصناف الأكثر شراءً "
                    sheetName="الأصناف الأكثر شراءً "
                  />
           </div>
            <div className="bg-white rounded-2xl border border-brwonLight shadow-sm overflow-hidden">
              {topPurchasedProducts.length === 0 ? (
                <EmptyState text="لا توجد عمليات شراء مسجلة خلال هذه الفترة" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-ligth/40 text-dark font-black text-xs border-b border-brown/10">
                        <th className="p-4">الكود</th>
                        <th className="p-4">اسم المنتج</th>
                        <th className="p-4">الكمية المشترات</th>
                        <th className="p-4">إجمالي التكلفة</th>
                        <th className="p-4">عدد مرات الشراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brown/5 text-sm font-bold text-dark">
                      {topPurchasedProducts.map((item, idx) => {
                        const isLastItem = idx === topPurchasedProducts.length - 1;
                        return (
                          <tr
                            key={item.product || idx}
                            ref={isLastItem ? lastElementRef : null}
                            className="hover:bg-ligth/20 transition-colors"
                          >
                            <td className="p-4 font-mono text-xs text-gray-500">{item.code || '-'}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-ligth rounded-md text-brown">
                                  <ShoppingBag size={16} />
                                </div>
                                {item.productName}
                              </div>
                            </td>
                            <td className="p-4 text-indigo-700 font-black">{item.totalQuantity}</td>
                            <td className="p-4 text-teal-700 font-black">
                              {(item.totalCost || 0).toLocaleString()} ج.م
                            </td>
                            <td className="p-4 text-gray-600">{item.timesPurchased} مرة</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ================= جدول المنتجات الأكثر إرجاعاً للموردين ================= */}
          <div>
   
                                   <div className='flex justify-between my-2'>
         <SectionTitle icon={<AlertCircle className="text-rose-600" />}>
              الأصناف الأكثر إرجاعاً للموردين
            </SectionTitle>
                            <ExportExcelButton
                    data={
                      topReturnedProducts

                    }
                    fileName= " الأصناف الأكثر إرجاعاً للموردين"
                    sheetName=" الأصناف الأكثر إرجاعاً للموردين"
                  />
           </div>
            <div className="bg-white rounded-2xl border border-brwonLight shadow-sm overflow-hidden mb-8">
              {topReturnedProducts.length === 0 ? (
                <EmptyState text="لا توجد مرتجعات مشتريات مسجلة خلال هذه الفترة" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-ligth/40 text-dark font-black text-xs border-b border-brown/10">
                        <th className="p-4">الكود</th>
                        <th className="p-4">اسم المنتج</th>
                        <th className="p-4">الكمية المرجعة</th>
                        <th className="p-4">إجمالي قيمة المرتجع</th>
                        <th className="p-4">عدد عمليات الإرجاع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brown/5 text-sm font-bold text-dark">
                      {topReturnedProducts.map((item, idx) => (
                        <tr key={item.product || idx} className="hover:bg-ligth/20 transition-colors">
                          <td className="p-4 font-mono text-xs text-gray-500">{item.code || '-'}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-rose-50 text-rose-600 rounded-md">
                                <Tag size={16} />
                              </div>
                              {item.productName}
                            </div>
                          </td>
                          <td className="p-4 text-rose-600 font-black">{item.totalReturnQuantity}</td>
                          <td className="p-4 text-rose-600 font-black">
                            {(item.totalReturnAmount || 0).toLocaleString()} ج.م
                          </td>
                          <td className="p-4 text-gray-600">{item.timesReturned} مرة</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* مؤشر التحميل عند التمرير لأسفل */}
      {loadingMore && (
        <div className="py-4 flex justify-center items-center">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      )}
    </div>
  );
};

// عنوان القسم
const SectionTitle = ({ children, icon }) => (
  <div className="flex items-center gap-2 mb-3">
    {icon}
    <h2 className="text-lg font-black text-dark">{children}</h2>
  </div>
);

// حالة فارغة
const EmptyState = ({ text }) => (
  <div className="text-center py-16 text-dark/40">
    <p className="text-sm font-bold">{text}</p>
  </div>
);

// كارت إحصائية
const StatCard = ({ title, value, count, subtitle, icon, bgColor }) => (
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

export default PurchasesReport;