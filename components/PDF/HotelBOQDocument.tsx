import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';

// 1. تسجيل الخطوط (Tajawal)
Font.register({
  family: 'Tajawal',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@fontsource/tajawal@4.5.0/files/tajawal-arabic-400-normal.woff', fontWeight: 'normal' },
    { src: 'https://cdn.jsdelivr.net/npm/@fontsource/tajawal@4.5.0/files/tajawal-arabic-700-normal.woff', fontWeight: 'bold' }
  ]
});

// 2. التنسيق الاحترافي (Professional Layout)
const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 40, // مساحة للتذييل
    paddingHorizontal: 20,
    fontFamily: 'Tajawal',
    backgroundColor: '#fff',
    fontSize: 9
  },
  
  // === HEADER (ثابت في كل صفحة) ===
  headerContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: '#d4af37',
    paddingBottom: 10,
    height: 60 // ارتفاع ثابت للهيدر
  },
  logoBox: {
    width: 100,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end'
  },
  logoImage: {
    width: '100%',
    objectFit: 'contain'
  },
  titleBox: {
    flex: 1,
    alignItems: 'flex-end'
  },
  mainTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a2a3a'
  },
  subTitle: {
    fontSize: 9,
    color: '#666',
    marginTop: 2
  },

  // === SUMMARY CARDS ===
  summarySection: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 15,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#eee'
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    borderLeftWidth: 1,
    borderColor: '#ddd'
  },
  lastSummaryItem: {
    flex: 1,
    alignItems: 'center',
    borderLeftWidth: 0
  },
  summaryLabel: { fontSize: 8, color: '#888', marginBottom: 2 },
  summaryValue: { fontSize: 10, fontWeight: 'bold', color: '#1a2a3a' },

  // === TABLE STYLES ===
  // ملاحظة: لا نضع wrap={false} على الجدول بالكامل ليسمح بالانقسام
  
  groupHeader: {
    backgroundColor: '#1a2a3a',
    color: '#fff',
    padding: 6,
    marginTop: 10,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 10,
    borderRadius: 3
  },

  // رأس الجدول
  tableHeaderRow: {
    flexDirection: 'row-reverse',
    backgroundColor: '#e2e8f0',
    borderBottomWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 6,
    alignItems: 'center'
  },
  headerCell: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#475569',
    textAlign: 'center'
  },

  // صفوف الجدول
  tableRow: {
    flexDirection: 'row-reverse',
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    paddingVertical: 5,
    minHeight: 30, // أقل ارتفاع للصف
    alignItems: 'center'
  },
  
  // الأعمدة (تم ضبط النسب لعدم التداخل)
  col1: { width: '8%', textAlign: 'center' },  // رقم المعيار
  col2: { width: '40%', textAlign: 'right', paddingRight: 4 }, // الاشتراط (النص الطويل)
  col3: { width: '22%', textAlign: 'right', paddingRight: 4 }, // المنتج / التاج
  col4: { width: '8%', textAlign: 'center' },  // الكمية
  col5: { width: '11%', textAlign: 'center' }, // السعر
  col6: { width: '11%', textAlign: 'center' }, // الإجمالي

  // النصوص داخل الخلايا
  cellText: { fontSize: 8, color: '#334155' },
  boldText: { fontSize: 8, fontWeight: 'bold', color: '#0f172a' },
  smallNote: { fontSize: 7, color: '#94a3b8' },

  // الشارات
  badgeMandatory: { color: '#dc2626', fontSize: 7 }, // أحمر
  badgeOptional: { color: '#16a34a', fontSize: 7 }, // أخضر

  // === FOOTER (ثابت) ===
  footer: {
    position: 'absolute',
    bottom: 10,
    left: 20,
    right: 20,
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingTop: 8,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  footerText: { fontSize: 7, color: '#999' },
  pageNumber: { fontSize: 7, color: '#999' }
});

interface BOQProps {
  data: any; 
  projectInfo: { name: string, stars: number };
  user: any;
}

export const HotelBOQDocument: React.FC<BOQProps> = ({ data, projectInfo, user }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* 1. HEADER (Fixed on all pages) */}
      <View style={styles.headerContainer} fixed>
        <View style={styles.titleBox}>
          <Text style={styles.mainTitle}>جدول الكميات والمواصفات (BOQ)</Text>
          <Text style={styles.subTitle}>مستشار التجهيز الفندقي - مطابقة اشتراطات الوزارة</Text>
        </View>
        <View style={styles.logoBox}>
          {/* تأكد أن ملف logo.png موجود في مجلد public */}
          <Image src="/logo.png" style={styles.logoImage} />
        </View>
      </View>

      {/* 2. PROJECT SUMMARY (Only on first page) */}
      <View style={styles.summarySection}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>المشروع</Text>
          <Text style={styles.summaryValue}>{projectInfo.name}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>التصنيف</Text>
          <Text style={styles.summaryValue}>{projectInfo.stars} نجوم</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>عدد الوحدات</Text>
          <Text style={styles.summaryValue}>{data.totalKeys}</Text>
        </View>
        <View style={styles.lastSummaryItem}>
          <Text style={styles.summaryLabel}>إجمالي التكلفة التقديرية</Text>
          <Text style={[styles.summaryValue, {color: '#d4af37'}]}>
             {data.totalEstimated.toLocaleString()} SAR
          </Text>
        </View>
      </View>

      {/* 3. DETAILED GROUPS */}
      {data.groups.map((group: any, i: number) => (
        <View key={i}>
          {/* Group Title (يظهر مرة واحدة لكل مجموعة) */}
          <Text style={styles.groupHeader} break={false}>{group.title}</Text>
          
          {/* Table Header (يتكرر إذا انقسم الجدول؟ صعب في react-pdf، لذا نضعه مرة واحدة في بداية المجموعة) */}
          <View style={styles.tableHeaderRow} break={false}>
            <Text style={[styles.headerCell, styles.col1]}>المعيار</Text>
            <Text style={[styles.headerCell, styles.col2]}>الاشتراط / المنتج</Text>
            <Text style={[styles.headerCell, styles.col3]}>مواصفات أوكرة / التاج</Text>
            <Text style={[styles.headerCell, styles.col4]}>الكمية</Text>
            <Text style={[styles.headerCell, styles.col5]}>السعر</Text>
            <Text style={[styles.headerCell, styles.col6]}>الإجمالي</Text>
          </View>

          {/* Table Items Loop */}
          {group.items.map((item: any, idx: number) => (
            <View key={idx} style={styles.tableRow} wrap={false}> 
              {/* wrap=false للصف الواحد فقط، وليس للجدول كاملاً */}
              
              {/* Col 1: Criterion Number */}
              <Text style={[styles.cellText, styles.col1]}>{item.criterion_number || '-'}</Text>
              
              {/* Col 2: Name & Mandatory Status */}
              <View style={styles.col2}>
                <Text style={styles.cellText}>{item.name_ar}</Text>
                <Text style={item.isMandatory ? styles.badgeMandatory : styles.badgeOptional}>
                  {item.isMandatory ? '* إلزامي للرخصة' : 'اختياري (نقاط)'}
                </Text>
              </View>
              
              {/* Col 3: SKU / Notes */}
              <View style={styles.col3}>
                <Text style={styles.smallNote}>
                   {item.sku !== 'REG-REQ' ? item.sku : 'اشتراط تنظيمي'}
                </Text>
                {/* عرض ملاحظة نوع الحساب إن وجدت */}
                {item.name_ar.includes('متر مربع') && <Text style={styles.smallNote}>(حسب المساحة)</Text>}
                {item.name_ar.includes('مرفق عام') && <Text style={styles.smallNote}>(مشروع كامل)</Text>}
              </View>

              {/* Col 4: Quantity */}
              <Text style={[styles.cellText, styles.col4]}>{item.qty}</Text>

              {/* Col 5: Unit Price */}
              <Text style={[styles.cellText, styles.col5]}>
                 {item.unitPrice > 0 ? item.unitPrice.toLocaleString() : '-'}
              </Text>

              {/* Col 6: Total Price */}
              <Text style={[styles.boldText, styles.col6]}>
                 {item.totalPrice > 0 ? item.totalPrice.toLocaleString() : '-'}
              </Text>
            </View>
          ))}
          
          {/* Group Total (نهاية المجموعة) */}
          <View style={[styles.tableRow, { backgroundColor: '#fffbf0', borderTopWidth: 1, borderColor: '#d4af37' }]} break={false}>
             <Text style={[styles.boldText, { flex: 1, textAlign: 'right', paddingRight: 20 }]}>
                إجمالي المجموعة:
             </Text>
             <Text style={[styles.boldText, styles.col6, { color: '#d4af37' }]}>
                {group.totalCost.toLocaleString()}
             </Text>
          </View>
          
          {/* مسافة بسيطة بعد كل مجموعة */}
          <View style={{ height: 10 }} />
        </View>
      ))}

      {/* 4. FOOTER (With Page Numbers) */}
      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>
           UKRA.SA | الرقم الموحد: 9200xxxxx | س.ت: 4650247729
        </Text>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `${pageNumber} / ${totalPages}`
        )} />
      </View>

    </Page>
  </Document>
);