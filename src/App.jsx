import { BrowserRouter, Route, Routes } from "react-router-dom";
import SuperAdminLayout from "./Layout/SuperAdmin";
import NotFound from "./pages/404Page";
import ScrollToTop from "./services/scrollToTop";
import ProtectedRoute from "./services/protectRoutes";
import ProtectedAccess from "./services/protectAccess";

import Login from "./pages/auth/Login";
import Footer from "./pages/footer";

import ForgetPassword from "./pages/auth/forgetPassword";
import ResetPassword from "./pages/auth/resetPassword";
import { FaAngleUp } from "react-icons/fa";

import AddAdmin from "./pages/admins/addAdmin"
import ManageAdmins  from "./pages/admins/Adminsmanagment"

import Expenses  from "./pages/expenses/expenses"
import Profile  from "./pages/auth/profile"
import SettingsPage  from "./pages/settings/informations"

import CustomerForm from "./pages/customer/createCustomer"
import EditCustomer from "./pages/customer/editCustomer"
// import CustomerBalanceAutocomplete from "./pages/customer/customerBalance"
import AddSupplierFormSUP from "./pages/supplier/createSupplier"
import EditSupplier from "./pages/supplier/editSupplier"
import CustomerBalanceAutocomplete from "./pages/customer/customerBalance";
import SupplierBalanceAutocomplete from "./pages/supplier/supplierBalance";
import ProductList from "./pages/product/displayAllProduct";
import ProductManager from "./pages/product/createProduct";
import CreateInvoice from "./pages/invoices/createInvoice";
import InvoicesList from "./pages/invoices/InvoicesList";
import UpdateInvoice from "./pages/invoices/updateInvoice";
import InvoicePrint from "./pages/invoices/print";
import Scanner from "./pages/scanner/Scanner";
import SalesReturnsManagement from "./pages/invoiceReturn/return";
import PurchaseForm from "./pages/purchase/PurchaseForm";
import PurchaseList from "./pages/purchase/PurchaseList";
import UpdatePurchase from "./pages/purchase/UpdatePurchase";
import Dashboard from "./pages/dashboard/dashboard";
import PaymentDashboard from "./pages/dashboard/PaymentDashboard";
import ProductReports from "./pages/reports/productReport";
import SalesReport from "./pages/reports/SalesReport";
import PurchasesReport from "./pages/reports/purchaseReport";
import PurchasePrint from "./pages/purchase/purchasePrint";
import CustomerList from "./pages/customer/customerList";
import InvoiceStatement from "./pages/customer/customerStatement";
import SupplierList from "./pages/supplier/suplierList";
import SupplierStatement from "./pages/supplier/supplierStatement";
import BackupSettings from "./pages/settings/backupSystem";
import SearchInvoice from "./pages/invoiceReturn/invoiceReturnForm";
import SearchPurchase from "./pages/invoiceReturn/purchaseReturnForm";
import NotificationsPage from "./pages/NotificationsPage";
// import SupplierBalanceAutocomplete from "./pages/supplier/supplierBalance"

// import BackButton from "./services/backButton";

function App() {
   const upToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const savedSettings = JSON.parse(localStorage.getItem("settings"));

if (savedSettings?.theme) {
  const root = document.documentElement;

  root.style.setProperty("--primary", savedSettings.theme.primary);
  root.style.setProperty("--secondary", savedSettings.theme.secondary);
  root.style.setProperty("--accent", savedSettings.theme.accent);
  root.style.setProperty("--background", savedSettings.theme.background);

  root.style.setProperty("--system-font", savedSettings.systemFont);
  root.style.setProperty("--invoice-font", savedSettings.invoiceFont);

}

return (
  <div className="">


    <BrowserRouter>
     {/* <BackButton /> */}
      <ScrollToTop />
  

      

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forget-Password" element={<ForgetPassword />} />
        <Route path="/reset-Password" element={<ResetPassword />} />
          <Route
          path="/scanner/:sessionId"
          element={<Scanner />}
        />
        {/* Super Admin */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ProtectedAccess role="superadmin">
                <SuperAdminLayout />
              </ProtectedAccess>
            </ProtectedRoute>
          }
        >

             {/* Dashboard */}
           <Route path="/" element={<Dashboard />} />
           <Route path="/PaymentDashboard" element={<PaymentDashboard />} />



          {/* customer */}
          <Route path="/customer/add" element={<CustomerForm />} />
          <Route path="/customer/edit/:id" element={<EditCustomer />} />
          <Route path="/customer/payments" element={<CustomerBalanceAutocomplete />} />
          <Route path="/customer" element={<CustomerList />} />
          <Route path="/customer/printCustomerDetails/:customerId" element={<InvoiceStatement />} />



          {/* supplier */}
          <Route path="/supplier/add" element={<AddSupplierFormSUP />} />
          <Route path="/supplier/edit/:id" element={<EditSupplier />} />
         <Route path="/supplier/payments" element={<SupplierBalanceAutocomplete />} />
         <Route path="/supplier/" element={<SupplierList />} />
         <Route path="/supplier/printSupplierDetails/:supplierId" element={<SupplierStatement />} />

 
 

         {/* product  */}
          <Route path="/product" element={<ProductList />} />
          <Route path="/product/add" element={<ProductManager />} />

 
         {/*invoice  */}
          <Route path="/invoices/add" element={<CreateInvoice />} />
          <Route path="/invoices" element={<InvoicesList />} />
          <Route path="/invoices/edit/:id" element={<UpdateInvoice />} />
          <Route path="/invoices/print/:id" element={<InvoicePrint />} />

        <Route
          path="/salesReturn/"
          element={<SalesReturnsManagement />}
        />
                <Route
          path="/salesReturn/SearchInvoice"
          element={<SearchInvoice />}
        />
                        <Route
          path="/salesReturn/SearchPurchase"
          element={<SearchPurchase />}
        />

        
        

        {/* pyrchase */}
          <Route path="/purchases/add" element={<PurchaseForm />} />
          <Route path="/purchases" element={<PurchaseList />} />
          <Route path="/purchases/edit/:id" element={<UpdatePurchase />} />
          <Route path="/purchases/print/:id" element={<PurchasePrint />} />


        {/* reports */}
          <Route path="/reports/product" element={<ProductReports />} />
          <Route path="/reports/invoice" element={<SalesReport />} />
          <Route path="/reports/purchase" element={<PurchasesReport />} />


        
         <Route path="/notifications" element={<NotificationsPage />} />

         
          {/* admin */}
        <Route path="/admin/add" element={<AddAdmin />} />
        <Route path="/admin/users" element={<ManageAdmins />} />

          
                  {/* Expenses */}
         <Route path="/expenses" element={<Expenses />} />





        {/* profile */}
        <Route path="/profile" element={<Profile />} />

        

        {/* settings */}
        <Route path="/settings/info" element={<SettingsPage />} />
        {/* <Route path="/settings/ActivityLogs" element={<ActivityLogs />} /> */}
        <Route path="/BackupSettings" element={<BackupSettings />} />

        
          

        </Route>



        {/* Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* UI Elements - Scroll To Top */}
      <div
        onClick={upToTop}
        className="no-print fixed bottom-8 left-8 z-50 
                  bg-accent text-ligth 
                  p-4 rounded-[20px] 
                  shadow-2xl
                  hover:bg-brown hover:-translate-y-2 
                  active:scale-90 
                  transition-all duration-300 cursor-pointer 
                   flex items-center justify-center"
        title="العودة للأعلى"
      >

        <FaAngleUp className="text-2xl text-light font-black relative z-10" />
       
      </div>

      <Footer />
    </BrowserRouter>
   
  </div>
);
}

export default App
