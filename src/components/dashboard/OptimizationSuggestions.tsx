
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const suggestions = [
  {
    id: 1,
    type: 'duplicate',
    title: 'Potential Duplicate Services',
    description: 'You have both Spotify ($9.99) and Apple Music ($9.99). Consider canceling one of them.',
    savingsAmount: 9.99,
  },
  {
    id: 2,
    type: 'downgrade',
    title: 'Downgrade Opportunity',
    description: 'Netflix Premium ($19.99) can be downgraded to Standard ($15.49) based on your usage patterns.',
    savingsAmount: 4.50,
  },
  {
    id: 3,
    type: 'unused',
    title: 'Unused Subscription',
    description: 'Adobe Creative Cloud ($29.99) hasn\'t been used in the last 45 days.',
    savingsAmount: 29.99,
  },
];

const OptimizationSuggestions = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Optimization Suggestions</CardTitle>
          <Badge className="bg-subscription-green">Save up to $42.97/mo</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suggestions.map((suggestion) => (
            <Card key={suggestion.id} className="border border-amber-200 bg-amber-50/30 dark:bg-amber-950/10">
              <CardContent className="p-4">
                <div className="flex flex-col h-full">
                  <div className="mb-2">
                    <Badge className={`
                      ${suggestion.type === 'duplicate' ? 'bg-subscription-yellow' : 
                       suggestion.type === 'downgrade' ? 'bg-subscription-blue' : 
                       'bg-subscription-red'}
                    `}>
                      {suggestion.type === 'duplicate' ? 'Duplicate' : 
                       suggestion.type === 'downgrade' ? 'Downgrade' : 
                       'Unused'}
                    </Badge>
                  </div>
                  <h3 className="font-medium text-base mb-2">{suggestion.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 flex-grow">{suggestion.description}</p>
                  <div className="text-subscription-green font-medium">Save ${suggestion.savingsAmount}/mo</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default OptimizationSuggestions;
