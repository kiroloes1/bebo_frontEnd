import React from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { exportToExcel } from "../services/exportExcel";
import { showAlert } from "../services/alert";

const ExportExcelButton = ({
  data = [],
  fileName = "export",
  sheetName = "البيانات",
  columns = null,
  loading = false,
  children = "تصدير Excel",
  className = "",
}) => {

  const handleExport = () => {

    if (loading) return;

    if (!data || data.length === 0) {
      showAlert({
        title: "لا توجد بيانات للتصدير",
        icon: "warning",
      });

      return;
    }

    try {

      exportToExcel({
        data,
        fileName,
        sheetName,
        columns,
      });

      showAlert({
        title: "تم تصدير الملف بنجاح",
        icon: "success",
      });

    } catch (error) {

      console.error("Excel Export Error:", error);

      showAlert({
        title: "حدث خطأ أثناء تصدير الملف",
        icon: "error",
      });

    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className={`
        inline-flex
        items-center
        justify-center
        gap-2
        px-4
        py-2.5
        rounded-xl
        bg-green-600
        text-white
        font-black
        text-sm
        hover:bg-green-700
        transition-all
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${className}
      `}
    >

      {loading ? (
        <Loader2
          size={17}
          className="animate-spin"
        />
      ) : (
        <FileSpreadsheet size={17} />
      )}

      {children}

    </button>
  );
};

export default ExportExcelButton;