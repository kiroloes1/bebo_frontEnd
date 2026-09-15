import { useEffect, useState } from "react";
import api from "../../services/api";
import { showAlert } from "../../services/alert";
import { Trash2, Edit2, List, Plus, Search, BarChart2, X } from "lucide-react";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";
import { showAlertConfirm } from "../../services/alertConfirm";
import ExportExcelButton from "../../services/ExportExcelButton";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function Expenses() {

  const [todayExpenses, setTodayExpenses] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [totalPages, setTotalPages] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [editData, setEditData] = useState(null);

  const [items, setItems] = useState([{ title: "", amount: 0, note: "" }]);
  const [expenseDate, setExpenseDate] = useState("");
  const [originalDateTime, setOriginalDateTime] = useState("");
  const [loading, setLoading] = useState(false);

  // دالة مساعدة لتحويل التاريخ إلى توقيت محلي متوافق مع حقل datetime-local
  const formatLocalDateTime = (dateInput) => {
    if (!dateInput) return "";
    const d = new Date(dateInput);
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  };

  // ================= FETCH =================
  const fetchData = async () => {
    try {
      const [todayRes, allRes] = await Promise.all([
        api.get("/expense/getCurrentExpenses"),
        api.get("/expense", {
          params: {
            page: currentPage,
            limit: 10,
            search,
            fromDate,
            toDate,
          },
        })
      ]);

      setTodayExpenses(todayRes.data);
      setAllExpenses(allRes.data.expenses);
      setTotalPages(allRes.data.pagination.totalPages);
    } catch {
      showAlert({ title: "خطأ في الوصول للمصاريف ", icon: "error" });
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, search, fromDate, toDate]);

  // ================= FILTER =================
  const filteredExpenses = allExpenses?.filter((exp) => {
    const matchesSearch = exp.items.some(item =>
      item.title.toLowerCase().includes(search.toLowerCase())
    );

    const expDate = new Date(exp.expenseDate);

    if (fromDate && expDate < new Date(fromDate)) return false;

    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      if (expDate > end) return false;
    }

    return matchesSearch;
  });

  // ================= HANDLERS =================
  const handleDelete = async (id) => {
    const onConfirm = await showAlertConfirm({
      title: "مسح بند من المصاريف",
      text: "هل انت متأكد من مسح هذا البند من المصاريف ",
      cancelButtonText: "الغاء",
      confirmButtonText: "تأكيد",
      icon: "warning",
    });

    try {
      if (!onConfirm.isConfirmed) return;
      setLoading(true);

      await api.delete(`/expense/${id}`);

      showAlert({
        icon: "success",
        title: "تم حذف البند بنجاح",
      });

      fetchData();
    } catch (error) {
      showAlert({
        icon: "error",
        message: error?.response?.data?.message || "فشل في حذف البند",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const itemsUpdate = items?.filter(e => e.title !== "");

      if (editData) {
        await api.put(`/expense/${editData._id}`, {
          items: itemsUpdate,
          expenseDate: new Date(expenseDate)
        });
        showAlert({
          icon: "success",
          title: "تم تحديث البند بنجاح",
        });
      } else {
        await api.post("/expense", { 
          items: itemsUpdate,
          expenseDate: new Date(expenseDate)
        });

        showAlert({
          icon: "success",
          message: "تمت الاضافه بنجاح",
        });
      }

      setShowModal(false);
      fetchData();
    } catch (error) {
      showAlert({
        icon: "error",
        title: error?.response?.data?.message || error?.response?.data?.error || "حدث خطأ ",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (i, field, value) => {
    const newItems = [...items];
    newItems[i][field] = field === "amount" ? Number(value) : value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { title: "", amount: 0, note: "" }]);
  };

  const removeIten = (index) => {
    const copyItem = [...items];
    const updateItems = copyItem?.filter((e, i) => i !== index);
    setItems(updateItems);
  };

  return (
    <div className="min-h-screen p-4 md:p-8" dir="rtl">

      <div className="mx-auto mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-dark">إدارة المصاريف</h1>
            <p className="text-accent font-medium">تابع نفقاتك اليومية والتقارير المالية</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setItems([{ title: "", amount: 0, note: "" }]);
                setExpenseDate(formatLocalDateTime(new Date()));
                setEditData(null);
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-brown text-ligth font-bold rounded-xl hover:opacity-90 transition-all shadow-lg"
            >
              <Plus size={20} /> إضافة مصاريف
            </button>
          </div>
        </div>

        {/* 🔹 STATS CARDS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          {/* كارت إجمالي اليوم */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <p className="text-dark/60 font-bold text-sm mb-1">مصاريف اليوم</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-accent">
                {todayExpenses.reduce((acc, curr) => acc + curr.totalAmount, 0).toLocaleString()}
              </span>
              <span className="text-xs font-bold text-accent/60">ج.م</span>
            </div>
            <div className="mt-2 text-[10px] text-slate-400 font-medium">عدد العمليات: {todayExpenses?.length}</div>
          </div>

          {/* كارت إجمالي الشهر الحالي */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <p className="text-dark/60 font-bold text-sm mb-1">إجمالي الشهر الحالي</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-brown">
                {allExpenses?.filter(e => {
                  const date = new Date(e.expenseDate);
                  const now = new Date();
                  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                }).reduce((acc, curr) => acc + curr.totalAmount, 0).toLocaleString()}
              </span>
              <span className="text-xs font-bold text-brown/60">ج.م</span>
            </div>
            <div className="mt-2 text-[10px] text-slate-400 font-medium">بناءً على التقويم الميلادي</div>
          </div>

          {/* كارت متوسط العملية الواحدة */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <p className="text-dark/60 font-bold text-sm mb-1">متوسط الصرف/اليومي</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-dark">
                {allExpenses?.length > 0
                  ? (allExpenses.reduce((acc, curr) => acc + curr.totalAmount, 0) / 30).toFixed(0).toLocaleString()
                  : 0}
              </span>
              <span className="text-xs font-bold text-dark/60">ج.م/يوم</span>
            </div>
            <div className="mt-2 text-[10px] text-slate-400 font-medium">تقديري لآخر 30 يوم</div>
          </div>

          {/* كارت عدد البنود المسجلة */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <p className="text-dark/60 font-bold text-sm mb-1">إجمالي عمليات الصرف</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-dark">{allExpenses?.length}</span>
              <span className="text-xs font-bold text-dark/60 mr-1">عمليات الصرف</span>
            </div>
            <div className="mt-2 text-[10px] text-slate-400 font-medium">منذ بدء استخدام السيستم</div>
          </div>

        </div>

        {/* Search & Filter Bar */}
        <div className="bg-dark p-4 rounded-xl mb-8 flex flex-wrap gap-4 items-center shadow-xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-2.5 text-slate-400" size={18} />
            <input
              placeholder="ابحث عن وصف أو بند..."
              className="w-full bg-slate-800 border-none text-white pr-10 py-2 rounded-xl focus:ring-2 focus:ring-brown transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 items-center text-white">
            <span className="text-sm font-bold">من:</span>
            <input type="date" className="bg-slate-800 border-none rounded-lg p-2 text-sm focus:ring-2 focus:ring-brown text-white" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div className="flex gap-2 items-center text-white">
            <span className="text-sm font-bold">إلى:</span>
            <input type="date" className="bg-slate-800 border-none rounded-lg p-2 text-sm focus:ring-2 focus:ring-brown text-white" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
        </div>


  <div className="flex justify-between gap-1 items-center my-2">
                        <div>
            <h3 className="font-extrabold text-3xl  text-dark">
              كل المصاريف
            </h3>
            <span className="text-slate-500 text-md">كل المصاريف منذ بدايه السيستم</span>
          </div>

                        <ExportExcelButton
  data={
    allExpenses

  }
  fileName="مصاريف"
  sheetName="مصاريف"
/>
             </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             
           

          {/* 🔹 TABLE SECTION */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div id="report" className="overflow-x-auto">
              <table className="w-full text-right uppercase">
                <thead className="bg-slate-50 text-dark/70 border-b">
                  <tr>
                    <th className="px-6 py-4 font-black">التاريخ</th>
                    <th className="px-6 py-4 font-black">المجموع</th>
                    <th className="px-6 py-4 font-black text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allExpenses?.map(exp => (
                    <tr key={exp._id} className="hover:bg-ligth transition-colors">
                      <td className="px-6 py-4 font-bold text-dark">
                        {new Date(exp.expenseDate).toLocaleString("ar-EG", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="px-6 py-4">
                        <span className="bg-accent/10 text-accent px-3 py-1 rounded-full font-black">
                          {exp.totalAmount} ج.م
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => setViewData(exp)} className="p-2 text-dark hover:bg-slate-100 rounded-lg transition-all"><List size={18} /></button>
                          <button onClick={() => {
                            setEditData(exp);
                            setItems(exp.items);
                            setExpenseDate(formatLocalDateTime(exp.expenseDate));
                            setOriginalDateTime(exp.expenseDate);
                            setShowModal(true);
                          }} className="p-2 text-brown hover:bg-brown/10 rounded-lg transition-all"><Edit2 size={18} /></button>
                          <button disabled={loading} onClick={() => handleDelete(exp._id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 🔹 PAGINATION */}
            <div className="p-4 bg-slate-50 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-xl font-bold transition-all ${currentPage === i + 1 ? 'bg-dark text-ligth shadow-lg' : 'bg-white text-dark hover:bg-slate-200'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {(viewData || showModal) && (
        <div className="fixed inset-0 bg-dark/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-dark p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-black">{viewData ? "تفاصيل المصاريف" : (editData ? "تعديل المصاريف" : "إضافة مصاريف جديدة")}</h3>
              <button onClick={() => { setViewData(null); setShowModal(false); }} className="hover:rotate-90 transition-all"><X /></button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {viewData ? (
                <div className="space-y-4">
                  {/* TOTAL */}
                  <div className="p-4 bg-dark text-white rounded-xl flex justify-between items-center">
                    <span className="font-bold">الإجمالي</span>
                    <span className="text-xl font-black text-brown">
                      {viewData.items.reduce((acc, curr) => acc + curr.amount, 0)} ج.م
                    </span>
                  </div>

                  {/* ITEMS */}
                  {viewData.items?.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-4 bg-ligth rounded-xl border border-accent/20"
                    >
                      <div>
                        <p className="font-black text-dark">{item.title}</p>
                        <p className="text-sm text-accent font-bold">
                          {item.note || "لا توجد ملاحظات"}
                        </p>
                      </div>
                      <span className="text-xl font-black text-brown">
                        {item.amount} ج.م
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* حقل التاريخ والوقت */}
                  <div className="bg-slate-50 p-4 rounded-xl border mb-4">
                    <label className="block mb-2 font-bold text-dark">
                      تاريخ ووقت المصروف
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full md:w-80 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-accent outline-none"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                    />
                  </div>

                  {/* قائمة البنود */}
                  {items?.map((item, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl relative pt-10 md:pt-4"
                    >
                      <Trash2
                        className="absolute left-3 top-3 cursor-pointer text-red-500 hover:text-red-700"
                        size={20}
                        onClick={() => removeIten(i)}
                      />

                      <input
                        placeholder="البند (مثلاً: إيجار)"
                        className="p-2.5 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-accent"
                        value={item.title}
                        onChange={(e) => handleItemChange(i, "title", e.target.value)}
                      />

                      <input
                        type="number"
                        placeholder="المبلغ"
                        className="p-2.5 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-accent"
                        value={item.amount === 0 ? "" : item.amount}
                        onChange={(e) => handleItemChange(i, "amount", e.target.value)}
                      />

                      <input
                        placeholder="ملاحظة"
                        className="p-2.5 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-accent"
                        value={item.note}
                        onChange={(e) => handleItemChange(i, "note", e.target.value)}
                      />
                    </div>
                  ))}

                  <button onClick={addItem} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:border-accent hover:text-accent transition-all">+ إضافة بند آخر</button>
                </div>
              )}
            </div>

            {!viewData && (
              <div className="p-6 bg-slate-50 flex gap-3">
                <button disabled={loading} onClick={handleSubmit} className="flex-1 py-4 bg-accent text-white font-black rounded-xl hover:bg-dark transition-all shadow-lg">حفظ البيانات</button>
                <button onClick={() => setShowModal(false)} className="flex-1 py-4 bg-white text-dark font-black rounded-xl border border-slate-200 hover:bg-slate-100 transition-all">إلغاء</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}