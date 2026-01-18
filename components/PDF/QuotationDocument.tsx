import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';

// 1. تسجيل خط "Tajawal" (يدعم العربية والإنجليزية)
Font.register({
  family: 'Tajawal',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@fontsource/tajawal@4.5.0/files/tajawal-arabic-400-normal.woff', fontWeight: 'normal' },
    { src: 'https://cdn.jsdelivr.net/npm/@fontsource/tajawal@4.5.0/files/tajawal-arabic-700-normal.woff', fontWeight: 'bold' }
  ]
});

// 2. النصوص والترجمات (مع البيانات الجديدة)
const translations = {
  ar: {
    title: 'عرض سعر',
    ref: 'رقم المرجع',
    date: 'تاريخ الإصدار',
    valid_until: 'صالح حتى',
    billTo: 'بيانات العميل',
    from: 'مقدم العرض',
    
    // أعمدة الجدول
    col_hash: '#',
    col_desc: 'وصف المنتج',
    col_qty: 'العدد',
    col_price: 'السعر',
    col_total: 'الإجمالي',

    // الشروط (تم التعديل: دفع 100%)
    terms_header: 'الشروط والأحكام',
    term_delivery: '• مدة التوريد: 15 يوم عمل من تاريخ تحويل المبلغ.',
    term_payment: '• شروط الدفع: دفع 100% مقدماً لتأكيد الطلب.',
    term_warranty: '• الضمان: سنتان شامل العيوب المصنعية.',
    term_vat: '• الأسعار الموضحة تشمل ضريبة القيمة المضافة (15%).',

    // بيانات البنك
    bank_header: 'بيانات التحويل البنكي',
    bank_name_label: 'البنك',
    bank_name_value: 'مصرف الراجحي',
    beneficiary_label: 'المستفيد',
    beneficiary_value: 'مؤسسة أوكرة للمقاولات',
    iban_label: 'الآيبان',
    
    // الملخص المالي
    subtotal: 'المجموع',
    tax: 'الضريبة (15%)',
    total_due: 'الإجمالي المستحق',

    // التذييل
    footer_cr: 'سجل تجاري: 4650247729',
    footer_loc: 'المملكة العربية السعودية - المدينة المنورة',
    footer_tel: 'جوال: 0569159938'
  },
  en: {
    title: 'Quotation',
    ref: 'Quote Ref',
    date: 'Date',
    valid_until: 'Valid Until',
    billTo: 'Bill To',
    from: 'From',
    
    col_hash: '#',
    col_desc: 'Description',
    col_qty: 'Qty',
    col_price: 'Unit Price',
    col_total: 'Total',

    terms_header: 'Terms & Conditions',
    term_delivery: '• Delivery: 15 Working days from payment date.',
    term_payment: '• Payment: 100% Advance payment required.',
    term_warranty: '• Warranty: 2 Years on manufacturing defects.',
    term_vat: '• Prices include VAT (15%).',

    bank_header: 'Bank Transfer Details',
    bank_name_label: 'Bank',
    bank_name_value: 'Al Rajhi Bank',
    beneficiary_label: 'Beneficiary',
    beneficiary_value: 'Ukra Contracting Est.',
    iban_label: 'IBAN',

    subtotal: 'Subtotal',
    tax: 'VAT (15%)',
    total_due: 'Grand Total',

    footer_cr: 'CR: 4650247729',
    footer_loc: 'KSA - Madinah Munawwarah',
    footer_tel: 'Mobile: 0569159938'
  }
};

interface QuotationProps {
  cartItems: any[];
  clientName: string;
  clientPhone: string;
  quotationNo: string;
  date: string;
  lang: 'ar' | 'en';
}

export const QuotationDocument: React.FC<QuotationProps> = ({ cartItems, clientName, clientPhone, quotationNo, date, lang }) => {
  const t = translations[lang];
  const isRTL = lang === 'ar';

  // 3. التصميم المحسن (Elegant Style)
  const styles = StyleSheet.create({
    page: {
      padding: 40,
      fontFamily: 'Tajawal',
      backgroundColor: '#ffffff',
      fontSize: 9,
      lineHeight: 1.4,
      color: '#333',
    },
    
    // HEADER
    header: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 30,
      paddingBottom: 20,
      borderBottomWidth: 2,
      borderBottomColor: '#c5a059', // Gold color
    },
    logoContainer: {
      width: 100,
    },
    logoImage: {
      width: '100%',
      height: 'auto',
    },
    docDetails: {
      alignItems: isRTL ? 'flex-end' : 'flex-start',
    },
    mainTitle: {
      fontSize: 26,
      fontWeight: 'bold',
      color: '#3e2723', // Dark Brown
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    metaRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      marginBottom: 3,
    },
    metaLabel: {
      color: '#7f8c8d',
      width: 70,
      textAlign: isRTL ? 'right' : 'left',
    },
    metaValue: {
      fontWeight: 'bold',
      color: '#2c3e50',
    },

    // INFO GRID (Client & Vendor)
    infoGrid: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      marginBottom: 30,
      gap: 20,
    },
    infoCard: {
      flex: 1,
      backgroundColor: '#fbfbfb',
      borderRadius: 6,
      padding: 12,
      borderLeftWidth: isRTL ? 0 : 3,
      borderRightWidth: isRTL ? 3 : 0,
      borderColor: '#c5a059',
    },
    cardTitle: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#c5a059',
      marginBottom: 6,
      textTransform: 'uppercase',
      textAlign: isRTL ? 'right' : 'left',
    },
    cardText: {
      fontSize: 9,
      color: '#444',
      marginBottom: 3,
      textAlign: isRTL ? 'right' : 'left',
    },

    // TABLE
    tableContainer: {
      marginBottom: 20,
      borderRadius: 6,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#eee',
    },
    tableHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      backgroundColor: '#3e2723',
      paddingVertical: 10,
      paddingHorizontal: 8,
    },
    th: {
      color: 'white',
      fontSize: 8,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    tableRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
      paddingVertical: 10,
      paddingHorizontal: 8,
      alignItems: 'center',
      backgroundColor: '#fff',
    },
    cell: {
      fontSize: 9,
      textAlign: 'center',
      color: '#2c3e50',
    },
    productMeta: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      paddingHorizontal: 5,
    },
    prodImg: {
      width: 32,
      height: 32,
      borderRadius: 4,
      backgroundColor: '#eee',
      marginHorizontal: 8,
    },
    
    // FOOTER SECTION (Terms + Financials)
    footerSection: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 25,
      marginTop: 10,
    },
    
    // Terms & Bank Area
    termsArea: {
      flex: 1.8,
    },
    sectionHeading: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#3e2723',
      marginBottom: 5,
      textAlign: isRTL ? 'right' : 'left',
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      paddingBottom: 4,
    },
    termItem: {
      fontSize: 8,
      color: '#555',
      marginBottom: 3,
      textAlign: isRTL ? 'right' : 'left',
      paddingLeft: isRTL ? 0 : 5,
      paddingRight: isRTL ? 5 : 0,
    },
    
    bankCard: {
      marginTop: 12,
      backgroundColor: '#fdfaf0', // Light Gold Background
      padding: 10,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#e8dcb5',
    },
    bankRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    bankLabel: { fontSize: 8, color: '#888' },
    bankValue: { fontSize: 8, fontWeight: 'bold', color: '#3e2723' },
    ibanValue: { fontSize: 9, fontWeight: 'bold', color: '#c5a059', letterSpacing: 0.5 },

    // Financial Totals
    totalsArea: {
      flex: 1,
      backgroundColor: '#fff',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#eee',
      padding: 15,
      height: 120, // Fixed height for alignment
      justifyContent: 'center',
    },
    totalRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    totalLabel: { fontSize: 9, color: '#666' },
    totalVal: { fontSize: 9, fontWeight: 'bold', color: '#333' },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 8 },
    grandTotal: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
    },
    grandLabel: { fontSize: 11, fontWeight: 'bold', color: '#3e2723' },
    grandVal: { fontSize: 14, fontWeight: 'bold', color: '#c5a059' },

    // PAGE FOOTER
    pageFooter: {
      position: 'absolute',
      bottom: 30,
      left: 40,
      right: 40,
      textAlign: 'center',
      borderTopWidth: 1,
      borderTopColor: '#eee',
      paddingTop: 10,
    },
    footerLine: {
      fontSize: 8,
      color: '#7f8c8d',
      marginBottom: 3,
    },
  });

  const subTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subTotal * 0.15;
  const total = subTotal + tax;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* === HEADER === */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image src="/logo.png" style={styles.logoImage} />
          </View>
          <View style={styles.docDetails}>
            <Text style={styles.mainTitle}>{t.title}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t.ref}:</Text>
              <Text style={styles.metaValue}>{quotationNo}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t.date}:</Text>
              <Text style={styles.metaValue}>{date}</Text>
            </View>
          </View>
        </View>

        {/* === INFO CARDS === */}
        <View style={styles.infoGrid}>
          {/* Client Info */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>{t.billTo}</Text>
            <Text style={styles.cardText}>{clientName || 'Guest'}</Text>
            <Text style={styles.cardText}>{clientPhone}</Text>
          </View>
          {/* Vendor Info (Fixed Data) */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>{t.from}</Text>
            <Text style={styles.cardText}>{isRTL ? 'مؤسسة أوكرة للمقاولات' : 'Ukra Contracting Est.'}</Text>
            <Text style={styles.cardText}>{t.footer_loc}</Text>
            <Text style={styles.cardText}>{t.footer_cr}</Text>
            <Text style={styles.cardText}>{t.footer_tel}</Text>
          </View>
        </View>

        {/* === TABLE === */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { width: '8%' }]}>{t.col_hash}</Text>
            <Text style={[styles.th, { width: '12%' }]}>Image</Text>
            <Text style={[styles.th, { width: '40%', textAlign: isRTL ? 'right' : 'left' }]}>{t.col_desc}</Text>
            <Text style={[styles.th, { width: '10%' }]}>{t.col_qty}</Text>
            <Text style={[styles.th, { width: '15%' }]}>{t.col_price}</Text>
            <Text style={[styles.th, { width: '15%' }]}>{t.col_total}</Text>
          </View>

          {cartItems.map((item, index) => (
            <View key={index} style={styles.tableRow} wrap={false}>
              <Text style={[styles.cell, { width: '8%' }]}>{index + 1}</Text>
              
              <View style={[styles.cell, { width: '12%', alignItems: 'center' }]}>
                {item.image_url && (
                  <Image src={item.image_url} style={styles.prodImg} />
                )}
              </View>

              <View style={[styles.productMeta, { width: '40%' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ textAlign: isRTL ? 'right' : 'left', fontSize: 9, fontWeight: 'bold' }}>
                    {isRTL ? item.name_ar : (item.name_en || item.name_ar)}
                  </Text>
                  <Text style={{ textAlign: isRTL ? 'right' : 'left', fontSize: 8, color: '#888' }}>
                    {item.main_category}
                  </Text>
                </View>
              </View>

              <Text style={[styles.cell, { width: '10%' }]}>{item.quantity}</Text>
              <Text style={[styles.cell, { width: '15%' }]}>{item.price.toLocaleString()}</Text>
              <Text style={[styles.cell, { width: '15%', fontWeight: 'bold' }]}>
                {(item.price * item.quantity).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* === FOOTER SECTION === */}
        <View style={styles.footerSection} wrap={false}>
          
          {/* Left: Terms & Bank */}
          <View style={styles.termsArea}>
            {/* Terms */}
            <Text style={styles.sectionHeading}>{t.terms_header}</Text>
            <Text style={styles.termItem}>{t.term_payment}</Text>
            <Text style={styles.termItem}>{t.term_delivery}</Text>
            <Text style={styles.termItem}>{t.term_warranty}</Text>
            <Text style={styles.termItem}>{t.term_vat}</Text>
            
            {/* Bank Details (Card Style) */}
            <View style={styles.bankCard}>
              <Text style={[styles.sectionHeading, { color: '#c5a059', borderBottomWidth: 0 }]}>
                {t.bank_header}
              </Text>
              
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>{t.bank_name_label}:</Text>
                <Text style={styles.bankValue}>{t.bank_name_value}</Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>{t.beneficiary_label}:</Text>
                <Text style={styles.bankValue}>{t.beneficiary_value}</Text>
              </View>
              
              <View style={{ marginTop: 5, paddingTop: 5, borderTopWidth: 1, borderTopColor: '#e8dcb5' }}>
                <Text style={[styles.bankLabel, { marginBottom: 2 }]}>{t.iban_label}:</Text>
                {/* عرض الآيبان من اليسار لليمين دائماً لضمان القراءة الصحيحة */}
                <Text style={[styles.ibanValue, { textAlign: 'left', direction: 'ltr' }]}>
                   SA 4680 0004 3260 8016 0966 77
                </Text>
              </View>
            </View>
          </View>

          {/* Right: Totals */}
          <View style={styles.totalsArea}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t.subtotal}</Text>
              <Text style={styles.totalVal}>{subTotal.toLocaleString()}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t.tax}</Text>
              <Text style={styles.totalVal}>{tax.toLocaleString()}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.grandTotal}>
              <Text style={styles.grandLabel}>{t.total_due}</Text>
              <Text style={styles.grandVal}>{total.toLocaleString()} SAR</Text>
            </View>
          </View>

        </View>

        {/* === PAGE FOOTER (FIXED) === */}
        <View style={styles.pageFooter} fixed>
          <Text style={styles.footerLine}>
             {t.footer_loc}  |  {t.footer_cr}  |  {t.footer_tel}
          </Text>
          <Text style={[styles.footerLine, { color: '#c5a059', fontWeight: 'bold' }]}>
             www.ukra.sa
          </Text>
        </View>

      </Page>
    </Document>
  );
};