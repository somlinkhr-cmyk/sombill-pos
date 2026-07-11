import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import {
  Settings,
  Save,
  RefreshCw,
  Shield,
  Bell,
  Globe,
  Database,
  Server,
  Mail,
  Key,
  Users,
  Building2,
  CreditCard,
  FileText,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
} from 'lucide-react'

interface SystemSetting {
  id: string
  key: string
  value: any
  description: string
  category: string
  type: 'string' | 'number' | 'boolean' | 'json'
  is_public: boolean
  updated_at: string
}

export default function SuperAdminSettings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'integrations'>('general')
  const [showRestartModal, setShowRestartModal] = useState(false)

  const loadSettings = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('sa_system_settings')
        .select('*')
        .order('category', { ascending: true })

      if (error) throw error
      setSettings(data || [])
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleSaveSetting = async (settingId: string, value: any) => {
    try {
      const { error } = await supabase
        .from('sa_system_settings')
        .update({ value })
        .eq('id', settingId)

      if (error) throw error

      toast.success('Setting saved successfully')
      loadSettings()
    } catch (error) {
      console.error('Error saving setting:', error)
      toast.error('Failed to save setting')
    }
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      // Save all modified settings
      for (const setting of settings) {
        await supabase
          .from('sa_system_settings')
          .update({ value: setting.value })
          .eq('id', setting.id)
      }

      toast.success('All settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const getSettingsByCategory = (category: string) => {
    return settings.filter(s => s.category === category)
  }

  const renderSettingInput = (setting: SystemSetting) => {
    switch (setting.type) {
      case 'boolean':
        return (
          <button
            onClick={() => handleSaveSetting(setting.id, !setting.value)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              setting.value ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                setting.value ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        )
      case 'number':
        return (
          <input
            type="number"
            value={setting.value}
            onChange={(e) => handleSaveSetting(setting.id, parseFloat(e.target.value))}
            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )
      case 'string':
        return (
          <input
            type="text"
            value={setting.value}
            onChange={(e) => handleSaveSetting(setting.id, e.target.value)}
            className="w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )
      default:
        return (
          <input
            type="text"
            value={JSON.stringify(setting.value)}
            onChange={(e) => handleSaveSetting(setting.id, e.target.value)}
            className="w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/superadmin" className="text-gray-600 hover:text-gray-900">
              <Button variant="ghost" size="sm">← Back</Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={loadSettings}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleSaveAll} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save All'}
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'general'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings className="w-4 h-4" />
              General
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'security'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Shield className="w-4 h-4" />
              Security
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Bell className="w-4 h-4" />
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('integrations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'integrations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Globe className="w-4 h-4" />
              Integrations
            </button>
          </nav>
        </div>

        {activeTab === 'general' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Platform Settings</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {getSettingsByCategory('platform').map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{setting.key}</h4>
                        {setting.is_public && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">Public</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                    </div>
                    {renderSettingInput(setting)}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Database Settings</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {getSettingsByCategory('database').map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-gray-400" />
                        <h4 className="font-medium text-gray-900">{setting.key}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                    </div>
                    {renderSettingInput(setting)}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Server Settings</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {getSettingsByCategory('server').map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-gray-400" />
                        <h4 className="font-medium text-gray-900">{setting.key}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                    </div>
                    {renderSettingInput(setting)}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Authentication Settings</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {getSettingsByCategory('auth').map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-gray-400" />
                        <h4 className="font-medium text-gray-900">{setting.key}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                    </div>
                    {renderSettingInput(setting)}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Password Policy</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {getSettingsByCategory('password').map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <h4 className="font-medium text-gray-900">{setting.key}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                    </div>
                    {renderSettingInput(setting)}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Rate Limiting</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {getSettingsByCategory('ratelimit').map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-gray-400" />
                        <h4 className="font-medium text-gray-900">{setting.key}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                    </div>
                    {renderSettingInput(setting)}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Email Settings</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {getSettingsByCategory('email').map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <h4 className="font-medium text-gray-900">{setting.key}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                    </div>
                    {renderSettingInput(setting)}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Notification Preferences</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {getSettingsByCategory('notifications').map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-gray-400" />
                        <h4 className="font-medium text-gray-900">{setting.key}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                    </div>
                    {renderSettingInput(setting)}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Payment Gateway Settings</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {getSettingsByCategory('payment').map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <h4 className="font-medium text-gray-900">{setting.key}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                    </div>
                    {renderSettingInput(setting)}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">API Settings</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {getSettingsByCategory('api').map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <h4 className="font-medium text-gray-900">{setting.key}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                    </div>
                    {renderSettingInput(setting)}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
