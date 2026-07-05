import { formatCurrency } from './utils'
import jsPDF from 'jspdf'

interface ReceiptItem {
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  modifiers?: any[]
  extras?: any[]
  notes?: string
}

interface ReceiptData {
  orderNumber: string
  date: Date
  cashier: string
  waiter?: string
  table?: string
  customer?: string
  customerPhone?: string
  orderType: string
  items: ReceiptItem[]
  subtotal: number
  tax: number
  serviceCharge: number
  discount: number
  total: number
  paymentMethod: string
  amountPaid: number
  change: number
  loyaltyPoints?: number
  restaurantName?: string
  restaurantAddress?: string
  restaurantPhone?: string
  taxId?: string
}

export function generateReceiptHTML(data: ReceiptData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Receipt</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 14px;
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
        }
        .header h1 {
          font-size: 24px;
          margin: 0;
        }
        .header p {
          margin: 5px 0;
          font-size: 12px;
        }
        .divider {
          border-top: 1px dashed #000;
          margin: 10px 0;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
        }
        .items-table {
          width: 100%;
          margin: 10px 0;
        }
        .items-table th {
          text-align: left;
          border-bottom: 1px solid #000;
          padding: 8px 0;
        }
        .items-table td {
          padding: 8px 0;
        }
        .items-table .qty {
          text-align: center;
          width: 50px;
        }
        .items-table .price {
          text-align: right;
          width: 100px;
        }
        .totals {
          margin-top: 10px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
        }
        .grand-total {
          font-size: 18px;
          font-weight: bold;
          border-top: 2px solid #000;
          padding-top: 15px;
          margin-top: 15px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 12px;
        }
        @media print {
          body {
            width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>SomBill Restaurant</h1>
        <p>Mogadishu, Somalia</p>
        <p>Tel: +252 61 XXX XXXX</p>
      </div>
      
      <div class="divider"></div>
      
      <div class="info-row">
        <span>Order #:</span>
        <span>${data.orderNumber}</span>
      </div>
      <div class="info-row">
        <span>Date:</span>
        <span>${data.date.toLocaleString()}</span>
      </div>
      <div class="info-row">
        <span>Cashier:</span>
        <span>${data.cashier}</span>
      </div>
      ${data.table ? `
      <div class="info-row">
        <span>Table:</span>
        <span>${data.table}</span>
      </div>` : ''}
      ${data.customer ? `
      <div class="info-row">
        <span>Customer:</span>
        <span>${data.customer}</span>
      </div>` : ''}
      <div class="info-row">
        <span>Type:</span>
        <span>${data.orderType}</span>
      </div>
      
      <div class="divider"></div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th class="qty">Qty</th>
            <th class="price">Price</th>
            <th class="price">Total</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td class="qty">${item.quantity}</td>
              <td class="price">${formatCurrency(item.unitPrice)}</td>
              <td class="price">${formatCurrency(item.totalPrice)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="divider"></div>
      
      <div class="totals">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>${formatCurrency(data.subtotal)}</span>
        </div>
        ${data.discount > 0 ? `
        <div class="total-row">
          <span>Discount:</span>
          <span>-${formatCurrency(data.discount)}</span>
        </div>` : ''}
        <div class="total-row">
          <span>Tax (5%):</span>
          <span>${formatCurrency(data.tax)}</span>
        </div>
        <div class="total-row">
          <span>Service Charge (10%):</span>
          <span>${formatCurrency(data.serviceCharge)}</span>
        </div>
        <div class="total-row grand-total">
          <span>GRAND TOTAL:</span>
          <span>${formatCurrency(data.total)}</span>
        </div>
      </div>
      
      <div class="divider"></div>
      
      <div class="totals">
        <div class="total-row">
          <span>Payment Method:</span>
          <span>${data.paymentMethod}</span>
        </div>
        <div class="total-row">
          <span>Amount Paid:</span>
          <span>${formatCurrency(data.amountPaid)}</span>
        </div>
        <div class="total-row">
          <span>Change:</span>
          <span>${formatCurrency(data.change)}</span>
        </div>
      </div>
      
      <div class="divider"></div>
      
      <div class="footer">
        <p>Thank you for dining with us!</p>
        <p>Please come again</p>
        <p>Powered by SomBill POS</p>
      </div>
    </body>
    </html>
  `
}

export function generateKitchenTicketHTML(data: ReceiptData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Kitchen Ticket</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 14px;
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
        }
        .header h1 {
          font-size: 24px;
          margin: 0;
        }
        .divider {
          border-top: 1px dashed #000;
          margin: 10px 0;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
        }
        .items-table {
          width: 100%;
          margin: 10px 0;
        }
        .items-table td {
          padding: 8px 0;
        }
        .items-table .qty {
          text-align: center;
          width: 50px;
        }
        .urgent {
          color: red;
          font-weight: bold;
        }
        @media print {
          body {
            width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>KITCHEN ORDER</h1>
      </div>
      
      <div class="divider"></div>
      
      <div class="info-row">
        <span>Order #:</span>
        <span>${data.orderNumber}</span>
      </div>
      <div class="info-row">
        <span>Date:</span>
        <span>${data.date.toLocaleString()}</span>
      </div>
      ${data.table ? `
      <div class="info-row">
        <span>Table:</span>
        <span class="urgent">${data.table}</span>
      </div>` : ''}
      <div class="info-row">
        <span>Type:</span>
        <span>${data.orderType}</span>
      </div>
      
      <div class="divider"></div>
      
      <table class="items-table">
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td class="qty">x${item.quantity}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="divider"></div>
      
      <div style="text-align: center; margin-top: 20px;">
        <p>End of Order</p>
      </div>
    </body>
    </html>
  `
}

export function printReceipt(data: ReceiptData, type: 'receipt' | 'kitchen' = 'receipt'): void {
  try {
    const html = type === 'receipt' ? generateReceiptHTML(data) : generateKitchenTicketHTML(data)
    
    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    document.body.appendChild(iframe)
    
    const printWindow = iframe.contentWindow
    if (printWindow) {
      printWindow.document.open()
      printWindow.document.write(html)
      printWindow.document.close()
      
      // Wait for content to load, then print
      setTimeout(() => {
        printWindow.print()
        // Remove iframe after printing
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 1000)
      }, 250)
    }
  } catch (error) {
    console.error('Error printing receipt:', error)
    // Fallback: try window.open
    const html = type === 'receipt' ? generateReceiptHTML(data) : generateKitchenTicketHTML(data)
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
        printWindow.close()
      }
    }
  }
}

export function downloadReceiptPDF(data: ReceiptData): void {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 200]
  })

  const restaurantName = data.restaurantName || 'SomBill Restaurant'
  const restaurantAddress = data.restaurantAddress || 'Mogadishu, Somalia'
  const restaurantPhone = data.restaurantPhone || '+252 61 XXX XXXX'

  let y = 10
  const lineHeight = 5
  const margin = 5

  // Header
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.text(restaurantName, 40, y, { align: 'center' })
  y += lineHeight

  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.text(restaurantAddress, 40, y, { align: 'center' })
  y += lineHeight
  pdf.text(`Tel: ${restaurantPhone}`, 40, y, { align: 'center' })
  y += lineHeight

  if (data.taxId) {
    pdf.text(`Tax ID: ${data.taxId}`, 40, y, { align: 'center' })
    y += lineHeight
  }

  // Divider
  pdf.line(margin, y, 75, y)
  y += lineHeight

  // Receipt Info
  pdf.setFontSize(8)
  pdf.text(`Order #: ${data.orderNumber}`, margin, y)
  y += lineHeight
  pdf.text(`Date: ${data.date.toLocaleDateString()} ${data.date.toLocaleTimeString()}`, margin, y)
  y += lineHeight
  pdf.text(`Cashier: ${data.cashier}`, margin, y)
  y += lineHeight

  if (data.waiter) {
    pdf.text(`Waiter: ${data.waiter}`, margin, y)
    y += lineHeight
  }

  if (data.table) {
    pdf.text(`Table: ${data.table}`, margin, y)
    y += lineHeight
  }

  if (data.customer) {
    pdf.text(`Customer: ${data.customer}`, margin, y)
    y += lineHeight
  }

  if (data.customerPhone) {
    pdf.text(`Phone: ${data.customerPhone}`, margin, y)
    y += lineHeight
  }

  if (data.loyaltyPoints !== undefined) {
    pdf.text(`Loyalty Points: ${data.loyaltyPoints}`, margin, y)
    y += lineHeight
  }

  pdf.text(`Type: ${data.orderType.toUpperCase()}`, margin, y)
  y += lineHeight

  // Divider
  pdf.line(margin, y, 75, y)
  y += lineHeight

  // Items Header
  pdf.setFont('helvetica', 'bold')
  pdf.text('Item', margin, y)
  pdf.text('Qty', 45, y)
  pdf.text('Price', 55, y)
  pdf.text('Total', 70, y)
  y += lineHeight

  pdf.line(margin, y, 75, y)
  y += lineHeight

  // Items
  pdf.setFont('helvetica', 'normal')
  data.items.forEach((item, index) => {
    const name = item.name.length > 25 ? item.name.substring(0, 25) + '...' : item.name
    pdf.text(name, margin, y)
    pdf.text(item.quantity.toString(), 45, y)
    pdf.text(formatCurrency(item.unitPrice), 55, y)
    pdf.text(formatCurrency(item.totalPrice), 70, y)
    y += lineHeight

    // Modifiers
    if (item.modifiers && item.modifiers.length > 0) {
      item.modifiers.forEach((mod) => {
        pdf.text(`  + ${mod.name}`, margin, y)
        y += lineHeight
      })
    }

    // Extras
    if (item.extras && item.extras.length > 0) {
      item.extras.forEach((extra) => {
        pdf.text(`  + ${extra.name}`, margin, y)
        y += lineHeight
      })
    }

    // Notes
    if (item.notes) {
      pdf.text(`  Note: ${item.notes}`, margin, y)
      y += lineHeight
    }
  })

  // Divider
  pdf.line(margin, y, 75, y)
  y += lineHeight

  // Totals
  pdf.text(`Subtotal:`, margin, y)
  pdf.text(formatCurrency(data.subtotal), 70, y)
  y += lineHeight

  if (data.discount > 0) {
    pdf.text(`Discount:`, margin, y)
    pdf.text(`-${formatCurrency(data.discount)}`, 70, y)
    y += lineHeight
  }

  pdf.text(`Tax:`, margin, y)
  pdf.text(formatCurrency(data.tax), 70, y)
  y += lineHeight

  pdf.text(`Service Charge:`, margin, y)
  pdf.text(formatCurrency(data.serviceCharge), 70, y)
  y += lineHeight

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.text(`TOTAL:`, margin, y)
  pdf.text(formatCurrency(data.total), 70, y)
  y += lineHeight

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.text(`Paid:`, margin, y)
  pdf.text(formatCurrency(data.amountPaid), 70, y)
  y += lineHeight

  pdf.text(`Change:`, margin, y)
  pdf.text(formatCurrency(data.change), 70, y)
  y += lineHeight

  pdf.text(`Payment:`, margin, y)
  pdf.text(data.paymentMethod.toUpperCase(), 70, y)
  y += lineHeight

  // Divider
  pdf.line(margin, y, 75, y)
  y += lineHeight

  // Footer
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Thank You!', 40, y, { align: 'center' })
  y += lineHeight
  pdf.setFont('helvetica', 'normal')
  pdf.text('Please come again', 40, y, { align: 'center' })
  y += lineHeight
  pdf.text('Powered by SomBill POS', 40, y, { align: 'center' })

  // Save PDF
  pdf.save(`Receipt_${data.orderNumber}_${Date.now()}.pdf`)
}

export function reprintReceipt(data: ReceiptData, type: 'receipt' | 'kitchen' = 'receipt'): void {
  printReceipt(data, type)
}
