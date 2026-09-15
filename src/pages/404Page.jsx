import { Link } from "react-router-dom";
import { Hammer, PackageSearch, Factory, ArrowRight, RefreshCcw } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-light p-6 text-center font-sans relative overflow-hidden" dir="rtl">
      
      {/* عناصر ديكورية خلفية (بلاستيكات متناثرة) */}
      <div className="absolute top-20 right-10 text-9xl opacity-5 select-none animate-bounce">📦</div>
      <div className="absolute bottom-20 left-10 text-9xl opacity-5 select-none animate-pulse">⚙️</div>

      {/* Icon: Factory & Search */}
      <div className="mb-8 relative">
        <div className="bg-orange-100 w-32 h-32 rounded-[40px] flex items-center justify-center relative z-10 shadow-xl shadow-orange-500/10">
          <Factory size={64} className="text-dark" />
        </div>
        <div className="absolute -bottom-4 -right-4 bg-dark p-4 rounded-2xl shadow-lg border-4 border-white z-20">
          <PackageSearch size={32} className="text-white" />
        </div>
      </div>

      <h1 className="text-9xl font-black text-dark mb-2 tracking-tighter opacity-90">
        404
      </h1>


      <p className="text-slate-500 mb-10 max-w-md leading-relaxed font-bold">
        يبدو أن الصفحة التي تحاول الوصول إليها قد تم نقلها، حذفها، أو أنها لم تخرج من خط الإنتاج بعد. دعنا نعيدك إلى ساحة العمل الرئيسية.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-none justify-center">

        
        <Link
          to="/"
          className="bg-white text-dark border-2 border-dark px-10 py-4 rounded-[20px] font-black text-lg hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          الرئيسية <ArrowRight size={20} className="rotate-180" />
        </Link>
      </div>


    </div>
  );
}