
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  text: string;
  isUser: boolean;
}

interface Subscription {
  id: string;
  name: string;
  category: string;
  price: number;
  billingCycle: string;
  nextRenewal: string;
}

const predefinedQueries = [
  "What subscriptions are costing me the most?",
  "What can I cancel to save money?", 
  "When do my subscriptions renew?",
  "How much am I spending total?",
  "What subscriptions should I consolidate?"
];

const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hi there! I'm your SubscripSense AI assistant. I can help you analyze your spending patterns and find savings opportunities!", isUser: false }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load subscriptions from localStorage
  useEffect(() => {
    const loadSubscriptions = () => {
      const savedSubscriptions = localStorage.getItem('subscriptions');
      if (savedSubscriptions) {
        setSubscriptions(JSON.parse(savedSubscriptions));
      }
    };

    loadSubscriptions();

    // Listen for subscription updates
    const handleSubscriptionUpdate = () => {
      loadSubscriptions();
    };

    window.addEventListener('subscriptionsUpdated', handleSubscriptionUpdate);
    window.addEventListener('storage', handleSubscriptionUpdate);

    return () => {
      window.removeEventListener('subscriptionsUpdated', handleSubscriptionUpdate);
      window.removeEventListener('storage', handleSubscriptionUpdate);
    };
  }, []);

  const generateResponse = (query: string): string => {
    if (subscriptions.length === 0) {
      return "I notice you haven't added any subscriptions yet. Add some subscriptions to your dashboard and I can provide personalized insights about your spending!";
    }

    const totalMonthly = subscriptions.reduce((sum, sub) => sum + sub.price, 0);
    const totalYearly = totalMonthly * 12;
    
    // Sort by price to find most expensive
    const sortedByPrice = [...subscriptions].sort((a, b) => b.price - a.price);
    const mostExpensive = sortedByPrice.slice(0, 3);
    
    // Group by category to find duplicates
    const categories = subscriptions.reduce((acc, sub) => {
      acc[sub.category] = (acc[sub.category] || []).concat(sub);
      return acc;
    }, {} as Record<string, Subscription[]>);
    
    const duplicateCategories = Object.entries(categories)
      .filter(([_, subs]) => subs.length > 1);
    
    // Sort by renewal date
    const upcomingRenewals = [...subscriptions]
      .sort((a, b) => new Date(a.nextRenewal).getTime() - new Date(b.nextRenewal).getTime())
      .slice(0, 5);

    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes("costing") || lowerQuery.includes("expensive") || lowerQuery.includes("most")) {
      const expensiveList = mostExpensive.map(sub => `${sub.name}: $${sub.price.toFixed(2)}/month`).join(', ');
      return `Your most expensive subscriptions are: ${expensiveList}. These account for $${mostExpensive.reduce((sum, sub) => sum + sub.price, 0).toFixed(2)} of your monthly spending.`;
    }
    
    if (lowerQuery.includes("cancel") || lowerQuery.includes("save")) {
      if (duplicateCategories.length > 0) {
        const categoryName = duplicateCategories[0][0];
        const categorySubs = duplicateCategories[0][1];
        return `Consider consolidating your ${categoryName} subscriptions: ${categorySubs.map(s => s.name).join(', ')}. You could potentially save by choosing just one service.`;
      } else if (mostExpensive.length > 0) {
        return `Your highest subscription is ${mostExpensive[0].name} at $${mostExpensive[0].price.toFixed(2)}/month. Consider if you're getting full value from this service.`;
      }
      return "Your subscriptions look well optimized! No obvious savings opportunities right now.";
    }
    
    if (lowerQuery.includes("renew") || lowerQuery.includes("renewal") || lowerQuery.includes("when")) {
      const renewalList = upcomingRenewals.map(sub => {
        const date = new Date(sub.nextRenewal);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${sub.name}: ${dateStr}`;
      }).join(', ');
      return `Your upcoming renewals: ${renewalList}`;
    }
    
    if (lowerQuery.includes("spending") || lowerQuery.includes("total") || lowerQuery.includes("much")) {
      return `You're spending $${totalMonthly.toFixed(2)} per month ($${totalYearly.toFixed(2)} annually) across ${subscriptions.length} subscriptions. Your average subscription costs $${(totalMonthly / subscriptions.length).toFixed(2)}/month.`;
    }
    
    if (lowerQuery.includes("consolidate") || lowerQuery.includes("duplicate") || lowerQuery.includes("similar")) {
      if (duplicateCategories.length > 0) {
        const dupes = duplicateCategories.map(([category, subs]) => 
          `${category}: ${subs.map(s => s.name).join(', ')}`
        ).join('; ');
        return `You have multiple subscriptions in these categories: ${dupes}. Consider consolidating to save money.`;
      }
      return "I don't see any obvious duplicate categories in your subscriptions. Good job keeping things streamlined!";
    }

    // Default response with personalized data
    return `You have ${subscriptions.length} subscriptions totaling $${totalMonthly.toFixed(2)}/month. Your most expensive is ${mostExpensive[0]?.name || 'N/A'} at $${mostExpensive[0]?.price.toFixed(2) || '0'}/month. Ask me about specific insights!`;
  };

  const handleSendMessage = (text = input) => {
    if (!text.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { text, isUser: true }]);
    setInput("");
    setIsTyping(true);
    
    // Generate AI response
    setTimeout(() => {
      const response = generateResponse(text);
      setMessages(prev => [...prev, { text: response, isUser: false }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle className="text-lg font-medium">AI Assistant</CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex-1 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 pr-4 mb-4">
          <div className="space-y-3">
            {messages.map((message, index) => (
              <div 
                key={index}
                className={`${message.isUser ? "ml-auto" : "mr-auto"} max-w-[80%]`}
              >
                <div 
                  className={`p-3 rounded-lg ${
                    message.isUser 
                      ? "bg-subscription-purple text-white rounded-tr-none" 
                      : "bg-accent text-foreground rounded-tl-none"
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="mr-auto max-w-[80%]">
                <div className="p-3 rounded-lg bg-accent text-foreground rounded-tl-none">
                  <div className="flex space-x-1 items-center">
                    <div className="w-2 h-2 rounded-full bg-subscription-purple animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-subscription-purple animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-subscription-purple animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {predefinedQueries.map((query, index) => (
              <Button 
                key={index} 
                variant="outline" 
                size="sm"
                className="text-xs"
                onClick={() => handleSendMessage(query)}
              >
                {query}
              </Button>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me about your subscriptions..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button onClick={() => handleSendMessage()}>Ask</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIAssistant;
