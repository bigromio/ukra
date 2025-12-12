import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Hexagon, Lock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { t, toggleLang, lang } = useLanguage();

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
    { name: t('nav_supplies'), path: '/#supplies' }, // Using Hash links for sections
    { name: t('nav_design'), path: '/#design' },
    { name: t('nav_projects'), path: '/#development' },
  ];

  const logoColor = isHomePage && !scrolled ? 'text-white' : 'text-ukra-navy';

  return (
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
              <Link to="/design-request" className="font-bold text-sm hover:text-ukra-gold transition-colors">{t('btn_req_design')}</Link>
            </div>
            
            <button 
              onClick={toggleLang} 
              className="border border-ukra-gold text-ukra-gold px-4 py-1 rounded-full text-xs font-bold hover:bg-ukra-gold hover:text-white transition"
            >
              {lang === 'ar' ? 'EN' : 'AR'}
            </button>

             <Link to="/admin-login" className="text-gray-400 hover:text-ukra-gold">
               <Lock className="w-4 h-4" />
             </Link>
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md hover:text-ukra-gold focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-white z-40 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : (lang==='ar'?'translate-x-full':'-translate-x-full')} md:hidden flex flex-col pt-24 px-6 gap-6 shadow-2xl`}>
         <a href="#hero" onClick={()=>setIsOpen(false)} className="text-xl font-bold text-ukra-navy border-b pb-4">{t('nav_home')}</a>
         <a href="#supplies" onClick={()=>setIsOpen(false)} className="text-xl font-bold text-ukra-navy border-b pb-4">{t('nav_supplies')}</a>
         <a href="#design" onClick={()=>setIsOpen(false)} className="text-xl font-bold text-ukra-navy border-b pb-4">{t('nav_design')}</a>
         <a href="#development" onClick={()=>setIsOpen(false)} className="text-xl font-bold text-ukra-navy border-b pb-4">{t('nav_projects')}</a>
         <Link to="/design-request" onClick={()=>setIsOpen(false)} className="text-xl font-bold text-ukra-navy border-b pb-4">{t('btn_req_design')}</Link>
         
         <button onClick={()=>{toggleLang(); setIsOpen(false)}} className="mt-4 w-full py-3 border border-ukra-gold text-ukra-gold font-bold rounded">
           {lang === 'ar' ? 'Switch to English' : 'تغيير للعربية'}
         </button>
      </div>
    </nav>
  );
};

export const Footer = () => {
  const { t } = useLanguage();
  return (
    <footer className="bg-ukra-navy text-gray-400 py-12 border-t-4 border-ukra-gold">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-start">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-black text-white">UKRA<span className="text-ukra-gold">.SA</span></h2>
          <p className="text-sm leading-relaxed">{t('footer_desc')}</p>
        </div>
        
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-bold text-lg relative inline-block">
             {t('nav_home')}
             <span className="block h-[2px] w-10 bg-ukra-gold mt-1"></span>
          </h4>
          <ul className="space-y-2 text-sm">
             <li><Link to="/design-request" className="hover:text-ukra-gold transition">{t('btn_req_design')}</Link></li>
             <li><a href="https://ukrastore.com" className="hover:text-ukra-gold transition">Store</a></li>
          </ul>
        </div>

        <div className="flex flex-col gap-4">
           <h4 className="text-white font-bold text-lg">{t('lbl_location')}</h4>
           <div className="h-32 bg-gray-800 rounded-lg relative overflow-hidden">
             {/* Mock Map */}
             <div className="absolute inset-0 flex items-center justify-center text-xs">Map Placeholder</div>
           </div>
        </div>
      </div>
      <div className="mt-12 pt-8 border-t border-gray-800 text-center text-xs">
        {t('footer_rights')}
      </div>
    </footer>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { dir } = useLanguage();
  return (
    <div className="flex flex-col min-h-screen bg-gray-50" dir={dir}>
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
};