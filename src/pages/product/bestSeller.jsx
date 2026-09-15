// import { useState, useEffect, useRef, useCallback } from "react";

// import { 
//   FaEdit, FaTrash, FaImage, FaSpinner, FaSearch, FaBoxOpen, 
//   FaStar, FaFilter, FaTimes, FaSave, FaCamera, FaTrashAlt, FaFileExcel,
//   FaChevronRight, FaChevronLeft, FaBuilding, FaCalendarAlt, FaQrcode
// } from "react-icons/fa";

// import html2canvas from "html2canvas";
// import { jsPDF } from "jspdf";
// import JsBarcode from "jsbarcode";
// import { useNavigate } from "react-router-dom";
// import * as XLSX from "xlsx";
// import api from "../../services/api";
// import { showAlert } from "../../services/alert";
// import { showAlertConfirm } from "../../services/alertConfirm";

// export default function ProductList() {
//   const [products, setProducts] = useState([]);
//   const [categories, setCategories] = useState(["الكل"]);
//   const [loading, setLoading] = useState(true);
//   const [actionLoading, setActionLoading] = useState(null);
//   const fileInputRef = useRef(null);
//   const [filterExpire, setFilterExpire] = useState("الكل");
//   const navigate = useNavigate();

//   const [exportProgress, setExportProgress] = useState(0);
// const [exportTotal, setExportTotal] = useState(0);
// const [showExportModal, setShowExportModal] = useState(false);
  
//   // States للفلترة والـ Pagination (المرتبطة بالباك الجديد)
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filterCategory, setFilterCategory] = useState("الكل");
//   const [filterStatus, setFilterStatus] = useState("الكل");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [totalProducts, setTotalProducts] = useState(0);
//   const [totalExpire, setTotalExpire] = useState(0);
//   const [totalNearExpire, setTotalNearExpire] = useState(0);


  

//   const [itemsLimit] = useState(10); // عدد العناصر في الصفحة الواحدة

//   // States للتعديل
//   const [editModal, setEditModal] = useState(false);
//   const [editingProduct, setEditingProduct] = useState(null);
//   const [newImageFile, setNewImageFile] = useState(null);
//   const [previewImage, setPreviewImage] = useState(null);
//   const [imageDeleted, setImageDeleted] = useState(false);

//   // State لعرض QR Code منفرد
//   const [qrModal, setQrModal] = useState(false);
//   const [qrProduct, setQrProduct] = useState(null);
//   const [qrCodeImage, setQrCodeImage] = useState(null);
//   const [qrLoading, setQrLoading] = useState(false);


//   const generateBarcodeDataURL = (code, { width = 2, height = 60, fontSize = 14, displayValue = false } = {}) => {
//   try {
//     const canvas = document.createElement("canvas");
//     JsBarcode(canvas, String(code), {
//       format: "CODE128",
//       width,
//       height,
//       displayValue,
//       fontSize,
//       margin: 6,
//       background: "#ffffff",
//       lineColor: "#000000",
//     });
//     return canvas.toDataURL("image/png");
//   } catch (err) {
//     console.warn("Barcode generation failed for code:", code, err);
//     return null;
//   }
// };
//   // =========================================
//   // 1. تصدير QR Codes لجميع المنتجات (مع Chunking)
//   // =========================================
// const exportProductsQRToPDF = async () => {
//   try {
//     setLoading(true);
//     setShowExportModal(true);
//     setExportProgress(0);

//     const params = {
//       page: 1,
//       limit: 1,
//       search: searchTerm.trim() || undefined,
//       category: filterCategory !== "الكل" ? filterCategory : undefined,
//       status: filterStatus !== "الكل" ? filterStatus : undefined,
//       expire: filterExpire !== "الكل" ? filterExpire : undefined
//     };

//     const countRes = await api.get("/product/all", { params });
//     const total = countRes.data.total || 0;
//     setExportTotal(total);

//     if (total === 0) {
//       showAlert({ icon: "info", title: "لا توجد منتجات لتصديرها" });
//       setShowExportModal(false);
//       return;
//     }

//     const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "A4" });

//     const pageWidth = 210;
//     const marginX = 10;
//     const marginY = 10;
//     const columns = 4; // زودنا الأعمدة لأن الحجم أصغر
//     const gapX = 4;
//     const gapY = 5;
//     const labelWidth = (pageWidth - marginX * 2 - gapX * (columns - 1)) / columns;
//     const labelHeight = 38; // اتقلل من 50
//     const qrSize = 22; // اتقلل من 35

//     const perPage = 5 * columns; // 5 صفوف بدل 4

//     let globalIndex = 0;

//     const createArabicTextImage = async (text, maxWidth = 300) => {
//       if (!text || text.length === 0) return null;
//       const textLength = text.length;
//       let fontSize = 20;
//       let lines = 1;
//       if (textLength > 30) { fontSize = 14; lines = 2; }
//       else if (textLength > 20) { fontSize = 16; lines = 2; }
//       else if (textLength > 10) { fontSize = 18; }

//       const height = lines === 1 ? 40 : 55;

//       const container = document.createElement("div");
//       container.style.position = "fixed";
//       container.style.left = "-10000px";
//       container.style.top = "0";
//       container.style.width = `${maxWidth}px`;
//       container.style.height = `${height}px`;
//       container.style.background = "#ffffff";
//       container.style.display = "flex";
//       container.style.alignItems = "center";
//       container.style.justifyContent = "center";
//       container.style.direction = "rtl";
//       container.style.fontFamily = "Arial, Tahoma, sans-serif";
//       container.style.fontSize = `${fontSize}px`;
//       container.style.fontWeight = "700";
//       container.style.color = "#000000";
//       container.style.textAlign = "center";
//       container.style.padding = "0 6px";
//       container.style.boxSizing = "border-box";
//       container.style.wordWrap = "break-word";
//       container.style.lineHeight = "1.3";
//       container.innerText = String(text).trim();

//       document.body.appendChild(container);
//       try {
//         const canvas = await html2canvas(container, {
//           backgroundColor: "#ffffff",
//           scale: 1.2, // اتقلل من 1.5 عشان السرعة
//           useCORS: true,
//           logging: false,
//           width: maxWidth,
//           height: height,
//         });
//         return canvas.toDataURL("image/png");
//       } catch (err) {
//         console.warn("Error creating text image:", err);
//         return null;
//       } finally {
//         if (container.parentNode) document.body.removeChild(container);
//       }
//     };

// const processChunk = async (chunkProducts) => {
//   for (const product of chunkProducts) {
//     if (!product.code) continue;

//     const column = globalIndex % columns;
//     const row = Math.floor(globalIndex / columns) % 5;

//     const x = marginX + column * (labelWidth + gapX);
//     const y = marginY + row * (labelHeight + gapY);

//     pdf.setDrawColor(200, 200, 200);
//     pdf.setLineWidth(0.2);
//     pdf.roundedRect(x, y, labelWidth, labelHeight, 2, 2);

//     // الباركود بدل الـ QR - مستطيل عريض وقصير بدل مربع
//     const barcodeWidth = labelWidth - 6;
//     const barcodeHeight = 14; // نسبة مستطيلة بدل مربع الـ 22x22 القديم
//     const barcodeDataUrl = generateBarcodeDataURL(product.code, { width: 2, height: 70, fontSize: 0 });

//     if (barcodeDataUrl) {
//       const barcodeX = x + (labelWidth - barcodeWidth) / 2;
//       const barcodeY = y + 3;
//       pdf.addImage(barcodeDataUrl, "PNG", barcodeX, barcodeY, barcodeWidth, barcodeHeight);
//     }

//     const productName = String(product.productName || "").trim();
//     if (productName) {
//       try {
//         const textImage = await createArabicTextImage(productName, Math.min(labelWidth * 2.2, 280));
//         if (textImage) {
//           const textWidth = labelWidth - 4;
//           const textHeight = productName.length > 20 ? 9 : 7;
//           pdf.addImage(textImage, "PNG", x + 2, y + barcodeHeight + 5, textWidth, textHeight);
//         }
//       } catch (err) {
//         pdf.setFont("helvetica", "normal");
//         pdf.setFontSize(5.5);
//         pdf.setTextColor(50, 50, 50);
//         pdf.text(productName.substring(0, 15), x + labelWidth / 2, y + barcodeHeight + 9, { align: "center", maxWidth: labelWidth - 4 });
//       }
//     }

//     pdf.setFont("helvetica", "normal");
//     pdf.setFontSize(5.5);
//     pdf.setTextColor(100, 100, 100);
//     pdf.text(`Code: ${String(product.code)}`, x + labelWidth / 2, y + labelHeight - 2, { align: "center" });

//     globalIndex++;
//     setExportProgress(globalIndex);

//     if (globalIndex % perPage === 0 && globalIndex < total) {
//       pdf.addPage();
//     }
//   }
// };
//     const chunkSize = 20;
//     const totalChunks = Math.ceil(total / chunkSize);

//     for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
//       const page = chunkIndex + 1;
//       const chunkParams = {
//         page,
//         limit: chunkSize,
//         search: searchTerm.trim() || undefined,
//         category: filterCategory !== "الكل" ? filterCategory : undefined,
//         status: filterStatus !== "الكل" ? filterStatus : undefined,
//         expire: filterExpire !== "الكل" ? filterExpire : undefined
//       };

//       try {
//         const res = await api.get("/product/all", { params: chunkParams });
//         const chunkProducts = res.data.data || [];
//         if (chunkProducts.length === 0) continue;
//         await processChunk(chunkProducts);
//       } catch (err) {
//         console.error(`Error fetching chunk ${chunkIndex + 1}:`, err);
//       }
//     }

//     if (globalIndex === 0) {
//       showAlert({ icon: "info", title: "لا توجد منتجات صالحة للتصدير" });
//       return;
//     }

//     const dateStr = new Date().toISOString().split("T")[0];
//     pdf.save(`QR_Products_${dateStr}.pdf`);

//     showAlert({ icon: "success", title: `✅ تم تصدير ${globalIndex} QR Code بنجاح` });

//   } catch (err) {
//     console.error("QR PDF Export Error:", err);
//     let errorMessage = "فشل تصدير QR Codes";
//     if (err.message?.includes("Invalid string length")) {
//       errorMessage = "البيانات كبيرة جداً. حاول تقليل عدد المنتجات أو استخدام فلاتر.";
//     } else if (err.message) {
//       errorMessage = err.message;
//     }
//     showAlert({ icon: "error", title: errorMessage });
//   } finally {
//     setLoading(false);
//     setShowExportModal(false);
//     setExportProgress(0);
//   }
// };

//   // =========================================
//   // 2. تصدير QR Code لمنتج فردي
//   // =========================================
// const generateSingleQR = async (product) => {
//   try {
//     setQrLoading(true);
//     setQrProduct(product);

//     const barcodeDataUrl = generateBarcodeDataURL(product.code, {
//       width: 3,
//       height: 100,
//       fontSize: 22,
//       displayValue: true, // في المودال المنفرد نقدر نعرض الكود جوه الصورة نفسها
//     });

//     setQrCodeImage(barcodeDataUrl);
//     setQrModal(true);
//   } catch (err) {
//     console.error("Barcode Generation Error:", err);
//     showAlert({ icon: "error", title: "فشل في توليد الباركود" });
//   } finally {
//     setQrLoading(false);
//   }
// };

//   // =========================================
//   // 3. طباعة QR Code فردي
//   // =========================================
//   const printSingleQR = () => {
//     const printContent = document.getElementById('single-qr-print');
//     if (!printContent) return;
    
//     const printWindow = window.open('', '_blank');
//     printWindow.document.write(`
//       <html>
//         <head>
//           <title>QR Code - ${qrProduct?.productName}</title>
//           <style>
//             body {
//               display: flex;
//               justify-content: center;
//               align-items: center;
//               min-height: 100vh;
//               margin: 0;
//               font-family: Arial, sans-serif;
//               direction: rtl;
//             }
//             .qr-container {
//               text-align: center;
//               padding: 30px;
//               border: 2px solid #e5e7eb;
//               border-radius: 12px;
//               background: white;
//             }
// .qr-container img {
//   width: 320px;
//   height: 140px;
//   margin: 20px 0;
// }
//             .product-name {
//               font-size: 20px;
//               font-weight: bold;
//               color: #1a1a1a;
//               margin: 10px 0;
//             }
//             .product-code {
//               font-size: 14px;
//               color: #6b7280;
//               margin: 5px 0;
//             }
//             .product-details {
//               font-size: 12px;
//               color: #9ca3af;
//               margin-top: 10px;
//             }
//           </style>
//         </head>
//         <body>
//           <div class="qr-container">

//             <img src="${qrCodeImage}" alt="QR Code" />
//             <div class="product-code">الكود: ${qrProduct?.code}</div>

//           </div>
//           <script>
//             window.onload = function() {
//               window.print();
//             }
//           <\/script>
//         </body>
//       </html>
//     `);
//     printWindow.document.close();
//   };

//   // =========================================
//   // 4. تحميل QR Code فردي
//   // =========================================
//   const downloadSingleQR = () => {
//     if (!qrCodeImage) return;
    
//     const link = document.createElement('a');
//     link.download = `QR_${qrProduct?.code}_${qrProduct?.productName}.png`;
//     link.href = qrCodeImage;
//     link.click();
//   };

//   // 5. جلب التصنيفات
//   const fetchCategories = async () => {
//     try {
//       const res = await api.get("/product/categories/all");
//       const fetchedCats = res.data.data || res.data || [];
//       setCategories(["الكل", ...fetchedCats]);
//     } catch (err) {
//       console.error("فشل في تحميل التصنيفات", err);
//     }
//   };

//   // 6. جلب المنتجات
//   const fetchProducts = useCallback(async () => {
//     try {
//       setLoading(true);
//       const params = {
//         page: currentPage,
//         limit: itemsLimit,
//         search: searchTerm.trim() || undefined,
//         category: filterCategory !== "الكل" ? filterCategory : undefined,
//         status: filterStatus !== "الكل" ? filterStatus : undefined,
//         expire: filterExpire !== "الكل" ? filterExpire : undefined
//       };

//       const res = await api.get("/product/all", { params });
      
//       setProducts(res.data.data || []);
//       setTotalPages(res.data.totalPages || 1);
//       setTotalProducts(res.data.total || 0);
//       setTotalExpire(res.data.totalExpire || 0);
//       setTotalNearExpire(res.data.totalNearExpire || 0);

      
//     } catch (err) {
//       showAlert({ icon: 'error', title: err.response?.data?.message || 'فشل في تحميل المنتجات' });
//     } finally {
//       setLoading(false);
//     }
//   }, [
//     currentPage,
//     searchTerm,
//     filterCategory,
//     filterStatus,
//     filterExpire,
//     itemsLimit
//   ]);

//   // 7. تشغيل جلب الداتا عند تغيير الفلاتر أو الصفحات
//   useEffect(() => {
//     fetchProducts();
//   }, [fetchProducts]);

//   // 8. جلب التصنيفات مرة واحدة عند فتح الصفحة
//   useEffect(() => {
//     fetchCategories();
//   }, []);

//   // 9. إعادة الصفحة لـ 1 عند تغيير أي فلتر
//   const handleSearchChange = (e) => {
//     setSearchTerm(e.target.value);
//     setCurrentPage(1);
//   };

//   const handleCategoryChange = (e) => {
//     setFilterCategory(e.target.value);
//     setCurrentPage(1);
//   };

//   const handleStatusChange = (status) => {
//     setFilterStatus(status);
//     setCurrentPage(1);
//   };

//   // 10. حذف منتج
//   const handleDelete = async (id) => {
//     const result = await showAlertConfirm({
//       title: "هل أنت متأكد؟",
//       text: "سيتم حذف هذا المنتج نهائياً من قاعدة البيانات!",
//       icon: "warning",
//       confirmButtonColor: "#ef4444",
//       confirmButtonText: "نعم، احذف"
//     });

//     if (result.isConfirmed) {
//       try {
//         setActionLoading(id);
//         await api.delete(`/product/${id}`);
//         showAlert({ icon: 'success', title: 'تم الحذف بنجاح' });
//         fetchProducts();
//       } catch (err) {
//         showAlert({ icon: 'error', title: 'فشل الحذف' });
//       } finally {
//         setActionLoading(null);
//       }
//     }
//   };

//   // 11. فتح مودال التعديل
//   const openEditModal = (product) => {
//     setEditingProduct({ ...product });
//     setPreviewImage(product.image?.url || null);
//     setNewImageFile(null);
//     setImageDeleted(false);
//     setEditModal(true);
//   };

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setNewImageFile(file);
//       setPreviewImage(URL.createObjectURL(file));
//       setImageDeleted(false);
//     }
//   };

//   const handleRemoveImage = () => {
//     setNewImageFile(null);
//     setPreviewImage(null);
//     setImageDeleted(true);
//   };

//   // 12. تحديث منتج
//   const handleUpdate = async () => {
//     try {
//       setActionLoading("updating");
//       const productId = editingProduct._id;

//       const purchasePrice = Number(editingProduct.purchasePrice);
//       const piecePrice = Number(editingProduct.pieceSellingPrice);
//       const packagePrice = Number(editingProduct.packageSellingPrice);
//       const availableQty = Number(editingProduct.availableQuantity);
//       const unitsPerPackage = Number(editingProduct.unitsPerPackage);

//       if (
//         !editingProduct.productName?.trim() ||
      
//         !editingProduct.unit_type?.trim() ||

//         purchasePrice <= 0 ||
//         piecePrice <= 0 ||
//         availableQty < 0 ||
//         isNaN(purchasePrice) ||
//         isNaN(piecePrice) ||
//         isNaN(availableQty)
//       ) {
//         showAlert({ icon: "error", title: "يجب ملء جميع الحقول بشكل صحيح" });
//         return;
//       }

//       if (purchasePrice < 0 || piecePrice < 0 || packagePrice < 0 || availableQty < 0 || unitsPerPackage < 0) {
//         showAlert({ icon: "error", title: "لا يمكن إدخال أرقام سالبة" });
//         return;
//       }

//       if (editingProduct.unit_type === "كرتونة") {
//         if (!unitsPerPackage || unitsPerPackage <= 0) {
//           showAlert({ icon: "error", title: "عدد القطع داخل الكرتونة غير صحيح" });
//           return;
//         }
//         const expectedPiecePrice = packagePrice / unitsPerPackage;
//         if (piecePrice < expectedPiecePrice) {
//           showAlert({ icon: "error", title: `سعر القطعة أقل من السعر الحقيقي (${expectedPiecePrice.toFixed(2)})` });
//           return;
//         }
//         if (packagePrice < purchasePrice) {
//           showAlert({ icon: "error", title: "سعر بيع الكرتونة أقل من سعر الشراء" });
//           return;
//         }
//       }

//       if (editingProduct.unit_type === "قطعة" && piecePrice < purchasePrice) {
//         showAlert({ icon: "error", title: "سعر بيع القطعة أقل من سعر الشراء" });
//         return;
//       }

//       const textData = {
//         productName: editingProduct.productName,
//         purchasePrice,
//         pieceSellingPrice: piecePrice,
//         packageSellingPrice: packagePrice,
//         availableQuantity: availableQty,
//         unitsPerPackage,
//         category: editingProduct.category,
//         unit_type: editingProduct.unit_type,
//         description: editingProduct.description,
//         companyName: editingProduct.companyName || "اسم الشركه غير مذكور",
//         expiration: editingProduct.expiration,
//         image: { url: editingProduct.image?.url || "" },
//       };

//       await api.put(`/product/${productId}`, textData);

//       if (newImageFile) {
//         const imgFormData = new FormData();
//         imgFormData.append("image", newImageFile);
//         await api.post(`/product/${productId}/upload-image`, imgFormData, {
//           headers: { "Content-Type": "multipart/form-data" },
//         });
//       } else if (imageDeleted) {
//         await api.delete(`/product/${productId}/delete-image`);
//       }

//       showAlert({ icon: "success", title: "تم تحديث البيانات بنجاح" });
//       setEditModal(false);
//       fetchProducts();
//     } catch (err) {
//       console.error(err);
//       showAlert({ icon: "error", title: err.response?.data?.message || "حدث خطأ أثناء التحديث" });
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   // 13. تصدير Excel عربي
//   const exportToExcelArabic = async () => {
//     try {
//       const res = await api.get("/product/data/export", {
//         params: {
//           page: 1,
//           limit: 100000,
//         },
//       });

//       const allProducts = res.data.data || [];

//       if (allProducts.length === 0) {
//         showAlert({
//           icon: "info",
//           title: "لا توجد بيانات لتصديرها",
//         });
//         return;
//       }

//       const excelData = allProducts.map((p, index) => ({
//         "م": index + 1,
//         "كود المنتج": p.code || "N/A",
//         "اسم المنتج": p.productName,
//         "اسم الشركة": p.companyName || "غير مذكور",
//         "التصنيف": p.category,
//         "الوصف": p.description || "",
//         "نوع الوحدة": p.unit_type,
//         "القطع داخل العبوة": p.unit_type === "كرتونة" ? p.unitsPerPackage : 1,
//         "الكمية المتاحة": p.availableQuantity,
//         "إجمالي المخزون (قطع)": p.totalUnits || p.availableQuantity,
//         "سعر الشراء": p.purchasePrice,
//         "سعر بيع القطعة": p.pieceSellingPrice,
//         "سعر بيع الكرتونة": p.unit_type === "كرتونة" ? p.packageSellingPrice : "-",
//         "تاريخ الانتهاء": p.expiration ? new Date(p.expiration).toLocaleDateString('ar-EG') : "-",
//         "إجمالي قيمة المخزون": (p.availableQuantity * p.purchasePrice).toFixed(2),
//         "الحالة": p.availableQuantity <= 0 ? "نافذ" : "متوفر",
//       }));

//       const worksheet = XLSX.utils.json_to_sheet(excelData);
//       worksheet["!dir"] = "rtl";

//       const workbook = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(workbook, worksheet, "المنتجات");

//       const dateStr = new Date().toISOString().split("T")[0];
//       XLSX.writeFile(workbook, `تقرير_جميع_المنتجات_${dateStr}.xlsx`);

//       showAlert({
//         icon: "success",
//         title: `تم تصدير ${allProducts.length} منتج بنجاح`,
//       });
//     } catch (err) {
//       console.error(err);
//       showAlert({
//         icon: "error",
//         title: "فشل تصدير البيانات",
//       });
//     }
//   };

//   // 14. تصدير Excel إنجليزي
//   const exportToExcelEnglish = async () => {
//     try {
//       const res = await api.get("/product/data/export");

//       const allProducts = res.data.data || [];

//       if (allProducts.length === 0) {
//         showAlert({
//           icon: "info",
//           title: "No data available to export",
//         });
//         return;
//       }

//       const excelData = allProducts.map((p, index) => ({
//         "No.": index + 1,
//         code: p.code || "N/A",
//         productName: p.productName,
//         companyName: p.companyName || "Not mentioned",
//         category: p.category,
//         description: p.description || "",
//         unit_type: p.unit_type,
//         unitsPerPackage: p.unit_type === "كرتونة" ? p.unitsPerPackage : 1,
//         availableQuantity: p.availableQuantity,
//         totalUnits: p.totalUnits || p.availableQuantity,
//         purchasePrice: p.purchasePrice,
//         pieceSellingPrice: p.pieceSellingPrice,
//         packageSellingPrice: p.unit_type === "كرتونة" ? p.packageSellingPrice : 0,
//         expiration: p.expiration ? new Date(p.expiration).toLocaleDateString('en-US') : "-",
//         totalStockValue: (p.availableQuantity * p.purchasePrice).toFixed(2),
//         status: p.availableQuantity <= 0 ? "Out of Stock" : "In Stock",
//         averageRating: p.averageRating || 0,
//         imageUrl: p.image?.url || "",
//       }));

//       const worksheet = XLSX.utils.json_to_sheet(excelData);
//       worksheet["!dir"] = "ltr";

//       const workbook = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

//       const dateStr = new Date().toISOString().split("T")[0];
//       XLSX.writeFile(workbook, `All_Products_Report_${dateStr}.xlsx`);

//       showAlert({
//         icon: "success",
//         title: `Successfully exported ${allProducts.length} products`,
//       });
//     } catch (err) {
//       console.error(err);
//       showAlert({
//         icon: "error",
//         title: "Export failed",
//       });
//     }
//   };

//   return (
//     <div className="w-[96vw] overview-auto md:w-full bg-[#F1F5F9] min-h-screen w-full" dir="rtl">
//       <div className="w-full px-4 py-8">
        
//         {/* Header */}
//         <div className="flex flex-col flex-wrap md:flex-row md:items-center justify-between mb-8 gap-6 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
//           <div>
//             <h1 className="text-xl font-black text-slate-800 flex items-center gap-4">
//               <span className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200 text-white"><FaBoxOpen /></span>
//               مخزون المنتجات
//             </h1>
//             <p className="text-slate-500 mt-2 font-bold text-md">عرض وإدارة تفاصيل المنتجات والأسعار (إجمالي المتاح بالمخزن: {totalProducts} منتج)</p>
//           </div>
          
//           <div className="flex gap-6 flex-wrap">
//              <div className="bg-green-50 px-6 py-4 rounded-2xl border border-green-100 text-center">
//                 <p className="text-xs text-green-400 font-black uppercase mb-1">إجمالي الأصناف</p>
//                 <p className="text-xl font-black text-green-700">{totalProducts}</p>
//              </div>
//                <div className="bg-blue-50 px-6 py-4 rounded-2xl border border-blue-100 text-center">
//                 <p className="text-xs text-blue-400 font-black uppercase mb-1">إجمالي الأصناف المنتهيه</p>
//                 <p className="text-xl font-black text-blue-700">{totalExpire}</p> 
//              </div>

//             <div className="bg-blue-50 px-6 py-4 rounded-2xl border border-blue-100 text-center">
//                 <p className="text-xs text-blue-400 font-black uppercase mb-1">إجمالي الأصناف القريبه من الانتهاء</p>
//                 <p className="text-xl font-black text-blue-700">{totalNearExpire}</p> 
//              </div>

             
//              <div className="bg-red-50 px-6 py-4 rounded-2xl border border-red-100 text-center">
//                 <p className="text-xs text-red-400 font-black uppercase mb-1">نواقص (صفحة حالية)</p>
//                 <p className="text-xl font-black text-red-700">{products.filter(p => p.availableQuantity <= 0).length}</p>
//              </div>
//           </div>

//           <div className="flex flex-wrap items-center gap-3">
//             <button
//               onClick={exportToExcelArabic}
//               className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-bold transition flex items-center gap-2 shadow-sm"
//             >
//               <FaFileExcel size={18} />
//               تصدير Excel
//             </button>

//             <button
//               onClick={exportToExcelEnglish}
//               className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-lg font-bold transition flex items-center gap-2 shadow-sm"
//             >
//               <FaFileExcel size={18} />
//               Export Excel
//             </button>

//             <button
//               onClick={exportProductsQRToPDF}
//               className="bg-slate-900 hover:bg-slate-950 text-white px-4 py-2.5 rounded-lg font-bold transition flex items-center gap-2 shadow-sm"
//             >
//               <FaQrcode size={18} />
//               تصدير QR PDF
//             </button>
//           </div>
//         </div>

//         {/* Filters */}
//         <div className="bg-white text-[12px] p-6 rounded-lg shadow-sm border border-slate-200 mb-8">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             <div className="relative">
//               <FaSearch className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
//               <input 
//                 type="text" 
//                 placeholder="بحث بالاسم أو كود المنتج..." 
//                 className="w-full pr-14 pl-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-black text-md shadow-inner"
//                 value={searchTerm} 
//                 onChange={handleSearchChange}
//               />
//             </div>

//             <div className="flex items-center gap-3">
//                <span className="text-md font-black text-slate-500 whitespace-nowrap"><FaFilter/> التصنيف:</span>
//                <select 
//                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-black text-slate-700 outline-none focus:border-blue-500"
//                  value={filterCategory} 
//                  onChange={handleCategoryChange}
//                >
//                  {categories.map(c => 
                 
//               c!==""&&   <option key={c} value={c}>{c}</option>)}
//                </select>
//             </div>

//             <div className="flex items-center gap-3">
//                <span className="text-md font-black text-slate-500 whitespace-nowrap">الحالة:</span>
//                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full border border-slate-200">
//                  {["الكل", "متوفر", "نافذ"].map(s => (
//                    <button 
//                      key={s} 
//                      onClick={() => handleStatusChange(s)}
//                      className={`flex-1 py-3 rounded-lg text-md font-black transition-all ${filterStatus === s ? "bg-white shadow-md text-blue-600" : "text-slate-500 hover:bg-white/50"}`}
//                    >
//                      {s}
//                    </button>
//                  ))}
//                </div>
//             </div>

//             <select
//               value={filterExpire}
//               onChange={(e) => {
//                 setFilterExpire(e.target.value);
//                 setCurrentPage(1);
//               }}
//               className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-black text-slate-700"
//             >
//               <option value="الكل">كل الصلاحيات</option>
//               <option value="منتهي">منتهي</option>
//               <option value="قريب الانتهاء">قريب الانتهاء - 4 شهور</option>
//               <option value="ساري">ساري</option>
//               <option value="بدون تاريخ انتهاء">بدون تاريخ انتهاء</option>
//             </select>
//           </div>
//         </div>

//         {/* Table Container */}
//         <div className="bg-white rounded-lg border border-slate-200 mx-auto shadow-sm overflow-hidden mb-6">
//           <div className="overflow-x-auto">
//             <table className="w-full text-right border-collapse">
//               <thead>
//                 <tr className="bg-slate-50 border-b border-slate-200">
//                   <th className="p-4 font-bold text-md text-slate-600 w-1/4">المنتج</th>
//                   <th className="p-4 font-bold text-md text-slate-600 text-center">الشركة</th>
//                   <th className="p-4 font-bold text-md text-slate-600 text-center">الأسعار</th>
//                   <th className="p-4 font-bold text-md text-slate-600 text-center">المخزون</th>
//                   <th className="p-4 font-bold text-md text-slate-600 text-center">الحالة</th>
//                   <th className="p-4 font-bold text-md text-slate-600 text-center">الإجراءات</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-100">
//                 {loading ? (
//                   <tr>
//                     <td colSpan="6" className="p-20 text-center">
//                       <FaSpinner className="animate-spin text-4xl mx-auto text-blue-500" />
//                     </td>
//                   </tr>
//                 ) : products.length > 0 ? (
//                   products.map((p) => (
//                     <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
//                       <td className="p-4">
//                         <div className="flex items-center gap-4">
//                           <img loading="lazy" src={p.image?.url || "https://placehold.co/100"} className="w-14 h-14 rounded-lg object-cover border border-slate-200" alt={p.productName} />
//                           <div>
//                             <p className="text-xs font-medium text-blue-500 mb-0.5">{p.code}</p>
//                             <p className="text-slate-700 font-bold text-base">{p.productName}</p>
//                             <p className="text-slate-500 text-xs mt-0.5 truncate max-w-[150px]">{p.description}</p>
//                             <p className="text-slate-400 text-xs truncate max-w-[150px] mt-0.5">{p.category}</p>
//                           </div>
//                         </div>
//                       </td>
                      
//                       <td className="p-4 text-center">
//                         <div className="flex flex-col items-center">
//                           <FaBuilding className="text-slate-400 mb-1" size={14} />
//                           <span className="text-xs font-bold text-slate-600">{p.companyName || "غير مذكور"}</span>
//                           {p.expiration && (
//                             <span className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
//                               <FaCalendarAlt size={10} />
//                               {new Date(p.expiration).toLocaleDateString('ar-EG')}
//                             </span>
//                           )}
//                         </div>
//                       </td>

//                       <td className="p-4 text-center">
//                         <div className="flex flex-col text-[9px]">
//                           <span className="text-slate-500">بيع قطعة: {p.pieceSellingPrice}</span>
//                           {p.unit_type === "كرتونة" && <span className="text-slate-500">بيع كرتونة: {p.packageSellingPrice}</span>}
//                           <span className="text-slate-400">شراء: {p.purchasePrice}</span>
//                         </div>
//                       </td>

//                       <td className="p-4 text-center">
//                         <div className="text-md">
//                           <span className={`font-bold ${p.availableQuantity <= 5 ? 'text-red-500' : 'text-slate-700'}`}>
//                             {p.unit_type === "كرتونة" ? `${p.unitsPerPackage}/${p.availableQuantity}` : p.availableQuantity}
//                           </span>
//                           <span className="text-slate-400 text-xs mr-1">{p.unit_type === "كرتونة" ? ` كرتونة / قطعة ` : " قطعة "}</span>
//                         </div>
//                       </td>

//                       <td className="p-4 text-center">
//                         <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-bold ${p.availableQuantity <= 0 ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
//                           {p.availableQuantity <= 0 ? 'نافذ' : 'متوفر'}
//                         </span>
//                       </td>

//                       <td className="p-4">
//                         <div className="flex justify-center gap-2">
//                           {/* زر QR Code */}
//                           <button 
//                             onClick={() => generateSingleQR(p)} 
//                             className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all" 
//                             title="عرض QR Code"
//                           >
//                             <FaQrcode size={16} />
//                           </button>
                          
//                           <button onClick={() => openEditModal(p)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="تعديل">
//                             <FaEdit size={16} />
//                           </button>
                          
//                           <button onClick={() => handleDelete(p._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="حذف">
//                             {actionLoading === p._id ? <FaSpinner className="animate-spin" /> : <FaTrash size={15} />}
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan="6" className="p-10 text-center text-slate-400 font-medium">لا توجد منتجات تطابق البحث أو الفلترة الحالية</td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Pagination */}
//         {totalPages > 1 && (
//           <div className="flex items-center justify-center gap-1.5 mt-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm overflow-x-auto mx-auto w-fit max-w-full">
//             <button
//               disabled={currentPage === 1}
//               onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//               className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
//             >
//               <FaChevronRight size={14} />
//             </button>

//             {currentPage > 3 && (
//               <>
//                 <button
//                   onClick={() => setCurrentPage(1)}
//                   className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all font-bold text-sm shrink-0"
//                 >
//                   1
//                 </button>
//                 <span className="px-1 text-slate-400">...</span>
//               </>
//             )}

//             {Array.from(
//               {
//                 length: Math.min(5, totalPages, Math.max(1, totalPages - 2)),
//               },
//               (_, index) => {
//                 let pageNum;
//                 if (totalPages <= 5) {
//                   pageNum = index + 1;
//                 } else if (currentPage <= 3) {
//                   pageNum = index + 1;
//                 } else if (currentPage >= totalPages - 2) {
//                   pageNum = totalPages - 4 + index;
//                 } else {
//                   pageNum = currentPage - 2 + index;
//                 }
//                 return (
//                   <button
//                     key={pageNum}
//                     onClick={() => setCurrentPage(pageNum)}
//                     className={`px-3.5 py-2 rounded-lg font-bold text-sm transition-all shrink-0 ${
//                       currentPage === pageNum
//                         ? "bg-blue-600 text-white shadow-md shadow-blue-100"
//                         : "border border-slate-200 text-slate-600 hover:bg-slate-50"
//                     }`}
//                   >
//                     {pageNum}
//                   </button>
//                 );
//               }
//             )}

//             {currentPage < totalPages - 2 && totalPages > 5 && (
//               <>
//                 <span className="px-1 text-slate-400">...</span>
//                 <button
//                   onClick={() => setCurrentPage(totalPages)}
//                   className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all font-bold text-sm shrink-0"
//                 >
//                   {totalPages}
//                 </button>
//               </>
//             )}

//             <button
//               disabled={currentPage === totalPages}
//               onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
//               className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
//             >
//               <FaChevronLeft size={14} />
//             </button>
//           </div>
//         )}

//         {/* ========================================= */}
//         {/* Modal عرض QR Code فردي */}
//         {/* ========================================= */}
//         {qrModal && qrProduct && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
//             <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200">
//               {/* Header */}
//               <div className="bg-brown px-6 py-4 flex justify-between items-center">
//                 <div>
//                   <h3 className="text-lg font-bold text-white flex items-center gap-2">
//                     <FaQrcode /> QR Code
//                   </h3>
//                   <p className="text-purple-100 text-xs mt-0.5">{qrProduct.productName}</p>
//                 </div>
//                 <button 
//                   onClick={() => {
//                     setQrModal(false);
//                     setQrCodeImage(null);
//                     setQrProduct(null);
//                   }} 
//                   className="text-white/70 hover:text-white transition-colors"
//                 >
//                   <FaTimes size={22} />
//                 </button>
//               </div>

//               {/* Content - محتوى قابل للطباعة */}
//               <div className="p-8 text-center" id="single-qr-print">
//                 {qrLoading ? (
//                   <div className="py-12">
//                     <FaSpinner className="animate-spin text-4xl mx-auto text-purple-500" />
//                     <p className="text-slate-500 mt-4">جاري توليد QR Code...</p>
//                   </div>
//                 ) : qrCodeImage ? (
//                   <>
//                     <div className="flex justify-center mb-4">
//                       <div className="p-4 bg-white rounded-xl shadow-lg border border-slate-100">
//                       <img 
//                         src={qrCodeImage} 
//                         alt={`Barcode - ${qrProduct.productName}`} 
//                         className="w-72 h-32 object-contain"
//                       />
//                       </div>
//                     </div>
                    
//                     <div className="space-y-2">
//                       <p className="text-xl font-bold text-slate-800">{qrProduct.productName}</p>
//                       <p className="text-sm text-slate-500">
//                         <span className="font-bold">الكود:</span> {qrProduct.code}
//                       </p>
//                       <p className="text-sm text-slate-500">
//                         <span className="font-bold">التصنيف:</span> {qrProduct.category}
//                       </p>
//                       {qrProduct.companyName && (
//                         <p className="text-sm text-slate-500">
//                           <span className="font-bold">الشركة:</span> {qrProduct.companyName}
//                         </p>
//                       )}
//                     </div>
//                   </>
//                 ) : null}
//               </div>

//               {/* Footer - أزرار الإجراءات */}
//               <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-center gap-3">
//                 <button
//                   onClick={printSingleQR}
//                   className="px-6 py-2.5 bg-accent -600 hover:bg-indigo-700 text-white rounded-lg font-bold transition flex items-center gap-2"
//                 >
//                    طباعة
//                 </button>
//                 <button
//                   onClick={downloadSingleQR}
//                   className="px-6 py-2.5 bg-dark -600 hover:bg-emerald-700 text-white rounded-lg font-bold transition flex items-center gap-2"
//                 >
//                   تحميل
//                 </button>
//                 <button
//                   onClick={() => {
//                     setQrModal(false);
//                     setQrCodeImage(null);
//                     setQrProduct(null);
//                   }}
//                   className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition"
//                 >
//                   إغلاق
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Edit Modal */}
//         {editModal && editingProduct && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
//             <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden border border-slate-200">
//               <div className="bg-slate-50 px-8 py-5 border-b border-slate-200 flex justify-between items-center">
//                 <div>
//                   <h3 className="text-md font-bold text-slate-800 flex items-center gap-2"><FaEdit className="text-blue-500"/> تعديل بيانات المنتج</h3>
//                   <p className="text-slate-400 text-xs mt-0.5">كود المنتج: {editingProduct.code}</p>
//                 </div>
//                 <button onClick={() => setEditModal(false)} className="text-slate-400 hover:text-red-500 transition-colors"><FaTimes size={20}/></button>
//               </div>
              
//               <div className="p-8 grid grid-cols-1 md:grid-cols-12 gap-8 max-h-[75vh] overflow-y-auto">
//                 <div className="md:col-span-4 flex flex-col items-center border-l border-slate-100 pl-4">
//                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-3 w-full text-center">صورة المنتج</label>
//                    <div className="relative group w-40 h-40 bg-slate-50 rounded-lg overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center">
//                       {previewImage ? (
//                         <>
//                           <img loading="lazy" src={previewImage} className="w-full h-full object-cover" alt="preview" />
//                           <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
//                              <button onClick={() => fileInputRef.current.click()} className="p-2 bg-white text-blue-600 rounded-lg shadow-md hover:scale-110 transition-transform"><FaCamera size={16}/></button>
//                              <button onClick={handleRemoveImage} className="p-2 bg-white text-red-600 rounded-lg shadow-md hover:scale-110 transition-transform"><FaTrashAlt size={16}/></button>
//                           </div>
//                         </>
//                       ) : (
//                         <button onClick={() => fileInputRef.current.click()} className="flex flex-col items-center text-slate-300 hover:text-blue-500 transition-colors gap-2">
//                            <FaImage size={40} /> <span className="text-[10px] font-bold">اختر صورة</span>
//                         </button>
//                       )}
//                       <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
//                    </div>
//                    {imageDeleted && <span className="mt-2 text-[10px] text-red-500 font-bold">سيتم حذف الصورة عند الحفظ</span>}
//                 </div>

//                 <div className="md:col-span-8 grid grid-cols-2 gap-4">
//                   <div className="col-span-2">
//                     <label className="text-[9px] font-bold text-slate-500 mb-1.5 block mr-1">اسم المنتج</label>
//                     <input value={editingProduct.productName} onChange={(e) => setEditingProduct({...editingProduct, productName: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700 text-md font-semibold transition-all"/>
//                   </div>
                  
//                   <div className="col-span-2">
//                     <label className="text-[9px] font-bold text-slate-500 mb-1.5 block mr-1">اسم الشركة</label>
//                     <input value={editingProduct.companyName || ""} onChange={(e) => setEditingProduct({...editingProduct, companyName: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700 text-md font-semibold transition-all"/>
//                   </div>

//                   <div className="col-span-2">
//                     <label className="text-[9px] font-bold text-slate-500 mb-1.5 block mr-1">التصنيف</label>
//                     <input value={editingProduct.category} onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700 text-md font-semibold transition-all"/>
//                   </div>

//                   <div>
//                     <label className="text-[9px] font-bold text-slate-500 mb-1.5 block mr-1">سعر الشراء</label>
//                     <input type="number" min={0} value={editingProduct.purchasePrice} onChange={(e) => setEditingProduct({...editingProduct, purchasePrice: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:border-orange-400 outline-none text-orange-600 font-bold text-md"/>
//                   </div>
//                   <div>
//                     <label className="text-[9px] font-bold text-slate-500 mb-1.5 block mr-1">سعر بيع القطعة</label>
//                     <input type="number" min={0} value={editingProduct.pieceSellingPrice} onChange={(e) => setEditingProduct({...editingProduct, pieceSellingPrice: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:border-emerald-400 outline-none text-emerald-600 font-bold text-md"/>
//                   </div>
//                   {editingProduct.unit_type === 'كرتونة' && (
//                     <div>
//                       <label className="text-[9px] font-bold text-slate-500 mb-1.5 block mr-1">سعر بيع الكرتونة</label>
//                       <input type="number" min={0} value={editingProduct.packageSellingPrice} onChange={(e) => setEditingProduct({...editingProduct, packageSellingPrice: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:border-emerald-400 outline-none text-emerald-600 font-bold text-md"/>
//                     </div>
//                   )}
//                   {editingProduct.unit_type === 'كرتونة' && (
//                     <div>
//                       <label className="text-[9px] font-bold text-slate-500 mb-1.5 block mr-1">عدد القطع في الكرتونة</label>
//                       <input type="number" min={1} value={editingProduct.unitsPerPackage} onChange={(e) => setEditingProduct({...editingProduct, unitsPerPackage: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700 font-bold text-md"/>
//                     </div>
//                   )}
//                   <div>
//                     <label className="text-[9px] font-bold text-slate-500 mb-1.5 block mr-1">الكمية المتاحة</label>
//                     <input type="number" min={0} value={editingProduct.availableQuantity} onChange={(e) => setEditingProduct({...editingProduct, availableQuantity: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700 font-bold text-md"/>
//                   </div>
//                   <div>
//                     <label className="text-[9px] font-bold text-slate-500 mb-1.5 block mr-1">الوحدة</label>  
//                     <input disabled={true} value={editingProduct.unit_type} className="w-full px-4 py-2.5 bg-slate-200 border border-slate-300 rounded-lg outline-none text-slate-500 text-md cursor-not-allowed"/>
//                   </div>
//                   <div>
//                     <label className="text-[9px] font-bold text-slate-500 mb-1.5 block mr-1">تاريخ الانتهاء</label>
//                     <input type="date" value={editingProduct.expiration ? new Date(editingProduct.expiration).toISOString().split('T')[0] : ""} onChange={(e) => setEditingProduct({...editingProduct, expiration: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-red-600 font-bold text-md"/>
//                   </div>
//                   <div className="col-span-2">
//                     <label className="text-[9px] font-bold text-slate-500 mb-1.5 block mr-1">وصف المنتج</label>  
//                     <textarea value={editingProduct.description} onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700 text-md"/>
//                   </div>
//                   <div className="col-span-2">
//                     <label className="text-[9px] font-bold text-slate-500 mb-1.5 block mr-1">لينك الصوره</label>  
//                     <textarea value={editingProduct.image?.url || ""} onChange={(e) => { const newUrl = e.target.value; setEditingProduct({ ...editingProduct, image: { ...editingProduct.image, url: newUrl } }); setPreviewImage(newUrl); }} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700 text-md"/>
//                   </div>
//                 </div>
//               </div>

//               <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
//                 <button onClick={handleUpdate} disabled={actionLoading === 'updating'} className="bg-slate-800 text-white px-8 py-2.5 rounded-lg font-bold text-md hover:bg-blue-600 transition-all flex items-center gap-2 disabled:opacity-50">
//                   {actionLoading === 'updating' ? <FaSpinner className="animate-spin" /> : <><FaSave /> حفظ التغييرات</>}
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {showExportModal && (
//   <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
//     <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 text-center border border-slate-200">
//       <FaQrcode className="text-4xl text-slate-800 mx-auto mb-3" />
//       <p className="font-black text-slate-700 mb-1">جاري تصدير QR Codes...</p>
//       <p className="text-xs text-slate-400 mb-4">
//         {exportProgress} / {exportTotal || "..."}
//       </p>
//       <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
//         <div
//           className="bg-blue-600 h-3 rounded-full transition-all duration-200"
//           style={{
//             width: exportTotal ? `${Math.min(100, (exportProgress / exportTotal) * 100)}%` : "5%"
//           }}
//         />
//       </div>
//     </div>
//   </div>
// )}
//     </div>

//   );
// }