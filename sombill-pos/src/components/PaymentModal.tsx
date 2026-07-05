import React, { useState } from 'react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { formatCurrency } from '../lib/utils'
import { CreditCard, Smartphone, QrCode, DollarSign, Printer, X } from 'lucide-react'

interface PaymentMethod {
  id: string
  name: string
  code: string
  type: 'cash' | 'card' | 'mobile' | 'qr' | 'bank'
  requires_phone: boolean
}

interface CartItem {
  product: any
  quantity: number
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  subtotal: number
  tax: number
  serviceCharge: number
  grandTotal: number
  onPaymentComplete: (paymentData: any) => void
  paymentMethods: PaymentMethod[]
}

export default function PaymentModal({
  isOpen,
  onClose,
  cart,
  subtotal,
  tax,
  serviceCharge,
  grandTotal,
  onPaymentComplete,
  paymentMethods
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [amountPaid, setAmountPaid] = useState(grandTotal)
  const [customerPhone, setCustomerPhone] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const change = amountPaid - grandTotal

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <DollarSign className="w-5 h-5" />
      case 'card':
        return <CreditCard className="w-5 h-5" />
      case 'mobile':
        return <Smartphone className="w-5 h-5" />
      case 'qr':
        return <QrCode className="w-5 h-5" />
      default:
        return <DollarSign className="w-5 h-5" />
    }
  }

  const handlePayment = async () => {
    if (!selectedMethod) {
      setErrorMessage('Please select a payment method')
      return
    }

    if (selectedMethod.requires_phone && !customerPhone) {
      setErrorMessage('Please enter customer phone number')
      return
    }

    setIsProcessing(true)
    setPaymentStatus('processing')
    setErrorMessage('')

    try {
      // Simulate payment processing
      // In production, this would call the actual payment gateway API
      await new Promise(resolve => setTimeout(resolve, 2000))

      // For mobile payments, simulate API call
      if (selectedMethod.type === 'mobile') {
        // Simulate mobile payment gateway call
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      setPaymentStatus('success')

      const paymentData = {
        payment_method_id: selectedMethod.id,
        payment_method_code: selectedMethod.code,
        amount: grandTotal,
        amount_paid: amountPaid,
        change: change,
        customer_phone: selectedMethod.requires_phone ? customerPhone : null,
        reference_number: referenceNumber || null,
        transaction_id: `TXN-${Date.now()}`,
        status: 'paid'
      }

      setTimeout(() => {
        onPaymentComplete(paymentData)
        resetForm()
      }, 1000)

    } catch (error) {
      setPaymentStatus('failed')
      setErrorMessage('Payment failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const resetForm = () => {
    setSelectedMethod(null)
    setAmountPaid(grandTotal)
    setCustomerPhone('')
    setReferenceNumber('')
    setPaymentStatus('idle')
    setErrorMessage('')
  }

  const handleClose = () => {
    if (paymentStatus === 'processing') return
    resetForm()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Payment</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between text-lg">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium">{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-gray-600">Service Charge</span>
              <span className="font-medium">{formatCurrency(serviceCharge)}</span>
            </div>
            <div className="flex justify-between text-2xl font-bold pt-4 border-t border-gray-200">
              <span>Total</span>
              <span className="text-primary-700">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Select Payment Method</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {paymentMethods.map(method => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method)}
                disabled={isProcessing}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  selectedMethod?.id === method.id
                    ? 'border-primary-700 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {getPaymentIcon(method.type)}
                <span className="font-medium text-sm">{method.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Details */}
        {selectedMethod && (
          <div className="mb-6 space-y-4">
            {selectedMethod.requires_phone && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Phone Number
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g., +252 61 234 5678"
                  disabled={isProcessing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}

            {selectedMethod.type === 'cash' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount Received
                </label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                  disabled={isProcessing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {change >= 0 && (
                  <p className="mt-2 text-lg font-semibold text-green-600">
                    Change: {formatCurrency(change)}
                  </p>
                )}
                {change < 0 && (
                  <p className="mt-2 text-lg font-semibold text-red-600">
                    Remaining: {formatCurrency(Math.abs(change))}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference Number (Optional)
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                disabled={isProcessing}
                placeholder="Transaction reference"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        )}

        {/* Payment Status */}
        {paymentStatus === 'processing' && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-blue-800 font-medium">Processing payment...</span>
            </div>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span className="text-green-800 font-medium">Payment successful!</span>
            </div>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✗</span>
              </div>
              <span className="text-red-800 font-medium">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing || paymentStatus === 'success'}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            disabled={!selectedMethod || isProcessing || paymentStatus === 'success' || change < 0}
            className="flex-1"
          >
            {isProcessing ? 'Processing...' : 'Confirm Payment'}
          </Button>
        </div>

        {/* Print Receipt Button */}
        {paymentStatus === 'success' && (
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => console.log('Print receipt')}
              className="w-full"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Receipt
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
