import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/Card';
// import { Button } from '../../../../shared/components/ui/button';
import { Badge } from '../../../../shared/components/ui/Badge';
import { BookOpen, TrendingUp, Award, Target, ChevronDown, ChevronUp, Info } from 'lucide-react';

const GoldmanRuleEducation = () => {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const educationSections = [
    {
      id: 'goldmanRule',
      title: 'Goldman Sachs "Rule of 10"',
      icon: <Award className="h-6 w-6 text-yellow-600" />,
      badge: 'Core Strategy',
      summary: 'Identifies 21 S&P 500 stocks with consistent 10% sales growth',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Goldman Sachs' "Rule of 10" is a systematic approach to identifying high-quality stocks 
            with sustainable growth characteristics. This methodology screens for companies demonstrating 
            consistent excellence across multiple financial metrics.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Core Criteria</h4>
              <ul className="space-y-2 text-sm">
                <li>• 10%+ annual sales growth consistency</li>
                <li>• Top 30% operating profitability in sector</li>
                <li>• Strong balance sheet fundamentals</li>
                <li>• Sustainable competitive advantages</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Historical Results</h4>
              <ul className="space-y-2 text-sm">
                <li>• 21 S&P 500 stocks meet all criteria</li>
                <li>• 4.5% annual outperformance vs market</li>
                <li>• Lower volatility than broad market</li>
                <li>• Consistent performance across cycles</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-yellow-800">Key Insight</h5>
                <p className="text-sm text-yellow-700 mt-1">
                  The Rule of 10 focuses on companies that can consistently grow sales by at least 10% 
                  annually while maintaining top-tier operating efficiency in their respective sectors.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'qualityMetrics',
      title: 'Quality Investment Metrics',
      icon: <Target className="h-6 w-6 text-blue-600" />,
      badge: 'Analysis Framework',
      summary: 'Key financial ratios that indicate sustainable competitive advantages',
      content: (
        <div className="space-y-6">
          <p className="text-gray-700">
            Quality investing focuses on companies with strong fundamentals, competitive moats, 
            and financial stability. These metrics help identify businesses with sustainable advantages.
          </p>

          <div className="grid gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Return on Invested Capital (ROIC)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Measures how efficiently a company uses capital to generate profits.
                  </p>
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="text-sm font-medium text-blue-800">Quality Threshold: 15%+</div>
                    <div className="text-xs text-blue-600">Above-average capital efficiency</div>
                  </div>
                </div>
                <div className="text-sm space-y-1">
                  <div><strong>Formula:</strong> NOPAT ÷ Invested Capital</div>
                  <div><strong>Why Important:</strong> Shows pricing power and operational efficiency</div>
                  <div><strong>Industry Context:</strong> Compare within sector for best results</div>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Gross Margin</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Indicates pricing power and cost efficiency in core operations.
                  </p>
                  <div className="bg-green-50 p-3 rounded">
                    <div className="text-sm font-medium text-green-800">Quality Threshold: 40%+</div>
                    <div className="text-xs text-green-600">Strong competitive positioning</div>
                  </div>
                </div>
                <div className="text-sm space-y-1">
                  <div><strong>Formula:</strong> (Revenue - COGS) ÷ Revenue</div>
                  <div><strong>Why Important:</strong> Shows brand strength and market position</div>
                  <div><strong>Trend Analysis:</strong> Look for stable or expanding margins</div>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Financial Stability Ratios</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="space-y-3">
                    <div className="bg-purple-50 p-3 rounded">
                      <div className="text-sm font-medium text-purple-800">Debt-to-Equity: &lt;0.5</div>
                      <div className="text-xs text-purple-600">Conservative leverage management</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded">
                      <div className="text-sm font-medium text-orange-800">Current Ratio: &gt;1.0</div>
                      <div className="text-xs text-orange-600">Short-term liquidity strength</div>
                    </div>
                  </div>
                </div>
                <div className="text-sm space-y-2">
                  <div><strong>Debt Management:</strong> Lower debt reduces financial risk</div>
                  <div><strong>Liquidity:</strong> Ability to meet short-term obligations</div>
                  <div><strong>Stability:</strong> Consistent ratios indicate good management</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'beginnerCriteria',
      title: 'Beginner-Friendly Stock Criteria',
      icon: <BookOpen className="h-6 w-6 text-green-600" />,
      badge: 'Getting Started',
      summary: 'Simplified criteria for new investors focusing on household names',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            For new investors, starting with well-known companies that meet basic quality criteria 
            provides a foundation for learning while maintaining reasonable risk levels.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Household Name Advantage</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Familiar business models (Apple, Microsoft, Coca-Cola)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Easy to understand revenue sources</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Established market presence</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Regular financial reporting and transparency</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Simplified Quality Checks</h4>
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium text-sm">Revenue Growth &gt; -2%</div>
                  <div className="text-xs text-gray-600">Avoid declining businesses</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium text-sm">5+ Years Positive EPS</div>
                  <div className="text-xs text-gray-600">Consistent profitability</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium text-sm">Market Cap &gt; $10B</div>
                  <div className="text-xs text-gray-600">Large-cap stability</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium text-sm">Price/FCF &lt; 15</div>
                  <div className="text-xs text-gray-600">Reasonable valuation</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h5 className="font-medium text-green-800 mb-2">Recommended Starting Categories</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-green-700">Technology Leaders</div>
                <div className="text-green-600">Apple, Microsoft, Google</div>
              </div>
              <div>
                <div className="font-medium text-green-700">Consumer Staples</div>
                <div className="text-green-600">Coca-Cola, P&G, Johnson & Johnson</div>
              </div>
              <div>
                <div className="font-medium text-green-700">Financial Services</div>
                <div className="text-green-600">JPMorgan, Berkshire Hathaway</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'outperformance',
      title: 'Understanding 4.5% Outperformance',
      icon: <TrendingUp className="h-6 w-6 text-purple-600" />,
      badge: 'Performance',
      summary: 'How quality stocks deliver superior long-term returns',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            The 4.5% annual outperformance of quality stocks comes from their ability to grow 
            consistently while maintaining lower volatility during market downturns.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">Compound Effect Illustration</h4>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>S&P 500 (10% annual):</span>
                    <span className="font-medium">$10,000 → $25,937</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quality Stocks (14.5% annual):</span>
                    <span className="font-medium text-purple-700">$10,000 → $37,974</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Additional Return:</span>
                      <span className="text-green-600">+$12,037</span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-2">*Based on 10-year investment period</div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">Sources of Outperformance</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600 mt-1" />
                  <div className="text-sm">
                    <div className="font-medium">Consistent Growth</div>
                    <div className="text-gray-600">Reliable earnings and revenue expansion</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600 mt-1" />
                  <div className="text-sm">
                    <div className="font-medium">Lower Volatility</div>
                    <div className="text-gray-600">Better downside protection in bear markets</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600 mt-1" />
                  <div className="text-sm">
                    <div className="font-medium">Multiple Expansion</div>
                    <div className="text-gray-600">Premium valuations for quality businesses</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-orange-600" />
            Quality Investing Education Center
          </CardTitle>
          <p className="text-gray-600">
            Learn the principles behind Goldman Sachs' "Rule of 10" and quality-based stock selection
          </p>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {educationSections.map((section) => (
          <Card key={section.id} className="overflow-hidden">
            <div onClick={() => toggleSection(section.id)} className="cursor-pointer"><CardHeader 
              className="hover:bg-gray-50 transition-colors"
              
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {section.icon}
                  <div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{section.summary}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {section.badge}
                  </Badge>
                  {expandedSections[section.id] ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </CardHeader></div>
            
            {expandedSections[section.id] && (
              <CardContent className="pt-0">
                {section.content}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Quick Reference Card */}
      <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg">Quick Reference: Quality Stock Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-800 mb-2">Growth</div>
              <div className="space-y-1 text-gray-600">
                <div>• Sales growth ≥10%</div>
                <div>• EPS growth consistent</div>
                <div>• Market share expansion</div>
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-800 mb-2">Profitability</div>
              <div className="space-y-1 text-gray-600">
                <div>• ROIC ≥15%</div>
                <div>• Gross margin ≥40%</div>
                <div>• Operating leverage</div>
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-800 mb-2">Financial Health</div>
              <div className="space-y-1 text-gray-600">
                <div>• Debt/Equity &lt;0.5</div>
                <div>• Current ratio &gt;1.0</div>
                <div>• Free cash flow positive</div>
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-800 mb-2">Market Position</div>
              <div className="space-y-1 text-gray-600">
                <div>• Market cap &gt;$10B</div>
                <div>• Competitive moat</div>
                <div>• Brand recognition</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoldmanRuleEducation; 