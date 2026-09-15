import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText, Calendar, Edit3, Loader2, Package, Printer, Trash,
  ChevronRight, ChevronLeft, Search, User, DollarSign, 
  CreditCard, Receipt, Eye, Filter
} from "lucide-react";
import api from "../../services/api";
import { showAlert } from "../../services/alert";
import { showAlertConfirm } from "../../services/alertConfirm";
import ExportExcelButton from "../../services/ExportExcelButton";

const InvoiceList = () => {
  const navigate = useNavigate();

  // States
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  // البحث و Debounce
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  
  const [statusFilter, setStatusFilter] = useState("");

  // Pagination States
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);

  // ⏱️ تأخير البحث (Debounce) لمدة 500ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // يمكنك تعديل الوقت (بالمللي ثانية) هنا

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  useEffect(() => {
    const updateLimit = () => {
      const width = window.innerWidth;
      
      if (width < 640) {
        setLimit(3); 
      } else if (width < 1024) {
        setLimit(5); 
      } else if (width < 1536) {
        setLimit(7);
      } else {
        setLimit(10); 
      }
    };

    updateLimit();
    window.addEventListener("resize", updateLimit);
    return () => window.removeEventListener("resize", updateLimit);
  }, []);

  // 1. جلب تفاصيل فاتورة محددة بالـ ID
  const fetchInvoiceDetails = useCallback(async (id) => {
    try {
      setDetailsLoading(true);
      const res = await api.get(`/invoice/${id}`);
      setSelectedInvoice(res.data.data || null);
    } catch (err) {
      showAlert({ title: "خطأ في جلب تفاصيل الفاتورة", icon: "error" });
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  // 2. جلب قائمة الفواتير مع Pagination والبحث والفلترة
  const fetchInvoices = useCallback(async (currentPage) => {
    try {
      setLoading(true);
      
      let url = `/invoice?page=${currentPage}&limit=${limit}`;
      
      // إضافة البحث بعد التثبيت (Debounced)
      if (debouncedSearchQuery.trim()) {
        url += `&search=${encodeURIComponent(debouncedSearchQuery.trim())}`;
      }
      
      // إضافة فلتر الحالة
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      
      const res = await api.get(url);
      const rawInvoices = res.data.data || [];

      setInvoices(rawInvoices);
      setTotalPages(res.data.pagination?.totalPages || 1);

      if (rawInvoices.length > 0) {
        fetchInvoiceDetails(rawInvoices[0]._id);
      } else {
        setSelectedInvoice(null);
      }
    } catch (err) {
      showAlert({ title: "خطأ في جلب البيانات", icon: "error" });
    } finally {
      setLoading(false);
    }
  }, [fetchInvoiceDetails, debouncedSearchQuery, statusFilter, limit]);

  // تحديث عند تغيير قيمة البحث الثابتة (debouncedSearchQuery) أو الفلتر
  useEffect(() => {
    setPage(1); // إعادة تعيين الصفحة عند البحث أو التصفية
  }, [debouncedSearchQuery, statusFilter]);

  useEffect(() => {
    fetchInvoices(page);
  }, [page, fetchInvoices]);

  // حذف الفاتورة
  const handleDelete = async (id) => {
    try {
      const confirm = await showAlertConfirm({
        title: "حذف فاتورة",
        text: "هل أنت متأكد أنك تريد حذف هذه الفاتورة؟ سيتم إلغاء كافة تأثيراتها على المخزون والحسابات",
        icon: "warning",
        confirmButtonText: "تأكيد",
        cancelButtonText: "إلغاء"
      });
      if (!confirm.isConfirmed) return;

      await api.delete(`/invoice/${id}`);
      
      const updatedInvoices = invoices.filter(inv => inv._id !== id);
      setInvoices(updatedInvoices);

      if (updatedInvoices.length > 0) {
        fetchInvoiceDetails(updatedInvoices[0]._id);
      } else {
        setSelectedInvoice(null);
      }

      showAlert({ title: "تم حذف الفاتورة بنجاح", icon: "success" });
    } catch (err) {
      showAlert({ title: "خطأ في حذف الفاتورة", icon: "error" });
    }
  };

  // الحصول على شارة الحالة
  const getStatusBadge = (status) => {
    switch (status) {
      case "paid":
        return { label: "مدفوعة", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      case "unpaid":
        return { label: "غير مدفوعة", bg: "bg-rose-100 text-rose-800 border-rose-200" };
      case "return":
        return { label: "مرتجعة", bg: "bg-amber-100 text-amber-800 border-amber-200" };
      default:
        return { label: status || "غير معروف", bg: "bg-gray-100 text-gray-800 border-gray-200" };
    }
  };

  // شارات وسائل الدفع
  const getPaymentBadge = (method) => {
    switch (method) {
      case "cash":
        return { label: "نقدي", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      case "instapay":
        return { label: "إنستا باي", bg: "bg-purple-100 text-purple-800 border-purple-200" };
      case "bank":
        return { label: "تحويل بنكي", bg: "bg-blue-100 text-blue-800 border-blue-200" };
      case "wallet":
        return { label: "محفظة إلكترونية", bg: "bg-amber-100 text-amber-800 border-amber-200" };
      case "work":
        return { label: "شغل", bg: "bg-orange-100 text-orange-800 border-orange-200" };
      default:
        return { label: method || "نقدي", bg: "bg-gray-100 text-gray-800 border-gray-200" };
    }
  };

  const filteredInvoices = invoices;

  if (loading && page === 1) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-ligth space-y-3">
        <Loader2 className="animate-spin text-brown" size={48} />
        <span className="text-dark/70 font-bold">جاري تحميل سجل الفواتير...</span>
      </div>
    );
  }

  // حساب الحسابات المالية للفاتورة المعروضة
  const currentPayments = selectedInvoice?.payments || [];
  const currentTotalPaid = currentPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const totalAmount = selectedInvoice?.invoice?.finalPrice || 0;
  const remainingAmount = totalAmount - currentTotalPaid;

  return (
    <div className="w-full min-w-0 min-h-screen bg-ligth text-dark flex flex-col overflow-x-hidden" dir="rtl">

      {/* ================= 1. NAVBAR العلوي ================= */}
      <header className="w-full bg-white border-b border-brown/20 px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2">
            <FileText className="text-brown" size={24} />
            <h1 className="text-lg sm:text-xl font-black text-dark tracking-tight">سجل الفواتير</h1>
          </div>
        </div>

        {/* شريط البحث والفلتر */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64 md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم الفاتورة أو اسم العميل..."
              className="w-full bg-ligth/70 border border-brown/20 focus:border-brown rounded-xl py-2 pr-10 pl-4 text-xs font-bold text-dark focus:outline-none transition-all"
            />
            <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark/40" />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-ligth/70 border border-brown/20 rounded-xl py-2 px-3 text-xs font-bold text-dark focus:outline-none focus:border-brown transition-all"
          >
            <option value="">جميع الحالات</option>
            <option value="paid">مدفوعة</option>
            <option value="unpaid">غير مدفوعة</option>
            <option value="return">مرتجعة</option>
          </select>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 p-3 sm:p-5 lg:p-6 space-y-5 lg:space-y-6 max-w-[1600px] w-full mx-auto">

        {/* ================= 2. الكروت العلوية الأفقية (اختر الفاتورة) ================= */}
        <div className="bg-white p-3.5 sm:p-4 w-full min-w-0 rounded-2xl border border-brown/20 shadow-sm space-y-3 w-[96vw] overview-auto md:w-full">
          <div className="flex justify-between items-center text-xs">
            <span className="font-black text-dark flex items-center gap-1.5">
              <FileText size={16} className="text-brown" /> سجل الفواتير
              {statusFilter && (
                <span className="px-2 py-0.5 bg-brown/10 text-brown rounded-full text-[10px]">
                  {statusFilter === "paid" ? "مدفوعة" : statusFilter === "unpaid" ? "غير مدفوعة" : "مرتجعة"}
                </span>
              )}
              {debouncedSearchQuery && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px]">
                  بحث: {debouncedSearchQuery}
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1 || loading}
                className="p-1 rounded-lg bg-ligth hover:bg-brown/10 disabled:opacity-30 transition-all text-dark"
              >
                <ChevronRight size={16} />
              </button>
              <span className="font-black text-brown text-[11px]">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages || loading}
                className="p-1 rounded-lg bg-ligth hover:bg-brown/10 disabled:opacity-30 transition-all text-dark"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>

          {/* شريط السحب الأفقي */}
          <div className="flex items-center gap-3 overflow-x-auto py-1.5 touch-pan-x overscroll-x-contain select-none [ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filteredInvoices.length === 0 ? (
              <div className="text-center w-full py-4 text-xs font-bold text-dark/50">
                {debouncedSearchQuery || statusFilter ? "لا توجد فواتير مطابقة للبحث" : "لا توجد فواتير مسجلة"}
              </div>
            ) : (
              filteredInvoices.map((inv) => {
                const isSelected = selectedInvoice?.invoice?._id === inv._id;
                const statusBadge = getStatusBadge(inv.status);
                return (
                  <div
                    key={inv._id}
                    onClick={() => fetchInvoiceDetails(inv._id)}
                    className={`shrink-0 w-[210px] sm:w-[240px] p-3 rounded-xl cursor-pointer border transition-all text-right space-y-2 active:scale-95 ${
                      isSelected
                        ? "bg-brown text-ligth border-brown shadow-md scale-[1.01]"
                        : "bg-ligth/50 hover:bg-white text-dark border-brown/15 hover:border-brown/40"
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className={`px-2 py-0.5 rounded ${isSelected ? "bg-accent text-dark font-black" : "bg-brown/10 text-brown"}`}>
                        {inv?.invoiceNumber || "---"}
                      </span>
                      <span className={`px-2 py-0.5 rounded ${statusBadge.bg}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                    <div className="font-black text-xs truncate flex items-center gap-1">
                      <User size={12} className={isSelected ? "text-accent" : "text-brown"} />
                      {inv.customer?.name || "عميل غير محدد"}
                    </div>
                    <div className="text-left font-black text-xs">
                      {(inv.finalPrice || 0).toLocaleString()} <span className="text-[10px] font-normal">ج.م</span>
                    </div>
                    <div className="text-[9px] opacity-60 flex items-center gap-1">
                      <Calendar size={10} />
                      {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('ar-EG') : '---'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ================= 3. تفاصيل الفاتورة المحددة ================= */}
        {detailsLoading ? (
          <div className="h-72 sm:h-96 flex flex-col items-center justify-center space-y-3 bg-white rounded-2xl border w-[96vw] overview-auto md:w-full border-brown/20 shadow-sm">
            <Loader2 className="animate-spin text-brown" size={40} />
            <span className="text-xs sm:text-sm font-bold text-dark/70">جاري عرض بيانات الفاتورة...</span>
          </div>
        ) : selectedInvoice ? (
          <div className="space-y-5 lg:space-y-6 w-[96vw] overview-auto md:w-full">

            {/* الهيدر الأوسط للفاتورة والأزرار */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-brown/20 shadow-sm">
              <div className="space-y-1 w-full md:w-auto">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-black rounded-md border border-amber-200 flex items-center gap-1">
                    <Eye size={12} /> معاينة الفاتورة الكاملة
                  </span>
                  <span className="text-xs text-dark/50 font-bold">ID: {selectedInvoice.invoice?._id?.slice(-6)}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-dark flex items-center gap-2">
                  فاتورة رقم {selectedInvoice.invoice?.invoiceNumber || "---"}
                </h2>
                <p className="text-xs font-bold text-dark/60 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <User size={14} className="text-brown" /> 
                    العميل: <strong className="text-dark font-black">{selectedInvoice.invoice?.customer?.name || "غير محدد"}</strong>
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={14} className="text-brown" /> 
                    {selectedInvoice.invoice?.invoiceDate ? new Date(selectedInvoice.invoice.invoiceDate).toLocaleDateString('ar-EG') : "---"}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${getStatusBadge(selectedInvoice.invoice?.status).bg}`}>
                    {getStatusBadge(selectedInvoice.invoice?.status).label}
                  </span>
                </p>
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
                <button
                  onClick={() => handleDelete(selectedInvoice.invoice._id)}
                  className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors"
                  title="حذف"
                >
                  <Trash size={18} />
                </button>
                <button
                  onClick={() => navigate(`/invoices/edit/${selectedInvoice.invoice._id}`)}
                  className="flex-1 md:flex-initial justify-center px-4 py-2.5 bg-dark text-ligth hover:bg-dark/90 rounded-xl font-black text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 size={16} /> تعديل
                </button>
                <button
                  onClick={() => navigate(`/invoices/print/${selectedInvoice.invoice._id}`)}
                  className="flex-1 md:flex-initial justify-center px-4 py-2.5 bg-ligth hover:bg-brown/10 text-dark border border-brown/20 rounded-xl font-black text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Printer size={16} /> طباعة
                </button>

<ExportExcelButton
  data={[
    selectedInvoice.invoice,
    ...selectedInvoice.payments
  ]}
  fileName={`فاتورة بيع رقم ${selectedInvoice.invoice?.invoiceNumber}`}
  sheetName={`فاتورة ${selectedInvoice.invoice?.invoiceNumber}`}
/>
              </div>
            </div>

            {/* كروت الإحصائيات المالية */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div className="bg-[#1b494d] text-white p-4 sm:p-5 rounded-2xl shadow-sm relative overflow-auto w-full flex flex-col justify-between h-28 sm:h-32">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold opacity-80">إجمالي الفاتورة</span>
                  <Receipt size={18} className="opacity-60" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-left">
                  {totalAmount.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
                </div>
              </div>

              <div className="bg-[#d97706] text-white p-4 sm:p-5 rounded-2xl shadow-sm relative overflow-auto w-full flex flex-col justify-between h-28 sm:h-32">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold opacity-80">المدفوع</span>
                  <DollarSign size={18} className="opacity-60" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-left">
                  {currentTotalPaid.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
                </div>
              </div>

              <div className="bg-[#1b3d4d] text-white p-4 sm:p-5 rounded-2xl shadow-sm relative overflow-auto w-full flex flex-col justify-between h-28 sm:h-32">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold opacity-80">المتبقي</span>
                  <CreditCard size={18} className="opacity-60" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-left">
                  {remainingAmount.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
                </div>
              </div>
            </div>

            {/* ================= 4. جدول الأصناف ================= */}
            <div className="bg-white rounded-2xl border border-brown/20 shadow-sm overflow-hidden w-full min-w-0">
              <div className="p-4 bg-ligth/40 border-b border-brown/10 flex justify-between items-center">
                <h3 className="font-black text-dark text-xs sm:text-sm flex items-center gap-2">
                  <Package size={18} className="text-brown" /> تفاصيل المنتجات
                </h3>
                <span className="text-[11px] sm:text-xs font-bold text-brown bg-brown/10 px-2.5 py-1 rounded-full">
                  عدد المنتجات: {selectedInvoice.invoice?.items?.length || 0}
                </span>
              </div>

              <div className="overflow-x-auto w-full touch-pan-x overscroll-x-contain">
                <table className="w-full text-right border-collapse text-xs min-w-[480px]">
                  <thead>
                    <tr className="border-b border-brown/10 text-dark/50 bg-ligth/20">
                      <th className="p-3 font-bold whitespace-nowrap">المنتج</th>
                      <th className="p-3 font-bold text-center whitespace-nowrap">الوحدة</th>
                      <th className="p-3 font-bold text-center whitespace-nowrap">الكمية</th>
                      <th className="p-3 font-bold text-center whitespace-nowrap">السعر</th>
                      <th className="p-3 font-bold text-left whitespace-nowrap">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brown/10 font-bold">
                    {selectedInvoice.invoice?.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-ligth/30 transition-colors">
                        <td className="p-3 font-black text-dark whitespace-nowrap">
                          {item.productName || item.product?.name || "منتج بدون اسم"}
                        </td>
                        <td className="p-3 text-center text-dark/80 whitespace-nowrap">
                          {item.unit_type || "---"}
                        </td>
                        <td className="p-3 text-center text-dark/80 whitespace-nowrap">
                          {item.quantity || 0}
                        </td>
                        <td className="p-3 text-center text-dark/80 whitespace-nowrap">
                          {item.price?.toLocaleString() || 0} ج.م
                        </td>
                        <td className="p-3 text-left font-black text-dark whitespace-nowrap">
                          {(item.subtotal || item.quantity * item.price || 0).toLocaleString()} ج.م
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-brown/20 bg-ligth/50 font-black text-dark">
                    <tr>
                      <td colSpan="3" className="p-3 whitespace-nowrap">الإجمالي الكلي</td>
                      <td className="p-3 text-center text-dark/40 whitespace-nowrap">—</td>
                      <td className="p-3 text-left text-xs sm:text-sm bg-brown/10 whitespace-nowrap">
                        {selectedInvoice.invoice?.totalPrice?.toLocaleString() || 0} ج.م
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* ================= 5 & 6. الملاحظات والدفعات ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              
              {/* 5. تفاصيل إضافية */}
              <div className="bg-[#1b3d4d] text-white p-5 sm:p-6 rounded-2xl shadow-sm space-y-3 text-xs flex flex-col justify-between">
                <div>
                  <h4 className="font-black text-amber-400 border-b border-white/10 pb-2 flex items-center gap-2">
                    • تفاصيل إضافية
                  </h4>
                  <div className="space-y-2 font-bold mt-3">
                    <div className="flex justify-between items-center py-1 border-b border-white/5">
                      <span className="opacity-70">رصيد العميل السابق:</span>
                      <span>{(selectedInvoice.invoice?.oldCustomerBalance || 0).toLocaleString()} ج.م</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-white/5">
                      <span className="opacity-70">قيمة الخصم:</span>
                      <span className="font-black text-emerald-400">{selectedInvoice.invoice?.discount || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-white/5">
                      <span className="opacity-70">صافي الفاتورة:</span>
                      <span className="font-black">{totalAmount.toLocaleString()} ج.م</span>
                    </div>
                    <div className="flex justify-between items-center pt-3  text-xs  border-b border-white/5">
                  <span className="opacity-70">إجمالي المدفوع:</span>
                  <span className="text-emerald-700 text-sm">{currentTotalPaid.toLocaleString()} ج.م</span>
                </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="opacity-70">رصيد العميل الحالي:</span>
                      <span className="font-black">{(selectedInvoice.invoice?.customer?.balance || 0).toLocaleString()} ج.م</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 mt-3">
                  <span className="opacity-70 block mb-1">ملاحظات:</span>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10 opacity-90 break-words">
                    {selectedInvoice.invoice?.adminNote || "لا يوجد ملاحظات مسجلة لهذه الفاتورة."}
                  </div>
                </div>
              </div>

              {/* 6. تحليل الدفعات */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-brown/20 shadow-sm space-y-4 text-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center border-b border-brown/10 pb-3">
                    <h4 className="font-black text-dark flex items-center gap-2">
                      <CreditCard size={16} className="text-brown" /> تحليل الدفعات
                    </h4>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      {currentPayments.length} عملية دفع
                    </span>
                  </div>

                  {currentPayments.length === 0 ? (
                    <div className="bg-ligth/40 p-4 my-3 rounded-xl text-center text-dark/50 font-bold">
                      لا توجد دفعات مسجلة لهذه الفاتورة
                    </div>
                  ) : (
                    <div className="space-y-2 mt-3 max-h-60 overflow-y-auto pr-1">
                      {currentPayments.map((p, idx) => {
                        const badge = getPaymentBadge(p.paymentMethod);
                        return (
                          <div key={idx} className="p-3 bg-ligth/40 rounded-xl border border-brown/10 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className={`px-2 py-0.5 rounded-lg font-black border ${badge.bg}`}>
                                {badge.label}
                              </span>
                              <span className="font-black text-dark text-xs sm:text-sm">
                                {(p.amount || 0).toLocaleString()} ج.م
                              </span>
                            </div>

                            {p.bankInfo?.bankName && (
                              <div className="text-[11px] text-dark/70 space-y-0.5 pt-1 border-t border-brown/10">
                                <p><span className="text-dark/40">البنك:</span> {p.bankInfo.bankName}</p>
                              </div>
                            )}
                            {p.walletInfo && (
                              <div className="text-[11px] text-dark/70 space-y-0.5 pt-1 border-t border-brown/10">
                                <p><span className="text-dark/40">المستلم:</span> {p.walletInfo.receiverPhone || p.walletInfo.receiverName || "---"}</p>
                                <p><span className="text-dark/40">المرسل:</span> {p.walletInfo.senderPhone || p.walletInfo.senderName || "---"}</p>
                              </div>
                            )}
                            {p.notes && (
                              <div className="text-[11px] text-dark/70 pt-1 border-t border-brown/10">
                                <p><span className="text-dark/40">ملاحظات:</span> {p.notes}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-3 font-black text-xs text-dark border-t border-brown/10">
                  <span>إجمالي المدفوع:</span>
                  <span className="text-amber-700 text-sm">{currentTotalPaid.toLocaleString()} ج.م</span>
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="h-72 flex flex-col items-center justify-center space-y-3 bg-white rounded-2xl border border-brown/20 shadow-sm">
            <FileText size={48} className="text-dark/20" />
            <span className="text-xs sm:text-sm font-bold text-dark/50">اختر فاتورة لعرض التفاصيل</span>
          </div>
        )}

      </main>
    </div>
  );
};

export default InvoiceList;