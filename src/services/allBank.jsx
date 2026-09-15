import React, { useState } from "react";

const EGYPTIAN_BANKS = [
  "بنك مصر",
  "البنك الأهلي المصري",
  "بنك القاهرة",
  "البنك التجاري الدولي CIB",
  "بنك الإسكندرية",
  "بنك QNB الأهلي",
  "بنك SAIB",
  "بنك فيصل الإسلامي المصري",
  "بنك البركة مصر",
  "بنك قناة السويس",
  "البنك المصري لتنمية الصادرات EBank",
  "بنك التعمير والإسكان",
  "البنك العربي الأفريقي الدولي",
  "البنك العربي",
  "البنك المصري الخليجي EG Bank",
  "بنك أبو ظبي الأول مصر FABMISR",
  "بنك أبو ظبي التجاري مصر ADCB",
  "بنك المشرق",
  "بنك الإمارات دبي الوطني مصر",
  "بنك الكويت الوطني مصر NBK",
  "بنك HSBC مصر",
  "بنك كريدي أجريكول مصر",
  "بنك ستاندرد تشارترد مصر",
  "بنك نكست",
  "بنك التنمية الصناعية IDB",
  "البنك العقاري المصري العربي",
  "المصرف المتحد",
  "بنك الاستثمار العربي aiBANK",
  "البنك الزراعي المصري",
];

const BankAutocomplete = ({
  value,
  onChange,
  placeholder = "اكتب اسم البنك...",
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredBanks = EGYPTIAN_BANKS.filter((bank) =>
    bank.toLowerCase().includes((value || "").toLowerCase())
  );

  return (
    <div className="relative">
      <input
        type="text"
        value={value || ""}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full p-2 bg-ligth/20 border rounded-lg text-xs font-bold outline-none focus:border-brown"
        onFocus={() => setShowSuggestions(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onBlur={() => {
          setTimeout(() => setShowSuggestions(false), 150);
        }}
      />

      {showSuggestions && value?.length > 0 && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-brown/10 rounded-lg shadow-xl max-h-52 overflow-y-auto">
          {filteredBanks.length > 0 ? (
            filteredBanks.map((bank) => (
              <div
                key={bank}
                className="p-2.5 text-xs font-bold cursor-pointer hover:bg-ligth/40 border-b border-ligth last:border-b-0"
                onMouseDown={() => {
                  onChange(bank);
                  setShowSuggestions(false);
                }}
              >
                {bank}
              </div>
            ))
          ) : (
            <div className="p-2.5 text-xs text-gray-500">
              لا يوجد بنك مطابق — يمكنك كتابة الاسم يدويًا
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BankAutocomplete;