import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { loadSalesforceConfig, type UserInfo } from '@/lib/salesforce'
import {
  Calendar,
  Mail,
  User
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface ProfileTabProps {
  user?: UserInfo | null
}

export function ProfileTab({ user: propUser }: ProfileTabProps) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  useEffect(() => {
    // Load user info from props or local storage
    if (propUser) {
      setUserInfo(propUser)
    } else {
      const saved = loadSalesforceConfig()
      if (saved.user) {
        setUserInfo(saved.user)
      }
    }
  }, [propUser])

  // Generate initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-8 p-4">
        {/* Profile Section */}
        <div className="text-center space-y-4">
          <Avatar className="h-20 w-20 mx-auto ring-2 ring-offset-2 ring-primary/10">
            <AvatarImage
              src={userInfo?.picture || ""}
              alt="User Avatar"
              className="object-cover object-center"
            />
            <AvatarFallback className="text-lg font-semibold">
              {userInfo ? getInitials(userInfo.name) : <User className="h-8 w-8" />}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">
              {userInfo?.name || 'No User Logged In'}
            </h2>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{userInfo?.email || 'No email available'}</span>
            </div>
            <Badge variant="secondary" className="font-medium">
              Salesforce User
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Account Details */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Account Details
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">
                User ID
              </span>
              <span className="text-sm font-medium font-mono">
                {userInfo?.user_id || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">
                Email
              </span>
              <span className="text-sm font-medium">
                {userInfo?.email || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">
                Status
              </span>
              <Badge
                variant="outline"
                className={userInfo ? "text-green-600 border-green-600" : "text-gray-600 border-gray-600"}
              >
                {userInfo ? 'Connected' : 'Not Connected'}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-3">
          {!userInfo && (
            <div className="text-center p-4 bg-muted/30 rounded-md">
              <p className="text-sm text-muted-foreground">
                Connect to Salesforce in Settings to view your profile
              </p>
            </div>
          )}
          <Button 
            className="w-full" 
            disabled={!userInfo}
            variant={userInfo ? "default" : "outline"}
          >
            Refresh Profile
          </Button>
        </div>
      </div>
    </ScrollArea>
  )
}
