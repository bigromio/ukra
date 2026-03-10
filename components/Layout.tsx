import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Lock, MapPin, ExternalLink, Phone, Mail, ArrowUp, User, Calendar, Calculator, ShoppingBag, LayoutDashboard } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isClientLoggedIn, setIsClientLoggedIn] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { t, toggleLang, lang } = useLanguage();
  const { user } = useAuth(); 

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    const checkClientAuth = () => setIsClientLoggedIn(localStorage.getItem('isAuthenticated') === 'true');

    window.addEventListener('scroll', handleScroll);
    checkClientAuth();
    window.addEventListener('storage', checkClientAuth);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', checkClientAuth);
    };
  }, []);

  // إغلاق القائمة الجانبية تلقائياً عند تغيير الصفحة
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const anyAuth = user || isClientLoggedIn;
  const isTransparentHeaderPage = location.pathname === '/' || location.pathname === '/wood-catalog';
  
  const headerClass = isTransparentHeaderPage && !scrolled 
    ? 'bg-transparent text-white shadow-none' 
    : 'bg-white shadow-sm text-ukra-navy';

  const logoColor = isTransparentHeaderPage && !scrolled ? 'text-white' : 'text-ukra-navy';

  // التبويبات الموحدة للموقع (ستُستخدم في سطح المكتب والجوال)
  const navLinks = [
    { name: t('nav_home'), path: '/' },
    { name: t('nav_store'), path: '/store' },
    { name: t('nav_supplies'), path: '/#supplies' }, 
    { name: t('nav_design'), path: '/#design' },
    { name: t('nav_projects'), path: '/#development' },
  ];

  const closeMenu = () => setIsOpen(false);
  const sideClass = lang === 'ar' 
    ? (isOpen ? 'translate-x-0' : 'translate-x-full') 
    : (isOpen ? 'translate-x-0' : '-translate-x-full');

  return (
    <>
      {/* الشريط العلوي - z-index مرتفع 100 */}
      <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 ${headerClass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            <Link to="/" className={`flex items-center space-x-2 ${logoColor}`}>
              <span className="font-cairo font-black text-2xl tracking-wider">UKRA<span className="text-ukra-gold">.SA</span></span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-6">
              <div className="flex items-baseline space-x-6 rtl:space-x-reverse">
                {navLinks.map((link) => (
                  link.path.startsWith('/#') ? (
                    <a key={link.name} href={link.path.substring(1)} className="relative font-bold text-sm hover:text-ukra-gold transition-colors duration-200 group">
                      {link.name}
                      <span className="absolute bottom-[-5px] left-0 w-0 h-[2px] bg-ukra-gold transition-all duration-300 group-hover:w-full"></span>
                    </a>
                  ) : (
                    <Link key={link.name} to={link.path} className="relative font-bold text-sm hover:text-ukra-gold transition-colors duration-200 group">
                      {link.name}
                      <span className="absolute bottom-[-5px] left-0 w-0 h-[2px] bg-ukra-gold transition-all duration-300 group-hover:w-full"></span>
                    </Link>
                  )
                ))}
                
                <Link to="/wood-catalog" className="font-bold text-sm hover:text-ukra-gold transition-colors text-ukra-gold">كتالوج الأخشاب</Link>
                <Link to="/hotel-advisor" className="font-bold text-sm hover:text-ukra-gold transition-colors flex items-center gap-1">
                   <Calculator className="w-4 h-4" /> مستشار الفنادق
                </Link>
                <Link to="/book-appointment" className="font-bold text-sm flex items-center gap-1 bg-ukra-gold text-white px-3 py-1 rounded-full hover:bg-white hover:text-ukra-navy transition">
                   <Calendar className="w-3 h-3" /> {t('book_title')}
                </Link>
              </div>
              
              <button onClick={toggleLang} className="border border-ukra-gold text-ukra-gold px-3 py-1 rounded-full text-xs font-bold hover:bg-ukra-gold hover:text-white transition">
                {lang === 'ar' ? 'EN' : 'AR'}
              </button>

              {anyAuth ? (
                 <Link to="/dashboard" className="bg-[#1a2a3a] text-ukra-gold font-bold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-ukra-gold hover:text-white transition-all">
                    <LayoutDashboard className="w-4 h-4" /> 
                    {lang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                 </Link>
              ) : (
                 <Link to="/client-login" className="text-ukra-gold font-bold text-sm hover:underline border-b-2 border-transparent hover:border-ukra-gold transition-all">
                    {lang === 'ar' ? 'تسجيل دخول' : 'Log In'}
                 </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="-mr-2 flex lg:hidden items-center gap-3">
              {anyAuth ? (
                <Link to="/dashboard" className={`p-2 rounded-full bg-ukra-gold/10 text-ukra-gold`}>
                   <User className="h-6 w-6" />
                </Link>
              ) : (
                <Link to="/client-login" className={`text-xs font-bold border border-ukra-gold px-2 py-1 rounded ${logoColor}`}>
                   Login
                </Link>
              )}
              <button onClick={() => setIsOpen(true)} className="p-2 rounded-md hover:text-ukra-gold">
                <Menu className={`h-6 w-6 ${logoColor}`} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Panel - Overlays - z-index عالي جداً 990 لمنع أي تداخل */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[990] backdrop-blur-sm lg:hidden" onClick={closeMenu} />
      )}
      
      {/* Mobile Menu Panel - تم وضع bg-white صريحة و z-index عالي جداً 1000 */}
      <div className={`fixed top-0 bottom-0 ${lang === 'ar' ? 'right-0' : 'left-0'} w-[85%] max-w-sm bg-white z-[1000] shadow-2xl transform transition-transform duration-300 ease-out flex flex-col p-6 ${sideClass} lg:hidden`}>
         <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6 shrink-0">
            <span className="font-black text-2xl text-ukra-navy">UKRA<span className="text-ukra-gold">.SA</span></span>
            <button onClick={closeMenu} className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-full">
              <X className="w-5 h-5" />
            </button>
         </div>

         <div className="flex flex-col gap-4 overflow-y-auto pb-6 custom-scrollbar">
           {anyAuth ? (
             <Link to="/dashboard" onClick={closeMenu} className="bg-ukra-navy text-white p-4 rounded-xl flex items-center gap-3 mb-4">
               <div className="bg-ukra-gold p-2 rounded-full text-ukra-navy"><User className="w-6 h-6" /></div>
               <div>
                 <p className="text-xs text-gray-300">{lang === 'ar' ? 'أهلاً بك' : 'Welcome'}</p>
                 <p className="font-bold">{user?.name || (localStorage.getItem('ukra_client_name')) || (lang === 'ar' ? 'العميل' : 'Client')}</p>
               </div>
             </Link>
           ) : (
             <Link to="/client-login" onClick={closeMenu} className="py-3 bg-ukra-gold text-ukra-navy text-center rounded-lg font-bold mb-4">
                {lang === 'ar' ? 'دخول / تسجيل' : 'Log In / Register'}
             </Link>
           )}
         
           {/* ✅ تطابق التبويبات تماماً مع سطح المكتب */}
           {navLinks.map((link) => (
              link.path.startsWith('/#') ? (
                <a key={link.name} href={link.path.substring(1)} onClick={closeMenu} className="text-lg font-bold text-ukra-navy border-b border-gray-50 pb-3">
                  {link.name}
                </a>
              ) : (
                <Link key={link.name} to={link.path} onClick={closeMenu} className="text-lg font-bold text-ukra-navy border-b border-gray-50 pb-3 flex items-center gap-2">
                  {link.path === '/store' && <ShoppingBag className="w-5 h-5 text-ukra-gold" />}
                  {link.name}
                </Link>
              )
            ))}

           <Link to="/wood-catalog" onClick={closeMenu} className="text-lg font-bold text-ukra-gold bg-yellow-50 p-3 rounded-lg mt-2">كتالوج الأخشاب</Link>
           <Link to="/hotel-advisor" onClick={closeMenu} className="text-lg font-bold text-ukra-navy flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
              <Calculator className="w-5 h-5 text-ukra-gold" /> مستشار الفنادق
           </Link>
           <Link to="/book-appointment" onClick={closeMenu} className="text-lg font-bold text-white bg-ukra-navy p-3 rounded-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-ukra-gold" /> {t('book_title')}
           </Link>
         </div>
         
         <div className="mt-auto border-t border-gray-100 pt-6 shrink-0">
            <button onClick={()=>{toggleLang(); closeMenu()}} className="w-full py-3 border-2 border-ukra-gold text-ukra-gold font-bold rounded-xl hover:bg-ukra-gold hover:text-white transition">
              {lang === 'ar' ? 'Switch to English' : 'تغيير للعربية'}
            </button>
            <Link to="/admin-login" onClick={closeMenu} className="block text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
               <Lock className="w-3 h-3" /> Admin Access
            </Link>
         </div>
      </div>
    </>
  );
};

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const toggleVisibility = () => setIsVisible(window.scrollY > 300);
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  return (
    <div className={`scroll-to-top ${isVisible ? 'show' : ''}`} onClick={scrollToTop}>
      <ArrowUp className="w-6 h-6" />
    </div>
  );
};

export const Footer = () => {
  const { t } = useLanguage();
  return (
    <footer className="bg-ukra-navy text-gray-400 py-12 border-t-4 border-ukra-gold">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-start">
        <div className="flex flex-col gap-6">
          <h2 className="text-3xl font-black text-white">UKRA<span className="text-ukra-gold">.SA</span></h2>
          <p className="text-sm leading-loose max-w-xs mx-auto md:mx-0">{t('footer_desc')}</p>
          <div className="flex flex-col gap-2 text-ukra-gold text-sm mt-2">
             <div className="flex items-center justify-center md:justify-start gap-2">
                 <Phone className="w-4 h-4" /> <span dir="ltr">+966 56 915 9938</span>
             </div>
             <div className="flex items-center justify-center md:justify-start gap-2">
                 <Mail className="w-4 h-4" /> <span>sales@ukra.sa</span>
             </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-bold text-lg mb-2">
             {t('footer_links')}
             <span className="block h-[2px] w-10 bg-ukra-gold mt-2 mx-auto md:mx-0"></span>
          </h4>
          <ul className="space-y-3 text-sm">
             <li><Link to="/" className="hover:text-ukra-gold transition">{t('nav_home')}</Link></li>
             <li><Link to="/wood-catalog" className="hover:text-ukra-gold transition">كتالوج الأخشاب</Link></li>
             <li><Link to="/book-appointment" className="hover:text-ukra-gold transition">{t('book_title')}</Link></li>
             <li><Link to="/hotel-advisor" className="hover:text-ukra-gold transition">مستشار الفنادق</Link></li>
          </ul>
        </div>

        <div className="flex flex-col gap-4">
           <h4 className="text-white font-bold text-lg mb-2">
             {t('footer_loc')}
             <span className="block h-[2px] w-10 bg-ukra-gold mt-2 mx-auto md:mx-0"></span>
           </h4>
           <div className="h-40 bg-[#222] rounded-xl relative overflow-hidden border border-gray-700">
             <iframe src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d14502.812328224!2d39.61!3d24.47!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjTCsDI4JzEyLjAiTiAzOcKwMzYnMzYuMCJF!5e0!3m2!1sen!2ssa!4v1630000000000!5m2!1sen!2ssa" width="100%" height="100%" style={{border:0, filter: 'grayscale(100%) invert(90%)'}} allowFullScreen loading="lazy"></iframe>
           </div>
           <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="text-ukra-gold text-sm inline-flex items-center justify-center md:justify-start gap-2 hover:underline">
             <MapPin className="w-4 h-4" /> {t('btn_map')} <ExternalLink className="w-3 h-3" />
           </a>
        </div>
      </div>
      <div className="mt-16 pt-8 border-t border-gray-800 text-center text-xs text-gray-500">
        {t('footer_rights')}
      </div>
    </footer>
  );
};

export const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { dir } = useLanguage();
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-cairo" dir={dir}>
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
};