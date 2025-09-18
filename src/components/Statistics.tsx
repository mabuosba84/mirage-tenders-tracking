'use client'

import { Tender, User } from '@/types'
import { TrendingUp, TrendingDown, Clock, Award, DollarSign, Percent, Shield } from 'lucide-react'
import { formatResponseTime, formatNumber, formatPercentage } from '@/utils/dateCalculations'

interface StatisticsProps {
  tenders: Tender[]
  user: User
}

export default function Statistics({ tenders, user }: StatisticsProps) {
  // Debug: Log received tenders
  console.log('Statistics component received tenders:', tenders.length)
  
  // Ensure admin users have full permissions
  const safeUser = {
    ...user,
    permissions: {
      canViewCostFromHP: user.permissions?.canViewCostFromHP ?? (user.role === 'admin'),
      canViewSellingPrice: user.permissions?.canViewSellingPrice ?? (user.role === 'admin'),
      canViewProfitMargin: user.permissions?.canViewProfitMargin ?? (user.role === 'admin'),
      canViewTenderItems: user.permissions?.canViewTenderItems ?? true,
      canEditTenders: user.permissions?.canEditTenders ?? true,
      canDeleteTenders: user.permissions?.canDeleteTenders ?? (user.role === 'admin'),
      canViewFinancialReports: user.permissions?.canViewFinancialReports ?? (user.role === 'admin'),
      canManageUsers: user.permissions?.canManageUsers ?? (user.role === 'admin'),
      canExportData: user.permissions?.canExportData ?? (user.role === 'admin'),
      canViewOptionalFields: user.permissions?.canViewOptionalFields ?? true
    }
  }
  
  const calculateStats = () => {
    const totalTenders = tenders.length
    const wonTenders = tenders.filter(t => t.tenderStatus === 'Won').length
    const lostTenders = tenders.filter(t => t.tenderStatus === 'Lost').length
    const underReviewTenders = tenders.filter(t => t.tenderStatus === 'Under review').length
    const globalAgreementTenders = tenders.filter(t => t.tenderStatus === 'Global Agreement').length
    
    const winRate = totalTenders > 0 ? (wonTenders / totalTenders) * 100 : 0
    
    // Revenue calculation - check selling price permission
    const totalRevenue = safeUser.permissions?.canViewSellingPrice ? tenders
      .filter(t => t.tenderStatus === 'Won' && t.sellingPrice)
      .reduce((sum, t) => sum + (t.sellingPrice || 0), 0) : 0
    
    // Only calculate cost-related stats if user has permission
    const totalCost = safeUser.permissions?.canViewCostFromHP ? tenders
      .filter(t => t.tenderStatus === 'Won' && t.costFromHP)
      .reduce((sum, t) => sum + (t.costFromHP || 0), 0) : 0
    
    // Profit calculation - requires both cost and selling price permissions
    const totalProfit = (safeUser.permissions?.canViewCostFromHP && safeUser.permissions?.canViewSellingPrice) 
      ? totalRevenue - totalCost : 0
    
    // Profit margin calculation - requires profit margin permission
    const avgProfitMargin = safeUser.permissions?.canViewProfitMargin ? tenders
      .filter(t => t.profitMargin !== null)
      .reduce((sum, t, _, arr) => sum + (t.profitMargin || 0) / arr.length, 0) : 0

    // Response Time Statistics
    const tendersWithResponseTime = tenders.filter(t => t.responseTimeInDays !== null)
    const avgResponseTime = tendersWithResponseTime.length > 0 
      ? tendersWithResponseTime.reduce((sum, t) => sum + (t.responseTimeInDays || 0), 0) / tendersWithResponseTime.length
      : null
    
    const fastResponses = tendersWithResponseTime.filter(t => (t.responseTimeInDays || 0) <= 1).length
    const slowResponses = tendersWithResponseTime.filter(t => (t.responseTimeInDays || 0) > 7).length
    const pendingResponses = tenders.filter(t => t.dateOfPriceRequestToHp && !t.dateOfPriceReceivedFromHp).length

    return {
      totalTenders,
      wonTenders,
      lostTenders,
      underReviewTenders,
      globalAgreementTenders,
      winRate,
      totalRevenue,
      totalCost,
      totalProfit,
      avgProfitMargin,
      avgResponseTime,
      fastResponses,
      slowResponses,
      pendingResponses,
      totalWithResponseTime: tendersWithResponseTime.length
    }
  }

  const stats = calculateStats()

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'blue', 
    suffix = '',
    subtitle = ''
  }: { 
    title: string
    value: string | number
    icon: any
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
    suffix?: string
    subtitle?: string
  }) => {
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500'
    }

    // Check if this is a profit margin value that's negative
    const isNegativeProfit = title.includes('Profit Margin') && parseFloat(value.toString()) < 0

    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-2xl font-bold ${isNegativeProfit ? 'text-red-600' : 'text-gray-900'}`}>
              {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    )
  }

  const recentTenders = tenders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
        <p className="text-gray-600">
          Monitor your tender performance and track key metrics
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tenders"
          value={stats.totalTenders}
          icon={Award}
          color="blue"
        />
        <StatCard
          title="Won Tenders"
          value={stats.wonTenders}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Lost Tenders"
          value={stats.lostTenders}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          title="Under Review"
          value={stats.underReviewTenders}
          icon={Clock}
          color="yellow"
        />
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Win Rate"
          value={formatPercentage(stats.winRate)}
          icon={Percent}
          color="purple"
          suffix="%"
        />
        
        {safeUser.permissions?.canViewSellingPrice ? (
          <StatCard
            title="Total Revenue"
            value={formatNumber(stats.totalRevenue)}
            icon={DollarSign}
            color="green"
            suffix=" JD"
          />
        ) : (
          <StatCard
            title="Revenue Access"
            value="Restricted"
            icon={Shield}
            color="red"
            subtitle="Limited permissions"
          />
        )}

        {(safeUser.permissions?.canViewCostFromHP && safeUser.permissions?.canViewSellingPrice) ? (
          <StatCard
            title="Total Profit"
            value={formatNumber(stats.totalProfit)}
            icon={TrendingUp}
            color="blue"
            suffix=" JD"
          />
        ) : (
          <StatCard
            title="Profit Access"
            value="Restricted"
            icon={Shield}
            color="red"
            subtitle="Limited permissions"
          />
        )}

        {safeUser.permissions?.canViewProfitMargin ? (
          <StatCard
            title="Avg Profit Margin"
            value={formatPercentage(stats.avgProfitMargin)}
            icon={Percent}
            color={stats.avgProfitMargin < 0 ? 'red' : 'purple'}
            suffix="%"
          />
        ) : (
          <StatCard
            title="Margin Access"
            value="Restricted"
            icon={Shield}
            color="red"
            subtitle="Limited permissions"
          />
        )}
      </div>

      {/* Response Time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Avg Response Time"
          value={stats.avgResponseTime !== null ? stats.avgResponseTime.toFixed(1) : 'N/A'}
          icon={Clock}
          color="blue"
          suffix={stats.avgResponseTime !== null ? ' days' : ''}
        />
        <StatCard
          title="Fast Responses"
          value={stats.fastResponses}
          icon={TrendingUp}
          color="green"
          subtitle="≤ 1 day"
        />
        <StatCard
          title="Slow Responses"
          value={stats.slowResponses}
          icon={TrendingDown}
          color="red"
          subtitle="> 7 days"
        />
        <StatCard
          title="Pending Responses"
          value={stats.pendingResponses}
          icon={Clock}
          color="yellow"
          subtitle="Awaiting reply"
        />
      </div>

      {/* Tender Status Distribution */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tender Status Distribution</h3>
        <div className="space-y-3">
          {[
            { status: 'Won', count: stats.wonTenders, color: 'bg-green-500' },
            { status: 'Lost', count: stats.lostTenders, color: 'bg-red-500' },
            { status: 'Under Review', count: stats.underReviewTenders, color: 'bg-yellow-500' },
            { status: 'Global Agreement', count: stats.globalAgreementTenders, color: 'bg-purple-500' },
          ].map(({ status, count, color }) => (
            <div key={`stats-status-${status}`} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${color}`}></div>
                <span className="text-sm font-medium text-gray-700">{status}</span>
              </div>
              <span className="text-sm text-gray-600">
                {count} ({stats.totalTenders > 0 ? formatPercentage((count / stats.totalTenders) * 100) : '0.00'}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Tenders */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tenders</h3>
        {recentTenders.length > 0 ? (
          <div className="space-y-3">
            {recentTenders.map((tender) => (
              <div key={`stats-recent-${tender.id}`} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    tender.tenderStatus === 'Won' ? 'bg-green-500' :
                    tender.tenderStatus === 'Lost' ? 'bg-red-500' :
                    tender.tenderStatus === 'Under review' ? 'bg-yellow-500' :
                    'bg-purple-500'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Tender #{tender.id}
                    </p>
                    <p className="text-xs text-gray-600">
                      Added by {tender.addedBy} • {new Date(tender.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    tender.tenderStatus === 'Won' ? 'text-green-600' :
                    tender.tenderStatus === 'Lost' ? 'text-red-600' :
                    tender.tenderStatus === 'Under review' ? 'text-yellow-600' :
                    'text-purple-600'
                  }`}>
                    {tender.tenderStatus}
                  </p>
                  {tender.sellingPrice && (
                    <p className="text-xs text-gray-600">
                      {tender.sellingPrice} JD
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No tenders found</p>
        )}
      </div>
    </div>
  )
}
