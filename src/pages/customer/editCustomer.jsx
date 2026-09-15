import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { showAlert } from "../../services/alert";
import { User, Phone, FileText, Save, Loader2, Edit, Layout, ArrowRight } from "lucide-react";

const EditCustomer = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", phone: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const res = await api.get(`/customers/${id}`);
        const { name, phone, notes } = res.data.data;
        setForm({ name: name || "", phone: phone || "", notes: notes || "" });
      } catch (err) {
        showAlert({ title: "فشل في تحميل بيانات العيمل", icon: "error" });
      } finally {
        setFetching(false);
      }
    };
    fetchSupplier();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/customers/${id}`, form);
      showAlert({ title: "تم تحديث البيانات بنجاح", icon: "success" });
      navigate("/customer");
    } catch (err) {
      showAlert({ title: "حدث خطأ أثناء التعديل", icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="flex justify-center items-center min-h-[400px]">
      <Loader2 className="w-12 h-12 animate-spin text-accent" />
    </div>
  );

  return (
    <div className=" px-4 lg:px-8 my-6" dir="rtl">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden w-full">
        
        {/* Header Section */}
        <div className="bg-dark p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32  rounded-full -ml-16 -mt-16" />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent rounded-xl shadow-lg shadow-accent/20 text-white">
                <Edit size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black">تعديل بيانات العيمل</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-[2px] mt-1">
                  تعديل البيانات الخاصه بالعيمل 
                </p>
              </div>
            </div>
            <Layout className="opacity-10 hidden md:block" size={48} />
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 lg:p-12 space-y-8 ">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Name Field */}
            <div className="space-y-3">
              <label className="text-sm font-black text-dark flex items-center gap-2 mr-1">
                <User size={18} className="text-accent" /> اسم العيمل الكامل
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full p-4 bg-white border border-slate-500 rounded-xl focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all font-bold text-lg text-dark"
                required
              />
            </div>

            {/* Phone Field */}
            <div className="space-y-3">
              <label className="text-sm font-black text-dark flex items-center gap-2 mr-1">
                <Phone size={18} className="text-accent" /> رقم التواصل الرئيسي
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full p-4 bg-white border border-slate-500 rounded-xl focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all font-black text-lg tracking-widest text-dark"
              />
            </div>
          </div>

          {/* Notes Field */}
          <div className="space-y-3">
            <label className="text-sm font-black text-dark flex items-center gap-2 mr-1">
              <FileText size={18} className="text-accent" /> ملاحظات إضافية
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full p-4 bg-white border border-slate-500 rounded-xl focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all font-medium text-brown min-h-[150px] text-lg"
            />
          </div>

          {/* Action Footer */}
          <div className="pt-6 border-t border-slate-500 flex flex-col md:flex-row justify-between items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/customer")}
              className="flex items-center gap-2 text-slate-400 font-bold hover:text-red-500 transition-colors"
            >
              <ArrowRight size={20} /> إلغاء والتراجع
            </button>

            <button
              type="submit"
              disabled={loading}
              className={`min-w-[250px] py-4 rounded-xl font-black text-white transition-all flex items-center justify-center gap-3 shadow-lg shadow-accent/20 active:scale-95 ${
                loading ? "bg-slate-400 cursor-not-allowed" : "bg-accent hover:opacity-90"
              }`}
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Save size={22} />
                  <span className="text-lg">حفظ التغييرات الآن</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCustomer;