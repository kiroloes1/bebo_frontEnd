import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, Trash2, Save, FileText, Search, CreditCard, 
  ShoppingBag, Eye, EyeOff, QrCode, User, Calculator, ArrowRight
} from "lucide-react";
import api from "../../services/api"; 
import { showAlert } from "../../services/alert";
import { useNavigate, useParams } from "react-router-dom";
import BankAutocomplete from "../../services/allBank";

import { io } from "socket.io-client";
import { QRCodeSVG } from "qrcode.react";

const UpdateInvoice = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const scanInputRef = useRef(null);


  const toDatetimeLocal = (isoString) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

  const lastScanRef = useRef({
  code: null,
  time: 0,
});

  const [scannerSession, setScannerSession] = useState(null);
  const [mobileConnected, setMobileConnected] = useState(false);

  const socketRef = useRef(null);

  // States
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingInvoice, setLoadingInvoice] = useState(true);
  
  // Customer Auto-complete
  const [custSearch, setCustSearch] = useState("");
  const [showCustList, setShowCustList] = useState(false);
  const [selectedCustomerObj, setSelectedCustomerObj] = useState(null);

  // Product Auto-complete / Scanning
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showProductList, setShowProductList] = useState(false);
  const [showPurchasePrice, setShowPurchasePrice] = useState(false);

  // Max Discount Constraint
  const MAX_DISCOUNT_PERCENT = 20;

  // Form Data State
  const [formData, setFormData] = useState({
    CustomerId: "",
    invoiceDate: new Date().toISOString(),
    discount: 0,
    adminNote: "",
    items: [],
    payment: []
  });



  // ===================================================================
  // Helper: يضيف/يحدّث عنصر داخل قائمة الأصناف بشكل آمن (immutable)
  // بياخد الـ prevItems نفسها بدل الاعتماد على formData من الـ closure
  // ===================================================================
  const buildItemsWithProduct = (prevItems, product) => {
    const isPackageAllowed = product.unit_type === "كرتونة";
    const allowedUnits = isPackageAllowed ? ["كرتونة", "قطعة"] : ["قطعة"];

    const existingItems = prevItems.filter((i) => i.product === product._id);

    let targetUnit = isPackageAllowed ? "كرتونة" : "قطعة";

    if (isPackageAllowed && existingItems.length > 0) {
      const hasPackage = existingItems.some((i) => i.unit_type === "كرتونة");
      const hasPiece = existingItems.some((i) => i.unit_type === "قطعة");

      if (hasPackage && !hasPiece) {
        targetUnit = "قطعة";
      } else if (hasPiece && !hasPackage) {
        targetUnit = "كرتونة";
      }
    }

    const defaultPrice = targetUnit === "كرتونة"
      ? product.packageSellingPrice
      : product.pieceSellingPrice;

    const existingIndex = prevItems.findIndex(
      (i) => i.product === product._id && i.unit_type === targetUnit
    );

    if (existingIndex > -1) {
      return prevItems.map((it, idx) =>
        idx === existingIndex
          ? { ...it, quantity: it.quantity + 1 }
          : it
      );
    }

    const newItem = {
      product: product._id,
      productName: product.productName,
      code: product.code,
      unit_type: targetUnit,
      allowedUnitTypes: allowedUnits,
      quantity: 1,
      price: defaultPrice,
      purchasePrice: product.purchasePrice || 0,
      packageSellingPrice: product.packageSellingPrice,
      pieceSellingPrice: product.pieceSellingPrice,
      availableQuantity: product.availableQuantity,
      unitsPerPackage: product.unitsPerPackage || 1,
    };

    return [...prevItems, newItem];
  };



  // ==========================================
  // 4. إضافة منتج للفاتورة (functional update عشان منمسحش تعديلات حصلت بالتوازي)
  // ==========================================
  const handleSelectProduct = (product) => {
    setFormData((prev) => ({
      ...prev,
      items: buildItemsWithProduct(prev.items, product),
    }));

    setProductSearch("");
    setShowProductList(false);
  };

  const handleBarcode = async (code) => {
    const barcode = String(code || "").trim();

    if (!barcode) return;

    try {
      console.log("🔎 Processing barcode:", barcode);

      // اقفل قائمة البحث
      setShowProductList(false);
      setSearchResults([]);

      const res = await api.get(
        `/product/search2?search=${encodeURIComponent(barcode)}`
      );

      const found = res.data.data || [];

      if (found.length === 0) {
        showAlert({
          title: `لم يتم العثور على منتج بالكود: ${barcode}`,
          icon: "warning",
        });

        setProductSearch("");
        return;
      }

      // الأولوية للكود المطابق بالضبط
      const exactProduct = found.find(
        (product) =>
          String(product.code || "").toLowerCase() ===
          barcode.toLowerCase()
      );

      const product = exactProduct || found[0];

      // إضافة المنتج
      handleSelectProduct(product);

    } catch (error) {
      console.error("❌ Barcode processing error:", error);

      showAlert({
        title: "حدث خطأ أثناء البحث عن المنتج",
        icon: "error",
      });

      setProductSearch("");
      setSearchResults([]);
      setShowProductList(false);
    }
  };

  useEffect(() => {

    console.log("🚀 INVOICE SOCKET EFFECT STARTED");

    const socket = io(import.meta.env.VITE_API_BASE_URL);

    socketRef.current = socket;

    const sessionId = crypto.randomUUID();

    console.log("🆔 SESSION ID:", sessionId);

    setScannerSession(sessionId);

    socket.on("connect", () => {

      console.log(
        "🟢 SOCKET CONNECTED:",
        socket.id
      );

      socket.emit(
        "create-scanner-session",
        sessionId
      );

  
        socket.on("disconnect", () => {
     setMobileConnected(false)
    });
    });


    socket.on("join", ({ isOk }) => {

      setMobileConnected(isOk)
    });

socket.on("barcode-received", ({ code }) => {

  const barcode = String(code || "").trim();

  if (!barcode) return;

  const now = Date.now();
  const SCAN_DELAY = 1200; 

  
  if (
    lastScanRef.current.code === barcode &&
    now - lastScanRef.current.time < SCAN_DELAY
  ) {
    console.log("⏳ Ignored duplicate barcode:", barcode);
    return;
  }

  lastScanRef.current = {
    code: barcode,
    time: now,
  };

  console.log("🔥 BARCODE ACCEPTED:", barcode);

  setProductSearch(barcode);
  handleBarcode(barcode);
});

    socket.on("disconnect", (reason) => {

      console.log(
        "🔴 INVOICE SOCKET DISCONNECTED:",
        reason
      );

      setMobileConnected(false)

    });

    return () => {

      console.log(
        "🧹 INVOICE SOCKET CLEANUP"
      );

      socket.disconnect();
    };

  }, []);


  
  // ==========================================
  // 1. جلب الفاتورة الحالية
  // ==========================================
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoadingInvoice(true);
        const res = await api.get(`/invoice/${id}`);
        const data = res.data.data;
        
        if (data && data.invoice) {
          const invoice = data.invoice;
          
          // تعبئة بيانات الفاتورة
          setFormData({
            CustomerId: invoice.customer?._id || "",
           invoiceDate: invoice.invoiceDate
  ? toDatetimeLocal(invoice.invoiceDate)
  : toDatetimeLocal(new Date().toISOString()),
            discount: invoice.discount || 0,
            adminNote: invoice.adminNote || "",
            invoiceNumber: invoice.invoiceNumber || "",


            
            oldCustomerBalance: invoice.oldCustomerBalance || 0,
            items: invoice.items.map(item => ({
              product: item.product?._id || item.product,
              productName: item.productName || item.product?.productName || "منتج غير معروف",
              code: item.product?.code || "",
              unit_type: item.unit_type || "قطعة",
              allowedUnitTypes: item.product?.unit_type === "كرتونة" ? ["كرتونة", "قطعة"] : ["قطعة"],
              quantity: item.quantity || 1,
              price: item.price || 0,
              
              purchasePrice: item.product?.purchasePrice || 0,
              packageSellingPrice: item.product?.packageSellingPrice || 0,
              pieceSellingPrice: item.product?.pieceSellingPrice || 0,
              availableQuantity: item.product?.availableQuantity || 0,
              unitsPerPackage: item.product?.unitsPerPackage || 1,
              subtotal: item.subtotal || (item.quantity * item.price)
            })),
            payment: data.payments?.map(p => ({
              amount: p.amount || 0,
              paymentMethod: p.paymentMethod || "cash",
              walletInfo: p.walletInfo || { senderName: "", senderPhone: "", receiverName: "", receiverPhone: "" },
              bankInfo: p.bankInfo || { bankName: "" }
            })) || []
          });

          // تعيين العميل
          if (invoice.customer) {
            setSelectedCustomerObj(invoice.customer);
            setCustSearch(invoice.customer.name || "");
          }
        }
      } catch (err) {
        showAlert({ 
          title: err.response?.data?.message || "خطأ في جلب بيانات الفاتورة", 
          icon: "error" 
        });
        navigate("/invoices");
      } finally {
        setLoadingInvoice(false);
      }
    };

    fetchInvoice();
  }, [id, navigate]);

  // ==========================================
  // 2. جلب العملاء
  // ==========================================


  // ==========================================
  // 3. البحث عن المنتجات
  // ==========================================
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (productSearch.trim().length > 0) {
        try {
          const res = await api.get(`/product/search2?search=${encodeURIComponent(productSearch.trim())}`);
          setSearchResults(res.data.data || []);
          setShowProductList(true);
        } catch (err) {
          console.error("Error searching products:", err);
        }
      } else {
        setSearchResults([]);
        setShowProductList(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [productSearch]);

  // ==========================================
  // 5. المسح الضوئي
  // ==========================================
  const handleScanKeyDown = async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!productSearch.trim()) return;

      try {
        const res = await api.get(`/product/search2?search=${encodeURIComponent(productSearch.trim())}`);
        const found = res.data.data || [];
        if (found.length > 0) {
          const exact = found.find(p => p.code.toLowerCase() === productSearch.trim().toLowerCase()) || found[0];
          handleSelectProduct(exact);
        } else {
          showAlert({ title: "لم يتم العثور على منتج بهذا الكود", icon: "warning" });
        }
      } catch (err) {
        showAlert({ title: "خطأ أثناء جلب المنتج", icon: "error" });
      }
    }
  };



  // ==========================================
  // 6. تعديل بيانات المنتج في الجدول (immutable + functional update)
  // ==========================================
  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedItems = prev.items.map((it, idx) => {
        if (idx !== index) return it;

        if (field === "unit_type") {
          return {
            ...it,
            unit_type: value,
            price: value === "كرتونة" ? it.packageSellingPrice : it.pieceSellingPrice,
          };
        }

        if (field === "quantity" || field === "price") {
          return { ...it, [field]: Math.max(0, Number(value)) };
        }

        return it;
      });

      return { ...prev, items: updatedItems };
    });
  };

  const handleRemoveItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // ==========================================
  // 7. طرق الدفع (كلها functional update)
  // ==========================================
  const addPaymentField = () => {
    setFormData((prev) => {
      const methods = ["cash", "wallet", "instapay", "work"];
      const unusedMethod = methods.find(m => !prev.payment.some(p => p.paymentMethod === m)) || "cash";

      return {
        ...prev,
        payment: [
          ...prev.payment,
          {
            amount: 0,
            paymentMethod: unusedMethod,
            walletInfo: { senderName: selectedCustomerObj?.name || "", senderPhone: "", receiverName: "", receiverPhone: "" },
            bankInfo: { bankName: "" }
          }
        ]
      };
    });
  };

  const removePaymentField = (index) => {
    setFormData((prev) => {
      if (prev.payment.length <= 1) return prev;
      return {
        ...prev,
        payment: prev.payment.filter((_, i) => i !== index),
      };
    });
  };

  const handlePaymentChange = (index, field, value, subField = null) => {
    setFormData((prev) => {
      const updatedPayments = prev.payment.map((p, idx) => {
        if (idx !== index) return p;

        if (subField) {
          return {
            ...p,
            [field]: {
              ...p[field],
              [subField]: value,
            },
          };
        }

        return {
          ...p,
          [field]: field === "amount" ? Number(value) : value,
        };
      });

      return { ...prev, payment: updatedPayments };
    });
  };



  // ==========================================
  // 8. الحسابات
  // ==========================================
  const totalPrice = formData.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  const totalCost = formData.items.reduce((acc, item) => acc + (item.quantity * item.purchasePrice), 0);
  
  const safeDiscountPercent = Math.min(Number(formData.discount) || 0, MAX_DISCOUNT_PERCENT);
  const discountAmount = (totalPrice * safeDiscountPercent) / 100;
  const finalPrice = totalPrice - discountAmount;

  const totalPaid = formData.payment.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const netDue = finalPrice - totalPaid;
  
  const oldBalance = formData?.oldCustomerBalance || 0;
  const newBalance = oldBalance + netDue;

  // ==========================================
  // 9. إرسال التحديث
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.CustomerId) {
      return showAlert({ title: "برجاء اختيار العميل أولاً", icon: "warning" });
    }
    if (formData.items.length === 0) {
      return showAlert({ title: "يجب إضافة منتج واحد على الأقل", icon: "warning" });
    }

    for (const p of formData.payment) {
      if (p.paymentMethod === "wallet" && !p.walletInfo?.senderPhone) {
        return showAlert({ title: "يجب إرفاق رقم المحفظة المحول منها في حالة السداد بالمحفظة", icon: "warning" });
      }
    }

    setLoading(true);
    try {
const invoiceDate = new Date(formData.invoiceDate);

const payload = {
  CustomerId: formData.CustomerId,
  invoiceDate: invoiceDate.toISOString(),
  discount: safeDiscountPercent,
  adminNote: formData.adminNote,
  items: formData.items.map(item => ({
    product: item.product,
    productName: item.productName,
    unit_type: item.unit_type,
    quantity: item.quantity,
    price: item.price
  })),
  payment: formData.payment
};

      await api.put(`/invoice/${id}`, payload);
      showAlert({ title: "تم تحديث الفاتورة بنجاح", icon: "success" });
      navigate("/invoices");
    } catch (err) {
      showAlert({ 
        title: err.response?.data?.message || "حدث خطأ أثناء تحديث الفاتورة", 
        icon: "error" 
      });
    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // عرض التحميل
  // ==========================================
  if (loadingInvoice) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-ligth space-y-3">
        <div className="animate-spin text-brown" size={48}>
          <svg className="w-12 h-12" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <span className="text-dark/70 font-bold">جاري تحميل بيانات الفاتورة...</span>
      </div>
    );
  }

  // ==========================================
  // 10. عرض النموذج
  // ==========================================
  return (
    <div className="w-[96vw] overview-auto md:w-full w-full mx-auto p-4 lg:p-8 bg-ligth/10" dir="rtl">
      <form onSubmit={handleSubmit} className="space-y-6 h-[100vh] overflow-auto pb-32 pr-2">
        
        {/* Header with Back Button */}
        <div className="flex items-center gap-3 mb-2">
          <button
            type="button"
            onClick={() => navigate("/invoices")}
            className="p-2 hover:bg-brown/10 rounded-xl transition-colors"
          >
            <ArrowRight size={20} className="text-brown" />
          </button>
          <h2 className="text-xl font-black text-dark flex items-center gap-2">
            <FileText size={22} className="text-brown" />
            تعديل الفاتورة
          </h2>
          <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-bold">
            رقم: {formData.invoiceNumber || "---"}
          </span>
        </div>

        {/* Header Options: Date & Customer */}
        <div className="bg-white p-6 rounded-2xl border border-brwonLight shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          
          {/* العميل */}
          <div className="space-y-2 relative text-right">
            <label className="block font-black text-dark text-sm flex items-center gap-1">
              <User size={16} className="text-brown" /> اسم العميل
            </label>
            <div className="relative">
              <Search className="absolute right-3 top-3.5 text-brown/50" size={18} />
              <input
                disabled={true}
                type="text"
                className="w-full p-3 pr-10 bg-ligth/20 border border-brown/10 rounded-xl outline-none font-bold text-dark focus:border-brown focus:ring-1 focus:ring-brown"
                placeholder="ابحث عن اسم العميل ..."
                value={custSearch}
                onFocus={() => setShowCustList(true)}
                onChange={(e) => setCustSearch(e.target.value)}
              />
            </div>

            {showCustList && custSearch.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-brwonLight rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                {customers.filter(c => c.name.includes(custSearch)).map(c => (
                  <div 
                    key={c._id} 
                    className="p-4 hover:bg-ligth/40 cursor-pointer flex justify-between items-center border-b border-ligth last:border-b-0 text-dark transition-all"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, CustomerId: c._id }));
                      setSelectedCustomerObj(c);
                      setCustSearch(c.name);
                      setShowCustList(false);
                    }}
                  >
                    <span className="font-bold">{c.name}</span>
                    <span className="text-brown bg-ligth px-3 py-1 rounded-lg text-xs font-black">
                      رصيد: {c.balance?.toLocaleString()} EGP
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* التاريخ */}
          <div className="space-y-2 text-right">
            <label className="block font-black text-dark text-sm">تاريخ الفاتورة</label>
            <input
              type="datetime-local"
              className="w-full p-3 bg-ligth/20 border border-brown/10 rounded-xl outline-none font-bold text-dark focus:border-brown focus:ring-1 focus:ring-brown"
              value={formData.invoiceDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, invoiceDate: e.target.value }))}
            />
          </div>
        </div>

        {/* Scan & Search Products Section */}
        {/* ================= SCANNER + SEARCH ================= */}
        <div className="p-5 md:p-6 space-y-5">

          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-5 items-center">

            {/* QR CONNECT */}
            {scannerSession && (
              <div className="
                flex items-center gap-4
                p-4
                rounded-2xl
                border border-brown/10
                bg-ligth/10
                min-w-0
              ">

                {/* QR */}
                <div className="
                  shrink-0
                  p-2
                  bg-white
                  rounded-xl
                  border
                  border-brown/10
                  shadow-sm
                ">
                  <QRCodeSVG
                    value={`${window.location.origin}/scanner/${scannerSession}`}
                    size={110}
                    level="M"
                  />
                </div>

                {/* QR Info */}
                <div className="text-right">

                  <div className="flex items-center gap-2 mb-1">
                    <QrCode size={18} className="text-brown" />

                    <h4 className="font-black text-dark text-sm">
                      ربط ماسح الموبايل
                    </h4>
                  </div>

                  <p className="text-xs text-dark/50 font-bold leading-5">
                    امسح الكود من الموبايل لربطه
                    بالفاتورة واستخدم كاميرا الموبايل
                    لقراءة الباركود.
                  </p>

                  <div className="mt-2 flex items-center gap-2">

                    <span
                      className={`w-2 h-2 rounded-full ${
                        mobileConnected
                          ? "bg-green-500"
                          : "bg-gray-400"
                      }`}
                    />

                    <span
                      className={`text-[11px] font-black ${
                        mobileConnected
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      {mobileConnected
                        ? "متصل وجاهز للمسح"
                        : "في انتظار الاتصال"}
                    </span>

                  </div>

                </div>

              </div>
            )}


            {/* SEARCH */}
            <div className="relative">

              <label className="
                block
                text-xs
                font-black
                text-dark
                mb-2
              ">
                البحث عن منتج
              </label>

              <div className="relative">

                <QrCode
                  className="
                    absolute
                    right-4
                    top-1/2
                    -translate-y-1/2
                    text-brown/50
                    pointer-events-none
                  "
                  size={20}
                />

                <input
                  ref={scanInputRef}
                  type="text"
                  className="
                    w-full
                    h-14
                    pr-12
                    pl-4
                    bg-ligth/10
                    border
                    border-brown/10
                    rounded-2xl
                    outline-none
                    font-bold
                    text-dark
                    placeholder:text-dark/30
                    focus:border-brown
                    focus:ring-4
                    focus:ring-brown/5
                    transition-all
                  "
                  placeholder="امسح Barcode أو QR أو اكتب اسم المنتج..."
                  value={productSearch}
                  onKeyDown={handleScanKeyDown}
                  onChange={(e) =>
                    setProductSearch(e.target.value)
                  }
                />

                {/* Search Status */}
                {productSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setProductSearch("");
                      setSearchResults([]);
                      setShowProductList(false);
                    }}
                    className="
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      w-8
                      h-8
                      rounded-lg
                      bg-dark/5
                      hover:bg-red-50
                      hover:text-red-500
                      flex
                      items-center
                      justify-center
                      transition
                    "
                  >
                    ×
                  </button>
                )}

              </div>


              {/* ================= SEARCH RESULTS ================= */}
              {showProductList && searchResults.length > 0 && productSearch.trim().length > 0 &&  !mobileConnected &&(

                <div className="
                  absolute
                  z-50
                  left-0
                  right-0
                  mt-2
                  bg-white
                  border
                  border-brown/10
                  rounded-2xl
                  shadow-2xl
                  overflow-hidden
                ">

                  <div className="
                    px-4
                    py-2.5
                    bg-ligth/20
                    border-b
                    border-brown/5
                    text-[11px]
                    font-black
                    text-dark/50
                  ">
                    نتائج البحث ({searchResults.length})
                  </div>

                  <div className="max-h-72 overflow-y-auto">

                    {searchResults.map((prod) => (

                      <button
                        type="button"
                        key={prod._id}
                        onClick={() =>
                          handleSelectProduct(prod)
                        }
                        className="
                          w-full
                          p-4
                          text-right
                          hover:bg-ligth/20
                          border-b
                          border-brown/5
                          last:border-b-0
                          transition-all
                          group
                        "
                      >

                        <div className="
                          flex
                          items-center
                          justify-between
                          gap-4
                        ">

                          {/* Product */}
                          <div className="min-w-0">

                            <div className="
                              font-black
                              text-sm
                              text-dark
                              truncate
                            ">
                              {prod.productName}
                            </div>

                            <div className="
                              text-[11px]
                              text-dark/50
                              font-bold
                              mt-1
                            ">
                              الكود: {prod.code}
                            </div>

                            <div className="
                              text-[10px]
                              text-dark/40
                              mt-1
                            ">
                              المتاح: {prod.availableQuantity}{" "}
                              {prod.unit_type}
                            </div>

                          </div>


                          {/* Price */}
                          <div className="text-left shrink-0">

                            <div className="
                              text-sm
                              font-black
                              text-brown
                            ">
                              {prod.pieceSellingPrice} EGP
                            </div>

                            <div className="
                              text-[10px]
                              text-dark/40
                              font-bold
                            ">
                              / قطعة
                            </div>

                            {prod.unit_type === "كرتونة" && (
                              <div className="
                                text-xs
                                font-black
                                text-dark/60
                                mt-1
                              ">
                                {prod.packageSellingPrice} EGP
                                {" / كرتونة"}
                              </div>
                            )}

                          </div>

                        </div>

                      </button>

                    ))}

                  </div>

                </div>

              )}


              
                           {/* ================= SEARCH RESULTS ================= */}
                {showProductList && searchResults.length==0 && productSearch.trim().length > 0 &&  !mobileConnected &&(

                  <div className="
                    absolute
                    z-50
                    left-0
                    right-0
                    mt-2
                    bg-white
                    border
                    border-brown/10
                    rounded-2xl
                    shadow-2xl
                    overflow-hidden
                  ">

                    <div className="
                      px-4
                      py-2.5
                      bg-ligth/20
                      border-b
                      border-brown/5
                      text-[11px]
                      font-black
                      text-dark/50
                    ">
                      نتائج البحث ({searchResults.length})
                    </div>

                    <div className="h-full overflow-y-auto p-4   flex justify-center">

                        <span className="h-fit h-full  ">لا يوجد منتجات متشابها</span>

                    </div>

                  </div>

                )}

            </div>

          </div>


          {/* ================= ITEMS COUNTER ================= */}
          <div className="
            flex
            items-center
            justify-between
            px-1
          ">

            <div className="flex items-center gap-2">

              <span className="
                text-xs
                font-black
                text-dark/50
              ">
                المنتجات المضافة
              </span>

              <span className="
                min-w-7
                h-7
                px-2
                rounded-lg
                bg-brown
                text-white
                flex
                items-center
                justify-center
                text-xs
                font-black
              ">
                {formData.items.length}
              </span>

            </div>

            {formData.items.length > 0 && (
              <span className="
                text-xs
                font-black
                text-brown
              ">
                إجمالي المنتجات:{" "}
                {formData.items
                  .reduce(
                    (sum, item) =>
                      sum + Number(item.quantity || 0),
                    0
                  )
                  .toLocaleString()}
              </span>
            )}

          </div>


          {/* ================= PRODUCTS TABLE ================= */}
          <div className="
            rounded-2xl
            border border-brown/10
            overflow-hidden
          ">

            <div className="overflow-x-auto">

              <table className="w-full min-w-[850px] text-right border-collapse">

                <thead>

                  <tr className="
                    bg-ligth/30
                    text-dark
                    font-black
                    text-xs
                    border-b
                    border-brown/10
                  ">

                    <th className="px-4 py-4 w-12">
                      #
                    </th>

                    <th className="px-4 py-4">
                      المنتج
                    </th>

                    <th className="px-4 py-4">
                      الوحدة
                    </th>

                    <th className="px-4 py-4 text-center">
                      الكمية
                    </th>

                    <th className="px-4 py-4 text-center">
                      سعر البيع
                    </th>

                    {showPurchasePrice && (
                      <th className="
                        px-4
                        py-4
                        text-center
                        text-red-600
                      ">
                        سعر الشراء
                      </th>
                    )}

                    <th className="px-4 py-4 text-center">
                      الإجمالي
                    </th>

                    <th className="px-4 py-4 text-center">
                      حذف
                    </th>

                  </tr>

                </thead>


                <tbody className="text-sm font-bold text-dark">

                  {formData.items.length === 0 ? (

                    <tr>

                      <td
                        colSpan={showPurchasePrice ? 8 : 7}
                        className="py-14 text-center"
                      >

                        <div className="
                          flex
                          flex-col
                          items-center
                          justify-center
                          gap-3
                          text-dark/30
                        ">

                          <div className="
                            w-16
                            h-16
                            rounded-2xl
                            bg-ligth/40
                            flex
                            items-center
                            justify-center
                          ">
                            <ShoppingBag size={28} />
                          </div>

                          <div>

                            <p className="
                              font-black
                              text-sm
                              text-dark/40
                            ">
                              لم تتم إضافة منتجات
                            </p>

                            <p className="
                              text-xs
                              mt-1
                              font-bold
                            ">
                              امسح الباركود أو ابحث عن المنتج بالأعلى
                            </p>

                          </div>

                        </div>

                      </td>

                    </tr>

                  ) : (

                    formData.items.map((item, idx) => {

                      const itemSubtotal =
                        Number(item.quantity || 0) *
                        Number(item.price || 0);

                      return (

                        <tr
                          key={idx}
                          className="
                            border-b
                            border-brown/5
                            last:border-b-0
                            hover:bg-ligth/10
                            transition-colors
                          "
                        >

                          {/* Number */}
                          <td className="px-4 py-4">

                            <span className="
                              w-7
                              h-7
                              rounded-lg
                              bg-ligth
                              flex
                              items-center
                              justify-center
                              text-xs
                              font-black
                            ">
                              {idx + 1}
                            </span>

                          </td>


                          {/* Product */}
                          <td className="px-4 py-4">

                            <div className="font-black text-sm">
                              {item.productName}
                            </div>

                            <div className="
                              text-[10px]
                              text-dark/40
                              font-bold
                              mt-1
                            ">
                              {item.code}
                            </div>

                          </td>


                          {/* Unit */}
                          <td className="px-4 py-4">

                            <select
                              className="
                                bg-white
                                border
                                border-brown/15
                                rounded-xl
                                px-3
                                py-2
                                text-xs
                                font-black
                                outline-none
                                focus:border-brown
                              "
                              value={item.unit_type}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "unit_type",
                                  e.target.value
                                )
                              }
                            >

                              {item.allowedUnitTypes.map((u) => (
                                <option
                                  key={u}
                                  value={u}
                                >
                                  {u}
                                </option>
                              ))}

                            </select>

                          </td>


                          {/* Quantity */}
                          <td className="px-4 py-4">

                            <input
                              type="number"
                              min="1"
                              className="
                                w-20
                                p-2
                                bg-ligth/20
                                border
                                border-brown/10
                                rounded-xl
                                text-center
                                font-black
                                outline-none
                                focus:border-brown
                              "
                              value={item.quantity || ""}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "quantity",
                                  e.target.value
                                )
                              }
                            />

                          </td>


                          {/* Selling Price */}
                          <td className="px-4 py-4">

                            <div className="
                              flex
                              items-center
                              justify-center
                              gap-1
                            ">

                              <input
                               
                                type="number"
                                min="0"
                                className="
                                  w-24
                                  p-2
                                  bg-brown/5
                                  border
                                  border-brown/10
                                  rounded-xl
                                  text-center
                                  font-black
                                  text-brown
                                  outline-none
                                  focus:border-brown
                                "
                                value={item.price || ""}
                                onChange={(e) =>
                                  handleItemChange(
                                    idx,
                                    "price",
                                    e.target.value
                                  )
                                }
                              />

                              <span className="
                                text-[10px]
                                text-dark/40
                                font-bold
                              ">
                                EGP
                              </span>

                            </div>

                          </td>


                          {/* Purchase Price */}
                          {showPurchasePrice && (

                            <td className="
                              px-4
                              py-4
                              text-center
                              text-red-600
                              font-black
                            ">
                              {Number(
                                item.purchasePrice || 0
                              ).toLocaleString()}{" "}
                              EGP
                            </td>

                          )}


                          {/* Total */}
                          <td className="
                            px-4
                            py-4
                            text-center
                          ">

                            <span className="
                              inline-flex
                              items-center
                              justify-center
                              px-3
                              py-2
                              rounded-xl
                              bg-brown/5
                              text-brown
                              font-black
                            ">
                              {itemSubtotal.toLocaleString()} EGP
                            </span>

                          </td>


                          {/* Delete */}
                          <td className="
                            px-4
                            py-4
                            text-center
                          ">

                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveItem(idx)
                              }
                              className="
                                w-9
                                h-9
                                rounded-xl
                                bg-red-50
                                text-red-400
                                hover:bg-red-500
                                hover:text-white
                                flex
                                items-center
                                justify-center
                                mx-auto
                                transition-all
                              "
                              title="حذف المنتج"
                            >
                              <Trash2 size={17} />
                            </button>

                          </td>

                        </tr>

                      );

                    })

                  )}

                </tbody>

              </table>

            </div>

          </div>

        </div>

        {/* Payments and Notes */}
        <div className="bg-white p-6 rounded-2xl border border-brwonLight shadow-sm space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Payment Methods */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-ligth pb-2">
                <label className="font-black text-dark text-base flex items-center gap-2">
                  <CreditCard size={18} className="text-brown" /> طرق السداد
                </label>
                <button
                  type="button"
                  onClick={addPaymentField}
                  className="text-brown hover:text-dark text-xs font-black flex items-center gap-1"
                >
                  <Plus size={16} /> إضافة طريقة دفع
                </button>
              </div>

              {formData.payment.map((pay, pIdx) => (
                <div key={pIdx} className="bg-ligth/10 p-4 rounded-xl border border-brwonLight/60 space-y-3">
                  <div className="flex gap-2 items-center">
                    <select
                      className="bg-white p-2.5 rounded-xl border border-brown/15 text-sm font-bold outline-none text-dark focus:border-brown"
                      value={pay.paymentMethod}
                      onChange={(e) => handlePaymentChange(pIdx, "paymentMethod", e.target.value)}
                    >
                      <option value="cash">نقدي (كاش)</option>
                      <option value="wallet">محفظة إلكترونية</option>
                      <option value="instapay">إنستا باي</option>
                      <option value="work">خصم من الشغل</option>
                    </select>

                    <input
                      type="number"
                      placeholder="المبلغ المدفوع"
                      className="flex-1 p-2.5 rounded-xl border border-brown/15 text-center font-black text-dark outline-none focus:border-brown"
                      value={pay.amount || ""}
                      onChange={(e) => handlePaymentChange(pIdx, "amount", e.target.value)}
                    />

                    {formData.payment.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePaymentField(pIdx)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  {/* Wallet Details */}
                  {pay.paymentMethod === "wallet" && (
                    <div className="p-3 space-y-2 rounded-lg border bg-white shadow-inner border-brown/10 text-right">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block mb-1 text-[11px] font-black text-brown">رقم الراسل *</label>
                          <input
                            type="text"
                            className="p-2 w-full text-xs font-bold rounded-lg border bg-ligth/20"
                            placeholder="رقم المحفظة المحول منها"
                            value={pay.walletInfo?.senderPhone || ""}
                            onChange={(e) => handlePaymentChange(pIdx, "walletInfo", e.target.value, "senderPhone")}
                          />
                        </div>
                        <div>
                          <label className="block mb-1 text-[11px] font-black text-brown">اسم الراسل</label>
                          <input
                            type="text"
                            className="p-2 w-full text-xs font-bold rounded-lg border bg-ligth/20"
                            placeholder="اسم المحول"
                            value={pay.walletInfo?.senderName || ""}
                            onChange={(e) => handlePaymentChange(pIdx, "walletInfo", e.target.value, "senderName")}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block mb-1 text-[11px] font-black text-brown">رقم المستلم</label>
                          <input
                            type="text"
                            className="p-2 w-full text-xs font-bold rounded-lg border bg-ligth/20"
                            placeholder="رقم محفظة الشركة"
                            value={pay.walletInfo?.receiverPhone || ""}
                            onChange={(e) => handlePaymentChange(pIdx, "walletInfo", e.target.value, "receiverPhone")}
                          />
                        </div>
                        <div>
                          <label className="block mb-1 text-[11px] font-black text-brown">اسم المستلم</label>
                          <input
                            type="text"
                            className="p-2 w-full text-xs font-bold rounded-lg border bg-ligth/20"
                            placeholder="اسم محفظة الشركة"
                            value={pay.walletInfo?.receiverName || ""}
                            onChange={(e) => handlePaymentChange(pIdx, "walletInfo", e.target.value, "receiverName")}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bank / Instapay Details */}
                  {(pay.paymentMethod === "bank" || pay.paymentMethod === "instapay") && (
                    <div className="bg-white p-3 rounded-lg border border-brown/10 text-right">
                      <label className="text-[11px] font-black text-brown block mb-1">اسم البنك / المنصة</label>
                      <BankAutocomplete
                        value={pay.bankInfo?.bankName || ""}
                        placeholder="اكتب اسم البنك..."
                        onChange={(value) =>
                          handlePaymentChange(
                            pIdx,
                            "bankInfo",
                            value,
                            "bankName"
                          )
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Discount and Notes */}
            <div className="space-y-4">
              <h4 className="font-black text-dark text-base flex items-center gap-2 border-b border-ligth pb-2">
                <Calculator size={18} className="text-brown" /> الخصومات والملاحظات
              </h4>

              <div className="text-right space-y-1">
                {/* <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-dark">نسبة الخصم (%)</label>
                  <span className="text-[11px] text-red-500 font-bold">الحد الأقصى: {MAX_DISCOUNT_PERCENT}%</span>
                </div> */}
                <input
                  type="number"
                  max={MAX_DISCOUNT_PERCENT}
                  min="0"
                  className="w-full p-3 bg-ligth/20 border border-brown/10 rounded-xl outline-none font-bold text-dark focus:border-brown"
                  placeholder="0"
                  value={formData.discount || ""}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val > MAX_DISCOUNT_PERCENT) {
                      showAlert({ title: `عفواً، الحد الأقصى للخصم المسموح به هو ${MAX_DISCOUNT_PERCENT}%`, icon: "warning" });
                    }
                    setFormData((prev) => ({ ...prev, discount: Math.min(val, MAX_DISCOUNT_PERCENT) }));
                  }}
                />
              </div>

              <div className="text-right space-y-1">
                <label className="text-xs font-black text-dark">ملاحظات الإدارة</label>
                <textarea
                  rows={3}
                  className="w-full p-3 bg-ligth/20 border border-brown/10 rounded-xl outline-none font-bold text-dark focus:border-brown"
                  placeholder="أدخل أي ملاحظات على الفاتورة..."
                  value={formData.adminNote}
                  onChange={(e) => setFormData((prev) => ({ ...prev, adminNote: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Receipt Preview */}
          <div className="bg-white text-black p-6 rounded-none border border-black shadow-2xl max-w-lg mx-auto my-6 font-mono text-xs leading-relaxed relative">
            <div className="text-center border-b-2 border-dashed border-black pb-4 mb-4 space-y-1">
              <h2 className="font-black text-xl tracking-wider text-black uppercase">فاتورة بيع</h2>
              <p className="text-[10px] font-bold text-gray-700">التاريخ: {formData.invoiceDate || new Date().toISOString()}</p>
            </div>

            <div className="border-b border-black pb-3 mb-3 space-y-1 text-right">
              <div className="flex justify-between">
                <span className="font-bold">اسم العميل:</span>
                <span className="font-black">{selectedCustomerObj ? selectedCustomerObj.name : "عميل نقدي"}</span>
              </div>
              {selectedCustomerObj?.phone && (
                <div className="flex justify-between text-[11px]">
                  <span className="font-bold">رقم الهاتف:</span>
                  <span>{selectedCustomerObj.phone}</span>
                </div>
              )}
            </div>

            <div className="mb-4">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b-2 border-black text-black font-black text-[11px]">
                    <th className="py-1 text-right">المنتج</th>
                    <th className="py-1 text-center">الكمية</th>
                    <th className="py-1 text-center">السعر</th>
                    <th className="py-1 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {formData.items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 font-bold text-gray-500">
                        لم يتم إضافة أي منتجات
                      </td>
                    </tr>
                  ) : (
                    formData.items.map((item, idx) => (
                      <tr key={idx} className="align-top">
                        <td className="py-2 text-right">
                          <span className="font-black block">{item.productName}</span>
                          <span className="text-[9px] text-gray-600 block">[{item.unit_type}]</span>
                        </td>
                        <td className="py-2 text-center font-bold">{item.quantity}</td>
                        <td className="py-2 text-center font-bold">{item.price.toLocaleString()}</td>
                        <td className="py-2 text-left font-black">{(item.quantity * item.price).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t-2 border-black pt-3 space-y-1.5 text-right font-bold">
              <div className="flex justify-between text-gray-800">
                <span>المجموع الكلي:</span>
                <span>{totalPrice.toLocaleString()} EGP</span>
              </div>

              {safeDiscountPercent > 0 && (
                <div className="flex justify-between text-gray-800">
                  <span>الخصم ({safeDiscountPercent}%):</span>
                  <span>-{discountAmount.toLocaleString()} EGP</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-black border-t border-b border-black py-1.5 my-1">
                <span>صافي الفاتورة:</span>
                <span>{finalPrice.toLocaleString()} EGP</span>
              </div>

              <div className="flex justify-between text-gray-800">
                <span>المدفوع:</span>
                <span>{totalPaid.toLocaleString()} EGP</span>
              </div>

              <div className="flex justify-between text-gray-800">
                <span>المتبقي من الفاتورة:</span>
                <span>{netDue.toLocaleString()} EGP</span>
              </div>

              <div className="border-t border-dashed border-black pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-[11px] text-gray-700">
                  <span>رصيد العميل السابق:</span>
                  <span>{oldBalance.toLocaleString()} EGP</span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-700">
                  <span>رصيد العميل الحالي:</span>
                  <span>{newBalance.toLocaleString()} EGP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 justify-end pt-6 border-t border-brown/10">
            <button
              type="button"
              onClick={() => navigate("/invoices")}
              className="px-8 py-3 bg-ligth/50 text-dark border border-brown/20 rounded-xl font-black text-sm hover:bg-brown/10 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-brown text-white rounded-xl font-black text-sm hover:bg-brown/90 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  جاري التحديث...
                </>
              ) : (
                <>
                  <Save size={18} />
                  تحديث الفاتورة
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};

export default UpdateInvoice;
