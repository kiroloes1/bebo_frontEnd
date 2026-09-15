import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { showAlert } from "../../services/alert";
import { 
  Cloud, 
  RefreshCcw, 
  ShieldCheck, 
  Settings, 
  Database, 
  Lock, 
  CheckCircle2, 
  Loader2,
  ExternalLink
} from "lucide-react";
import { isLastBackupValid } from '../../services/lastBackupNotification';

const BackupSettings = () => {
  const [loading, setLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState(new Date().toLocaleString("ar-EG") || null);
   const [lastBackupManual, setLastBackupManual] = useState(localStorage.getItem("lastBackup") ||(new Date().toLocaleString("ar-EG")));
   const [ isLastBackup , setIsLastBackup]=useState(true)
  const [loadingMan, setLoadingMan] = useState(false);
   const [googleAccount,setGoogleAccount]=useState({
    email:"",
    name:"",
    picture:""
   });
const handleGoogleAuth = () => {
const token = localStorage.getItem("token");
  const url = `https://bebo-system-backend.vercel.app/v1/auth/google?token=${token}`;
  
  const popup = window.open(
    url,
    "_blank",
    "width=500,height=600"
  );

  if (!popup) {
    alert("Allow popups to continue Google login");
  }
};


const handleManualBackup = async () => {

  setLoadingMan(true);

  try {

    const response = await api.get('/backupMaual');

    if (response.data.success) {

      // تحويل الداتا لملف JSON
      const dataStr = JSON.stringify(
        response.data.data,
        null,
        2
      );

      const blob = new Blob(
        [dataStr],
        { type: "application/json" }
      );

      // إنشاء لينك تحميل
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `backup-${Date.now()}.json`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);


      localStorage.setItem("lastBackup",new Date().toLocaleString("ar-EG"))


      setLastBackupManual(localStorage.getItem("lastBackup"));
      showAlert({
        title: "تم تنزيل النسخة الاحتياطية",
        text: "تم حفظ الملف على جهازك",
        icon: "success"
      });

    }

  } catch (error) {

    console.error(error);

    showAlert({
      title: "فشل النسخ الاحتياطي",
      text: "حدث خطأ أثناء التحميل",
      icon: "error"
    });

  } finally {

    setLoadingMan(false);

  }

};



const handleGoogleDriveBackup = async () => {
  setLoading(true); 
  
  try {
   
    const response = await api.get('/backup');

    if (response.data.success) {

      showAlert({
        title: "تم النسخ الاحتياطي!",
        text: "تم تحديث ملف البيانات بنجاح على Google Drive",
        icon: "success"
      });
      

    } else {
      throw new Error(response.data.error || "حدث خطأ غير متوقع");
    }

  } catch (err) {
    console.error("Backup Error:", err);
    

    showAlert({
      title: "فشل النسخ السحابي",
      text: err.response?.data?.error || "تأكد من ربط حساب جوجل أولاً ومن اتصال الإنترنت",
      icon: "error"
    });
  } finally {
    setLoading(false); 
  }
};

const lastUpdate=async()=>{
  try{
      const response = await api.get('/lastUpdate');

      setLastBackup(new Date(response.data.updatedAt).toLocaleString("ar-EG"))


  }catch(err){
 console.error("Backup Error:", err);
  }
}

const backupLocation=async()=>{
     try{
      const response = await api.get('/google-account');

      setGoogleAccount({
        email:response.data.email,
        name:response.data.name,
        picture:response.data.picture,

      })


  }catch(err){
 console.error("Backup Error:", err);
  }
}

const MakeSureIsLastBackup=async()=>{
  const res=  await isLastBackupValid();
  setIsLastBackup(res);

}
useEffect(()=>{
  lastUpdate();
  MakeSureIsLastBackup();
  backupLocation();

  
},[loading])

return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-800" dir="rtl">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-slate-900 rounded-xl text-white shadow-md">
          <Settings className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900">إعدادات النسخ الاحتياطي</h1>
          <p className="text-slate-500 font-medium text-sm">تأمين بيانات النظام وسجلات التجار</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Control Card */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Status Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Database size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-900">حالة البيانات</h3>
              </div>
              <span className={`flex items-center gap-1.5 font-bold text-sm px-3 py-1.5 rounded-full ${
                isLastBackup ? "text-emerald-700 bg-emerald-50 border border-emerald-200" : "text-amber-700 bg-amber-50 border border-amber-200"
              }`}>
                <ShieldCheck size={16} /> 
                { isLastBackup ? "النظام مؤمن" : "يجب عليك ربط الحساب" }
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-700 font-bold text-sm md:text-base">آخر نسخة احتياطية ناجحة على السحابة:</span>
                <span className="text-slate-900 font-black tabular-nums">{lastBackup}</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-700 font-bold text-sm md:text-base">آخر نسخة احتياطية ناجحة على الجهاز المحلي:</span>
                <span className="text-slate-900 font-black tabular-nums">{lastBackupManual}</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-700 font-bold text-sm md:text-base">مكان التخزين الحالي:</span>
                <span className="flex items-center gap-2 text-emerald-600 font-black dir-ltr text-left">
                  <Cloud size={18} />
                  <span>{googleAccount?.email ? `${googleAccount.email} | ${googleAccount.name}` : "غير متصل"}</span>
                </span>
              </div>

              {/* Google Drive Account Card */}
              {googleAccount?.picture && (
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 font-semibold mb-1">صورة الحساب المرتبط</span>
                    <span className="text-base font-black text-slate-900">{googleAccount.name || "Google Drive Account"}</span>
                  </div>
                  <img
                    src={googleAccount.picture}
                    alt="Google Account"
                    className="w-16 h-16 rounded-full border-2 border-white shadow-md object-cover"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleManualBackup}
                disabled={loadingMan}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white p-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {loadingMan ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCcw className="w-5 h-5" />}
                بدء النسخ الاحتياطي اليدوي الآن
              </button>

              <button 
                onClick={handleGoogleDriveBackup}
                disabled={loading}
                className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl font-black transition-all shadow-md ${
                  loading 
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري الرفع...
                  </>
                ) : (
                  <>
                    <Cloud className="w-5 h-5" />
                    بدء النسخ السحابي
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Backup Info Section */}
          <div className="space-y-6">
            {/* Manual Info */}
            <div className="bg-slate-900 text-white p-6 md:p-8 rounded-2xl shadow-lg relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black">النسخ اليدوي</h3>
                </div>
                
                <p className="text-slate-300 font-medium text-sm leading-relaxed max-w-lg">
                  عند الضغط على "تحميل البيانات"، سيتم استخراج نسخة فورية من قاعدة البيانات بصيغة 
                  <span className="text-amber-400 font-bold mx-1">JSON</span> 
                  وحفظها مباشرة على جهازك الشخصي.
                </p>
                
                <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-slate-300">
                  💡 ننصح بالاحتفاظ بآخر نسخة دائماً كإجراء احترازي إضافي.
                </div>
              </div>
              <Lock className="absolute -left-6 -bottom-6 w-32 h-32 text-white/5 group-hover:text-amber-500/10 transition-colors" />
            </div>

            {/* Cloud Info */}
            <div className="bg-slate-900 text-white p-6 md:p-8 rounded-2xl shadow-lg relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black">النسخ التلقائي (Cloud Backup)</h3>
                  </div>
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black text-[10px] px-2.5 py-1 rounded-md animate-pulse">
                    AUTOMATIC
                  </span>
                </div>

                <p className="text-slate-300 font-medium text-sm leading-relaxed mb-4">
                  النظام مؤمن برمجياً ليقوم بعمل نسخة احتياطية تلقائية يومياً في تمام الساعة:
                  <span className="text-amber-400 font-black mx-2 text-lg">06:00 مساءً</span>
                </p>

                <div className="space-y-2.5 bg-black/30 p-4 rounded-xl border border-white/10">
                  <p className="text-xs text-slate-200">
                    • يجب ربط النظام بـ <span className="text-emerald-400 font-bold">Google Drive</span> لتفعيل الحفظ السحابي.
                  </p>
                  <p className="text-xs text-slate-200">
                    • اسم الملف: <code className="bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-mono">elmokharaz.json</code>
                  </p>
                  <p className="text-xs text-slate-200">
                    • <span className="text-amber-400 font-bold">ميزة الذكاء:</span> لا داعي لمسح الملفات القديمة، النظام يقوم بتحديث نفس الملف تلقائياً لتوفير المساحة.
                  </p>
                </div>
              </div>
              <Cloud className="absolute -left-6 -bottom-6 w-32 h-32 text-white/5 group-hover:text-emerald-500/10 transition-colors" />
            </div>
          </div>
        </div>

        {/* Side Panel - Google Connection */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" 
                alt="Google Drive" 
                className="w-10 h-10"
              />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">ربط الحساب</h3>
            <p className="text-slate-500 text-sm font-medium mb-6">
              يجب ربط النظام بحساب جوجل لتتمكن من رفع النسخ الاحتياطية.
            </p>
            
            <button 
              onClick={handleGoogleAuth}
              className="w-full bg-white border-2 border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white p-3 rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <ExternalLink size={18} /> ربط Google Drive
            </button>
            
            <p className="mt-4 text-[11px] text-slate-400 font-medium">
              * سيتم حفظ الـ Token في قاعدة البيانات لتسهيل الوصول المستقبلي.
            </p>
          </div>

          {/* Notice Cards */}
          <div className="bg-amber-500/10 p-6 rounded-2xl border border-amber-500/20">
            <h4 className="text-amber-800 font-black mb-2 flex items-center gap-2">
              ⚠️ تنبيه هام
            </h4>
            <p className="text-slate-700 text-xs font-bold leading-relaxed">
              في حالة الدخول على هذه الصفحة ولم تجد تحديثاً للبيانات لمدة تزيد عن يوم كامل، فيجب عليك الضغط على زر 
              <span 
                onClick={handleGoogleAuth} 
                title='تجديد الوصول الآن' 
                className='underline font-extrabold text-amber-700 hover:text-amber-900 mx-1 cursor-pointer'
              >
                Google Drive
              </span> 
              لتجديد الوصول.
            </p>
          </div>

          <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200">
            <h4 className="text-slate-800 font-black mb-2 flex items-center gap-2">
              🔒 تنبيه أمان
            </h4>
            <p className="text-slate-600 text-xs font-medium leading-relaxed">
              يرجى الاحتفاظ ببيانات الحساب المرتبط بعيداً عن الأشخاص غير المخولين. النسخة الاحتياطية تحتوي على كامل بيانات التجار، الأصناف، والماليات.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BackupSettings;