import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineMail, HiOutlineArrowRight } from "react-icons/hi"; // تم تغيير السهم لليمين ليتناسب مع الاتجاه العربي
import { Loader2 } from "lucide-react"; // أيقونة التحميل المتناسقة
import api from "../../services/api";
import { showAlert } from "../../services/alert";
import logo from "../../../public/login.jpg";

export default function ForgetPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  async function forgetPassword(e) {
    e.preventDefault();

    try {
      setLoading(true);

      await api.put("/users/forgot-password", {
        email: email,
      });

      setSent(true);
      showAlert({
        title: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني",
        icon: "success"
      });
  
      setTimeout(() => {
        navigate("/reset-password");
      }, 400);

    } catch (err) {
      showAlert({
        title: err.response?.data?.message || "حدث خطأ، حاول مرة أخرى",
        icon: "error"
      });
      
    } {
      setLoading(false);
    }
  }

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-ligth/40 p-4 font-['Cairo']">

      <div className="bg-white rounded-2xl border border-brwonLight shadow-xl flex flex-col md:flex-row w-full max-w-4xl overflow-hidden min-h-[550px]">

        {/* القسم الأيمن - الصورة والخلفية المتناسقة */}
        <div className="md:w-1/2 bg-ligth/30 flex items-center justify-center p-8 border-l border-brwonLight hidden md:flex">
          <img
            src={logo}
            alt="شعار الالمعرض"
            className="w-4/5 h-auto max-h-[400px] object-contain drop-shadow-md"
          />
        </div>

        {/* القسم الأيسر - الفورم */}
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
              <HiOutlineMail className="w-6 h-6 text-brown" />
            </div>
            <h1 className="text-2xl font-black text-dark">
              نسيت كلمة المرور؟
            </h1>
            <p className="text-brown text-sm font-semibold mt-2">
              أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور
            </p>
          </div>

          {/* حقل الإدخال والزر */}
          {!sent && (
            <form onSubmit={forgetPassword} className="space-y-4">

              <div className="space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="أدخل بريدك الإلكتروني المعتمد"
                  required
                  className="w-full px-4 py-3 bg-ligth/20 border border-brown/20 rounded-xl focus:border-brown focus:ring-1 focus:ring-brown outline-none font-bold text-sm text-dark text-right transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-brown text-white rounded-xl font-black shadow hover:bg-brown/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70 text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    جاري إرسال الرابط...
                  </>
                ) : (
                  "إرسال رابط إعادة التعيين"
                )}
              </button>

            </form>
          )}

          {/* الفوتر الأسفل */}
          <p className="text-center text-xs text-brown font-bold mt-6">
            تذكرت كلمة المرور؟{" "}
            <Link to="/login" className="text-dark font-black hover:underline">
              تسجيل الدخول من هنا
            </Link>
          </p>

        </div>

      </div>
    </div>
  );
}