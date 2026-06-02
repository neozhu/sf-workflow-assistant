import { useAppConfig } from '#imports'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useSettings } from '@/hooks/use-settings'
import { useTheme } from '@/hooks/use-theme'
import { 
  testSalesforceConnection, 
  saveSalesforceConfig, 
  loadSalesforceConfig, 
  clearSalesforceConfig,
  type OrganizationInfo,
  type UserInfo,
  type SalesforceConnectionResult 
} from '@/lib/salesforce'
import {
  Monitor,
  Moon,
  Sun,
  Loader2,
  CheckCircle,
  XCircle,
  KeyRound
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface SettingsTabProps {
  appearance: any
  system: any
  updateAppearance: (data: any) => void
  updateSystem: (data: any) => void
  updateOrganization: (organization: OrganizationInfo | null) => void
  updateUser: (user: UserInfo | null) => void
  resetSettings: () => void
}

export function SettingsTab({ appearance, system, updateAppearance, updateSystem, updateOrganization, updateUser, resetSettings }: SettingsTabProps) {
  const config = useAppConfig()
  const { setTheme } = useTheme({
    theme: appearance.theme,
    onThemeChange: (theme) => updateAppearance({ theme })
  })

  // State for connection testing and organization info
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionResult, setConnectionResult] = useState<SalesforceConnectionResult | null>(null)
  const [organizationInfo, setOrganizationInfo] = useState<OrganizationInfo | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isConnectionValid, setIsConnectionValid] = useState(false)
  const [isImportingSession, setIsImportingSession] = useState(false)

  // Load saved configuration on component mount
  useEffect(() => {
    // If we already have organization info in system state, use it
    if (system.organization) {
      setOrganizationInfo(system.organization)
      setIsConnectionValid(true)
      setConnectionResult({ success: true, organization: system.organization, user: system.user })
    } else {
      // Clear local state if no organization in global state
      setOrganizationInfo(null)
      setIsConnectionValid(false)
      setConnectionResult(null)
    }
    
    if (system.user) {
      setUserInfo(system.user)
    } else {
      setUserInfo(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [system.organization, system.user])

  // Set default instanceUrl only once on mount
  useEffect(() => {
    if (!system.instanceUrl) {
      updateSystem({ 
        instanceUrl: 'https://voithhydro.my.salesforce.com',
        accessToken: system.accessToken || ''
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const themeOptions = [
    { value: 'system', label: 'System', icon: Monitor },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon }
  ] as const

  const handleSyncIntervalChange = (value: string) => {
    const interval = parseInt(value)
    if (!isNaN(interval) && interval > 0) {
      updateSystem({ syncInterval: interval })
    }
  }

  const handleTestConnection = async () => {
    if (!system.instanceUrl || !system.accessToken) {
      setConnectionResult({
        success: false,
        error: 'Please provide both Instance URL and Access Token'
      })
      return
    }

    setIsTestingConnection(true)
    setConnectionResult(null)
    setIsConnectionValid(false)

    try {
      const result = await testSalesforceConnection({
        instanceUrl: system.instanceUrl,
        accessToken: system.accessToken
      })

      setConnectionResult(result)
      
      if (result.success && result.organization) {
        setOrganizationInfo(result.organization)
        setIsConnectionValid(true)
        
        // Update user info if available
        if (result.user) {
          setUserInfo(result.user)
        }
        
        // Update global state with the new organization and user info
        try {
          await updateOrganization(result.organization)
          if (result.user) {
            await updateUser(result.user)
          }
          
          // Also save to localStorage for backwards compatibility
          saveSalesforceConfig(
            {
              instanceUrl: system.instanceUrl,
              accessToken: system.accessToken
            },
            result.organization,
            result.user || undefined
          )
        } catch (error) {
          console.error('Failed to save connection data:', error)
        }
      } else {
        setOrganizationInfo(null)
        setUserInfo(null)
        setIsConnectionValid(false)
        try {
          await updateOrganization(null)
          await updateUser(null)
        } catch (error) {
          console.error('Failed to clear connection data:', error)
        }
      }
    } catch (error) {
      setConnectionResult({
        success: false,
        error: 'Connection test failed'
      })
      setOrganizationInfo(null)
      setUserInfo(null)
      setIsConnectionValid(false)
      await updateOrganization(null)
      await updateUser(null)
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleUseBrowserSession = async () => {
    if (!system.instanceUrl) {
      setConnectionResult({
        success: false,
        error: 'Please provide an Instance URL before reading your browser session'
      })
      return
    }

    setIsImportingSession(true)
    setConnectionResult(null)
    setIsConnectionValid(false)

    try {
      const sessionResult = await browser.runtime.sendMessage({
        type: 'GET_SALESFORCE_SESSION',
        instanceUrl: system.instanceUrl
      }) as {
        success: boolean
        instanceUrl?: string
        accessToken?: string
        error?: string
      }

      if (!sessionResult.success || !sessionResult.accessToken || !sessionResult.instanceUrl) {
        setOrganizationInfo(null)
        setUserInfo(null)
        setConnectionResult({
          success: false,
          error: sessionResult.error || 'Unable to read Salesforce browser session'
        })
        return
      }

      await updateSystem({
        instanceUrl: sessionResult.instanceUrl,
        accessToken: sessionResult.accessToken
      })

      const result = await testSalesforceConnection({
        instanceUrl: sessionResult.instanceUrl,
        accessToken: sessionResult.accessToken
      })

      setConnectionResult(result)

      if (result.success && result.organization) {
        setOrganizationInfo(result.organization)
        setIsConnectionValid(true)

        if (result.user) {
          setUserInfo(result.user)
        }

        await updateOrganization(result.organization)
        if (result.user) {
          await updateUser(result.user)
        }

        saveSalesforceConfig(
          {
            instanceUrl: sessionResult.instanceUrl,
            accessToken: sessionResult.accessToken
          },
          result.organization,
          result.user || undefined
        )
      } else {
        setOrganizationInfo(null)
        setUserInfo(null)
        setIsConnectionValid(false)
        await updateOrganization(null)
        await updateUser(null)
      }
    } catch (error) {
      setOrganizationInfo(null)
      setUserInfo(null)
      setIsConnectionValid(false)
      setConnectionResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read Salesforce browser session'
      })
      await updateOrganization(null)
      await updateUser(null)
    } finally {
      setIsImportingSession(false)
    }
  }

  const handleSaveChanges = async () => {
    if (!isConnectionValid || !organizationInfo) {
      return
    }

    try {
      // All data is already saved in global state via updateOrganization and updateUser
      // The WXT storage system will automatically persist this data
      
      // Optional: Also save to localStorage for backwards compatibility if needed
      saveSalesforceConfig(
        {
          instanceUrl: system.instanceUrl,
          accessToken: system.accessToken
        },
        organizationInfo,
        userInfo || undefined
      )
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  const handleReset = async () => {
    // Clear localStorage
    clearSalesforceConfig()
    
    // Reset local component state
    setConnectionResult(null)
    setOrganizationInfo(null)
    setUserInfo(null)
    setIsConnectionValid(false)
    
    // Reset global state
    await updateOrganization(null)
    await updateUser(null)
    
    // Reset all settings (this will clear WXT storage)
    resetSettings()
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-4">
        {/* Appearance Settings */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Appearance</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Customize the look and feel
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Theme</Label>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((option) => {
                const Icon = option.icon
                const isActive = appearance.theme === option.value
                return (
                  <Button
                    key={option.value}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme(option.value)}
                    className="flex flex-col gap-1 h-auto py-3"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{option.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>
        </div>

        <Separator />

        {/* System Settings */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">System Settings</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Salesforce connection configuration
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">
                Instance URL
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Your Salesforce organization URL
              </p>
              <Input
                type="url"
                value={system.instanceUrl || ''}
                onChange={(e) => updateSystem({ instanceUrl: e.target.value })}
                className="text-xs"
                placeholder="https://yourorg.my.salesforce.com"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">
                Access Token
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Your Salesforce session ID or OAuth access token
              </p>
              <textarea
                value={system.accessToken || ''}
                onChange={(e) => updateSystem({ accessToken: e.target.value })}
                className="w-full min-h-[80px] px-3 py-2 text-xs border border-input bg-background rounded-md resize-y"
                placeholder="Enter your access token here..."
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleUseBrowserSession}
              disabled={isImportingSession || isTestingConnection || !system.instanceUrl}
            >
              {isImportingSession ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Reading Browser Session...
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4 mr-2" />
                  Use Browser Session
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleTestConnection}
              disabled={isTestingConnection || isImportingSession || !system.instanceUrl || !system.accessToken}
            >
              {isTestingConnection ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
          </div>

          <Separator />

          {/* Connection Status Display */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">
                Connection Status
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Current Salesforce organization information
              </p>
            </div>
            
            {connectionResult === null ? (
              <div className="bg-muted/30 p-3 rounded-md">
                <p className="text-xs text-muted-foreground text-center">
                  Click "Test Connection" to verify your credentials
                </p>
              </div>
            ) : connectionResult.success && organizationInfo ? (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3 rounded-md space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">
                    Connection Successful
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Organization Name:</span>
                  <span className="text-xs font-medium">{organizationInfo.Name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Environment:</span>
                  <Badge variant="outline" className="text-xs">
                    {organizationInfo.IsSandbox ? 'Sandbox' : 'Production'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Organization ID:</span>
                  <span className="text-xs font-mono">{organizationInfo.Id}</span>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-xs font-medium text-red-700 dark:text-red-400">
                    Connection Failed
                  </span>
                </div>
                <p className="text-xs text-red-600 dark:text-red-400">
                  {connectionResult.error || 'Unknown error occurred'}
                </p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleReset}>
            Reset
          </Button>
          <Button 
            className="flex-1" 
            onClick={handleSaveChanges}
            disabled={!isConnectionValid}
          >
            Save Changes
          </Button>
        </div>

      </div>
    </ScrollArea>
  )
}
