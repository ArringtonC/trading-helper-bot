import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../shared/components/ui/tabs';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/Badge';
import { RefreshCw, TrendingUp, Star, Shield, Zap, Award, Clock, BarChart3 } from 'lucide-react';
import CuratedListsService from '../../../shared/services/CuratedListsService';
import CuratedListOverview from '../../../features/analytics/components/CuratedLists/CuratedListOverview';
import CategoryDeepDive from '../../../features/analytics/components/CuratedLists/CategoryDeepDive';
import PerformanceAnalytics from '../../../features/analytics/components/CuratedLists/PerformanceAnalytics';
import GoldmanRuleEducation from '../../../features/analytics/components/CuratedLists/GoldmanRuleEducation';

// Create CardDescription since it doesn't exist in Card.tsx
const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`text-sm text-gray-600 ${className}`}>{children}</p>
);

interface CuratedLists {
  [key: string]: any;
}

const CuratedStockListsPage = () => {
  const [curatedLists, setCuratedLists] = useState<CuratedLists | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState('stocksOfYear');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadCuratedLists();
  }, []);

  const loadCuratedLists = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const lists = CuratedListsService.generateCuratedLists();
      setCuratedLists(lists);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading curated lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadCuratedLists();
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      stocksOfYear: <Award className="h-5 w-5 text-yellow-600" />,
      earlyOpportunities: <Zap className="h-5 w-5 text-blue-600" />,
      stableDividend: <Shield className="h-5 w-5 text-green-600" />,
      established: <Star className="h-5 w-5 text-purple-600" />,
      trending: <TrendingUp className="h-5 w-5 text-orange-600" />,
      sectorLeaders: <BarChart3 className="h-5 w-5 text-indigo-600" />
    };
    return icons[category] || <Star className="h-5 w-5" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      stocksOfYear: 'bg-yellow-50 border-yellow-200',
      earlyOpportunities: 'bg-blue-50 border-blue-200',
      stableDividend: 'bg-green-50 border-green-200',
      established: 'bg-purple-50 border-purple-200',
      trending: 'bg-orange-50 border-orange-200',
      sectorLeaders: 'bg-indigo-50 border-indigo-200'
    };
    return colors[category] || 'bg-gray-50 border-gray-200';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading curated stock lists...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Curated Stock Lists</h1>
            <p className="text-gray-600 mt-2">
              AI-powered stock curation using Goldman Sachs "Rule of 10" and quality metrics
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              <Clock className="h-4 w-4 inline mr-1" />
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-700">21</div>
              <div className="text-sm text-blue-600">Rule of 10 Stocks</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-700">+4.5%</div>
              <div className="text-sm text-green-600">Annual Outperformance</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-700">82%</div>
              <div className="text-sm text-purple-600">Success Rate</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-700">6</div>
              <div className="text-sm text-orange-600">Active Categories</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Lists Overview</TabsTrigger>
          <TabsTrigger value="deepdive">Category Deep-dive</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
        </TabsList>

        {/* Lists Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {curatedLists && (
            <CuratedListOverview 
              lists={curatedLists}
              onSelectCategory={setSelectedCategory}
              getCategoryIcon={getCategoryIcon}
              getCategoryColor={getCategoryColor}
            />
          )}
          
          {/* Goldman Rule Education */}
          <GoldmanRuleEducation />
        </TabsContent>

        {/* Category Deep-dive Tab */}
        <TabsContent value="deepdive" className="space-y-6">
          {curatedLists && (
            <CategoryDeepDive 
              lists={curatedLists}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              getCategoryIcon={getCategoryIcon}
              getCategoryColor={getCategoryColor}
            />
          )}
        </TabsContent>

        {/* Performance Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {curatedLists && (
            <PerformanceAnalytics 
              lists={curatedLists}
              service={CuratedListsService}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CuratedStockListsPage; 