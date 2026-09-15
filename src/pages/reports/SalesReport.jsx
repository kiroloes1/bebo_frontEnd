import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';
import { showAlert } from '../../services/alert';
import {
  Calendar,
  RefreshCw,
  Loader2,
  TrendingUp,
  Receipt,
  DollarSign,
  ShoppingBag,
  Award,
  Tag,
  Search,
  X,
} from 'lucide-react';
import ExportExcelButton from '../../services/ExportExcelButton';

const PERIOD_OPTIONS = [
  { value: 'today', label: 'اليوم' },
  { value: 'week', label: 'الأسبوع' },
  { value: 'month', label: 'الشهر' },
  { value: 'custom', label: 'فترة مخصصة' },
];

const SalesReport = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // States للـ Pagination والبحث
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [searchValue, setSearchValue] = useState(''); // للـ input
  const [debouncedSearch, setDebouncedSearch] = useState(''); // للـ debounce

  // قوائم المنتجات
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [productProfitItems, setProductProfitItems] = useState([]);

  const [filters, setFilters] = useState({
    period: 'today',
    from: '',
    to: '',
  });

  // ==========================================
  // Debounce للبحث
  // ==========================================
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 500); // تأخير 500ms

    return () => clearTimeout(timer);
  }, [searchValue]);

  // ==========================================
  // تحديث البحث عند تغيير debouncedSearch
  // ==========================================
  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch]);

  // إعادة ضبط حالة القوائم عند تغيير الفلاتر أو كلمة البحث
  const resetData = () => {
    setPage(1);
    setHasMore(true);
    setTopSellingProducts([]);
    setProductProfitItems([]);
  };

  useEffect(() => {
    resetData();
  }, [filters.period, search]);

  // ==========================================
  // جلب بيانات تقرير المبيعات
  // ==========================================
  const fetchSalesReport = async (pageNum = 1, isNewQuery = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const limit = 10;
      const { period, from, to } = filters;
      
      // بناء URL مع البحث
      let url = `/reports/invoice/salesReport?period=${period}&page=${pageNum}&limit=${limit}`;
      
      // إضافة البحث إذا كان موجوداً
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }

      if (period === 'custom' && from && to) {
        url += `&from=${from}&to=${to}`;
      }

      const response = await api.get(url);
      if (response.data.success) {
        const resData = response.data;
        setData(resData);

        // استخراج المنتجات الأكثر مبيعاً
        const newSelling = resData.topSellingProducts?.items || [];
        // استخراج ربح المنتجات
        const newProfit = resData.productProfit?.items || [];

        setTopSellingProducts((prev) =>
          isNewQuery || pageNum === 1 ? newSelling : [...prev, ...newSelling]
        );
        setProductProfitItems((prev) =>
          isNewQuery || pageNum === 1 ? newProfit : [...prev, ...newProfit]
        );

        const sellingTotal = resData.topSellingProducts?.totalItems || 0;
        const profitTotal = resData.productProfit?.totalItems || 0;
        
        // تحديث hasMore بناءً على البيانات الجديدة
        const totalItems = Math.max(sellingTotal, profitTotal);
        const currentItems = Math.max(newSelling.length, newProfit.length);
        
        setHasMore(
          (pageNum * limit) < totalItems ||
          newSelling.length === limit ||
          newProfit.length === limit
        );
      }
    } catch (error) {
      showAlert({
        title: error.response?.data?.message || 'حدث خطأ أثناء جلب تقرير المبيعات',
        icon: 'error',
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // ==========================================
  // جلب البيانات عند تغيير الفلاتر أو البحث أو الصفحة
  // ==========================================
  useEffect(() => {
    if (filters.period !== 'custom' || (filters.from && filters.to)) {
      fetchSalesReport(page, page === 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.period, search, page]);

  // ==========================================
  // إعادة تعيين البحث
  // ==========================================
  const clearSearch = () => {
    setSearchValue('');
    setSearch('');
    resetData();
  };

  // ==========================================
  // تحديث البحث عند الضغط على Enter
  // ==========================================
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      setDebouncedSearch(searchValue);
      resetData();
    }
  };

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

  const { sales, profit, productProfit } = data || {};

  // ==========================================
  // دالة تصدير Excel للربح لكل منتج
  // ==========================================
  const getProfitExcelData = () => {
    return productProfitItems.map((item) => ({
      'الكود': item.code || '-',
      'اسم المنتج': item.productName,
      'الفئة': item.category || '-',
      'الكمية المباعة': item.totalQuantitySold,
      'إجمالي الإيراد': item.totalRevenue,
      'إجمالي التكلفة': item.totalCost,
      'صافي الربح': item.totalProfit,
      'هامش الربح %': item.profitMargin,
      'متوسط سعر البيع': item.averageSellingPrice,
      'عدد مرات البيع': item.timesSold,
    }));
  };

  // ==========================================
  // دالة تصدير Excel للأكثر مبيعاً
  // ==========================================
  const getSellingExcelData = () => {
    return topSellingProducts.map((item) => ({
      'الكود': item.code || '-',
      'اسم المنتج': item.productName,
      'الكمية المباعة': item.totalQuantity,
      'إجمالي الإيراد': item.totalRevenue,
      'عدد مرات البيع': item.timesSold,
    }));
  };

  return (
    <div className="w-[96vw] overview-auto md:w-full min-h-screen bg-ligth p-4 md:p-8" dir="rtl">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-dark">تقرير المبيعات والأرباح</h1>
          <p className="text-gray-500 font-bold">ملخص الفواتير، هامش الربح، والمنتجات الأكثر حركة</p>
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
                onClick={() => fetchSalesReport(1, true)}
                className="bg-accent text-white px-3 rounded-xl"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================= شريط البحث المتقدم ================= */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="ابحث باسم المنتج أو الكود..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full pr-10 pl-10 py-2 bg-white rounded-xl border border-gray-300 font-bold text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
          />
          {searchValue && (
            <button
              onClick={clearSearch}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        {/* إظهار نتائج البحث */}
        {search && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-bold">نتائج البحث:</span>
            <span className="bg-accent/10 text-accent px-3 py-1 rounded-full font-bold">
              {search}
            </span>
            <button
              onClick={clearSearch}
              className="text-red-500 hover:text-red-700 font-bold text-xs"
            >
              إلغاء
            </button>
          </div>
        )}
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
              title="إجمالي المبيعات"
              value={`${(sales?.finalPrice || 0).toLocaleString()} ج.م`}
              count={`${sales?.invoicesCount || 0} فاتورة`}
              subtitle={`خصومات: ${(sales?.totalDiscount || 0).toLocaleString()} ج.م`}
              icon={<Receipt className="text-white" />}
              bgColor="bg-blue-600"
            />
            <StatCard
              title="صافي الأرباح"
              value={`${(profit?.netProfit || 0).toLocaleString()} ج.م`}
              count={`هامش الربح: ${profit?.profitMargin || 0}%`}
              subtitle={`التكلفة الإجمالية: ${(profit?.totalCost || 0).toLocaleString()} ج.م`}
              icon={<TrendingUp className="text-white" />}
              bgColor="bg-green-600"
            />
            <StatCard
              title="إجمالي المصاريف"
              value={`${(profit?.totalExpenses || 0).toLocaleString()} ج.م`}
              subtitle="مصاريف التشغيل"
              icon={<DollarSign className="text-white" />}
              bgColor="bg-orange-600"
            />
            <StatCard
              title="عدد المنتجات المباعة"
              value={`${productProfit?.totalItems || 0}`}
              subtitle="منتج مختلف"
              icon={<ShoppingBag className="text-white" />}
              bgColor="bg-purple-600"
            />
          </div>

          {/* ================= جدول المنتجات الأكثر مبيعاً ================= */}
          <div className="mb-8">
            <div className="flex justify-between my-2">
              <SectionTitle icon={<Award className="text-amber-500" />}>
                الأصناف الأكثر مبيعاً
                {search && (
                  <span className="text-sm font-normal text-gray-400 mr-2">
                    (نتائج البحث عن: {search})
                  </span>
                )}
              </SectionTitle>
              {topSellingProducts.length > 0 && (
                <ExportExcelButton
                  data={getSellingExcelData()}
                  fileName="الأصناف_الأكثر_مبيعاً"
                  sheetName="الأكثر مبيعاً"
                />
              )}
            </div>
            <div className="bg-white rounded-2xl border border-brwonLight shadow-sm overflow-hidden">
              {topSellingProducts.length === 0 ? (
                <EmptyState text="لا توجد مبيعات مسجلة خلال هذه الفترة" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-ligth/40 text-dark font-black text-xs border-b border-brown/10">
                        <th className="p-4">#</th>
                        <th className="p-4">الكود</th>
                        <th className="p-4">اسم المنتج</th>
                        <th className="p-4">الكمية المباعة</th>
                        <th className="p-4">إجمالي الإيراد</th>
                        <th className="p-4">عدد مرات البيع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brown/5 text-sm font-bold text-dark">
                      {topSellingProducts.map((item, idx) => {
                        const isLastItem = idx === topSellingProducts.length - 1;
                        // تمييز النص المطابق للبحث
                        const highlightText = (text) => {
                          if (!search || !text) return text;
                          const regex = new RegExp(`(${search})`, 'gi');
                          const parts = text.split(regex);
                          return parts.map((part, i) =>
                            regex.test(part) ? (
                              <span key={i} className="bg-yellow-200 px-1 rounded">
                                {part}
                              </span>
                            ) : (
                              part
                            )
                          );
                        };

                        return (
                          <tr
                            key={item.product || idx}
                            ref={isLastItem ? lastElementRef : null}
                            className="hover:bg-ligth/20 transition-colors"
                          >
                            <td className="p-4 text-gray-400">{idx + 1}</td>
                            <td className="p-4 font-mono text-xs text-gray-500">{item.code || '-'}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-ligth rounded-md text-brown">
                                  <ShoppingBag size={16} />
                                </div>
                                {highlightText(item.productName)}
                              </div>
                            </td>
                            <td className="p-4 text-blue-700 font-black">{item.totalQuantity}</td>
                            <td className="p-4 text-green-700 font-black">
                              {item.totalRevenue.toLocaleString()} ج.م
                            </td>
                            <td className="p-4 text-gray-600">{item.timesSold} مرة</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ================= جدول ربح كل منتج ================= */}
          <div>
            <div className="flex justify-between my-2">
              <SectionTitle icon={<TrendingUp className="text-green-500" />}>
                ربح كل منتج
                {search && (
                  <span className="text-sm font-normal text-gray-400 mr-2">
                    (نتائج البحث عن: {search})
                  </span>
                )}
              </SectionTitle>
              {productProfitItems.length > 0 && (
                <ExportExcelButton
                  data={getProfitExcelData()}
                  fileName="ربح_كل_منتج"
                  sheetName="ربح المنتجات"
                />
              )}
            </div>
            <div className="bg-white rounded-2xl border border-brwonLight shadow-sm overflow-hidden mb-8">
              {productProfitItems.length === 0 ? (
                <EmptyState text="لا توجد منتجات مباعة خلال هذه الفترة" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-ligth/40 text-dark font-black text-xs border-b border-brown/10">
                        <th className="p-4">#</th>
                        <th className="p-4">الكود</th>
                        <th className="p-4">اسم المنتج</th>
                        <th className="p-4">الفئة</th>
                        <th className="p-4">الكمية</th>
                        <th className="p-4">الإيراد</th>
                        <th className="p-4">التكلفة</th>
                        <th className="p-4">الربح</th>
                        <th className="p-4">هامش الربح</th>
                        <th className="p-4">عدد المبيعات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brown/5 text-sm font-bold text-dark">
                      {productProfitItems.map((item, idx) => {
                        const isLastItem = idx === productProfitItems.length - 1;
                        const profitColor =
                          item.totalProfit > 0
                            ? 'text-green-600'
                            : item.totalProfit < 0
                            ? 'text-red-600'
                            : 'text-gray-500';

                        // تمييز النص المطابق للبحث
                        const highlightText = (text) => {
                          if (!search || !text) return text;
                          const regex = new RegExp(`(${search})`, 'gi');
                          const parts = text.split(regex);
                          return parts.map((part, i) =>
                            regex.test(part) ? (
                              <span key={i} className="bg-yellow-200 px-1 rounded">
                                {part}
                              </span>
                            ) : (
                              part
                            )
                          );
                        };

                        return (
                          <tr
                            key={item.product || idx}
                            ref={isLastItem ? lastElementRef : null}
                            className="hover:bg-ligth/20 transition-colors"
                          >
                            <td className="p-4 text-gray-400">{idx + 1}</td>
                            <td className="p-4 font-mono text-xs text-gray-500">{item.code || '-'}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-green-50 text-green-500 rounded-md">
                                  <Tag size={16} />
                                </div>
                                {highlightText(item.productName)}
                              </div>
                            </td>
                            <td className="p-4 text-gray-600">{item.category || '-'}</td>
                            <td className="p-4 text-blue-700 font-black">{item.totalQuantitySold}</td>
                            <td className="p-4 text-emerald-600 font-black">
                              {item.totalRevenue.toLocaleString()} ج.م
                            </td>
                            <td className="p-4 text-orange-600 font-black">
                              {item.totalCost.toLocaleString()} ج.م
                            </td>
                            <td className={`p-4 font-black ${profitColor}`}>
                              {item.totalProfit.toLocaleString()} ج.م
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2 py-1 rounded-lg text-xs font-black ${
                                  item.profitMargin >= 30
                                    ? 'bg-green-100 text-green-700'
                                    : item.profitMargin >= 15
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {item.profitMargin || 0}%
                              </span>
                            </td>
                            <td className="p-4 text-gray-600">{item.timesSold} مرة</td>
                          </tr>
                        );
                      })}
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

export default SalesReport;