import * as XLSX from "xlsx";
import {
  excelLabels,
  excelValues
} from "../utils/excelDictionary";

// ==========================================
// الحقول التي يتم تجاهلها في Excel
// ==========================================

const EXCEL_SKIP_FIELDS = new Set([
  "_id",
  "id",

  // IDs
  "moduleId",
  "customerId",
  "supplierId",
  "productId",
  "invoiceId",
  "purchaseId",
  "userId",
  "product",
  "createdAt",
  "updatedAt",
  // Mongo relations
  "createdBy",
  "updatedBy",

  // أشياء داخلية
  "__v",
]);

// ==========================================
// ترجمة القيمة
// ==========================================

const translateExcelValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  // Boolean
  if (typeof value === "boolean") {
    return excelValues[String(value)] || value;
  }

  // String
  if (typeof value === "string") {
    return excelValues[value] || value;
  }

  return value;
};

// ==========================================
// تحويل Object المتداخل إلى نص
// ==========================================

const flattenValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  // Array
  if (Array.isArray(value)) {
    return value
      .map((item) => flattenValue(item))
      .filter(Boolean)
      .join(" | ");
  }

  // Object
  if (
    typeof value === "object" &&
    !(value instanceof Date)
  ) {
    return Object.entries(value)
      .filter(([key]) => !EXCEL_SKIP_FIELDS.has(key))
      .map(([key, val]) => {
        const label =
          excelLabels[key] || key;

        const translatedValue =
          flattenValue(val);

        if (!translatedValue) {
          return "";
        }

        return `${label}: ${translatedValue}`;
      })
      .filter(Boolean)
      .join(" - ");
  }

  return translateExcelValue(value);
};

// ==========================================
// تحويل Row كامل
// ==========================================

const translateRow = (item) => {
  const row = {};

  Object.entries(item).forEach(([key, value]) => {

    // تجاهل المعرفات والحقول الداخلية
    if (EXCEL_SKIP_FIELDS.has(key)) {
      return;
    }

    const header =
      excelLabels[key] || key;

    row[header] =
      flattenValue(value);
  });

  return row;
};

// ==========================================
// Export Excel
// ==========================================

export const exportToExcel = ({
  data = [],
  fileName = "export",
  sheetName = "Sheet1",
  columns = null,
}) => {

  if (
    !Array.isArray(data) ||
    data.length === 0
  ) {
    console.warn("لا توجد بيانات للتصدير");
    return;
  }

  let exportData;

  // ========================================
  // لو المستخدم حدد columns
  // ========================================

  if (columns) {

    exportData = data.map((item) => {

      const row = {};

      columns.forEach((column) => {

        // لو column.value عبارة عن string
        if (
          typeof column.value === "string" &&
          EXCEL_SKIP_FIELDS.has(column.value)
        ) {
          return;
        }

        const header =
          column.header ||
          excelLabels[column.value] ||
          column.value;

        const value =
          typeof column.value === "function"
            ? column.value(item)
            : item[column.value];

        row[header] =
          flattenValue(value);
      });

      return row;
    });

  }

  // ========================================
  // بدون columns
  // ========================================

  else {

    exportData =
      data.map(translateRow);

  }

  // ========================================
  // إنشاء Worksheet
  // ========================================

  const worksheet =
    XLSX.utils.json_to_sheet(exportData);

  // ========================================
  // إنشاء Workbook
  // ========================================

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    sheetName
  );

  // ========================================
  // تصدير
  // ========================================

  XLSX.writeFile(
    workbook,
    `${fileName}.xlsx`
  );
};