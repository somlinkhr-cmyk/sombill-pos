import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Monitor, Moon, Sun, Printer, Scan, Volume2, Save, RotateCcw, ArrowLeft } from 'lucide-react'

interface CashierSettings {
  darkMode: boolean
  language: string
  printerSelection: string
  receiptSettings: {
    showLogo: boolean
    showFooter: boolean
    autoPrint: boolean
    printKitchenTicket: boolean
  }
  barcodeScannerSettings: {
    enabled: boolean
    autoAdd: boolean
    soundEnabled: boolean
  }
  soundNotifications: {
    kitchenReady: boolean
    paymentSuccess: boolean
    orderComplete: boolean
  }
}

export default function Settings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [settings, setSettings] = useState<CashierSettings>({
    darkMode: false,
    language: 'en',
    printerSelection: 'default',
    receiptSettings: {
      showLogo: true,
      showFooter: true,
      autoPrint: true,
      printKitchenTicket: true
    },
    barcodeScannerSettings: {
      enabled: true,
      autoAdd: true,
      soundEnabled: true
    },
    soundNotifications: {
      kitchenReady: true,
      paymentSuccess: true,
      orderComplete: true
    }
  })
  const [loading, setLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      // Load from localStorage or Supabase
      const saved = localStorage.getItem('cashierSettings')
      if (saved) {
        setSettings(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  async function saveSettings() {
    try {
      setLoading(true)
      // Save to localStorage (or Supabase user_settings table)
      localStorage.setItem('cashierSettings', JSON.stringify(settings))
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setLoading(false)
    }
  }

  function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      setSettings({
        darkMode: false,
        language: 'en',
        printerSelection: 'default',
        receiptSettings: {
          showLogo: true,
          showFooter: true,
          autoPrint: true,
          printKitchenTicket: true
        },
        barcodeScannerSettings: {
          enabled: true,
          autoAdd: true,
          soundEnabled: true
        },
        soundNotifications: {
          kitchenReady: true,
          paymentSuccess: true,
          orderComplete: true
        }
      })
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/cashier')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Configure your cashier preferences</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetSettings}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
            <button
              onClick={saveSettings}
              disabled={loading}
              className="px-4 py-2 bg-[#1976D2] text-white rounded-lg hover:bg-[#0D47A1] flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg flex items-center gap-2">
            <span className="font-medium">Settings saved successfully!</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Appearance */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Appearance
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-gray-600">Use dark theme for the interface</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, darkMode: !settings.darkMode })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.darkMode ? 'bg-[#1976D2]' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    settings.darkMode ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              <div>
                <label className="block font-medium mb-2">Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
                >
                  <option value="en">English</option>
                  <option value="so">Somali</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>
            </div>
          </div>

          {/* Printer Settings */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Printer className="w-5 h-5" />
              Printer Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-2">Printer Selection</label>
                <select
                  value={settings.printerSelection}
                  onChange={(e) => setSettings({ ...settings, printerSelection: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
                >
                  <option value="default">Default System Printer</option>
                  <option value="thermal">Thermal Printer (80mm)</option>
                  <option value="kitchen">Kitchen Printer</option>
                </select>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Logo on Receipt</p>
                    <p className="text-sm text-gray-600">Include restaurant logo on printed receipts</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.receiptSettings.showLogo}
                    onChange={(e) => setSettings({
                      ...settings,
                      receiptSettings: { ...settings.receiptSettings, showLogo: e.target.checked }
                    })}
                    className="w-5 h-5 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Footer on Receipt</p>
                    <p className="text-sm text-gray-600">Include thank you message and contact info</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.receiptSettings.showFooter}
                    onChange={(e) => setSettings({
                      ...settings,
                      receiptSettings: { ...settings.receiptSettings, showFooter: e.target.checked }
                    })}
                    className="w-5 h-5 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-Print Receipt</p>
                    <p className="text-sm text-gray-600">Automatically print receipt after payment</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.receiptSettings.autoPrint}
                    onChange={(e) => setSettings({
                      ...settings,
                      receiptSettings: { ...settings.receiptSettings, autoPrint: e.target.checked }
                    })}
                    className="w-5 h-5 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Print Kitchen Ticket</p>
                    <p className="text-sm text-gray-600">Send order to kitchen printer automatically</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.receiptSettings.printKitchenTicket}
                    onChange={(e) => setSettings({
                      ...settings,
                      receiptSettings: { ...settings.receiptSettings, printKitchenTicket: e.target.checked }
                    })}
                    className="w-5 h-5 rounded"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Barcode Scanner Settings */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Scan className="w-5 h-5" />
              Barcode Scanner Settings
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Barcode Scanner</p>
                  <p className="text-sm text-gray-600">Allow USB barcode scanner input</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.barcodeScannerSettings.enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    barcodeScannerSettings: { ...settings.barcodeScannerSettings, enabled: e.target.checked }
                  })}
                  className="w-5 h-5 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-Add on Scan</p>
                  <p className="text-sm text-gray-600">Automatically add product to cart when scanned</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.barcodeScannerSettings.autoAdd}
                  onChange={(e) => setSettings({
                    ...settings,
                    barcodeScannerSettings: { ...settings.barcodeScannerSettings, autoAdd: e.target.checked }
                  })}
                  className="w-5 h-5 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Scan Sound</p>
                  <p className="text-sm text-gray-600">Play sound when barcode is scanned</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.barcodeScannerSettings.soundEnabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    barcodeScannerSettings: { ...settings.barcodeScannerSettings, soundEnabled: e.target.checked }
                  })}
                  className="w-5 h-5 rounded"
                />
              </div>
            </div>
          </div>

          {/* Sound Notifications */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              Sound Notifications
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Kitchen Ready Alert</p>
                  <p className="text-sm text-gray-600">Play sound when order is ready from kitchen</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.soundNotifications.kitchenReady}
                  onChange={(e) => setSettings({
                    ...settings,
                    soundNotifications: { ...settings.soundNotifications, kitchenReady: e.target.checked }
                  })}
                  className="w-5 h-5 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Payment Success</p>
                  <p className="text-sm text-gray-600">Play sound when payment is completed</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.soundNotifications.paymentSuccess}
                  onChange={(e) => setSettings({
                    ...settings,
                    soundNotifications: { ...settings.soundNotifications, paymentSuccess: e.target.checked }
                  })}
                  className="w-5 h-5 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Order Complete</p>
                  <p className="text-sm text-gray-600">Play sound when order is completed</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.soundNotifications.orderComplete}
                  onChange={(e) => setSettings({
                    ...settings,
                    soundNotifications: { ...settings.soundNotifications, orderComplete: e.target.checked }
                  })}
                  className="w-5 h-5 rounded"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
