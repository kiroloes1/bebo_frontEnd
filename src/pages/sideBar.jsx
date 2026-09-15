// components/Sidebar.jsx
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, Users, ChevronDown, Menu, X, 
  LogOut, User2Icon, UsersIcon, Settings2, FactoryIcon, 
  BoxIcon, FileText, ShoppingBag, RotateCcw, BarChart3
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { showAlert } from "../services/alert";
import api from "../services/api";
import { useSystemSettings } from "../context/shareInfo";
import { FaMoneyBill, FaMoneyCheck } from "react-icons/fa";

const Sidebar = ({ role }) => {
  const location = useLocation();

  const [openMain, setOpenMain] = useState(null);
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const { settings } = useSystemSettings();

  const getDashboardPath = () => {
    switch(role) {
      case 'superadmin': return '/';
      case 'admin': return '/admin-dashboard';
      case 'manager': return '/manager-dashboard';
      default: return '/dashboard';
    }
  };

  // خريطة المسارات المطابقة لـ App.jsx
const getPath = (id) => {
    const paths = {
      // Dashboard
      dashboard: getDashboardPath(),
      PaymentDashboard: "/PaymentDashboard",

      // العملاء
      customerList: "/customer",
      addCustomer: "/customer/add",
      customerPayments: "/customer/payments",

      // الموردين
      supplierList: "/supplier",
      addSupplier: "/supplier/add",
      supplierPayments: "/supplier/payments",

      // المنتجات
      product: "/product",
      addProduct: "/product/add",

      // الفواتير والمرتجعات
      invoicesList: "/invoices",
      addInvoice: "/invoices/add",
      salesReturn: "/salesReturn",

     invoiceReturn: "/salesReturn/SearchInvoice",
     purchaseReturn: "/salesReturn/SearchPurchase",

      // المشتريات
      purchasesList: "/purchases",
      addPurchase: "/purchases/add",

      // التقارير
      productReports: "/reports/product",
      invoiceReports: "/reports/invoice",
      purchaseReports: "/reports/purchase",

      // المشرفين والمصاريف
      manageUsers: "/admin/users",
      addManager: "/admin/add",
      expenses: "/expenses",

      // الملف الشخصي والإعدادات
      profile: "/profile",
      settingsInfo: "/settings/info",
      backupSettings: "/BackupSettings",
    };
    return paths[id] || `/${id}`;
  };

const menus = [
    { 
      id: "dashboard", 
      label: "لوحة التحكم", 
      icon: <LayoutDashboard size={20} />, 
      roles: ["admin", "manager", "superadmin"], 
      path: getDashboardPath() 
    },
    { 
      id: "PaymentDashboard", 
      label: "لوحة الأموال", 
      icon: <FaMoneyCheck size={20} />, 
      roles: ["admin", "manager", "superadmin"], 
      path: "/PaymentDashboard" 
    },
    { 
      id: "invoicesGroup", 
      label: "الفواتير", 
      icon: <FileText size={20} />, 
      roles: ["admin", "manager", "superadmin"], 
      sub: [ 
        { id: "invoicesList", label: "قائمة الفواتير", roles: ["admin", "manager", "superadmin"] },
        { id: "addInvoice", label: "إنشاء فاتورة", roles: ["admin", "manager", "superadmin"] },
      ] 
    },
    { 
      id: "purchasesGroup", 
      label: "المشتريات", 
      icon: <ShoppingBag size={20} />, 
      roles: ["admin", "manager", "superadmin"], 
      sub: [ 
        { id: "purchasesList", label: "قائمة المشتريات", roles: ["admin", "manager", "superadmin"] },
        { id: "addPurchase", label: "إنشاء أمر شراء", roles: ["admin", "manager", "superadmin"] }
      ] 
    },
    { 
      id: "return", 
      label: "المرتجعات", 
      icon: <RotateCcw size={20} />, 
      roles: ["admin", "manager", "superadmin"], 
      sub: [ 
        { id: "salesReturn", label: "إدارة المرتجعات", roles: ["admin", "manager", "superadmin"] },
        { id: "invoiceReturn", label: " اضافه مرتجع فواتير", roles: ["admin", "manager", "superadmin"] },
        { id: "purchaseeReturn", label: " اضافه مرتجع مشتريات", roles: ["admin", "manager", "superadmin"] },

      ] 
    },

        { 
      id: "productGroup", 
      label: "المنتجات", 
      icon: <BoxIcon size={20} />, 
      roles: ["superadmin"], 
      sub: [
        { id: "product", label: "إدارة المنتجات", roles: ["superadmin"] }, 
        { id: "addProduct", label: "إضافة منتج", roles: ["superadmin"] }
      ] 
    },
    { 
      id: "customer", 
      label: "العملاء", 
      icon: <Users size={20} />, 
      roles: ["admin", "manager", "superadmin"], 
      sub: [ 
        { id: "customerList", label: "قائمة العملاء", roles: ["admin", "manager", "superadmin"] },
        { id: "addCustomer", label: "إضافة عميل", roles: ["admin", "manager", "superadmin"] },
        { id: "customerPayments", label: "تحصيلات العملاء", roles: ["admin", "superadmin", "manager"] } 
      ] 
    },
    { 
      id: "supplier", 
      label: "الموردين", 
      icon: <Users size={20} />, 
      roles: ["admin", "manager", "superadmin"], 
      sub: [ 
        { id: "supplierList", label: "قائمة الموردين", roles: ["admin", "manager", "superadmin"] },
        { id: "addSupplier", label: "إضافة مورد", roles: ["admin", "manager", "superadmin"] },
        { id: "supplierPayments", label: "مدفوعات الموردين", roles: ["admin", "superadmin", "manager"] } 
      ] 
    },

    { 
      id: "expensesGroup", 
      label: "المصاريف", 
      icon: <FaMoneyBill size={20} />, 
      roles: ["superadmin", "manager", "admin"], 
      sub: [
        { id: "expenses", label: "إدارة المصاريف", roles: ["superadmin", "manager", "admin"] }
      ] 
    },
           { 
      id: "reportsGroup", 
      label: "التقارير", 
      icon: <BarChart3 size={20} />, 
      roles: ["admin", "manager", "superadmin"], 
      sub: [ 
        { id: "productReports", label: "تقارير المنتجات", roles: ["admin", "manager", "superadmin"] },
        { id: "invoiceReports", label: "تقارير المبيعات", roles: ["admin", "manager", "superadmin"] },
        { id: "purchaseReports", label: "تقارير المشتريات", roles: ["admin", "manager", "superadmin"] }
      ] 
    },
    { 
      id: "adminGroup", 
      label: "المشرفين", 
      icon: <UsersIcon size={20} />, 
      roles: ["superadmin"], 
      sub: [
        { id: "manageUsers", label: "إدارة المستخدمين", roles: ["superadmin"] }, 
        { id: "addManager", label: "إضافة مشرف", roles: ["superadmin"] }
      ] 
    },

   
    { 
      id: "profileGroup", 
      label: "الصفحة الشخصية", 
      icon: <User2Icon size={20} />, 
      roles: ["superadmin", "manager", "admin"], 
      sub: [
        { id: "profile", label: "إدارة الملف الشخصي", roles: ["superadmin", "manager", "admin"] }
      ] 
    },
    { 
      id: "settingsGroup", 
      label: "الإعدادات", 
      icon: <Settings2 size={20} />, 
      roles: ["superadmin", "manager"], 
      sub: [
        { id: "settingsInfo", label: "إعدادات النظام", roles: ["superadmin", "manager"] },
        { id: "backupSettings", label: "النسخ الاحتياطي", roles: ["superadmin"] }
      ] 
    },
  ];

  const hasAccess = (roles) => roles && roles.includes(role);

  const isExactPathActive = (id) => {
    const path = getPath(id);
    return location.pathname === path;
  };

  const isBranchActive = (item) => {
    if (item.path && isExactPathActive(item.id)) return true;
    if (item.sub) {
      return item.sub.some((child) => isExactPathActive(child.id));
    }
    return false;
  };

  useEffect(() => {
    for (const menu of menus) {
      if (!hasAccess(menu.roles)) continue;
      if (menu.sub && isBranchActive(menu)) {
        setOpenMain(menu.id);
        break;
      }
    }
  }, [location.pathname]);

  const toggleMain = (menuId) => {
    setOpenMain((prev) => (prev === menuId ? null : menuId));
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('token'); 
      if (typeof showAlert === 'function') {
        showAlert({ icon: "success", title: "تم تسجيل الخروج بنجاح" });
      }
      setTimeout(() => {
        window.location.href = '/login'; 
      }, 500);
      await api.post('/users/logout'); 
      localStorage.clear();
    } catch (err) {
      console.error("Logout Error:", err);
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  return (
    <div className="no-print">
      <button 
        onClick={() => setIsOpenMobile(!isOpenMobile)}
        className="xl:hidden fixed top-4 left-4 z-50 p-2 bg-dark text-white rounded-md border border-slate-700 shadow-xl"
      >
        {isOpenMobile ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 xl:hidden transition-opacity"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      <div className={`
        fixed xl:static inset-y-0 right-0 z-40
        w-72 h-screen bg-dark text-slate-300 p-4 flex flex-col border-l border-slate-800
        transition-transform duration-300 ease-in-out transform
        ${isOpenMobile ? "translate-x-0" : "translate-x-full xl:translate-x-0"}
      `} dir="rtl">
        
        <div className="flex items-center gap-3 px-2 mb-8 mt-2">   
          <div className="w-8 h-8 text-white rounded-xl flex items-center justify-center bg-orange font-bold shrink-0">
            <FactoryIcon size={18} />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide truncate">
            {settings?.factoryName || "لوحة التحكم"}
          </h2>
        </div>
        
        <nav className="flex-1 overflow-y-auto custom-scrollbar pr-1">
          {menus.map(menu => {
            if (!hasAccess(menu.roles)) return null;

            const isOpen = openMain === menu.id;
            const parentActive = isBranchActive(menu);

            return (
              <div key={menu.id} className="mb-1">
                {menu.sub ? (
                  <>
                    <div 
                      onClick={() => toggleMain(menu.id)}
                      className={`
                        group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200
                        ${isOpen ? 'bg-slate-800 text-white' : parentActive ? 'text-blue-400' : 'hover:bg-slate-800/50 hover:text-white'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`${isOpen || parentActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-400'}`}>
                          {menu.icon}
                        </span>
                        <span className={`text-[15px] ${parentActive ? 'font-bold' : 'font-medium'}`}>{menu.label}</span>
                      </div>
                      
                      <ChevronDown 
                        size={16} 
                        className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} 
                      />
                    </div>

                    <div className={`
                      overflow-hidden transition-all duration-300 ease-in-out
                      ${isOpen ? "max-h-[1000px] opacity-100 mt-1" : "max-h-0 opacity-0"}
                    `}>
                      <div className="mr-4 border-r border-slate-700 space-y-1">
                        {menu.sub.filter(sub => hasAccess(sub.roles)).map(sub => {
                          const isSubActive = isExactPathActive(sub.id);
                          return (
                            <Link 
                              key={sub.id} 
                              to={getPath(sub.id)}
                              onClick={() => setIsOpenMobile(false)}
                              className="block"
                            >
                              <div 
                                className={`
                                  cursor-pointer py-2 px-4 text-sm rounded-l-xl transition-colors
                                  ${isSubActive 
                                    ? 'text-blue-400 font-bold bg-slate-800/80 border-r-2 border-blue-400' 
                                    : 'text-slate-400 hover:text-blue-400 hover:bg-slate-800/30'}
                                `}
                              >
                                {sub.label}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <Link 
                    to={getPath(menu.id)} 
                    onClick={() => setIsOpenMobile(false)}
                  >
                    <div 
                      className={`
                        group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200
                        ${isExactPathActive(menu.id) ? 'bg-slate-800 text-blue-400 font-bold' : 'hover:bg-slate-800/50 hover:text-white'}
                      `}
                    >
                      <span className={`${isExactPathActive(menu.id) ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-400'}`}>
                        {menu.icon}
                      </span>
                      <span className={`text-[15px] ${isExactPathActive(menu.id) ? 'font-bold' : 'font-medium'}`}>{menu.label}</span>
                    </div>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 shrink-0 bg-dark/5 p-2 rounded-3xl">
          <button 
            onClick={handleLogout}
            className="flex w-full mb-3 items-center gap-3 text-rose-500 hover:bg-rose-500/10 px-4 py-2.5 rounded-2xl transition-all duration-300 font-bold group"
          >
            <div className="bg-rose-500/10 p-2 rounded-xl group-hover:bg-rose-500/20 transition-colors">
              <LogOut size={18} />
            </div>
            <span className="text-sm">تسجيل الخروج</span>
          </button>

          <div className="flex items-center gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-orange flex items-center justify-center text-sm font-black text-white shadow-md">
              {role ? role[0].toUpperCase() : 'U'}
            </div>
            
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                مرحباً بك
              </span>
              <span className="text-sm font-bold text-white truncate capitalize">
                {role === "superadmin" ? "مدير عام" : role === "admin" ? "مشرف" : "مدير"}
              </span>
            </div>

            <div className="mr-auto w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Sidebar;