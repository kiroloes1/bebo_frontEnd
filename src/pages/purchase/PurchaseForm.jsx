import React, { useState, useEffect, useRef } from "react";
import {
  Plus, Trash2, Save, Search, CreditCard,
  ShoppingBag, Eye, EyeOff, QrCode, Truck, Calculator, PackagePlus
} from "lucide-react";
import api from "../../services/api";
import { showAlert } from "../../services/alert";
import { useNavigate } from "react-router-dom";
import BankAutocomplete from "../../services/allBank";
import { io } from "socket.io-client";
import { QRCodeSVG } from "qrcode.react";



const PurchaseForm = () => {
  const navigate = useNavigate();
  const scanInputRef = useRef(null);

  const toDatetimeLocal = (isoString) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

  const [scannerSession, setScannerSession] = useState(null);
  const [mobileConnected, setMobileConnected] = useState(false);
  const socketRef = useRef(null);


const lastScannedCodeRef = useRef("");
const lastScanTimeRef = useRef(0);

const SCAN_COOLDOWN = 1200;
  // States
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Supplier Auto-complete
  const [supSearch, setSupSearch] = useState("");
  const [showSupList, setShowSupList] = useState(false);
  const [selectedSupplierObj, setSelectedSupplierObj] = useState(null);

  // Product Auto-complete / Scanning
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showProductList, setShowProductList] = useState(false);
  const [showSellingPrice, setShowSellingPrice] = useState(false);

  // New Product Draft (لما المنتج مش موجود أصلاً)
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const emptyDraft = {
 
    productName: "",
    unit_type: "قطعة",
    unitsPerPackage: 1,
    quantity: 1,
    price: 0, // سعر الشراء
    packageSellingPrice: 0,
    pieceSellingPrice: 0,
    category: "",
    companyName: "",
    expiration: "",
  };
  const [newProductDraft, setNewProductDraft] = useState(emptyDraft);

  // Max Discount Constraint
  const MAX_DISCOUNT_PERCENT = 20;

  // Form Data State
const [formData, setFormData] = useState({
  SupplierId: "",
  purchaseDate: toDatetimeLocal(new Date().toISOString()),
  discount: 0,
  adminNote: "",
  items: [],
  payment: [
    {
      amount: 0,
      paymentMethod: "cash",
      walletInfo: { senderName: "", senderPhone: "", receiverName: "", receiverPhone: "" },
      bankInfo: { bankName: "" }
    }
  ]
});


//     useEffect(() => {
//   if (searchResults.length === 0) {
//     setSearchResults([]);
//   }
// }, [searchResults]);


  const buildItemsWithProduct = (prevItems, product) => {
    const isPackageAllowed = product.unit_type === "كرتونة";
    const allowedUnits = isPackageAllowed ? ["كرتونة", "قطعة"] : ["قطعة"];

    const existingItems = prevItems.filter((i) => i.product === product._id);

    let targetUnit = isPackageAllowed ? "كرتونة" : "قطعة";

    if (isPackageAllowed && existingItems.length > 0) {
      const hasPackage = existingItems.some((i) => i.unit_type === "كرتونة");
      const hasPiece = existingItems.some((i) => i.unit_type === "قطعة");

      if (hasPackage && !hasPiece) targetUnit = "قطعة";
      else if (hasPiece && !hasPackage) targetUnit = "كرتونة";
    }

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
      isNew: false,
      product: product._id,
      productName: product.productName,
      code: product.code,
      unit_type: targetUnit,
      allowedUnitTypes: allowedUnits,

      quantity: 1,

      purchasePrice: Number(product.purchasePrice || 0),
   

      price:
        targetUnit === "كرتونة"
          ? Number(product.purchasePrice || 0)
          : Number(product.purchasePrice || 0),

      pieceSellingPrice: Number(product.pieceSellingPrice || 0),
      packageSellingPrice: Number(product.packageSellingPrice || 0),

      availableQuantity: product.availableQuantity,
      unitsPerPackage: product.unitsPerPackage || 1,
    };

    return [...prevItems, newItem];
  };

  // 3. Add Existing Product to Purchase (functional update)
  const handleSelectProduct = (product) => {
    setFormData((prev) => ({
      ...prev,
      items: buildItemsWithProduct(prev.items, product),
    }));

    setProductSearch("");
    setShowProductList(false);
  };

  // ================= Barcode Handling =================
const handleBarcode = async (code) => {
  if (!code?.trim()) return;

  code = code.trim();

  const now = Date.now();

  // منع نفس الباركود من التكرار بسرعة
  if (
    lastScannedCodeRef.current === code &&
    now - lastScanTimeRef.current < SCAN_COOLDOWN
  ) {
    return;
  }

  lastScannedCodeRef.current = code;
  lastScanTimeRef.current = now;

  try {
    const res = await api.get(
      `/product/search?search=${encodeURIComponent(code)}`
    );

    const products = res.data.data || [];

    const product = products.find(
      (p) =>
        String(p.code).toLowerCase() ===
        String(code).toLowerCase()
    );

    if (!product) {
      setNewProductDraft({
        ...emptyDraft,
        code,
      });

      setShowNewProductForm(true);

      showAlert({
        title: `المنتج بالكود (${code}) غير مسجل، استكمل بياناته لإضافته`,
        icon: "info",
      });

      return;
    }

    handleSelectProduct(product);

  } catch (error) {
    console.error(error);

    showAlert({
      title: "حدث خطأ أثناء البحث عن المنتج",
      icon: "error",
    });
  }
};

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_BASE_URL);
    socketRef.current = socket;

    const sessionId = crypto.randomUUID();
    setScannerSession(sessionId);

    socket.on("connect", () => {
      socket.emit("create-scanner-session", sessionId);
    });

    socket.on("join", ({ isOk }) => {
      setMobileConnected(isOk);
    });

    socket.on("barcode-received", ({ code }) => {
      setProductSearch(code);
      handleBarcode(code);
    });
    
        socket.on("disconnect", () => {
     setMobileConnected(false)
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // 1. Fetch Suppliers on Mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await api.get("/suppliers/getAllSupplierName");
        setSuppliers(res.data.data || []);
      } catch (err) {
        console.error("Error fetching suppliers:", err);
      }
    };
    fetchSuppliers();
  }, []);

  // 2. Search Products
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (productSearch.trim().length > 0) {
        try {
          const res = await api.get(`/product/search?search=${encodeURIComponent(productSearch.trim())}`);
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

  // 4. Handle Scan Enter Press
  const handleScanKeyDown = async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!productSearch.trim()) return;

      try {
        const res = await api.get(`/product/search?search=${encodeURIComponent(productSearch.trim())}`);
        const found = res.data.data || [];
        const exact = found.find(p => p.code.toLowerCase() === productSearch.trim().toLowerCase());

        if (exact) {
          handleSelectProduct(exact);
        } else if (found.length > 0) {
          handleSelectProduct(found[0]);
        } else {
          // مفيش أي نتيجة -> اقترح إضافة منتج جديد بنفس النص كـ كود
          setNewProductDraft({ ...emptyDraft, code: productSearch.trim() });
          setShowNewProductForm(true);
        }
      } catch (err) {
        showAlert({ title: "خطأ أثناء جلب المنتج", icon: "error" });
      }
    }
  };

  // 5. Item Fields Change (immutable + functional update)
const handleItemChange = (index, field, value) => {
  setFormData((prev) => {
    const updatedItems = prev.items.map((it, idx) => {
      if (idx !== index) return it;

      if (field === "unit_type") {
        return {
          ...it,
          unit_type: value,
          price: Number(it.purchasePrice || it.price || 0),
        };
      }

      if (
        field === "quantity" ||
        field === "price" ||
        field === "pieceSellingPrice" ||
        field === "packageSellingPrice"
      ) {
        return {
          ...it,
          [field]: Math.max(0, Number(value)),
        };
      }

      return {
        ...it,
        [field]: value,
      };
    });

    return {
      ...prev,
      items: updatedItems,
    };
  });
};

  const handleRemoveItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // 5.5 New Product Draft Handlers
  const handleDraftChange = (field, value) => {
    setNewProductDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddNewProduct = () => {
    const d = newProductDraft;

    if ( !d.productName?.trim()) {
      return showAlert({ title: "يجب إدخال اسم المنتج", icon: "warning" });
    }
    if (!d.quantity || Number(d.quantity) <= 0) {
      return showAlert({ title: "يجب إدخال كمية صحيحة", icon: "warning" });
    }
    if (!d.price || Number(d.price) <= 0) {
      return showAlert({ title: "يجب إدخال سعر الشراء", icon: "warning" });
    }
    if (d.unit_type === "قطعة") {
      if (!d.pieceSellingPrice || Number(d.pieceSellingPrice) <= 0) {
        return showAlert({
          title: "يجب إدخال سعر بيع القطعة",
          icon: "warning"
        });
      }
    }

    if (d.unit_type === "كرتونة") {
      if (!d.packageSellingPrice || Number(d.packageSellingPrice) <= 0) {
        return showAlert({
          title: "يجب إدخال سعر بيع الكرتونة",
          icon: "warning"
        });
      }
    }
    if (!d.expiration) {
      return showAlert({ title: "يجب إدخال تاريخ الصلاحية", icon: "warning" });
    }

    const newItem = {
      isNew: true,
      product: null,
      code: d.code?.trim(),
      productName: d.productName.trim(),

      unit_type: d.unit_type,
      allowedUnitTypes: [d.unit_type],

      unitsPerPackage:
        d.unit_type === "كرتونة"
          ? Number(d.unitsPerPackage) || 1
          : 1,

      quantity: Number(d.quantity),
      price: Number(d.price),

      // سعر البيع حسب نوع الوحدة
      packageSellingPrice:
        d.unit_type === "كرتونة"
          ? Number(d.packageSellingPrice)
          : 0,

      pieceSellingPrice:
        d.unit_type === "قطعة"
          ? Number(d.pieceSellingPrice)
          : 0,

      category: d.category,
      companyName: d.companyName,
      expiration: d.expiration,
    };

    let duplicateCode = false;

    setFormData((prev) => {
      if (prev.items.some((i) => i.code === newItem.code)) {
        duplicateCode = true;
        return prev;
      }
      return { ...prev, items: [...prev.items, newItem] };
    });

    if (duplicateCode) {
      return showAlert({ title: "الكود ده مضاف بالفعل في الفاتورة", icon: "warning" });
    }

    setNewProductDraft(emptyDraft);
    setShowNewProductForm(false);
    setProductSearch("");
  };

  // 6. Payment Handlers (كلها functional update)
  const addPaymentField = () => {
    setFormData((prev) => {
      const methods = ["cash", "wallet", "instapay", "bank"];
      const unusedMethod = methods.find(m => !prev.payment.some(p => p.paymentMethod === m)) || "cash";

      return {
        ...prev,
        payment: [
          ...prev.payment,
          {
            amount: 0,
            paymentMethod: unusedMethod,
            walletInfo: { senderName: "", senderPhone: "", receiverName: "", receiverPhone: "" },
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

  // 7. Purchase Calculations
  const totalPrice = formData.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);

  const safeDiscountPercent = Math.min(Number(formData.discount) || 0, MAX_DISCOUNT_PERCENT);
  const discountAmount = (totalPrice * safeDiscountPercent) / 100;
  const finalPrice = totalPrice - discountAmount;

  const totalPaid = formData.payment.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const netDue = finalPrice - totalPaid;

  const oldBalance = selectedSupplierObj ? selectedSupplierObj.balance : 0;
  const newBalance = oldBalance + netDue;

  // 8. Submit Form to API
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.SupplierId) {
      return showAlert({ title: "برجاء اختيار المورد أولاً", icon: "warning" });
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
 const payload = {
  SupplierId: formData.SupplierId,
  purchaseDate: new Date(formData.purchaseDate).toISOString(),
  discount: safeDiscountPercent,
  adminNote: formData.adminNote,
  items: formData.items.map(item => {
    if (item.isNew) {
      return {
        code: item.code,
        productName: item.productName,
        unit_type: item.unit_type,
        unitsPerPackage: item.unitsPerPackage,
        quantity: item.quantity,
        price: item.price,
        packageSellingPrice: item.packageSellingPrice,
        pieceSellingPrice: item.pieceSellingPrice,
        category: item.category,
        companyName: item.companyName,
        expiration: item.expiration,
      };
    }
    return {
      product: item.product,
      code: item.code,
      productName: item.productName,
      unit_type: item.unit_type,
      quantity: item.quantity,
      price: item.price,

  pieceSellingPrice: Number(item.pieceSellingPrice || 0),
  packageSellingPrice: Number(item.packageSellingPrice || 0),
    };
  }),
  payment: formData.payment
};

      await api.post("/purchase", payload);
      showAlert({ title: "تم إنشاء فاتورة المشتريات بنجاح", icon: "success" });
      navigate("/purchases");
    } catch (err) {
      showAlert({
        title: err.response?.data?.message || "حدث خطأ أثناء إنشاء فاتورة المشتريات",
        icon: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-[96vw] overview-auto md:w-full w-full mx-auto p-4 lg:p-8 bg-ligth/10" dir="rtl">
      <form onSubmit={handleSubmit} className="space-y-6 h-[100vh] overflow-auto pb-32 pr-2">

        {/* Header Options: Date & Supplier */}
        <div className="bg-white p-6 rounded-2xl border border-brwonLight shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 items-center">

          {/* المورد */}
          <div className="space-y-2 relative text-right">
            <label className="block font-black text-dark text-sm flex items-center gap-1">
              <Truck size={16} className="text-brown" /> اسم المورد
            </label>
            <div className="relative">
              <Search className="absolute right-3 top-3.5 text-brown/50" size={18} />
              <input
                type="text"
                className="w-full p-3 pr-10 bg-ligth/20 border border-brown/10 rounded-xl outline-none font-bold text-dark focus:border-brown focus:ring-1 focus:ring-brown"
                placeholder="ابحث عن اسم المورد ..."
                value={supSearch}
                onFocus={() => setShowSupList(true)}
                onChange={(e) => setSupSearch(e.target.value)}
              />
            </div>

            {showSupList && supSearch.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-brwonLight rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                {suppliers.filter(s => s.name.includes(supSearch)).map(s => (
                  <div
                    key={s._id}
                    className="p-4 hover:bg-ligth/40 cursor-pointer flex justify-between items-center border-b border-ligth last:border-b-0 text-dark transition-all"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, SupplierId: s._id }));
                      setSelectedSupplierObj(s);
                      setSupSearch(s.name);
                      setShowSupList(false);
                    }}
                  >
                    <span className="font-bold">{s.name}</span>
                    <span className="text-brown bg-ligth px-3 py-1 rounded-lg text-xs font-black">
                      رصيد مستحق: {s.balance?.toLocaleString()} EGP
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* التاريخ */}
          <div className="space-y-2 text-right">
            <label className="block font-black text-dark text-sm">تاريخ فاتورة الشراء</label>
            <input
              type="datetime-local"
              className="w-full p-3 bg-ligth/20 border border-brown/10 rounded-xl outline-none font-bold text-dark focus:border-brown focus:ring-1 focus:ring-brown"
              value={formData.purchaseDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, purchaseDate: e.target.value }))}
            />
          </div>
        </div>

        {/* Scan & Search Products Section */}
        <div className="bg-white rounded-3xl border border-brown/10 shadow-sm overflow-hidden">

          {/* ================= HEADER ================= */}
          <div className="p-5 md:p-6 border-b border-brown/10 bg-gradient-to-l from-ligth/30 to-white">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-brown/10 flex items-center justify-center">
                  <ShoppingBag size={22} className="text-brown" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-black text-dark">منتجات فاتورة الشراء</h3>
                  <p className="text-xs text-dark/50 font-bold mt-1">
                    ابحث عن منتج موجود، أو أضف منتج جديد لو مش متسجل عندك
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {scannerSession && (
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black
                      ${mobileConnected
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-gray-50 text-gray-600 border border-gray-200"}
                    `}
                  >
                    <span className={`w-2 h-2 rounded-full ${mobileConnected ? "bg-green-500" : "bg-gray-400"}`} />
                    {mobileConnected ? "الموبايل متصل" : "بانتظار الموبايل"}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowSellingPrice(!showSellingPrice)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ligth text-dark font-black text-xs border border-brown/10 hover:bg-brown hover:text-white transition-all"
                >
                  {showSellingPrice ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showSellingPrice ? "إخفاء سعر البيع" : "إظهار سعر البيع"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNewProductDraft(emptyDraft);
                    setShowNewProductForm(!showNewProductForm);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brown text-white font-black text-xs hover:bg-dark transition-all"
                >
                  <PackagePlus size={16} />
                  إضافة منتج جديد
                </button>
              </div>
            </div>
          </div>

          {/* ================= SCANNER + SEARCH ================= */}
          <div className="p-5 md:p-6 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-5 items-center">

              {scannerSession && (
                <div className="flex items-center gap-4 p-4 rounded-2xl border border-brown/10 bg-ligth/10 min-w-0">
                  <div className="shrink-0 p-2 bg-white rounded-xl border border-brown/10 shadow-sm">
                    <QRCodeSVG
                      value={`${window.location.origin}/scanner/${scannerSession}`}
                      size={110}
                      level="M"
                    />
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <QrCode size={18} className="text-brown" />
                      <h4 className="font-black text-dark text-sm">ربط ماسح الموبايل</h4>
                    </div>
                    <p className="text-xs text-dark/50 font-bold leading-5">
                      امسح الكود من الموبايل لربطه بالفاتورة واستخدم كاميرا الموبايل لقراءة الباركود.
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${mobileConnected ? "bg-green-500" : "bg-gray-400"}`} />
                      <span className={`text-[11px] font-black ${mobileConnected ? "text-green-600" : "text-gray-500"}`}>
                        {mobileConnected ? "متصل وجاهز للمسح" : "في انتظار الاتصال"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="relative">
                <label className="block text-xs font-black text-dark mb-2">البحث عن منتج</label>
                <div className="relative">
                  <QrCode className="absolute right-4 top-1/2 -translate-y-1/2 text-brown/50 pointer-events-none" size={20} />
                  <input
                    ref={scanInputRef}
                    type="text"
                    className="w-full h-14 pr-12 pl-4 bg-ligth/10 border border-brown/10 rounded-2xl outline-none font-bold text-dark placeholder:text-dark/30 focus:border-brown focus:ring-4 focus:ring-brown/5 transition-all"
                    placeholder="امسح Barcode أو QR أو اكتب اسم المنتج..."
                    value={productSearch}
                    onKeyDown={handleScanKeyDown}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />

                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setProductSearch("");
                        setSearchResults([]);
                        setShowProductList(false);
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-dark/5 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* ================= SEARCH RESULTS ================= */}
                {showProductList && productSearch.trim().length > 0 && !mobileConnected && (
                  <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-brown/10 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="px-4 py-2.5 bg-ligth/20 border-b border-brown/5 text-[11px] font-black text-dark/50">
                      نتائج البحث ({searchResults.length})
                    </div>

                    <div className="max-h-72 overflow-y-auto">
                      {searchResults.map((prod) => (
                        <button
                          type="button"
                          key={prod._id}
                          onClick={() => handleSelectProduct(prod)}
                          className="w-full p-4 text-right hover:bg-ligth/20 border-b border-brown/5 last:border-b-0 transition-all group"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <div className="font-black text-sm text-dark truncate">{prod.productName}</div>
                              <div className="text-[11px] text-dark/50 font-bold mt-1">الكود: {prod.code}</div>
                              <div className="text-[10px] text-dark/40 mt-1">
                                المتاح: {prod.availableQuantity} {prod.unit_type}
                              </div>
                            </div>
                            <div className="text-left shrink-0">
                              <div className="text-sm font-black text-brown">
                                {prod.purchasePrice?.toLocaleString() || 0} EGP
                              </div>
                              <div className="text-[10px] text-dark/40 font-bold">آخر سعر شراء</div>
                            </div>
                          </div>
                        </button>
                      ))}

                      {searchResults.length === 0 && (
                        <div className="p-6 text-center">
                          <p className="text-xs font-bold text-dark/40 mb-3">مفيش منتج بهذا الاسم أو الكود</p>
                          <button
                            type="button"
                            onClick={() => {
                              setNewProductDraft({ ...emptyDraft, code: productSearch.trim() });
                              setShowNewProductForm(true);
                              setShowProductList(false);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brown text-white text-xs font-black hover:bg-dark transition-all"
                          >
                            <PackagePlus size={14} />
                            إضافة "{productSearch}" كمنتج جديد
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                                           {/* ================= SEARCH RESULTS ================= */}
                {showProductList && searchResults.length==0 &&  !mobileConnected &&  productSearch.trim().length > 0 && (

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

            {/* ================= NEW PRODUCT DRAFT FORM ================= */}
            {showNewProductForm && (
              <div className="rounded-2xl border-2 border-dashed border-brown/30 bg-ligth/10 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-dark text-sm flex items-center gap-2">
                    <PackagePlus size={18} className="text-brown" /> بيانات المنتج الجديد
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowNewProductForm(false)}
                    className="text-dark/40 hover:text-red-500 text-xs font-black"
                  >
                    إلغاء
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* <div>
                    <label className="block text-[11px] font-black text-dark/60 mb-1">الكود *</label>
                    <input
                      type="text"
                      className="w-full p-2.5 bg-white border border-brown/15 rounded-xl text-xs font-bold outline-none focus:border-brown"
                      value={newProductDraft.code}
                      onChange={(e) => handleDraftChange("code", e.target.value)}
                    />
                  </div> */}
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[11px] font-black text-dark/60 mb-1">اسم المنتج *</label>
                    <input
                      type="text"
                      className="w-full p-2.5 bg-white border border-brown/15 rounded-xl text-xs font-bold outline-none focus:border-brown"
                      value={newProductDraft.productName}
                      onChange={(e) => handleDraftChange("productName", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-dark/60 mb-1">وحدة الأساس *</label>
                    <select
                      className="w-full p-2.5 bg-white border border-brown/15 rounded-xl text-xs font-bold outline-none focus:border-brown"
                      value={newProductDraft.unit_type}
                      onChange={(e) => handleDraftChange("unit_type", e.target.value)}
                    >
                      <option value="قطعة">قطعة</option>
                      <option value="كرتونة">كرتونة</option>
                    </select>
                  </div>
                  {newProductDraft.unit_type === "كرتونة" && (
                    <div>
                      <label className="block text-[11px] font-black text-dark/60 mb-1">عدد القطع بالكرتونة *</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full p-2.5 bg-white border border-brown/15 rounded-xl text-xs font-bold outline-none focus:border-brown"
                        value={newProductDraft.unitsPerPackage || ""}
                        onChange={(e) => handleDraftChange("unitsPerPackage", e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-black text-dark/60 mb-1">الكمية المشتراة *</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full p-2.5 bg-white border border-brown/15 rounded-xl text-xs font-bold outline-none focus:border-brown"
                      value={newProductDraft.quantity || ""}
                      onChange={(e) => handleDraftChange("quantity", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-dark/60 mb-1">سعر الشراء *</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full p-2.5 bg-white border border-brown/15 rounded-xl text-xs font-bold outline-none focus:border-brown"
                      value={newProductDraft.price || ""}
                      onChange={(e) => handleDraftChange("price", e.target.value)}
                    />
                  </div>
                  {/* سعر بيع القطعة */}
                  {(
                    <div>
                      <label className="block text-[11px] font-black text-dark/60 mb-1">
                        سعر بيع القطعة *
                      </label>

                      <input
                        type="number"
                        min="0"
                        className="w-full p-2.5 bg-white border border-brown/15 rounded-xl text-xs font-bold outline-none focus:border-brown"
                        value={newProductDraft.pieceSellingPrice || ""}
                        onChange={(e) =>
                          handleDraftChange("pieceSellingPrice", e.target.value)
                        }
                      />
                    </div>
                  )}

                  {/* سعر بيع الكرتونة */}
                  {newProductDraft.unit_type === "كرتونة" && (
                    <div>
                      <label className="block text-[11px] font-black text-dark/60 mb-1">
                        سعر بيع الكرتونة *
                      </label>

                      <input
                        type="number"
                        min="0"
                        className="w-full p-2.5 bg-white border border-brown/15 rounded-xl text-xs font-bold outline-none focus:border-brown"
                        value={newProductDraft.packageSellingPrice || ""}
                        onChange={(e) =>
                          handleDraftChange("packageSellingPrice", e.target.value)
                        }
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-black text-dark/60 mb-1">الفئة</label>
                    <input
                      type="text"
                      className="w-full p-2.5 bg-white border border-brown/15 rounded-xl text-xs font-bold outline-none focus:border-brown"
                      value={newProductDraft.category}
                      onChange={(e) => handleDraftChange("category", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-dark/60 mb-1">الشركة المصنعة</label>
                    <input
                      type="text"
                      className="w-full p-2.5 bg-white border border-brown/15 rounded-xl text-xs font-bold outline-none focus:border-brown"
                      value={newProductDraft.companyName}
                      onChange={(e) => handleDraftChange("companyName", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-dark/60 mb-1">تاريخ الصلاحية *</label>
                    <input
                      type="date"
                      className="w-full p-2.5 bg-white border border-brown/15 rounded-xl text-xs font-bold outline-none focus:border-brown"
                      value={newProductDraft.expiration}
                      onChange={(e) => handleDraftChange("expiration", e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddNewProduct}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-dark text-white font-black text-xs hover:bg-brown transition-all"
                >
                  <Plus size={16} /> إضافة المنتج للفاتورة
                </button>
              </div>
            )}

            {/* ================= ITEMS COUNTER ================= */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-dark/50">المنتجات المضافة</span>
                <span className="min-w-7 h-7 px-2 rounded-lg bg-brown text-white flex items-center justify-center text-xs font-black">
                  {formData.items.length}
                </span>
              </div>

              {formData.items.length > 0 && (
                <span className="text-xs font-black text-brown">
                  إجمالي القطع: {formData.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0).toLocaleString()}
                </span>
              )}
            </div>

            {/* ================= PRODUCTS TABLE ================= */}
            <div className="rounded-2xl border border-brown/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-right border-collapse">
                  <thead>
                    <tr className="bg-ligth/30 text-dark font-black text-xs border-b border-brown/10">
                      <th className="px-4 py-4 w-12">#</th>
                      <th className="px-4 py-4">المنتج</th>
                      <th className="px-4 py-4">الوحدة</th>
                      <th className="px-4 py-4 text-center">الكمية</th>
                      <th className="px-4 py-4 text-center">سعر الشراء</th>
                      {showSellingPrice && (
                        <th className="px-4 py-4 text-center text-green-700">سعر البيع</th>
                      )}
                      <th className="px-4 py-4 text-center">الإجمالي</th>
                      <th className="px-4 py-4 text-center">حذف</th>
                    </tr>
                  </thead>

                  <tbody className="text-sm font-bold text-dark">
                    {formData.items.length === 0 ? (
                      <tr>
                        <td colSpan={showSellingPrice ? 8 : 7} className="py-14 text-center">
                          <div className="flex flex-col items-center justify-center gap-3 text-dark/30">
                            <div className="w-16 h-16 rounded-2xl bg-ligth/40 flex items-center justify-center">
                              <ShoppingBag size={28} />
                            </div>
                            <div>
                              <p className="font-black text-sm text-dark/40">لم تتم إضافة منتجات</p>
                              <p className="text-xs mt-1 font-bold">امسح الباركود أو ابحث عن المنتج بالأعلى</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      formData.items.map((item, idx) => {
                        const itemSubtotal = Number(item.quantity || 0) * Number(item.price || 0);
                        const sellingPrice = item.unit_type === "كرتونة" ? item.packageSellingPrice : item.pieceSellingPrice;

                        return (
                          <tr key={idx} className="border-b border-brown/5 last:border-b-0 hover:bg-ligth/10 transition-colors">
                            <td className="px-4 py-4">
                              <span className="w-7 h-7 rounded-lg bg-ligth flex items-center justify-center text-xs font-black">
                                {idx + 1}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <div className="font-black text-sm flex items-center gap-2">
                                {item.productName}
                                {item.isNew && (
                                  <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black">
                                    جديد
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-dark/40 font-bold mt-1">{item.code}</div>
                            </td>

                            <td className="px-4 py-4">
                              {item.allowedUnitTypes.length > 1 ? (
                                <select
                                  className="bg-white border border-brown/15 rounded-xl px-3 py-2 text-xs font-black outline-none focus:border-brown"
                                  value={item.unit_type}
                                  onChange={(e) => handleItemChange(idx, "unit_type", e.target.value)}
                                >
                                  {item.allowedUnitTypes.map((u) => (
                                    <option key={u} value={u}>{u}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-xs font-black text-dark/60">{item.unit_type}</span>
                              )}
                            </td>

                            <td className="px-4 py-4">
                              <input
                                type="number"
                                min="1"
                                className="w-20 p-2 bg-ligth/20 border border-brown/10 rounded-xl text-center font-black outline-none focus:border-brown"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                              />
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                 
                                  className="w-24 p-2 bg-brown/5 border border-brown/10 rounded-xl text-center font-black text-brown outline-none focus:border-brown"
                                  value={item.price || ""}
                                  onChange={(e) => handleItemChange(idx, "price", e.target.value)}
                                />
                                <span className="text-[10px] text-dark/40 font-bold">EGP</span>
                              </div>
                            </td>

{showSellingPrice && (
  <td className="px-4 py-4 text-center">

    <div className="flex items-center justify-center gap-1">

      <input
        type="number"
      
        className="w-24 p-2 bg-green-50 border border-green-200 rounded-xl text-center font-black text-green-700 outline-none focus:border-green-500"
        
        value={
          item.unit_type === "كرتونة"
            ? item.packageSellingPrice || ""
            : item.pieceSellingPrice || ""
        }

        onChange={(e) => {
          handleItemChange(
            idx,
            item.unit_type === "كرتونة"
              ? "packageSellingPrice"
              : "pieceSellingPrice",
            e.target.value
          );
        }}
      />

      <span className="text-[10px] text-dark/40 font-bold">
        EGP
      </span>

    </div>

  </td>
)}

                            <td className="px-4 py-4 text-center">
                              <span className="inline-flex items-center justify-center px-3 py-2 rounded-xl bg-brown/5 text-brown font-black">
                                {itemSubtotal.toLocaleString()} EGP
                              </span>
                            </td>

                            <td className="px-4 py-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="w-9 h-9 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center mx-auto transition-all"
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
        </div>

        {/* Payments and Notes */}
        <div className="bg-white p-6 rounded-2xl border border-brwonLight shadow-sm space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* طرق السداد للمورد */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-ligth pb-2">
                <label className="font-black text-dark text-base flex items-center gap-2">
                  <CreditCard size={18} className="text-brown" /> طرق السداد للمورد
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
                      <option value="bank">تحويل بنكي</option>
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
                          <label className="block mb-1 text-[11px] font-black text-brown">رقم المستلم (المورد)</label>
                          <input
                            type="text"
                            className="p-2 w-full text-xs font-bold rounded-lg border bg-ligth/20"
                            placeholder="رقم محفظة المورد"
                            value={pay.walletInfo?.receiverPhone || ""}
                            onChange={(e) => handlePaymentChange(pIdx, "walletInfo", e.target.value, "receiverPhone")}
                          />
                        </div>
                        <div>
                          <label className="block mb-1 text-[11px] font-black text-brown">اسم المستلم (المورد)</label>
                          <input
                            type="text"
                            className="p-2 w-full text-xs font-bold rounded-lg border bg-ligth/20"
                            placeholder="اسم محفظة المورد"
                            value={pay.walletInfo?.receiverName || ""}
                            onChange={(e) => handlePaymentChange(pIdx, "walletInfo", e.target.value, "receiverName")}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {(pay.paymentMethod === "bank" || pay.paymentMethod === "instapay") && (
                    <div className="bg-white p-3 rounded-lg border border-brown/10 text-right">
                      <label className="text-[11px] font-black text-brown block mb-1">اسم البنك / المنصة</label>
                      <BankAutocomplete
                        value={pay.bankInfo?.bankName || ""}
                        placeholder="اكتب اسم البنك..."
                        onChange={(value) => handlePaymentChange(pIdx, "bankInfo", value, "bankName")}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* الخصم والملاحظات */}
            <div className="space-y-4">
              <h4 className="font-black text-dark text-base flex items-center gap-2 border-b border-ligth pb-2">
                <Calculator size={18} className="text-brown" /> الخصومات والملاحظات
              </h4>

              <div className="text-right space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-dark">نسبة خصم المورد (%)</label>
                  <span className="text-[11px] text-red-500 font-bold">الحد الأقصى: {MAX_DISCOUNT_PERCENT}%</span>
                </div>
                <input
                  type="number"
                  max={MAX_DISCOUNT_PERCENT}
                  min="0"
                  className="w-full p-3 bg-ligth/20 border border-brown/10 rounded-xl outline-none font-bold text-dark focus:border-brown"
                  placeholder="0"
                  value={formData.discount}
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
                  placeholder="أدخل أي ملاحظات على فاتورة الشراء..."
                  value={formData.adminNote}
                  onChange={(e) => setFormData((prev) => ({ ...prev, adminNote: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* فاتورة شراء (Thermal Printable Receipt Style) */}
          <div className="bg-white text-black p-6 rounded-none border border-black shadow-2xl max-w-lg mx-auto my-6 font-mono text-xs leading-relaxed relative">

            <div className="text-center border-b-2 border-dashed border-black pb-4 mb-4 space-y-1">
              <h2 className="font-black text-xl tracking-wider text-black uppercase">فاتورة شراء</h2>
              <p className="text-[10px] font-bold text-gray-700">
                التاريخ: {formData.purchaseDate || new Date().toISOString().split("T")[0]}
              </p>
            </div>

            <div className="border-b border-black pb-3 mb-3 space-y-1 text-right">
              <div className="flex justify-between">
                <span className="font-bold">اسم المورد:</span>
                <span className="font-black">{selectedSupplierObj ? selectedSupplierObj.name : "غير محدد"}</span>
              </div>
              {selectedSupplierObj?.phone && (
                <div className="flex justify-between text-[11px]">
                  <span className="font-bold">رقم الهاتف:</span>
                  <span>{selectedSupplierObj.phone}</span>
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
                <span>المدفوع للمورد:</span>
                <span>{totalPaid.toLocaleString()} EGP</span>
              </div>

              <div className="flex justify-between text-gray-800">
                <span>المتبقي للمورد:</span>
                <span>{netDue.toLocaleString()} EGP</span>
              </div>

              <div className="border-t border-dashed border-black pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-[11px] text-gray-700">
                  <span>رصيد المورد السابق:</span>
                  <span>{oldBalance.toLocaleString()} EGP</span>
                </div>
                <div className="flex justify-between text-xs font-black bg-gray-100 p-1.5 rounded">
                  <span>الرصيد الجديد المستحق للمورد:</span>
                  <span className="dir-ltr">{newBalance.toLocaleString()} EGP</span>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-2 left-0 right-0 h-2 bg-white [clip-path:polygon(0_0,2.5%_100%,5%_0,7.5%_100%,10%_0,12.5%_100%,15%_0,17.5%_100%,20%_0,22.5%_100%,25%_0,27.5%_100%,30%_0,32.5%_100%,35%_0,37.5%_100%,40%_0,42.5%_100%,45%_0,47.5%_100%,50%_0,52.5%_100%,55%_0,57.5%_100%,60%_0,62.5%_100%,65%_0,67.5%_100%,70%_0,72.5%_100%,75%_0,77.5%_100%,80%_0,82.5%_100%,85%_0,87.5%_100%,90%_0,92.5%_100%,95%_0,97.5%_100%,100%_0)]"></div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brown hover:bg-brown/90 text-white font-black py-4 rounded-xl flex justify-center items-center gap-2 shadow-lg transition-all"
          >
            <Save size={20} />
            {loading ? "جاري الإنشاء..." : "إنشاء وإصدار فاتورة الشراء"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseForm;
