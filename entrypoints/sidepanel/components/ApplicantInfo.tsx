import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, Mail, Phone, Hash, Building, Server, MapPin, Briefcase, CheckCircle, PlusCircle, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { PROFILES, USER_ROLES, BUSINESS_LINES, USER_LICENSES } from '@/lib/salesforce-data'
import { createSalesforceUser, loadSalesforceConfig } from '@/lib/salesforce'

interface ApplicantInfo {
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
}

interface ApplicantInfoProps {
  applicantInfo: ApplicantInfo;
  canCreate?: boolean;
  onCreated?: (userId: string) => void;
}

export function ApplicantInfo({ applicantInfo, canCreate = false, onCreated }: ApplicantInfoProps) {
  const [expanded, setExpanded] = useState<boolean>(canCreate)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [selectedBusinessLine, setSelectedBusinessLine] = useState<string | null>(null)
  const [selectedUserLicenseId, setSelectedUserLicenseId] = useState<string | null>(null)
  const [creating, setCreating] = useState<boolean>(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState<string | null>(null)

  const handleCreate = async () => {
    try {
      setCreating(true)
      setCreateError(null)
      setCreateSuccess(null)
      const { config } = loadSalesforceConfig()
      if (!config) {
        setCreateError('Salesforce configuration not found. Please configure connection first.')
        return
      }
      if (!selectedProfileId) {
        setCreateError('Please select a Profile.')
        return
      }
      if (!selectedBusinessLine) {
        setCreateError('Please select a Business Line.')
        return
      }
      if (!selectedRoleId) {
        setCreateError('Please select a User Role.')
        return
      }
      if (!selectedUserLicenseId) {
        setCreateError('Please select a User License.')
        return
      }
      const name = applicantInfo.name?.trim() || applicantInfo.email?.split('@')[0] || 'User'
      const res = await createSalesforceUser(config, {
        name,
        email: applicantInfo.email,
        alias: applicantInfo.shortname,
        phone: applicantInfo.phone,
        profileId: selectedProfileId,
        userRoleId: selectedRoleId,
        userLicenseId: selectedUserLicenseId || undefined,
        division: applicantInfo.division,
        businessLine: selectedBusinessLine,
        // license selection will be passed via UserLicenseId override in payload
      })
      if (!res.success) {
        setCreateError(res.error || 'Failed to create user')
        return
      }
      setCreateSuccess(`Created user: ${res.userId}`)
      if (onCreated && res.userId) onCreated(res.userId)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Workflow Applicant Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Name */}
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium text-muted-foreground text-xs">Name</div>
            <div className="truncate">{applicantInfo.name || 'N/A'}</div>
          </div>
        </div>

        {/* Shortname */}
        <div className="flex items-center gap-2 text-sm">
          <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium text-muted-foreground text-xs">Shortname</div>
            <div className="truncate">{applicantInfo.shortname || 'N/A'}</div>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium text-muted-foreground text-xs">Email</div>
            <div className="truncate">{applicantInfo.email || 'N/A'}</div>
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium text-muted-foreground text-xs">Phone</div>
            <div className="truncate">{applicantInfo.phone || 'N/A'}</div>
          </div>
        </div>

        {/* Division */}
        <div className="flex items-center gap-2 text-sm">
          <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium text-muted-foreground text-xs">Division</div>
            <div className="truncate">{applicantInfo.division || 'N/A'}</div>
          </div>
        </div>

        {/* System */}
        <div className="flex items-center gap-2 text-sm">
          <Server className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium text-muted-foreground text-xs">System</div>
            <div className="truncate">{applicantInfo.system || 'N/A'}</div>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium text-muted-foreground text-xs">Location</div>
            <div className="truncate">{applicantInfo.location || 'N/A'}</div>
          </div>
        </div>

        {/* Business Area */}
        <div className="flex items-center gap-2 text-sm">
          <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium text-muted-foreground text-xs">Business Area</div>
            <div className="truncate">{applicantInfo.businessArea || 'N/A'}</div>
          </div>
        </div>

        {/* Work Areas */}
        <div className="flex items-start gap-2 text-sm">
          <CheckCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium text-muted-foreground text-xs">Work Scopes</div>
            <div className="space-y-1">
              {applicantInfo.workAreas && applicantInfo.workAreas.length > 0 ? (
                applicantInfo.workAreas.map((workArea, index) => (
                  <div key={index} className="text-xs bg-muted px-2 py-1 rounded">
                    {workArea}
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground">N/A</div>
              )}
            </div>
          </div>
        </div>

        {/* Create New User Section */}
        {canCreate && (
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setExpanded(v => !v)} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              {expanded ? 'Hide Create User' : 'Create New Salesforce User'}
              {expanded ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        )}

        {canCreate && expanded && (
          <div className="mt-3 space-y-3 border-t pt-3">
            <div className="text-xs text-muted-foreground">Select User License, User Role, Profile, and Business Line. All fields are required.</div>

            {/* User License selection (required) */}
            <div className="space-y-2 mt-3">
              <div className="text-xs font-medium">User License <span className="text-destructive">*</span></div>
              <div className="text-[11px] text-muted-foreground mt-1">Choose a user license (e.g., Salesforce / Chatter Free) to determine features and access scope.</div>
              <div className="flex flex-wrap gap-2">
                {USER_LICENSES.map((l) => (
                  <Badge
                    key={l.Id}
                    onClick={() => setSelectedUserLicenseId(l.Id)}
                    variant={selectedUserLicenseId === l.Id ? 'default' : 'secondary'}
                    className={`cursor-pointer ${selectedUserLicenseId === l.Id ? 'ring-2 ring-primary' : ''}`}
                  >
                    {l.Name}
                  </Badge>
                ))}
              </div>
              
            </div>

            {/* User Role selection (required) */}
            <div className="space-y-2 mt-3">
              <div className="text-xs font-medium">User Role <span className="text-destructive">*</span></div>
              <div className="text-[11px] text-muted-foreground">Defines the user's position in the Salesforce role hierarchy and affects record visibility via org-wide defaults, the role hierarchy, and sharing rules. Choose exactly one role.</div>
              <div className="text-[11px] text-muted-foreground">Groups (DV / VH / VP / VT) are for easier scanning.</div>
              {(() => {
                const roles = [...USER_ROLES].sort((a, b) => a.Name.localeCompare(b.Name))
                const groups = {
                  'DV -': [] as typeof USER_ROLES,
                  'VH -': [] as typeof USER_ROLES,
                  'VP -': [] as typeof USER_ROLES,
                  'VT -': [] as typeof USER_ROLES,
                  Others: [] as typeof USER_ROLES,
                }
                for (const r of roles) {
                  if (r.Name.startsWith('DV -')) groups['DV -'].push(r)
                  else if (r.Name.startsWith('VH -')) groups['VH -'].push(r)
                  else if (r.Name.startsWith('VP -')) groups['VP -'].push(r)
                  else if (r.Name.startsWith('VT -')) groups['VT -'].push(r)
                  else groups.Others.push(r)
                }
                const order = ['DV -', 'VH -', 'VP -', 'VT -', 'Others'] as const
                return (
                  <div className="space-y-2">
                    {order.map((key) => (
                      groups[key].length > 0 ? (
                        <div key={key} className="space-y-1">
                          <div className="text-[11px] text-muted-foreground">{key}</div>
                          <div className="flex flex-wrap gap-2">
                            {groups[key].map((r) => (
                              <Badge
                                key={r.Id}
                                onClick={() => setSelectedRoleId(r.Id)}
                                variant={selectedRoleId === r.Id ? 'default' : 'secondary'}
                                className={`cursor-pointer ${selectedRoleId === r.Id ? 'ring-2 ring-primary' : ''}`}
                              >
                                {r.Name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : null
                    ))}
                    
                  </div>
                )
              })()}
            </div>

            {/* Profile selection (required) */}
            <div className="space-y-2 mt-3">
              <div className="text-xs font-medium">Profile <span className="text-destructive">*</span></div>
              <div className="text-[11px] text-muted-foreground mt-1">Profiles determine object/field access and baseline permissions.</div>
              <div className="flex flex-wrap gap-2">
                {[...PROFILES].sort((a, b) => a.Name.localeCompare(b.Name)).map(p => (
                  <Badge
                    key={p.Id}
                    onClick={() => setSelectedProfileId(p.Id)}
                    variant={selectedProfileId === p.Id ? 'default' : 'secondary'}
                    className={`cursor-pointer ${selectedProfileId === p.Id ? 'ring-2 ring-primary' : ''}`}
                  >
                    {p.Name}
                  </Badge>
                ))}
              </div>
              
            </div>

            {/* Business Line selection (required) */}
            <div className="space-y-2 mt-3">
              <div className="text-xs font-medium">Business Line <span className="text-destructive">*</span></div>
              <div className="text-[11px] text-muted-foreground mt-1">Sets custom field Business_Line__c. Choose the actual business line.</div>
              <div className="flex flex-wrap gap-2">
                {BUSINESS_LINES.map((b) => (
                  <Badge
                    key={b}
                    onClick={() => setSelectedBusinessLine(b)}
                    variant={selectedBusinessLine === b ? 'default' : 'secondary'}
                    className={`cursor-pointer ${selectedBusinessLine === b ? 'ring-2 ring-primary' : ''}`}
                  >
                    {b}
                  </Badge>
                ))}
              </div>
             
            </div>

            {/* Create action */}
            {createError && (
              <div className="flex items-center gap-2 text-xs text-destructive"><AlertCircle className="h-4 w-4" />{createError}</div>
            )}
            {createSuccess && (
              <div className="flex items-center gap-2 text-xs text-green-600"><CheckCircle2 className="h-4 w-4" />{createSuccess}</div>
            )}
            <div>
              <Button size="sm" onClick={handleCreate} disabled={creating || !selectedProfileId || !selectedBusinessLine || !selectedRoleId}>
                {creating ? 'Creating...' : 'Create Salesforce User'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
