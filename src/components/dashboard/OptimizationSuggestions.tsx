
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, DollarSign, Zap } from 'lucide-react';

interface Subscription {
  id: string;
  name: string;
  category: string;
  price: number;
  billingCycle: string;
  nextRenewal: string;
}

const OptimizationSuggestions = () => {
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

  // Generate suggestions based on actual subscriptions
  const generateSuggestions = () => {
    if (subscriptions.length === 0) {
      return [];
    }

    const suggestions = [];
    const totalMonthly = subscriptions.reduce((sum, sub) => sum + sub.price, 0);

    // Find most expensive subscription
    const mostExpensive = subscriptions.reduce((max, sub) => 
      sub.price > max.price ? sub : max
    );

    // Find duplicate categories
    const categories = subscriptions.reduce((acc, sub) => {
      acc[sub.category] = (acc[sub.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const duplicateCategories = Object.entries(categories)
      .filter(([_, count]) => count > 1)
      .map(([category]) => category);

    // Generate relevant suggestions
    if (mostExpensive.price > 20) {
      suggestions.push({
        icon: DollarSign,
        title: `Review ${mostExpensive.name}`,
        description: `Your highest subscription at $${mostExpensive.price.toFixed(2)}/month. Consider if you're getting full value.`,
        impact: "Medium"
      });
    }

    if (duplicateCategories.length > 0) {
      suggestions.push({
        icon: TrendingDown,
        title: `Consolidate ${duplicateCategories[0]} services`,
        description: `You have multiple ${duplicateCategories[0]} subscriptions. Consider combining for better value.`,
        impact: "High"
      });
    }

    if (totalMonthly > 50) {
      suggestions.push({
        icon: Zap,
        title: "Annual billing discounts",
        description: `Switch to annual billing to save up to 20% on your $${totalMonthly.toFixed(2)} monthly total.`,
        impact: "High"
      });
    }

    return suggestions;
  };

  const suggestions = generateSuggestions();

  if (subscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Optimization Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No suggestions available</p>
            <p className="text-sm mt-2">Add subscriptions to get personalized optimization tips</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Optimization Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Great job! Your subscriptions look well optimized.</p>
            <p className="text-sm mt-2">We'll notify you of new opportunities as they arise.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Optimization Suggestions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suggestions.map((suggestion, index) => (
          <Card key={index} className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {suggestion.title}
              </CardTitle>
              <suggestion.icon className="h-4 w-4 text-subscription-purple" />
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground mb-3">{suggestion.description}</p>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  suggestion.impact === 'High' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                }`}>
                  {suggestion.impact} Impact
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OptimizationSuggestions;
