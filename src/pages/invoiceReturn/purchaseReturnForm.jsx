import React, { useState, useEffect } from "react";
import { Search, FileText, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { showAlert } from "../../services/alert";

const SearchPurchase = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // البحث التلقائي مع Debounce
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchTerm.trim().length > 0) {
        handleSearch(searchTerm.trim());
      } else {
        setSearchResults([]);
        setSearched(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // دالة جلب نتائج البحث
  const handleSearch = async (query) => {
    try {
      setLoading(true);
      const res = await api.get(`/purchase/search?search=${encodeURIComponent(query)}`);
      
      const purchases = res.data?.purchases || [];
      setSearchResults(purchases);
      setSearched(true);
    } catch (err) {
      console.error("Search Purchase Error:", err);
      showAlert({
        title: err.response?.data?.message || "حدث خطأ أثناء البحث عن فاتورة الشراء",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // عند الضغط على Enter في حقل البحث
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (searchTerm.trim()) {
        handleSearch(searchTerm.trim());
      }
    }
  };

  return (
    <div className="w-[96vw] md:w-full mx-auto p-4 lg:p-8 bg-ligth/10" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header with Back Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/purchases")}
            className="p-2 hover:bg-brown/10 rounded-xl transition-colors"
          >
            <ArrowRight size={20} className="text-brown" />
          </button>
          <h2 className="text-xl font-black text-dark flex items-center gap-2">
            <FileText size={22} className="text-brown" />
            البحث عن فاتورة شراء
          </h2>
        </div>

        {/* Search Input Card */}
        <div className="bg-white p-6 rounded-2xl border border-brwonLight shadow-sm space-y-4">
          <label className="block font-black text-dark text-sm">
            رقم فاتورة الشراء أو اسم المورد
          </label>
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-brown/50" size={20} />
            <input
              type="text"
              className="w-full h-14 pr-12 pl-10 bg-ligth/10 border border-brown/10 rounded-2xl outline-none font-bold text-dark placeholder:text-dark/30 focus:border-brown focus:ring-4 focus:ring-brown/5 transition-all"
              placeholder="اكتب رقم الفاتورة (مثل AGP-1) أو اسم المورد..."
              value={searchTerm}
              onKeyDown={handleKeyDown}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            {loading && (
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brown">
                <Loader2 size={20} className="animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Results List */}
        {searched && searchResults.length > 0 && (
          <div className="bg-white  rounded-2xl border border-brown/10 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-ligth/20 border-b border-brown/5 text-xs font-black text-dark/60">
              تم العثور على ({searchResults.length}) نتيجة. اضغط على الفاتورة لفتحها:
            </div>
            <div className="divide-y divide-brown/5">
              {searchResults.map((pur) => (
                <div
                  key={pur._id}
                  onClick={() => navigate(`/purchases/edit/${pur._id}`)}
                  className="p-4 flex items-center justify-between hover:bg-ligth/20 cursor-pointer transition-colors"
                >
                  <div className="space-y-1">
                    <div className="font-black text-dark text-sm flex items-center gap-2">
                      <span>رقم الفاتورة: #{pur.purchaseNumber}</span>
                    </div>
                    <div className="text-xs text-dark/60 font-bold">
                      المورد: {pur.supplier?.name || "مورد غير معرف"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-brown bg-ligth px-3 py-1.5 rounded-xl">
                      {new Date(pur.purchaseDate).toLocaleDateString("ar-EG")}
                    </span>
                    <ArrowRight size={18} className="text-brown/60 rotate-180" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results Alert */}
        {searched && !loading && searchResults.length === 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800">
            <AlertCircle size={20} className="shrink-0" />
            <span className="font-bold text-sm">
              لم يتم العثور على أي فاتورة شراء تطابق البحث "{searchTerm}".
            </span>
          </div>
        )}

      </div>
    </div>
  );
};

export default SearchPurchase;