import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UserCheck, UserX, Loader2, ExternalLink } from 'lucide-react'
import { UserInfo, toggleUserActiveStatus, loadSalesforceConfig } from '@/lib/salesforce'
import { useState } from 'react'

interface UserCardProps {
  user: UserInfo
  onActivateToggle?: (user: UserInfo) => void
  onStatusUpdate?: (updatedUser: UserInfo) => void
}

// Helper function to generate Salesforce user page URL
function getSalesforceUserUrl(instanceUrl: string, userId: string, isSandbox?: boolean): string {
  try {
    // Extract domain from instance URL (e.g., "https://voithhydro.my.salesforce.com" -> "voithhydro")
    const url = new URL(instanceUrl)
    const hostParts = url.hostname.split('.')
    const domain = hostParts[0] // Get the first part (voithhydro)
    
    // Determine base URL based on environment
    const baseUrl = isSandbox 
      ? `https://${domain}.sandbox.lightning.force.com`
      : `https://${domain}.lightning.force.com`
    
    // Construct Lightning URL
    return `${baseUrl}/lightning/setup/ManageUsers/page?address=%2F${userId}%3Fnoredirect%3D1%26isUserEntityOverride%3D1`
  } catch (error) {
    console.error('Failed to generate Salesforce user URL:', error)
    return '#'
  }
}

export function UserCard({ user, onActivateToggle, onStatusUpdate }: UserCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState(user)

  // Get Salesforce user URL
  const getSalesforceUrl = () => {
    const { config, organization } = loadSalesforceConfig()
    if (config?.instanceUrl) {
      return getSalesforceUserUrl(config.instanceUrl, currentUser.user_id, organization?.IsSandbox)
    }
    return '#'
  }

  const handleOpenSalesforceUser = () => {
    const url = getSalesforceUrl()
    if (url !== '#') {
      window.open(url, '_blank')
    }
  }

  const handleToggleActivation = async () => {
    console.log('handleToggleActivation called', { onActivateToggle: !!onActivateToggle })
    
    if (onActivateToggle) {
      console.log('Using custom onActivateToggle handler')
      onActivateToggle(currentUser)
      return
    }

    console.log('Using default implementation')
    // If no custom handler provided, use default implementation
    setIsLoading(true)
    setError(null)

    try {
      // Get Salesforce configuration
      const { config } = loadSalesforceConfig()
      
      if (!config) {
        throw new Error('Salesforce configuration not found. Please reconnect.')
      }

      // Toggle the user's active status
      const newActiveStatus = !currentUser.is_active
      console.log(`Toggling user ${currentUser.name} from ${currentUser.is_active} to ${newActiveStatus}`)
      
      const result = await toggleUserActiveStatus(config, currentUser.user_id, newActiveStatus)
      console.log('toggleUserActiveStatus result:', result)

      if (!result.success) {
        throw new Error(result.error || 'Failed to update user status')
      }

      // Update the local user state
      const updatedUser = {
        ...currentUser,
        is_active: newActiveStatus
      }
      
      setCurrentUser(updatedUser)
      
      // Notify parent component if callback provided
      if (onStatusUpdate) {
        onStatusUpdate(updatedUser)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Failed to toggle user activation:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-3">
      <div className="space-y-2">
        {/* First row: User identity and status */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={currentUser.picture} alt={currentUser.name} />
            <AvatarFallback>
              {currentUser.name.split(' ').map((n: string) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>

          <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span 
                  className="font-medium text-sm truncate text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                  onClick={handleOpenSalesforceUser}
                  title="Open in Salesforce"
                >
                  {currentUser.name} {currentUser.alias && `(${currentUser.alias})`}
                </span>
                <div title="Open in Salesforce">
                  <ExternalLink 
                    className="h-3 w-3 text-blue-600 hover:text-blue-800 cursor-pointer" 
                    onClick={handleOpenSalesforceUser}
                  />
                </div>
              </div>
              <Badge 
                variant={currentUser.is_active ? 'default' : 'secondary'}
                className="text-xs"
              >
                {currentUser.is_active ? 'active' : 'inactive'}
              </Badge>
          </div>
        </div>

        {/* Second row: User details and action */}
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            {/* Second row: Email */}
            <div className="text-xs text-muted-foreground truncate">
              {currentUser.email}
            </div>
            
            {/* Third row: Division */}
            <div className="text-xs text-muted-foreground truncate">
              Division: {currentUser.division || 'N/A'}
            </div>
            
            {/* Fourth row: Profile */}
            <div className="text-xs text-muted-foreground truncate">
              Profile: {currentUser.profile_name || 'N/A'}
            </div>
            
            {/* Fifth row: Last Modified By */}
            <div className="text-xs text-muted-foreground truncate">
              Last Modified By: {currentUser.last_modified_by || 'N/A'}
            </div>

            {/* Error message */}
            {error && (
              <div className="text-xs text-red-500 truncate">
                Error: {error}
              </div>
            )}
          </div>

          {/* Action Button */}
          <Button
            variant={currentUser.is_active ? 'destructive' : 'default'}
            size="sm"
            className="flex-shrink-0 text-xs cursor-pointer hover:scale-105 transition-transform duration-200"
            onClick={handleToggleActivation}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                {currentUser.is_active ? 'Deactivating...' : 'Activating...'}
              </>
            ) : currentUser.is_active ? (
              <>
                <UserX className="h-3 w-3 mr-1" />
                Deactivate
              </>
            ) : (
              <>
                <UserCheck className="h-3 w-3 mr-1" />
                Activate
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}
