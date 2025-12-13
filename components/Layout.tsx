import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Hexagon, Lock, MapPin, ExternalLink, Phone, Mail, ArrowUp, User } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { t, toggleLang, lang, dir } = useLanguage();
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if we are on a transparent header page (Home) or standard page
  const isHomePage = location.pathname === '/';
  const headerClass = isHomePage && !scrolled 
    ? 'bg-transparent text-white' 
    : 'bg-white/95 backdrop-blur shadow-sm text-ukra-navy';

  const navLinks = [
    { name: t('nav_home'), path: '/' },
    { name: t('nav_supplies'), path: '/#supplies' }, 
    { name: t('nav_design'), path: '/#design' },
    { name: t('nav_projects'), path: '/#development' },
  ];

  const logoColor = isHomePage && !scrolled ? 'text-white' : 'text-ukra-navy';

  // Mobile Menu Logic
  const closeMenu = () => setIsOpen(false);
  const sideClass = lang === 'ar' 
    ? (isOpen ? 'translate-x-0' : 'translate-x-full') 
    : (isOpen ? 'translate-x-0' : '-translate-x-full');

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${headerClass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            <Link to="/" className={`flex items-center space-x-2 ${logoColor}`}>
              <span className="font-cairo font-black text-2xl tracking-wider">UKRA<span className="text-ukra-gold">.SA</span></span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <div className="flex items-baseline space-x-8 rtl:space-x-reverse">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={`#${link.path.split('#')[1] || ''}`}
                    onClick={() => { if(link.path === '/') window.scrollTo(0,0); }}
                    className={`relative font-bold text-sm hover:text-ukra-gold transition-colors duration-200 group`}
                  >
                    {link.name}
                    <span className="absolute bottom-[-5px] left-0 w-0 h-[2px] bg-ukra-gold transition-all duration-300 group-hover:w-full"></span>
                  </a>
                ))}
                <Link to="/furniture-request" className="font-bold text-sm hover:text-ukra-gold transition-colors">تأثيث فندقي</Link>
                <Link to="/design-request" className="font-bold text-sm hover:text-ukra-gold transition-colors">{t('btn_req_design')}</Link>
              </div>
              
              <button 
                onClick={toggleLang} 
                className="border border-ukra-gold text-ukra-gold px-4 py-1 rounded-full text-xs font-bold hover:bg-ukra-gold hover:text-white transition"
              >
                {lang === 'ar' ? 'EN' : 'AR'}
              </button>

              {user ? (
                 <Link to="/my-requests" className="text-ukra-gold font-bold flex items-center gap-1 hover:text-white bg-ukra-navy px-3 py-1 rounded-md">
                   <User className="w-4 h-4" /> Account
                 </Link>
              ) : (
                 <Link to="/client-login" className="text-ukra-gold font-bold text-sm hover:underline">
                    Log In
                 </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="-mr-2 flex md:hidden items-center gap-3">
              {!user && (
                 <Link to="/client-login" className={`text-xs font-bold border border-ukra-gold px-2 py-1 rounded ${logoColor}`}>
                    Login
                 </Link>
              )}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md hover:text-ukra-gold focus:outline-none"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay (Backdrop) */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-[55] backdrop-blur-sm transition-opacity md:hidden"
            onClick={closeMenu}
          />
        )}

        {/* Mobile Menu Panel (80% Width) */}
        <div className={`fixed top-0 bottom-0 ${lang === 'ar' ? 'right-0' : 'left-0'} w-[80%] max-w-sm bg-white z-[60] shadow-2xl transform transition-transform duration-300 ease-out flex flex-col p-6 ${sideClass} md:hidden`}>
           <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
              <span className="font-black text-2xl text-ukra-navy">UKRA<span className="text-ukra-gold">.SA</span></span>
              <button onClick={closeMenu} className="p-2 text-gray-400 hover:text-red-500">
                <X className="w-6 h-6" />
              </button>
           </div>

           <div className="flex flex-col gap-4">
             {user && (
               <Link to="/my-requests" onClick={closeMenu} className="bg-ukra-navy text-white p-4 rounded-xl flex items-center gap-3 mb-4">
                 <div className="bg-ukra-gold p-2 rounded-full text-ukra-navy"><User className="w-6 h-6" /></div>
                 <div>
                   <p className="text-xs text-gray-300">Welcome</p>
                   <p className="font-bold">{user.name}</p>
                 </div>
               </Link>
             )}
           
             <a href="#hero" onClick={closeMenu} className="text-lg font-bold text-ukra-navy hover:text-ukra-gold transition">{t('nav_home')}</a>
             <Link to="/furniture-request" onClick={closeMenu} className="text-lg font-bold text-ukra-navy hover:text-ukra-gold transition">تأثيث فندقي</Link>
             <a href="#supplies" onClick={closeMenu} className="text-lg font-bold text-ukra-navy hover:text-ukra-gold transition">{t('nav_supplies')}</a>
             <a href="#design" onClick={closeMenu} className="text-lg font-bold text-ukra-navy hover:text-ukra-gold transition">{t('nav_design')}</a>
             <a href="#development" onClick={closeMenu} className="text-lg font-bold text-ukra-navy hover:text-ukra-gold transition">{t('nav_projects')}</a>
             <Link to="/design-request" onClick={closeMenu} className="text-lg font-bold text-ukra-navy hover:text-ukra-gold transition">{t('btn_req_design')}</Link>
             
             {!user && (
               <Link to="/client-login" onClick={closeMenu} className="mt-4 py-3 bg-gray-100 text-center rounded-lg font-bold text-ukra-navy">
                  Log In / Register
               </Link>
             )}
           </div>
           
           <div className="mt-auto border-t border-gray-100 pt-6">
              <button onClick={()=>{toggleLang(); closeMenu()}} className="w-full py-3 border border-ukra-gold text-ukra-gold font-bold rounded hover:bg-ukra-gold hover:text-white transition">
                {lang === 'ar' ? 'Switch to English' : 'تغيير للعربية'}
              </button>
              
              <Link to="/admin-login" onClick={closeMenu} className="block text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                 <Lock className="w-3 h-3" /> Admin Access
              </Link>
           </div>
        </div>
      </nav>
      <ScrollToTop />
    </>
  );
};

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

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
        {/* Col 1: Logo & Desc */}
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
        
        {/* Col 2: Links */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-bold text-lg relative inline-block mb-2">
             {t('footer_links')}
             <span className="block h-[2px] w-10 bg-ukra-gold mt-2 mx-auto md:mx-0"></span>
          </h4>
          <ul className="space-y-3 text-sm">
             <li><a href="#hero" className="hover:text-ukra-gold transition flex items-center justify-center md:justify-start gap-2">{t('nav_home')}</a></li>
             <li><Link to="/furniture-request" className="hover:text-ukra-gold transition flex items-center justify-center md:justify-start gap-2">تأثيث فندقي</Link></li>
             <li><Link to="/design-request" className="hover:text-ukra-gold transition flex items-center justify-center md:justify-start gap-2">{t('btn_req_design')}</Link></li>
             <li><a href="https://ukrastore.com" className="hover:text-ukra-gold transition flex items-center justify-center md:justify-start gap-2">{t('footer_store')}</a></li>
             <li><a href="#" className="hover:text-ukra-gold transition flex items-center justify-center md:justify-start gap-2">{t('footer_privacy')}</a></li>
          </ul>
        </div>

        {/* Col 3: Map */}
        <div className="flex flex-col gap-4">
           <h4 className="text-white font-bold text-lg relative inline-block mb-2">
             {t('footer_loc')}
             <span className="block h-[2px] w-10 bg-ukra-gold mt-2 mx-auto md:mx-0"></span>
           </h4>
           <div className="h-40 bg-[#222] rounded-xl relative overflow-hidden border border-gray-700">
             <iframe 
                src="https://maps.google.com/maps?q=Madinah&t=&z=13&ie=UTF8&iwloc=&output=embed" 
                width="100%" 
                height="100%" 
                style={{border:0, filter: 'grayscale(100%) invert(90%)'}} 
                allowFullScreen 
                loading="lazy"
             ></iframe>
             <a href="https://maps.app.goo.gl/your-link" target="_blank" rel="noreferrer" className="absolute inset-0 z-10"></a>
           </div>
           <a href="https://maps.app.goo.gl/your-link" target="_blank" rel="noreferrer" className="text-ukra-gold text-sm inline-flex items-center justify-center md:justify-start gap-2 hover:underline">
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

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { dir } = useLanguage();
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-cairo" dir={dir}>
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
};