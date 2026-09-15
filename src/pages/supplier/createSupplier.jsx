import React, { useState } from "react";
import {
  UserPlus,
  Phone,
  DollarSign,
  FileText,
  Save,
} from "lucide-react";
import api from "../../services/api";
import { showAlert } from "../../services/alert";
import { useNavigate } from "react-router-dom";

const AddSupplierFormSUP = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    openBalance: 0,

    // aleina = المورد له فلوس عندنا = موجب
    // lena = المورد عليه فلوس لنا = سالب
    balanceType: "aleina",

    notes: "",
  });

  // =========================
  // تغيير الحقول
  // =========================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "openBalance"
          ? Number(value)
          : value,
    }));
  };

  // =========================
  // تغيير نوع الرصيد
  // =========================

  const handleBalanceTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      balanceType: type,
    }));
  };

  // =========================
  // حفظ المورد
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // =========================
    // Validation
    // =========================

    if (
      !formData.name ||
      formData.name.trim().length < 2
    ) {
      return showAlert({
        title:
          "برجاء إدخال اسم المورد بشكل صحيح (حرفين على الأقل)",
        icon: "warning",
      });
    }

    if (
      !formData.phone ||
      formData.phone.trim().length === 0
    ) {
      return showAlert({
        title:
          "رقم الهاتف مطلوب لتسجيل المورد",
        icon: "warning",
      });
    }

    // منع إدخال قيمة سالبة يدويًا
    if (Number(formData.openBalance) < 0) {
      return showAlert({
        title:
          "برجاء إدخال قيمة الرصيد بدون إشارة سالبة، وحدد نوع الرصيد من الأزرار",
        icon: "warning",
      });
    }

    setLoading(true);

    try {
      // =========================
      // قيمة الرصيد
      // =========================

      const balanceAmount = Math.abs(
        Number(formData.openBalance) || 0
      );

      /*
        قاعدة النظام:

        + الموجب:
        المورد له فلوس عندنا
        يعني المورد لهفلوس للمورد

        - السالب:
        المورد عليه فلوس لنا
        يعني المورد عليه فلوس عند المورد
      */

      const finalOpenBalance =
        formData.balanceType === "aleina"
          ? balanceAmount
          : -balanceAmount;

      // =========================
      // البيانات التي سيتم إرسالها
      // =========================

      const dataToSend = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        openBalance: finalOpenBalance,
        notes: formData.notes.trim(),
      };

      // =========================
      // API
      // =========================

      const response = await api.post(
        "/suppliers",
        dataToSend
      );

      // =========================
      // Reset Form
      // =========================

      setFormData({
        name: "",
        phone: "",
        openBalance: 0,
        balanceType: "aleina",
        notes: "",
      });

      // =========================
      // Success
      // =========================

      showAlert({
        title:
          response.data.message ||
          "تم إضافة المورد بنجاح",
        icon: "success",
      });

      // لو عايز تنتقل بعد الحفظ:
      // navigate("/suppliers");

    } catch (err) {
      showAlert({
        title:
          err.response?.data?.message ||
          "حدث خطأ أثناء إضافة المورد",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full mx-auto p-4 lg:p-8 bg-ligth/10"
      dir="rtl"
    >
      <div className="mx-auto bg-white rounded-2xl border border-brwonLight shadow-sm overflow-hidden">

        {/* =========================
            Header
        ========================= */}

        <div className="bg-ligth p-5 border-b border-brwonLight flex items-center gap-3">

          <div className="p-2.5 bg-brown rounded-md text-white">
            <UserPlus size={22} />
          </div>

          <div>
            <h3 className="text-lg font-black text-dark">
              تسجيل مورد
            </h3>

            <p className="text-xs font-bold text-brown/80 mt-0.5">
              إضافة بيانات المورد الجديدة وربط رصيده
              الافتتاحي بالمنظومة الماليّة
            </p>
          </div>

        </div>

        {/* =========================
            Form
        ========================= */}

        <form
          onSubmit={handleSubmit}
          className="p-6 gap-5 text-right grid md:grid-cols-2"
        >

          {/* =========================
              اسم المورد
          ========================= */}

          <div className="space-y-1.5">

            <label className="text-sm font-black text-dark block">
              اسم المورد{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <div className="relative">

              <span className="absolute right-3 top-3 text-brown/50 text-xs font-bold">
                الاسم:
              </span>

              <input
                type="text"
                name="name"
                required
                placeholder="أدخل اسم المورد الثنائي أو الثلاثي..."
                className="w-full p-3 pr-14 bg-ligth/20 border border-brown/10 rounded-md outline-none font-bold text-dark focus:border-brown focus:ring-1 focus:ring-brown text-sm"
                value={formData.name}
                onChange={handleChange}
              />

            </div>
          </div>

          {/* =========================
              رقم الهاتف
          ========================= */}

          <div className="space-y-1.5">

            <label className="text-sm font-black text-dark block">
              رقم الهاتف{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <div className="relative">

              <Phone
                className="absolute right-3 top-3.5 text-brown/50"
                size={18}
              />

              <input
                type="text"
                name="phone"
                maxLength={11}
                required
                placeholder="رقم الهاتف للتواصل المباشر..."
                className="w-full p-3 pr-10 bg-ligth/20 border border-brown/10 rounded-md outline-none font-bold text-dark focus:border-brown focus:ring-1 focus:ring-brown text-sm text-left"
                dir="ltr"
                value={formData.phone}
                onChange={handleChange}
              />

            </div>
          </div>

          {/* =========================
              الرصيد الافتتاحي
          ========================= */}

          <div className="space-y-1.5">

            <label className="text-sm font-black text-dark block">
              الرصيد الافتتاحي
            </label>

            <div className="relative">

              <DollarSign
                className="absolute right-3 top-3.5 text-brown/50"
                size={18}
              />

              <input
                type="number"
                name="openBalance"
                min="0"
                step="0.01"
                placeholder="0"
                className="w-full p-3 pr-10 bg-ligth/20 border border-brown/10 rounded-md outline-none font-black text-brown focus:border-brown focus:ring-1 focus:ring-brown text-sm"
                value={
                  formData.openBalance === 0
                    ? ""
                    : Math.abs(formData.openBalance)
                }
                onChange={handleChange}
              />

            </div>

            <p className="text-[11px] text-brown/70 font-bold">
              اكتب قيمة الرصيد فقط، ثم حدد هل المبلغ
              المورد لهللمورد أم لنا عند المورد.
            </p>

          </div>

          {/* =========================
              نوع الرصيد
          ========================= */}

          <div className="space-y-2">

            <label className="text-sm font-black text-dark block">
              حالة الرصيد
            </label>

            <div className="flex items-center gap-2">

              {/* =========================
                  المورد له(+)
              ========================= */}

              <button
                type="button"
                onClick={() =>
                  handleBalanceTypeChange("aleina")
                }
                className={`flex-1 py-3 rounded-md text-sm font-black border transition-all cursor-pointer ${
                  formData.balanceType === "aleina"
                    ? "bg-green-600 text-white border-green-600 shadow-sm"
                    : "bg-ligth/20 text-brown/70 border-brown/10 hover:border-green-500"
                }`}
              >
                المورد له(+)
              </button>

              {/* =========================
                  المورد عليه (-)
              ========================= */}

              <button
                type="button"
                onClick={() =>
                  handleBalanceTypeChange("lena")
                }
                className={`flex-1 py-3 rounded-md text-sm font-black border transition-all cursor-pointer ${
                  formData.balanceType === "lena"
                    ? "bg-red-600 text-white border-red-600 shadow-sm"
                    : "bg-ligth/20 text-brown/70 border-brown/10 hover:border-red-500"
                }`}
              >
                المورد عليه (-)
              </button>

            </div>

            {/* =========================
                شرح الحالة
            ========================= */}

            <p className="text-[11px] font-bold">

              {formData.balanceType === "aleina" ? (

                <span className="text-green-600">
                  الموجب (+): المورد له فلوس عندنا
                  — المورد لهفلوس للمورد
                </span>

              ) : (

                <span className="text-red-600">
                  السالب (-): المورد عليه فلوس لنا
                  — المورد عليه فلوس عند المورد
                </span>

              )}

            </p>

          </div>

          {/* =========================
              ملاحظات
          ========================= */}

          <div className="space-y-1.5 md:col-span-2">

            <label className="text-sm font-black text-dark block">
              ملاحظات عن المورد
            </label>

            <div className="relative">

              <FileText
                className="absolute right-3 top-3.5 text-brown/50"
                size={18}
              />

              <textarea
                name="notes"
                placeholder="أي ملاحظات إضافية تخص المورد..."
                rows="3"
                className="w-full p-3 pr-10 bg-ligth/20 border border-brown/10 rounded-md outline-none font-bold text-dark focus:border-brown focus:ring-1 focus:ring-brown text-sm"
                value={formData.notes}
                onChange={handleChange}
              />

            </div>

          </div>

          {/* =========================
              زر الحفظ
          ========================= */}

          <div className="md:col-span-2 pt-4 border-t border-ligth">

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brown hover:bg-brown/90 text-white p-3.5 rounded-md font-black text-base flex items-center justify-center gap-2 shadow-md disabled:opacity-50 transition-all cursor-pointer"
            >

              {loading ? (

                "جاري حفظ بيانات المورد الجديد..."

              ) : (

                <>
                  <Save size={20} />

                  حفظ وتأكيد تسجيل المورد بالمنظومة
                </>

              )}

            </button>

          </div>

        </form>

      </div>
    </div>
  );
};

export default AddSupplierFormSUP;