import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { ComprehensiveReport, DetailedBOQItem, ProductDisplayCategory } from '../../services/advisorService';

// 1. تسجيل الخطوط العربية (Tajawal)
// هذا الخط يدعم اللغة العربية بشكل ممتاز في ملفات PDF
Font.register({
  family: 'Tajawal',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@fontsource/tajawal@4.5.0/files/tajawal-arabic-400-normal.woff', fontWeight: 'normal' },
    { src: 'https://cdn.jsdelivr.net/npm/@fontsource/tajawal@4.5.0/files/tajawal-arabic-700-normal.woff', fontWeight: 'bold' }
  ]
});

// 2. تعريف الأنماط (Styles)
const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 30,
    fontFamily: 'Tajawal',
    fontSize: 10,
    lineHeight: 1.5,
    color: '#333',
  },
  // الهيدر (Header)
  header: {
    flexDirection: 'row-reverse', // عكس الاتجاه لأننا عربي
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#1a2a3a', // Navy
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a2a3a',
  },
  headerSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
  },
  
  // لوحة الملخص (Summary Box)
  summaryBox: {
    flexDirection: 'row-reverse',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 15,
    marginBottom: 30,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryItem: {
    alignItems: 'center',
    width: '24%',
  },
  summaryLabel: {
    fontSize: 8,
    color: '#64748b',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a2a3a',
  },
  summaryCost: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#b8860b', // Gold
  },

  // عناوين الأقسام
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a2a3a',
    textAlign: 'right',
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: '#f1f5f9',
    padding: 6,
    borderRightWidth: 4,
    borderRightColor: '#1a2a3a',
  },
  
  // جداول المنتجات
  tableContainer: {
    marginBottom: 20,
  },
  catTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
    textAlign: 'right',
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 2,
  },
  tableRow: {
    flexDirection: 'row-reverse', // المفتاح السحري لترتيب الأعمدة عربياً
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    minHeight: 24,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#1a2a3a',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 9,
  },
  
  // عرض الأعمدة (مجموعها 100%)
  colName: { width: '40%', textAlign: 'right', paddingRight: 5 },
  colSku: { width: '20%', textAlign: 'center', fontSize: 8 },
  colQty: { width: '10%', textAlign: 'center' },
  colPrice: { width: '15%', textAlign: 'center' },
  colTotal: { width: '15%', textAlign: 'center', fontWeight: 'bold' },

  // شارة المعيار
  badge: {
    fontSize: 7,
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    paddingHorizontal: 4,
    borderRadius: 2,
    marginTop: 2,
    alignSelf: 'flex-end',
  },

  // قوائم التحقق (Checklists)
  checkItem: {
    flexDirection: 'row-reverse',
    marginBottom: 6,
    paddingRight: 10,
  },
  checkBullet: {
    width: 3,
    height: 3,
    backgroundColor: '#94a3b8',
    borderRadius: 2,
    marginTop: 6,
    marginLeft: 6,
  },
  
  // الفوتر
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
});

// 3. ترجمة التصنيفات
const CATEGORY_LABELS: Record<string, string> = {
  'ROOM_FURNITURE': 'أثاث الغرف والأجنحة',
  'PUBLIC_FURNITURE': 'أثاث المناطق العامة والاستقبال',
  'LINENS': 'المفارش والبياضات والمراتب',
  'ROOM_APPLIANCES': 'أجهزة الغرف والإلكترونيات',
  'PUBLIC_APPLIANCES': 'أجهزة المرافق والخدمات',
  'ROOM_ACCESSORIES': 'إكسسوارات الغرف والضيافة',
  'PUBLIC_ACCESSORIES': 'إكسسوارات المناطق العامة',
  'BATHROOM': 'تجهيزات ومستلزمات الحمام',
  'OTHER': 'تجهيزات ومعدات أخرى',
};

// 4. المكون الرئيسي للوثيقة
interface HotelBOQDocumentProps {
  report: ComprehensiveReport;
  stars: number;
}

export const HotelBOQDocument: React.FC<HotelBOQDocumentProps> = ({ report, stars }) => {
  
  // دالة لرسم جدول قسم معين
  const renderProductSection = (
    productsMap: Record<ProductDisplayCategory, DetailedBOQItem[]>, 
    mainTitle: string, 
    themeColor: string
  ) => {
    // تصفية الأقسام الفارغة
    const validCategories = Object.entries(productsMap).filter(([_, items]) => items && items.length > 0);
    
    if (validCategories.length === 0) return null;

    return (
      <View break>
        <Text style={[styles.sectionTitle, { borderRightColor: themeColor, color: themeColor }]}>
          {mainTitle}
        </Text>
        
        {validCategories.map(([catKey, items]) => (
          <View key={catKey} wrap={false} style={styles.tableContainer}>
            <Text style={styles.catTitle}>{CATEGORY_LABELS[catKey] || catKey}</Text>
            
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader, { backgroundColor: themeColor }]}>
              <Text style={styles.colName}>المنتج والمواصفات</Text>
              <Text style={styles.colSku}>SKU</Text>
              <Text style={styles.colQty}>الكمية</Text>
              <Text style={styles.colPrice}>السعر</Text>
              <Text style={styles.colTotal}>الإجمالي</Text>
            </View>

            {/* Table Rows */}
            {items.map((item, idx) => (
              <View key={idx} style={[styles.tableRow, { backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }]}>
                <View style={styles.colName}>
                  <Text>{item.name}</Text>
                  {/* عرض رقم المعيار المرتبط */}
                  {item.criteriaRefs && item.criteriaRefs.length > 0 && (
                    <Text style={styles.badge}>
                      معيار رقم: {item.criteriaRefs[0].id}
                    </Text>
                  )}
                </View>
                <Text style={styles.colSku}>{item.sku}</Text>
                <Text style={styles.colQty}>{item.quantity}</Text>
                <Text style={styles.colPrice}>{item.unitPrice.toLocaleString()}</Text>
                <Text style={styles.colTotal}>{item.totalPrice.toLocaleString()}</Text>
              </View>
            ))}
            
            {/* Subtotal Row */}
            <View style={[styles.tableRow, { borderBottomWidth: 0, paddingTop: 4 }]}>
              <Text style={[styles.colName, { textAlign: 'left', fontWeight: 'bold' }]}>إجمالي القسم:</Text>
              <Text style={[styles.colTotal, { color: themeColor }]}>
                {items.reduce((sum, i) => sum + i.totalPrice, 0).toLocaleString()} ر.س
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <Document>
      {/* --- الصفحة الأولى: الملخص التنفيذي --- */}
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>تقرير التجهيز الفندقي الشامل (BOQ)</Text>
            <Text style={styles.headerSub}>تم الإنشاء بواسطة: مستشار أوكرة الذكي</Text>
          </View>
          <View>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#b8860b' }}>تصنيف {stars} نجوم</Text>
            <Text style={styles.headerSub}>{new Date().toLocaleDateString('en-GB')}</Text>
          </View>
        </View>

        {/* Dashboard Stats */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>التكلفة التقديرية</Text>
            <Text style={styles.summaryCost}>{report.totalEstimatedCost.toLocaleString()} ر.س</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>عدد الوحدات</Text>
            <Text style={styles.summaryValue}>{report.stats.totalUnits}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>الطاقة الاستيعابية</Text>
            <Text style={styles.summaryValue}>{report.stats.totalGuests} ضيف</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>عدد الحمامات</Text>
            <Text style={styles.summaryValue}>{report.stats.bathrooms}</Text>
          </View>
        </View>

        {/* Introduction */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ textAlign: 'right', marginBottom: 5, fontWeight: 'bold' }}>عزيزي الشريك،</Text>
          <Text style={{ textAlign: 'right', color: '#555', fontSize: 9 }}>
            بناءً على المعايير التي تم تحديدها، هذا التقرير يحتوي على جداول الكميات التفصيلية (BOQ) اللازمة لتجهيز مشروعك بما يتوافق مع اشتراطات وزارة السياحة لتصنيف {stars} نجوم.
            التقرير مقسم إلى قسمين: منتجات إلزامية (للرخصة)، ومنتجات موصى بها (للرفاهية).
          </Text>
        </View>

        {/* Quick Requirement Summary */}
        <View>
          <Text style={[styles.sectionTitle, { backgroundColor: '#f8fafc', borderRightColor: '#64748b' }]}>
            ملخص المتطلبات غير الملموسة
          </Text>
          <View style={{ flexDirection: 'row-reverse', gap: 20 }}>
            {/* Construction */}
            <View style={{ width: '48%' }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', textAlign: 'right', marginBottom: 5 }}>متطلبات إنشائية (مقتطفات)</Text>
              {report.requirements.construction.slice(0, 6).map((req, i) => (
                <View key={i} style={styles.checkItem}>
                  <View style={styles.checkBullet} />
                  <Text style={{ fontSize: 8, color: '#444' }}>{req.description.substring(0, 50)}...</Text>
                </View>
              ))}
            </View>
            {/* Operational */}
            <View style={{ width: '48%' }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', textAlign: 'right', marginBottom: 5 }}>متطلبات تشغيلية (مقتطفات)</Text>
              {report.requirements.operational.slice(0, 6).map((req, i) => (
                <View key={i} style={styles.checkItem}>
                  <View style={styles.checkBullet} />
                  <Text style={{ fontSize: 8, color: '#444' }}>{req.description.substring(0, 50)}...</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.footer} fixed>تقرير أوكرة الذكي • صفحة رقم 1</Text>
      </Page>

      {/* --- الصفحات التالية: جداول المنتجات الإلزامية --- */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>أولاً: التجهيزات الإلزامية للرخصة</Text>
          <Text style={{ fontSize: 10, color: '#1a2a3a' }}>جدول الكميات الأساسي</Text>
        </View>
        
        {renderProductSection(report.mandatoryProducts, 'قائمة المنتجات الأساسية', '#1a2a3a')}
        
        <Text style={styles.footer} fixed>تقرير أوكرة الذكي • التجهيزات الإلزامية</Text>
      </Page>

      {/* --- الصفحات التالية: جداول المنتجات الموصى بها + القوائم --- */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ثانياً: باقات التميز والمتطلبات</Text>
          <Text style={{ fontSize: 10, color: '#b8860b' }}>الرفاهية والتشغيل</Text>
        </View>

        {renderProductSection(report.recommendedProducts, 'قائمة منتجات الرفاهية (موصى بها)', '#b8860b')}

        {/* Full Checklists */}
        <View break>
          <Text style={[styles.sectionTitle, { borderRightColor: '#64748b' }]}>القوائم المرجعية الكاملة</Text>
          
          <Text style={[styles.catTitle, { marginTop: 10 }]}>أ. المتطلبات الإنشائية</Text>
          {report.requirements.construction.map((req, i) => (
            <View key={`c-${i}`} style={styles.checkItem}>
              <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#1a2a3a', marginLeft: 5 }}>[{req.id}]</Text>
              <Text style={{ fontSize: 8 }}>{req.description}</Text>
            </View>
          ))}

          <Text style={[styles.catTitle, { marginTop: 15 }]}>ب. المتطلبات التشغيلية</Text>
          {report.requirements.operational.map((req, i) => (
            <View key={`o-${i}`} style={styles.checkItem}>
              <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#1a2a3a', marginLeft: 5 }}>[{req.id}]</Text>
              <Text style={{ fontSize: 8 }}>{req.description}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer} fixed>تقرير أوكرة الذكي • نهاية التقرير</Text>
      </Page>
    </Document>
  );
};