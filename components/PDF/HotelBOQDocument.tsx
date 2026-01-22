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

  // === ALERTS SECTION (NEW) ===
  alertsContainer: {
    marginBottom: 20,
    flexDirection: 'column',
    gap: 10
  },
  alertBoxRed: {
    backgroundColor: '#fef2f2',
    borderColor: '#fee2e2',
    borderWidth: 1,
    borderRadius: 5,
    padding: 8,
    marginBottom: 5
  },
  alertBoxBlue: {
    backgroundColor: '#eff6ff',
    borderColor: '#dbeafe',
    borderWidth: 1,
    borderRadius: 5,
    padding: 8,
    marginBottom: 5
  },
  alertTitleRed: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: 4,
    textAlign: 'right'
  },
  alertTitleBlue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
    textAlign: 'right'
  },
  alertItem: {
    fontSize: 8,
    color: '#374151',
    textAlign: 'right',
    marginBottom: 2
  },

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
  }; 
  projectInfo: { name: string, stars: number };
  user: any;
}

export const HotelBOQDocument: React.FC<BOQProps> = ({ data, projectInfo, user }) => {
  // فك تفكيك البيانات للهيكل الجديد
  const { proposal, validation } = data;

  return (
    <Document>
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

        {/* 3. VALIDATION REPORT (NEW SECTION) */}
        {(validation.missingMandatory.length > 0 || validation.regulatoryAlerts.length > 0) && (
           <View style={styles.alertsContainer}>
              {/* النواقص الإلزامية */}
              {validation.missingMandatory.length > 0 && (
                 <View style={styles.alertBoxRed}>
                    <Text style={styles.alertTitleRed}>تنبيه: نواقص إلزامية للحصول على الترخيص</Text>
                    {validation.missingMandatory.map((item, idx) => (
                       <Text key={idx} style={styles.alertItem}>• {item}</Text>
                    ))}
                 </View>
              )}
              
              {/* الاشتراطات التنظيمية */}
              {validation.regulatoryAlerts.length > 0 && (
                 <View style={styles.alertBoxBlue}>
                    <Text style={styles.alertTitleBlue}>تنبيهات تنظيمية وإجرائية (خارج نطاق التجهيز):</Text>
                    {validation.regulatoryAlerts.map((item, idx) => (
                       <Text key={idx} style={styles.alertItem}>• {item}</Text>
                    ))}
                 </View>
              )}
           </View>
        )}

        {/* 4. DETAILED GROUPS */}
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

        {/* 5. FOOTER */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
             UKRA.SA | تقرير المستشار الفندقي الذكي | تم الإنشاء بواسطة: {user?.name || 'زائر'}
          </Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
            `${pageNumber} / ${totalPages}`
          )} />
        </View>

      </Page>
    </Document>
  );
};