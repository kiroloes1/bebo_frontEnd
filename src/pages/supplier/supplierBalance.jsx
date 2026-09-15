import React, { useEffect, useState } from "react";
import { showAlert } from "../../services/alert";
import { showAlertConfirm } from "../../services/alertConfirm";
import api from "../../services/api";
import { 
  Search, User, CreditCard, Send, History, ArrowUpRight, 
  ArrowDownLeft, Wallet, Landmark, Banknote, Smartphone, 
  WorkflowIcon, Mail, Calendar, Clock, FileText, 
  Building, Hash, Receipt, CheckCircle, XCircle, AlertCircle,
  Link, Plus, Trash2
} from "lucide-react";
import axios from "axios";
import BankAutocomplete from "../../services/allBank";

const SupplierBalanceAutocomplete = () => {
  const [search, setSearch] = useState("");
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [supplier, setSupplier] = useState(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const [payment, setPayment] = useState(null);

  
    
  const[remainingIncoming,setremainingIncoming]=useState(0);
  const[remainingOutgoing,setremainingOutgoing]=useState(0);

  
  const [balance,setBalance]=useState(0);

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [transactionType, setTransactionType] = useState("debt");
  const [loading, setLoading] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [suggestionWallets, setSuggestionWallets] = useState([]);
  const [walletSearch, setWalletSearch] = useState("");
  const [showWalletList, setShowWalletList] = useState(false);
  
  // هيكل الدفع المتكامل نفس الـ DeliveryForm
  const [paymentData, setPaymentData] = useState({
    paidAmount: 0,
    paymentMethod: "cash",
    bankInfo: { bankName: "" },
    walletInfo: { 
      provider: "", 
      senderName: "", 
      senderPhone: "", 
      receiverName: "", 
      receiverPhone: "", 
      linkWallet: false,
      walletId: ""
    },
    cheque: { 
      chequeNumber: "", 
      chequeType: "normal", 
      bankName: "", 
      receiveDate: "", 
      dueDate: "",
      status: "under_collection",
      location:"with_me"
    }
  });

  const [date, setDate] = useState(
    new Date().toLocaleString("sv-SE", {
      timeZone: "Africa/Cairo",
    }).slice(0, 16)
  );

  useEffect(() => {
  if (!supplier) return;

  setPaymentData(prev => {
    const walletInfo = { ...prev.walletInfo };

    if (transactionType !== "payment") {
      // المورد هو الراسل
      walletInfo.senderName = supplier.name || "";
      walletInfo.senderPhone = supplier.phone || "";

      // امسح بيانات المستلم اليدوية
      if (!walletInfo.linkWallet) {
        walletInfo.receiverName = "";
        walletInfo.receiverPhone = "";
      }
    } else {
      // debt
      // المورد هو المستلم
      walletInfo.receiverName = supplier.name || "";
      walletInfo.receiverPhone = supplier.phone || "";

      // امسح بيانات الراسل اليدوية
      if (!walletInfo.linkWallet) {
        walletInfo.senderName = "";
        walletInfo.senderPhone = "";
      }
    }

    return {
      ...prev,
      walletInfo
    };
  });
}, [supplier, transactionType]);

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

  const fetchSuppliers = async () => {
    try {
      const res = await api.get("/suppliers/getAllSupplierName");
      setAllSuppliers(res.data.data);
    } catch (err) {
      showAlert({ title: "فشل في تحميل التجار", icon: "error" });
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // تحديث paymentData عند تغيير طريقة الدفع
  useEffect(() => {
    setPaymentData(prev => ({
      ...prev,
      paymentMethod: paymentMethod
    }));
  }, [paymentMethod]);

  const handleInputChange = (value) => {
    setSearch(value);
    if (value.trim() === "") {
      setSuggestions([]);
    } else {
      const filtered = allSuppliers.filter((s) =>
        s.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
    }
  };

  const handleSelectSupplier = async (s) => {
    try {
      setSubLoading(true);
      setSelectedSupplierId(s._id);
      setSearch(s.name);
      setSuggestions([]);
      const res = await api.get(`/suppliers/${s._id}`);
      setSupplier(res.data.data);
      setPayment(res.data.payment)
    } catch (err) {
      showAlert({
        title: "فشل تحميل بيانات المورد",
        icon: "error"
      });
    } finally {
      setSubLoading(false);
    }
  };

  // التعامل مع تغييرات حقول الدفع
  const handlePaymentChange = (field, value, subField = null) => {
    if (subField) {
      setPaymentData(prev => ({
        ...prev,
        [field]: {
          ...prev[field],
          [subField]: value
        }
      }));
    } else {
      setPaymentData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const validatePaymentData = () => {
    const method = paymentData.paymentMethod;
    
    if (method === "instapay") {
      if (!paymentData.bankInfo?.bankName) {
        showAlert({ 
          title: "برجاء ملء بيانات إنستا باي كاملة", 
          icon: "error" 
        });
        return false;
      }
    }
    
    if (method === "wallet") {
      if (!paymentData.walletInfo?.senderPhone || !paymentData.walletInfo?.receiverPhone) {
        showAlert({ 
          title: "برجاء ملء بيانات المحفظة الأساسية", 
          icon: "error" 
        });
        return false;
      }
    }
    
    return true;
  };

  const handleTransaction = async () => {
    if (!amount || Number(amount) <= 0) {
      return showAlert({ title: "أدخل مبلغاً صحيحاً", icon: "error" });
    }
    if (!supplier) {
      return showAlert({ title: "يرجى اختيار مورد أولاً", icon: "error" });
    }
    if (!paymentMethod) {
      return showAlert({ title: "يرجى اختيار طريقة الدفع", icon: "error" });
    }
    
    if (!validatePaymentData()) return;

    const confirmed = await showAlertConfirm({
      title: transactionType === "debt" ? "  اضافه  مديونيه (+)" : " دفع للمورد (-)",
      text: `المبلغ: ${amount} ج.م للمورد: ${supplier.name}`,
      icon: "question"
    });

    if (!confirmed.isConfirmed) return;

    try {
      setLoading(true);
      
      const payload = {
        amount: Number(amount),
        note: note || "",
        paymentMethod: paymentData.paymentMethod,
        date: new Date(date),
        ...(paymentData.paymentMethod === "instapay" ? {
          bankInfo: paymentData.bankInfo
        } : {}),
        ...(paymentData.paymentMethod === "wallet" ? {
          walletInfo: paymentData.walletInfo
        } : {})
      };

      const endpoint = transactionType === "debt" ? "addDebt" : "paySupplier";
      
      await api.patch(`/suppliers/${endpoint}/${supplier._id}`, payload);
      
      showAlert({ title: "تمت العملية بنجاح", icon: "success" });

      const updatedSupplier = await api.get(`/suppliers/${supplier._id}`);
      setSupplier(updatedSupplier.data.data);
      fetchSuppliers();
       setPayment(updatedSupplier.data.payment || []);


      setAmount("");
      setNote("");
      setDate(    new Date().toLocaleString("sv-SE", {
      timeZone: "Africa/Cairo",
    }).slice(0, 16));
      setPaymentData({
        paidAmount: 0,
        paymentMethod: "cash",
        bankInfo: { bankName: "" },
        walletInfo: { 
          provider: "", 
          senderName: "", 
          senderPhone: "", 
          receiverName: "", 
          receiverPhone: "", 
          linkWallet: false,
          walletId: ""
        },
        cheque: { 
          chequeNumber: "", 
          chequeType: "normal", 
          bankName: "", 
          receiveDate: "", 
          dueDate: "",
          status: "under_collection",
          location:"with_me"
        }
      });
    } catch (err) {
      showAlert({ 
        title: err.response?.data.error || err.message || "حدث خطأ", 
        icon: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  // عرض الحقول الإضافية حسب طريقة الدفع
  const renderPaymentFields = () => {
    const method = paymentData.paymentMethod;

    // حقل إنستا باي
    if (method === "instapay") {
      return (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 mt-3">
          <div className="grid grid-cols-1 gap-3">
            <div className="text-right">
              <label className="text-[11px] font-black text-slate-500 block mb-1">
                <Building size={12} className="inline ml-1" /> اسم البنك / المنصة
              </label>
              <BankAutocomplete
                value={paymentData.bankInfo?.bankName || ""}
                placeholder="اكتب اسم البنك..."
                onChange={(value) =>
                  handlePaymentChange(
                    "bankInfo",
                    value,
                    "bankName"
                  )
                }
              />
            </div>
          </div>
        </div>
      );
    }

    // حقل المحفظة الإلكترونية
    if (method === "wallet") {
      const isDebt = transactionType === "debt";
      
      return (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 mt-3">

          {isDebt ? (
            // ======== حالة المديونية ========
            //  هو الراسل (بيحول فلوس للشركة)
            // البحث عن محفظة الراسل
            <>
              {/* بيانات المستلم - تظهر دائمًا في المديونية */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-right">
                  <label className="text-[11px] font-black text-slate-500 block mb-1">رقم مستلم المبلغ</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-brown -500 outline-none"
                    placeholder="رقم هاتف  المستلم"
                    value={paymentData.walletInfo?.receiverPhone || ""}
                    onChange={(e) => handlePaymentChange("walletInfo", e.target.value, "receiverPhone")}
                  />
                </div>
                <div className="text-right">
                  <label className="text-[11px] font-black text-slate-500 block mb-1">اسم مستلم المبلغ</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-brown -500 outline-none"
                    placeholder="اسم  المستلم"
                    value={paymentData.walletInfo?.receiverName || ""}
                    onChange={(e) => handlePaymentChange("walletInfo", e.target.value, "receiverName")}
                  />
                </div>

{ !paymentData.walletInfo?.linkWallet &&

<>

                               <div className="text-right">
                  <label className="text-[11px] font-black text-slate-500 block mb-1">رقم راسل المبلغ</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-brown -500 outline-none"
                    placeholder="رقم هاتف  الراسل"
                    value={paymentData.walletInfo?.senderPhone || ""}
                    onChange={(e) => handlePaymentChange("walletInfo", e.target.value, "senderPhone")}
                  />
                </div>
                <div className="text-right">
                  <label className="text-[11px] font-black text-slate-500 block mb-1">اسم راسل المبلغ</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-brown -500 outline-none"
                    placeholder="اسم  الراسل"
                    value={paymentData.walletInfo?.senderName || ""}
                    onChange={(e) => handlePaymentChange("walletInfo", e.target.value, "senderName")}
                  />
                </div>
</>

                }
              </div>

              {/* البحث عن محفظة الراسل - يظهر عند تفعيل الربط */}
              {paymentData.walletInfo?.linkWallet && (
                <div className="relative text-right">
                  <label className="text-[11px] font-black text-slate-500 block mb-1">محفظة  (الراسل)</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-brown -500 outline-none"
                    placeholder="ابحث عن محفظة ..."
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
                              // في المديونية: المحفظة دي بتاعت الراسل
                              handlePaymentChange("walletInfo", wallet._id, "walletId");
                              handlePaymentChange("walletInfo", wallet.walletName, "senderName");
                              handlePaymentChange("walletInfo", wallet.phoneNumber, "senderPhone");
                              handlePaymentChange("walletInfo", wallet.walletProvider, "provider");
                              handlePaymentChange("walletInfo", wallet.balance, "balance");
                              handlePaymentChange("walletInfo", wallet.remainingIncoming, "remainingIncoming");
                              handlePaymentChange("walletInfo", wallet.remainingOutgoing, "remainingOutgoing");


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

              {/* عرض بيانات محفظة الراسل المختارة */}
              {paymentData.walletInfo?.walletId && paymentData.walletInfo?.linkWallet && (
                <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-right">
                    <label className="text-[10px] font-black text-slate-400 block">اسم الراسل</label>
                    <input
                      readOnly
                      value={paymentData.walletInfo.senderName || ""}
                      className="w-full p-2 bg-slate-50 rounded-lg text-sm font-bold border border-slate-100"
                    />
                  </div>
                  <div className="text-right">
                    <label className="text-[10px] font-black text-slate-400 block">رقم الراسل</label>
                    <input
                      readOnly
                      value={paymentData.walletInfo.senderPhone || ""}
                      className="w-full p-2 bg-slate-50 rounded-lg text-sm font-bold border border-slate-100"
                    />
                  </div>
                  <div className="text-right">
                    <label className="text-[10px] font-black text-slate-400 block">شركة المحفظة</label>
                    <input
                      readOnly
                      value={paymentData.walletInfo.provider || ""}
                      className="w-full p-2 bg-slate-50 rounded-lg text-sm font-bold border border-slate-100"
                    />
                  </div>

                  
                </div>
              )}
            </>
          ) : (
            // ======== حالة السداد ========
            //  هو المستلم (بيستلم فلوس من )
            // البحث عن محفظة المستلم
            <>
              {/* بيانات الراسل - تظهر دائمًا في السداد */}
             <div className="grid grid-cols-2 gap-3">
{   !paymentData.walletInfo?.linkWallet &&
             <>
                          <div className="text-right">
                  <label className="text-[11px] font-black text-slate-500 block mb-1">رقم مستلم المبلغ</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-brown -500 outline-none"
                    placeholder="رقم هاتف  المستلم"
                    value={paymentData.walletInfo?.receiverPhone || ""}
                    onChange={(e) => handlePaymentChange("walletInfo", e.target.value, "receiverPhone")}
                  />
                </div>
                <div className="text-right">
                  <label className="text-[11px] font-black text-slate-500 block mb-1">اسم مستلم المبلغ</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-brown -500 outline-none"
                    placeholder="اسم  المستلم"
                    value={paymentData.walletInfo?.receiverName || ""}
                    onChange={(e) => handlePaymentChange("walletInfo", e.target.value, "receiverName")}
                  />
                
                </div>
             </>

                  }

                                <div className="text-right">
                  <label className="text-[11px] font-black text-slate-500 block mb-1">رقم راسل المبلغ</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-brown -500 outline-none"
                    placeholder="رقم هاتف  الراسل"
                    value={paymentData.walletInfo?.senderPhone || ""}
                    onChange={(e) => handlePaymentChange("walletInfo", e.target.value, "senderPhone")}
                  />
                </div>
                <div className="text-right">
                  <label className="text-[11px] font-black text-slate-500 block mb-1">اسم راسل المبلغ</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-brown -500 outline-none"
                    placeholder="اسم  الراسل"
                    value={paymentData.walletInfo?.senderName || ""}
                    onChange={(e) => handlePaymentChange("walletInfo", e.target.value, "senderName")}
                  />
                </div>
              </div>

              {/* البحث عن محفظة المستلم - يظهر عند تفعيل الربط */}
              {paymentData.walletInfo?.linkWallet && (
                <div className="relative text-right">
                  <label className="text-[11px] font-black text-slate-500 block mb-1">محفظة المستلم</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-brown -500 outline-none"
                    placeholder="ابحث عن محفظة ..."
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
                              // في السداد: المحفظة دي بتاعت المستلم
                              handlePaymentChange("walletInfo", wallet._id, "walletId");
                              handlePaymentChange("walletInfo", wallet.walletName, "receiverName");
                              handlePaymentChange("walletInfo", wallet.phoneNumber, "receiverPhone");
                              handlePaymentChange("walletInfo", wallet.walletProvider, "provider");
                              handlePaymentChange("walletInfo", wallet.balance, "balance");
                              handlePaymentChange("walletInfo", wallet.remainingIncoming, "remainingIncoming");
                              handlePaymentChange("walletInfo", wallet.remainingOutgoing, "remainingOutgoing");


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

              {/* عرض بيانات محفظة المستلم المختارة */}
              {paymentData.walletInfo?.walletId && paymentData.walletInfo?.linkWallet && (
                <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-right">
                    <label className="text-[10px] font-black text-slate-400 block">اسم المستلم</label>
                    <input
                      readOnly
                      value={paymentData.walletInfo.receiverName || ""}
                      className="w-full p-2 bg-slate-50 rounded-lg text-sm font-bold border border-slate-100"
                    />
                  </div>
                  <div className="text-right">
                    <label className="text-[10px] font-black text-slate-400 block">رقم المستلم</label>
                    <input
                      readOnly
                      value={paymentData.walletInfo.receiverPhone || ""}
                      className="w-full p-2 bg-slate-50 rounded-lg text-sm font-bold border border-slate-100"
                    />
                  </div>
                  <div className="text-right">
                    <label className="text-[10px] font-black text-slate-400 block">شركة المحفظة</label>
                    <input
                      readOnly
                      value={paymentData.walletInfo.provider || ""}
                      className="w-full p-2 bg-slate-50 rounded-lg text-sm font-bold border border-slate-100"
                    />
                  </div>

                     <div className="text-right">
                    <label className="text-[10px] font-black text-slate-400 block">  رصيد المحفظه</label>
                    <input
                      readOnly
                      value={paymentData.walletInfo.balance || ""}
                      className="w-full p-2 bg-slate-50 rounded-lg text-sm font-bold border border-slate-100"
                    />
                  </div>

                  <div className="text-right">
                    <label className="text-[10px] font-black text-slate-400 block"> المتبقي للاستلام</label>
                    <input
                      readOnly
                      value={paymentData.walletInfo.remainingIncoming || ""}
                      className="w-full p-2 bg-slate-50 rounded-lg text-sm font-bold border border-slate-100"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="max-w-[100vw] min-h-[85vh]  p-4 lg:p-8" dir="rtl">
      <div className="mx-auto flex flex-col gap-8">
        
        {/* البحث عن  */}
        <div className="relative group">
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="ابحث عن اسم  لبدء العملية..."
            value={search}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full pr-12 pl-4 py-5 bg-white border border-slate-200 rounded-[10px] shadow-sm outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-brown -500 transition-all text-lg font-bold text-dark"
          />
          
          {suggestions.length > 0 && (
            <div className="absolute z-20 w-full mt-2 bg-white border border-slate-100 rounded-2xl max-h-60 overflow-y-auto shadow-xl">
              {suggestions.map((s) => (
                <div
                  key={s._id}
                  onClick={() => handleSelectSupplier(s)}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-dark text-light rounded-xl flex items-center justify-center font-bold">
                      {s.name?.[0] || "?"}
                    </div>
                    <span className="font-bold text-dark">{s.name}</span>
                  </div>
                  <span className="text-xs font-black text-orange-600 border-light -50 px-3 py-1 rounded-lg">
                    رصيد: {s.balance?.toLocaleString()} ج.م
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* كارت  */}
          <div className="lg:col-span-4">
            {supplier && !subLoading ? (
              <div className="bg-dark rounded-[10px] p-8 text-light shadow-xl relative overflow-auto h-full">
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16  text-ligth h-16 border-light -500 rounded-2xl flex items-center justify-center">
                      <User size={32} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-ligth">{supplier.name}</h2>
                      <p className="text-brown -400 text-lg font-bold">حساب مورد</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                      <p className="text-xs font-bold text-slate-400 mb-2">إجمالي الرصيد الحالية</p>
                      <div className="flex items-end gap-2">
                        <span className="text-4xl font-black text-ligth -500">{supplier.balance?.toLocaleString()}</span>
                        <span className="text-lg opacity-60 mb-1">ج.م</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                        <p className="text-md text-slate-400 font-bold mb-1">الهاتف</p>
                        <p className="text-lg font-black text-ligth">{supplier.phone || "---"}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                        <p className="text-md text-slate-400 font-bold mb-1">العمليات</p>
                        <p className="text-lg font-black text-ligth">{payment?.length || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : !subLoading ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-[10px] p-8 h-full flex flex-col items-center justify-center text-slate-400 min-h-[300px]">
                <Wallet size={64} className="mb-4 opacity-10" />
                <p className="font-bold text-center">اختر مورداً لعرض التفاصيل</p>
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-[10px] p-8 h-full flex flex-col items-center justify-center text-slate-400 min-h-[300px]">
                <Wallet size={64} className="mb-4 opacity-10 animate-pulse" />
                <p className="font-bold text-center">جاري تحميل بيانات ...</p>
              </div>
            )}
          </div>

          {/* نموذج العملية */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-white rounded-[10px] p-8 shadow-sm border border-slate-100">
              <h3 className="text-lg font-black text-dark mb-6 flex items-center gap-2">
                <CreditCard className="text-orange-500" /> تنفيذ معاملة مالية
              </h3>

              <div className="space-y-6">
                {/* نوع العملية */}
                <div className="flex bg-slate-50 p-1 rounded-2xl">
                  <button
                    onClick={() => {setTransactionType("debt")
                        setPaymentMethod("cash")}
                    }
                    className={`flex-1 py-3 rounded-xl font-black text-lg transition-all ${
                      transactionType === "debt" 
                        ? "bg-dark text-white shadow-lg" 
                        : "text-slate-400 hover:text-dark"
                    }`}
                  >
                  اضافه مديونيه (+)
                  </button>
                  <button
                    onClick={() => {setTransactionType("payment")
                    
                    }}
                    className={`flex-1 py-3 rounded-xl font-black text-lg transition-all ${
                      transactionType === "payment" 
                        ? "bg-green-600 text-white shadow-lg" 
                        : "text-slate-400 hover:text-dark"
                    }`}
                  >
                     دفع للمورد(-)
                  </button>
                </div>

                {/* طريقة الدفع */}
                <div>
                  <label className="text-md font-black text-slate-400 uppercase pr-2 mb-3 block">طريقة الدفع</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { id: 'cash', label: 'نقدي', icon: <Banknote size={18}/> },
                      { id: 'instapay', label: 'إنستا باي', icon: <Smartphone size={18}/> },
                      { id: 'wallet', label: 'محفظة', icon: <Wallet size={18}/> },
                      { id: 'work', label: 'شغل', icon: <WorkflowIcon size={18}/> },
                    ].map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                          paymentMethod === method.id 
                            ? 'border-brown -500 border-light -50 text-accent -600' 
                            : 'border-slate-100 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {method.icon}
                        <span className="text-xs font-bold">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-md font-black text-slate-400 uppercase pr-2 mb-2 block">المبلغ</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:border-brown -500 outline-none font-black text-lg"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="text-md font-black text-slate-400 uppercase pr-2 mb-2 block">ملاحظات</label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:border-brown -500 outline-none font-bold"
                      placeholder="بيان العملية..."
                    />
                  </div>
                  <div>
                    <label className="text-md font-black text-slate-400 uppercase pr-2 mb-2 block">التاريخ والوقت</label>
                    <input
                      type="datetime-local"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:border-brown -500 outline-none font-bold"
                    />
                  </div>
                </div>

                {/* الحقول الإضافية حسب طريقة الدفع */}
                {renderPaymentFields()}

                <button
                  disabled={loading}
                  onClick={handleTransaction}
                  className={`w-full py-5 rounded-[10px] font-black text-white transition-all flex items-center justify-center gap-3 shadow-lg ${
                    transactionType === 'debt' 
                      ? 'bg-dark hover:bg-slate-800' 
                      : 'bg-green-600 hover:bg-green-700'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    "جاري المعالجة..."
                  ) : (
                    <>
                      <Send size={20} />
                      <span>تأكيد وتسجيل العملية</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* سجل العمليات */}
            {payment && (
              <div className="bg-white rounded-[10px] p-6 shadow-sm border border-slate-100">
                <h4 className="font-black text-slate-400 text-[11px] uppercase mb-4 flex items-center gap-2">
                  <History size={14} /> سجل العمليات الأخير
                </h4>
                <div className="space-y-3 max-h-60 overflow-auto pr-2">
                  {payment?.slice().reverse().map((t, idx) => {
                    const methodLabels = {
                      cash: 'نقدي',
                      wallet: 'محفظة',
                      instapay: 'إنستا باي',
                      work: 'شغل'
                    };
                    return (
                      <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            t.module === "debt" 
                              ? "bg-red-50 text-red-500" 
                              : "bg-green-50 text-green-600"
                          }`}>
                            {t.module === "debt" ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                          </div>
                          <div>
                            <p className="text-lg font-black text-dark">{t.amount?.toLocaleString()} ج.م</p>
                            <p className="text-md text-slate-400 font-bold">
                              {methodLabels[t.paymentMethod] || t.paymentMethod} 
                              {t.notes? ` - ${t.notes}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-md font-bold text-slate-400">
                            {new Date(t.transactionDate).toLocaleString('ar-EG', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className={`text-md font-black ${
                            t.module === 'debt' ? 'text-red-400' : 'text-green-500'
                          }`}>
                            {t.module === "debt" ? " اضافه مديوينه (+)" : " دفع للتاحر(-)"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierBalanceAutocomplete;