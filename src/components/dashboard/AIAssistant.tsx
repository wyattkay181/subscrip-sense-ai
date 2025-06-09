
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  text: string;
  isUser: boolean;
}

const predefinedResponses: Record<string, string> = {
  "What subscriptions are costing me the most?": 
    "Based on your current subscriptions, I can help you identify your most expensive services once you add some subscriptions to track.",
    
  "What can I cancel to save money?": 
    "Once you add your subscriptions, I can analyze your spending patterns and suggest which services you might consider canceling to save money.",
    
  "When do my subscriptions renew?": 
    "I can help you track renewal dates for all your subscriptions once you start adding them to your dashboard.",
    
  "How much am I spending total?": 
    "Add your subscriptions to get a complete overview of your monthly and yearly spending across all services.",
    
  "What subscriptions should I consolidate?": 
    "I can identify overlapping services and suggest consolidation opportunities once you have subscriptions tracked in your dashboard."
};

const predefinedQueries = [
  "What subscriptions are costing me the most?",
  "What can I cancel to save money?", 
  "When do my subscriptions renew?",
  "How much am I spending total?",
  "What subscriptions should I consolidate?"
];

const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hi there! I'm your SubscripSense AI assistant. Add some subscriptions to your dashboard and I can help you analyze your spending patterns and find savings opportunities!", isUser: false }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (text = input) => {
    if (!text.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { text, isUser: true }]);
    setInput("");
    setIsTyping(true);
    
    // Simulate AI response
    setTimeout(() => {
      const response = predefinedResponses[text] || 
        "I'm here to help you manage your subscriptions! Try adding some subscriptions first, then ask me about your spending patterns, renewal dates, or savings opportunities.";
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
