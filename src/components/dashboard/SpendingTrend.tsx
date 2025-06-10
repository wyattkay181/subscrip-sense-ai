
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Subscription {
  id: string;
  name: string;
  category: string;
  price: number;
  billingCycle: string;
  nextRenewal: string;
  status: string;
}

const SpendingTrend = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    const savedSubscriptions = localStorage.getItem('subscriptions');
    if (savedSubscriptions) {
      setSubscriptions(JSON.parse(savedSubscriptions));
    }
  }, []);

  // Listen for subscription updates
  useEffect(() => {
    const handleSubscriptionUpdate = () => {
      const savedSubscriptions = localStorage.getItem('subscriptions');
      if (savedSubscriptions) {
        setSubscriptions(JSON.parse(savedSubscriptions));
      } else {
        setSubscriptions([]);
      }
    };

    window.addEventListener('subscriptionsUpdated', handleSubscriptionUpdate);
    window.addEventListener('storage', handleSubscriptionUpdate);

    return () => {
      window.removeEventListener('subscriptionsUpdated', handleSubscriptionUpdate);
      window.removeEventListener('storage', handleSubscriptionUpdate);
    };
  }, []);

  // Generate spending trend data based on actual subscriptions
  const generateTrendData = () => {
    if (subscriptions.length === 0) {
      return [];
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const currentTotal = subscriptions.reduce((sum, sub) => sum + sub.price, 0);
    
    // For demo purposes, show a trend leading up to current spending
    // In a real app, this would come from historical data
    return months.map((month, index) => ({
      month,
      amount: Math.max(0, currentTotal - (months.length - 1 - index) * (currentTotal * 0.1))
    }));
  };

  const trendData = generateTrendData();

  if (subscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Spending Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No data to display</p>
            <p className="text-sm mt-2">Add subscriptions to see spending trends</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Spending Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Monthly Spending']}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#8884d8', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          <p>Current monthly total: ${subscriptions.reduce((sum, sub) => sum + sub.price, 0).toFixed(2)}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpendingTrend;
