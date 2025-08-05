import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSettings } from '@/hooks/use-settings'
import {
  Heart,
  House,
  Settings,
  User
} from 'lucide-react'
import { HomeTab } from './components/HomeTab'
import { ProfileTab } from './components/ProfileTab'
import { SettingsTab } from './components/SettingsTab'

function App() {
  const { appearance, system, ui, loading, updateAppearance, updateSystem, updateUI, updateOrganization, resetSettings } = useSettings()

  const handleTabChange = (value: string) => {
    updateUI({ activeTab: value })
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Heart className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            {system.organization ? (
              <>
                <h1 className="font-semibold text-lg">{system.organization.Name}</h1>
                <p className="text-sm text-muted-foreground">
                  {system.organization.IsSandbox ? 'Sandbox' : 'Production'} Environment
                </p>
              </>
            ) : (
              <>
                <h1 className="font-semibold text-lg">Salesforce Workflow Assistant</h1>
                <p className="text-sm text-muted-foreground">
                  Connect to your Salesforce organization
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={ui.activeTab} onValueChange={handleTabChange} className="h-full flex flex-col gap-0">
          <TabsList className="h-auto rounded-none border-b bg-transparent p-0 w-full">
            <TabsTrigger
              value="home"
              className="data-[state=active]:after:bg-primary relative rounded-none py-2 px-4 flex items-center gap-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-1"
            >
              <House className="h-4 w-4" />
              Home
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="data-[state=active]:after:bg-primary relative rounded-none py-2 px-4 flex items-center gap-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-1"
            >
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:after:bg-primary relative rounded-none py-2 px-4 flex items-center gap-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-1"
            >
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="flex-1 overflow-hidden">
            <HomeTab />
          </TabsContent>

          <TabsContent value="profile" className="flex-1 overflow-hidden">
            <ProfileTab />
          </TabsContent>

          <TabsContent value="settings" className="flex-1 overflow-hidden">
            <SettingsTab 
              appearance={appearance}
              system={system}
              updateAppearance={updateAppearance}
              updateSystem={updateSystem}
              updateOrganization={updateOrganization}
              resetSettings={resetSettings}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App
