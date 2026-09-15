// excelDictionary.js

// ==========================================
// ترجمة أسماء الأعمدة
// ==========================================

export const excelLabels = {
  _id: "المعرف",
  id: "المعرف",

    method:"طريقه",
    incomingCount:"عدد المدخلات",
    incomingAmount:"اجمالي الداخل",
    outgoingCount:"عدد المخرجات",
    outgoingAmount:"اجمال المخرجات",
    module:"النموذج",
  // General
  createdAt: "تاريخ الإنشاء",
  updatedAt: "تاريخ التعديل",

  // Customer
  customer: "العميل",
  customerId: "معرف العميل",
  name: "الاسم",
  phone: "رقم الهاتف",
  balance: "الرصيد",
  openningBalance: "الرصيد الافتتاحي",
  openningBalanceDate: "تاريخ الرصيد الافتتاحي",
  notes: "ملاحظات",

  // Supplier
  supplier: "المورد",
  supplierId: "معرف المورد",

  // User
  user: "المستخدم",
  username: "اسم المستخدم",
  email: "البريد الإلكتروني",
  password: "كلمة المرور",
  role: "الصلاحية",
  isVerified: "تم التحقق",
  passwordChangedAt: "تاريخ تغيير كلمة المرور",
  lastLogin: "آخر تسجيل دخول",
  pending: "معلق",
  pandding: "معلق",

  // Product
  product: "المنتج",
  productName: "اسم المنتج",
  code: "كود المنتج",
  description: "الوصف",
  category: "التصنيف",
  companyName: "اسم الشركة",

  unit_type: "نوع الوحدة",
  unitsPerPackage: "عدد الوحدات في الكرتونة",
  availableQuantity: "الكمية المتاحة",
  totalUnits: "إجمالي الوحدات",

  packageSellingPrice: "سعر بيع الكرتونة",
  pieceSellingPrice: "سعر بيع القطعة",
  purchasePrice: "سعر الشراء",

  image: "الصورة",
  expiration: "تاريخ انتهاء الصلاحية",
  status: "الحالة",

  // Invoice
  invoice: "الفاتورة",
  invoiceNumber: "رقم الفاتورة",
  invoiceDate: "تاريخ الفاتورة",
  oldCustomerBalance: "رصيد العميل السابق",

  items: "المنتجات",
  quantity: "الكمية",
  price: "السعر",
  subtotal: "الإجمالي الفرعي",

  totalPrice: "الإجمالي",
  discount: "الخصم",
  finalPrice: "الإجمالي النهائي",

  adminNote: "ملاحظات الإدارة",

  // Purchase
  purchase: "المشتريات",
  purchaseNumber: "رقم المشتريات",
  purchaseDate: "تاريخ المشتريات",
  oldSupplierBalance: "رصيد المورد السابق",

  // Payment
  payment: "الدفع",
  amount: "المبلغ",
  paymentMethod: "طريقة الدفع",
  moneyFlow: "حركة الأموال",
  transactionDate: "تاريخ العملية",

  walletInfo: "بيانات المحفظة",
  senderName: "اسم المرسل",
  senderPhone: "رقم هاتف المرسل",
  receiverName: "اسم المستلم",
  receiverPhone: "رقم هاتف المستلم",

  bankInfo: "بيانات البنك",
  bankName: "اسم البنك",

  createdBy: "أنشأ بواسطة",
  updatedBy: "عدل بواسطة",

  // Expense
  expense: "المصروف",
  expenseDate: "تاريخ المصروف",
  title: "اسم المصروف",
  note: "ملاحظة",
  totalAmount: "إجمالي المبلغ",

  // Sales Return
  returnNumber: "رقم المرتجع",
  returnDate: "تاريخ المرتجع",
  invoiceQuantity: "كمية الفاتورة",
  returnQuantity: "الكمية المرتجعة",
  type: "النوع",

  // System Settings
  factoryName: "اسم المصنع",
  invoiceFactoryName: "اسم المصنع على الفاتورة",
  systemFont: "خط النظام",
  invoiceFont: "خط الفاتورة",

  financialPin: "الرقم السري المالي",
  financialPinUpdatedBy: "تم تحديث الرقم السري بواسطة",
  financialPinUpdatedDate: "تاريخ تحديث الرقم السري",

  theme: "المظهر",
  primary: "اللون الأساسي",
  secondary: "اللون الثانوي",
  accent: "اللون المميز",
  background: "لون الخلفية",
  totalQuantity:"اجمالي العدد",
totalRevenue:"اجمالي الارباح",
timesSold:"عدد مرات البيع",
totalReturnQuantity:"اجمالي عدد المرتجع",
	totalReturnAmount:"اجمالي قيمه المرتجع",
    timesReturned:"عدد مرات المرتجع",

    totalCost:"اجمالي التكلفه",
    timesPurchased:"عدد مرات الشراء"

};


// ==========================================
// ترجمة قيم البيانات
// ==========================================

export const excelValues = {


  // Status
  active: "نشط",
  inactive: "غير نشط",
  "out-of-stock": "نفد المخزون",

  paid: "مدفوعة",
  unpaid: "غير مدفوعة",
  partPaid: "مدفوعة جزئياً",
  return: "مرتجع",

  completed: "مكتمل",
  cancelled: "ملغي",
  debt:"مديونيه",
  pay:"سداد",
  invoices:"فواتير",
  purchase:"مشتريات",

  // Payment Methods
  cash: "نقدي",
  wallet: "محفظة إلكترونية",
  instapay: "إنستاباي",
  work: "شغل / حساب",

  // Money Flow
  incoming: "وارد",
  outgoing: "صادر",

  // Units
  "قطعة": "قطعة",
  "كرتونة": "كرتونة",

  // Return type
  invoice: "فاتورة بيع",
  purchase: "مشتريات",

  // Roles
  superadmin: "مدير النظام",
  manager: "مدير",

  // Boolean
  true: "نعم",
  false: "لا",
};


// ==========================================
// Dictionary كامل
// ==========================================

const excelDictionary = {
  ...excelLabels,
  ...excelValues,
};

export default excelDictionary;