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
import { Search, AlertCircle, Loader2 } from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'
import { searchSalesforceUsers, loadSalesforceConfig, UserInfo } from '@/lib/salesforce'
import { ApplicantInfo } from './ApplicantInfo'
import { UserCard } from './UserCard'

// Types for applicant information
interface ApplicantInfoData {
  name: string;
  shortname: string;
  email: string;
  phone: string;
  isUserApplicant: boolean;
  division: string;
  system: string;
  location: string;
  businessArea: string;
  workAreas: string[];
  dateLimit: string;
  operatingUnit: string;
}

export function HomeTab() {
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<UserInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [applicantInfo, setApplicantInfo] = useState<ApplicantInfoData | null>(null)

  // Handle search with specific term
  const handleSearchWithTerm = useCallback(async (term: string) => {
    if (!term.trim()) {
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
      const result = await searchSalesforceUsers(config, term.trim())
      
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
  }, [])

  // Listen for messages from background script
  useEffect(() => {
    const messageListener = (message: any) => {
      console.log('HomeTab received message:', message);
      
      if (message.type === 'WORKFLOW_APPLICANT_INFO' && message.data) {
        const info = message.data as ApplicantInfoData;
        setApplicantInfo(info);
        
        // Auto-fill search term with shortname and trigger search
        if (info.shortname) {
          setSearchTerm(info.shortname);
          // Trigger search automatically
          setTimeout(() => {
            handleSearchWithTerm(info.shortname);
          }, 100);
        }
      }
    };

    // Add message listener
    browser.runtime.onMessage.addListener(messageListener);

    return () => {
      // Remove message listener on cleanup
      browser.runtime.onMessage.removeListener(messageListener);
    };
  }, [handleSearchWithTerm]);

  // Handle search functionality
  const handleSearch = useCallback(async () => {
    return handleSearchWithTerm(searchTerm);
  }, [searchTerm, handleSearchWithTerm])

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
      <div className="space-y-2 px-2 py-2">
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
                <UserCard 
                  key={user.user_id} 
                  user={user}
                />
              ))
            )}
          </div>
        )}

        {/* Applicant Information Section */}
        {applicantInfo && (
          <ApplicantInfo 
            applicantInfo={applicantInfo} 
            canCreate={hasSearched && users.length === 0}
            onCreated={async () => {
              // Re-run search by email after creation
              if (applicantInfo.email) {
                setSearchTerm(applicantInfo.email)
                await handleSearchWithTerm(applicantInfo.email)
              }
            }}
          />
        )}

        {/* Welcome message when no search performed */}
        {!hasSearched && users.length === 0 && !isLoading && !applicantInfo && (
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
