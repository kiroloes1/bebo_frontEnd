import { useState } from "react";

import { 
  FaCloudUploadAlt, FaBox, FaPlus, FaCheckCircle, 
  FaExclamationTriangle, FaSpinner, FaInfoCircle, FaTimesCircle
} from "react-icons/fa";
import api from "../../services/api";
import { showAlert } from "../../services/alert";

export default function ProductManager() {
  const [form, setForm] = useState({
     productName: "", description: "", category: "",
    unit_type: "قطعة", unitsPerPackage: "", availableQuantity: "",
    packageSellingPrice: "", pieceSellingPrice: "", purchasePrice: "",
    imageUrl: "", expiration: "", companyName: ""
  });
  const [file, setFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  
  const [result, setResult] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async () => {
    let res;
    try {
      setLoading(true);
      setResult(null);

      if (
        form.pieceSellingPrice == 0 ||
        form.purchasePrice == 0 ||
        form.availableQuantity == 0 ||
        
        !form.expiration ||
        (form.unit_type == "كرتونة" && form.packageSellingPrice == 0)
      ) {
        return showAlert({
          title: "يجب ملء جميع الحقول",
          icon: "error"
        });
      }

      if (
        (form.pieceSellingPrice < 0 || form.purchasePrice < 0) || 
        (form.packageSellingPrice < 0 || form.unitsPerPackage < 0 || form.availableQuantity < 0)
      ) {
        return showAlert({
          title: "يجب ان لا يحتوي اي حقل علي ارقام بالسالب",
          icon: "error"
        });
      }

      if (form.unit_type == 'كرتونة') {
        res = await api.post("/product", {
          ...form,
          unitsPerPackage: Number(form.unitsPerPackage),
          availableQuantity: Number(form.availableQuantity),
          packageSellingPrice: Number(form.packageSellingPrice),
          pieceSellingPrice: Number(form.pieceSellingPrice),
          purchasePrice: Number(form.purchasePrice),
          imageUrl: form.imageUrl || "",
          expiration: form.expiration,
          companyName: form.companyName || ""
        });
      } else {
        res = await api.post("/product", {
          ...form,
          unitsPerPackage: Number(1),
          availableQuantity: Number(form.availableQuantity),
          packageSellingPrice: Number(form.pieceSellingPrice),
          pieceSellingPrice: Number(form.pieceSellingPrice),
          purchasePrice: Number(form.purchasePrice),
          imageUrl: form.imageUrl || "",
          expiration: form.expiration,
          companyName: form.companyName || ""
        });
      }

      if (imageFile) {
        console.log(imageFile);
        await handleImageUpload(res.data.product._id);
      }

      showAlert({ icon: 'success', title: "تم إضافة المنتج بنجاح" });
      setForm({
         productName: "", description: "", category: "",
        unit_type: "قطعة", unitsPerPackage: "", availableQuantity: "",
        packageSellingPrice: "", pieceSellingPrice: "", purchasePrice: "",
        imageUrl: "", expiration: "", companyName: ""
      });
      console.log(imageFile);

    } catch (err) {
      showAlert({ icon: 'error', title: err.response?.data?.message || "فشل في حفظ المنتج" });
    } finally {
      setLoading(false);
    }
  };

  const handleExcelUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      setExcelLoading(true);
      setResult(null);
      const res = await api.post("/product/add-product-from-excel-sheets", formData);
      setResult(res.data);
      showAlert({ icon: 'info', title: `اكتمل الرفع: تم إضافة ${res.data.added} وتجاهل ${res.data.skipped}` });
    } catch (err) {
      showAlert({ icon: 'error', title: "خطأ في معالجة ملف Excel" });
      console.log(err);
      console.log(err.response.data);
    } finally {
      setExcelLoading(false);
    }
  };

  const handleImageUpload = async (id) => {
    if (!imageFile) return;

    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      setImageLoading(true);
      await api.post(`/product/${id}/upload-image`, formData);
    } catch (err) {
      showAlert({ icon: 'error', title: "خطأ في رفع الصورة" });
    } finally {
      setImageLoading(false);
      setImageFile(null);
    }
  };

  return (
    <div className="w-[96vw] overview-auto md:w-full p-4 bg-[#F8FAFC] min-h-screen w-full" dir="rtl">
      <div className="mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <FaBox className="text-blue-600" /> إدارة محتوى المنتجات
            </h1>
            <p className="text-slate-500 text-md mt-1">إضافة واستيراد البيانات للمخزن الرئيسي</p>
          </div>
        </div>

        {/* --- SECTION 1: MANUAL ADD --- */}
        <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
            <span className="text-slate-700 font-bold text-md">إضافة منتج جديد يدوياً</span>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
              {/* <div className="space-y-1">
                <label className="text-md font-bold text-slate-400 mr-1">كود الصنف</label>
                <input name="code" value={form.code} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-md font-bold" placeholder="PRD-000" />
              </div> */}

              <div className="space-y-1 lg:col-span-2">
                <label className="text-md font-bold text-slate-400 mr-1">اسم المنتج</label>
                <input name="productName" value={form.productName} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-md font-bold" placeholder="اسم المنتج..." />
              </div>

              <div className="space-y-1">
                <label className="text-md font-bold text-slate-400 mr-1">الفئة</label>
                <input name="category" value={form.category} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-md font-bold" placeholder="تصنيف" />
              </div>

              <div className="space-y-1">
                <label className="text-md font-bold text-slate-400 mr-1">نوع الوحدة</label>
                <select name="unit_type" value={form.unit_type} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-md font-bold">
                  <option value="قطعة">قطعة</option>
                  <option value="كرتونة">كرتونة</option>
                </select>
              </div>

              {/* Row 2 */}
              {form.unit_type == "كرتونة" && (
                <div className="space-y-1">
                  <label className="text-md font-bold text-slate-400 mr-1">القطع داخل الكرتونة</label>
                  <input min={1} name="unitsPerPackage" type="number" value={form.unitsPerPackage} placeholder="القطع داخل الكرتونة......" onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-md  font-bold" />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-md font-bold text-slate-400 mr-1">الكمية المتاحة</label>
                <input min={0} name="availableQuantity" type="number"  placeholder="الكمية المتاحة..." value={form.availableQuantity} onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-md font-bold" />
              </div>

              <div className="space-y-1 text-orange-600">
                <label className="text-md font-bold text-slate-400 mr-1">سعر الشراء</label>
                <input min={0} name="purchasePrice" placeholder="سعر الشراء...." type="number" value={form.purchasePrice} onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-md  font-bold" />
              </div>

              {form.unit_type == "كرتونة" && (
                <div className="space-y-1 text-blue-600">
                  <label className="text-md font-bold text-slate-400 mr-1">بيع الكرتونة</label>
                  <input min={0} name="packageSellingPrice" type="number" value={form.packageSellingPrice} placeholder="بيع الكرتونة...." onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-md  font-bold" />
                </div>
              )}

              <div className="space-y-1 text-blue-600">
                <label className="text-md font-bold text-slate-400 mr-1">بيع القطعة</label>
                <input min={0} name="pieceSellingPrice" type="number" value={form.pieceSellingPrice} placeholder="بيع القطعة...." onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-md  font-bold" />
              </div>

              {/* ===== NEW FIELDS ===== */}
              <div className="space-y-1 text-purple-600">
                <label className="text-md font-bold text-slate-400 mr-1">اسم الشركة</label>
                <input name="companyName" value={form.companyName} onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-md  font-bold" placeholder="اسم الشركة..." />
              </div>

              <div className="space-y-1 text-red-600">
                <label className="text-md font-bold text-slate-400 mr-1">تاريخ الانتهاء</label>
                <input name="expiration" type="date" value={form.expiration} onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-md  font-bold" />
              </div>
            </div>

            <div className="flex-1 my-4">
              <label className="text-md font-bold text-slate-400 mr-1">اضافه لينك صور المنتج</label>
              <input name="imageUrl" value={form.imageUrl} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-blue-400 my-4" />
            </div>

            <div className="flex-1 my-4">
              <label className="text-md font-bold text-slate-400 mr-1">وصف المنتج</label>
              <textarea name="description" value={form?.description} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-md h-36 outline-none focus:border-blue-400 my-4" />
            </div>

            <div className="p-4 mb-8 bg-blue-50/50 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-emerald-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-md text-white rounded-md-lg">
                  <FaCloudUploadAlt size={24} />
                </div>
                <div>
                  <h3 className="text-emerald-900 font-black text-md">رفع صوره</h3>
                  <p className="text-emerald-700/70 text-md font-medium italic">JPEG, png</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white p-2 rounded-md border border-emerald-100">
                <input type="file" onChange={(e) => setImageFile(e.target.files[0])} className="text-md cursor-pointer text-slate-500" />
              </div>
            </div>

            <div className="mt-4 flex gap-4 items-end">
              <button onClick={handleCreate} disabled={loading} className={`min-w-[180px] cursor-pointer h-12 flex items-center justify-center gap-2 rounded-md text-white font-black rounded-md-md active:scale-95 transition-all ${loading ? "bg-slate-400" : "bg-slate-800 hover:bg-black"}`}>
                {loading ? <FaSpinner className="animate-spin" /> : <><FaPlus /> إضافة للمخزون</>}
              </button>
            </div>
          </div>
        </div>

        {/* --- SECTION 2: EXCEL UPLOAD --- */}
        <div className="bg-white bg-emerald-50/50 overflow-auto rounded-md border border-slate-200">
          <div className="p-4 bg-emerald-50/50 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-emerald-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-600 rounded-md text-white rounded-md-lg">
                <FaCloudUploadAlt size={24} />
              </div>
              <div>
                <h3 className="text-emerald-900 font-black text-md">استيراد من ملف Excel</h3>
                <p className="text-emerald-700/70 text-md font-medium italic">xlsx, xls only</p>
              </div>
            </div>
            <div className="flex cursor-pointer items-center gap-3 bg-white p-2 rounded-md border border-emerald-100">
              <input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files[0])} className="text-md text-slate-500" />
              <button onClick={handleExcelUpload} disabled={excelLoading || !file} className={`px-8 cursor-pointer py-2 rounded-md text-white font-bold text-md transition-all ${excelLoading || !file ? "bg-slate-300" : "bg-emerald-600 hover:bg-emerald-700"}`}>
                {excelLoading ? <FaSpinner className="animate-spin" /> : "معالجة الملف"}
              </button>
            </div>
          </div>

          {/* --- نتائج الرفع --- */}
          {result && (
            <div className="p-6 bg-white animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-md flex items-center gap-4">
                  <FaInfoCircle className="text-blue-500 text-2xl" />
                  <div>
                    <p className="text-md font-bold text-blue-600 uppercase">إجمالي الصفوف</p>
                    <p className="text-xl font-black text-blue-900">{(result.added || 0) + (result.skipped || 0)}</p>
                  </div>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-md flex items-center gap-4">
                  <FaCheckCircle className="text-emerald-500 text-2xl" />
                  <div>
                    <p className="text-md font-bold text-emerald-600 uppercase">تمت إضافتها</p>
                    <p className="text-xl font-black text-emerald-900">{result.added || 0}</p>
                  </div>
                </div>
                <div className="p-4 bg-red-50 border border-red-100 rounded-md flex items-center gap-4">
                  <FaTimesCircle className="text-red-500 text-2xl" />
                  <div>
                    <p className="text-md font-bold text-red-600 uppercase">صفوف تم تجاهلها</p>
                    <p className="text-xl font-black text-red-900">{result.skipped || 0}</p>
                  </div>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="mt-4 border border-slate-100 rounded-md overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center gap-2">
                    <FaExclamationTriangle className="text-orange-500" />
                    <span className="text-sm font-bold text-slate-700">تفاصيل الأخطاء والتكرارات</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto text-[13px]">
                    <table className="w-full text-right border-collapse">
                      <thead className="sticky top-0 bg-white rounded-md-sm">
                        <tr className="text-slate-400 border-b border-slate-50">
                          <th className="p-3 font-black">كود المنتج</th>
                          <th className="p-3 font-black">سبب المشكلة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.errors.map((err, index) => (
                          <tr key={index} className="hover:bg-red-50/30 transition-colors border-b border-slate-50">
                            <td className="p-3 font-bold text-slate-800">{err.product}</td>
                            <td className="p-3 text-red-600 font-medium">
                              {err.reason === "Duplicate code" ? "الكود مكرر في السيستم" : err.reason}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}