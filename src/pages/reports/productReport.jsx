import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';
import { showAlert } from '../../services/alert';
import {
  Calendar,
  RefreshCw,
  Loader2,
  TrendingUp,
  AlertTriangle,
  Clock,
  Boxes,
  DollarSign,
  PieChart,
  Search,
} from 'lucide-react';
import ExportExcelButton from '../../services/ExportExcelButton';

const PERIOD_OPTIONS = [
  { value: 'today', label: 'اليوم' },
  { value: 'week', label: 'الأسبوع' },
  { value: 'month', label: 'الشهر' },
  { value: 'custom', label: 'فترة مخصصة' },
];

const ProductReports = () => {
  const [activeTab, setActiveTab] = useState('valuation');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // States التقارير
  const [valuationData, setValuationData] = useState(null);
  const [movementData, setMovementData] = useState([]);
  const [expiryData, setExpiryData] = useState({ expired: [], nearExpiry: [], expiredCount: 0, nearExpiryCount: 0 });
  const [lowStockData, setLowStockData] = useState([]);

  // Pagination & Search States
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');

  // الفلاتر
  const [filters, setFilters] = useState({
    period: 'today',
    from: '',
    to: '',
    nearExpiryDays: 30,
    threshold: 5,
  });

  // إعادة ضبط الترقيم والقوائم عند تغيير الفلاتر أو التبويب أو البحث
  const resetData = () => {
    setPage(1);
    setHasMore(true);
    setMovementData([]);
    setExpiryData({ expired: [], nearExpiry: [], expiredCount: 0, nearExpiryCount: 0 });
    setLowStockData([]);
  };

  useEffect(() => {
    resetData();
  }, [activeTab, filters.period, filters.nearExpiryDays, filters.threshold, search]);

  // ==========================================
  // جلب البيانات مع دعم الـ Infinite Scroll
  // ==========================================
  const fetchReportData = async (pageNum = 1, isNewQuery = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const limit = 15;

      if (activeTab === 'valuation') {
        const res = await api.get('/reports/product/stockValuationReport');
        if (res.data.success) setValuationData(res.data);
        setHasMore(false);
      } else if (activeTab === 'movement') {
        const { period, from, to } = filters;
        let url = `/reports/product/productMovementReport?period=${period}&page=${pageNum}&limit=${limit}&search=${encodeURIComponent(search)}`;
        if (period === 'custom' && from && to) url += `&from=${from}&to=${to}`;
        
        const res = await api.get(url);
        if (res.data.success) {
          const newItems = res.data.movement || [];
          setMovementData((prev) => (isNewQuery || pageNum === 1 ? newItems : [...prev, ...newItems]));
          setHasMore(newItems.length === limit);
        }
      } else if (activeTab === 'expiry') {
        const url = `/reports/product/expiryReport?nearExpiryDays=${filters.nearExpiryDays}&page=${pageNum}&limit=${limit}&search=${encodeURIComponent(search)}`;
        const res = await api.get(url);
        if (res.data.success) {
          const expiredNew = res.data.expired || [];
          const nearExpiryNew = res.data.nearExpiry || [];

          setExpiryData((prev) => ({
            expiredCount: res.data.expiredCount || 0,
            nearExpiryCount: res.data.nearExpiryCount || 0,
            expired: isNewQuery || pageNum === 1 ? expiredNew : [...prev.expired, ...expiredNew],
            nearExpiry: isNewQuery || pageNum === 1 ? nearExpiryNew : [...prev.nearExpiry, ...nearExpiryNew],
          }));

          setHasMore(expiredNew.length === limit || nearExpiryNew.length === limit);
        }
      } else if (activeTab === 'lowStock') {
        const url = `/reports/product/lowStockReport?threshold=${filters.threshold}&page=${pageNum}&limit=${limit}&search=${encodeURIComponent(search)}`;
        const res = await api.get(url);
        if (res.data.success) {
          const newProducts = res.data.products || [];
          setLowStockData((prev) => (isNewQuery || pageNum === 1 ? newProducts : [...prev, ...newProducts]));
          setHasMore(newProducts.length === limit);
        }
      }
    } catch (error) {
      showAlert({
        title: error.response?.data?.message || 'حدث خطأ أثناء جلب البيانات',
        icon: 'error',
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (filters.period !== 'custom' || (filters.from && filters.to)) {
      
                setTimeout(()=>{
                fetchReportData(page, page === 1);

     },1000)
    }
  }, [activeTab, filters.period, filters.nearExpiryDays, filters.threshold, search, page]);

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

const filterByCategory = valuationData?.byCategory.filter((cat) =>
  cat.category?.toLowerCase().includes(search.toLowerCase())
);
  return (
    <div className="w-[96vw] overview-auto md:w-full min-h-screen bg-ligth p-4 md:p-8" dir="rtl">
      {/* Header & Main Tabs */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-dark">تقارير المنتجات والمخزون</h1>
          <p className="text-gray-500 font-bold">متابعة التقييم، حركة المبيعات، نواقص المخزون والصلاحيات</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-2 bg-white p-2 rounded-xl shadow-sm border border-[#E0E7D0]">
          <TabButton
            id="valuation"
            label="تقييم المخزون"
            icon={<PieChart size={16} />}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          <TabButton
            id="movement"
            label="حركة المنتجات"
            icon={<TrendingUp size={16} />}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          <TabButton
            id="expiry"
            label="الصلاحيات"
            icon={<Clock size={16} />}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          <TabButton
            id="lowStock"
            label="نقص المخزون"
            icon={<AlertTriangle size={16} />}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          
        </div>
      </div>

      {/* Global Search Bar (Non-valuation tabs) */}
      { (
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
      )}

      {/* ==========================================
          1. تقرير تقييم المخزون (Stock Valuation)
      ========================================== */}
      {activeTab === 'valuation' && (
        <>
          {loading ? (
            <LoadingState />
          ) : valuationData ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="إجمالي المنتجات"
                  value={valuationData.overall.totalProducts}
                  subtitle="صنف مسجل"
                  icon={<Boxes className="text-white" />}
                  bgColor="bg-blue-600"
                />
                <StatCard
                  title="تكلُفة المخزون"
                  value={`${valuationData.overall.totalCostValue?.toLocaleString()} ج.م`}
                  subtitle="بسعر الشراء"
                  icon={<DollarSign className="text-white" />}
                  bgColor="bg-amber-600"
                />
                <StatCard
                  title="القيمة البيعية"
                  value={`${valuationData.overall.totalSellingValue?.toLocaleString()} ج.م`}
                  subtitle="بسعر البيع المتوقع"
                  icon={<DollarSign className="text-white" />}
                  bgColor="bg-green-600"
                />
                <StatCard
                  title="الأرباح المتوقعة"
                  value={`${valuationData.overall.potentialProfit?.toLocaleString()} ج.م`}
                  subtitle="هامش الربح الكلي"
                  icon={<TrendingUp className="text-white" />}
                  bgColor="bg-emerald-700"
                />
              </div>

           <div className='flex justify-between my-2'>
                          <SectionTitle>التقييم حسب التصنيف</SectionTitle>
                            <ExportExcelButton
                    data={
                      filterByCategory

                    }
                    fileName= "تقارير اصناف"
                    sheetName="تقارير اصناف"
                  />
           </div>
              <div className="bg-white rounded-2xl border border-brwonLight shadow-sm overflow-hidden mb-8">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-ligth/40 text-dark font-black text-xs border-b border-brown/10">
                        <th className="p-4">التصنيف</th>
                        <th className="p-4">عدد الأصناف</th>
                        <th className="p-4">الكمية المتاحة</th>
                        <th className="p-4">قيمة التكلفة</th>
                        <th className="p-4">القيمة البيعية</th>
                        <th className="p-4">الربح المتوقع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brown/5 text-sm font-bold text-dark">
                      {filterByCategory.map((cat, idx) => (
                        <tr key={idx} className="hover:bg-ligth/20 transition-colors">
                          <td className="p-4 font-black">{cat.category}</td>
                          <td className="p-4">{cat.productsCount}</td>
                          <td className="p-4">{cat.totalAvailableQuantity}</td>
                          <td className="p-4 text-amber-700">{cat.costValue.toLocaleString()} ج.م</td>
                          <td className="p-4 text-green-700">{cat.sellingValue.toLocaleString()} ج.م</td>
                          <td className="p-4 text-emerald-600 font-black">
                            {cat.potentialProfit.toLocaleString()} ج.م
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </>
      )}

      {/* ==========================================
          2. تقرير حركة المنتجات (Product Movement)
      ========================================== */}
      {activeTab === 'movement' && (
        <>
          <div className="flex justify-end mb-6">
            <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-[#E0E7D0]">
              <div className="flex items-center gap-2 bg-ligth px-3 rounded-xl border border-gray-300">
                <Calendar className="w-4 h-4 text-brown" />
                <select
                  className="bg-transparent p-2 font-bold text-dark outline-none cursor-pointer"
                  value={filters.period}
                  onChange={(e) => setFilters({ ...filters, period: e.target.value })}
                >
                  {PERIOD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                
              </div>

               <div className='flex justify-between my-2'>

                            <ExportExcelButton
                    data={
                      movementData

                    }
                    fileName= "حركه المنتجات"
                    sheetName="حركه المنتجات"
                  />
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
                  <button onClick={() => fetchReportData(1, true)} className="bg-accent text-white px-3 rounded-xl">
                    <RefreshCw size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <LoadingState />
          ) : (
            <div className="bg-white rounded-2xl border border-brwonLight shadow-sm overflow-hidden mb-8">
              {movementData.length === 0 ? (
                <EmptyState text="لا توجد حركة للمنتجات في هذه الفترة" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-ligth/40 text-dark font-black text-xs border-b border-brown/10">
                        <th className="p-4">اسم المنتج</th>
                        <th className="p-4">الوحدة</th>
                        <th className="p-4 text-blue-600">المشتريات (+)</th>
                        <th className="p-4 text-green-600">المبيعات (-)</th>
                        <th className="p-4 text-amber-600">مرتجع مشتريات (-)</th>
                        <th className="p-4 text-purple-600">مرتجع مبيعات (+)</th>
                        <th className="p-4">صافي التغير</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brown/5 text-sm font-bold text-dark">
                      {movementData.map((row, idx) => {
                        const isLastItem = idx === movementData.length - 1;
                        return (
                          <tr
                            key={idx}
                            ref={isLastItem ? lastElementRef : null}
                            className="hover:bg-ligth/20 transition-colors"
                          >
                            <td className="p-4 font-black">{row.productName}</td>
                            <td className="p-4">
                              <span className="bg-ligth text-brown px-2 py-1 rounded-md text-xs">
                                {row.unit_type}
                              </span>
                            </td>
                            <td className="p-4 text-blue-600">{row.purchasedQty}</td>
                            <td className="p-4 text-green-600">{row.soldQty}</td>
                            <td className="p-4 text-amber-600">{row.purchaseReturnedQty}</td>
                            <td className="p-4 text-purple-600">{row.salesReturnedQty}</td>
                            <td className={`p-4 font-black dir-ltr text-right ${row.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {row.netChange > 0 ? `+${row.netChange}` : row.netChange}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ==========================================
          3. تقرير انتهاء الصلاحية (Expiry Report)
      ========================================== */}
      {activeTab === 'expiry' && (
        <>
          <div className="flex justify-between items-center mb-6">
            <SectionTitle>متابعة الصلاحيات</SectionTitle>
            <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-300">
              <span className="text-xs font-bold text-gray-500">التنبيه خلال (يوم):</span>
              <input
                type="number"
                value={filters.nearExpiryDays}
                onChange={(e) => setFilters({ ...filters, nearExpiryDays: e.target.value })}
                className="w-16 p-1 bg-ligth rounded-lg font-bold text-center outline-none"
              />
              <button onClick={() => fetchReportData(1, true)} className="bg-accent text-white p-1.5 rounded-lg">
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {loading ? (
            <LoadingState />
          ) : (
            <div className="space-y-8">
              {/* المنتهية الصلاحية */}
              <div>

                
               <div className='flex justify-between my-2'>

                <h3 className="text-md font-black text-red-600 mb-3 flex items-center gap-2">
                  <AlertTriangle size={18} /> منتجات منتهية الصلاحية ({expiryData.expiredCount})
                </h3>
                            <ExportExcelButton
                    data={
                      expiryData.expired

                    }
                    fileName="  منتجات انتهت صلاحيتها "
                    sheetName=" منتجات انتهت صلاحيتها"
                  />
           </div>
                <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
                  {expiryData.expired.length === 0 ? (
                    <EmptyState text="لا توجد منتجات منتهية الصلاحية حالياً" />
                  ) : (
                    <ProductTable list={expiryData.expired} isExpired={true} lastElementRef={lastElementRef} />
                  )}
                </div>
              </div>

              {/* القريبة من الانتهاء */}
              <div>

                    <div className='flex justify-between my-2'>
                <h3 className="text-md font-black text-amber-600 mb-3 flex items-center gap-2">
                  <Clock size={18} /> منتجات قربت علي انتهاء الصلاحية ({expiryData.nearExpiryCount})
                </h3>
                            <ExportExcelButton
                    data={
                      expiryData.nearExpiry

                    }
                    fileName= " منتجات قرب انتهاء الصلاحيه"
                    sheetName=" منتجات قرب انتهاء الصلاحيه"
                  />
           </div>
                <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
                  {expiryData.nearExpiry.length === 0 ? (
                    <EmptyState text="لا توجد منتجات قريبة من الانتهاء" />
                  ) : (
                    <ProductTable list={expiryData.nearExpiry} isExpired={false} />
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ==========================================
          4. تقرير نقص المخزون (Low Stock)
      ========================================== */}
      {activeTab === 'lowStock' && (
        <>
          <div className="flex justify-between items-center mb-6">

                                <div className='flex justify-between gap-5 items-center h-full my-2'>
            <SectionTitle>أصناف أو شكت على النفاد</SectionTitle>
                            <ExportExcelButton
                    data={
                      lowStockData

                    }
                    fileName= " نقص المخزون"
                    sheetName=" نقص المخزون"
                  />
           </div>
            <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-300">
              <span className="text-xs font-bold text-gray-500">حد التنبيه:</span>
              <input
                type="number"
                value={filters.threshold}
                onChange={(e) => setFilters({ ...filters, threshold: e.target.value })}
                className="w-16 p-1 bg-ligth rounded-lg font-bold text-center outline-none"
              />
              <button onClick={() => fetchReportData(1, true)} className="bg-accent text-white p-1.5 rounded-lg">
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {loading ? (
            <LoadingState />
          ) : (
            <div className="bg-white rounded-2xl border border-brwonLight shadow-sm overflow-hidden mb-8">
              {lowStockData.length === 0 ? (
                <EmptyState text="جميع المنتجات بكميات آمنة" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-ligth/40 text-dark font-black text-xs border-b border-brown/10">
                        <th className="p-4">الكود</th>
                        <th className="p-4">اسم المنتج</th>
                        <th className="p-4">التصنيف</th>
                        <th className="p-4">نوع الوحدة</th>
                        <th className="p-4">الكمية المتاحة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brown/5 text-sm font-bold text-dark">
                      {lowStockData.map((p, idx) => {
                        const isLastItem = idx === lowStockData.length - 1;
                        return (
                          <tr
                            key={p._id}
                            ref={isLastItem ? lastElementRef : null}
                            className="hover:bg-ligth/20 transition-colors"
                          >
                            <td className="p-4 font-mono text-xs">{p.code || '-'}</td>
                            <td className="p-4 font-black">{p.productName}</td>
                            <td className="p-4">{p.category || 'غير مصنف'}</td>
                            <td className="p-4">{p.unit_type}</td>
                            <td className="p-4">
                              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-black">
                                {p.availableQuantity}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Loading Indicator when scrolling for more items */}
      {loadingMore && (
        <div className="py-4 flex justify-center items-center">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      )}
    </div>
  );
};

// ================= Dynamic Sub-components =================

const TabButton = ({ id, label, icon, activeTab, setActiveTab }) => (
  <button
    onClick={() => setActiveTab(id)}
    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
      activeTab === id
        ? 'bg-accent text-white shadow-sm'
        : 'text-dark/70 hover:bg-ligth'
    }`}
  >
    {icon}
    {label}
  </button>
);

const ProductTable = ({ list, isExpired, lastElementRef }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-right border-collapse">
      <thead>
        <tr className="bg-ligth/40 text-dark font-black text-xs border-b border-brown/10">
          <th className="p-4">الكود</th>
          <th className="p-4">اسم المنتج</th>
          <th className="p-4">التصنيف</th>
          <th className="p-4">الكمية المتاحة</th>
          <th className="p-4">تاريخ الانتهاء</th>
          <th className="p-4">الأيام المتبقية</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-brown/5 text-sm font-bold text-dark">
        {list.map((p, idx) => {
          const isLastItem = idx === list.length - 1;
          return (
            <tr
              key={p._id}
              ref={isLastItem && lastElementRef ? lastElementRef : null}
              className="hover:bg-ligth/20 transition-colors"
            >
              <td className="p-4 font-mono text-xs">{p.code || '-'}</td>
              <td className="p-4 font-black">{p.productName}</td>
              <td className="p-4">{p.category || 'غير مصنف'}</td>
              <td className="p-4">{p.availableQuantity} {p.unit_type}</td>
              <td className="p-4">{new Date(p.expiration).toLocaleDateString('ar-EG')}</td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded-md text-xs ${isExpired ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                  {isExpired ? `منتهي منذ ${Math.abs(p.daysLeft)} يوم` : `${p.daysLeft} يوم`}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const SectionTitle = ({ children }) => (
  <h2 className="text-lg font-black text-dark mb-3">{children}</h2>
);

const EmptyState = ({ text }) => (
  <div className="text-center py-12 text-dark/40">
    <p className="text-sm font-bold">{text}</p>
  </div>
);

const LoadingState = () => (
  <div className="py-20 flex justify-center items-center">
    <Loader2 className="w-10 h-10 animate-spin text-accent" />
  </div>
);

const StatCard = ({ title, value, subtitle, icon, bgColor }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-300 flex items-center gap-5 hover:translate-y-[-2px] transition-all duration-300">
    <div className={`p-4 ${bgColor} rounded-xl shadow-lg shrink-0`}>
      {React.cloneElement(icon, { size: 28 })}
    </div>
    <div className="text-right">
      <p className="text-gray-400 font-bold text-xs mb-1">{title}</p>
      <h3 className="text-xl font-black text-dark">{value}</h3>
      {subtitle && <p className="text-[10px] text-brown font-bold mt-1">{subtitle}</p>}
    </div>
  </div>
);

export default ProductReports;