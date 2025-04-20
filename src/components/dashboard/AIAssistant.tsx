
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Message {
  text: string;
  isUser: boolean;
}

const predefinedResponses: Record<string, string> = {
  "What subscriptions are costing me the most?": 
    "Your most expensive subscriptions are: 1. Adobe Creative Cloud ($29.99), 2. Netflix ($15.99), and 3. Amazon Prime ($14.99). These three services account for 46% of your monthly subscription spending.",
    
  "What can I cancel to save $50/month?": 
    "To save $50/month, you could cancel: 1. Adobe Creative Cloud ($29.99) and 2. HBO Max ($14.99). This would save you $44.98/month. Adding Spotify ($9.99) would bring your savings to $54.97/month.",
    
  "When is my Netflix renewal?": 
    "Your Netflix subscription renews on May 15, 2025. You're currently on the Premium plan ($15.99/month).",
    
  "How much am I spending on streaming?": 
    "You're currently spending $58.97/month on streaming services (Netflix, Disney+, HBO Max, Amazon Prime). This represents 44.5% of your total subscription spending.",
    
  "What subscriptions should I consolidate?": 
    "I recommend consolidating your music subscriptions. You're currently paying for both Spotify ($9.99) and Apple Music ($9.99). Consider keeping just one of these services to save $9.99/month."
};

const predefinedQueries = [
  "What subscriptions are costing me the most?",
  "What can I cancel to save $50/month?",
  "When is my Netflix renewal?",
  "How much am I spending on streaming?",
  "What subscriptions should I consolidate?"
];

const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hi there! I'm your SubscripSense AI assistant. How can I help you with your subscriptions today?", isUser: false }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = (text = input) => {
    if (!text.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { text, isUser: true }]);
    setInput("");
    setIsTyping(true);
    
    // Simulate AI response
    setTimeout(() => {
      const response = predefinedResponses[text] || 
        "I'm still learning about your subscription patterns. Could you try asking me something else about your subscriptions?";
      setMessages(prev => [...prev, { text: response, isUser: false }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <Card className="flex flex-col h-[400px]">
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle className="text-lg font-medium">AI Assistant</CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex-1 overflow-y-auto flex flex-col">
        <div className="flex-1 overflow-y-auto mb-4">
          {messages.map((message, index) => (
            <div 
              key={index}
              className={`mb-3 ${message.isUser ? "ml-auto" : "mr-auto"} max-w-[80%]`}
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
        </div>
        
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
