import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useFormatters } from '../../hooks/useFormatters';
import Button from '../ui/Button';
import LanguageSwitcher from '../ui/LanguageSwitcher';

const InternationalizationDemo = () => {
  const { t, currentLanguage } = useLanguage();
  const {
    formatDate,
    formatTime,
    formatDateTime,
    formatPrice,
    formatNumber,
    formatPercentage,
    formatRelativeTime,
    formatFileSize
  } = useFormatters();

  const [demoData] = useState({
    date: new Date(),
    pastDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    futureDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    amount: 1234567.89,
    smallAmount: 99.95,
    percentage: 0.1234,
    fileSize: 1024 * 1024 * 15.7, // ~15.7 MB
    largeNumber: 1234567
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          {t('language.selectLanguage')} Demo
        </h1>
        <p className="text-muted-foreground mb-6">
          {currentLanguage === 'en' 
            ? 'This demo shows how content adapts to different languages and locales.'
            : 'การสาธิตนี้แสดงให้เห็นว่าเนื้อหาปรับตัวกับภาษาและท้องถิ่นที่แตกต่างกันอย่างไร'
          }
        </p>
        <div className="flex justify-center">
          <LanguageSwitcher variant="primary" size="lg" />
        </div>
      </div>

      {/* Navigation Demo */}
      <div className="bg-card border border-border rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-card-foreground">{t('navigation.dashboard')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="w-full">
            {t('navigation.invoices')}
          </Button>
          <Button variant="outline" className="w-full">
            {t('navigation.customers')}
          </Button>
          <Button variant="outline" className="w-full">
            {t('navigation.reports')}
          </Button>
          <Button variant="outline" className="w-full">
            {t('navigation.settings')}
          </Button>
        </div>
      </div>

      {/* Form Demo */}
      <div className="bg-card border border-border rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-card-foreground">{t('customer.addCustomer')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('customer.name')}
            </label>
            <input
              type="text"
              placeholder={t('customer.name')}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('customer.email')}
            </label>
            <input
              type="email"
              placeholder={t('customer.email')}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('customer.phone')}
            </label>
            <input
              type="tel"
              placeholder={t('customer.phone')}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('customer.company')}
            </label>
            <input
              type="text"
              placeholder={t('customer.company')}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div className="mt-4 flex space-x-2">
          <Button>{t('common.save')}</Button>
          <Button variant="outline">{t('common.cancel')}</Button>
        </div>
      </div>

      {/* Date and Number Formatting Demo */}
      <div className="bg-card border border-border rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-card-foreground">
          {currentLanguage === 'en' ? 'Formatting Examples' : 'ตัวอย่างการจัดรูปแบบ'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-foreground mb-3">
              {currentLanguage === 'en' ? 'Date & Time' : 'วันที่และเวลา'}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('invoice.date')}:</span>
                <span className="text-foreground">{formatDate(demoData.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{currentLanguage === 'en' ? 'Time' : 'เวลา'}:</span>
                <span className="text-foreground">{formatTime(demoData.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{currentLanguage === 'en' ? 'Date & Time' : 'วันที่และเวลา'}:</span>
                <span className="text-foreground">{formatDateTime(demoData.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{currentLanguage === 'en' ? 'Past' : 'อดีต'}:</span>
                <span className="text-foreground">{formatRelativeTime(demoData.pastDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{currentLanguage === 'en' ? 'Future' : 'อนาคต'}:</span>
                <span className="text-foreground">{formatRelativeTime(demoData.futureDate)}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-foreground mb-3">
              {currentLanguage === 'en' ? 'Numbers & Currency' : 'ตัวเลขและสกุลเงิน'}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('invoice.amount')}:</span>
                <span className="text-foreground">{formatPrice(demoData.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{currentLanguage === 'en' ? 'Small Amount' : 'จำนวนเล็ก'}:</span>
                <span className="text-foreground">{formatPrice(demoData.smallAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{currentLanguage === 'en' ? 'Number' : 'ตัวเลข'}:</span>
                <span className="text-foreground">{formatNumber(demoData.largeNumber)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{currentLanguage === 'en' ? 'Percentage' : 'เปอร์เซ็นต์'}:</span>
                <span className="text-foreground">{formatPercentage(demoData.percentage)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{currentLanguage === 'en' ? 'File Size' : 'ขนาดไฟล์'}:</span>
                <span className="text-foreground">{formatFileSize(demoData.fileSize)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Status Demo */}
      <div className="bg-card border border-border rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-card-foreground">{t('invoice.title')}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('invoice.number')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('customer.name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('invoice.amount')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('invoice.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('invoice.date')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                  INV-001
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {currentLanguage === 'en' ? 'John Doe' : 'จอห์น โด'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {formatPrice(demoData.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    {t('invoice.approved')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {formatDate(demoData.date)}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                  INV-002
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {currentLanguage === 'en' ? 'Jane Smith' : 'เจน สมิธ'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {formatPrice(demoData.smallAmount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                    {t('invoice.pending')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {formatDate(demoData.pastDate)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Error Messages Demo */}
      <div className="bg-card border border-border rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-card-foreground">
          {currentLanguage === 'en' ? 'Error Messages' : 'ข้อความแสดงข้อผิดพลาด'}
        </h2>
        <div className="space-y-3">
          <div className="p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800">
            <p className="text-red-800 text-sm dark:text-red-400">{t('errors.networkError')}</p>
          </div>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md dark:bg-yellow-900/20 dark:border-yellow-800">
            <p className="text-yellow-800 text-sm dark:text-yellow-400">{t('form.required')}</p>
          </div>
          <div className="p-3 bg-green-50 border border-green-200 rounded-md dark:bg-green-900/20 dark:border-green-800">
            <p className="text-green-800 text-sm dark:text-green-400">{t('customer.customerAdded')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternationalizationDemo;