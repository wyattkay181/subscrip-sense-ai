import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Calendar, TrendingUp, Zap } from 'lucide-react';
interface Subscription {
  id: string;
  name: string;
  category: string;
  price: number;
  billingCycle: string;
  nextRenewal: string;
  status: string;
}
const DashboardStats = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  useEffect(() => {
    const savedSubscriptions = localStorage.getItem('subscriptions');
    if (savedSubscriptions) {
      setSubscriptions(JSON.parse(savedSubscriptions));
    }
  }, []);

  // Listen for storage changes to update when subscriptions are added/removed
  useEffect(() => {
    const handleStorageChange = () => {
      const savedSubscriptions = localStorage.getItem('subscriptions');
      if (savedSubscriptions) {
        setSubscriptions(JSON.parse(savedSubscriptions));
      } else {
        setSubscriptions([]);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events when localStorage is updated from the same tab
    const handleSubscriptionUpdate = () => {
      const savedSubscriptions = localStorage.getItem('subscriptions');
      if (savedSubscriptions) {
        setSubscriptions(JSON.parse(savedSubscriptions));
      } else {
        setSubscriptions([]);
      }
    };
    window.addEventListener('subscriptionsUpdated', handleSubscriptionUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('subscriptionsUpdated', handleSubscriptionUpdate);
    };
  }, []);
  const totalMonthly = subscriptions.reduce((sum, sub) => sum + sub.price, 0);
  const totalYearly = totalMonthly * 12;
  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active').length;

  // Get next renewal
  const nextRenewal = subscriptions.length > 0 ? subscriptions.sort((a, b) => new Date(a.nextRenewal).getTime() - new Date(b.nextRenewal).getTime())[0] : null;
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  const stats = [{
    title: "Monthly Total",
    value: `$${totalMonthly.toFixed(2)}`,
    description: `$${totalYearly.toFixed(2)} annually`,
    icon: DollarSign,
    trend: subscriptions.length > 0 ? "tracking" : "start adding subscriptions"
  }, {
    title: "Active Services",
    value: activeSubscriptions.toString(),
    description: `${subscriptions.length} total subscriptions`,
    icon: Zap,
    trend: subscriptions.length > 0 ? "subscriptions active" : "no subscriptions yet"
  }, {
    title: "Next Renewal",
    value: nextRenewal ? formatDate(nextRenewal.nextRenewal) : "None",
    description: nextRenewal ? nextRenewal.name : "Add subscriptions to track renewals",
    icon: Calendar,
    trend: nextRenewal ? "coming up" : ""
  }, {
    title: "Savings Potential",
    value: subscriptions.length > 0 ? "Available" : "N/A",
    description: subscriptions.length > 0 ? "Ask AI for suggestions" : "Add subscriptions first",
    icon: TrendingUp,
    trend: subscriptions.length > 0 ? "optimization ready" : ""
  }];
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            
            {stat.trend}
          </CardContent>
        </Card>)}
    </div>;
};
export default DashboardStats;