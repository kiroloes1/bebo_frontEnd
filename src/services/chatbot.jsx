import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Sparkles, Cpu, Wrench, X, MessageSquare, ChevronDown } from "lucide-react";
import api from "./api";

const ReportsAiChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "أهلاً بك! أنا المساعد الذكي للتقارير الشاملة. يمكنني إجابتك عن الموردين، العملاء، صيانة المعدات، مشتريات الأكياس والسلك، الشيكات ونشاط المستخدمين.",
      timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, isOpen]);

  // دالة مساعدة لاستخراج اسم العنصر مهما كان نوع الموديل
  const getItemName = (item) => {
    if (!item) return "عنصر غير محدد";
    return (
      item.name ||
      item.equipmentName ||
      item.partName ||
      item.username ||
      item.workerName ||
      item.bagType?.typeName ||
      item.wireType?.typeName ||
      item.supplier?.name ||
      item.customer?.name ||
      item.equipment?.equipmentName ||
      (item.createdAt || item.dueDate ? `سجل بتاريخ ${new Date(item.createdAt || item.dueDate).toLocaleDateString("ar-EG")}` : "غير محدد")
    );
  };

  // دالة مساعدة لاستخراج التفاصيل والأسعار بشكل ديناميكي
  const getItemDetails = (item) => {
    return (
      <div className="text-left font-semibold flex flex-col items-end gap-0.5">
        {/* رصيد / مديونية */}
        {item.balance !== undefined && (
          <span className={item.balance < 0 ? "text-rose-400" : "text-emerald-400"}>
            {item.balance} ج.م
          </span>
        )}
        {/* إجمالي مشتريات */}
        {item.totalPurchased !== undefined && (
          <span className="text-emerald-400">{item.totalPurchased} ج.م</span>
        )}
        {/* إجمالي مبيعات */}
        {item.totalSold !== undefined && (
          <span className="text-blue-400">{item.totalSold} ج.م</span>
        )}
        {/* تكلفة صيانة / معدات */}
        {(item.totalCost !== undefined || item.cost !== undefined) && (
          <span className="text-amber-400">
            {item.totalCost ?? item.cost} ج.م
          </span>
        )}
        {/* مبلغ شيك أو توريد */}
        {item.amount !== undefined && (
          <span className="text-purple-400">{item.amount} ج.م</span>
        )}
        {/* عدد العمليات أو الأعطال */}
        {item.actionsCount !== undefined && (
          <span className="text-slate-400 text-[11px]">{item.actionsCount} إجراء</span>
        )}
        {item.breakdownsCount !== undefined && (
          <span className="text-rose-400 text-[11px]">{item.breakdownsCount} الأعطال</span>
        )}
      </div>
    );
  };

  const handleSend = async (customText) => {
    const query = customText || inputQuery;
    if (!query.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const res = await api.post("/chatbot/parse-intent", { query });

      if (res.data?.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: "bot",
            text: res.data.message,
            data: res.data.data,
            extraContext: res.data.extraContext,
            timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      } else {
        throw new Error(res.data?.message || "تعذر معالجة الطلب");
      }
    } catch (error) {
      console.error("Chatbot Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: "حدث خطأ أثناء الاتصال بالنظام لجمع البيانات المحددة. يرجى المحاولة مرة أخرى.",
          timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 1. الزر العائم لفتح الشات (Floating Trigger Button) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-40 left-8 z-50 bg-gradient-to-tr from-purple-600 to-blue-600 text-white p-4 rounded-full shadow-2xl shadow-purple-600/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 border border-purple-400/30 group"
          dir="rtl"
        >
          <div className="relative">
            <Cpu size={24} className="animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full"></span>
          </div>
          <span className="font-bold text-sm hidden sm:inline pl-1">مساعد AI الذكي</span>
        </button>
      )}

      {/* 2. الخلفية المعتمة عند فتح الشيت (Backdrop Overlay) */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      {/* 3. الشيت السفلي القابل للفتح والإغلاق (Bottom Sheet Drawer) */}
      <div
        dir="rtl"
        className={`fixed bottom-40 left-0 right-0 sm:left-6 sm:right-auto sm:w-[480px] z-50 bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200 transition-all duration-300 ease-in-out transform ${
          isOpen
            ? "translate-y-0 opacity-100 h-[85vh] sm:h-[620px]"
            : "translate-y-full opacity-0 h-0 pointer-events-none"
        }`}
      >
        {/* Header / شريط التحكم العلوي */}
        <div className="bg-slate-950/90 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between select-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Cpu size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                مساعد AI للتقارير
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              </h3>
              <p className="text-[11px] text-slate-400">تحليل المبيعات، الصيانة والخامات</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-xl transition-all"
              title="تصغير"
            >
              <ChevronDown size={20} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-rose-400 p-1.5 hover:bg-slate-800 rounded-xl transition-all"
              title="إغلاق"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Messages Feed / تغذية المحادثة */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-900/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 max-w-[90%] ${
                msg.sender === "user" ? "mr-auto flex-row-reverse" : "ml-auto"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white ${
                  msg.sender === "user" ? "bg-slate-700" : "bg-purple-600"
                }`}
              >
                {msg.sender === "user" ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div
                className={`p-3.5 rounded-2xl text-xs sm:text-sm ${
                  msg.sender === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-950 border border-slate-800 text-slate-200"
                }`}
              >
                {/* النص المباشر */}
                <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                {/* عرض عناصر البيانات الديناميكية */}
                {msg.data && Array.isArray(msg.data) && msg.data.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-slate-800/80 pt-2.5">
                    {msg.data.map((item, idx) => (
                      <div
                        key={item._id || idx}
                        className="bg-slate-900/90 border border-slate-800/80 p-2.5 rounded-xl flex justify-between items-center text-xs hover:border-purple-500/30 transition-all"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-100 text-xs">
                            {getItemName(item)}
                          </span>

                          <div className="flex gap-2 text-[10px] text-slate-400">
                            {item.phone && <span>{item.phone}</span>}
                            {item.role && <span className="text-purple-400">({item.role})</span>}
                            {item.partName && <span className="text-amber-400">قطعة: {item.partName}</span>}
                            {item.supplierName && <span>المورد: {item.supplierName}</span>}
                          </div>
                        </div>

                        {getItemDetails(item)}
                      </div>
                    ))}
                  </div>
                )}

                {/* عرض ExtraContext إذا توفرت */}
                {msg.extraContext?.topParts && (
                  <div className="mt-3 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-2">
                      <Wrench size={13} /> أكثر قطع الغيار استهلاكاً:
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      {msg.extraContext.topParts.map((part, idx) => (
                        <div
                          key={part._id || idx}
                          className="bg-slate-950 p-1.5 rounded-lg border border-slate-800/50 flex justify-between"
                        >
                          <span className="text-slate-300 truncate max-w-[80px]">{part.partName}</span>
                          <span className="text-amber-400">{part.quantityUsed} قطعة</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <span className="text-[9px] text-slate-500 mt-1.5 block text-left">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="text-xs text-purple-400 animate-pulse flex items-center gap-2 p-2">
              <Sparkles size={14} /> جاري تحليل السؤال واستخراج التقارير...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Form / إدخال الأسئلة */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="اسأل عن الصيانة، المصاريف، الموردين..."
            className="flex-1 bg-slate-900 border border-slate-800 text-white text-xs sm:text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-purple-500 transition-colors"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 rounded-xl transition-all flex items-center justify-center shrink-0"
          >
            <Send size={16} className="rotate-180" />
          </button>
        </div>
      </div>
    </>
  );
};

export default ReportsAiChatbot;