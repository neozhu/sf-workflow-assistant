import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, Mail, Phone, Hash, Building, Server, MapPin, Briefcase, CheckCircle, PlusCircle, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useMemo, useState } from 'react'
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
  const [selectedUserLicenseId, setSelectedUserLicenseId] = useState<string | null>(USER_LICENSES[0]?.Id || null)
  const [creating, setCreating] = useState<boolean>(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState<string | null>(null)

  const workAreasText = (applicantInfo.workAreas || []).join(' ').toLowerCase()
  const locationText = (applicantInfo.location || '').toLowerCase()
  const divisionText = (applicantInfo.division || '').toLowerCase()

  const divisionTokens = useMemo(() => {
    const raw = divisionText.replace(/[^a-zA-Z\s]/g, ' ')
    const tokens = raw.split(/\s+/).filter(t => t.length >= 2)
    return tokens
  }, [divisionText])

  const recommendedProfiles = useMemo(() => {
    const scoreForProfile = (name: string): number => {
      const n = name.toLowerCase()
      let score = 0
      if (workAreasText.includes('service') && n.includes('service')) score += 5
      if (workAreasText.includes('mdg') && n.includes('mdg')) score += 5
      if (workAreasText.includes('sales') && (n.includes('sales') || n.includes('standard'))) score += 4
      if (workAreasText.includes('manager') && n.includes('manager')) score += 4
      if (workAreasText.includes('keyuser') && n.includes('keyuser')) score += 3
      if (workAreasText.includes('read') && n.includes('read only')) score += 3
      if (workAreasText.includes('vp') && n.includes('vp')) score += 2
      if (workAreasText.includes('restricted') && n.includes('restricted')) score += 2
      // consider division tokens in profile name
      for (const tk of divisionTokens) {
        if (tk && n.includes(tk)) score += 2
      }
      return score
    }
    const withScores = PROFILES.map(p => ({ ...p, _score: scoreForProfile(p.Name) }))
    withScores.sort((a, b) => b._score - a._score || a.Name.localeCompare(b.Name))
    const top = withScores.filter(x => x._score > 0).slice(0, 8)
    const rest = withScores.filter(x => x._score === 0)
    return { top, rest }
  }, [workAreasText, divisionTokens])

  const recommendedRoles = useMemo(() => {
    const scoreForRole = (name: string): number => {
      const n = name.toLowerCase()
      let score = 0
      if (/(apac|asia|china)/.test(locationText) && /(apac|asia|china)/.test(n)) score += 6
      if (/(emea|europe)/.test(locationText) && /(emea)/.test(n)) score += 6
      if (/(north\s*america|usa|canada)/.test(locationText) && /(america north|north america)/.test(n)) score += 6
      if (/(south\s*america|latam|brazil|argentina)/.test(locationText) && /(america south|south america)/.test(n)) score += 6
      if (/global/.test(locationText) && /global/.test(n)) score += 5
      if (/manager/.test(workAreasText) && /manager/.test(n)) score += 2
      if (!/manager/.test(workAreasText) && /user/.test(n)) score += 1
      // consider division tokens in role name
      for (const tk of divisionTokens) {
        if (tk && n.includes(tk)) score += 2
      }
      return score
    }
    const withScores = USER_ROLES.map(r => ({ ...r, _score: scoreForRole(r.Name) }))
    withScores.sort((a, b) => b._score - a._score || a.Name.localeCompare(b.Name))
    const top = withScores.filter(x => x._score > 0).slice(0, 8)
    const rest = withScores.filter(x => x._score === 0)
    return { top, rest }
  }, [locationText, workAreasText, divisionTokens])

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
            <div className="text-xs text-muted-foreground">Select a Profile and optionally a User Role. Recommendations are based on Work Scopes and Location.</div>

            {/* Profile selection (required) */}
            <div className="space-y-2">
              <div className="text-xs font-medium">Profile <span className="text-destructive">*</span></div>
              {recommendedProfiles.top.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {recommendedProfiles.top.map(p => (
                    <Badge
                      key={p.Id}
                      onClick={() => setSelectedProfileId(p.Id)}
                      className={`cursor-pointer ${selectedProfileId === p.Id ? 'bg-primary text-primary-foreground' : ''}`}
                    >
                      {p.Name}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {recommendedProfiles.rest.map(p => (
                  <Badge
                    key={p.Id}
                    variant="secondary"
                    onClick={() => setSelectedProfileId(p.Id)}
                    className={`cursor-pointer ${selectedProfileId === p.Id ? 'ring-2 ring-primary' : ''}`}
                  >
                    {p.Name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Business Line selection (required) */}
            <div className="space-y-2">
              <div className="text-xs font-medium">Business Line <span className="text-destructive">*</span></div>
              <div className="flex flex-wrap gap-2">
                {BUSINESS_LINES.map((b) => (
                  <Badge
                    key={b}
                    onClick={() => setSelectedBusinessLine(b)}
                    className={`cursor-pointer ${selectedBusinessLine === b ? 'bg-primary text-primary-foreground' : ''}`}
                  >
                    {b}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Role selection (required) */}
            <div className="space-y-2">
              <div className="text-xs font-medium">User Role <span className="text-destructive">*</span></div>
              {recommendedRoles.top.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {recommendedRoles.top.map(r => (
                    <Badge
                      key={r.Id}
                      onClick={() => setSelectedRoleId(r.Id)}
                      className={`cursor-pointer ${selectedRoleId === r.Id ? 'bg-primary text-primary-foreground' : ''}`}
                    >
                      {r.Name}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {recommendedRoles.rest.map(r => (
                  <Badge
                    key={r.Id}
                    variant="secondary"
                    onClick={() => setSelectedRoleId(r.Id)}
                    className={`cursor-pointer ${selectedRoleId === r.Id ? 'ring-2 ring-primary' : ''}`}
                  >
                    {r.Name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* User License selection (required) */}
            <div className="space-y-2">
              <div className="text-xs font-medium">User License <span className="text-destructive">*</span></div>
              <div className="flex flex-wrap gap-2">
                {USER_LICENSES.map((l) => (
                  <Badge
                    key={l.Id}
                    onClick={() => setSelectedUserLicenseId(l.Id)}
                    className={`cursor-pointer ${selectedUserLicenseId === l.Id ? 'bg-primary text-primary-foreground' : ''}`}
                  >
                    {l.Name}
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
