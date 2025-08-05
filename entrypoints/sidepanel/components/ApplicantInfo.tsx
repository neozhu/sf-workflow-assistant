import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Mail, Phone, Hash, Building, Server, MapPin, Briefcase } from 'lucide-react'

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
}

interface ApplicantInfoProps {
  applicantInfo: ApplicantInfo;
}

export function ApplicantInfo({ applicantInfo }: ApplicantInfoProps) {
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
      </CardContent>
    </Card>
  )
}
