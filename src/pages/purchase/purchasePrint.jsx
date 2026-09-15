import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Printer, ArrowRight, Loader2, FileText } from "lucide-react";
import api from "../../services/api";
import { showAlert } from "../../services/alert";
import { useSystemSettings } from "../../context/shareInfo";

// ============================================================
// CSS الطباعة — نفس المقاسات والميديا المجربة (80mm)
// ============================================================
const PRINT_STYLES = `
@media print {
  @page {
    size: 80mm auto;
    margin: 0;
  }

  body {
    margin: 0;
    padding: 0;
    font-size: 12px;
  }

  .no-print {
    display: none !important;
  }

  body * {
    visibility: hidden;
  }

  .printable,
  .printable * {
    visibility: visible;
  }

  .printable {
    width: 80mm;
    position: absolute;
    left: 0;
    top: 0;
    padding: 5px;
  }

  .printable table {
    width: 100%;
    border-collapse: collapse;
  }

  .printable th,
  .printable td {
    padding: 4px;
    font-size: 11px;
  }

  .printable .invoice-logo {
    width: 35mm;
    height: auto;
    object-fit: contain;
    margin: 2px auto 4px;
  }
}
`;

const PurchasePrint = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [purchase, setPurchase] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const { settings } = useSystemSettings();

  // جلب بيانات فاتورة الشراء
  useEffect(() => {
    const fetchPurchase = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/purchase/${id}`);
        const data = res.data.data;

        if (data) {
          // التعامل مع اختلاف المسميات حسب استجابة الـ API
          setPurchase(data.purchase || data);
          setPayments(data.payments || []);
        }
      } catch (err) {
        showAlert({
          title: err.response?.data?.message || "خطأ في جلب بيانات فاتورة الشراء",
          icon: "error",
        });
        navigate("/purchases");
      } finally {
        setLoading(false);
      }
    };

    fetchPurchase();
  }, [id, navigate]);

  // حساب المبالغ
  const totalPaid = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalPrice = purchase?.totalPrice || 0;
  const discount = purchase?.discount || 0;
  const discountAmount = (totalPrice * discount) / 100;
  const finalPrice = purchase?.finalPrice || 0;
  const remainingAmount = finalPrice - totalPaid;
  const newBalance = purchase?.supplier?.balance || 0;
  const oldBalance = purchase?.oldSupplierBalance || 0;

  const printNow = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-ligth space-y-3">
        <Loader2 className="animate-spin text-brown" size={48} />
        <span className="text-dark/70 font-bold">جاري تحميل بيانات فاتورة الشراء...</span>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-ligth space-y-3">
        <FileText size={48} className="text-dark/20" />
        <span className="text-dark/70 font-bold">فاتورة الشراء غير موجودة</span>
        <button
          onClick={() => navigate("/purchases")}
          className="px-6 py-2 bg-brown text-white rounded-xl font-bold text-sm"
        >
          العودة للقائمة
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-4 px-2" dir="rtl">
      <style>{PRINT_STYLES}</style>

      {/* شريط التحكم العلوي */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-4 mb-4 flex flex-col sm:flex-row justify-between items-center gap-3 no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/purchases")}
            className="p-2 hover:bg-ligth rounded-xl transition-colors"
          >
            <ArrowRight size={20} className="text-brown" />
          </button>
          <div>
            <h2 className="font-black text-dark text-lg">طباعة فاتورة شراء</h2>
            <p className="text-xs text-dark/50">رقم: {purchase.purchaseNumber || "---"}</p>
          </div>
        </div>

        <button
          onClick={printNow}
          className="px-6 py-3 bg-brown text-white rounded-xl font-black text-sm flex items-center gap-2 hover:bg-brown/90 transition-colors"
        >
          <Printer size={18} />
          طباعة الفاتورة
        </button>
      </div>

      {/* الفاتورة الحرارية */}
      <div className="printable w-full max-w-[320px] bg-white shadow-xl p-3 font-mono text-[11px] leading-relaxed text-black">
        {/* رأس الفاتورة */}
        <div className="text-center border-b-2 border-dashed border-black pb-3 mb-3">
          <h2 className="font-black text-lg tracking-wider uppercase">فاتورة شراء</h2>
          {settings?.iconInvoices?.url && (
            <div className="flex justify-center my-1">
              <img
                src={settings.iconInvoices.url}
                className="invoice-logo w-[45mm] h-[25mm] object-contain mx-auto block"
                alt="الوجو"
              />
            </div>
          )}
          <span>{settings?.invoiceFactoryName}</span>
          <p className="text-[10px] text-gray-600 font-bold">
            التاريخ: {purchase.purchaseDate ? new Date(purchase.purchaseDate).toLocaleDateString("ar-EG") : "---"}
          </p>
          <p className="text-[10px] text-gray-600 font-bold">رقم الشراء: {purchase.purchaseNumber || "---"}</p>
        </div>

        {/* بيانات المورد */}
        <div className="border-b border-black pb-2 mb-2 space-y-1 text-right">
          <div className="flex justify-between">
            <span className="font-bold">اسم المورد:</span>
            <span className="font-black">{purchase.supplier?.name || "مورد عام"}</span>
          </div>
          {purchase.supplier?.phone && (
            <div className="flex justify-between text-[10px]">
              <span className="font-bold">رقم الهاتف:</span>
              <span>{purchase.supplier.phone}</span>
            </div>
          )}
          {purchase.supplier?.balance !== undefined && (
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>رصيد المورد الحالي:</span>
              <span>{purchase.supplier.balance.toLocaleString()} ج.م</span>
            </div>
          )}
        </div>

        {/* جدول الأصناف المشكورة */}
        <div className="mb-2">
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr>
                <th className="text-right w-[44%] border-b-2 border-black font-black p-1">المنتج</th>
                <th className="text-center w-[16%] border-b-2 border-black font-black p-1">الكمية</th>
                <th className="text-center w-[20%] border-b-2 border-black font-black p-1">السعر</th>
                <th className="text-left w-[20%] border-b-2 border-black font-black p-1">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {!purchase.items || purchase.items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-3 font-bold text-gray-400">
                    لا توجد منتجات
                  </td>
                </tr>
              ) : (
                purchase.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="text-right border-b border-dotted border-gray-300 p-1 align-top">
                      <span className="font-black block text-[10px]">{item.productName}</span>
                      <span className="text-[8px] text-gray-400 block">[{item.unit_type}]</span>
                    </td>
                    <td className="text-center border-b border-dotted border-gray-300 p-1 font-bold">{item.quantity}</td>
                    <td className="text-center border-b border-dotted border-gray-300 p-1 font-bold">{item.price.toLocaleString()}</td>
                    <td className="text-left border-b border-dotted border-gray-300 p-1 font-black">
                      {(item.subtotal || item.quantity * item.price).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* الحسابات والمجاميع */}
        <div className="border-t-2 border-black pt-2 space-y-1 text-right font-bold">
          <div className="flex justify-between text-gray-700">
            <span>المجموع الكلي:</span>
            <span>{totalPrice.toLocaleString()} ج.م</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-gray-700">
              <span>الخصم ({discount}%):</span>
              <span>-{discountAmount.toLocaleString()} ج.م</span>
            </div>
          )}

          <div className="flex justify-between text-sm font-black border-t border-b border-black py-1.5 my-1">
            <span>صافي الفاتورة:</span>
            <span>{finalPrice.toLocaleString()} ج.م</span>
          </div>

          <div className="flex justify-between text-gray-700">
            <span>المدفوع للمورد:</span>
            <span>{totalPaid.toLocaleString()} ج.م</span>
          </div>

          <div className="flex justify-between text-gray-700">
            <span>المتبقي للمورد:</span>
            <span className={remainingAmount > 0 ? "text-gray-950" : "text-emerald-600"}>
              {remainingAmount.toLocaleString()} ج.م
            </span>
          </div>

          {/* حالة الفاتورة */}
          <div className="flex justify-between text-[10px] border-t border-dashed border-black pt-1 mt-1">
            <span>الحالة:</span>
            <span className="text-gray-600">
              {purchase.status === "paid"
                ? "مدفوعة بالكامل ✔"
                : purchase.status === "partPaid"
                ? "مدفوعة جزئياً"
                : purchase.status === "return"
                ? "مرتجع"
                : "غير مدفوعة"}
            </span>
          </div>

          {/* رصيد المورد */}
          <div className="border-t border-dashed border-black pt-2 mt-1 space-y-0.5">
            <div className="flex justify-between text-[9px] text-gray-900">
              <span>رصيد سابق للمورد:</span>
              <span>{oldBalance.toLocaleString()} ج.م</span>
            </div>
            <div className="flex justify-between text-[10px] font-black bg-gray-50 px-1 py-0.5 rounded">
              <span>الرصيد الجديد للمورد:</span>
              <span>{newBalance.toLocaleString()} ج.م</span>
            </div>
          </div>
        </div>

        {/* ملاحظات */}
        {purchase.adminNote && (
          <div className="border-t border-dashed border-black mt-2 pt-2 text-[9px] text-gray-500 text-right">
            <span className="font-bold">ملاحظات:</span>
            <p className="mt-0.5">{purchase.adminNote}</p>
          </div>
        )}

        {/* تفاصيل الدفعات */}
        {payments.length > 0 && (
          <div className="border-t border-dashed border-black mt-2 pt-2 text-[9px]">
            <p className="font-bold text-[10px]">تفاصيل الدفعات:</p>
            {payments.map((p, idx) => (
              <div key={idx} className="flex justify-between text-gray-600 mt-0.5">
                <span>
                  {p.paymentMethod === "cash"
                    ? "نقدي"
                    : p.paymentMethod === "wallet"
                    ? "محفظة"
                    : p.paymentMethod === "instapay"
                    ? "إنستا باي"
                    : "آجل/آخر"}
                </span>
                <span>{p.amount.toLocaleString()} ج.م</span>
              </div>
            ))}
          </div>
        )}

        {/* تذييل الفاتورة */}
        <div className="border-t-2 border-dashed border-black mt-3 pt-3 text-center space-y-1">
          <p className="font-black text-[10px]">فاتورة توريد بضائع</p>

          {settings?.phones && settings.phones.length > 0 && (
            <div className="flex flex-wrap justify-center items-center gap-x-2 text-[8px] font-semibold text-black" dir="ltr">
              {settings.phones.map((ph, index) => (
                <span key={index} className="whitespace-nowrap">
                  {ph}
                  {index < settings.phones.length - 1 && <span className="mx-1 text-gray-500">•</span>}
                </span>
              ))}
            </div>
          )}

          <p className="text-[8px] text-gray-400 pt-1">تصميم : كيرلس رضا 01270857659</p>
        </div>
      </div>

      {/* زر الطباعة السفلي */}
      <div className="w-full max-w-2xl flex justify-center mt-4 no-print">
        <button
          onClick={printNow}
          className="w-full max-w-sm px-6 py-3 bg-brown text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-brown/90 transition-colors"
        >
          <Printer size={18} />
          طباعة الفاتورة
        </button>
      </div>
    </div>
  );
};

export default PurchasePrint;