import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { HiOutlineLockClosed, HiOutlineArrowRight } from "react-icons/hi"; // تعديل السهم لليمين ليتناسب مع الواجهة العربية
import { Loader2 } from "lucide-react"; // إضافة أيقونة التحميل المتناسقة
import api from "../../services/api";
import { showAlert } from "../../services/alert";
import logo from "../../../public/login.jpg";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function resetPassword(e) {
    e.preventDefault();

    try {
      setLoading(true);

      await api.put("/users/reset-password", {
        email,
        resetCode,
        newPassword
      });

      setSuccess(true);
      showAlert({
        title: "تم تغيير كلمة المرور بنجاح، جاري التحويل لتسجيل الدخول...",
        icon: "success"
      });

      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (err) {
      showAlert({
        title: err.response?.data?.message || "حدث خطأ، حاول مرة أخرى",
        icon: "error"
      }); 
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-ligth/40 p-4 font-['Cairo']">

      <div className="bg-white rounded-2xl border border-brwonLight shadow-xl flex flex-col md:flex-row w-full max-w-4xl overflow-hidden min-h-[550px]">

        {/* القسم الأيمن - الصورة والخلفية المعتمدة */}
        <div className="md:w-1/2 bg-ligth/30 flex items-center justify-center p-8 border-l border-brwonLight hidden md:flex">
          <img
            src={logo}
            alt="شعار المعرض"
            className="w-4/5 h-auto max-h-[400px] object-contain drop-shadow-md"
          />
        </div>

        {/* القسم الأيسر - الفورم حقول الإدخال */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">

          {/* زر الرجوع */}
          <Link 
            to="/login" 
            className="flex items-center gap-2 text-brown hover:text-dark mb-6 text-xs font-black transition-colors"
          >
            <HiOutlineArrowRight className="w-4 h-4" />
            العودة لتسجيل الدخول
          </Link>

          {/* العنوان والأيقونة التجميلية */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-ligth rounded-full flex items-center justify-center mx-auto mb-3 border border-brown/10">
              <HiOutlineLockClosed className="w-6 h-6 text-brown" />
            </div>
            <h1 className="text-2xl font-black text-dark">
              إعادة تعيين كلمة المرور
            </h1>
            <p className="text-brown text-sm font-semibold mt-2">
              أدخل الكود المرسل إلى بريدك وكلمة المرور الجديدة لإتمام العملية
            </p>
          </div>

          {/* حقول الإدخال */}
          {!success && (
            <form onSubmit={resetPassword} className="space-y-4">

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="البريد الإلكتروني المعتمد"
                required
                className="w-full px-4 py-3 bg-ligth/20 border border-brown/20 rounded-xl focus:border-brown focus:ring-1 focus:ring-brown outline-none font-bold text-sm text-dark text-right transition-all"
              />

              <input
                type="text"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                placeholder="كود التحقق (6 أرقام)"
                maxLength="6"
                required
                className="w-full px-4 py-3 bg-ligth/20 border border-brown/20 rounded-xl focus:border-brown focus:ring-1 focus:ring-brown outline-none font-bold text-sm text-dark text-right tracking-widest transition-all"
              />

              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="كلمة المرور الجديدة (8 أحرف على الأقل)"
                required
                minLength="8"
                className="w-full px-4 py-3 bg-ligth/20 border border-brown/20 rounded-xl focus:border-brown focus:ring-1 focus:ring-brown outline-none font-bold text-sm text-dark text-right transition-all"
              />

              {/* زر الحفظ مع مؤشر التحميل المتناسق */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-brown text-white rounded-xl font-black shadow hover:bg-brown/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70 text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    جاري التحديث...
                  </>
                ) : (
                  "تغيير كلمة المرور"
                )}
              </button>

            </form>
          )}

          {/* فوتر إعادة الإرسال */}
          <div className="mt-6 text-center">
            <p className="text-xs text-brown font-bold">
              لم يصلك كود التحقق؟{" "}
              <Link to="/forget-password" className="text-dark font-black hover:underline">
                إعادة الإرسال من هنا
              </Link>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}