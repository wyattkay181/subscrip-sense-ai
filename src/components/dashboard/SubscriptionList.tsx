
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Trash2 } from 'lucide-react';

interface Subscription {
  id: string;
  name: string;
  category: string;
  price: number;
  billingCycle: string;
  nextRenewal: string;
  status: string;
}

type SortKey = 'name' | 'category' | 'price' | 'nextRenewal';
type SortDirection = 'asc' | 'desc';

const SubscriptionList = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('nextRenewal');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Load subscriptions from localStorage on component mount
  useEffect(() => {
    const savedSubscriptions = localStorage.getItem('subscriptions');
    if (savedSubscriptions) {
      setSubscriptions(JSON.parse(savedSubscriptions));
    }
  }, []);

  // Save subscriptions to localStorage whenever subscriptions change
  useEffect(() => {
    localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  const handleDelete = (id: string) => {
    setSubscriptions(prev => prev.filter(sub => sub.id !== id));
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredSubscriptions = [...subscriptions]
    .filter(sub => 
      sub.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      sub.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortKey === 'price') {
        return sortDirection === 'asc' 
          ? a.price - b.price
          : b.price - a.price;
      } else if (sortKey === 'nextRenewal') {
        return sortDirection === 'asc' 
          ? new Date(a.nextRenewal).getTime() - new Date(b.nextRenewal).getTime()
          : new Date(b.nextRenewal).getTime() - new Date(a.nextRenewal).getTime();
      } else {
        const aValue = a[sortKey].toLowerCase();
        const bValue = b[sortKey].toLowerCase();
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
    });

  const SortIndicator = ({ currentKey }: { currentKey: SortKey }) => {
    if (sortKey !== currentKey) return null;
    
    return sortDirection === 'asc' 
      ? <ArrowUp size={14} className="ml-1" /> 
      : <ArrowDown size={14} className="ml-1" />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'trial-ending':
        return <Badge className="bg-subscription-yellow">Trial Ending</Badge>;
      case 'renewal-soon':
        return <Badge className="bg-subscription-blue">Renews Soon</Badge>;
      default:
        return <Badge className="bg-subscription-green">Active</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-lg font-medium">All Subscriptions</CardTitle>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Input
              placeholder="Search subscriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 md:w-[300px]"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {subscriptions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No subscriptions added yet.</p>
            <p className="text-sm mt-2">Click "Add Subscription" to get started!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Name
                      <SortIndicator currentKey="name" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center">
                      Category
                      <SortIndicator currentKey="category" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-primary transition-colors text-right"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center justify-end">
                      Monthly Price
                      <SortIndicator currentKey="price" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-primary transition-colors text-right"
                    onClick={() => handleSort('nextRenewal')}
                  >
                    <div className="flex items-center justify-end">
                      Next Renewal
                      <SortIndicator currentKey="nextRenewal" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredSubscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell className="font-medium">{subscription.name}</TableCell>
                    <TableCell>{subscription.category}</TableCell>
                    <TableCell className="text-right">${subscription.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{formatDate(subscription.nextRenewal)}</TableCell>
                    <TableCell className="text-right">
                      {getStatusBadge(subscription.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(subscription.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionList;
