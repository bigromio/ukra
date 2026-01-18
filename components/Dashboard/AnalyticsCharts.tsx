
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const lineOptions = {
  responsive: true,
  plugins: {
    legend: { position: 'bottom' as const },
    title: { display: false },
  },
  scales: {
    y: { beginAtZero: true }
  }
};

const labels = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'];

const lineData = {
  labels,
  datasets: [
    {
      label: 'الهدف (Target)',
      data: [80, 80, 80, 80, 80, 80],
      borderColor: '#e74c3c',
      backgroundColor: '#e74c3c',
      borderDash: [5, 5],
      tension: 0.1,
    },
    {
      label: 'الإنجاز الفعلي',
      data: [65, 72, 85, 50, 90, 75],
      borderColor: '#c5a059',
      backgroundColor: 'rgba(197, 160, 89, 0.5)',
      tension: 0.4,
    },
  ],
};

const doughnutData = {
  labels: ['مبيعات', 'تشغيل', 'مالية'],
  datasets: [
    {
      data: [12, 19, 3],
      backgroundColor: [
        '#c5a059',
        '#1a2a3a',
        '#9ca3af',
      ],
      borderWidth: 0,
    },
  ],
};

export const AnalyticsCharts = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-4">مسار الإنتاجية الأسبوعي</h3>
          <div className="h-64">
             <Line options={lineOptions} data={lineData} />
          </div>
       </div>
       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-4">توزيع المهام</h3>
          <div className="h-64 flex justify-center">
             <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
          </div>
       </div>
    </div>
  );
};
