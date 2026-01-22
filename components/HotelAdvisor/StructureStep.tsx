import React, { useState, useEffect, useMemo } from 'react';
import { 
  Star, Building2, Plus, Trash2, 
  AlertTriangle, CheckCircle2, Accessibility, 
  Ruler, ArrowRight, ArrowLeft, Armchair, Users 
} from 'lucide-react';
import { UnitBuilder } from './UnitBuilder';
import { getStarRequirements, StarRequirement } from '../../services/advisorService';
import { UnitDefinition } from '../../types';

interface StructureStepProps {
  stars: number;
  setStars: (stars: number) => void;
  units: UnitDefinition[];
  setUnits: React.Dispatch<React.SetStateAction<UnitDefinition[]>>;
  onNext: () => void;
  onBack: () => void;
}

export const StructureStep: React.FC<StructureStepProps> = ({ 
  stars, setStars, units, setUnits, onNext, onBack 
}) => {
  // --- State ---
  const [requirements, setRequirements] = useState<StarRequirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);

  // --- Fetch Requirements ---
  useEffect(() => {
    const fetchReqs = async () => {
      setLoading(true);
      const data = await getStarRequirements(stars);
      setRequirements(data);
      setLoading(false);
    };
    fetchReqs();
  }, [stars]);

  // --- Smart Analysis (The Brain) ---
  const analysis = useMemo(() => {
    const currentUnitTypes = new Set(units.map(u => u.type));

    // 1. Check for Rooms
    const hasRooms = units.some(u => 
      ['Single', 'Double', 'Twin', 'King', 'Suite', 'Apartment', 'Studio', 'Villa', 'Accessible'].includes(u.type)
    );

    // 2. Check for Accessible Room
    const hasAccessibleRoom = units.some(u => u.type === 'Accessible');

    // 3. Area Specs
    const roomSpecs = requirements.filter(r => r.type === 'Room_Spec');

    // 4. Missing Facilities
    const missingFacilitiesMap = new Map<string, string>();
    requirements.filter(r => r.type === 'Facility_Core').forEach(req => {
       const target = req.targetUnit || 'General';
       
       // Check existence
       if (target === 'Reception' && currentUnitTypes.has('Reception')) return;
       if (target === 'Restaurant' && currentUnitTypes.has('Restaurant')) return;
       if (target === 'CoffeeShop' && currentUnitTypes.has('CoffeeShop')) return;
       if (target === 'Gym' && currentUnitTypes.has('Gym')) return;
       if (target === 'Pool' && currentUnitTypes.has('Pool')) return;
       if (target === 'MeetingRoom' && currentUnitTypes.has('MeetingRoom')) return;
       if (target === 'PrayerRoom' && currentUnitTypes.has('PrayerRoom')) return;
       if (target === 'Lobby' && currentUnitTypes.has('Lobby')) return;
       if (target === 'Parking' && currentUnitTypes.has('Parking')) return; 

       // Add to map (deduplicate)
       if (!missingFacilitiesMap.has(target)) {
           missingFacilitiesMap.set(target, req.description);
       } else {
           const existingMsg = missingFacilitiesMap.get(target)!;
           if (req.description.length > existingMsg.length) {
               missingFacilitiesMap.set(target, req.description);
           }
       }
    });

    const missingFacilities = Array.from(missingFacilitiesMap.values());

    return { hasRooms, hasAccessibleRoom, roomSpecs, missingFacilities };
  }, [requirements, units]);

  // --- Handlers ---
  const handleSaveUnit = (unit: UnitDefinition) => {
    setUnits(prev => [...prev, unit]);
    setIsUnitModalOpen(false);
  };
  
  const handleDeleteUnit = (id: string) => {
    setUnits(prev => prev.filter(u => u.id !== id));
  };

  const canProceed = analysis.hasRooms; // شرط أساسي للانتقال

  return (
    <div className="font-cairo animate-in slide-in-from-right duration-500 pb-10">
      
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-ukra-navy">الخطوة 1: الهيكل والمساحات</h2>
        <p className="text-gray-500 text-sm">حدد تصنيف الفندق ومكوناته الأساسية</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* --- LEFT: Inputs --- */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Star Selector */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
            <label className="block text-sm font-bold text-gray-700 mb-4">التصنيف المستهدف</label>
            <div className="flex justify-between gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setStars(s)}
                  className={`flex-1 py-4 rounded-xl flex flex-col items-center transition-all duration-300 ${
                    stars === s 
                      ? 'bg-ukra-navy text-ukra-gold shadow-lg transform -translate-y-1' 
                      : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  <Star className={`w-5 h-5 mb-1 ${stars === s ? 'fill-current' : ''}`} />
                  <span className="font-bold text-lg">{s}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Unit List */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 min-h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-gray-800">وحدات ومرافق المشروع</h3>
               <button 
                 onClick={() => setIsUnitModalOpen(true)}
                 className="bg-ukra-gold text-ukra-navy px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-yellow-500 transition"
               >
                 <Plus className="w-4 h-4" /> إضافة وحدة
               </button>
            </div>

            <div className="space-y-3 flex-1">
              {units.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 border-2 border-dashed border-gray-100 rounded-2xl p-8">
                   <Building2 className="w-12 h-12 mb-2 opacity-20" />
                   <p className="text-sm">القائمة فارغة، أضف الغرف أولاً</p>
                </div>
              ) : (
                units.map((u, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-ukra-gold/50 transition">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${u.type === 'Accessible' ? 'bg-orange-100 text-orange-600' : 'bg-white text-ukra-navy'}`}>
                         {u.type === 'Accessible' ? <Accessibility className="w-5 h-5"/> : <Building2 className="w-5 h-5"/>}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-800">{u.name}</h4>
                        <span className="text-xs text-gray-400 font-medium">العدد: {u.quantity}</span>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteUnit(u.id)} className="text-gray-300 hover:text-red-500 p-2">
                       <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* --- RIGHT: Smart Alerts --- */}
        <div className="lg:col-span-5 space-y-4 sticky top-24">
          
          {/* 1. Critical: No Rooms */}
          {!analysis.hasRooms && (
             <div className="bg-red-50 rounded-[20px] p-5 border border-red-100 animate-pulse">
                <div className="flex items-center gap-3 mb-2">
                   <AlertTriangle className="w-5 h-5 text-red-600" />
                   <h3 className="font-bold text-red-900 text-sm">تنبيه حرج: لا توجد غرف</h3>
                </div>
                <p className="text-xs text-red-700 leading-relaxed">
                   لا يمكن الانتقال للخطوة التالية بدون إضافة وحدات سكنية. يرجى إضافة الغرف أولاً.
                </p>
             </div>
          )}

          {/* 2. Warning: Accessible Room */}
          {analysis.hasRooms && !analysis.hasAccessibleRoom && (
             <div className="bg-orange-50 rounded-[20px] p-5 border border-orange-100">
                <div className="flex items-center gap-3 mb-2">
                   <Accessibility className="w-5 h-5 text-orange-600" />
                   <h3 className="font-bold text-orange-900 text-sm">مطلوب: غرفة ذوي الهمم</h3>
                </div>
                <p className="text-xs text-orange-700 leading-relaxed">
                   يجب توفير وحدة واحدة على الأقل مجهزة لذوي الاحتياجات الخاصة (إلزامي).
                </p>
                <button 
                  onClick={() => setIsUnitModalOpen(true)}
                  className="mt-2 text-[10px] bg-orange-200 text-orange-800 px-3 py-1 rounded-md font-bold hover:bg-orange-300"
                >
                  + إضافة الغرفة
                </button>
             </div>
          )}

          {/* 3. Missing Facilities */}
          <div className={`rounded-[20px] p-5 border transition-all ${analysis.missingFacilities.length > 0 ? 'bg-amber-50 border-amber-100' : 'bg-green-50 border-green-100'}`}>
             <h3 className={`font-bold text-sm mb-3 flex items-center gap-2 ${analysis.missingFacilities.length > 0 ? 'text-amber-900' : 'text-green-900'}`}>
                {analysis.missingFacilities.length > 0 ? <AlertTriangle className="w-4 h-4"/> : <CheckCircle2 className="w-4 h-4"/>}
                {analysis.missingFacilities.length > 0 ? 'مرافق إلزامية ناقصة' : 'المرافق مكتملة'}
             </h3>
             
             {analysis.missingFacilities.length > 0 ? (
                <div className="space-y-2">
                   {analysis.missingFacilities.map((msg, i) => (
                      <div key={i} className="text-xs font-bold text-amber-900 bg-white/60 p-2 rounded-lg border border-amber-100/50 flex items-center gap-2">
                          {msg.includes('صلاة') ? <Users className="w-3 h-3 text-amber-600"/> : 
                           msg.includes('بهو') ? <Armchair className="w-3 h-3 text-amber-600"/> : 
                           <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>}
                          {msg}
                      </div>
                   ))}
                </div>
             ) : (
                <p className="text-xs text-green-700">جميع المرافق الأساسية متوفرة.</p>
             )}
          </div>

          {/* 4. Area Specs */}
          <div className="bg-blue-50 rounded-[20px] p-5 border border-blue-100">
             <h3 className="font-bold text-blue-900 text-sm mb-3 flex items-center gap-2">
                <Ruler className="w-4 h-4"/> اشتراطات المساحة ({stars} نجوم)
             </h3>
             <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                {analysis.roomSpecs.map((req, i) => (
                   <div key={i} className="text-[10px] text-blue-800 bg-white p-2 rounded border border-blue-100/50">
                      {req.description}
                   </div>
                ))}
             </div>
          </div>

        </div>
      </div>

      {/* Navigation Actions */}
      <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-100">
        <button 
          onClick={onBack}
          className="text-gray-500 font-bold hover:text-ukra-navy transition flex items-center gap-2"
        >
          <ArrowRight className="w-5 h-5" /> القائمة الرئيسية
        </button>
        
        <button 
          onClick={onNext}
          disabled={!canProceed}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition shadow-lg ${
            canProceed 
              ? 'bg-ukra-navy hover:bg-ukra-navy/90' 
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          التالي: التعهدات النظامية <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Modal */}
      {isUnitModalOpen && (
        <UnitBuilder 
          onSave={handleSaveUnit} 
          onCancel={() => setIsUnitModalOpen(false)} 
        />
      )}

    </div>
  );
};