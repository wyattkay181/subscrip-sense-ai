
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Trash2, Download, Upload, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Subscription {
  id: string;
  name: string;
  category: string;
  price: number;
  billingCycle: string;
  nextRenewal: string;
}

type SortKey = 'name' | 'category' | 'price' | 'nextRenewal';
type SortDirection = 'asc' | 'desc';

const SubscriptionList = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('nextRenewal');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [editFormData, setEditFormData] = useState<Subscription | null>(null);
  const { toast } = useToast();

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

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setEditFormData({ ...subscription });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;

    setSubscriptions(prev => 
      prev.map(sub => 
        sub.id === editFormData.id ? editFormData : sub
      )
    );

    setEditingSubscription(null);
    setEditFormData(null);
    
    toast({
      title: "Subscription updated",
      description: `${editFormData.name} has been updated successfully.`
    });
  };

  const handleEditInputChange = (field: keyof Subscription, value: string | number) => {
    if (!editFormData) return;
    setEditFormData(prev => prev ? {
      ...prev,
      [field]: value
    } : null);
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

  const exportToCSV = () => {
    if (subscriptions.length === 0) {
      toast({
        title: "No data to export",
        description: "Add some subscriptions first before exporting.",
        variant: "destructive"
      });
      return;
    }

    const headers = ['Name', 'Category', 'Price', 'Billing Cycle', 'Next Renewal'];
    const csvContent = [
      headers.join(','),
      ...subscriptions.map(sub => [
        `"${sub.name}"`,
        `"${sub.category}"`,
        sub.price.toString(),
        `"${sub.billingCycle}"`,
        `"${sub.nextRenewal}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `subscriptions-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: `Exported ${subscriptions.length} subscriptions to CSV.`
    });
  };

  const importFromCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        
        // Skip header row and filter out empty lines
        const dataLines = lines.slice(1).filter(line => line.trim());
        
        const importedSubscriptions: Subscription[] = dataLines.map((line, index) => {
          const columns = line.split(',').map(col => col.replace(/^"|"$/g, '').trim());
          
          if (columns.length < 5) {
            throw new Error(`Invalid CSV format at row ${index + 2}`);
          }

          return {
            id: `imported-${Date.now()}-${index}`,
            name: columns[0],
            category: columns[1],
            price: parseFloat(columns[2]) || 0,
            billingCycle: columns[3],
            nextRenewal: columns[4]
          };
        });

        setSubscriptions(prev => [...prev, ...importedSubscriptions]);
        
        toast({
          title: "Import successful",
          description: `Imported ${importedSubscriptions.length} subscriptions from CSV.`
        });
      } catch (error) {
        toast({
          title: "Import failed",
          description: `Error reading CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive"
        });
      }
    };
    
    reader.readAsText(file);
    // Clear the input so the same file can be selected again
    event.target.value = '';
  };

  const calculateMonthlyCost = (price: number, billingCycle: string) => {
    return billingCycle === 'Yearly' ? price / 12 : price;
  };

  const calculateYearlyCost = (price: number, billingCycle: string) => {
    return billingCycle === 'Monthly' ? price * 12 : price;
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="h-9"
              >
                <Download size={16} className="mr-2" />
                Export
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={importFromCSV}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="csv-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  asChild
                >
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <Upload size={16} className="mr-2" />
                    Import
                  </label>
                </Button>
              </div>
            </div>
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
                       Monthly Cost
                       <SortIndicator currentKey="price" />
                     </div>
                   </TableHead>
                   <TableHead className="text-right">
                     Yearly Cost
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
                  <TableHead className="text-right w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredSubscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                     <TableCell className="font-medium">{subscription.name}</TableCell>
                     <TableCell>{subscription.category}</TableCell>
                     <TableCell className="text-right">
                       ${calculateMonthlyCost(subscription.price, subscription.billingCycle).toFixed(2)}
                     </TableCell>
                     <TableCell className="text-right">
                       ${calculateYearlyCost(subscription.price, subscription.billingCycle).toFixed(2)}
                     </TableCell>
                     <TableCell className="text-right">{formatDate(subscription.nextRenewal)}</TableCell>
                     <TableCell className="text-right">
                       <div className="flex gap-1 justify-end">
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => handleEdit(subscription)}
                           className="text-muted-foreground hover:text-primary"
                         >
                           <Edit size={16} />
                         </Button>
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => handleDelete(subscription.id)}
                           className="text-destructive hover:text-destructive hover:bg-destructive/10"
                         >
                           <Trash2 size={16} />
                         </Button>
                       </div>
                     </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={editingSubscription !== null} onOpenChange={(open) => {
        if (!open) {
          setEditingSubscription(null);
          setEditFormData(null);
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
          </DialogHeader>
          {editFormData && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Service Name</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => handleEditInputChange('name', e.target.value)}
                  placeholder="e.g. Netflix, Spotify"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select 
                  value={editFormData.category} 
                  onValueChange={(value) => handleEditInputChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Streaming', 'Music', 'Productivity', 'Storage', 'Software', 'News', 'Gaming', 'Fitness', 'Education', 'Other'].map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-price">
                    {editFormData.billingCycle === 'Yearly' ? 'Yearly Price' : 'Monthly Price'}
                  </Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editFormData.price}
                    onChange={(e) => handleEditInputChange('price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-billingCycle">Billing Cycle</Label>
                  <Select 
                    value={editFormData.billingCycle} 
                    onValueChange={(value) => handleEditInputChange('billingCycle', value)}
                  >
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
                <Label htmlFor="edit-nextRenewal">Next Renewal Date</Label>
                <Input
                  id="edit-nextRenewal"
                  type="date"
                  value={editFormData.nextRenewal}
                  onChange={(e) => handleEditInputChange('nextRenewal', e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setEditingSubscription(null);
                    setEditFormData(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SubscriptionList;
