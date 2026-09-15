// import { useEffect, useState } from "react";
// import { FaSpinner, FaBox, FaSearch, FaTimes, FaChartPie, FaListOl, FaInfoCircle } from "react-icons/fa";
// import api from "../../../services/api";

// export default function MaybeSellProducts() {
//   const [products, setProducts] = useState([]);
//   const [filteredProducts, setFilteredProducts] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");

//   const fetchProducts = async () => {
//     try {
//       setLoading(true);
//       const res = await api.get("/order/maybesell");
//       // تأمين جلب البيانات لتفادي أي خطأ إذا كانت القيمة غير معرفة
//       const data = res.data?.product || [];
//       setProducts(data);
//       setFilteredProducts(data); 
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchProducts();
//   }, []);

//   // منطق البحث الذكي (يبحث في الاسم والوصف والـ ID)
//   useEffect(() => {
//     const results = products?.filter(product =>
//       product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       product._id?.toLowerCase().includes(searchTerm.toLowerCase())
//     );
//     setFilteredProducts(results || []);
//   }, [searchTerm, products]);

//   return (
//     <div className="p-6 bg-slate-50 min-h-screen font-" dir="rtl">
      
//       {/* ─── الهيدر العلوي العصري ─── */}
//       <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
//         <div>
//           <div className="flex items-center gap-2.5 mb-1">
//             <div className="p-2 bg-blue-50 rounded-xl text-blue-500">
//               <FaChartPie className="text-2xl" />
//             </div>
//             <h2 className="text-2xl font-black text-slate-800 tracking-tight">
//               سجل المنتجات المقترحة
//             </h2>
//           </div>
//           <p className="text-slate-400 text-sm font-medium mr-11">عرض وتحليل قائمة المنتجات ذات احتمالية البيع المستقبلية العالية</p>
//         </div>

//         {/* حقل البحث المتطور مع زر الحذف */}
//         <div className="relative w-full lg:w-96">
//           <span className="absolute inset-y-0 right-4 flex items-center text-slate-400">
//             <FaSearch className="text-sm" />
//           </span>
//           <input
//             type="text"
//             placeholder="ابحث باسم المنتج، الوصف أو الكود..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full pr-11 pl-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-700 placeholder-slate-400"
//           />
//           {searchTerm && (
//             <button 
//               onClick={() => setSearchTerm("")}
//               className="absolute inset-y-0 left-3 flex items-center text-slate-400 hover:text-red-500 transition-colors"
//             >
//               <FaTimes className="text-md" />
//             </button>
//           )}
//         </div>
//       </div>

//       {/* ─── كروت المؤشرات السريعة ─── */}
//       {!loading && products.length > 0 && (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
//           {/* كارت إجمالي المنتجات المقترحة */}
//           <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
//             <div>
//               <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">إجمالي المنتجات المحتملة</p>
//               <h3 className="text-2xl font-black text-slate-800">{filteredProducts.length} صنف مقترح</h3>
//             </div>
//             <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl">
//               <FaBox />
//             </div>
//           </div>

//           {/* كارت حالة التنبؤ الذكي */}
//           <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
//             <div>
//               <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">طبيعة البيانات</p>
//               <h3 className="text-lg font-bold text-emerald-600 flex items-center gap-1.5 mt-1">
//                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
//                 مؤشرات حركة مخزون نشطة
//               </h3>
//             </div>
//             <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl">
//               <FaInfoCircle />
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ─── منطقة الجدول والبيانات ─── */}
//       <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
        
//         {loading ? (
//           <div className="flex flex-col justify-center items-center h-80 space-y-4">
//             <FaSpinner className="animate-spin text-blue-500 text-4xl" />
//             <p className="text-slate-500 text-sm font-semibold">جاري جلب وتحليل قائمة المنتجات...</p>
//           </div>
//         ) : filteredProducts.length === 0 ? (
//           <div className="text-center py-28 text-slate-400">
//              <FaBox className="mx-auto mb-4 opacity-20 text-6xl text-slate-400" />
//              <p className="text-base font-medium text-slate-500">
//                {searchTerm ? `لا توجد نتائج مطابقة للبحث عن "${searchTerm}"` : "لا توجد بيانات مسجلة حالياً"}
//              </p>
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full text-right border-collapse">
//               <thead>
//                 <tr className="bg-slate-50/70 border-b border-slate-100">
//                   <th className="p-4 text-slate-500 font-bold text-xs uppercase tracking-wider text-center w-24">الرقم</th>
//                   <th className="p-4 text-slate-500 font-bold text-xs uppercase tracking-wider">تفاصيل المنتج المحتمل</th>
//                   <th className="p-4 text-slate-500 font-bold text-xs uppercase tracking-wider text-center">حالة المؤشر</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-100">
//                 {filteredProducts.map((product, index) => (
//                   <tr 
//                     key={product._id} 
//                     className="group hover:bg-slate-50/80 transition-all duration-150"
//                   >
//                     {/* الترتيب الرقمي المنسق */}
//                     <td className="p-4 text-center">
//                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold bg-slate-50 text-slate-500 border border-slate-100 shadow-sm">
//                          {index + 1}
//                        </span>
//                     </td>

//                     {/* تفاصيل المنتج (اسم، وصف، ID) */}
//                     <td className="p-4">
//                       <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors text-sm uppercase">
//                         {product.productName}
//                       </div>
//                       {product.description && (
//                         <div className="text-xs text-slate-400 mt-1 font-medium max-w-xl truncate">
//                           {product.description}
//                         </div>
//                       )}

//                     </td>

                 
//                     <td className="p-4 text-center">
//                       <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">
//                         <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
//                         احتمالية بيع قوية
//                       </span>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}

//         {/* ─── الفوتر السفلي للجدول ─── */}
//         <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs font-bold text-slate-400">
//           <div className="flex items-center gap-1">
//             <FaListOl className="text-slate-400 text-sm" />
//             <span>إجمالي النتائج الحالية: {filteredProducts.length} صنف</span>
//           </div>
//           <span className="bg-white px-3 py-1 border border-slate-200 rounded-full shadow-sm text-slate-500 font-medium">
//              تحليل قائم على أنماط وسلوك الطلبيات السابقة
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// }