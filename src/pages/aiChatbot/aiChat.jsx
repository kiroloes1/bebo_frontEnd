import { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import { useSystemSettings } from "../../context/shareInfo";


const API_URL = "/ai-chat";
const MAX_LENGTH = 1000;

const SUGGESTIONS = [
  "ما المنتجات التي أوشكت على النفاد؟",
  "ملخص مبيعات هذا الشهر",
  "من العملاء الذين عليهم مديونية؟",
  "ما المنتجات التي تحتاج إعادة طلب؟",
];

export default function AiChatWidget() {
  const { settings } = useSystemSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  

  const [conversations, setConversations] = useState(() => {
    try {
      const saved = localStorage.getItem("ai_chat_conversations");
      return saved ? JSON.parse(saved) : [{ id: Date.now(), title: "محادثة جديدة", messages: [] }];
    } catch {
      return [{ id: Date.now(), title: "محادثة جديدة", messages: [] }];
    }
  });
  
  const [activeId, setActiveId] = useState(() => conversations[0]?.id || Date.now());
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const currentChat = conversations.find((c) => c.id === activeId) || conversations[0];
  const messages = currentChat?.messages || [];

  useEffect(() => {
    localStorage.setItem("ai_chat_conversations", JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [input]);

  const createNewChat = () => {
    const newConv = { id: Date.now(), title: "محادثة جديدة", messages: [] };
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
  };

  const sendMessage = async (text) => {
    const question = (text ?? input).trim();
    if (!question || loading) return;

    const updatedMessages = [...messages, { role: "user", content: question }];
    
    // تحديث عنوان المحادثة بناءً على أول سؤال إذا كانت جديدة
    const chatTitle = messages.length === 0 ? (question.length > 20 ? question.substring(0, 20) + "..." : question) : currentChat.title;

    setConversations((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, title: chatTitle, messages: updatedMessages } : c))
    );

    setInput("");
    setLoading(true);

    try {
      const { data } = await api.post(API_URL, { question });
      const finalMessages = [...updatedMessages, { role: "assistant", content: data.answer }];
      
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, messages: finalMessages } : c))
      );
    } catch (err) {
      const errorMsg = err.response?.data?.message || "حدث خطأ أثناء الاتصال بالخادم.";
      const finalMessages = [...updatedMessages, { role: "assistant", content: errorMsg, error: true }];
      
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, messages: finalMessages } : c))
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // الألوان المستخرجة من الإعدادات مع قيم افتراضية احتياطية
  const primaryColor = settings?.theme?.primary || "#0A2947";
  const secondaryColor = settings?.theme?.secondary || "#8B5E3C";
  const bgColor = settings?.theme?.background || "#F3E4C9";

  return (
    <div dir="rtl" className="fixed bottom-40 left-8 z-50 font-sans">
      {/* زر الأيقونة العائم لفتح/إغلاق الشات */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{ backgroundColor: primaryColor }}
          className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl transition-transform hover:scale-110 focus:outline-none"
          title="فتح المساعد الذكي"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {/* نافذة الشات العائمة / أو ملء الشاشة */}
      {isOpen && (
        <div
          className={`flex flex-col overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-2xl transition-all duration-300 ${
            isExpanded
              ? "fixed inset-4 h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] md:inset-10 md:h-[calc(100vh-5rem)] md:w-[calc(100vw-5rem)]"
              : "h-[550px] w-[90vw] sm:w-[450px]"
          }`}
        >
          {/* Header */}
          <div
            style={{ backgroundColor: primaryColor }}
            className="flex items-center justify-between px-4 py-3 text-white"
          >
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-400 animate-pulse" />
              <div>
                <h2 className="text-base font-semibold">المساعد الذكي</h2>
                <p className="text-xs opacity-80">اسأل عن المخزون والمبيعات والعملاء</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              {/* زر التكبير/التصغير */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="rounded-lg p-1.5 text-xs transition hover:bg-white/20"
                title={isExpanded ? "تصغير النافذة" : "تكبير الشاشة"}
              >
                {isExpanded ? "🗗" : "🗖"}
              </button>
              {/* زر الإغلاق */}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-xs transition hover:bg-white/20"
                title="إغلاق"
              >
                ✕
              </button>
            </div>
          </div>

          {/* محتوى الشات مع خانة المحادثات السابقة على اليمين */}
          <div className="flex flex-1 overflow-hidden">
            {/* القائمة الجانبية للمحادثات السابقة (تشبه طريقتك المطلوبة) */}
            <div className="w-44 sm:w-52 border-l border-gray-200 bg-gray-50 flex flex-col">
              <div className="p-2 border-b border-gray-200">
                <button
                  onClick={createNewChat}
                  style={{ backgroundColor: secondaryColor }}
                  className="w-full rounded-lg px-2.5 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
                >
                  + محادثة جديدة
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveId(conv.id)}
                    className={`w-full text-right truncate rounded-lg px-2.5 py-2 text-xs transition ${
                      conv.id === activeId
                        ? "bg-indigo-50 font-semibold text-indigo-900 border border-indigo-200"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {conv.title}
                  </button>
                ))}
              </div>
            </div>

            {/* منطقة الرسائل */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
              <div className="flex-1 space-y-3 overflow-y-auto p-4 bg-gray-50/50">
                {messages.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                    <p className="text-xs text-gray-500">اكتب سؤالك أو اختر أحد الاقتراحات السريعة</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => sendMessage(s)}
                          className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 transition hover:bg-gray-100 shadow-sm"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m, i) => {
                  const isUser = m.role === "user";
                  return (
                    <div key={i} className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
                      <div
                        style={isUser ? { backgroundColor: primaryColor } : {}}
                        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm ${
                          isUser
                            ? "rounded-br-sm text-white"
                            : m.error
                            ? "rounded-bl-sm border border-red-200 bg-red-50 text-red-700"
                            : "rounded-bl-sm border border-gray-200 bg-white text-gray-800"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex justify-end">
                    <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-4 py-3 shadow-sm">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* حقل الإدخال */}
              <div className="border-t border-gray-200 bg-white p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    maxLength={MAX_LENGTH}
                    rows={1}
                    placeholder="اكتب سؤالك هنا..."
                    className="max-h-36 flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={loading || !input.trim()}
                    style={{ backgroundColor: primaryColor }}
                    className="rounded-xl px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    إرسال
                  </button>
                </div>
                <div className="mt-1 flex justify-between items-center text-[11px] text-gray-400">
                  <span style={{ color: secondaryColor }} className="font-medium">المساعد الذكي للمخزون</span>
                  <span dir="ltr">{input.length}/{MAX_LENGTH}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}