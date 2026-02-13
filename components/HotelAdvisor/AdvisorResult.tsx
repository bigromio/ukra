import React, { useState, useEffect } from 'react';
import { 
  FileText, CheckCircle, Download, 
  RefreshCw, Building2, ShieldCheck, 
  Loader2, ChevronDown, ChevronUp,
  Armchair, BedDouble, Bath, Tv, 
  Utensils, LayoutGrid, AlertCircle, Coins
} from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { HotelBOQDocument } from '../PDF/HotelBOQDocument';
import { UnitDefinition, UserAnswer } from '../../types';
import { 
  calculateComprehensiveReport, 
  ComprehensiveReport, 
  DetailedBOQItem,
  ProductDisplayCategory 
} from '../../services/advisorService';

interface AdvisorResultProps {
  stars: number;
  units: UnitDefinition[];
  answers: UserAnswer[];
  onBack: () => void;
  onReset: () => void;
}

// خريطة ترجمة التصنيفات للعربية مع الأيقونات
const CATEGORY_CONFIG: Record<ProductDisplayCategory, { label: string; icon: React.ElementType }> = {
  'ROOM_FURNITURE': { label: 'أثاث الغرف والأجنحة', icon: BedDouble },
  'PUBLIC_FURNITURE': { label: 'أثاث المناطق العامة والاستقبال', icon: Armchair },
  'LINENS': { label: 'المفارش والبياضات والمراتب', icon: LayoutGrid },
  'ROOM_APPLIANCES': { label: 'أجهزة الغرف والإلكترونيات', icon: Tv },
  'PUBLIC_APPLIANCES': { label: 'أجهزة المرافق والخدمات', icon: Utensils },
  'ROOM_ACCESSORIES': { label: 'إكسسوارات الغرف والضيافة', icon: FileText },
  'PUBLIC_ACCESSORIES': { label: 'إكسسوارات المناطق العامة', icon: Building2 },
  'BATHROOM': { label: 'تجهيزات ومستلزمات الحمام', icon: Bath },
  'OTHER': { label: 'تجهيزات أخرى', icon: CheckCircle },
};

export const AdvisorResult: React.FC<AdvisorResultProps> = ({ 
  stars, units, answers, onBack, onReset 
}) => {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ComprehensiveReport | null>(null);
  const [activeTab, setActiveTab] = useState<'MANDATORY' | 'RECOMMENDED' | 'REQS'>('MANDATORY');
  
  // حالة فتح/إغلاق الأقسام (Accordion)
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  // 1. حساب التقرير عند التحميل
  useEffect(() => {
    const generateReport = async () => {
      try {
        setLoading(true);
        const result = await calculateComprehensiveReport(stars, units);
        setReport(result);
        // فتح جميع الأقسام افتراضياً
        const allCats = Object.keys(CATEGORY_CONFIG) as ProductDisplayCategory[];
        const initialState = allCats.reduce((acc, cat) => ({ ...acc, [cat]: true }), {});
        setExpandedCats(initialState);
      } catch (error) {
        console.error("Error calculating report:", error);
      } finally {
        setLoading(false);
      }
    };
    generateReport();
  }, [stars, units]);

  const toggleCategory = (cat: string) => {
    setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  if (loading || !report) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-ukra-navy animate-spin" />
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-800">جاري بناء جدول الكميات (BOQ)...</h3>
          <p className="text-gray-500">نطابق المنتجات مع اشتراطات الفئة {stars} نجوم</p>
        </div>
      </div>
    );
  }

  // دالة مساعدة لرسم جدول المنتجات
  const renderProductTable = (items: DetailedBOQItem[], categoryKey: string) => {
    if (!items || items.length === 0) return null;
    
    const config = CATEGORY_CONFIG[categoryKey as ProductDisplayCategory] || CATEGORY_CONFIG['OTHER'];
    const isExpanded = expandedCats[categoryKey];

    return (
      <div className="mb-6 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* Header */}
        <button 
          onClick={() => toggleCategory(categoryKey)}
          className="w-full flex items-center justify-between p-5 bg-gray-50/50 hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-3">
            <div className="bg-ukra-navy/10 p-2 rounded-lg text-ukra-navy">
              <config.icon className="w-5 h-5" />
            </div>
            <div className="text-right">
              <h3 className="font-bold text-lg text-gray-800">{config.label}</h3>
              <p className="text-xs text-gray-500">{items.length} منتجات</p>
            </div>
          </div>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        {/* Table Body */}
        {isExpanded && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50 text-gray-600 border-y border-gray-100">
                <tr>
                  <th className="px-6 py-3 font-bold">المنتج والمواصفات</th>
                  <th className="px-6 py-3 font-bold text-center">الكمية</th>
                  <th className="px-6 py-3 font-bold text-center">السعر الفردي</th>
                  <th className="px-6 py-3 font-bold text-center">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{item.name}</div>
                      <div className="text-xs text-gray-500 mt-1 font-mono">{item.sku}</div>
                      
                      {/* عرض المعايير المرتبطة */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.criteriaRefs.map((ref, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                            يغطي معيار #{ref.id}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold bg-gray-50/30">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-gray-600">
                      {item.unitPrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-ukra-navy">
                      {item.totalPrice.toLocaleString()} ر.س
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* 1. Hero Section: Financial Summary */}
      <div className="bg-ukra-navy text-white rounded-3xl p-8 shadow-2xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-ukra-gold/10 rounded-full blur-3xl -ml-20 -mt-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-right">
            <h1 className="text-3xl font-bold mb-2">تقرير التجهيز الشامل</h1>
            <p className="text-white/70">
              تصنيف {stars} نجوم • {report.stats.totalUnits} وحدة فندقية
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 min-w-[280px] text-center">
            <p className="text-sm text-ukra-gold font-bold mb-1 flex items-center justify-center gap-2">
              <Coins className="w-4 h-4" />
              إجمالي التكلفة التقديرية
            </p>
            <div className="text-4xl font-bold font-mono tracking-tight">
              {report.totalEstimatedCost.toLocaleString()}
              <span className="text-lg mr-2 font-normal opacity-70">ر.س</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 mb-8 pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveTab('MANDATORY')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeTab === 'MANDATORY' 
              ? 'bg-ukra-navy text-white shadow-lg ring-2 ring-ukra-navy ring-offset-2' 
              : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          أساسيات الرخصة (إلزامي)
        </button>

        <button
          onClick={() => setActiveTab('RECOMMENDED')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeTab === 'RECOMMENDED' 
              ? 'bg-ukra-gold text-ukra-navy shadow-lg ring-2 ring-ukra-gold ring-offset-2' 
              : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <CheckCircle className="w-5 h-5" />
          باقات التميز (موصى به)
        </button>

        <button
          onClick={() => setActiveTab('REQS')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeTab === 'REQS' 
              ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-600 ring-offset-2' 
              : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <FileText className="w-5 h-5" />
          المتطلبات الإنشائية والتشغيلية
        </button>
      </div>

      {/* 3. Content Area */}
      <div className="space-y-4">
        
        {/* TAB 1: Mandatory Products */}
                {activeTab === 'MANDATORY' && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    {Object.keys(report.mandatoryProducts).length === 0 ? (
                      <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                        <p className="text-gray-400 font-bold">لا توجد منتجات إلزامية مفقودة.</p>
                      </div>
                    ) : (
                      // --- التعديل هنا: إضافة div مع key ---
                      Object.entries(report.mandatoryProducts).map(([catKey, items]) => (
                        <div key={catKey}>
                          {renderProductTable(items as DetailedBOQItem[], catKey)}
                        </div>
                      ))
                    )}
                  </div>
                )}

        {/* TAB 2: Recommended Products */}
        {activeTab === 'RECOMMENDED' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3 text-yellow-800">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm font-bold">هذه المنتجات ليست شرطاً للرخصة، لكنها ترفع تصنيف فندقك وتزيد رضا النزلاء.</p>
            </div>
            
           {Object.entries(report.recommendedProducts).map(([catKey, items]) => (
              <div key={catKey}>
                {renderProductTable(items as DetailedBOQItem[], catKey)}
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: Requirements Checklists */}
                {activeTab === 'REQS' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    
                    {/* 1. Construction */}
                    {report.requirements.construction.length > 0 && (
                      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-xl text-gray-800 mb-4 flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-blue-600" />
                          المتطلبات الإنشائية (للمقاول)
                        </h3>
                        <ul className="space-y-3">
                          {report.requirements.construction.map(req => (
                            <li key={req.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">#{req.id}</span>
                              <p className="text-sm text-gray-700">{req.description}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 2. Operational */}
                    {report.requirements.operational.length > 0 && (
                      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-xl text-gray-800 mb-4 flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-green-600" />
                          المتطلبات التشغيلية (للإدارة)
                        </h3>
                        <ul className="space-y-3">
                          {report.requirements.operational.map(req => (
                            <li key={req.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">#{req.id}</span>
                              <p className="text-sm text-gray-700">{req.description}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 3. Procedural / General (القسم الجديد المضاف) */}
                    {report.requirements.procedural.length > 0 && (
                      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-xl text-gray-800 mb-4 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-gray-600" />
                          المتطلبات العامة والتراخيص
                        </h3>
                        <ul className="space-y-3">
                          {report.requirements.procedural.map(req => (
                            <li key={req.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                              <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded">#{req.id}</span>
                              <p className="text-sm text-gray-700">{req.description}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

      </div>

      {/* 4. Sticky Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <button 
            onClick={onReset}
            className="flex items-center gap-2 text-gray-500 hover:text-red-600 font-bold px-4 py-2 rounded-xl hover:bg-red-50 transition"
          >
            <RefreshCw className="w-5 h-5" />
            <span>ابدأ من جديد</span>
          </button>

          {/* PDF Download Button */}
          {report && (
            <PDFDownloadLink
              document={<HotelBOQDocument report={report} stars={stars} />}
              fileName={`BOQ_Report_${stars}Stars.pdf`}
              className="flex items-center gap-3 bg-ukra-navy text-white px-8 py-3 rounded-xl font-bold hover:bg-ukra-navy/90 hover:scale-105 transition shadow-lg w-full sm:w-auto justify-center"
            >
              {({ loading }) => (
                <>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  <span>{loading ? 'جاري تجهيز الملف...' : 'تحميل تقرير BOQ المعتمد (PDF)'}</span>
                </>
              )}
            </PDFDownloadLink>
          )}
        </div>
      </div>

    </div>
  );
};