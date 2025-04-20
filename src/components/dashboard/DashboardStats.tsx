
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';

const DashboardStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard 
        label="Monthly Spend" 
        value="$132.45" 
        changeValue="+$12.99" 
        changePercent="+10.8%" 
        isPositive={false} 
      />
      <StatCard 
        label="Annual Spend" 
        value="$1,589.40" 
        changeValue="+$155.88" 
        changePercent="+10.8%" 
        isPositive={false} 
      />
      <StatCard 
        label="Active Subscriptions" 
        value="14" 
        changeValue="+2" 
        changePercent="+16.7%" 
        isPositive={false} 
      />
      <StatCard 
        label="Potential Savings" 
        value="$42.97" 
        changeValue="+$8.99" 
        changePercent="+26.5%" 
        isPositive={true} 
      />
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  changeValue: string;
  changePercent: string;
  isPositive: boolean;
}

const StatCard = ({ label, value, changeValue, changePercent, isPositive }: StatCardProps) => {
  return (
    <Card className="stat-card">
      <CardContent className="p-0">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        <div className={`flex items-center gap-1 text-sm font-medium mt-2 ${isPositive ? 'text-subscription-green' : 'text-subscription-red'}`}>
          {isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
          <span>{changeValue}</span>
          <span className="text-xs">({changePercent})</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardStats;
