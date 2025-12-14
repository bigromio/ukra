
import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Autoplay } from 'swiper/modules';
import { Droplets, Gem, Sparkles, Leaf, ChevronDown, X, Phone } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Product Data
const PRODUCTS = [
  { name: "ALFA", desc: "تصميم مثالي للأثاث [cite: 9]", img: "https://images.unsplash.com/photo-1611486212557-88be5ff6f941?w=600" },
  { name: "Antarctica", desc: "تحول في ألواح الميلامين [cite: 18]", img: "https://images.unsplash.com/photo-1594913785162-e678a0c2bd87?w=600" },
  { name: "Azure", desc: "انتعاش وهدوء لتصاميمك [cite: 26]", img: "https://images.unsplash.com/photo-1549488344-c70595d9d4f1?w=600" },
  { name: "Baltico", desc: "متانة وتكامل عالي [cite: 38]", img: "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=600" },
  { name: "Blanco", desc: "مهمتنا تقريب المشاريع للجميع [cite: 49]", img: "https://images.unsplash.com/photo-1588620610963-23f95e55e81f?w=600" },
  { name: "Calacata", desc: "مثالي للديكورات الداخلية [cite: 59]", img: "https://images.unsplash.com/photo-1598048123286-9051d9539343?w=600" },
  { name: "Catania", desc: "للمنازل والفنادق والمستشفيات [cite: 71]", img: "https://images.unsplash.com/photo-1588850616149-623c21a44e55?w=600" },
  { name: "Ceniza", desc: "لمطبخ أحلامك [cite: 79]", img: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600" },
  { name: "Concreto", desc: "سطح متجانس وموحد [cite: 92]", img: "https://images.unsplash.com/photo-1517646287309-48b52e032687?w=600" },
  { name: "Ebano Amazonico", desc: "ألواح MDF متميزة [cite: 99]", img: "https://images.unsplash.com/photo-1621251390457-36e393962635?w=600" },
  { name: "Encino Apalaches", desc: "تجنب ملامسة الماء [cite: 110]", img: "https://images.unsplash.com/photo-1610369792180-280628206d20?w=600" },
  { name: "Fiore", desc: "سماكات: 6مم، 15مم، 18مم [cite: 118]", img: "https://images.unsplash.com/photo-1621899147573-03099932145b?w=600" },
  { name: "Husky", desc: "مجموعة واسعة من التصاميم [cite: 178]", img: "https://images.unsplash.com/photo-1543362906-ac1b452601d8?w=600" },
  { name: "Moca", desc: "جد سماكتك المثالية [cite: 212]", img: "https://images.unsplash.com/photo-1618221639254-297ff97737b6?w=600" },
  { name: "Negro", desc: "متانة وجودة لمشاريعك [cite: 223]", img: "https://images.unsplash.com/photo-1617103996702-96ff29b1c467?w=600" },
  { name: "Palo de Fierro", desc: "عملي ومتعدد الاستخدامات [cite: 271]", img: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600" },
  { name: "Roble Blanco", desc: "الدفء والضوء لمشروعك [cite: 301]", img: "https://images.unsplash.com/photo-1570042707390-33b006c7476e?w=600" },
  { name: "Sienna", desc: "حول مساحتك لتصاميم عصرية [cite: 338]", img: "https://images.unsplash.com/photo-1610312519106-93116df157e0?w=600" },
  { name: "Textil", desc: "مقاوم للتشققات [cite: 352]", img: "https://images.unsplash.com/photo-1522771753035-a15806bb6376?w=600" },
  { name: "Wengue", desc: "تجنب الإضرار بالحواف [cite: 368]", img: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=600" }
];

export const WoodCatalog = () => {
  const { dir } = useLanguage();
  const [selectedProduct, setSelectedProduct] = useState<typeof PRODUCTS[0] | null>(null);

  const scrollToCatalog = () => {
    document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 font-cairo">
      
      {/* 1. Hero Section */}
      <header className="relative h-screen bg-fixed bg-center bg-cover flex items-center justify-center text-center text-white"
        style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=2000')` }}>
        
        <div className="relative z-10 px-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-wide drop-shadow-xl">
            UKRA <span className="text-ukra-gold">WOOD</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8 font-light">
             خبراء في الألواح الديكورية والأسطح الخشبية
          </p>
          <p className="text-sm text-ukra-gold tracking-widest uppercase">Everything is possible</p>
          
          <button onClick={() => window.location.href='tel:+966569159938'} className="mt-8 px-8 py-3 bg-ukra-gold text-ukra-navy rounded-full font-bold hover:bg-white transition-all transform hover:scale-105 flex items-center gap-2 mx-auto">
             <Phone className="w-5 h-5" /> اتصل بنا
          </button>
        </div>

        {/* Scroll Down Arrow */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer" onClick={scrollToCatalog}>
          <ChevronDown className="w-10 h-10 text-white opacity-80" />
        </div>
      </header>

      {/* 2. Marquee Section */}
      <div className="bg-ukra-navy text-white py-4 overflow-hidden relative border-t-4 border-ukra-gold">
        <div className="whitespace-nowrap animate-marquee flex gap-10">
          {[1,2,3,4].map(i => (
             <span key={i} className="text-lg md:text-xl font-light opacity-90 mx-10">
                Transform your spaces and create trendy modern designs • Superior cutting case • Smooth and durable finish • Ideal for furniture
             </span>
          ))}
        </div>
      </div>

      {/* 3. Catalog Section (Swiper) */}
      <section id="catalog-section" className="py-20 px-4 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
             <h2 className="text-4xl font-black text-ukra-navy mb-4 relative inline-block">
               مجموعتنا الفاخرة
               <span className="absolute -bottom-3 left-0 right-0 h-1 bg-ukra-gold mx-auto w-24"></span>
             </h2>
             <p className="text-gray-500 mt-6">تصفح أحدث التشكيلات الحصرية</p>
          </div>

          <div className="catalog-swiper-container">
            <Swiper
              effect={'coverflow'}
              grabCursor={true}
              centeredSlides={true}
              slidesPerView={'auto'}
              loop={true}
              initialSlide={2}
              coverflowEffect={{
                rotate: 50,
                stretch: 0,
                depth: 100,
                modifier: 1,
                slideShadows: true,
              }}
              pagination={{ clickable: true }}
              modules={[EffectCoverflow, Pagination]}
              className="w-full py-12"
              breakpoints={{
                320: { slidesPerView: 1.5, spaceBetween: 20 },
                640: { slidesPerView: 2, spaceBetween: 30 },
                1024: { slidesPerView: 3, spaceBetween: 50 }
              }}
            >
              {PRODUCTS.map((product, idx) => (
                <SwiperSlide key={idx} className="bg-white rounded-2xl overflow-hidden shadow-2xl !w-[300px] !h-[450px] relative group cursor-pointer" onClick={() => setSelectedProduct(product)}>
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style={{ backgroundImage: `url('${product.img}')` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90 transition-opacity duration-300"></div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                     <h3 className="text-2xl font-bold text-ukra-gold mb-1">{product.name}</h3>
                     <p className="text-gray-300 text-sm">{product.desc}</p>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </section>

      {/* 4. Features Section */}
      <section className="py-20 px-4 bg-white relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           {[
             { icon: Droplets, title: "مقاوم للرطوبة", desc: "تجنب ملامسة الماء المباشرة، ألواحنا مصممة لتقليل الانتفاخ." },
             { icon: Gem, title: "مقاوم للخدش", desc: "سطح متين وعملي يتحمل الاستخدام اليومي." },
             { icon: Sparkles, title: "سهل التنظيف", desc: "عملي ومتعدد الاستخدامات وسهل التنظيف." },
             { icon: Leaf, title: "صديق للبيئة", desc: "نستخدم أفضل خامات MDF الصديقة للبيئة." },
           ].map((feat, idx) => (
             <div key={idx} className="text-center p-8 rounded-2xl border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 bg-gray-50/50 group">
                <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm mb-6 group-hover:bg-ukra-navy transition-colors">
                   <feat.icon className="w-10 h-10 text-ukra-gold" />
                </div>
                <h3 className="text-xl font-bold text-ukra-navy mb-3">{feat.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feat.desc}</p>
             </div>
           ))}
        </div>
      </section>

      {/* 5. Image Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={() => setSelectedProduct(null)}>
           <button className="absolute top-6 right-6 text-white hover:text-red-500 z-50">
              <X className="w-10 h-10" />
           </button>
           
           <div className="max-w-4xl w-full max-h-[90vh] flex flex-col items-center animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
              <img 
                src={selectedProduct.img} 
                alt={selectedProduct.name} 
                className="max-h-[80vh] w-auto object-contain rounded-lg shadow-2xl border-2 border-ukra-gold" 
              />
              <div className="mt-6 text-center text-white">
                 <h3 className="text-3xl font-bold text-ukra-gold">{selectedProduct.name}</h3>
                 <p className="text-gray-300 mt-2">{selectedProduct.desc}</p>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};
