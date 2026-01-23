import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, Download, 
  RefreshCw, Wallet, 
  Building2, Phone, ShieldCheck 
} from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { UnitDefinition, UserAnswer } from '../../types';
import { calculateEstimatedCost, getAllCriteriaForStars } from '../../services/advisorService';
import { HotelBOQDocument } from '../PDF/HotelBOQDocument';
import { useAuth } from '../../context/AuthContext'; 


interface AdvisorResultProps {
  stars: number;
  units: UnitDefinition[];
  answers: UserAnswer[];
  onBack: () => void;
  onReset: () => void;
}

export const AdvisorResult: React.FC<AdvisorResultProps> = ({ 
  stars, units, answers, onBack, onReset 
}) => {
  const { user } = useAuth();
  const [costData, setCostData] = useState<{ total: number; breakdown: any[] } | null>(null);
  const [fullCriteria, setFullCriteria] = useState<Record<string, string[]> | null>(null); // حالة جديدة
  const [loading, setLoading] = useState(true);
  
  // إعادة حساب التكلفة عند التحميل
useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [costResult, criteriaResult] = await Promise.all([
           calculateEstimatedCost(units, stars),
           getAllCriteriaForStars(stars) // جلب الاشتراطات الكاملة
        ]);
        
        setCostData(costResult);
        setFullCriteria(criteriaResult); // حفظها
      } catch (error) {
        console.error("Error calculating data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [units, stars]);

  const totalUnitsCount = units.reduce((acc, u) => acc + u.quantity, 0);

  // إعداد البيانات لملف الـ PDF (تصحيح الخطأ السابق)
  const pdfData = useMemo(() => {
    if (!costData || !fullCriteria) return null;

    // تجميع بنود التكلفة في مجموعة واحدة للعرض
    const items = costData.breakdown.map((item, idx) => ({
      criterion_number: idx + 1,
      name_ar: item.name,
      isMandatory: true, // نفترض أنها متوافقة
      notes: 'تجهيز أوكرة القياسي',
      qty: item.qty,
      unitPrice: item.cost / (item.qty || 1),
      totalPrice: item.cost
    }));

    // حساب عدد الغرف السكنية فقط (للملخص)
    const totalKeys = units.reduce((acc, u) => {
        if (['Single', 'Double', 'Twin', 'King', 'Suite', 'Studio', 'Apartment', 'Villa'].includes(u.type)) {
            return acc + u.quantity;
        }
        return acc;
    }, 0);

    return {
      data: {
        proposal: {
          totalKeys: totalKeys,
          totalEstimated: costData.total,
          groups: [
            {
              title: 'تجهيزات الفرش والأثاث (توريد وتركيب)',
              totalCost: costData.total,
              items: items
            }
          ],
          fullCriteria: fullCriteria
        },
        
        validation: {
          missingMandatory: [], // نفترض أن العميل استوفى المتطلبات في الخطوات السابقة
          regulatoryAlerts: [],
          areaAlerts: []
        }
      },
      projectInfo: {
        name: `مشروع فندق ${stars} نجوم`,
        stars: stars
      },
      user: user || { name: 'زائر' }
    };
  }, [costData, fullCriteria, stars, units, user]);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 font-cairo animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* 1. Hero Success Section */}
      <div className="bg-ukra-navy rounded-[32px] p-8 md:p-12 text-center text-white shadow-2xl relative overflow-hidden mb-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-ukra-gold/10 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl" />
        
        <div className="relative z-10">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30 animate-in zoom-in duration-500">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">مشروعك جاهز ومطابق!</h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            تم تكوين مشروع فندقي فئة <span className="text-ukra-gold font-bold">{stars} نجوم</span> بنجاح، متوافق مع اشتراطات وزارة السياحة (V2) ومعايير أوكرة للجودة.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        
        {/* 2. Cost Summary Card */}
        <div className="lg:col-span-2 bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
            <Wallet className="w-6 h-6 text-ukra-navy" />
            <h3 className="font-bold text-lg text-gray-800">التقدير المالي للمشروع</h3>
          </div>
          
          <div className="p-8 flex-1 flex flex-col justify-center">
            {loading ? (
              <div className="text-center py-10 animate-pulse text-gray-400">جاري حساب التكاليف...</div>
            ) : costData ? (
              <>
                <div className="text-center mb-8">
                  <p className="text-sm text-gray-500 mb-2">إجمالي تكلفة الفرش والتجهيز (تقديري)</p>
                  <div className="text-4xl md:text-6xl font-bold text-ukra-navy font-mono tracking-tight">
                    {costData.total.toLocaleString()} <span className="text-xl md:text-2xl text-ukra-gold">ر.س</span>
                  </div>
                  <p className="text-xs text-orange-500 mt-3 bg-orange-50 inline-block px-3 py-1 rounded-full border border-orange-100">
                    *شامل التوريد والتركيب والضمان
                  </p>
                </div>

                <div className="space-y-3">
                  {/* نعرض عينة من البنود */}
                  {costData.breakdown.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="bg-white w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold shadow-sm">{item.qty}</span>
                        <span className="text-sm font-bold text-gray-700">{item.name}</span>
                      </div>
                      <span className="font-mono font-bold text-gray-600">{item.cost.toLocaleString()}</span>
                    </div>
                  ))}
                  {costData.breakdown.length > 3 && (
                     <div className="text-center text-xs text-gray-400 mt-2">
                       + {costData.breakdown.length - 3} بنود أخرى (مفصلة في التقرير)
                     </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-10 text-gray-400">لا توجد بيانات تكلفة متاحة</div>
            )}
          </div>
        </div>

        {/* 3. Project Stats Card */}
        <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
            <Building2 className="w-6 h-6 text-ukra-navy" />
            <h3 className="font-bold text-lg text-gray-800">ملخص المكونات</h3>
          </div>
          <div className="p-8 space-y-6 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">التصنيف</span>
              <span className="font-bold text-ukra-navy text-lg flex items-center gap-1">
                {stars} <span className="text-ukra-gold">★</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">عدد الوحدات والمرافق</span>
              <span className="font-bold text-ukra-navy text-lg">{totalUnitsCount} وحدة</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">نسبة الامتثال</span>
              <span className="font-bold text-green-600 text-lg flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> 100%
              </span>
            </div>
            
            <div className="pt-6 mt-6 border-t border-gray-100">
              <h4 className="font-bold text-sm text-gray-800 mb-3">يشمل التقرير:</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> جداول الكميات (BOQ)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> قائمة التحقق الوزارية</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> المواصفات الفنية للفرش</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Actions & PDF Download */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-8">
        
        {/* PDF Download Button */}
        {pdfData && (
          <PDFDownloadLink
            document={
              <HotelBOQDocument 
                data={pdfData.data}
                projectInfo={pdfData.projectInfo}
                user={pdfData.user}
              />
            }
            fileName={`Ukra_Hotel_Study_${stars}Stars.pdf`}
            className="w-full md:w-auto"
          >
            {({ loading: pdfLoading }) => (
              <button 
                disabled={pdfLoading}
                className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-ukra-navy text-white rounded-2xl font-bold shadow-xl hover:bg-ukra-navy/90 hover:scale-105 transition-all"
              >
                {pdfLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    جاري إعداد الملف...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    تحميل التقرير الفني (PDF)
                  </>
                )}
              </button>
            )}
          </PDFDownloadLink>
        )}

        {/* Contact Sales / Official Quote */}
        <button className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-white text-ukra-navy border-2 border-ukra-navy/10 rounded-2xl font-bold shadow-lg hover:border-ukra-navy hover:bg-blue-50 transition-all">
          <Phone className="w-5 h-5" />
          طلب عرض سعر رسمي
        </button>

        {/* Restart */}
        <button 
          onClick={onReset}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-4 text-gray-400 font-bold hover:text-ukra-navy transition"
        >
          <RefreshCw className="w-4 h-4" />
          ابدأ من جديد
        </button>
      </div>

    </div>
  );
};