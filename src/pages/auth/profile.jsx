import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Shield, Edit3, Save, X, Loader2, 
  UserCheck, Phone, Plus, Trash2, KeyRound, Lock, AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import { showAlert } from '../../services/alert';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', notes: '', phone: [] });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);
  const [passSaving, setPassSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/admins/profile`);
      const data = response.data.admin;
      setAdmin(data);
      setFormData({
        username: data.username,
        email: data.email,
        notes: data.notes || '',
        phone: data.phone || []
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await api.patch(`/admins/${admin._id}`, formData);
      setAdmin(response.data.admin);
      setIsEditing(false);
      showAlert({ title: "تم تحديث البيانات بنجاح", icon: "success" });
    } catch (err) {
      showAlert({ title: err.response?.data?.message || "فشل تحديث البيانات", icon: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPassSaving(true);
    try {
      await api.put('/users/update-password', passwordData);
      showAlert({ title: "تم تغيير كلمة المرور بنجاح، يرجى تسجيل الدخول مجدداً", icon: "success" });
      setIsPassModalOpen(false);
      setPasswordData({ currentPassword: '', newPassword: '' });
      navigate("/login");
    } catch (err) {
      showAlert({ title: err.response?.data?.message || "فشل تحديث البيانات", icon: "error" });
    } finally {
      setPassSaving(false);
    }
  };

  const addPhoneField = () => setFormData({ ...formData, phone: [...formData.phone, ''] });
  const removePhoneField = (index) => {
    const newPhones = formData.phone.filter((_, i) => i !== index);
    setFormData({ ...formData, phone: newPhones });
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-ligth/30">
      <div className="text-center space-y-4">
        <Loader2 className="animate-spin text-brown mx-auto" size={48} />
        <p className="font-black text-dark/75">جاري تحميل الملف الشخصي...</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto p-4 md:p-8  text-right space-y-10 min-h-screen " dir="rtl">
      
      {/* 🔹 Header Section */}
      <div className="relative">
        {/* خلفية الهيدر باللون الداكن المعتمد */}
        <div className="h-48 md:h-64 bg-dark rounded-2xl shadow-md overflow-hidden relative">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          {/* لمسة البني الديكورية */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brown/20 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        </div>
        
        <div className="absolute -bottom-16 right-8 md:right-16 flex flex-col md:flex-row items-center md:items-end gap-6">
          <div className="relative group">
            <div className="w-32 h-32 md:w-44 md:h-44 bg-white rounded-2xl p-2 shadow-md border border-dotted-4 border border-dotted-white overflow-hidden">
              <div className="w-full h-full bg-ligth rounded-xl flex items-center justify-center text-slate-300">
                <User size={80} strokeWidth={1} className="text-dark/20" />
              </div>
            </div>
            {/* مؤشر الحالة بلون السمة البني والبيج */}
            <div className="absolute bottom-2 right-2 w-8 h-8 bg-brown border border-dotted-4 border border-dotted-white rounded-full"></div>
          </div>
          
          <div className="pb-4 text-center md:text-right">
            <h1 className="text-2xl md:text-3xl font-extrabold text-ligth bg-dark  rounded-full p-5 drop-shadow-sm">{admin.username}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
              <span className="bg-brown text-ligth px-4 py-1 rounded-xl text-xs font-black shadow-lg shadow-brown/20">
                {admin.role === 'superadmin' ? 'مدير النظام' : 'مشرف'}
              </span>
              {admin.isVerified && (
                <span className="bg-brown/10 text-brown px-3 py-1 rounded-xl text-[10px] font-black border border-dotted border border-dotted-brown/20 flex items-center gap-1">
                  <UserCheck size={14}/> موثق
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-12">
        
        {/* 🔹 Column Left: Security & Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-dotted border border-dotted-brown/10">
            <h3 className="font-black text-dark mb-6 flex items-center gap-2">
              <Shield size={20} className="text-brown" /> أمان الحساب
            </h3>
            <div className="space-y-3">
              <StatusItem label="تاريخ الانضمام" value={new Date(admin.createdAt).toLocaleDateString('ar-EG')} />
              <StatusItem label="آخر نشاط" value={admin.lastLogin ? new Date(admin.lastLogin).toLocaleTimeString('ar-EG') : 'الآن'} />
            </div>
            
            <button 
              onClick={() => setIsPassModalOpen(true)}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-dark text-ligth p-4 rounded-xl font-black hover:bg-brown hover:text-dark transition-all duration-300 shadow-md"
            >
              <KeyRound size={18} /> تغيير كلمة المرور
            </button>
          </div>
        </div>

        {/* 🔹 Column Right: Edit Fields */}
        <div className="lg:col-span-8">
          <form onSubmit={handleUpdate} className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-dotted border border-dotted-brown/10 space-y-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <h2 className="text-2xl font-black text-dark">المعلومات الشخصية</h2>
              {!isEditing ? (
                <button 
                  type="button" 
                  onClick={() => setIsEditing(true)} 
                  className="flex items-center gap-2 bg-ligth text-brown px-6 py-3 rounded-xl font-black hover:bg-brown hover:text-dark transition-all border border-dotted border border-dotted-brown/25"
                >
                  <Edit3 size={18} /> تعديل الحساب
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    type="submit" 
                    disabled={saving} 
                    className="flex items-center gap-2 bg-brown text-dark px-6 py-3 rounded-xl font-black shadow-md hover:bg-dark hover:text-ligth transition-all disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />} حفظ التغييرات
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsEditing(false)} 
                    className="bg-ligth text-dark/70 px-6 py-3 rounded-xl font-black hover:bg-ligth/80 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputGroup 
                label="اسم المستخدم" 
                icon={<User size={18} className="text-brown"/>} 
                value={formData.username} 
                disabled={!isEditing} 
                onChange={(e) => setFormData({...formData, username: e.target.value})} 
              />
              <InputGroup 
                label="البريد الإلكتروني" 
                icon={<Mail size={18} className="text-brown"/>} 
                value={formData.email} 
                disabled={!isEditing} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
              />
            </div>

            {/* Phone Numbers */}
            {/* <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-black text-dark/60 flex items-center gap-2">
                  <Phone size={18} className="text-brown"/> أرقام التواصل
                </label>
                {isEditing && (
                  <button 
                    type="button" 
                    onClick={addPhoneField} 
                    className="bg-brown/10 text-brown p-2 rounded-lg hover:bg-brown hover:text-dark transition-all"
                  >
                    <Plus size={16}/>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.phone.map((num, index) => (
                  <div key={index} className="relative group">
                    <input 
                      type="tel" 
                      value={num} 
                      disabled={!isEditing}
                      onChange={(e) => {
                        const newPhones = [...formData.phone];
                        newPhones[index] = e.target.value;
                        setFormData({...formData, phone: newPhones});
                      }}
                      className="w-full h-14 bg-ligth/30 border border-dotted-2 border border-dotted-transparent rounded-xl px-5 font-bold text-dark focus:border border-dotted-brown/30 focus:bg-white transition-all outline-none"
                      placeholder="01XXXXXXXXX"
                    />
                    {isEditing && (
                      <button 
                        type="button" 
                        onClick={() => removePhoneField(index)} 
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={18}/>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div> */}

            {/* Notes Section */}
            <div className="space-y-3">
              <label className="text-sm font-black text-dark/60 mr-2">نبذة شخصية / ملاحظات</label>
              <textarea 
                rows="3" 
                disabled={!isEditing} 
                value={formData.notes} 
                onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                className="w-full bg-ligth/30 border border-dotted-2 border border-dotted-transparent rounded-2xl p-5 text-dark font-bold focus:border border-dotted-brown/30 focus:bg-white outline-none transition-all resize-none"
                placeholder="اكتب شيئاً عنك..."
              />
            </div>
          </form>
        </div>
      </div>

      {/* 🔹 Password Change Modal */}
      {isPassModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark/60 backdrop-blur-sm" onClick={() => setIsPassModalOpen(false)}></div>
          <form onSubmit={handlePasswordUpdate} className="relative bg-white w-full max-w-md rounded-2xl p-8 shadow-lg space-y-6 border border-dotted border border-dotted-brown/10">
            <div className="flex justify-between items-center border border-dotted-b border border-dotted-brown/10 pb-4">
              <h3 className="text-xl font-black text-dark flex items-center gap-2">
                <Lock className="text-brown" /> تحديث الأمان
              </h3>
              <button type="button" onClick={() => setIsPassModalOpen(false)} className="text-dark/50 hover:rotate-90 transition-all">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-dark/60 mr-2">كلمة المرور الحالية</label>
                <input 
                  required
                  type="password" 
                  className="w-full h-14 bg-ligth/30 rounded-xl px-5 outline-none focus:ring-2 focus:ring-brown/25 font-bold text-dark"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-dark/60 mr-2">كلمة المرور الجديدة</label>
                <input 
                  required
                  type="password" 
                  className="w-full h-14 bg-ligth/30 rounded-xl px-5 outline-none focus:ring-2 focus:ring-brown/25 font-bold text-dark"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                />
              </div>
            </div>

            <div className="bg-brown/5 p-4 rounded-xl flex items-start gap-3 border border-dotted border border-dotted-brown/10">
              <AlertCircle className="text-brown shrink-0" size={18} />
              <p className="text-[10px] font-bold text-brown leading-relaxed">
                لحماية حسابك، سيتم تسجيل الخروج من جميع المتصفحات الأخرى بعد تغيير كلمة المرور مباشرة.
              </p>
            </div>

            <button 
              disabled={passSaving}
              type="submit" 
              className="w-full h-14 bg-dark text-ligth rounded-xl font-black shadow-md flex items-center justify-center gap-2 hover:bg-brown hover:text-dark transition-all duration-300"
            >
              {passSaving ? <Loader2 className="animate-spin" /> : "تأكيد التحديث"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const InputGroup = ({ label, icon, value, disabled, onChange }) => (
  <div className="space-y-2">
    <label className="text-xs font-black text-dark/60 flex items-center gap-2 px-1">
      {icon} {label}
    </label>
    <input 
      type="text" 
      value={value} 
      onChange={onChange} 
      disabled={disabled} 
      className="w-full h-14 bg-ligth/30 border border-dotted-2 border border-dotted-transparent rounded-xl px-5 text-dark font-bold focus:border border-dotted-brown/30 focus:bg-white transition-all outline-none disabled:opacity-50"
    />
  </div>
);

const StatusItem = ({ label, value, color = "text-dark" }) => (
  <div className="flex justify-between items-center p-4 bg-ligth/20 rounded-xl border border-dotted border border-dotted-brown/10">
    <span className="text-[10px] font-black text-dark/50 uppercase tracking-widest">{label}</span>
    <span className={`text-xs font-black ${color}`}>{value}</span>
  </div>
);

export default Profile;