
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Calendar, BarChart4, ArrowDownUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  const [activeTab, setActiveTab] = useState('monthly-yearly');

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  // Monthly vs Yearly Cost Comparison
  const getMonthlyVsYearlyData = () => {
    // Sort subscriptions by yearly cost (highest to lowest)
    return [...subscriptions]
      .sort((a, b) => (b.price * 12) - (a.price * 12))
      .slice(0, 5) // Limit to top 5 for better visualization
      .map(sub => ({
        name: sub.name,
        monthly: sub.price,
        yearly: sub.price * 12,
      }));
  };

  // Renewal Timeline
  const getRenewalTimelineData = () => {
    const today = new Date();
    // Get next 6 months of renewals
    return [...subscriptions]
      .sort((a, b) => new Date(a.nextRenewal).getTime() - new Date(b.nextRenewal).getTime())
      .filter(sub => {
        const renewalDate = new Date(sub.nextRenewal);
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(today.getMonth() + 6);
        return renewalDate <= sixMonthsFromNow;
      })
      .map(sub => ({
        name: sub.name,
        date: formatDate(sub.nextRenewal),
        price: sub.price,
        timestamp: new Date(sub.nextRenewal).getTime(),
      }));
  };

  // Subscription Cost Ranking
  const getCostRankingData = () => {
    return [...subscriptions]
      .sort((a, b) => b.price - a.price)
      .map(sub => ({
        name: sub.name,
        price: sub.price,
      }));
  };

  if (subscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Subscription Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No data to display</p>
            <p className="text-sm mt-2">Add subscriptions to see insights</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Subscription Insights</CardTitle>
        <CardDescription>Visualize your subscription data</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="monthly-yearly" className="flex items-center gap-1.5">
              <BarChart4 className="h-4 w-4" />
              <span className="hidden sm:inline">Monthly vs Yearly</span>
              <span className="sm:hidden">Costs</span>
            </TabsTrigger>
            <TabsTrigger value="renewals" className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Renewal Timeline</span>
              <span className="sm:hidden">Renewals</span>
            </TabsTrigger>
            <TabsTrigger value="cost-ranking" className="flex items-center gap-1.5">
              <ArrowDownUp className="h-4 w-4" />
              <span className="hidden sm:inline">Cost Ranking</span>
              <span className="sm:hidden">Ranking</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monthly-yearly">
            <div className="h-[250px]">
              {getMonthlyVsYearlyData().length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getMonthlyVsYearlyData()}
                    margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={70}
                      interval={0}
                      tick={{ fontSize: 12 }}
                      tickMargin={5}
                      tickLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                      tickFormatter={(value) => `$${value}`}
                      tick={{ fontSize: 12 }}
                      tickLine={{ stroke: '#e2e8f0' }}
                    />
                    <Tooltip
                      formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar name="Monthly Cost" dataKey="monthly" fill="#8884d8" radius={[4, 4, 0, 0]} />
                    <Bar name="Yearly Cost" dataKey="yearly" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No subscription data available
                </div>
              )}
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Monthly cost vs. yearly impact (top 5 subscriptions)</p>
            </div>
          </TabsContent>

          <TabsContent value="renewals">
            <div className="h-[250px]">
              {getRenewalTimelineData().length > 0 ? (
                <div className="h-full overflow-y-auto px-2">
                  <div className="space-y-3">
                    {getRenewalTimelineData().map((sub) => (
                      <div key={`${sub.name}-${sub.timestamp}`} className="flex items-center justify-between border-b border-border pb-2">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{sub.name}</p>
                            <p className="text-xs text-muted-foreground">Renews on {sub.date}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="font-medium">
                          ${sub.price.toFixed(2)}
                        </Badge>
                      </div>
                    ))}
                    
                    {getRenewalTimelineData().length === 0 && (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        No upcoming renewals found
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No upcoming renewals in the next 6 months
                </div>
              )}
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Upcoming subscription renewals in the next 6 months</p>
            </div>
          </TabsContent>

          <TabsContent value="cost-ranking">
            <div className="h-[250px]">
              {getCostRankingData().length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getCostRankingData()}
                    layout="vertical"
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis 
                      type="number"
                      tickFormatter={(value) => `$${value}`}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Monthly Cost']}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar 
                      dataKey="price" 
                      fill="#8884d8"
                      radius={[0, 4, 4, 0]}
                    >
                      {getCostRankingData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#ff7c7c' : '#8884d8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No subscription data available
                </div>
              )}
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Subscriptions ranked by monthly cost</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SpendingTrend;
