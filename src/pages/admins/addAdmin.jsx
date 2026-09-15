import React, { useState } from "react";
import { UserPlus, Mail, Lock, ShieldCheck, FileText, Loader2 } from "lucide-react";
import api from "../../services/api";
import { showAlert } from "../../services/alert";

const AddAdmin = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "superadmin",
    notes: ""
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/admins/", formData);
      showAlert({ title: "تم إضافة المشرف بنجاح", icon: "success" });
      setFormData({ username: "", email: "", password: "", role: "superadmin", notes: "" });
    } catch (err) {
      showAlert({ 
        title: "فشل الإضافة", 
        text: err.response?.data?.message || "حدث خطأ ما", 
        icon: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-10 bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-brown/10 font-['Cairo'] text-right" dir="rtl">
      
      {/* الهيدر والعنوان الإرشادي */}
      <div className="flex items-center gap-5 mb-10">
        <div className="w-14 h-14 bg-brown rounded-2xl flex items-center justify-center text-dark shadow-md shadow-brown/20">
          <UserPlus size={26} />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-dark">إضافة مشرف جديد</h2>
          <p className="text-xs sm:text-sm text-dark/50 font-bold mt-0.5">قم بإنشاء حساب جديد وتحديد صلاحياته في النظام</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        
        {/* اسم المستخدم */}
        <div className="space-y-2">
          <label className="text-xs font-black text-dark/60 mr-1 uppercase tracking-wide">اسم المستخدم</label>
          <div className="relative">
            <UserPlus className="absolute right-4 top-1/2 -translate-y-1/2 text-dark/40" size={18} />
            <input
              type="text"
              name="username"
              required
              value={formData.username}
              onChange={handleChange}
              placeholder="مثلاً: ahmed_ali"
              className="w-full pr-12 pl-4 py-4 bg-ligth/30 border-2 border-transparent rounded-xl focus:border-brown/30 focus:bg-white outline-none transition-all text-sm font-bold text-dark"
            />
          </div>
        </div>

        {/* البريد الإلكتروني */}
        <div className="space-y-2">
          <label className="text-xs font-black text-dark/60 mr-1 uppercase tracking-wide">البريد الإلكتروني</label>
          <div className="relative">
            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-dark/40" size={18} />
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="example@mail.com"
              className="w-full pr-12 pl-4 py-4 bg-ligth/30 border-2 border-transparent rounded-xl focus:border-brown/30 focus:bg-white outline-none transition-all text-sm font-bold text-dark"
            />
          </div>
        </div>

        {/* كلمة المرور */}
        <div className="space-y-2">
          <label className="text-xs font-black text-dark/60 mr-1 uppercase tracking-wide">كلمة المرور</label>
          <div className="relative">
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-dark/40" size={18} />
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full pr-12 pl-4 py-4 bg-ligth/30 border-2 border-transparent rounded-xl focus:border-brown/30 focus:bg-white outline-none transition-all text-sm font-bold text-dark"
            />
          </div>
        </div>

        {/* صلاحية المستخدم */}
        <div className="space-y-2">
          <label className="text-xs font-black text-dark/60 mr-1 uppercase tracking-wide">صلاحية المستخدم</label>
          <div className="relative">
            <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 text-dark/40" size={18} />
            <select
              name="role"
              disabled={true}
              value={formData.role}
              onChange={handleChange}
              className="w-full pr-12 pl-4 py-4 bg-ligth/20 border-2 border-transparent rounded-xl focus:border-brown/30 focus:bg-white outline-none transition-all text-sm font-black text-dark/50 appearance-none cursor-not-allowed"
            >
              <option value="superadmin">مدير نظام</option>
            </select>
          </div>
        </div>

        {/* ملاحظات إضافية */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-black text-dark/60 mr-1 uppercase tracking-wide">ملاحظات إضافية</label>
          <div className="relative">
            <FileText className="absolute right-4 top-4 text-dark/40" size={18} />
            <textarea
              name="notes"
              rows="3"
              value={formData.notes}
              onChange={handleChange}
              placeholder="اكتب أي ملاحظات إضافية هنا..."
              className="w-full pr-12 pl-4 py-4 bg-ligth/30 border-2 border-transparent rounded-xl focus:border-brown/30 focus:bg-white outline-none transition-all text-sm font-bold text-dark resize-none"
            />
          </div>
        </div>

        {/* زر الإرسال والحفظ */}
        <button
          type="submit"
          disabled={loading}
          className="md:col-span-2 w-full py-4 bg-dark text-ligth rounded-xl font-black text-base shadow-md hover:bg-brown hover:text-dark transition-all duration-300 flex items-center justify-center gap-3 mt-4 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              <UserPlus size={20} />
              <span>تأكيد وإنشاء الحساب</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default AddAdmin;