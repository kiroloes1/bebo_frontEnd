import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  X,
  Calendar,
  User,
  FileText,
  Package,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  Truck,
  ShoppingBag,
  Filter,
} from 'lucide-react';
import api from '../../services/api';
import ExportExcelButton from '../../services/ExportExcelButton';

// ==========================================
// Main Component
// ==========================================
const SalesReturnsManagement = () => {
  // State
  const [returns, setReturns] = useState([]);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '', // invoice / purchase
    customer: '',
    supplier: '',
    invoice: '',
    purchase: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10,
  });

  const [pagination, setPagination] = useState({
    totalReturns: 0,
    currentPage: 1,
    totalPages: 1,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // ==========================================
  // Fetch Returns
  // ==========================================
  const fetchReturns = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();

      if (filters.search) queryParams.append('search', filters.search);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.customer) queryParams.append('customer', filters.customer);
      if (filters.supplier) queryParams.append('supplier', filters.supplier);
      if (filters.invoice) queryParams.append('invoice', filters.invoice);
      if (filters.purchase) queryParams.append('purchase', filters.purchase);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      queryParams.append('page', filters.page);
      queryParams.append('limit', filters.limit);

      const response = await api.get(`/salesReturn?${queryParams.toString()}`);

      setReturns(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء جلب المرتجعات');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Fetch Return by ID
  // ==========================================
  const fetchReturnById = async (id) => {
    try {
      const response = await api.get(`/salesReturn/${id}`);
      setSelectedReturn(response.data.data);
      setShowDetailsModal(true);
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء جلب تفاصيل المرتجع');
    }
  };

  // ==========================================
  // Delete Return
  // ==========================================
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/salesReturn/${deleteId}`);
      setShowDeleteModal(false);
      setDeleteId(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء حذف المرتجع');
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================
  // Effects
  // ==========================================
  useEffect(() => {
    fetchReturns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit, refreshTrigger]);

  // ==========================================
  // Handlers
  // ==========================================
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1,
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, page: 1 }));
    fetchReturns();
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      handleFilterChange('page', newPage);
    }
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: '',
      type: '',
      customer: '',
      supplier: '',
      invoice: '',
      purchase: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 10,
    });
    setRefreshTrigger((prev) => prev + 1);
  };

  // ==========================================
  // Format Helpers
  // ==========================================
  const formatDate = (date) => {
    return format(new Date(date), 'dd MMMM yyyy - HH:mm', { locale: ar });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      completed: {
        color: 'bg-green-50 text-green-700 border-green-200',
        icon: CheckCircle,
        label: 'مكتمل',
      },
      cancelled: {
        color: 'bg-red-50 text-red-700 border-red-200',
        icon: X,
        label: 'ملغي',
      },
    };
    const config = statusMap[status] || statusMap.completed;
    const Icon = config.icon;
    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black border ${config.color}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    if (type === 'purchase') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black border border-purple-200 bg-purple-50 text-purple-700">
          <ShoppingBag className="w-3.5 h-3.5" />
          مشتريات
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black border border-blue-200 bg-blue-50 text-blue-700">
        <Truck className="w-3.5 h-3.5" />
        مبيعات
      </span>
    );
  };

  const getPartyInfo = (returnItem) => {
    if (returnItem.type === 'purchase') {
      return {
        name: returnItem.supplier?.name || 'غير متاح',
        phone: returnItem.supplier?.phone || '',
        balance: returnItem.supplier?.balance || 0,
        documentNumber: returnItem.purchase?.purchaseNumber || 'غير متاح',
        documentType: 'رقم أمر الشراء',
        invoiceField: 'purchase',
        label: 'المورد',
      };
    }
    return {
      name: returnItem.customer?.name || 'غير متاح',
      phone: returnItem.customer?.phone || '',
      balance: returnItem.customer?.balance || 0,
      documentNumber: returnItem.invoice?.invoiceNumber || 'غير متاح',
      documentType: 'رقم الفاتورة',
      invoiceField: 'invoice',
      label: 'العميل',
    };
  };

  return (
    <div className="w-[96vw] overview-auto md:w-full w-full p-4 lg:p-8 bg-ligth/10 min-h-screen" dir="rtl">
      <div className="mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white p-3 rounded-xl border border-brwonLight shadow-sm">
              <RefreshCw className="text-brown" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-dark">إدارة المرتجعات</h1>
              <p className="text-dark/50 text-sm font-bold mt-0.5">
                عرض وإدارة مرتجعات المبيعات والمشتريات
              </p>
            </div>
          </div>

          <div className="bg-white px-5 py-3 rounded-xl border border-brwonLight shadow-sm">
            <span className="text-dark/60 text-xs font-bold block">إجمالي المرتجعات</span>
            <span className="text-brown text-xl font-black">{pagination.totalReturns}</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-bold text-sm flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-brwonLight shadow-sm p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-right">
              {/* Search */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-dark flex items-center gap-1">
                  <Search className="w-3.5 h-3.5 text-brown" />
                  بحث
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="بحث برقم المرتجع أو اسم العميل/المورد..."
                  className="w-full p-3 bg-ligth/20 border border-brown/10 rounded-xl outline-none font-bold text-dark text-sm focus:border-brown focus:ring-1 focus:ring-brown transition-all"
                />
              </div>

              {/* Type Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-dark flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-brown" />
                  نوع المرتجع
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full p-3 bg-ligth/20 border border-brown/10 rounded-xl outline-none font-bold text-dark text-sm focus:border-brown focus:ring-1 focus:ring-brown transition-all"
                >
                  <option value="">الكل</option>
                  <option value="invoice">مبيعات</option>
                  <option value="purchase">مشتريات</option>
                </select>
              </div>

              {/* Status Filter */}
              {/* <div className="space-y-1.5">
                <label className="text-xs font-black text-dark flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-brown" />
                  الحالة
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full p-3 bg-ligth/20 border border-brown/10 rounded-xl outline-none font-bold text-dark text-sm focus:border-brown focus:ring-1 focus:ring-brown transition-all"
                >
                  <option value="">الكل</option>
                  <option value="completed">مكتمل</option>
                  <option value="cancelled">ملغي</option>
                </select>
              </div> */}

              {/* From Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-dark flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-brown" />
                  من تاريخ
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full p-3 bg-ligth/20 border border-brown/10 rounded-xl outline-none font-bold text-dark text-sm focus:border-brown focus:ring-1 focus:ring-brown transition-all"
                />
              </div>

              {/* To Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-dark flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-brown" />
                  إلى تاريخ
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full p-3 bg-ligth/20 border border-brown/10 rounded-xl outline-none font-bold text-dark text-sm focus:border-brown focus:ring-1 focus:ring-brown transition-all"
                />
              </div>

              {/* Customer ID (hidden input for advanced filtering) */}
              <div className="space-y-1.5 hidden">
                <input
                  type="text"
                  value={filters.customer}
                  onChange={(e) => handleFilterChange('customer', e.target.value)}
                  placeholder="معرف العميل"
                />
              </div>

              {/* Supplier ID (hidden input for advanced filtering) */}
              <div className="space-y-1.5 hidden">
                <input
                  type="text"
                  value={filters.supplier}
                  onChange={(e) => handleFilterChange('supplier', e.target.value)}
                  placeholder="معرف المورد"
                />
              </div>
            </div>

            <div className="flex  flex-wrap gap-2 pt-1">
              <button
                type="submit"
                className="flex items-center gap-2 bg-brown px-6 py-2.5 rounded-xl text-white font-black text-sm hover:bg-brown/90 transition-all shadow-sm"
              >
                <Search className="w-4 h-4" />
                بحث
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-2 bg-ligth px-6 py-2.5 rounded-xl text-dark font-black text-sm hover:bg-brown hover:text-white transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة تعيين
              </button>

              <ExportExcelButton
  data={
    returns

  }
  fileName="مرتجعات"
  sheetName="مرتجعات"
/>
            </div>
          </form>
        </div>

        {/* Limit Selector */}
        <div className="flex justify-end items-center gap-2">
          <label className="text-xs text-dark/60 font-bold">عدد العناصر:</label>
          <select
            value={filters.limit}
            onChange={(e) => handleFilterChange('limit', Number(e.target.value))}
            className="px-3 py-1.5 bg-white border border-brown/15 rounded-lg text-xs font-bold text-dark outline-none focus:border-brown"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-brwonLight shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="w-9 h-9 animate-spin text-brown" />
              <p className="text-dark/50 font-bold text-sm">جاري تحميل المرتجعات...</p>
            </div>
          ) : returns.length === 0 ? (
            <div className="text-center py-20 text-dark/40">
              <Package className="w-14 h-14 mx-auto text-dark/15 mb-4" />
              <p className="text-lg font-black text-dark/50">لا توجد مرتجعات</p>
              <p className="text-sm font-bold mt-1">
                لم يتم العثور على أي مرتجعات تطابق معايير البحث
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-ligth/40 text-dark font-black text-xs border-b border-brown/10">
                    <th className="p-4">#</th>
                    <th className="p-4">رقم المرتجع</th>
                    <th className="p-4">النوع</th>
                    <th className="p-4">رقم المستند</th>
                    <th className="p-4">العميل/المورد</th>
                    <th className="p-4">تاريخ المرتجع</th>
                    <th className="p-4">المبلغ</th>
                    <th className="p-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brown/5 text-sm font-bold text-dark">
                  {returns.map((returnItem, index) => {
                    const partyInfo = getPartyInfo(returnItem);
                    return (
                      <tr key={returnItem._id} className="hover:bg-ligth/20 transition-colors">
                        <td className="p-4 text-dark/50">
                          {(pagination.currentPage - 1) * pagination.limit + index + 1}
                        </td>
                        <td className="p-4 font-black text-brown">{returnItem.returnNumber}</td>
                        <td className="p-4">{getTypeBadge(returnItem.type)}</td>
                        <td className="p-4">{partyInfo.documentNumber}</td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-black">{partyInfo.name}</span>
                            <span className="text-xs text-dark/40 font-bold">
                              {partyInfo.phone}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-dark/60 text-xs">
                          {formatDate(returnItem.returnDate)}
                        </td>
                        <td className="p-4 font-black text-brown">
                          {returnItem.totalAmount?.toLocaleString()} EGP
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => fetchReturnById(returnItem._id)}
                              className="p-2 text-brown hover:bg-ligth rounded-lg transition-colors"
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-4.5 h-4.5" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteId(returnItem._id);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-between items-center bg-white rounded-2xl border border-brwonLight shadow-sm p-4">
            <span className="text-sm font-bold text-dark/60">
              صفحة <span className="text-dark font-black">{pagination.currentPage}</span> من{' '}
              <span className="text-dark font-black">{pagination.totalPages}</span>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="px-4 py-2 bg-ligth/40 border border-brown/10 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brown hover:text-white transition-all flex items-center gap-2 font-black text-sm text-dark"
              >
                <ChevronRight className="w-4 h-4" />
                السابق
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="px-4 py-2 bg-ligth/40 border border-brown/10 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brown hover:text-white transition-all flex items-center gap-2 font-black text-sm text-dark"
              >
                التالي
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ==========================================
            Details Modal
            ========================================== */}
        {showDetailsModal && selectedReturn && (
          <div className="fixed inset-0 bg-dark/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" dir="rtl">
              <div className="sticky top-0 bg-white z-10 border-b border-ligth p-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-ligth p-2.5 rounded-xl">
                    <RefreshCw className="text-brown" size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-dark">تفاصيل المرتجع</h2>
                    <p className="text-sm text-dark/50 font-bold">{selectedReturn.returnNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-ligth rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-dark/60" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-right">
                  <div className="bg-ligth/30 rounded-xl p-4">
                    <p className="text-xs text-dark/50 font-bold">رقم المرتجع</p>
                    <p className="font-black text-dark mt-1">{selectedReturn.returnNumber}</p>
                  </div>
                  <div className="bg-ligth/30 rounded-xl p-4">
                    <p className="text-xs text-dark/50 font-bold">النوع</p>
                    <div className="mt-1">{getTypeBadge(selectedReturn.type)}</div>
                  </div>
                  <div className="bg-ligth/30 rounded-xl p-4">
                    <p className="text-xs text-dark/50 font-bold">تاريخ المرتجع</p>
                    <p className="font-black text-dark mt-1 text-sm">
                      {formatDate(selectedReturn.returnDate)}
                    </p>
                  </div>
                  <div className="bg-ligth/30 rounded-xl p-4">
                    <p className="text-xs text-dark/50 font-bold">إجمالي المبلغ</p>
                    <p className="font-black text-lg text-brown mt-1">
                      {selectedReturn.totalAmount?.toLocaleString()} EGP
                    </p>
                  </div>
                </div>

                {/* Document & Party Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                  {/* Document Info */}
                  <div className="bg-white rounded-xl p-4 border border-brwonLight">
                    <h3 className="font-black text-dark flex items-center gap-2 mb-3 border-b border-ligth pb-2">
                      <FileText className="w-4.5 h-4.5 text-brown" />
                      {selectedReturn.type === 'purchase' ? 'معلومات أمر الشراء' : 'معلومات الفاتورة'}
                    </h3>
                    <div className="space-y-2 text-sm font-bold">
                      <div className="flex justify-between">
                        <span className="text-dark/50">
                          {selectedReturn.type === 'purchase' ? 'رقم أمر الشراء' : 'رقم الفاتورة'}:
                        </span>
                        <span className="text-dark font-black">
                          {selectedReturn.type === 'purchase'
                            ? selectedReturn.purchase?.purchaseNumber || 'غير متاح'
                            : selectedReturn.invoice?.invoiceNumber || 'غير متاح'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark/50">تاريخ المستند:</span>
                        <span className="text-dark font-black text-xs">
                          {selectedReturn.type === 'purchase'
                            ? selectedReturn.purchase?.purchaseDate
                              ? formatDate(selectedReturn.purchase.purchaseDate)
                              : 'غير متاح'
                            : selectedReturn.invoice?.invoiceDate
                              ? formatDate(selectedReturn.invoice.invoiceDate)
                              : 'غير متاح'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark/50">الإجمالي:</span>
                        <span className="text-dark font-black">
                          {selectedReturn.type === 'purchase'
                            ? selectedReturn.purchase?.finalPrice?.toLocaleString() || 'غير متاح'
                            : selectedReturn.invoice?.finalPrice?.toLocaleString() || 'غير متاح'} EGP
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Party Info */}
                  <div className="bg-white rounded-xl p-4 border border-brwonLight">
                    <h3 className="font-black text-dark flex items-center gap-2 mb-3 border-b border-ligth pb-2">
                      <User className="w-4.5 h-4.5 text-brown" />
                      {selectedReturn.type === 'purchase' ? 'معلومات المورد' : 'معلومات العميل'}
                    </h3>
                    <div className="space-y-2 text-sm font-bold">
                      <div className="flex justify-between">
                        <span className="text-dark/50">الاسم:</span>
                        <span className="text-dark font-black">
                          {selectedReturn.type === 'purchase'
                            ? selectedReturn.supplier?.name || 'غير متاح'
                            : selectedReturn.customer?.name || 'غير متاح'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark/50">الهاتف:</span>
                        <span className="text-dark font-black" dir="ltr">
                          {selectedReturn.type === 'purchase'
                            ? selectedReturn.supplier?.phone || 'غير متاح'
                            : selectedReturn.customer?.phone || 'غير متاح'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark/50">الرصيد:</span>
                        <span
                          className={`font-black ${
                            (selectedReturn.type === 'purchase'
                              ? selectedReturn.supplier?.balance
                              : selectedReturn.customer?.balance) < 0
                              ? 'text-red-600'
                              : 'text-brown'
                          }`}
                        >
                          {(selectedReturn.type === 'purchase'
                            ? selectedReturn.supplier?.balance
                            : selectedReturn.customer?.balance
                          )?.toLocaleString() || 0} EGP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="font-black text-dark flex items-center gap-2 mb-3 border-b border-ligth pb-2">
                    <Package className="w-4.5 h-4.5 text-brown" />
                    المنتجات المرتجعة
                  </h3>
                  <div className="rounded-xl overflow-hidden border border-brwonLight">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-ligth/40 text-xs font-black text-dark border-b border-brown/10">
                          <th className="p-3">المنتج</th>
                          <th className="p-3">الوحدة</th>
                          <th className="p-3">كمية المستند</th>
                          <th className="p-3">كمية المرتجع</th>
                          <th className="p-3">السعر</th>
                          <th className="p-3">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brown/5 text-sm font-bold text-dark">
                        {selectedReturn.items?.map((item, index) => (
                          <tr key={index} className="hover:bg-ligth/20 transition-colors">
                            <td className="p-3">
                              <span className="font-black block">
                                {item.product?.productName || item.productName || 'غير متاح'}
                              </span>
                              <span className="text-xs text-dark/40 font-bold">
                                كود: {item.product?.code || 'غير متاح'}
                              </span>
                            </td>
                            <td className="p-3">{item.unit_type || 'غير متاح'}</td>
                            <td className="p-3">{item.invoiceQuantity}</td>
                            <td className="p-3 font-black text-brown">{item.returnQuantity}</td>
                            <td className="p-3">{item.price?.toLocaleString()} EGP</td>
                            <td className="p-3 font-black">{item.subtotal?.toLocaleString()} EGP</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-ligth/40">
                          <td colSpan="5" className="p-3 text-left font-black text-dark">
                            الإجمالي الكلي
                          </td>
                          <td className="p-3 font-black text-brown">
                            {selectedReturn.totalAmount?.toLocaleString()} EGP
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Status */}
                {/* <div className="flex items-center gap-2 bg-ligth/30 rounded-xl p-4 border border-brown/10">
                  <span className="text-xs text-dark/50 font-bold">الحالة:</span>
                  {getStatusBadge(selectedReturn.status)}
                </div> */}

                {/* Note */}
                {selectedReturn.note && (
                  <div className="bg-ligth/30 border border-brown/10 rounded-xl p-4">
                    <p className="text-sm font-bold text-dark">
                      <span className="font-black text-brown">ملاحظات: </span>
                      {selectedReturn.note}
                    </p>
                  </div>
                )}

                {/* User Info */}
                <div className="text-xs text-dark/50 font-bold border-t border-ligth pt-4">
                  تم الإنشاء بواسطة:{' '}
                  <span className="font-black text-dark">
                    {selectedReturn.user?.name || 'غير متاح'}
                  </span>
                  {selectedReturn.user?.email && (
                    <>
                      <span className="mx-2 text-dark/20">|</span>
                      <span className="font-black text-dark">{selectedReturn.user.email}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            Delete Confirmation Modal
            ========================================== */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-dark/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" dir="rtl">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-black text-dark mb-2">تأكيد الحذف</h3>
                <p className="text-dark/50 font-bold text-sm mb-6">
                  هل أنت متأكد من حذف هذا المرتجع؟ سيتم إلغاء تأثيره على المخزون والرصيد.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-6 py-2.5 bg-ligth text-dark font-black text-sm rounded-xl hover:bg-ligth/70 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-6 py-2.5 bg-red-500 text-white font-black text-sm rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-60"
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    حذف
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesReturnsManagement;