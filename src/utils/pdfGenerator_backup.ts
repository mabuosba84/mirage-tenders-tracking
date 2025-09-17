import { Tender, User } from '@/types'
import { formatResponseTime } from '@/utils/dateCalculations'

// Generate a PDF preview for a single tender
export const generateTenderPreviewPDF = async (tender: Tender, user: User) => {
  if (typeof window === 'undefined') return null
  
  try {
    const jsPDF = (await import('jspdf')).default
    
    const doc = new jsPDF()
    let yPosition = 20
    
    // Helper function to format dates
    const formatDate = (date: Date | null | undefined) => {
      if (!date) return 'Not specified'
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    // Helper function to format currency
    const formatCurrency = (amount: number | null | undefined) => {
      if (amount === null || amount === undefined) return 'Not specified'
      return `${amount.toLocaleString()} JD`
    }

    // Header
    doc.setFontSize(18)
    doc.setTextColor(30, 58, 138)
    doc.text('Mirage Business Solutions', 20, yPosition)
    yPosition += 8
    
    doc.setFontSize(14)
    doc.setTextColor(59, 130, 246)
    doc.text('Tender Details Preview', 20, yPosition)
    yPosition += 15
    
    // Tender ID and Status
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text(`Tender ID: #${tender.id}`, 20, yPosition)
    doc.text(`Status: ${tender.tenderStatus}`, 120, yPosition)
    yPosition += 10
    
    // Customer Information
    doc.setFontSize(14)
    doc.setTextColor(30, 58, 138)
    doc.text('Customer Information', 20, yPosition)
    yPosition += 8
    
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text(`Customer Name: ${tender.customerName}`, 20, yPosition)
    yPosition += 15
    
    // Timeline Information
    doc.setFontSize(14)
    doc.setTextColor(30, 58, 138)
    doc.text('Timeline Information', 20, yPosition)
    yPosition += 8
    
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    
    const timelineData = [
      ['Tender Announcement Date:', formatDate(tender.tenderAnnouncementDate)],
      ['Request Date:', formatDate(tender.requestDate)],
      ['Submission Date:', formatDate(tender.submissionDate)],
      ['Price Request to HP:', formatDate(tender.dateOfPriceRequestToHp)],
      ['Price Received from HP:', formatDate(tender.dateOfPriceReceivedFromHp)]
    ]
    
    timelineData.forEach(([label, value]) => {
      doc.text(label, 20, yPosition)
      doc.text(value, 100, yPosition)
      yPosition += 6
    })
    
    yPosition += 10
    
    // Response Time Analysis
    if (tender.responseTimeInDays !== null) {
      doc.setFontSize(14)
      doc.setTextColor(30, 58, 138)
      doc.text('Response Time Analysis', 20, yPosition)
      yPosition += 8
      
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text(`Response Time: ${formatResponseTime(tender.responseTimeInDays)}`, 20, yPosition)
      yPosition += 6
      
      // Performance assessment
      const performance = tender.responseTimeInDays <= 1 ? 'Excellent' :
                         tender.responseTimeInDays <= 3 ? 'Good' :
                         tender.responseTimeInDays <= 7 ? 'Average' : 'Needs Improvement'
      doc.text(`Performance Rating: ${performance}`, 20, yPosition)
      yPosition += 15
    }
    
    // Financial Information
    doc.setFontSize(14)
    doc.setTextColor(30, 58, 138)
    doc.text('Financial Information', 20, yPosition)
    yPosition += 8
    
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    
    const financialData = [
      ['Cost from HP:', formatCurrency(tender.costFromHP)],
      ['Selling Price:', formatCurrency(tender.sellingPrice)],
      ['Profit Margin:', tender.profitMargin !== null ? `${tender.profitMargin.toFixed(1)}%` : 'Not calculated'],
      ['Estimated Profit:', tender.costFromHP && tender.sellingPrice ? formatCurrency(tender.sellingPrice - tender.costFromHP) : 'Not calculated']
    ]
    
    financialData.forEach(([label, value]) => {
      doc.text(label, 20, yPosition)
      doc.text(value, 70, yPosition)
      yPosition += 6
    })
    
    yPosition += 10
    
    // Additional Information
    if (tender.competitorWinningPrice) {
      doc.setFontSize(14)
      doc.setTextColor(30, 58, 138)
      doc.text('Competitor Information', 20, yPosition)
      yPosition += 8
      
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text(`Competitor Winning Price: ${tender.competitorWinningPrice}`, 20, yPosition)
      yPosition += 15
    }
    
    // Audit Trail
    doc.setFontSize(14)
    doc.setTextColor(30, 58, 138)
    doc.text('Audit Trail', 20, yPosition)
    yPosition += 8
    
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text(`Created by: ${tender.addedBy}`, 20, yPosition)
    yPosition += 6
    doc.text(`Created on: ${formatDate(tender.createdAt)}`, 20, yPosition)
    yPosition += 6
    
    if (tender.lastEditedBy) {
      doc.text(`Last edited by: ${tender.lastEditedBy}`, 20, yPosition)
      yPosition += 6
      doc.text(`Last edited on: ${tender.lastEditedAt ? formatDate(tender.lastEditedAt) : 'Unknown'}`, 20, yPosition)
      yPosition += 6
    }
    
    // Footer
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated by: ${user.name} on ${new Date().toLocaleString()}`, 20, pageHeight - 20)
    doc.text('Mirage Business Solutions | +962 6 569 13 33 | m.abuosba@miragebs.com', 20, pageHeight - 10)
    
    return doc
  } catch (error) {
    console.error('Error generating tender preview PDF:', error)
    throw error
  }
}
