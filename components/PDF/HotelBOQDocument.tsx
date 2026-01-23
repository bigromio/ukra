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
    paddingBottom: 40,
    paddingHorizontal: 20,
    fontFamily: 'Tajawal',
    backgroundColor: '#fff',
    fontSize: 9
  },
  
  // === HEADER ===
  headerContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: '#d4af37',
    paddingBottom: 10,
    height: 60
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
  tableRow: {
    flexDirection: 'row-reverse',
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    paddingVertical: 5,
    minHeight: 30,
    alignItems: 'center'
  },
  
  // Columns
  col1: { width: '8%', textAlign: 'center' },  // Criterion
  col2: { width: '40%', textAlign: 'right', paddingRight: 4 }, // Name
  col3: { width: '22%', textAlign: 'right', paddingRight: 4 }, // SKU/Note
  col4: { width: '8%', textAlign: 'center' },  // Qty
  col5: { width: '11%', textAlign: 'center' }, // Price
  col6: { width: '11%', textAlign: 'center' }, // Total

  cellText: { fontSize: 8, color: '#334155' },
  boldText: { fontSize: 8, fontWeight: 'bold', color: '#0f172a' },
  smallNote: { fontSize: 7, color: '#94a3b8' },
  badgeMandatory: { color: '#dc2626', fontSize: 7 }, 
  badgeOptional: { color: '#16a34a', fontSize: 7 },

  // === CRITERIA SECTION (NEW) ===
  criteriaSection: {
    marginTop: 20,
    padding: 10,
  },
  criteriaCategoryBox: {
    marginBottom: 10,
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 5,
    borderRightWidth: 3,
    borderRightColor: '#1a2a3a'
  },
  categoryTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 5,
    textAlign: 'right'
  },
  criteriaRow: {
    flexDirection: 'row-reverse',
    marginBottom: 3,
    alignItems: 'flex-start'
  },
  bulletPoint: {
    width: 15,
    fontSize: 10,
    color: '#1B365D',
    textAlign: 'center',
    marginTop: 0
  },
  criteriaText: {
    flex: 1,
    fontSize: 9,
    color: '#333',
    textAlign: 'right',
    lineHeight: 1.4
  },
  criteriaIntro: {
    fontSize: 10,
    color: '#555',
    textAlign: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#fffbeb',
    borderRadius: 5
  },

  // === FOOTER ===
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
  data: {
    proposal: any;
    validation: {
        missingMandatory: string[];
        regulatoryAlerts: string[];
        areaAlerts: string[];
    };
    // إضافة الخاصية الجديدة
    fullCriteria?: Record<string, string[]>;
  }; 
  projectInfo: { name: string, stars: number };
  user: any;
}

export const HotelBOQDocument: React.FC<BOQProps> = ({ data, projectInfo, user }) => {
  const { proposal, validation, fullCriteria } = data;

  return (
    <Document>
      {/* الصفحة الأولى: الملخص وجدول الأسعار */}
      <Page size="A4" style={styles.page}>
        
        {/* 1. HEADER */}
        <View style={styles.headerContainer} fixed>
          <View style={styles.titleBox}>
            <Text style={styles.mainTitle}>تقرير المستشار الفندقي (BOQ)</Text>
            <Text style={styles.subTitle}>دراسة الامتثال لاشتراطات وزارة السياحة</Text>
          </View>
          <View style={styles.logoBox}>
            <Image src="/logo.png" style={styles.logoImage} />
          </View>
        </View>

        {/* 2. PROJECT SUMMARY */}
        <View style={styles.summarySection}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>المشروع</Text>
            <Text style={styles.summaryValue}>{projectInfo.name}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>التصنيف المستهدف</Text>
            <Text style={styles.summaryValue}>{projectInfo.stars} نجوم</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>عدد الوحدات (المفاتيح)</Text>
            <Text style={styles.summaryValue}>{proposal.totalKeys}</Text>
          </View>
          <View style={styles.lastSummaryItem}>
            <Text style={styles.summaryLabel}>التكلفة التقديرية (للمدرج)</Text>
            <Text style={[styles.summaryValue, {color: '#d4af37'}]}>
               {proposal.totalEstimated.toLocaleString()} SAR
            </Text>
          </View>
        </View>

        {/* 3. DETAILED GROUPS (PRODUCTS) */}
        {proposal.groups.map((group: any, i: number) => (
          <View key={i}>
            <Text style={styles.groupHeader} break={false}>{group.title}</Text>
            
            <View style={styles.tableHeaderRow} break={false}>
              <Text style={[styles.headerCell, styles.col1]}>المعيار</Text>
              <Text style={[styles.headerCell, styles.col2]}>الاشتراط / المنتج</Text>
              <Text style={[styles.headerCell, styles.col3]}>الملاحظات / المصدر</Text>
              <Text style={[styles.headerCell, styles.col4]}>الكمية</Text>
              <Text style={[styles.headerCell, styles.col5]}>السعر</Text>
              <Text style={[styles.headerCell, styles.col6]}>الإجمالي</Text>
            </View>

            {group.items.map((item: any, idx: number) => (
              <View key={idx} style={styles.tableRow} wrap={false}> 
                
                {/* Col 1 */}
                <Text style={[styles.cellText, styles.col1]}>{item.criterion_number || '-'}</Text>
                
                {/* Col 2 */}
                <View style={styles.col2}>
                  <Text style={styles.cellText}>{item.name_ar}</Text>
                  <Text style={item.isMandatory ? styles.badgeMandatory : styles.badgeOptional}>
                    {item.isMandatory ? '* إلزامي' : 'اختياري (نقاط)'}
                  </Text>
                </View>
                
                {/* Col 3 */}
                <View style={styles.col3}>
                  <Text style={styles.smallNote}>
                     {item.sku && item.sku !== 'REG' ? item.sku : item.notes || '-'}
                  </Text>
                </View>

                {/* Col 4 */}
                <Text style={[styles.cellText, styles.col4]}>{item.qty}</Text>

                {/* Col 5 */}
                <Text style={[styles.cellText, styles.col5]}>
                   {item.unitPrice > 0 ? item.unitPrice.toLocaleString() : '-'}
                </Text>

                {/* Col 6 */}
                <Text style={[styles.boldText, styles.col6]}>
                   {item.totalPrice > 0 ? item.totalPrice.toLocaleString() : 'تنسيق خارجي'}
                </Text>
              </View>
            ))}
            
            {/* Group Total */}
            {group.totalCost > 0 && (
                <View style={[styles.tableRow, { backgroundColor: '#fffbf0', borderTopWidth: 1, borderColor: '#d4af37' }]} break={false}>
                   <Text style={[styles.boldText, { flex: 1, textAlign: 'right', paddingRight: 20 }]}>
                      إجمالي المجموعة:
                   </Text>
                   <Text style={[styles.boldText, styles.col6, { color: '#d4af37' }]}>
                      {group.totalCost.toLocaleString()}
                   </Text>
                </View>
            )}
            
            <View style={{ height: 10 }} />
          </View>
        ))}

        {/* 4. FOOTER */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
             UKRA.SA | تقرير المستشار الفندقي الذكي | تم الإنشاء بواسطة: {user?.name || 'زائر'}
          </Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
            `${pageNumber} / ${totalPages}`
          )} />
        </View>

      </Page>
      
      {/* الصفحة الثانية: الدليل المرجعي للاشتراطات (صفحة جديدة) */}
      {fullCriteria && Object.keys(fullCriteria).length > 0 && (
        <Page size="A4" style={styles.page}>
           {/* Header again for new page */}
           <View style={styles.headerContainer} fixed>
             <View style={styles.titleBox}>
               <Text style={styles.mainTitle}>الدليل المرجعي للاشتراطات</Text>
               <Text style={styles.subTitle}>قائمة التحقق الرسمية - تصنيف {projectInfo.stars} نجوم</Text>
             </View>
             <View style={styles.logoBox}>
               <Image src="/logo.png" style={styles.logoImage} />
             </View>
           </View>

           <View style={styles.criteriaSection}>
             <Text style={styles.criteriaIntro}>
               تشمل القائمة التالية كافة الاشتراطات (الإنشائية، العامة، التشغيلية) المطلوبة لتصنيف {projectInfo.stars} نجوم وفق وزارة السياحة. يرجى التأكد من استيفائها للحصول على الترخيص.
             </Text>

             {Object.keys(fullCriteria).map((category, index) => (
               <View key={index} style={styles.criteriaCategoryBox} wrap={false}>
                 <Text style={styles.categoryTitle}>{category}</Text>
                 {fullCriteria[category].map((item: string, i: number) => (
                   <View key={i} style={styles.criteriaRow}>
                     <Text style={styles.bulletPoint}>•</Text>
                     <Text style={styles.criteriaText}>{item}</Text>
                   </View>
                 ))}
               </View>
             ))}
           </View>

           {/* Footer */}
           <View style={styles.footer} fixed>
             <Text style={styles.footerText}>
                UKRA.SA | تقرير المستشار الفندقي الذكي | تم الإنشاء بواسطة: {user?.name || 'زائر'}
             </Text>
             <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
               `${pageNumber} / ${totalPages}`
             )} />
           </View>
        </Page>
      )}

    </Document>
  );
};