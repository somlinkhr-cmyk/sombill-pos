import React from 'react'
import { formatCurrency } from '../lib/utils'

interface ReceiptItem {
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  modifiers?: any[]
  extras?: any[]
  notes?: string
}

interface ReceiptData {
  restaurant_name: string
  restaurant_address: string
  restaurant_phone: string
  restaurant_email?: string
  tax_id?: string
  receipt_number: string
  invoice_number?: string
  order_number: string
  date: string
  time: string
  cashier_name: string
  waiter_name?: string
  table_number?: number
  order_type: 'dine_in' | 'takeaway' | 'delivery'
  customer_name?: string
  customer_phone?: string
  loyalty_points?: number
  items: ReceiptItem[]
  subtotal: number
  discount: number
  tax: number
  service_charge: number
  grand_total: number
  amount_paid: number
  change: number
  payment_method: string
  qr_code?: string
}

interface ReceiptProps {
  data: ReceiptData
  width?: '80mm' | '58mm'
  showPrintButton?: boolean
  onPrint?: () => void
}

export default function Receipt({ data, width = '80mm', showPrintButton = true, onPrint }: ReceiptProps) {
  const is58mm = width === '58mm'
  
  return (
    <div 
      className={`bg-white mx-auto shadow-lg ${is58mm ? 'w-[58mm]' : 'w-[80mm]'} p-4 font-mono text-xs`}
      style={{ fontFamily: 'Courier New, monospace' }}
    >
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-lg font-bold">{data.restaurant_name}</h1>
        <p className="text-xs">{data.restaurant_address}</p>
        <p className="text-xs">Tel: {data.restaurant_phone}</p>
        {data.restaurant_email && <p className="text-xs">{data.restaurant_email}</p>}
        {data.tax_id && <p className="text-xs">Tax ID: {data.tax_id}</p>}
      </div>

      {/* Divider */}
      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* Receipt Info */}
      <div className="space-y-1 mb-4">
        <div className="flex justify-between">
          <span>Receipt #: {data.receipt_number}</span>
        </div>
        {data.invoice_number && (
          <div className="flex justify-between">
            <span>Invoice #: {data.invoice_number}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Order #: {data.order_number}</span>
        </div>
        <div className="flex justify-between">
          <span>Date: {data.date}</span>
          <span>Time: {data.time}</span>
        </div>
        <div className="flex justify-between">
          <span>Cashier: {data.cashier_name}</span>
        </div>
        {data.waiter_name && (
          <div className="flex justify-between">
            <span>Waiter: {data.waiter_name}</span>
          </div>
        )}
        {data.table_number && (
          <div className="flex justify-between">
            <span>Table: {data.table_number}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Type: {data.order_type.replace('_', ' ').toUpperCase()}</span>
        </div>
        {data.customer_name && (
          <div className="flex justify-between">
            <span>Customer: {data.customer_name}</span>
          </div>
        )}
        {data.customer_phone && (
          <div className="flex justify-between">
            <span>Phone: {data.customer_phone}</span>
          </div>
        )}
        {data.loyalty_points !== undefined && (
          <div className="flex justify-between">
            <span>Loyalty Points: {data.loyalty_points}</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* Items */}
      <div className="mb-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-1">Item</th>
              {!is58mm && <th className="text-right py-1">Qty</th>}
              <th className="text-right py-1">Price</th>
              <th className="text-right py-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-1">
                  <div>{item.product_name}</div>
                  {item.modifiers && item.modifiers.length > 0 && (
                    <div className="text-xs text-gray-500">
                      {item.modifiers.map((m, i) => (
                        <span key={i}>+ {m.name}</span>
                      ))}
                    </div>
                  )}
                  {item.extras && item.extras.length > 0 && (
                    <div className="text-xs text-gray-500">
                      {item.extras.map((e, i) => (
                        <span key={i}>+ {e.name}</span>
                      ))}
                    </div>
                  )}
                  {item.notes && (
                    <div className="text-xs text-gray-500 italic">Note: {item.notes}</div>
                  )}
                </td>
                {!is58mm && <td className="text-right py-1">{item.quantity}</td>}
                <td className="text-right py-1">{formatCurrency(item.unit_price)}</td>
                <td className="text-right py-1">{formatCurrency(item.total_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Divider */}
      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* Totals */}
      <div className="space-y-1 mb-4">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(data.subtotal)}</span>
        </div>
        {data.discount > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Discount:</span>
            <span>-{formatCurrency(data.discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Tax:</span>
          <span>{formatCurrency(data.tax)}</span>
        </div>
        <div className="flex justify-between">
          <span>Service Charge:</span>
          <span>{formatCurrency(data.service_charge)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t border-gray-400 pt-1">
          <span>TOTAL:</span>
          <span>{formatCurrency(data.grand_total)}</span>
        </div>
        <div className="flex justify-between">
          <span>Paid:</span>
          <span>{formatCurrency(data.amount_paid)}</span>
        </div>
        <div className="flex justify-between">
          <span>Change:</span>
          <span>{formatCurrency(data.change)}</span>
        </div>
        <div className="flex justify-between">
          <span>Payment:</span>
          <span>{data.payment_method.toUpperCase()}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* QR Code */}
      {data.qr_code && (
        <div className="flex justify-center mb-4">
          <img src={data.qr_code} alt="QR Code" className="w-24 h-24" />
        </div>
      )}

      {/* Footer */}
      <div className="text-center mb-4">
        <p className="font-bold">Thank You!</p>
        <p className="text-xs">Please come again</p>
      </div>

      {/* Print Button */}
      {showPrintButton && (
        <div className="mt-4">
          <button
            onClick={onPrint}
            className="w-full bg-primary-700 text-white py-2 rounded hover:bg-primary-800 transition-colors"
          >
            Print Receipt
          </button>
        </div>
      )}
    </div>
  )
}
