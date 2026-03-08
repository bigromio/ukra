import React, { useState, useEffect, useRef } from 'react';
import { fetchAdminProducts, addAdminProduct, deleteAdminProduct, bulkAddProducts, updateAdminProduct } from '../../services/apiService';
import { ShoppingBag, Plus, Trash2, Image as ImageIcon, Loader2, X, FileSpreadsheet, Download, Search, Edit, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';

export const EcommerceManagement = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // حالات البحث والفلترة
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('الكل');

  // حالات الإضافة والتعديل
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); // لمعرفة هل نحن نضيف أم نعدل
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // نموذج المنتج الموحد للإضافة والتعديل
  const [productForm, setProductForm] = useState({ 
    name_ar: '', price: '', main_category: '', sub_category: '', description: '', image_url: '', in_stock: true 
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const data = await fetchAdminProducts();
    setProducts(data);
    setLoading(false);
  };

  // استخراج الأقسام لفلتر البحث وللاقتراحات
  const existingMainCategories = Array.from(new Set(products.map(p => p.main_category))).filter(Boolean);
  const existingSubCategories = Array.from(new Set(products.map(p => p.sub_category))).filter(Boolean);

  // --- دالة تحميل قالب الإكسل الصحيح ---
  const handleDownloadTemplate = () => {
    const ws_data = [
      ['الاسم', 'السعر', 'القسم الرئيسي', 'القسم الفرعي', 'الوصف', 'رابط الصورة']
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المنتجات");
    XLSX.writeFile(wb, "قالب_رفع_منتجات_UKRA.xlsx");
  };

  // --- دالة معالجة الإضافة أو التعديل ---
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    
    const formattedData = {
      ...productForm,
      price: parseFloat(productForm.price as string) || 0
    };

    if (isEditMode && editingId) {
      // تعديل منتج موجود
      const success = await updateAdminProduct(editingId, formattedData);
      if (success) {
        alert('تم تعديل المنتج بنجاح!');
        setIsModalOpen(false);
        loadProducts();
      } else alert('حدث خطأ أثناء التعديل.');
    } else {
      // إضافة منتج جديد
      const success = await addAdminProduct(formattedData);
      if (success) {
        alert('تم إضافة المنتج للمتجر بنجاح!');
        setIsModalOpen(false);
        loadProducts();
      } else alert('حدث خطأ أثناء الإضافة.');
    }
    setActionLoading(false);
  };

  // فتح نافذة الإضافة
  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setProductForm({ name_ar: '', price: '', main_category: '', sub_category: '', description: '', image_url: '', in_stock: true });
    setIsModalOpen(true);
  };

  // فتح نافذة التعديل
  const openEditModal = (product: any) => {
    setIsEditMode(true);
    setEditingId(product.id);
    setProductForm({
      name_ar: product.name_ar || '',
      price: product.price?.toString() || '',
      main_category: product.main_category || '',
      sub_category: product.sub_category || '',
      description: product.description || '',
      image_url: product.image_url || '',
      in_stock: product.in_stock !== false
    });
    setIsModalOpen(true);
  };

  // --- معالجة الحذف ---
  const handleDelete = async (id: number | string) => {
    if (window.confirm('هل أنت متأكد من مسح هذا المنتج نهائياً؟ سيتم إخفاؤه من المتجر العام أيضاً.')) {
      const success = await deleteAdminProduct(id);
      if (success) {
        alert('تم الحذف بنجاح.');
        loadProducts(); // تحديث الصفحة فوراً لتأكيد الحذف
      } else {
        alert('حدث خطأ! تأكد من صلاحيات قاعدة البيانات (RLS).');
      }
    }
  };

  // --- معالجة الرفع عبر إكسل ---
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const formattedProducts = data.map((item: any) => ({
          name_ar: item['الاسم'] || item['اسم المنتج'] || 'منتج جديد',
          price: parseFloat(item['السعر'] || 0),
          main_category: item['القسم الرئيسي'] || 'عام',
          sub_category: item['القسم الفرعي'] || 'عام',
          description: item['الوصف'] || '',
          image_url: item['رابط الصورة'] || '',
          in_stock: true
        }));

        if (formattedProducts.length > 0) {
          const success = await bulkAddProducts(formattedProducts);
          if (success) {
            alert(`تم رفع ${formattedProducts.length} منتج بنجاح!`);
            loadProducts();
          } else alert('حدث خطأ أثناء الحفظ في قاعدة البيانات.');
        }
      } catch (error) {
        alert('حدث خطأ في قراءة ملف الإكسل.');
      }
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  // --- تصفية وبحث المنتجات ---
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name_ar?.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeFilter === 'الكل' || p.main_category === activeFilter;
    return matchesSearch && matchesCat;
  });

  if (loading) return <div className="text-center py-20"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[#c5a059]" /></div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 font-tajawal" dir="rtl">
      
      {/* --- الرأس والأزرار العلوية --- */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-[#1a2a3a] flex items-center gap-2">
          <ShoppingBag className="text-[#c5a059]" /> إدارة المتجر ({products.length})
        </h2>
        
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          {/* زر تحميل القالب */}
          <button onClick={handleDownloadTemplate} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-100 transition-all text-sm font-bold">
            <Download size={16} /> قالب Excel
          </button>

          {/* زر استيراد الإكسل */}
          <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={fileInputRef} onChange={handleExcelUpload} />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploadLoading} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-lg hover:bg-green-100 transition-all text-sm font-bold">
            {uploadLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <FileSpreadsheet size={16} />} استيراد
          </button>

          {/* زر إضافة يدوية */}
          <button onClick={openAddModal} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#1a2a3a] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all text-sm font-bold">
            <Plus size={16} /> منتج جديد
          </button>
        </div>
      </div>

      {/* --- شريط البحث والفلترة --- */}
      <div className="bg-gray-50 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center mb-6 border border-gray-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="ابحث بالاسم أو الوصف..." 
            className="w-full pl-4 pr-10 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#c5a059]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 custom-scrollbar">
          <Filter className="text-gray-400 shrink-0" size={20} />
          {['الكل', ...existingMainCategories].map(cat => (
            <button 
              key={cat as string} 
              onClick={() => setActiveFilter(cat as string)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold transition-all ${activeFilter === cat ? 'bg-[#c5a059] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
            >
              {cat as string}
            </button>
          ))}
        </div>
      </div>

      {/* --- شبكة المنتجات --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredProducts.map(product => (
          <div key={product.id} className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all group bg-white">
            <div className="h-40 bg-gray-100 relative">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name_ar} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400"><ImageIcon size={30} /></div>
              )}
              {/* أزرار التعديل والحذف فوق الصورة */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEditModal(product)} className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 shadow-md">
                  <Edit size={14} />
                </button>
                <button onClick={() => handleDelete(product.id)} className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 shadow-md">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="p-3">
              <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold">{product.main_category}</span>
              <h3 className="font-bold text-[#1a2a3a] mt-2 text-sm truncate" title={product.name_ar}>{product.name_ar}</h3>
              <p className="text-[#c5a059] font-black font-num mt-1 text-sm">{product.price} ر.س</p>
            </div>
          </div>
        ))}
        
        {filteredProducts.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500">
            لا توجد منتجات تطابق بحثك حالياً.
          </div>
        )}
      </div>

      {/* --- نافذة الإضافة والتعديل الشاملة --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-[#1a2a3a] p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2">
                {isEditMode ? <Edit className="text-[#c5a059]" /> : <Plus className="text-[#c5a059]" />} 
                {isEditMode ? 'تعديل المنتج' : 'إضافة منتج جديد'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:text-red-400"><X /></button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div><label className="block text-sm font-bold mb-1">اسم المنتج *</label><input required type="text" className="w-full border p-3 rounded-lg" value={productForm.name_ar} onChange={e => setProductForm({...productForm, name_ar: e.target.value})} /></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">القسم الرئيسي *</label>
                  <input required list="main-cats" type="text" placeholder="مثال: غرف جلوس" className="w-full border p-3 rounded-lg" value={productForm.main_category} onChange={e => setProductForm({...productForm, main_category: e.target.value})} />
                  <datalist id="main-cats">{existingMainCategories.map(c => <option key={c as string} value={c as string} />)}</datalist>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">القسم الفرعي</label>
                  <input list="sub-cats" type="text" placeholder="مثال: كنبات" className="w-full border p-3 rounded-lg" value={productForm.sub_category} onChange={e => setProductForm({...productForm, sub_category: e.target.value})} />
                  <datalist id="sub-cats">{existingSubCategories.map(c => <option key={c as string} value={c as string} />)}</datalist>
                </div>
              </div>

              <div><label className="block text-sm font-bold mb-1">السعر (ر.س) *</label><input required type="number" step="0.01" className="w-full border p-3 rounded-lg font-num" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} /></div>
              <div><label className="block text-sm font-bold mb-1">رابط الصورة</label><input type="url" placeholder="https://..." className="w-full border p-3 rounded-lg font-num text-left" dir="ltr" value={productForm.image_url} onChange={e => setProductForm({...productForm, image_url: e.target.value})} /></div>
              <div><label className="block text-sm font-bold mb-1">الوصف</label><textarea rows={3} className="w-full border p-3 rounded-lg" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})}></textarea></div>
              
              {/* خيار التوفر في المخزون (يظهر كزر تشغيل/إيقاف بسيط) */}
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="in_stock" checked={productForm.in_stock} onChange={e => setProductForm({...productForm, in_stock: e.target.checked})} className="w-4 h-4 text-[#c5a059]" />
                <label htmlFor="in_stock" className="text-sm font-bold text-gray-700 cursor-pointer">المنتج متوفر في المتجر</label>
              </div>

              <button type="submit" disabled={actionLoading} className="w-full bg-[#c5a059] text-white font-bold py-3 rounded-lg flex justify-center mt-6">
                {actionLoading ? <Loader2 className="animate-spin" /> : (isEditMode ? 'حفظ التعديلات' : 'نشر في المتجر')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};