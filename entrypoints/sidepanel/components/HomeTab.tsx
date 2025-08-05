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
import { Search, UserCheck, UserX } from 'lucide-react'

export function HomeTab() {
  // Mock user data
  const mockUsers = [
    {
      id: 1,
      userName: 'John Smith',
      email: 'john.smith@company.com',
      status: 'active',
      division: 'Sales',
      profileName: 'System Administrator',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
    },
    {
      id: 2,
      userName: 'Jane Doe',
      email: 'jane.doe@company.com',
      status: 'inactive',
      division: 'Marketing',
      profileName: 'Standard User',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane'
    },
    {
      id: 3,
      userName: 'Mike Johnson',
      email: 'mike.johnson@company.com',
      status: 'active',
      division: 'IT',
      profileName: 'System Administrator',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike'
    }
  ]

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        {/* Search Area */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Enter short name or email to search"
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Search Results Area */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Search Results ({mockUsers.length})
          </h3>
          
          {mockUsers.map((user) => (
            <Card key={user.id} className="p-3">
              <div className="flex items-center gap-3">
                {/* User Avatar */}
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar} alt={user.userName} />
                  <AvatarFallback>
                    {user.userName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                {/* User Information */}
                <div className="flex-1 min-w-0">
                  <div className="space-y-1">
                    {/* First row: Username and Email */}
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {user.userName}
                      </span>
                      <Badge 
                        variant={user.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {user.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </div>
                    
                    {/* Second row: Division and Profile */}
                    <div className="text-xs text-muted-foreground truncate">
                      Division: {user.division}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      Profile: {user.profileName}
                    </div>
                  </div>
                </div>
                
                {/* Action Button */}
                <div className="flex-shrink-0">
                  <Button
                    variant={user.status === 'active' ? 'destructive' : 'default'}
                    size="sm"
                    className="text-xs"
                  >
                    {user.status === 'active' ? (
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
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}
