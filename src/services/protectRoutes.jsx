import { jwtDecode } from "jwt-decode";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "./api";

async function isTokenValid() {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    if (decoded.exp <= currentTime) {
      const res = await api.post("/users/refresh-token");

      if (res.status === 200) {
        localStorage.setItem("token", res.data.accessToken);
        return true;
      } else {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

function ProtectedRoute({ children }) {
  const [isValid, setIsValid] = useState(null);

  useEffect(() => {
    const checkToken = async () => {
      const valid = await isTokenValid();
      setIsValid(valid);
    };
    checkToken();
  }, []);

  if (isValid === null) return<div 
  className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center z-50 p-4"
  style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}
  dir="rtl"
>
  <div className="flex flex-col items-center max-w-sm text-center">
    {/* الـ Spinner الحركي */}
    <div className="relative mb-5">
      <div className="w-14 h-14 border-4 border-slate-200 rounded-full"></div>
      <div className="w-14 h-14 border-4 border-t-black border-r-transparent border-b-transparent border-l-transparent rounded-full absolute top-0 left-0 animate-spin"></div>
    </div>

    {/* النصوص الرسمية */}
    <h1 className="text-lg font-bold text-slate-900 mb-1.5">
      جاري التحقق من الهوية...
    </h1>
    <p className="text-xs text-slate-500 leading-relaxed">
      يرجى الانتظار لحظة، يتم الآن تهيئة بيئة العمل الآمنة الخاصة بك.
    </p>
  </div>
</div>
  if (!isValid) return <Navigate to="/login" replace />;

  return children;
}

export default ProtectedRoute;