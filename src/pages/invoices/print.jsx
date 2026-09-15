import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Printer, ArrowRight, Loader2, FileText } from "lucide-react";
import api from "../../services/api";
import { showAlert } from "../../services/alert";
import { useSystemSettings } from "../../context/shareInfo";

// ============================================================
// CSS الطباعة — نفس المقاسات المجربة بالظبط (80mm / body 12px /
// th,td 11px padding 4px) + نفس طريقة visibility hidden/visible
// اللي شغالة معاك فعلياً، بدل فتح نافذة popup منفصلة.
// ============================================================
const PRINT_STYLES = `
@media print {
  @page {
    size: 80mm auto; /* غيّرها لـ 58mm auto لو المكنة 58mm */
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

  .printable .barcode {
    height: 26px;
    background: repeating-linear-gradient(
      90deg,
      #000, #000 2px,
      #fff 2px, #fff 4px,
      #000 4px, #000 7px,
      #fff 7px, #fff 8px
    );
    width: 100%;
    max-width: 55mm;
    margin: 4px auto;
  }
}
`;

const InvoicePrint = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const { settings } = useSystemSettings();

  // جلب بيانات الفاتورة
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/invoice/${id}`);
        const data = res.data.data;

        if (data) {
          setInvoice(data.invoice);
          setPayments(data.payments || []);
        }
      } catch (err) {
        showAlert({
          title: err.response?.data?.message || "خطأ في جلب بيانات الفاتورة",
          icon: "error",
        });
        navigate("/invoices");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id, navigate]);

  // حساب المبالغ
  const totalPaid = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalPrice = invoice?.totalPrice || 0;
  const discount = invoice?.discount || 0;
  const discountAmount = (totalPrice * discount) / 100;
  const finalPrice = invoice?.finalPrice || 0;
  const remainingAmount = finalPrice - totalPaid;
  const newBalance = invoice?.customer?.balance || 0;
  const oldBalance = invoice?.oldCustomerBalance || 0;

  const printNow = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-ligth space-y-3">
        <Loader2 className="animate-spin text-brown" size={48} />
        <span className="text-dark/70 font-extrabold">جاري تحميل بيانات الفاتورة...</span>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-ligth space-y-3">
        <FileText size={48} className="text-dark/20" />
        <span className="text-dark/70 font-extrabold">الفاتورة غير موجودة</span>
        <button
          onClick={() => navigate("/invoices")}
          className="px-6 py-2 bg-brown text-white rounded-xl font-extrabold text-lg"
        >
          العودة للقائمة
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-4 px-2" dir="rtl">
      {/* نفس مقاسات الطباعة المجربة بالظبط */}
      <style>{PRINT_STYLES}</style>

      {/* شريط التحكم العلوي */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-4 mb-4 flex flex-col sm:flex-row justify-between items-center gap-3 no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/invoices")}
            className="p-2 hover:bg-ligth rounded-xl transition-colors"
          >
            <ArrowRight size={20} className="text-brown" />
          </button>
          <div>
            <h2 className="font-black text-dark text-lg">طباعة الفاتورة</h2>
            <p className="text-xs text-dark/50">رقم: {invoice.invoiceNumber || "---"}</p>
          </div>
        </div>

        <button
          onClick={printNow}
          className="px-6 py-3 bg-brown text-white rounded-xl font-black text-lg flex items-center gap-2 hover:bg-brown/90 transition-colors"
        >
          <Printer size={18} />
          طباعة الفاتورة
        </button>
      </div>

      {/* الفاتورة الحرارية - نفس المحتوى، بس دلوقتي بتتطبع من الصفحة
          نفسها (visibility hidden/visible) مش popup */}
      <div className="printable w-full max-w-[320px] bg-white shadow-xl px-3 py-1 font-mono text-[13px] leading-relaxed text-black">
        {/* رأس الفاتورة */}
        <div className="text-center  border-black pb-1">

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
          <p className="text-[13px] text-gray-950 font-extrabold">
            التاريخ: {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString("ar-EG") : "---"}
                      <span className="text-[13px] text-gray-950 font-extrabold">_</span>
                    <span className="text-[13px] text-gray-950 font-extrabold">رقم: {invoice.invoiceNumber || "---"}</span>
          </p>

        </div>

        {/* بيانات العميل */}
        <div className="  mb-2 space-y-1 text-right">
          <div className="flex justify-center text-lg">
     
            <span className="font-black">{invoice.customer?.name || "عميل نقدي"}</span>
          </div>

          {/* {invoice.customer?.balance !== undefined && (
            <div className="flex justify-between text-[13px] text-gray-950">
              <span>الرصيد الحالي:</span>
              <span>{invoice.customer.balance.toLocaleString()} ج.م</span>
            </div>
          )} */}
        </div>

        {/* جدول المنتجات */}
        <div className="mb-2">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="text-right w-[44%] border-2 border-black font-black p-1">المنتج</th>
                <th className="text-center w-[16%] border-2 border-black font-black p-1">الكمية</th>
                <th className="text-center w-[20%] border-2 border-black font-black p-1">السعر</th>
                <th className="text-left w-[20%] border-2 border-black font-black p-1">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {!invoice.items || invoice.items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-3 font-extrabold text-gray-950">
                    لا توجد منتجات
                  </td>
                </tr>
              ) : (
                invoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="text-right border border-black border-gray-950 p-1 align-top">
                      <span className="font-black block text-[13px]">{item.productName}</span>
                      
                    </td>
                    <td className="text-center border border-black border-gray-950 p-1 font-extrabold">{item.quantity}</td>
                    <td className="text-center border border-black border-gray-950 p-1 font-extrabold">{item.price.toLocaleString()}</td>
                    <td className="text-left border border-black border-gray-950 p-1 font-black">{(item.quantity * item.price).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* المجاميع المالية */}
        <div className="border-t-2 border-black pt-2 space-y-1 text-right font-extrabold">
{   discount > 0 &&        <div className="flex justify-between text-gray-950">
            <span>المجموع الكلي:</span>
            <span>{totalPrice.toLocaleString()} ج.م</span>
          </div>}

          {discount > 0 && (
            <div className="flex justify-between text-gray-950">
              <span>الخصم ({discount}%):</span>
              <span>-{discountAmount.toLocaleString()} ج.م</span>
            </div>
          )}

          <div className="flex justify-between text-md font-black border-t border-b border-black py-1.5 my-1">
            <span>صافي الفاتورة:</span>
            <span>{finalPrice.toLocaleString()} ج.م</span>
          </div>

          <div className="flex justify-between text-gray-950">
            <span>المدفوع:</span>
            <span>{totalPaid.toLocaleString()} ج.م</span>
          </div>

          <div className="flex justify-between text-[13px]  text-gray-950">
            <span>المتبقي:</span>
            <span className={remainingAmount > 0 ? "text-gray-950" : "text-gray-950"}>
              {remainingAmount.toLocaleString()} ج.م
            </span>
          </div>

          {/* حالة الفاتورة */}


          {/* رصيد العميل */}
          <div className="border-t border-dashed border-black pt-2 mt-1 space-y-0.5">
            <div className="flex justify-between text-[13px] text-gray-900">
              <span>رصيد سابق:</span>
              <span>{oldBalance.toLocaleString()} ج.م</span>
            </div>
            <div className="flex justify-between text-[13px] font-black bg-gray-50 px-1 py-0.5 rounded">
              <span>اجمالي الكل:</span>
              <span>{newBalance.toLocaleString()} ج.م</span>
            </div>
          </div>
        </div>

        {/* ملاحظات */}
        {invoice.adminNote && (
          <div className="border-t border-dashed border-black mt-2 pt-2 text-[13px] text-gray-950 text-right">
            <span className="font-extrabold">ملاحظات:</span>
            <p className="mt-0.5">{invoice.adminNote}</p>
          </div>
        )}


{/* تذييل الفاتورة */}
<div className="border-t-2 border-dashed border-black mt-3 pt-3 text-center space-y-1">
  <p className="font-black text-[13px]">شكراً لتعاملكم معنا</p>
  
  {/* عرض أرقام الهواتف بجانب بعضها مع فاصل */}
  {settings?.phones && settings.phones.length > 0 && (
    <div className="flex flex-wrap justify-center items-center gap-x-2 text-[13px] font-extrabold text-black" dir="ltr">
      {settings.phones.map((ph, index) => (
        <span key={index} className="whitespace-nowrap">
          {ph}
          {index < settings.phones.length - 1 && <span className="mx-1 text-gray-950">•</span>}
        </span>
      ))}
    </div>
  )}

  <p className="text-[13px] text-gray-950 pt-1">تصميم : كيرلس رضا 01270857659</p>
</div>
      </div>

      {/* زر الطباعة السفلي (نسخة احتياطية) */}
      <div className="w-full max-w-2xl flex justify-center mt-4 no-print">
        <button
          onClick={printNow}
          className="w-full max-w-sm px-6 py-3 bg-brown text-white rounded-xl font-black text-lg flex items-center justify-center gap-2 hover:bg-brown/90 transition-colors"
        >
          <Printer size={18} />
          طباعة الفاتورة
        </button>
      </div>
    </div>
  );
};

export default InvoicePrint;
