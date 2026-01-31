import React from 'react';

interface StatsCardProps {
  title: string;
  value: number;
  total: number;
  color: string;
  icon: React.ReactNode;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, total, color, icon }) => {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">{title}</h3>
        <div className={`p-2 rounded-full ${color.replace('text-', 'bg-').replace('600', '100')} ${color}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-end space-x-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        <span className="text-gray-400 text-sm mb-1">/ {total}</span>
      </div>
      <div className="mt-4 w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${color.replace('text-', 'bg-')}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-2">{percentage}% do total de questões</p>
    </div>
  );
};