import { storage } from '#imports'
import { useEffect, useState } from 'react'

type Theme = 'system' | 'light' | 'dark'

interface OrganizationInfo {
  Id: string
  Name: string
  IsSandbox: boolean
}

interface UserInfo {
  user_id: string
  name: string
  email: string
  picture: string
}

interface AppearanceSettings {
  theme: Theme
}

interface SystemSettings {
  notifications: boolean
  syncInterval: number
  instanceUrl?: string
  accessToken?: string
  organization?: OrganizationInfo
  user?: UserInfo
}

interface UISettings {
  activeTab: string
}

// Define storage items
const appearanceSettings = storage.defineItem<AppearanceSettings>('local:appearanceSettings', {
  fallback: {
    theme: 'system'
  }
})

const systemSettings = storage.defineItem<SystemSettings>('local:systemSettings', {
  fallback: {
    notifications: true,
    syncInterval: 15,
    organization: undefined,
    user: undefined,
    instanceUrl: undefined,
    accessToken: undefined
  }
})

const uiSettings = storage.defineItem<UISettings>('local:uiSettings', {
  fallback: {
    activeTab: 'home'
  }
})

export function useSettings() {
  const [appearance, setAppearance] = useState<AppearanceSettings>({ theme: 'system' })
  const [system, setSystem] = useState<SystemSettings>({ 
    notifications: true, 
    syncInterval: 15,
    organization: undefined,
    user: undefined,
    instanceUrl: undefined,
    accessToken: undefined
  })
  const [ui, setUI] = useState<UISettings>({ activeTab: 'home' })
  const [loading, setLoading] = useState(true)

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [appearanceData, systemData, uiData] = await Promise.all([
          appearanceSettings.getValue(),
          systemSettings.getValue(),
          uiSettings.getValue()
        ])
        
        console.log('Loaded settings from storage:', {
          appearanceData,
          systemData,
          uiData
        })
        
        setAppearance(appearanceData)
        // Ensure system data includes any previously saved organization info
        setSystem(systemData)
        setUI(uiData)
      } catch (error) {
        console.error('Failed to load settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  // Update appearance settings
  const updateAppearance = async (updates: Partial<AppearanceSettings>) => {
    const newSettings = { ...appearance, ...updates }
    setAppearance(newSettings)
    try {
      await appearanceSettings.setValue(newSettings)
    } catch (error) {
      console.error('Failed to save appearance settings:', error)
    }
  }

  // Update system settings
  const updateSystem = async (updates: Partial<SystemSettings>) => {
    const newSettings = { ...system, ...updates }
    setSystem(newSettings)
    try {
      await systemSettings.setValue(newSettings)
    } catch (error) {
      console.error('Failed to save system settings:', error)
    }
  }

  // Update UI settings
  const updateUI = async (updates: Partial<UISettings>) => {
    const newSettings = { ...ui, ...updates }
    setUI(newSettings)
    try {
      await uiSettings.setValue(newSettings)
    } catch (error) {
      console.error('Failed to save UI settings:', error)
    }
  }

  // Reset all settings
  const resetSettings = async () => {
    try {
      await Promise.all([
        appearanceSettings.removeValue(),
        systemSettings.removeValue(),
        uiSettings.removeValue()
      ])
      
      // Reset to default values
      const defaultAppearance = { theme: 'system' as Theme }
      const defaultSystem = { 
        notifications: true, 
        syncInterval: 15,
        organization: undefined,
        user: undefined,
        instanceUrl: undefined,
        accessToken: undefined
      }
      const defaultUI = { activeTab: 'home' }
      
      setAppearance(defaultAppearance)
      setSystem(defaultSystem)
      setUI(defaultUI)
    } catch (error) {
      console.error('Failed to reset settings:', error)
    }
  }

  // Update organization info
  const updateOrganization = async (organization: OrganizationInfo | null) => {
    console.log('updateOrganization called with:', organization)
    setSystem(prevSystem => {
      const newSettings = { ...prevSystem, organization: organization || undefined }
      console.log('Setting new system state:', newSettings)
      // Save to storage async
      systemSettings.setValue(newSettings).catch(error => {
        console.error('Failed to save organization info:', error)
      })
      return newSettings
    })
    console.log('Organization state update initiated')
  }

  // Update user info
  const updateUser = async (user: UserInfo | null) => {
    setSystem(prevSystem => {
      const newSettings = { ...prevSystem, user: user || undefined }
      // Save to storage async
      systemSettings.setValue(newSettings).catch(error => {
        console.error('Failed to save user info:', error)
      })
      return newSettings
    })
  }

  return {
    appearance,
    system,
    ui,
    loading,
    updateAppearance,
    updateSystem,
    updateUI,
    updateOrganization,
    updateUser,
    resetSettings
  }
} 
