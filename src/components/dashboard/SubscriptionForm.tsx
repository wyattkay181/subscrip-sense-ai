
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

interface SubscriptionFormProps {
  onSuccess?: () => void;
}

interface Subscription {
  id: string;
  name: string;
  category: string;
  price: number;
  billingCycle: string;
  nextRenewal: string;
  status: string;
}

const SubscriptionForm = ({ onSuccess }: SubscriptionFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    billingCycle: 'Monthly',
    nextRenewal: '',
    status: 'active'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.price || !formData.nextRenewal) {
      return;
    }

    const newSubscription: Subscription = {
      id: Date.now().toString(),
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      billingCycle: formData.billingCycle,
      nextRenewal: formData.nextRenewal,
      status: formData.status
    };

    // Get existing subscriptions from localStorage
    const existingSubscriptions = localStorage.getItem('subscriptions');
    const subscriptions: Subscription[] = existingSubscriptions ? JSON.parse(existingSubscriptions) : [];
    
    // Add new subscription
    subscriptions.push(newSubscription);
    
    // Save back to localStorage
    localStorage.setItem('subscriptions', JSON.stringify(subscriptions));

    // Reset form
    setFormData({
      name: '',
      category: '',
      price: '',
      billingCycle: 'Monthly',
      nextRenewal: '',
      status: 'active'
    });

    onSuccess?.();
  };

  const categories = [
    'Streaming',
    'Music', 
    'Productivity',
    'Storage',
    'Software',
    'News',
    'Gaming',
    'Fitness',
    'Education',
    'Other'
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Service Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g. Netflix, Spotify"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Monthly Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingCycle">Billing Cycle</Label>
              <Select value={formData.billingCycle} onValueChange={(value) => handleInputChange('billingCycle', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextRenewal">Next Renewal Date</Label>
            <Input
              id="nextRenewal"
              type="date"
              value={formData.nextRenewal}
              onChange={(e) => handleInputChange('nextRenewal', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial-ending">Trial Ending</SelectItem>
                <SelectItem value="renewal-soon">Renewal Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full">
            Add Subscription
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SubscriptionForm;
