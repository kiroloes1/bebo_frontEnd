import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BackButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="flex items-center justify-center w-10 h-10 rounded-xl
                 bg-slate-100 hover:bg-slate-200 transition-all
                 fixed right-5 top-5
                 z-50
                 "
      title="رجوع"
    >
      <ArrowRight size={22} />
    </button>
  );
};

export default BackButton;