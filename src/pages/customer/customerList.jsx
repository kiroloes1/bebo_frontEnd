import React, { useEffect, useState } from "react";
import { showAlert } from "../../services/alert";
import api from "../../services/api";
import { 
  Search, User, Phone, Wallet, 
  History, Plus, ArrowUpRight, 
  ArrowDownLeft, Trash2, Info, Calendar, 
  Printer, Edit, ArrowUpLeft, Eye, TrendingUp, 
  Link, Building, Hash, Clock, FileText
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { showAlertConfirm } from "../../services/alertConfirm";
import axios from "axios";

const CustomerList = () => {
  const [operations, setOperations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);
  const [suggestionWallets, setSuggestionWallets] = useState([]);
  const [walletSearch, setWalletSearch] = useState("");
  const [showWalletList, setShowWalletList] = useState(false);
  const navigate = useNavigate();

  // حالة مودال التعديل
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    id: "",
    module: "pay",
    moneyFlow: "outgoing",
    paymentMethod: "cash",
    amount: "",
    note: "",
    date: "",
    bankInfo: { bankName: "", transactionReference: "" },
    walletInfo: { 
      provider: "", 
      senderName: "", 
      senderPhone: "", 
      receiverName: "", 
      receiverPhone: "", 
      transactionReference: "",
      linkWallet: false,
      walletId: ""
    },
    cheque: { 
      chequeNumber: "", 
      chequeType: "normal", 
      bankName: "", 
      receiveDate: "", 
      dueDate: "",
      status: "under_collection"
    }
  });

  const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  // جلب اقتراحات المحافظ
  const fetchSuggestions = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/wallet/getSugg`, {
        headers: {
          "x-api-key": import.meta.env.VITE_API_X_API_KEY,
          "Content-Type": "application/json",
        },
      });
      setSuggestionWallets(res.data.wallets || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  // جلب قائمة العملاء
  const fetchCustomers = async () => {
    try {
      const res = await api.get("/customers/getAllCustomerName");
      setCustomers(res.data.data || []);
      setFilteredCustomers(res.data.data || []);
    } catch (err) {
      showAlert({ title: "فشل في تحميل العملاء", icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // حذف فاتورة بيع
  const deleteInvoice = async (invoiceId) => {
    const confirm = await showAlertConfirm({
      title: "حذف الفاتورة",
      text: "هل أنت متأكد من حذف هذه الفاتورة؟ سيتم حذفها وتأثيرها المالي من حساب العميل.",
      icon: "warning",
      confirmButtonText: "نعم، احذف",
      cancelButtonText: "إلغاء"
    });

    if (!confirm.isConfirmed) return;

    try {
      await api.delete(`/invoice/${invoiceId}`);

      showAlert({
        title: "تم حذف الفاتورة بنجاح",
        icon: "success"
      });

      await toSelectedCustomer(selectedCustomer._id);
      await fetchCustomers();

    } catch (err) {
      console.error("Delete invoice error:", err);

      showAlert({
        title: err.response?.data?.message || "فشل حذف الفاتورة",
        icon: "error"
      });
    }
  };

  // جلب بيانات العميل المحدد ومعاملاته
  const toSelectedCustomer = async (id) => {
    try {
      setSubLoading(true);

      const [customerRes, invoiceRes] = await Promise.all([
        api.get(`/customers/${id}`),
        api.get(`/invoice/getInvoicesByCustomer?customerId=${id}`)
      ]);

      const customerData = customerRes.data.data;
      const paymentsData = customerRes.data.payment || [];

      // =========================
      // 1. العمليات المالية (استثناء عمليات الفواتير عشان مش نكررها)
      // =========================
      // ✅ تصفية المدفوعات: استبعاد الـ payments المرتبطة بفاتورة (module === "invoices")
      const paymentOperations = paymentsData
        .filter(item => item.module !== "invoices") // ✅ المهم: استبعاد مدفوعات الفواتير
        .map((item) => ({
          id: item._id,
          module: item.module,
          amount: item.amount,
          paymentMethod: item.paymentMethod,
          moneyFlow: item.moneyFlow,
          date: item.transactionDate || item.createdAt,
          note: item.notes || "",
          moduleId: item.moduleId,
          createdBy: item.createdBy?.username || "---",

          bankInfo: item.bankInfo || {
            bankName: "",
            transactionReference: ""
          },

          walletInfo: item.walletInfo || {
            provider: "",
            senderName: "",
            senderPhone: "",
            receiverName: "",
            receiverPhone: "",
            transactionReference: "",
            linkWallet: false,
            walletId: ""
          },

          cheque: item.cheque || null,

          operationType: "payment"
        }));

      // =========================
      // 2. الفواتير (مع مدفوعاتها المضمنة)
      // =========================
      const invoices = invoiceRes.data.invoices || [];

      const invoiceOperations = invoices.map((invoice) => ({
        id: `invoice-${invoice._id}`,

        module: "invoice",

        amount: invoice.finalPrice || 0,

        paymentMethod: null,

        // بيع للعميل = فلوس واردة لينا
        moneyFlow: "incoming",

        date: invoice.invoiceDate || invoice.createdAt,

        note: invoice.adminNote || "",

        moduleId: invoice._id,

        createdBy: invoice.user?.username || "---",

        bankInfo: null,
        walletInfo: null,
        cheque: null,

        invoiceNumber: invoice.invoiceNumber,
        paidAmount: invoice.paidAmount || 0,
        remainingAmount: invoice.remainingAmount || 0,
        oldBalance: invoice.oldCustomerBalance || 0,
        items: invoice.items || [],
        // ✅ إضافة المدفوعات المرتبطة بالفاتورة (من الـ Payment model)
        // هتكون موجودة في invoice.payments لو الـ API بيرجعها
        invoicePayments: invoice.payments || [],

        operationType: "invoice"
      }));

      // =========================
      // 3. دمج العمليات
      // =========================
      const allOperations = [
        ...paymentOperations,
        ...invoiceOperations
      ];

      allOperations.sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      setSelectedCustomer(customerData);
      setOperations(allOperations);

    } catch (err) {
      console.error("Customer details error:", err);

      showAlert({
        title: "فشل في جلب تفاصيل العميل",
        text: err.response?.data?.message || "حدث خطأ أثناء تحميل البيانات",
        icon: "error"
      });
    } finally {
      setSubLoading(false);
    }
  };

  // تصفية العملاء أثناء البحث
  useEffect(() => {
    const results = customers.filter(c =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm)
    );
    setFilteredCustomers(results);
  }, [searchTerm, customers]);

  // حذف عميل
  const handleDelete = async (id, name) => {
    const confirm = await showAlertConfirm({
      title: `حذف العميل ${name}`,
      text: "هل أنت متأكد من حذف هذا العميل نهائياً؟ لا يمكن التراجع عن هذا الإجراء.",
      icon: "warning",
      confirmButtonText: "نعم، احذف",
      cancelButtonText: "تراجع",
    });

    if (!confirm.isConfirmed) return;

    try {
      await api.delete(`/customers/${id}`);
      showAlert({ title: "تم الحذف بنجاح", icon: "success" });

      if (selectedCustomer?._id === id) {
        setSelectedCustomer(null);
        setOperations([]);
      }

      fetchCustomers();
    } catch (err) {
      showAlert({ title: "فشل الحذف", icon: "error" });
    }
  };

  // فتح مودال التعديل للعملية
  const editPaymentHistory = (payment) => {
    let chequeData = { 
      chequeNumber: "", 
      chequeType: "normal", 
      bankName: "", 
      receiveDate: "", 
      dueDate: "",
      status: "under_collection"
    };
    
    if (payment.cheque && typeof payment.cheque === 'object') {
      chequeData = {
        chequeNumber: payment.cheque.chequeNumber || "",
        chequeType: payment.cheque.chequeType || "normal",
        bankName: payment.cheque.bankName || "",
        receiveDate: payment.cheque.receiveDate ? formatDateForInput(payment.cheque.receiveDate) : "",
        dueDate: payment.cheque.dueDate ? formatDateForInput(payment.cheque.dueDate) : "",
        status: payment.cheque.status || "under_collection"
      };
    }

    setEditData({
      id: payment.id,
      module: payment.module || "pay",
      moneyFlow: payment.moneyFlow || "outgoing",
      paymentMethod: payment.paymentMethod || "cash",
      amount: payment.amount,
      note: payment.note || "",
      date: formatDateForInput(payment.date),
      bankInfo: payment.bankInfo || { bankName: "", transactionReference: "" },
      walletInfo: payment.walletInfo || { 
        provider: "", senderName: "", senderPhone: "", 
        receiverName: "", receiverPhone: "", transactionReference: "",
        linkWallet: false, walletId: ""
      },
      cheque: chequeData
    });
    setShowEditModal(true);
  };

  // حفظ تعديل العملية
  const updatePaymentHistory = async () => {
    try {
      const payload = {
        amount: Number(editData.amount),
        paymentMethod: editData.paymentMethod,
        module: editData.module,
        note: editData.note,
        date: editData.date,
      };

      if (editData.paymentMethod === "bank" || editData.paymentMethod === "instapay") {
        payload.bankInfo = editData.bankInfo;
      }

      if (editData.paymentMethod === "wallet") {
        payload.walletInfo = editData.walletInfo;
      }


      await api.patch(
        `/customers/editPaymentHistory/${editData.id}/${selectedCustomer._id}`,
        payload
      );

      showAlert({ title: "تم التعديل بنجاح", icon: "success" });
      setShowEditModal(false);

      await toSelectedCustomer(selectedCustomer._id);
      fetchCustomers();
    } catch (err) {
      showAlert({
        title: err.response?.data?.message || "حدث خطأ أثناء التعديل",
        icon: "error"
      });
    }
  };

  // حذف عملية ماليّة
  const deletePaymentHistory = async (paymentId) => {
    const confirm = await showAlertConfirm({
      title: "حذف العملية",
      text: "هل أنت متأكد من حذف هذه العملية الماليّة؟",
      icon: "warning",
      confirmButtonText: "نعم",
      cancelButtonText: "إلغاء"
    });

    if (!confirm.isConfirmed) return;

    try {
      await api.delete(
        `/customers/deletePaymentHistory/${paymentId}/${selectedCustomer._id}`
      );

      showAlert({
        title: "تم الحذف بنجاح",
        icon: "success"
      });

      await toSelectedCustomer(selectedCustomer._id);
      fetchCustomers();

    } catch (err) {
      showAlert({
        title: err.response?.data?.message || "حدث خطأ أثناء الحذف",
        icon: "error"
      });
    }
  };

  // عرض الحقول الإضافية في مودال التعديل
  const renderEditPaymentFields = () => {
    const method = editData.paymentMethod;

    if (method === "cheque") {
      return (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="text-right">
              <label className="text-[11px] font-black text-slate-500 block mb-1">
                <Hash size={12} className="inline ml-1" /> رقم الشيك
              </label>
              <input 
                type="text" 
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:border-orange-500 outline-none"
                placeholder="رقم الشيك"
                value={editData.cheque?.chequeNumber || ""} 
                onChange={(e) => setEditData({ 
                  ...editData, 
                  cheque: { ...editData.cheque, chequeNumber: e.target.value } 
                })} 
              />
            </div>
            <div className="text-right">
              <label className="text-[11px] font-black text-slate-500 block mb-1">
                <Building size={12} className="inline ml-1" /> البنك المسحوب عليه
              </label>
              <input 
                type="text" 
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:border-orange-500 outline-none"
                placeholder="اسم البنك"
                value={editData.cheque?.bankName || ""} 
                onChange={(e) => setEditData({ 
                  ...editData, 
                  cheque: { ...editData.cheque, bankName: e.target.value } 
                })} 
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="text-right">
              <label className="text-[11px] font-black text-slate-500 block mb-1">
                <Calendar size={12} className="inline ml-1" /> تاريخ الاستلام
              </label>
              <input 
                type="date" 
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:border-orange-500 outline-none"
                value={editData.cheque?.receiveDate || ""} 
                onChange={(e) => setEditData({ 
                  ...editData, 
                  cheque: { ...editData.cheque, receiveDate: e.target.value } 
                })} 
              />
            </div>
            <div className="text-right">
              <label className="text-[11px] font-black text-slate-500 block mb-1">
                <Clock size={12} className="inline ml-1" /> تاريخ الاستحقاق
              </label>
              <input 
                type="date" 
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:border-orange-500 outline-none"
                value={editData.cheque?.dueDate || ""} 
                onChange={(e) => setEditData({ 
                  ...editData, 
                  cheque: { ...editData.cheque, dueDate: e.target.value } 
                })} 
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="text-right">
              <label className="text-[11px] font-black text-slate-500 block mb-1">نوع الشيك</label>
              <select
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:border-orange-500 outline-none"
                value={editData.cheque?.chequeType || "normal"}
                onChange={(e) => setEditData({ 
                  ...editData, 
                  cheque: { ...editData.cheque, chequeType: e.target.value } 
                })}
              >
                <option value="normal">عادي</option>
                <option value="clearing">مقاصة</option>
              </select>
            </div>
            <div className="text-right">
              <label className="text-[11px] font-black text-slate-500 block mb-1">حالة الشيك</label>
              <select
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:border-orange-500 outline-none"
                value={editData.cheque?.status || "under_collection"}
                onChange={(e) => setEditData({ 
                  ...editData, 
                  cheque: { ...editData.cheque, status: e.target.value } 
                })}
              >
                <option value="under_collection">تحت التحصيل</option>
                <option value="due_today">مستحق اليوم</option>
                <option value="collected">تم التحصيل</option>
                <option value="returned">مرتجع</option>
                <option value="cancelled">ملغي</option>
              </select>
            </div>
          </div>
        </div>
      );
    }

    if (method === "bank" || method === "instapay") {
      return (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="text-right">
              <label className="text-[11px] font-black text-slate-500 block mb-1">
                <Building size={12} className="inline ml-1" /> اسم البنك / المنصة
              </label>
              <input 
                type="text" 
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:border-orange-500 outline-none"
                placeholder={method === "instapay" ? "إنستا باي" : "اسم البنك"}
                value={editData.bankInfo?.bankName || ""} 
                onChange={(e) => setEditData({ 
                  ...editData, 
                  bankInfo: { ...editData.bankInfo, bankName: e.target.value } 
                })} 
              />
            </div>
            <div className="text-right">
              <label className="text-[11px] font-black text-slate-500 block mb-1">
                <FileText size={12} className="inline ml-1" /> رقم مرجع المعاملة
              </label>
              <input 
                type="text" 
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:border-orange-500 outline-none"
                placeholder="رقم التحويل أو العملية"
                value={editData.bankInfo?.transactionReference || ""} 
                onChange={(e) => setEditData({ 
                  ...editData, 
                  bankInfo: { ...editData.bankInfo, transactionReference: e.target.value } 
                })} 
              />
            </div>
          </div>
        </div>
      );
    }

    if (method === "wallet") {
      return (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="text-right">
              <label className="text-[11px] font-black text-slate-500 block mb-1">رقم الراسل</label>
              <input
                type="text"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:border-orange-500 outline-none"
                placeholder="رقم هاتف الراسل"
                value={editData.walletInfo?.senderPhone || ""}
                onChange={(e) => setEditData({ 
                  ...editData, 
                  walletInfo: { ...editData.walletInfo, senderPhone: e.target.value } 
                })}
              />
            </div>
            <div className="text-right">
              <label className="text-[11px] font-black text-slate-500 block mb-1">اسم الراسل</label>
              <input
                type="text"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:border-orange-500 outline-none"
                placeholder="اسم الراسل"
                value={editData.walletInfo?.senderName || ""}
                onChange={(e) => setEditData({ 
                  ...editData, 
                  walletInfo: { ...editData.walletInfo, senderName: e.target.value } 
                })}
              />
            </div>
          </div>

          {!editData.walletInfo?.linkWallet && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="text-right">
                <label className="text-[11px] font-black text-slate-500 block mb-1">رقم المستلم</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:border-orange-500 outline-none"
                  placeholder="رقم هاتف المستلم"
                  value={editData.walletInfo?.receiverPhone || ""}
                  onChange={(e) => setEditData({ 
                    ...editData, 
                    walletInfo: { ...editData.walletInfo, receiverPhone: e.target.value } 
                  })}
                />
              </div>
              <div className="text-right">
                <label className="text-[11px] font-black text-slate-500 block mb-1">اسم المستلم</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:border-orange-500 outline-none"
                  placeholder="اسم المستلم"
                  value={editData.walletInfo?.receiverName || ""}
                  onChange={(e) => setEditData({ 
                    ...editData, 
                    walletInfo: { ...editData.walletInfo, receiverName: e.target.value } 
                  })}
                />
              </div>
            </div>
          )}

          {editData.walletInfo?.linkWallet && (
            <div className="relative text-right">
              <label className="text-[11px] font-black text-slate-500 block mb-1">المحفظة المستلمة</label>
              <input
                type="text"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:border-orange-500 outline-none"
                placeholder="ابحث بالاسم أو رقم المحفظة..."
                value={walletSearch}
                onFocus={() => setShowWalletList(true)}
                onChange={(e) => {
                  setWalletSearch(e.target.value);
                  setShowWalletList(true);
                }}
              />
              {showWalletList && walletSearch.length > 0 && (
                <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto bg-white rounded-xl border shadow-xl">
                  {suggestionWallets
                    .filter((w) =>
                      w.walletName?.toLowerCase().includes(walletSearch.toLowerCase()) ||
                      w.phoneNumber?.includes(walletSearch)
                    )
                    .map((wallet) => (
                      <div
                        key={wallet._id}
                        className="p-3 border-b hover:bg-slate-50 cursor-pointer transition"
                        onClick={() => {
                          setEditData({ 
                            ...editData, 
                            walletInfo: { 
                              ...editData.walletInfo, 
                              walletId: wallet._id,
                              receiverName: wallet.walletName,
                              receiverPhone: wallet.phoneNumber,
                              provider: wallet.walletProvider
                            } 
                          });
                          setWalletSearch(wallet.walletName);
                          setShowWalletList(false);
                        }}
                      >
                        <div className="font-black text-dark">{wallet.walletName}</div>
                        <div className="text-xs text-slate-500">{wallet.phoneNumber}</div>
                        <div className="text-xs text-green-600">{wallet.walletProvider}</div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {editData.walletInfo?.walletId && editData.walletInfo?.linkWallet && (
            <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-slate-200">
              <div className="text-right">
                <label className="text-[10px] font-black text-slate-400 block">اسم المستلم</label>
                <input
                  readOnly
                  value={editData.walletInfo.receiverName || ""}
                  className="w-full p-2 bg-slate-50 rounded-lg text-sm font-semibold border border-slate-100"
                />
              </div>
              <div className="text-right">
                <label className="text-[10px] font-black text-slate-400 block">رقم المستلم</label>
                <input
                  readOnly
                  value={editData.walletInfo.receiverPhone || ""}
                  className="w-full p-2 bg-slate-50 rounded-lg text-sm font-semibold border border-slate-100"
                />
              </div>
              <div className="text-right">
                <label className="text-[10px] font-black text-slate-400 block">شركة المحفظة</label>
                <input
                  readOnly
                  value={editData.walletInfo.provider || ""}
                  className="w-full p-2 bg-slate-50 rounded-lg text-sm font-semibold border border-slate-100"
                />
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  // ترجمة أنواع الوحدات (Modules)
  const renderModuleBadge = (module, moneyFlow) => {
    const isIncoming = moneyFlow === "incoming";

    const badges = {
      pay: {
        label: "زيادة مديونية العميل",
        color: "bg-red-50 text-red-600"
      },

      invoice: {
        label: "فاتورة بيع",
        color: "bg-blue-50 text-blue-600"
      },

      debt: {
        label: "استلام من عميل",
        color: "bg-emerald-50 text-emerald-600"
      }
    };

    const target = badges[module] || {
      label: module,
      color: "bg-slate-100 text-slate-600"
    };

    return (
      <span
        className={`flex items-center gap-1 w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase ${target.color}`}
      >
        {module === "invoice" ? (
          <ArrowUpRight size={10} />
        ) : isIncoming ? (
          <ArrowDownLeft size={10} />
        ) : (
          <ArrowUpRight size={10} />
        )}

        {target.label}
      </span>
    );
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-light">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark -500"></div>
    </div>
  );

  return (
    <div className=" flex flex-col justify-between md:flex-row min-h-screen md:h-screen gap-6 p-4 overflow-y-auto" dir="rtl">
      
      {/* القائمة اليمنى: العملاء والبحث */}
      <div className="md:w-1/3 w-full flex flex-col bg-white rounded-[24px]  border border-slate-100  h-[100vw] lg:h-full">
        <div className="p-6 border-b border-slate-50">
          <h2 className="text-xl font-black text-dark mb-4 flex items-center gap-2">
            <User className="text-dark -500" /> قائمة العملاء
          </h2>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="ابحث باسم العميل أو رقم الهاتف..."
              className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-dark -500 outline-none transition-all text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {filteredCustomers.map((c, i) => (
            <div
              key={c._id}
              onClick={() => toSelectedCustomer(c._id)}
              className={`p-4 rounded-lg cursor-pointer transition-all border flex items-center justify-between group ${
                selectedCustomer?._id === c._id 
                  ? "bg-amber-50 border-dark -500" 
                  : "bg-white border-transparent hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold ${
                  selectedCustomer?._id === c._id ? "bg-dark -500 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {i + 1}
                </div>
                <div>
                  <h4 className="font-semibold text-dark text-lg">{c.name}</h4>
                </div>
              </div>
              <div className="text-left">
                <p
                  className={`text-lg font-black ${
                    (c.balance || 0) >= 0
                      ? "text-emerald-500"
                      : "text-red-500"
                  }`}
                >
                  {(c.balance || 0).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* القسم الأيسر: تفاصيل العميل والسجل */}
      <div className="flex flex-col flex-1 justify-center gap-6 overflow-y-auto min-h-screen md:h-screen custom-scrollbar">
        {selectedCustomer && !subLoading ? (
          <>
            {/* بطاقة معلومات العميل */}
            <div className="bg-white p-6 md:p-8 rounded-[24px] border border-slate-100 relative ">
              <div className="absolute top-0 left-0 w-40 h-40 bg-dark -500/5 rounded-full -ml-20 -mt-20" />

              <div className="relative flex flex-col md:flex-row justify-between items-start gap-6">
                <div>
                  <h2 className="text-2xl font-black text-dark">{selectedCustomer.name}</h2>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3">
                    <span className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
                      <Phone size={16} className="text-dark -500" /> {selectedCustomer.phone || "---"}
                    </span>
                    <span className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
                      <Calendar size={16} className="text-dark -500" /> انضم {new Date(selectedCustomer.createdAt || Date.now()).toLocaleDateString('ar-EG')}
                    </span>
                    {selectedCustomer.notes && (
                      <span className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
                        <span className="text-dark -500">●</span> ملاحظات: {selectedCustomer.notes}
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-full md:w-auto flex flex-col gap-3">

                  <div className="grid grid-cols-1 sm:grid-cols-1 gap-3 w-full">
                    <button
                      onClick={() =>
                        navigate(`/customer/printCustomerDetails/${selectedCustomer?._id}`)
                      }
                      className="
                        flex items-center justify-center gap-2
                        px-5 py-3
                        bg-emerald-50 text-emerald-600
                        border border-emerald-100
                        rounded-xl
                        hover:bg-emerald-600 hover:text-white
                        transition-all duration-200
                        font-semibold text-sm
                        shadow-sm
                      "
                    >
                      <Printer size={18} />
                      <span>كشف حساب</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    {/* <button
                      onClick={() =>
                        navigate(`/customer/CustomerPrintManager/${selectedCustomer?._id}`)
                      }
                      className="
                        flex items-center justify-center gap-2
                        px-5 py-3
                        bg-slate-50 text-slate-600
                        border border-emerald-100
                        rounded-xl
                        hover:bg-emerald-600 hover:text-white
                        transition-all duration-200
                        font-semibold text-sm
                        shadow-sm
                      "
                    >
                      <Printer size={18} />
                    </button> */}

                    <button
                      onClick={() => navigate(`/customer/edit/${selectedCustomer._id}`)}
                      className="
                        flex items-center justify-center
                        w-12 h-12
                        bg-slate-100
                        text-slate-700
                        rounded-xl
                        hover:bg-slate-700 hover:text-white
                        transition-all duration-200
                        border border-slate-200
                        shadow-sm
                      "
                      title="تعديل البيانات"
                    >
                      <Edit size={20} />
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(selectedCustomer._id, selectedCustomer.name)
                      }
                      className="
                        flex items-center justify-center
                        w-12 h-12
                        bg-red-50
                        text-red-500
                        rounded-xl
                        hover:bg-red-500 hover:text-white
                        transition-all duration-200
                        border border-red-100
                        shadow-sm
                      "
                      title="حذف العميل"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
                <div
                  className={`p-6 rounded-lg border transition-all ${
                    (selectedCustomer.balance || 0) >= 0
                      ? "bg-emerald-50/50 border-emerald-100 hover:border-emerald-200"
                      : "bg-red-50/50 border-red-100 hover:border-red-200"
                  }`}
                >
                  <p className="text-[11px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full animate-pulse ${
                        (selectedCustomer.balance || 0) >= 0
                          ? "bg-emerald-500"
                          : "bg-red-500"
                      }`}
                    />

                    <span
                      className={
                        (selectedCustomer.balance || 0) >= 0
                          ? "text-emerald-600"
                          : "text-red-600"
                      }
                    >
                      {(selectedCustomer.balance || 0) >= 0
                        ? "لينا فلوس عند العميل"
                        : "علينا فلوس للعميل"}
                    </span>
                  </p>

                  <h3
                    className={`text-2xl font-black flex items-baseline gap-2 ${
                      (selectedCustomer.balance || 0) >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {(selectedCustomer.balance || 0).toLocaleString()}

                    <span className="text-sm font-semibold opacity-60">
                      ج.م
                    </span>
                  </h3>
                </div>

                <div className="bg-slate-900 p-6 rounded-lg text-white relative overflow-hidden group">
                  <div className="relative z-10">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">إجمالي المعاملات الماليّة</p>
                    <h3 className="text-2xl font-black flex items-baseline gap-2">
                      {operations?.length || 0}
                      <span className="text-sm font-semibold opacity-40 uppercase">عملية مسجلة</span>
                    </h3>
                  </div>
                  <div className="absolute right-[-10%] bottom-[-20%] opacity-10 group-hover:scale-110 transition-transform">
                    <TrendingUp size={120} />
                  </div>
                </div>
              </div>
            </div>

            {/* جدول سجل المدفوعات والعمليات الماليّة */}
            <div className="overflow-y-auto custom-scrollbar bg-white flex-1 rounded-[15px] border border-slate-100 flex flex-col">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-black text-dark flex items-center gap-2 text-lg uppercase tracking-wide">
                  <History className="text-dark -500" size={18} /> سجل المدفوعات والعمليات الماليّة
                </h3>
              </div>

              {operations?.length > 0 ? (
                <table className="w-full text-right border-collapse">
                  <thead className="sticky top-0 bg-white shadow-sm z-10 ">
                    <tr className="text-[10px] font-black text-slate-400 uppercase bg-white">
                      <th className="p-3 sm:p-5">الوحدة</th>
                      <th className="p-3 sm:p-5">المبلغ</th>
                      <th className="p-3 sm:p-5">طريقة الدفع</th>
                      <th className="p-3 sm:p-5">التاريخ</th>
                      <th className="p-3 sm:p-5">ملاحظات</th>
                      <th className="p-3 sm:p-5">الإجراءات</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-50">
                    {operations
                      .slice()
                      .reverse()
                      .map((t, idx) => (
                        <tr key={t.id || idx} className="hover:bg-slate-50 transition-colors">
                          
                          <td className="p-3 sm:p-5">
                            {renderModuleBadge(t.module, t.moneyFlow)}
                          </td>

                          <td className="p-3 sm:p-5 font-black text-dark">
                            <div>
                              {t.amount?.toLocaleString()} ج.م
                            </div>

                            {t.module === "invoice" && (
                              <div className="text-[10px] text-slate-400 mt-1">
                                مدفوع: {t.paidAmount?.toLocaleString()} ج.م
                              </div>
                            )}
                          </td>

                          <td className="p-3 sm:p-5 text-sm text-slate-600 font-semibold">
                            {t.module === "invoice" ? (
                              <div className="flex flex-col gap-1">
                                <span className="text-blue-600 font-black">
                                  فاتورة رقم {t.invoiceNumber}
                                </span>
                                {/* ✅ عرض المدفوعات المرتبطة بالفاتورة */}
                                {t.invoicePayments && t.invoicePayments.length > 0 && (
                                  <div className="text-[10px] text-slate-500 space-y-0.5">
                                    {t.invoicePayments.map((p, i) => (
                                      <div key={i} className="flex items-center gap-1">
                                        <span className="text-emerald-600 font-semibold">
                                          {p.amount?.toLocaleString()} ج.م
                                        </span>
                                        <span className="text-slate-400">
                                          ({p.paymentMethod === "cash" ? "نقدي" :
                                            p.paymentMethod === "wallet" ? "محفظة" :
                                            p.paymentMethod === "instapay" ? "أنستا باي" :
                                            p.paymentMethod === "work" ? "شغل" :
                                            p.paymentMethod === "cheque" ? "شيك" :
                                            p.paymentMethod || "غير محدد"})
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <>
                                {t.paymentMethod === "cash" && "نقدي"}
                                {t.paymentMethod === "wallet" && "محفظة"}
                                {t.paymentMethod === "instapay" && "أنستا باي"}
                                {t.paymentMethod === "work" && "شغل"}
                                {t.paymentMethod === "cheque" && "شيك"}

                                {/* عرض تفاصيل إضافية للدفعات */}
                                {t.walletInfo && (
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    {t.walletInfo.receiverName && `المستلم: ${t.walletInfo.receiverName}`}
                                    {t.walletInfo.receiverPhone && ` (${t.walletInfo.receiverPhone})`}
                                  </div>
                                )}
                                {t.bankInfo?.bankName && (
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    البنك: {t.bankInfo.bankName}
                                  </div>
                                )}
                                {t.cheque?.chequeNumber && (
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    شيك رقم: {t.cheque.chequeNumber}
                                  </div>
                                )}
                              </>
                            )}
                          </td>

                          <td className="p-3 sm:p-5 text-sm text-slate-400 font-medium">
                            {new Date(t.date).toLocaleString('ar-EG', {
                              dateStyle: 'short',
                              timeStyle: 'short'
                            })}
                          </td>

                          <td className="p-3 sm:p-5 text-sm text-slate-500 italic">
                            {t.note || "---"}
                          </td>

                          <td className="p-3 sm:p-5">
                            <div className="flex items-center gap-3">
                              {t.moduleId && (
                                <Eye
                                  size={20}
                                  onClick={() => navigate(`/invoices/print/${t.moduleId}`)}
                                  className="text-dark -600 cursor-pointer hover:text-dark -500"
                                  title="عرض المستند المتعلق"
                                />
                              )}
                              
                              {(
                                <Edit
                                  size={20}
                                  className="text-blue-600 cursor-pointer hover:text-blue-400"
                                  onClick={() => {
                                    if (t.module === "invoice") {
                                      navigate(`/invoices/edit/${t.moduleId}`);
                                    } else {
                                      editPaymentHistory(t);
                                    }
                                  }}
                                  title={t.module === "invoice" ? "تعديل الفاتورة" : "تعديل"}
                                />
                              )}

                              <Trash2
                                size={20}
                                className="text-red-700 cursor-pointer hover:text-red-500"
                                onClick={() => {
                                  if (t.module === "invoice") {
                                    deleteInvoice(t.moduleId);
                                  } else {
                                    deletePaymentHistory(t.id);
                                  }
                                }}
                                title={t.module === "invoice" ? "حذف الفاتورة" : "حذف"}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 py-20">
                  <Info size={48} className="mb-2 opacity-20" />
                  <p className="font-semibold">لا توجد عمليات ماليّة مسجلة بعد</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-white rounded-[15px] border border-dashed border-slate-200 text-slate-400">
            {subLoading ? (
              <p className="text-xl font-semibold text-dark -500">جاري تحميل بيانات العميل...</p>
            ) : (
              <>
                <User size={64} className="mb-4 opacity-10" />
                <p className="text-lg font-semibold">اختر عميل من القائمة لعرض التفاصيل</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* مودال تعديل المعاملة الماليّة */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl w-[600px] max-w-[95vw] p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-6 text-slate-800">تعديل العملية المالية</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">الوحدة</label>
                <select
                  className="w-full border rounded-lg p-2 outline-none focus:border-dark -500"
                  value={editData.module}
                  onChange={(e) => setEditData({ ...editData, module: e.target.value })}
                >
                  <option value="pay">دفع (استلام فلوس من عميل)</option>
                  <option value="debt">مديونية (فلوس على العميل)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">المبلغ</label>
                <input
                  type="number"
                  className="w-full border rounded-lg p-2 outline-none focus:border-dark -500"
                  value={editData.amount}
                  onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">طريقة الدفع</label>
                <select
                  className="w-full border rounded-lg p-2 outline-none focus:border-dark -500"
                  value={editData.paymentMethod}
                  onChange={(e) => setEditData({ ...editData, paymentMethod: e.target.value })}
                >
                  <option value="cash">نقدي</option>
                  <option value="wallet">محفظة</option>
                  <option value="instapay">أنستا باي</option>
                  <option value="cheque">شيك</option>
                  <option value="work">شغل</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">التاريخ</label>
                <input
                  type="datetime-local"
                  className="w-full border rounded-lg p-2 outline-none focus:border-dark -500"
                  value={editData.date}
                  onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">ملاحظات</label>
                <textarea
                  className="w-full border rounded-lg p-2 outline-none focus:border-dark -500"
                  rows={2}
                  value={editData.note}
                  onChange={(e) => setEditData({ ...editData, note: e.target.value })}
                />
              </div>

              {renderEditPaymentFields()}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  onClick={updatePaymentHistory}
                  className="px-5 py-2 rounded-lg bg-dark -500 text-white hover:bg-dark -600 font-semibold"
                >
                  حفظ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;