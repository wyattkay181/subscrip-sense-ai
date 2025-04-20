
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const subscriptions = [
  { name: 'Netflix', usage: 85, color: '#E50914' },
  { name: 'Spotify', usage: 92, color: '#1DB954' },
  { name: 'Adobe CC', usage: 40, color: '#FF0000' },
  { name: 'Disney+', usage: 30, color: '#0063E5' },
  { name: 'iCloud', usage: 55, color: '#147EFB' },
];

const UsageInsights = () => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Usage Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {subscriptions.map((sub) => (
            <div key={sub.name} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{sub.name}</span>
                <span className="text-sm text-muted-foreground">{sub.usage}%</span>
              </div>
              <Progress value={sub.usage} className="h-2" indicatorClassName={`bg-[${sub.color}]`} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UsageInsights;
