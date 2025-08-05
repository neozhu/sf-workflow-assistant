import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, UserCheck, UserX, AlertCircle, Loader2 } from 'lucide-react'
import { useState, useCallback } from 'react'
import { searchSalesforceUsers, loadSalesforceConfig, UserInfo } from '@/lib/salesforce'

export function HomeTab() {
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<UserInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  // Handle search functionality
  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      setError('Search term cannot be empty')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      // Load Salesforce configuration
      const { config } = loadSalesforceConfig()
      
      if (!config) {
        setError('Salesforce configuration not found. Please configure connection first.')
        setIsLoading(false)
        return
      }

      // Search users
      const result = await searchSalesforceUsers(config, searchTerm.trim())
      
      if (result.success && result.users) {
        setUsers(result.users)
        setHasSearched(true)
      } else {
        setError(result.error || 'Failed to search users')
        setUsers([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm])

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Handle input blur
  const handleBlur = () => {
    if (searchTerm.trim()) {
      handleSearch()
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        {/* Search Area */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Enter alias, name, or email to search"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={handleBlur}
                disabled={isLoading}
              />
            </div>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        {/* Search Results Area */}
        {(hasSearched || users.length > 0) && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Search Results ({users.length})
            </h3>
            
            {users.length === 0 && hasSearched && !isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No users found matching your search criteria.</p>
              </div>
            ) : (
              users.map((user) => (
                <Card key={user.user_id} className="p-3">
                  <div className="flex items-center gap-3">
                    {/* User Avatar */}
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.picture} alt={user.name} />
                      <AvatarFallback>
                        {user.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* User Information */}
                    <div className="flex-1 min-w-0">
                      <div className="space-y-1">
                        {/* First row: Username and Status */}
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {user.name} {user.alias && `(${user.alias})`}
                          </span>
                          <Badge 
                            variant={user.is_active ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {user.is_active ? 'active' : 'inactive'}
                          </Badge>
                        </div>
                        
                        {/* Second row: Email */}
                        <div className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </div>
                        
                        {/* Third row: Division */}
                        <div className="text-xs text-muted-foreground truncate">
                          Division: {user.division || 'N/A'}
                        </div>
                        
                        {/* Fourth row: Profile */}
                        <div className="text-xs text-muted-foreground truncate">
                          Profile: {user.profile_name || 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <div className="flex-shrink-0">
                      <Button
                        variant={user.is_active ? 'destructive' : 'default'}
                        size="sm"
                        className="text-xs"
                      >
                        {user.is_active ? (
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
              ))
            )}
          </div>
        )}

        {/* Welcome message when no search performed */}
        {!hasSearched && users.length === 0 && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Search Salesforce Users</h3>
            <p className="text-sm">
              Enter a user's alias, name, or email address to search for Salesforce users.
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
