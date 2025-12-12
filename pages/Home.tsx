import React, { useEffect, useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';

const BackgroundSlider = ({ images }: { images: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [images]);

  return (
    <div className="bg-gallery">
      {images.map((img, index) => (
        <div
          key={index}
          className={`bg-slide ${index === currentIndex ? 'active' : ''}`}
          style={{ backgroundImage: `url('${img}')` }}
        />
      ))}
    </div>
  );
};

const Section = ({ id, images, tag, title, desc, btnText, btnLink, reverse = false }: any) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id={id} className="immersive-section">
      <BackgroundSlider images={images} />
      <div className="section-overlay"></div>
      
      <div className="content-wrapper">
        <div 
          ref={ref} 
          className={`text-block max-w-[650px] text-white flow-up ${isVisible ? 'visible' : ''}`}
        >
          <span className="section-tag">{tag}</span>
          <h2 className="text-5xl md:text-6xl font-black mb-6 leading-tight text-white drop-shadow-lg">{title}</h2>
          <p className="text-lg md:text-xl text-gray-200 mb-8 font-light leading-relaxed max-w-[90%]">
            {desc}
          </p>
          
          <Link to={btnLink} className="btn-main">
            {btnText}
          </Link>
        </div>
      </div>
    </section>
  );
};

export const Home = () => {
  const { t } = useLanguage();

  return (
    <>
      <Section
        id="hero"
        images={[
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1920',
          'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1920',
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1920'
        ]}
        tag={t('hero_tag')}
        title={t('hero_title')}
        desc={t('hero_desc')}
        btnText={t('hero_btn')}
        btnLink="#supplies"
      />

      <Section
        id="supplies"
        images={[
          'https://images.unsplash.com/photo-1590490360182-f33d5f6a382c?q=80&w=1920',
          'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1920',
          'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1920'
        ]}
        tag={t('supplies_tag')}
        title={t('supplies_title')}
        desc={t('supplies_desc')}
        btnText={t('supplies_btn')}
        btnLink="/furniture-quote"
      />

      <Section
        id="design"
        images={[
          'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1920',
          'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1920'
        ]}
        tag={t('design_tag')}
        title={t('design_title')}
        desc={t('design_desc')}
        btnText={t('design_btn')}
        btnLink="/design-request"
      />

      <Section
        id="development"
        images={[
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1920',
          'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=1920'
        ]}
        tag={t('development_tag')}
        title={t('development_title')}
        desc={t('development_desc')}
        btnText={t('development_btn')}
        btnLink="/feasibility-study"
      />
    </>
  );
};