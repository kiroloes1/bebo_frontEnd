import React from 'react';
import { 
  FaFacebook, 
  FaInstagram, 
  FaWhatsapp,
  FaPhone, 
  FaMapMarkerAlt,
  FaShieldAlt,
  FaUserAlt 
} from "react-icons/fa";
import { useSystemSettings } from '../context/shareInfo';

function Footer() {
  const currentYear = new Date().getFullYear();
  const { settings } = useSystemSettings();

  return (
    <footer className="no-print mt-auto w-full bg-dark text-ligth py-12 sm:py-16 border-t-2 border-brown/30 relative overflow-hidden" dir="rtl">
      

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* القسم العلوي: الهوية وإصدار النظام */}
        <div className="flex flex-col sm:flex-row justify-between items-center  mb-10  gap-6 text-center sm:text-right">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex flex-col">
              <h3 className="text-ligth font-extrabold text-lg sm:text-xl tracking-wide">
                {settings?.factoryName || "المعرض"}
              </h3>
              <p className="text-ligth/60 text-xs mt-1">للخدمات البيطريه</p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-2 bg-brown/10 rounded-full border border-brown/20 backdrop-blur-sm">

            <p className="text-ligth/90 text-xs sm:text-sm font-semibold">
              نظام الإدارة الذكي v2.0
            </p>
          </div>
        </div>

        {/* القسم السفلي: الحقوق، السوشيال ميديا، والمطور */}
        <div className="flex flex-col md:flex-row items-center justify-between  gap-6">
          

          
          {/* حقوق النشر */}
          <p className="text-ligth/50 text-xs sm:text-sm font-medium order-first md:order-none text-center">
            © {currentYear} جميع الحقوق محفوظة لـ <span className="text-brown font-bold">{settings?.factoryName || "المعرض"}</span>
          </p>

          {/* بيانات المبرمج */}
          <div className="flex flex-col items-center md:items-end gap-0.5">
            <div className="text-[10px] text-ligth/40 font-bold tracking-[1.5px] uppercase">
              Developed by <span className="text-brown font-extrabold">Kiroloes Reda</span>
            </div>
            <div className="text-[9px] text-ligth/30 font-semibold tracking-wider">01270857659</div>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;