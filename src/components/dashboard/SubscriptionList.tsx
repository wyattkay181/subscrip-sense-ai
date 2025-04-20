
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Calendar, ChartPie, ArrowUp, ArrowDown } from 'lucide-react';

const subscriptions = [
  { 
    id: 1, 
    name: 'Netflix', 
    category: 'Streaming', 
    price: 15.99, 
    billingCycle: 'Monthly', 
    nextRenewal: '2025-05-15', 
    status: 'active' 
  },
  { 
    id: 2, 
    name: 'Spotify', 
    category: 'Music', 
    price: 9.99, 
    billingCycle: 'Monthly', 
    nextRenewal: '2025-05-02', 
    status: 'active' 
  },
  { 
    id: 3, 
    name: 'Adobe Creative Cloud', 
    category: 'Productivity', 
    price: 29.99, 
    billingCycle: 'Monthly', 
    nextRenewal: '2025-05-10', 
    status: 'active' 
  },
  { 
    id: 4, 
    name: 'Disney+', 
    category: 'Streaming', 
    price: 7.99, 
    billingCycle: 'Monthly', 
    nextRenewal: '2025-05-24', 
    status: 'active' 
  },
  { 
    id: 5, 
    name: 'HBO Max', 
    category: 'Streaming', 
    price: 14.99, 
    billingCycle: 'Monthly', 
    nextRenewal: '2025-05-08', 
    status: 'active' 
  },
  { 
    id: 6, 
    name: 'Amazon Prime', 
    category: 'Streaming', 
    price: 14.99, 
    billingCycle: 'Monthly', 
    nextRenewal: '2025-05-21', 
    status: 'active' 
  },
  { 
    id: 7, 
    name: 'Notion', 
    category: 'Productivity', 
    price: 8.00, 
    billingCycle: 'Monthly', 
    nextRenewal: '2025-05-12', 
    status: 'trial-ending' 
  },
  { 
    id: 8, 
    name: 'Dropbox', 
    category: 'Storage', 
    price: 9.99, 
    billingCycle: 'Monthly', 
    nextRenewal: '2025-05-14', 
    status: 'active' 
  },
  { 
    id: 9, 
    name: 'Microsoft 365', 
    category: 'Productivity', 
    price: 6.99, 
    billingCycle: 'Monthly', 
    nextRenewal: '2025-05-25', 
    status: 'renewal-soon' 
  },
];

type SortKey = 'name' | 'category' | 'price' | 'nextRenewal';
type SortDirection = 'asc' | 'desc';

const SubscriptionList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('nextRenewal');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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
            <Button variant="outline" size="sm" className="h-9">
              <Calendar size={16} className="mr-1" />
              <span className="hidden md:inline">Filter by Date</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
                <TableHead className="text-right">Actions</TableHead>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Cancel</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionList;
