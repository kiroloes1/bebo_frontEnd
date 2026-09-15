// pages/settings/SettingsPage.jsx
import React, { useState, useEffect } from "react";
import { 
  Settings, 
  Paintbrush, 
  Lock, 
  Save, 
  RefreshCw, 
  Eye,
  X,
  FileText,
  Layers,
  Upload,
  Image as ImageIcon,
  Plus,
  Trash2
} from "lucide-react";
import { showAlert } from "../../services/alert";
import { showAlertConfirm } from "../../services/alertConfirm";
import api from "../../services/api";
import { useSystemSettings } from "../../context/shareInfo";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  // حالة الصورة المرفوعة
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);

  const [iconInvoicesFile, setIconInvoicesFile] = useState(null);
  const [iconInvoicesPreview, setIconInvoicesPreview] = useState(null);

  // البيانات المطابقة للباك إند
  const [settings, setSettings] = useState({
    factoryName: "",
    invoiceFactoryName: "",
    systemFont: "Cairo",
    invoiceFont: "Hooz",
    theme: {
      primary: "#0A2947",
      secondary: "#8B5E3C",
      accent: "#8B5E3C",
      background: "#F3E4C9",
    },
    phones: [],
    icon: null,
    iconInvoices: null,
    financialPinUpdatedDate: null,
    updatedBy: null,
    financialPinUpdatedBy: null,
  });

  const [financialPin, setFinancialPin] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // جلب الإعدادات عند تحميل الصفحة
  const fetchSettings = async () => {
    try {
      setFetching(true);
      const response = await api.get("/settings");
      if (response.data?.success) {
        setSettings(response.data.data);
        if (response.data.data?.icon?.url) {
          setIconPreview(response.data.data.icon.url);
        }
        if (response.data.data?.iconInvoices?.url) {
          setIconInvoicesPreview(response.data.data.iconInvoices.url);
        }
      }
    } catch (error) {
      showAlert({
        title: "حدث خطأ أثناء تحميل الإعدادات من السيرفر",
        icon: "error"
      });
    } finally {
      setFetching(false);
    }
  };
  
  useEffect(() => {
    fetchSettings();
  }, []);

  const { setSettings2 } = useSystemSettings();
    
  // التعامل مع تغيير الحقول النصية
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // التعامل مع أرقام الهاتف
  const handleAddPhone = () => {
    if (newPhone.trim() === "") {
      showAlert({
        title: "يرجى إدخال رقم هاتف صحيح",
        icon: "warning"
      });
      return;
    }
    setSettings((prev) => ({
      ...prev,
      phones: [...prev.phones, newPhone.trim()]
    }));
    setNewPhone("");
  };

  const handleRemovePhone = (index) => {
    setSettings((prev) => ({
      ...prev,
      phones: prev.phones.filter((_, i) => i !== index)
    }));
  };

  const handlePhoneChange = (index, value) => {
    setSettings((prev) => ({
      ...prev,
      phones: prev.phones.map((phone, i) => i === index ? value : phone)
    }));
  };

  // التعامل مع اختيار ملف أيقونة جديد
  const handleIconChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIconFile(file);
      setIconPreview(URL.createObjectURL(file));
    }
  };

  const handleInvoiceIconChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIconInvoicesFile(file);
      setIconInvoicesPreview(URL.createObjectURL(file));
    }
  };

  // التعامل مع تغيير الألوان
  const handleColorChange = (colorKey, value) => {
    setSettings((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        [colorKey]: value,
      },
    }));
  };

  // حفظ إعدادات النظام العام والمظهر باستخدام FormData
  const handleSaveGeneralAndTheme = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("factoryName", settings.factoryName || "");
      formData.append("invoiceFactoryName", settings.invoiceFactoryName || "");
      
      // إرسال أرقام الهاتف كـ JSON string
      formData.append("phones", JSON.stringify(settings.phones));

      formData.append("systemFont", settings.systemFont || "Cairo");
      formData.append("invoiceFont", settings.invoiceFont || "Hooz");

      // تحويل الألوان إلى JSON String لأن FormData لا تقبل كائنات مجردة
      if (settings.theme) {
        formData.append("theme[primary]", settings.theme.primary);
        formData.append("theme[secondary]", settings.theme.secondary);
        formData.append("theme[accent]", settings.theme.accent);
        formData.append("theme[background]", settings.theme.background);
      }

      // إضافة الصورة في حال اختيار ملف جديد
      if (iconFile) {
        formData.append("icon", iconFile);
      }

      if (iconInvoicesFile) {
        formData.append("iconInvoices", iconInvoicesFile);
      }

      const response = await api.put("/settings", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.success) {
        const updatedData = response.data.data;
        setSettings(updatedData);
        if (updatedData.icon?.url) {
          setIconPreview(updatedData.icon.url);
        }
        if (updatedData.iconInvoices?.url) {
          setIconInvoicesPreview(updatedData.iconInvoices.url);
        }

        setIconFile(null);
        setIconInvoicesFile(null);

        showAlert({
          title: "تم حفظ الإعدادات بنجاح",
          icon: "success"
        });

        // تحديث الثيم العام بالنظام
        document.documentElement.style.setProperty("--system-font", updatedData.systemFont);
        const root = document.documentElement;
        root.style.setProperty("--primary", updatedData.theme.primary);
        root.style.setProperty("--secondary", updatedData.theme.secondary);
        root.style.setProperty("--accent", updatedData.theme.accent);
        root.style.setProperty("--background", updatedData.theme.background);

        if (setSettings2) {
          setSettings2({
            factoryName: updatedData.factoryName,
            invoiceFactoryName: updatedData.invoiceFactoryName,
            systemFont: updatedData.systemFont,
            invoiceFont: updatedData.invoiceFont,
            theme: updatedData.theme,
            icon: updatedData.icon,
            iconInvoices: updatedData.iconInvoices,
            phones: updatedData.phones || []
          });
        }

        localStorage.setItem("settings", JSON.stringify(updatedData));
      }
    } catch (error) {
      showAlert({
        title: error.response?.data?.message || "فشل في حفظ التعديلات",
        icon: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  // حفظ رمز الحماية المالية (الـ PATCH API)
  const handleSaveFinancialPin = async (e) => {
    e.preventDefault();
    
    if (!financialPin || financialPin.trim() === "") {
      showAlert({
        title: "يرجى إدخال رمز أمان أولاً",
        icon: "warning"
      });
      return;
    }

    const result = await showAlertConfirm({
      title: "تأكيد تغيير الرمز المالي",
      text: `رمز الأمان المالي الجديد هو: ( ${financialPin} ). هل أنت متأكد من رغبتك في الحفظ؟`,
      icon: "warning",
      confirmButtonText: "نعم، احفظ الرمز",
      cancelButtonText: "تراجع"
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const response = await api.patch("/settings", { financialPin });
        if (response.data?.success) {
          setSettings(response.data.data);
          setFinancialPin(""); 
          showAlert({
            title: "تم تحديث رمز الحماية المالية بنجاح",
            icon: "success"
          });
        }
      } catch (error) {
        showAlert({
          title: error.response?.data?.message || "فشل في تحديث الرمز المالي",
          icon: "error"
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDate = (dateObj) => {
    if (!dateObj) return "لم يتم التعديل بعد";
    const dateStr = dateObj.$date || dateObj;
    return new Date(dateStr).toLocaleString("ar-EG");
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="animate-spin w-10 h-10 text-dark" />
        <p className="text-dark font-semibold">جاري تحميل إعدادات النظام...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto p-4 md:p-8 text-right" dir="rtl">
      
      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brwonLight pb-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dark">إعدادات النظام</h1>
          <p className="text-brown text-sm mt-1">تخصيص الهوية البصرية للألوان، الخطوط، اللوجو وتأمين النظام مالياً</p>
        </div>
        {settings.updatedBy && (
          <div className="bg-ligth border border-brown/20 rounded-lg p-3 text-xs text-dark">
            <span className="font-semibold text-brown">آخر تعديل عام بواسطة:</span> {settings.updatedBy.username || settings.updatedBy.email}
            <br />
            <span className="font-semibold text-brown">بتاريخ:</span> {formatDate(settings.updatedAt)}
          </div>
        )}
      </div>

      {/* التبويبات والمحتوى */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* شريط التبويبات */}
        <div className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
          <button
            onClick={() => {setActiveTab("general"); setShowPreview(false);}}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === "general"
                ? "bg-dark text-white shadow-sm"
                : "bg-ligth text-brown hover:bg-brown/10"
            }`}
          >
            <Settings className="w-4 h-4" />
            بيانات المعرض والأيقونة
          </button>

          <button
            onClick={() => setActiveTab("theme")}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === "theme"
                ? "bg-dark text-white shadow-sm"
                : "bg-ligth text-brown hover:bg-brown/10"
            }`}
          >
            <Paintbrush className="w-4 h-4" />
            المظهر والخطوط
          </button>

          <button
            onClick={() => {setActiveTab("security"); setShowPreview(false);}}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === "security"
                ? "bg-dark text-white shadow-sm"
                : "bg-ligth text-brown hover:bg-brown/10"
            }`}
          >
            <Lock className="w-4 h-4" />
            الرمز والـ PIN المالي
          </button>
        </div>

        {/* محتوى التبويبات */}
        <div className="md:col-span-3 bg-white border border-brwonLight shadow-sm rounded-xl p-6">
          
          {/* التبويب الأول: بيانات المعرض والأيقونة */}
          {activeTab === "general" && (
            <form onSubmit={handleSaveGeneralAndTheme} className="space-y-6">
              <h2 className="text-lg font-bold text-dark border-b border-brwonLight pb-2">بيانات المعرض والأيقونة</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">اسم المعرض داخل النظام</label>
                  <input
                    type="text"
                    name="factoryName"
                    value={settings.factoryName || ""}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-brown/30 rounded-lg focus:ring-2 focus:ring-dark focus:outline-none text-dark"
                    placeholder="مثال: معرض المخرز"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">اسم المعرض في الفواتير</label>
                  <input
                    type="text"
                    name="invoiceFactoryName"
                    value={settings.invoiceFactoryName || ""}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-brown/30 rounded-lg focus:ring-2 focus:ring-dark focus:outline-none text-dark"
                    placeholder="مثال: تخريز"
                  />
                </div>
              </div>

              {/* أرقام الهاتف */}
<div className="border-t border-brownLight pt-4 dir-rtl" dir="rtl">
  <label className="block text-sm font-semibold text-dark mb-3">
    أرقام الهاتف
  </label>
  
  <div className="flex flex-col gap-3">
    {/* قائمة الأرقام الموجودة */}
    {settings.phones && settings.phones.length > 0 ? (
      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pl-1">
        {settings.phones.map((phone, index) => (
          <div key={index} className="flex items-center gap-2 group">
            <input
              type="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => handlePhoneChange(index, e.target.value)}
              className="flex-1 px-3 py-2 text-right border border-brown/30 rounded-lg text-sm text-dark bg-white focus:ring-2 focus:ring-dark focus:border-transparent focus:outline-none transition-all group-hover:border-brown/60"
              placeholder="05XXXXXXXX"
            />
            <button
              type="button"
              onClick={() => handleRemovePhone(index)}
              title="حذف الرقم"
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-xs text-gray-400 py-1">لا توجد أرقام هاتف مسجلة حالياً</p>
    )}

    {/* حقل إضافة رقم جديد */}
    <div className="flex items-center gap-2 pt-1">
      <input
        type="tel"
        dir="ltr"
        value={newPhone}
        onChange={(e) => setNewPhone(e.target.value)}
        className="flex-1 px-3 py-2 text-right border border-brown/30 rounded-lg text-sm text-dark bg-white focus:ring-2 focus:ring-dark focus:border-transparent focus:outline-none transition-all"
        placeholder="أدخل رقم هاتف جديد"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleAddPhone();
          }
        }}
      />
      <button
        type="button"
        onClick={handleAddPhone}
        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-brown text-white text-sm font-medium rounded-lg hover:bg-brown/90 active:scale-95 transition-all flex-shrink-0 shadow-sm"
      >
        <Plus className="w-4 h-4" />
        <span>إضافة</span>
      </button>
    </div>
  </div>
</div>

              {/* قسم رفع الأيقونة / الشعار */}
              <div className="border-t border-brwonLight pt-4">
                <label className="block text-sm font-semibold text-dark mb-2">أيقونة / شعار المعرض</label>
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-ligth/30 p-4 rounded-xl border border-brown/20">
                  <div className="w-20 h-20 rounded-lg border border-brown/30 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {iconPreview ? (
                      <img src={iconPreview} alt="شعار المعرض" className="w-full h-full object-contain p-1" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-brown/40" />
                    )}
                  </div>

                  <div className="flex-1 text-center sm:text-right">
                    <input
                      type="file"
                      id="icon-upload"
                      accept="image/*"
                      onChange={handleIconChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="icon-upload"
                      className="inline-flex items-center gap-2 bg-white border border-brown/40 hover:bg-brown/5 text-dark font-medium text-xs px-4 py-2 rounded-lg cursor-pointer transition-all shadow-sm"
                    >
                      <Upload className="w-4 h-4 text-brown" />
                      رفع أيقونة جديدة
                    </label>
                    <p className="text-brown/70 text-xs mt-2">صيغ الصور المسموحة: PNG, JPG, WEBP (الحد الأقصى 2MB)</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-brwonLight pt-4">
                <label className="block text-sm font-semibold text-dark mb-2">
                  أيقونة / شعار الفواتير
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-ligth/30 p-4 rounded-xl border border-brown/20">
                  <div className="w-20 h-20 rounded-lg border border-brown/30 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {iconInvoicesPreview ? (
                      <img
                        src={iconInvoicesPreview}
                        alt="شعار الفواتير"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-brown/40" />
                    )}
                  </div>

                  <div className="flex-1 text-center sm:text-right">
                    <input
                      type="file"
                      id="invoice-icon-upload"
                      accept="image/*"
                      onChange={handleInvoiceIconChange}
                      className="hidden"
                    />

                    <label
                      htmlFor="invoice-icon-upload"
                      className="inline-flex items-center gap-2 bg-white border border-brown/40 hover:bg-brown/5 text-dark font-medium text-xs px-4 py-2 rounded-lg cursor-pointer transition-all shadow-sm"
                    >
                      <Upload className="w-4 h-4 text-brown" />
                      رفع أيقونة الفواتير
                    </label>

                    <p className="text-brown/70 text-xs mt-2">
                      صيغ الصور المسموحة: PNG, JPG, WEBP (الحد الأقصى 2MB)
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-brwonLight">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-brown hover:bg-brown/90 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow"
                >
                  <Save className="w-4 h-4" />
                  {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
                </button>
              </div>
            </form>
          )}

          {/* التبويب الثاني: المظهر والخطوط */}
          {activeTab === "theme" && (
            <form onSubmit={handleSaveGeneralAndTheme} className="space-y-6">
              <div className="flex items-center justify-between border-b border-brwonLight pb-2">
                <h2 className="text-lg font-bold text-dark">المظهر والخطوط</h2>
                
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-dark/10 hover:bg-dark/20 text-dark px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  معاينة المظهر (شاشة كاملة)
                </button>
              </div>

              {/* الألوان */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
                <div>
                  <label className="block text-xs font-bold text-dark mb-1">اللون الأساسي (Primary)</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="color" 
                      value={settings.theme?.primary || "#0A2947"} 
                      onChange={(e) => handleColorChange("primary", e.target.value)}
                      className="w-10 h-10 border rounded cursor-pointer"
                    />
                    <span className="text-xs font-mono text-gray-500 uppercase">{settings.theme?.primary}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-dark mb-1">اللون الثانوي (Secondary)</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="color" 
                      value={settings.theme?.secondary || "#8B5E3C"} 
                      onChange={(e) => handleColorChange("secondary", e.target.value)}
                      className="w-10 h-10 border rounded cursor-pointer"
                    />
                    <span className="text-xs font-mono text-gray-500 uppercase">{settings.theme?.secondary}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-dark mb-1">لون التمييز (Accent)</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="color" 
                      value={settings.theme?.accent || "#8B5E3C"} 
                      onChange={(e) => handleColorChange("accent", e.target.value)}
                      className="w-10 h-10 border rounded cursor-pointer"
                    />
                    <span className="text-xs font-mono text-gray-500 uppercase">{settings.theme?.accent}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-dark mb-1">لون الخلفية (Background)</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="color" 
                      value={settings.theme?.background || "#F3E4C9"} 
                      onChange={(e) => handleColorChange("background", e.target.value)}
                      className="w-10 h-10 border rounded cursor-pointer"
                    />
                    <span className="text-xs font-mono text-gray-500 uppercase">{settings.theme?.background}</span>
                  </div>
                </div>
              </div>

              {/* الخطوط */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-brwonLight pt-6">
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">خط واجهات النظام</label>
                  <select
                    name="systemFont"
                    value={settings.systemFont || "Cairo"}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-brown/30 rounded-lg focus:outline-none text-dark bg-white"
                  >
                    <option value="Cairo">Cairo (مقروء ورسمي)</option>
                    <option value="Tahoma">Tahoma (المنسق)</option>
                    <option value="Tajawal">Tajawal (عصري ومبسط)</option>
                    <option value="Almarai">Almarai (مريح للعين)</option>
                    <option value="Alexandria">Alexandria (حديث وأنيق)</option>
                    <option value="Changa">Changa (واضح وعريض)</option>
                    <option value="Readex Pro">Readex Pro (احترافي)</option>
                    <option value="IBM Plex Sans Arabic">IBM Plex Sans Arabic (رسمي)</option>
                    <option value="Noto Kufi Arabic">Noto Kufi Arabic (كوفي)</option>
                    <option value="Noto Naskh Arabic">Noto Naskh Arabic (نسخي)</option>
                    <option value="El Messiri">El Messiri (مميز للعناوين)</option>
                    <option value="Reem Kufi">Reem Kufi (كوفي خفيف)</option>
                    <option value="Baloo Bhaijaan 2">Baloo Bhaijaan 2 (ودي)</option>
                    <option value="Aref Ruqaa">Aref Ruqaa (تقليدي)</option>
                    <option value="Amiri">Amiri (للفواتير والمستندات)</option>
                    <option value="Markazi Text">Markazi Text (رسمي)</option>
                    <option value="Hooz">Hooz</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">خط طباعة الفواتير</label>
                  <select
                    name="invoiceFont"
                    value={settings.invoiceFont || "Hooz"}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-brown/30 rounded-lg focus:outline-none text-dark bg-white"
                  >
                    <option value="Tahoma">Tahoma (الافتراضي المنسق)</option>
                    <option value="Hooz">Hooz</option>
                    <option value="Cairo">Cairo</option>
                    <option value="Tajawal">Tajawal (عصري ومبسط)</option>
                    <option value="Almarai">Almarai (مريح للعين)</option>
                    <option value="Alexandria">Alexandria (حديث وأنيق)</option>
                    <option value="Changa">Changa (واضح وعريض)</option>
                    <option value="Readex Pro">Readex Pro (احترافي)</option>
                    <option value="IBM Plex Sans Arabic">IBM Plex Sans Arabic (رسمي)</option>
                    <option value="Noto Kufi Arabic">Noto Kufi Arabic (كوفي)</option>
                    <option value="Noto Naskh Arabic">Noto Naskh Arabic (نسخي)</option>
                    <option value="El Messiri">El Messiri (مميز للعناوين)</option>
                    <option value="Reem Kufi">Reem Kufi (كوفي خفيف)</option>
                    <option value="Baloo Bhaijaan 2">Baloo Bhaijaan 2 (ودي)</option>
                    <option value="Aref Ruqaa">Aref Ruqaa (تقليدي)</option>
                    <option value="Amiri">Amiri (للفواتير والمستندات)</option>
                    <option value="Markazi Text">Markazi Text (رسمي)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-brwonLight">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-brown hover:bg-brown/90 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow"
                >
                  <Save className="w-4 h-4" />
                  {loading ? "جاري الحفظ..." : "حفظ التغييرات المظهرية"}
                </button>
              </div>
            </form>
          )}

          {/* التبويب الثالث: الأمان والرمز المالي */}
          {activeTab === "security" && (
            <form onSubmit={handleSaveFinancialPin} className="space-y-6">
              <h2 className="text-lg font-bold text-dark border-b border-brwonLight pb-2">أمان الخزنة والـ PIN المالي</h2>
              
              <div className="bg-ligth border border-brown/30 text-dark rounded-lg p-4 text-sm leading-relaxed">
                <span className="font-bold text-brown">تنبيه حماية هام جداً:</span>
                <p className="mt-1 text-xs text-dark/90">
                  احفظ رمز الـ PIN ولا تشاركه مع أحد لكي لا يرى الشؤون المالية والعمليات الحساسة الخاصة بك.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">أدخل الرمز المالي الجديد لتحديثه</label>
                  <input
                    type="password"
                    maxLength={10}
                    value={financialPin}
                    onChange={(e) => setFinancialPin(e.target.value)}
                    placeholder="أدخل الرمز السري الجديد هنا"
                    className="w-full md:w-1/2 px-3 py-2 border border-brown/30 rounded-lg focus:ring-2 focus:ring-brown focus:outline-none tracking-widest text-center text-lg font-bold text-dark bg-white"
                  />
                  <p className="text-brown/70 text-xs mt-1">سيطلب النظام منك تأكيد كتابة هذا الرمز قبل اعتماده رسمياً.</p>
                </div>

                {settings.financialPinUpdatedBy && (
                  <div className="bg-ligth/40 border border-brown/20 border-dotted border-2 rounded-xl p-4 text-xs space-y-2">
                    <div className="text-dark flex justify-between items-center">
                      <span className="font-bold text-brown">آخر تحديث للرمز بواسطة:</span>{" "}
                      <span>{settings.financialPinUpdatedBy.username || settings.financialPinUpdatedBy.email} | ({settings.financialPinUpdatedBy.role})</span>
                    </div>
                    <div className="text-dark flex justify-between items-center">
                      <span className="font-bold text-brown">تاريخ آخر تعديل للرمز:</span>{" "}
                      <span>{formatDate(settings.financialPinUpdatedDate)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-brwonLight">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-dark hover:bg-dark/90 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow"
                >
                  <Lock className="w-4 h-4" />
                  {loading ? "جاري التحديث..." : "تعديل الرمز المالي"}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

      {/* مودال المعاينة */}
      {showPreview && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 md:p-8 flex items-center justify-center"
          style={{ fontFamily: settings.systemFont }}
        >
          <div 
            className="w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all bg-white"
          >
            {/* الهيدر */}
            <div 
              className="px-6 py-4 flex items-center justify-between text-white shadow-md"
              style={{ backgroundColor: settings.theme?.primary || "#0A2947" }}
            >
              <div className="flex items-center gap-3">
                {iconPreview ? (
                  <img src={iconPreview} alt="لوجو" className="w-8 h-8 object-contain bg-white/10 rounded p-1" />
                ) : (
                  <Layers className="w-6 h-6" />
                )}
                <div>
                  <h3 className="font-bold text-lg">شاشة المعاينة التفاعلية لوضع المظهر</h3>
                  <p className="text-xs opacity-80">هكذا ستبدو واجهات ومكونات النظام بناءً على خياراتك الحالية</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPreview(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* محتوى المعاينة */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-gray-300">
                <div>
                  <h2 className="text-xl font-black" style={{ color: settings.theme?.primary }}>
                    لوحة التحكم العامة لـ {settings.factoryName || "اسم المعرض"}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">أهلاً بك مجدداً في النظام المالي للمعرض.</p>
                </div>
                
                <div className="flex gap-3">
                  <div className="bg-white p-3 rounded-xl border shadow-sm flex items-center gap-3">
                    <div className="p-2 rounded-lg text-white" style={{ backgroundColor: settings.theme?.secondary }}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">الفواتير المعلقة</p>
                      <p className="text-sm font-bold" style={{ color: settings.theme?.primary }}>12 فاتورة</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
                  <h4 className="font-bold border-b pb-2" style={{ color: settings.theme?.primary, borderColor: settings.theme?.background }}>
                    تجربة العناصر التفاعلية
                  </h4>
                  
                  <p className="text-sm text-gray-600 leading-relaxed">
                    هذا النص مكتوب بخط <span className="font-bold underline text-black">{settings.systemFont}</span> للتأكد من مدى قراءته.
                  </p>

                  <div className="space-y-2 pt-2">
                    <button 
                      className="w-full text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-opacity hover:opacity-90 text-sm"
                      style={{ backgroundColor: settings.theme?.primary }}
                    >
                      زر رئيسي (Primary)
                    </button>
                    <button 
                      className="w-full text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-opacity hover:opacity-90 text-sm"
                      style={{ backgroundColor: settings.theme?.secondary }}
                    >
                      زر ثانوي (Secondary)
                    </button>
                    <button 
                      className="w-full font-bold py-2 px-4 rounded-lg border text-sm transition-colors bg-transparent"
                      style={{ color: settings.theme?.accent, borderColor: settings.theme?.accent }}
                    >
                      زر تمييز شفاف (Accent)
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2 bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="px-4 py-3 text-white font-bold text-sm" style={{ backgroundColor: settings.theme?.primary }}>
                    جدول البيانات والمشتريات الافتراضي
                  </div>
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-gray-100 border-b text-gray-700">
                        <th className="p-3">رقم الطلب</th>
                        <th className="p-3">البيان</th>
                        <th className="p-3">الحالة</th>
                        <th className="p-3">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-gray-600">
                      <tr>
                        <td className="p-3 font-mono">#INV-2026</td>
                        <td className="p-3">خامات بولي إيثيلين للتخريز</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] text-white font-bold" style={{ backgroundColor: settings.theme?.secondary }}>
                            مكتمل
                          </span>
                        </td>
                        <td className="p-3 font-bold" style={{ color: settings.theme?.primary }}>45,000 ج.م</td>
                      </tr>
                      <tr style={{ backgroundColor: `${settings.theme?.background}20` }}>
                        <td className="p-3 font-mono">#INV-2027</td>
                        <td className="p-3">صيانة ماكينة التقطيع الرئيسية</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] text-white font-bold" style={{ backgroundColor: settings.theme?.accent }}>
                            قيد الانتظار
                          </span>
                        </td>
                        <td className="p-3 font-bold" style={{ color: settings.theme?.primary }}>8,200 ج.م</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SettingsPage;