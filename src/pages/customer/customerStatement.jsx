import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";
import html2pdf from 'html2pdf.js';
import { useSystemSettings } from "../../context/shareInfo";

const InvoiceStatement = () => {
  const { customerId } = useParams();
  const [customerData, setCustomerData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sharing, setSharing] = useState(false);
  const { settings } = useSystemSettings();

  // 🔹 دالة تنسيق المبالغ طبقًا للقاعدة الموحدة
  const formatAmount = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) return "-";
    const absValue = (amount).toLocaleString();
    if (amount < 0) {
      return `${absValue} `;
    }
    return `${absValue} `;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [customerRes, invoiceRes] = await Promise.all([
          api.get(`/customers/${customerId}`),
          api.get(`/invoice/getInvoicesByCustomer?customerId=${customerId}`),
        ]);

        setCustomerData(customerRes.data.data || customerRes.data);
        setPayments(customerRes.data.payment || []);
        setInvoices(invoiceRes.data.invoices || []);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchData();
    }
  }, [customerId]);

  const invoicesMap = useMemo(() => {
    const map = new Map();
    invoices.forEach(inv => map.set(inv._id, inv));
    return map;
  }, [invoices]);

  const translatePaymentMethod = (method) => {
    const methods = {
      cash: "نقدي",
      bank: "تحويل بنكي",
      "bank transfer": "تحويل بنكي",
      wallet: "محفظة",
      work: "شغل",
      instapay: "انستا باي",
      mail: "بريد",
      cheque: "شيك"
    };
    return methods[method] || method;
  };

  // تجميع المدفوعات حسب moduleId (رقم الفاتورة)
  const groupedPayments = useMemo(() => {
    const grouped = {};
    payments.forEach(payment => {
      // المدفوعات المرتبطة بفاتورة (module === "invoices")
      if (payment.module === "invoices" && payment.moduleId) {
        if (!grouped[payment.moduleId]) {
          grouped[payment.moduleId] = [];
        }
        grouped[payment.moduleId].push(payment);
      }
    });
    return grouped;
  }, [payments]);

  // الحصول على تفاصيل الدفع للعرض
  const getPaymentDisplay = (payment, type = "receive") => {
    const method = payment?.paymentMethod;

    const methodNames = {
      cash: "نقدي",
      wallet: "محفظة",
      instapay: "إنستا باي",
      bank: "بنكي",
      "bank transfer": "بنكي",
      cheque: "شيك",
      mail: "بريد",
      work: "شغل",
    };

    const methodName = methodNames[method] || method || "غير محدد";

    let title = type === "send" ? "تحويل خارجي" : "استلام دفعة";

    let details = "";

    if (method === "wallet") {
      const walletInfo = payment.walletInfo || {};
      const receiverName = walletInfo.receiverName || walletInfo.senderName || "";
      const phone = walletInfo.receiverPhone || walletInfo.senderPhone || "";
      let maskedPhone = phone;
      if (phone) {
        const cleanPhone = String(phone);
        maskedPhone = cleanPhone.length > 4 ? `(...${cleanPhone.slice(-4)})` : cleanPhone;
      }
      if (receiverName || maskedPhone) {
        details = `إلى: ${receiverName || ""} ${maskedPhone}`;
      }
    }

    if (method === "bank" || method === "bank transfer") {
      const bankInfo = payment.bankInfo || {};
      const bankName = bankInfo.bankName || "";
      if (bankName) {
        details = bankName;
      }
    }

    if (method === "instapay") {
      const bankInfo = payment.bankInfo || {};
      const bankName = bankInfo.bankName || "";
      if (bankName) {
        details = bankName;
      }
    }

    if (method === "cheque") {
      const cheque = payment.cheque || {};
      const chequeNumber = cheque.chequeNumber || cheque.number || "";
      const bankName = cheque.bankName || "";
      let dueDate = "";
      if (cheque.dueDate) {
        dueDate = new Date(cheque.dueDate).toLocaleDateString("ar-EG", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        });
      }
      details = [chequeNumber ? `رقم ${chequeNumber}` : "", bankName, dueDate ? `استحقاق ${dueDate}` : ""]
        .filter(Boolean)
        .join(" | ");
    }

    return { title, methodName, details };
  };

  const combinedLog = useMemo(() => {
    if (!customerData) return [];
    const logs = [];
   

    // 1. معالجة المدفوعات غير المرتبطة بفاتورة (debt, pay)
    payments.forEach(payment => {
      // تخطي المدفوعات المرتبطة بفاتورة لأنها ستظهر مع الفاتورة
      if (payment.module === "invoices") return;

      let label = "";
      let type = payment.module;
      let amount = payment.amount || 0;

      switch (payment.module) {
        case "debt":
          label = "سداد مديونية";
          type = "debt";
          break;
        case "pay":
          label = "دفعة مستلمة";
          type = "pay";
          break;
        default:
          label = payment.module || "حركة أخرى";
      }

      logs.push({
        date: payment.transactionDate || payment.createdAt,
        type: type,
        label: label,
        amount: amount,
        paid: payment.moneyFlow === "incoming" ? amount : 0,
        paymentMethod: payment.paymentMethod,
        paymentDetails: payment,
        note: payment.notes,
        details: null,
        moneyFlow: payment.moneyFlow,
        cheque: payment.cheque,
        walletInfo: payment.walletInfo,
        bankInfo: payment.bankInfo,
        isSinglePayment: true
      });
    });

    // 2. معالجة الفواتير مع مدفوعاتها
    invoices.forEach((invoiceDetail) => {
      // جلب المدفوعات المرتبطة بهذه الفاتورة من groupedPayments
      const invoicePayments = groupedPayments[invoiceDetail._id] || [];
      
      // حساب إجمالي المدفوعات من Payment model
      const totalPaidFromPayments = invoicePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      // حساب إجمالي المدفوعات من حقل payment في الفاتورة (للتوافق مع الإصدارات السابقة)
      const paidFromInvoice = invoiceDetail.payment?.reduce((sum, p) => sum + (p.paidAmount || 0), 0) || 0;
       const invoiceReturns = invoiceDetail.returns || [];
      
      // استخدام أكبر قيمة (تفادي الازدواجية)
      const totalPaid = Math.max(totalPaidFromPayments, paidFromInvoice);

      logs.push({
        date: invoiceDetail.invoiceDate || invoiceDetail.createdAt,
        invoiceReturns: invoiceReturns,
        type: "invoice",
        label: `فاتورة بيع رقم (${invoiceDetail.invoiceNumber || "---"})`,
        amount: invoiceDetail.finalPrice || 0,
        paid: totalPaid,
        note: invoiceDetail.adminNote,
        details: invoiceDetail,
        moneyFlow: "incoming",
        isInvoiceGrouped: true,
        invoicePayments: invoicePayments, // المدفوعات المرتبطة من Payment
        invoicePaymentMethods: invoiceDetail.payment || [] // للمتوافقية مع الإصدارات السابقة
      });
    });

    // 3. إضافة الرصيد الافتتاحي
    if (customerData.openningBalance !== undefined && customerData.openningBalance !== null) {
      logs.push({
        date: customerData.openningBalanceDate || customerData.createdAt || new Date(),
        type: "opening",
        label: "رصيد افتتاحي",
        amount: customerData.openningBalance,
        paid: 0,
        note: customerData.notes || "رصيد أول المدة",
        details: null,
        isOpening: true,
        previousBalance: 0
      });
    }

    return logs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [customerData, payments, groupedPayments, invoicesMap]);

  const filteredLog = useMemo(() => {
    return combinedLog.filter((item) => {
      if (!fromDate && !toDate) return true;
      const itemDate = new Date(item.date);
      if (fromDate && itemDate < new Date(fromDate)) return false;
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        if (itemDate > end) return false;
      }
      return true;
    });
  }, [combinedLog, fromDate, toDate]);

  const sequentialLedger = useMemo(() => {
    let runningBalance = 0;

    return filteredLog.map((op) => {
      const isInvoice = op.type === "invoice";
      const isPay = op.type === "debt";
      const isDebt = op.type === "pay";
      const isOpening = op.type === "opening";

      let previousBalance = runningBalance;
      let debtAdded = 0;
      let paymentReceived = 0;
      let currentInvoiceAmount = 0;
      let paymentReceivedInvoice = 0;

      if (isOpening) {
        debtAdded = op.amount;
        currentInvoiceAmount = op.amount;
        paymentReceived = 0;
        previousBalance = 0;
      } else if (isInvoice) {
        paymentReceivedInvoice = op.paid || 0;
        const invoiceTotal = op.details?.finalPrice || op.amount || 0;

        paymentReceived = 0;
        debtAdded = invoiceTotal - (op.paid || 0);
        currentInvoiceAmount = invoiceTotal;
      } else if (isDebt) {
        debtAdded = op.amount || 0;
        paymentReceived = 0;
        currentInvoiceAmount = op.amount;
      } else if (isPay) {
        debtAdded = 0;
        paymentReceived = op.amount || 0;
        currentInvoiceAmount = 0;
      }

      runningBalance = previousBalance + debtAdded - paymentReceived;

      return {
        ...op,
        previousBalance,
        grossAmount: op.amount || 0,
        currentInvoiceAmount,
        debtAdded,
        paymentReceived,
        paymentReceivedInvoice,
        balance: runningBalance,
      };
    });
  }, [filteredLog]);

  const totals = useMemo(() => {
    let totalInvoices = 0;
    let totalInvoicePayment = 0;
    let totalPayments = 0;
    let totalDebts = 0;
    let openingBalance = 0;

    sequentialLedger.forEach(op => {
      if (op.type === "opening") {
        openingBalance = op.amount || 0;
      } else if (op.type === "invoice") {
        totalInvoices += op.grossAmount || 0;
        totalInvoicePayment += op.paymentReceivedInvoice || 0;
      } else if (op.type === "debt") {
        totalPayments += op.amount || 0;
      } else if (op.type === "pay") {
        totalDebts += op.amount || 0;
      }
    });

    return {
      totalInvoices,
      totalPayments,
      totalDebts,
      openingBalance,
      totalInvoicePayment
    };
  }, [sequentialLedger]);

  const handleSharePDF = async () => {
    const element = document.getElementById('invoice-capture');
    const arabicFileName = `${customerData?.name || 'العميل'}.pdf`;

    const options = {
      margin: 10,
      filename: arabicFileName,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: {
        unit: 'mm',
        format: [350, 500],
        orientation: 'landscape'
      }
    };

    try {
      setSharing(true);
      const pdfBlob = await html2pdf().set(options).from(element).output('blob');
      const file = new File([pdfBlob], arabicFileName, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${customerData?.name}`,
          text: `مرفق كشف الحساب التفصيلي الموحد للسيد العميل: ${customerData?.name}`
        });
      } else {
        html2pdf().set(options).from(element).save();
      }
    } catch (error) {
      console.error("Error sharing PDF:", error);
      alert("حدث خطأ أثناء محاولة مشاركة الملف.");
    } finally {
      setSharing(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold">جاري التحميل...</div>;

  return (
    <div id='invoice' className="p-4 mx-auto text-right" dir="rtl">
      <div className="text-md no-print mb-6 flex flex-col md:flex-row justify-between items-center bg-gray-100 p-4 rounded gap-4">
        <h2 className="font-bold">كشف حساب موحد: {customerData?.name}</h2>

        <div className="grid lg:grid-cols-2 gap-2 w-full md:w-auto">
          <button
            onClick={() => window.print()}
            className="bg-black text-white px-5 py-2 rounded font-bold hover:bg-gray-800 transition-all text-md flex-1 md:flex-none"
          >
            طباعة الكشف
          </button>
          <button
            onClick={handleSharePDF}
            disabled={sharing}
            className="bg-green-700 text-white px-5 py-2 rounded font-bold hover:bg-green-800 transition-all text-md flex-1 md:flex-none disabled:opacity-50"
          >
            {sharing ? "جاري التجهيز..." : "مشاركة كـ PDF"}
          </button>
        </div>

        <div className="no-print flex gap-3 items-center w-full md:w-auto justify-end">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border p-2 rounded text-md"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border p-2 rounded text-md"
          />
          <button
            onClick={() => {
              setFromDate("");
              setToDate("");
            }}
            className="bg-gray-500 text-white px-4 py-2 rounded text-md whitespace-nowrap"
          >
            إلغاء التصفية
          </button>
        </div>
      </div>

      <div id="invoice-capture" className="bg-white p-8 border-2 border-black print:border-0 print:p-0" dir="rtl">
        <div className="flex justify-between items-start border-b-4 border-black pb-4 mb-8">
          <div className="text-right">
            <h1 className="text-3xl font-bold">
              {settings.invoiceFactoryName}
            </h1>
            <p className="font-bold mt-1">
              كشف حساب تفصيلي وحركة الفواتير و تتبع المدفوعات
            </p>
          </div>

          <div className="text-left text-md font-bold">
            <p>تاريخ الاستخراج:</p>
            <p>
              {new Date().toLocaleString("ar-EG", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div className="mb-8 border-r-4 border-black pr-4 space-y-1">
          <p className="text-2xl font-bold text-gray-900">اسم العميل: {customerData?.name || "---"}</p>

          {(() => {
            const currentBalance = customerData?.balance || 0;
            return (
              <p className="text-md text-slate-800">
                <span className="font-bold">الرصيد الحالي: </span>
                <span className="font-bold text-black">
                  {(currentBalance).toLocaleString()}
                </span>
              </p>
            );
          })()}
        </div>

        <table className="w-full border-collapse border-2 border-black text-right text-md">
          <thead>
            <tr className="bg-gray-200 text-black font-bold text-center border-b-2 border-black">
              <th className="border border-black p-2 w-32">التاريخ والوقت</th>
              <th className="border border-black p-2 w-28">رصيد السابق</th>
              <th className="border border-black p-2">بيان الحركة وتفاصيل الأصناف</th>
              <th className="border border-black p-2 w-36">تفاصيل الحساب</th>
              <th className="border border-black p-2 w-24">استلام دفعه</th>
              <th className="border border-black p-2 w-28 font-bold bg-slate-100 text-black">المرحل</th>
              <th className="border border-black p-2 w-28 font-bold bg-gray-300 text-black">الرصيد الجاري</th>
            </tr>
          </thead>
          <tbody>
            {sequentialLedger.map((op, i) => {
              const isInvoice = op.type === "invoice";
              const isPay = op.type === "debt";
              const isDebt = op.type === "pay";
              const isOpening = op.type === "opening";

              return (
                <React.Fragment key={i}>
                  <tr className={`border-t border-black align-top ${isInvoice ? 'bg-white' : 'bg-gray-50'}`}>
                    {!isOpening && (
                      <td className="border border-black p-2 text-center font-bold text-black leading-relaxed">
                        {new Date(op.date).toLocaleString("ar-EG", {
                          weekday: "short",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true
                        })}
                      </td>
                    )}
                    {isOpening && (
                      <td className="border border-black p-2 text-center font-bold text-black leading-relaxed">
                        منذ البدايه
                      </td>
                    )}

                    <td className="border border-black p-2 text-center font-bold text-black bg-gray-50/50">
                      {isOpening ? "0 " : formatAmount(op.previousBalance)}
                    </td>

                    <td className="border border-black p-2">
                      <div className="font-bold text-md text-slate-900 mb-1">{op.label}</div>

                      {isInvoice && op.details?.items && (
                        <div className="mt-1 w-full">
                          <table className="w-full text-right text-[14px] border border-gray-300 border-collapse">
                            <thead>
                              <tr className="bg-gray-50 text-black font-bold border-b border-gray-300 text-center">
                                <th className="p-1 border-l border-gray-300 text-right">الصنف</th>
                                <th className="p-1 border-l border-gray-300 text-center">الوحدة</th>
                                <th className="p-1 border-l border-gray-300 text-center">الكمية</th>
                                <th className="p-1 border-l border-gray-300 text-center">السعر</th>
                                <th className="p-1 text-left pl-2">الإجمالي</th>
                              </tr>
                            </thead>
                            <tbody>
                              {op.details.items.map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/30">
                                  <td className="p-2 font-bold text-black border-l border-gray-200">
                                    {item.productName || "غير معروف"}
                                  </td>
                                  <td className="p-2 border-l border-gray-200 text-black text-center text-md">
                                    {item.unit_type || "-"}
                                  </td>
                                  <td className="p-2 border-l border-gray-200 text-black text-center text-md">
                                    {item.quantity?.toLocaleString() || 0}
                                  </td>
                                  <td className="p-2 text-center border-l border-gray-200 font-medium">
                                    {formatAmount(item.price)}
                                  </td>
                                  <td className="p-2 text-left font-bold text-black">
                                    {formatAmount(item.subtotal ?? (item.quantity * item.price))}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="font-bold border-t-2 border-gray-400 bg-gray-50">
                                <td className="p-1 text-right" colSpan={4}>
                                  <div className="flex justify-between px-2">
                                    <span>الإجمالي قبل الخصم</span>
                                    <span>{formatAmount(op.details.totalPrice)}</span>
                                  </div>
                                  {op.details.discount > 0 && (
                                    <div className="flex justify-between px-2 mt-1">
                                      <span>الخصم ({op.details.discount}%)</span>
                                      <span>
                                        -{formatAmount(
                                          (op.details.totalPrice * op.details.discount) / 100
                                        )}
                                      </span>
                                    </div>
                                  )}
                                </td>
                                <td className="p-2 text-left text-base text-slate-900">
                                  {formatAmount(op.details.finalPrice)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}

                      {isInvoice && op.invoiceReturns?.length > 0 && (
  <div className="mt-3 border-2 border-black p-3">

    <div className="font-bold text-md mb-2">
      مرتجع الفاتورة
    </div>

    {op.invoiceReturns.map((ret, returnIndex) => (
      <div
        key={ret._id || returnIndex}
        className="border-t border-gray-300 pt-2 mt-2"
      >

        <div className="flex justify-between font-bold text-sm mb-2">
          <span>
            رقم المرتجع: {ret.returnNumber || "---"}
          </span>

          <span>
            {ret.returnDate
              ? new Date(ret.returnDate).toLocaleDateString("ar-EG")
              : "---"}
          </span>
        </div>

        <table className="w-full text-right text-[13px] border border-gray-300 border-collapse">

          <thead>
            <tr className="bg-gray-100 font-bold text-center">
              <th className="p-1 border border-gray-300">
                الصنف
              </th>

              <th className="p-1 border border-gray-300">
                الكمية المرتجعة
              </th>

              <th className="p-1 border border-gray-300">
                السعر
              </th>

              <th className="p-1 border border-gray-300">
                الإجمالي
              </th>
            </tr>
          </thead>

          <tbody>
            {ret.items?.map((item, itemIndex) => (
              <tr key={item._id || itemIndex}>

                <td className="p-1 border border-gray-300 font-bold">
                  {item.productName || "غير معروف"}
                </td>

                <td className="p-1 border border-gray-300 text-center">
                  {Number(item.returnQuantity || 0).toLocaleString()}
                </td>

                <td className="p-1 border border-gray-300 text-center">
                  {formatAmount(item.price)}
                </td>

                <td className="p-1 border border-gray-300 text-left font-bold">
                  {formatAmount(item.subtotal)}
                </td>

              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="bg-gray-100 font-bold">
              <td
                colSpan={3}
                className="p-2 border border-gray-300 text-right"
              >
                إجمالي المرتجع
              </td>

              <td className="p-2 border border-gray-300 text-left">
                {formatAmount(ret.totalAmount)}
              </td>
            </tr>
          </tfoot>

        </table>

        {ret.note && (
          <div className="text-xs text-gray-600 mt-2">
            <b>ملاحظة:</b> {ret.note}
          </div>
        )}

      </div>
    ))}

  </div>
)}

                      {isPay && op.paymentDetails && (
                        <div className="mt-2 text-sm text-center leading-relaxed">
                          {(() => {
                            const paymentDisplay = getPaymentDisplay(op.paymentDetails, "receive");
                            return (
                              <div>
                                <div className="font-bold text-md">
                                  {paymentDisplay.title} - {paymentDisplay.methodName}
                                </div>
                                {paymentDisplay.details && (
                                  <div className="text-sm font-bold mt-0.5">
                                    {paymentDisplay.details}
                                  </div>
                                )}
                                {op.note && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    {op.note}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {isDebt && (
                        <div className="mt-2 text-sm text-center leading-relaxed">
                          {(() => {
                            const paymentDisplay = getPaymentDisplay(op.paymentDetails || op, "send");
                            return (
                              <div>
                                <div className="font-bold text-md">
                                  {paymentDisplay.title} - {paymentDisplay.methodName}
                                </div>
                                {paymentDisplay.details && (
                                  <div className="text-sm font-bold mt-0.5">
                                    {paymentDisplay.details}
                                  </div>
                                )}
                                {op.note && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    {op.note}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {isOpening && (
                        <div className="mt-2 text-sm text-700 font-bold">
                          {op.note || "رصيد أول المدة"}
                        </div>
                      )}
                    </td>

                    <td className="border border-black p-2 text-right text-md bg-50/5 pt-3">
                      {(isInvoice || isDebt || isOpening || isPay) ? (
                        <div className="space-y-1 text-right">
                          <div className="text-[14px] font-bold text-black">
                            {isInvoice && <b>رصيد سابق : </b>}
                            {isInvoice && formatAmount(op.previousBalance)}
                          </div>
                          <div className="text-[14px] font-bold text-black">
                            {isInvoice && (
                              <><b>قيمه الفاتورة: </b>{formatAmount(op.currentInvoiceAmount)}</>
                            )}
                          </div>
                          {isOpening &&
                            <div className="text-[14px] font-bold text-slate-800 border-t border-dashed pt-1 mt-1">
                              <b>{"الرصيد بعد الإضافة"}: </b>
                              {formatAmount(op.currentInvoiceAmount)}
                            </div>}

                          {isInvoice &&
                            <div className="text-[14px] font-bold text-slate-800 border-t border-dashed pt-1 mt-1">
                              <b>{"الاجمالي "}: </b>
                              {formatAmount(op.previousBalance + op.currentInvoiceAmount)}
                            </div>}

                          {!isInvoice && !isOpening &&
                            <div className="text-[14px] font-bold text-slate-800 border-t border-dashed pt-1 mt-1 text-center">
                              ----
                            </div>}
                        </div>
                      ) : "-"}
                    </td>

                    <td className="border border-black p-2 text-center font-bold text-slate-700 text-md bg-slate-50/5 pt-3">
                      {/* فاتورة - عرض كل وسيلة دفع ومبلغها */}
                      {isInvoice && (() => {
                        // استخدام المدفوعات من Payment model الجديد
                        const paymentsList = op.invoicePayments || [];
                        const totalPayment = paymentsList.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

                        if (totalPayment === 0) return (
                          <span className="text-gray-400 text-sm">لا توجد دفعات</span>
                        );

                        return (
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-bold text-md ">
                              {formatAmount(totalPayment)}
                            </span>

                            <div className="w-full border-t border-gray-200 mt-1 pt-1 space-y-1">
                              {paymentsList.map((p, idx) => {
                                const amount = p.amount || 0;
                                const paymentDisplay = getPaymentDisplay(p, "receive");

                                return (
                                  <div
                                    key={`payment-${idx}`}
                                    className="text-[13px] text-slate-700 text-center py-1 border-b border-gray-100 last:border-0"
                                  >
                                    <div className="font-bold">
                                      {formatAmount(amount)} ({paymentDisplay.methodName})
                                    </div>

                                    {paymentDisplay.details && (
                                      <div className="text-[12px] text-slate-500">
                                        {paymentDisplay.details}
                                      </div>
                                    )}

                                    {p.notes && (
                                      <div className="text-[12px] text-gray-400">
                                        {p.notes}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* استلام فلوس (pay) */}
                      {isPay && Number(op.amount) !== 0 && (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-bold text-md ">
                            {formatAmount(op.amount)}
                            <div className="text-sm font-normal text-gray-600">
                              ({translatePaymentMethod(op.paymentMethod)})
                            </div>
                          </span>
                        </div>
                      )}

                      {/* زيادة مديونية للعميل (debt) */}
                      {isDebt && Number(op.amount) !== 0 && (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-bold text-md ">
                            {formatAmount(op.amount)}
                            <div className="text-sm font-normal text-gray-600">
                              ({translatePaymentMethod(op.paymentMethod)})
                            </div>
                          </span>
                        </div>
                      )}

                      {/* الرصيد الافتتاحي */}
                      {isOpening && Number(op.amount) !== 0 && (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-bold text-md ">
                            {formatAmount(op.amount)}
                          </span>
                          <span className="text-[13px] font-bold block text-gray-500">
                            (رصيد افتتاحي)
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="border border-black p-2 text-left font-bold bg-slate-50 text-md pl-2 pt-3">
                      {(() => {
                        const diff = (op.debtAdded || 0) - (op.paymentReceived || 0);
                        return (
                          <span>
                            {formatAmount(diff)}
                          </span>
                        );
                      })()}
                    </td>

                    <td className="border border-black p-2 text-left font-bold bg-gray-200 text-md pl-2 text-black pt-3">
                      {formatAmount(op.balance)}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {(() => {
          const openingBalance = totals.openingBalance || 0;
          const debts = totals.totalDebts || 0;

          const totalDebt = debts;
          const totalPayment = 0;

          const totalReceived = (totals.totalInvoicePayment || 0) + (totals.totalPayments || 0);

          const finalBalance =
            openingBalance +
            (totals.totalInvoices || 0) +
            debts -
            totalReceived;

          return (
            <div className="mt-10 flex justify-end">
              <div className="border-4 border-black min-w-[400px]">
                <div className="bg-black text-white p-3 text-center font-bold">
                  ملخص كشف الحساب
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-bold">الرصيد الافتتاحي</span>
                    <span className="font-bold">{openingBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-bold">إجمالي قيمة الفواتير</span>
                    <span className="font-bold">{(totals.totalInvoices).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between border-b pb-2">
                    <span className="font-bold">إجمالي الفلوس المستلمة</span>
                    <span className="font-bold ">{(-totalReceived).toLocaleString()}</span>
                  </div>

                  {(totalDebt > 0 || totalPayment > 0) && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-bold">
                        {openingBalance < 0 ? "إجمالي السداد" : "إجمالي المديونية"}
                      </span>
                      <span className="font-bold">
                        {(openingBalance < 0 ? -totalPayment : totalDebt).toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xl pt-3 border-t-2 border-black">
                    <span className="font-bold">المتبقي النهائي</span>
                    <span className={`font-bold `}>
                      {(finalBalance).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
};

export default InvoiceStatement;