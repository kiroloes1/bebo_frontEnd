import React, { useState } from "react";
import { DatabaseBackup } from "lucide-react"; // أيقونة النسخ الاحتياطي
import api from "../../services/api";

const BackupButton = () => {
  const [loading, setLoading] = useState(false);

  const handleBackup = async () => {
    try {
      setLoading(true);

      const response = await api.get("/backupMaual", { responseType: "blob" });

      const blob = new Blob([response.data], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      const date = new Date().toISOString().split("T")[0];
      link.setAttribute("download", `backup-${date}.json`);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Backup failed:", err);
      alert("فشل تحميل النسخة الاحتياطية");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={handleBackup}
      className={`
      no-print  fixed bottom-24 left-8 z-50 
        bg-brown text-white 
        p-4 rounded-[20px] 
         
        hover:bg-dark hover:-translate-y-2 
        
        transition-all duration-300 cursor-pointer 
         flex items-center justify-center
      `}
      title="تحميل نسخة احتياطية"
    >

      {/* أيقونة النسخ الاحتياطي */}
      <DatabaseBackup
        className={`text-2xl relative z-10 ${loading ? "animate-spin" : ""}`}
      />
    </div>
  );
};

export default BackupButton;