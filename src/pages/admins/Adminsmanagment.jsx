import React, { useEffect, useState } from "react";
import { 
  Users, Trash2, Shield, 
  CheckCircle2, XCircle, Search, 
  Loader2 
} from "lucide-react";
import api from "../../services/api";
import { showAlert } from "../../services/alert";
import { showAlertConfirm } from "../../services/alertConfirm";
import { getCurrentUser } from "../../services/getCurrentUser";

const ManageAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // جلب البيانات من السيرفر
  const fetchAdmins = async () => {
    try {
      const res = await api.get("/admins"); 
      setAdmins(res.data.admins || res.data.data);
    } catch (err) {
      showAlert({ title: "فشل تحميل البيانات", icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  const currentUser = getCurrentUser();

  useEffect(() => { fetchAdmins(); }, []);

  // تفعيل أو تعطيل الحساب
  const handleToggleActive = async (id) => {
    try {
      await api.patch(`/admins/${id}/toggle-active`);
      fetchAdmins();
      showAlert({ title: "تم تغيير حالة الحساب", icon: "success" });
    } catch (err) {
      showAlert({ title: "فشل الإجراء", icon: "error" });
    }
  };

  // حذف الأدمن
  const handleDelete = async (id, name) => {
    const confirm = await showAlertConfirm({
      title: `حذف ${name}?`,
      text: "لا يمكن التراجع عن هذا الإجراء!",
      icon: "warning"
    });

    if (confirm.isConfirmed) {
      try {
        await api.delete(`/admins/${id}`);
        setAdmins(admins.filter(a => a._id !== id));
        showAlert({ title: "تم الحذف", icon: "success" });
      } catch (err) {
        showAlert({ title: "فشل الحذف", icon: "error" });
      }
    }
  };

  // تغيير الدور (Role)
  const handleChangeRole = async (id, newRole) => {
    try {
      await api.patch(`/admins/changeRole/${id}`, { role: newRole });
      fetchAdmins();
      showAlert({ title: "تم تحديث الصلاحية", icon: "success" });
    } catch (err) {
      showAlert({ title: "فشل التحديث", icon: "error" });
    }
  };

  const filteredAdmins = admins.filter(a => 
    a.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="font-['Cairo'] h-96 flex items-center justify-center">
      <Loader2 className="animate-spin text-brown" size={40} />
    </div>
  );

  return (
    <div className="font-['Cairo'] max-w-[100vw] min-h-screen mx-auto p-4 md:p-8 space-y-6 text-right" dir="rtl">
      
      {/* Header & Search Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-brown/10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brown/10 flex items-center justify-center text-brown">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-dark flex items-center gap-2">
              إدارة المشرفين
            </h2>
            <p className="text-dark/50 text-xs sm:text-sm font-bold mt-0.5">التحكم في صلاحيات وحالات حسابات النظام</p>
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/40" size={18} />
          <input
            type="text"
            placeholder="بحث بالاسم أو البريد..."
            className="w-full pr-10 pl-4 py-3.5 bg-ligth/30 border-2 border-transparent rounded-xl focus:border-brown/30 focus:bg-white outline-none transition-all text-sm font-bold text-dark"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-brown/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-dark text-ligth">
                <th className="p-5 text-xs font-black uppercase tracking-wider">المشرف</th>
                <th className="p-5 text-xs font-black uppercase tracking-wider">البريد الإلكتروني</th>
                <th className="p-5 text-xs font-black uppercase tracking-wider">الصلاحية</th>
                <th className="p-5 text-xs font-black uppercase tracking-wider text-center">الحالة</th>
                <th className="p-5 text-xs font-black uppercase tracking-wider text-center">الملاحظات</th>
                <th className="p-5 text-xs font-black uppercase tracking-wider text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brown/10">
              {filteredAdmins.map((admin) => (
                <tr key={admin._id} className="hover:bg-ligth/20 transition-colors group">
                  
                  {/* المشرف */}
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-brown text-dark rounded-xl flex items-center justify-center font-black shadow-sm transition-colors group-hover:bg-dark group-hover:text-ligth">
                        {admin.username[0].toUpperCase()}
                      </div>
                      <span className="font-extrabold text-dark text-sm">{admin.username}</span>
                    </div>
                  </td>

                  {/* البريد */}
                  <td className="p-5 text-sm font-bold text-dark/60">
                    {admin.email}
                  </td>

                  {/* الصلاحية (Role Selection) */}
                  <td className="p-5">
                    <select 
                      value={admin.role}
                      onChange={(e) => handleChangeRole(admin._id, e.target.value)}
                      className="bg-ligth/50 border-2 border-transparent text-[12px] font-black text-dark rounded-xl px-3 py-2 outline-none cursor-pointer focus:border-brown/30 transition-all appearance-none"
                    >
                      <option value="superadmin">سوبر أدمن</option>
                    </select>
                  </td>

                  {/* الحالة */}
                  <td className="p-5 text-center">
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[11px] font-black ${admin.isVerified !== false ? 'bg-brown/10 text-brown' : 'bg-red-50 text-red-600'}`}>
                      <span className={`w-2 h-2 rounded-full ml-2 animate-pulse ${admin.isVerified !== false ? 'bg-brown' : 'bg-red-500'}`}></span>
                      {admin.isVerified !== false ? 'نشط' : 'معطل'}
                    </span>
                  </td>

                  {/* الملاحظات */}
                  <td className="p-5 text-center">
                    <span className="text-xs font-bold text-dark/70 bg-ligth/40 px-3 py-1 rounded-lg border border-brown/5">
                      {admin.notes || "لا يوجد ملاحظات"}
                    </span>
                  </td>

                  {/* الإجراءات */}
                  <td className="p-5">
                    <div className="flex items-center justify-center gap-3">
                      {currentUser.userId !== admin._id && currentUser.role === "superadmin" && (
                        <button 
                          onClick={() => handleToggleActive(admin._id)}
                          className={`p-2.5 rounded-xl transition-all shadow-sm border ${admin.isVerified !== false ? 'bg-white border-brown/40 text-brown hover:bg-brown hover:text-dark' : 'bg-white border-dark/40 text-dark hover:bg-dark hover:text-ligth'}`}
                          title={admin.isVerified !== false ? "تعطيل الحساب" : "تفعيل الحساب"}
                        >
                          {admin.isVerified !== false ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                        </button>
                      )}
                      
                      {currentUser.userId !== admin._id && currentUser.role === "superadmin" && (
                        <button 
                          onClick={() => handleDelete(admin._id, admin.username)}
                          className="p-2.5 bg-white border border-red-200 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm"
                          title="حذف نهائي"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* الـ Scrollbar الخاص بالجدول متوافق مع درجات البني */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #8B5E3C; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ManageAdmins;