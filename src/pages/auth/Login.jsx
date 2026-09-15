import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Mail, Lock, LogIn } from "lucide-react"; // استخدام أحدث الأيقونات المتناسقة
import api from "../../services/api";
import { showAlert } from "../../services/alert";
import { jwtDecode } from "jwt-decode";
import logo from "../../../public/login.jpg";
import { useSystemSettings } from "../../context/shareInfo";

function Login() {
  const handleBackup = async () => {
    try {
      const response = await api.get("/backupMaual", { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      const date = new Date().toISOString().split("T")[0];
      link.setAttribute("download", `backup-${date}.json`);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Backup failed:", err);
    }
  };

  const Navigate = useNavigate();
  const RememberValue = JSON.parse(localStorage.getItem("remember"));

  // تغيير اسم الحالة لـ formData لتجنب التعارض مع المكونات المستوردة
  const [formData, setFormData] = useState({
    email: RememberValue?.email || "",
    password: RememberValue?.password || ""
  });

  const [Remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false); // حالة التحميل للزر
  const { settings } = useSystemSettings();

  
 

  // حفظ القيم في الـ State
  const OnChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // عملية تسجيل الدخول
  const LoginProcess = async () => {
    if (!formData.email || !formData.password) {
      showAlert({ title: "برجاء ملء جميع الحقول", icon: "warning" });
      return;
    }

    setLoading(true); // تفعيل مؤشر التحميل
    try {
      const Res = await api.post("/users/login", {
        email: formData.email,
        password: formData.password
      });

      const Data = Res.data;

      if (Data.accessToken) {
        localStorage.setItem("token", Data.accessToken);

        if (Remember) {
          localStorage.setItem("remember", JSON.stringify(formData));
        }

        showAlert({
          title: Data?.message || "تم تسجيل الدخول بنجاح",
          icon: "success"
        });

        const decoded = jwtDecode(Data.accessToken);
        const role = decoded.role;
        if (role === "superadmin") {
          Navigate("/");
          
        } else if (role === "manager") {
          Navigate("/manager_dashboard");
          
        }
      }
    } catch (err) {
      showAlert({
        title: err.response?.data?.message || err?.data?.message || err?.message || "حدث خطأ في الاتصال بالخادم",
        icon: "error"
      });
    } finally {
      setLoading(false); // إيقاف مؤشر التحميل بعد الانتهاء
   await handleBackup();
    }
  };

  const rememberMe = (e) => {
    setRemember(e.target.checked);
  };

  return (
    // dir يبقى ltr على مستوى الحاوية الرئيسية عشان نتحكم في ترتيب "الصورة شمال / الفورم يمين"
    // وبعدين بنرجع rtl جوه قسم الفورم عشان النصوص العربية تفضل من اليمين
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden" dir="ltr">

      {/* القسم الشمال - الصورة، ياخد نص الشاشة بالكامل بدون فراغات */}
      <div className="md:w-1/2 w-full h-64 md:h-full bg-ligth/30 flex items-center justify-center">
        <img
          src={  settings?.icon?.url  ||logo}
          alt="شعار المعرض"
          className="w-full h-full object-cover"
        />
      </div>

      {/* القسم اليمين - حقول الإدخال، ياخد نص الشاشة بالكامل ومحتواه في النص */}
      <div
        className="md:w-1/2 w-full flex-1 flex items-center justify-center bg-white p-8 md:p-16"
        dir="rtl"
      >
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-dark mb-2">
              {settings?.factoryName || "نظام المعرض الرئيسي"}
            </h1>
            <p className="text-brown text-sm font-semibold">
              أدخل بياناتك للوصول إلى لوحة التحكم الخاص بك
            </p>
          </div>

          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            {/* البريد الإلكتروني */}
            <div className="space-y-2">
              <label className="text-xs font-black text-dark mr-1 flex items-center gap-1.5">
                <Mail size={14} className="text-brown" /> البريد الإلكتروني
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={OnChange}
                className="w-full px-4 py-3 bg-ligth/20 border border-brown/20 rounded-xl focus:border-brown focus:ring-1 focus:ring-brown outline-none font-bold text-sm text-dark transition-all"
                placeholder="example@factory.com"
              />
            </div>

            {/* كلمة المرور */}
            <div className="space-y-2">
              <label className="text-xs font-black text-dark mr-1 flex items-center gap-1.5">
                <Lock size={14} className="text-brown" /> كلمة المرور
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={OnChange}
                className="w-full px-4 py-3 bg-ligth/20 border border-brown/20 rounded-xl focus:border-brown focus:ring-1 focus:ring-brown outline-none font-bold text-sm text-dark transition-all"
                placeholder="••••••••"
              />
            </div>

            {/* التذكر واستعادة كلمة المرور */}
            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-dark font-bold">
                <input
                  type="checkbox"
                  onChange={rememberMe}
                  checked={Remember}
                  id="remember"
                  className="h-4 w-4 rounded border-brown/30 text-brown focus:ring-brown cursor-pointer"
                />
                تذكرني
              </label>

              <div
                onClick={() => Navigate("/forget-Password")}
                className="cursor-pointer text-brown hover:text-dark font-black text-xs transition-colors"
              >
                نسيت كلمة المرور؟
              </div>
            </div>

            {/* زر تسجيل الدخول مع علامة التحميل اللولبية */}
            <button
              type="button"
              disabled={loading}
              onClick={LoginProcess}
              className="w-full mt-4 py-3.5 bg-brown text-white rounded-xl font-black shadow hover:bg-brown/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  جاري التحقق من البيانات...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  تسجيل الدخول
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
