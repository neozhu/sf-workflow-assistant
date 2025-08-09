/**
 * Salesforce API utilities for connecting and querying data
 */

export interface SalesforceConfig {
  instanceUrl: string
  accessToken: string
}

export interface OrganizationInfo {
  Id: string
  Name: string
  IsSandbox: boolean
}

export interface UserInfo {
  user_id: string
  name: string
  email: string
  picture: string
  alias?: string
  division?: string
  profile_id?: string
  profile_name?: string
  is_active?: boolean
  last_modified_by?: string
}

export interface SalesforceConnectionResult {
  success: boolean
  organization?: OrganizationInfo
  user?: UserInfo
  error?: string
}

export interface CreateSalesforceUserInput {
  name: string
  email: string
  alias?: string
  phone?: string
  profileId: string
  userRoleId?: string
  userLicenseId?: string
  timeZoneSidKey?: string
  localeSidKey?: string
  emailEncodingKey?: string
  languageLocaleKey?: string
  division?: string
  businessLine?: string
}

export interface CreateSalesforceUserResult {
  success: boolean
  userId?: string
  error?: string
}

function generateAliasFromNameOrEmail(name: string, email: string, preferredAlias?: string): string {
  if (preferredAlias && preferredAlias.trim().length > 0) {
    return preferredAlias.trim().slice(0, 8)
  }

  const clean = (s: string) => s.replace(/[^a-zA-Z]/g, '')
  let alias = ''
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    alias = (clean(parts[0]).charAt(0) + clean(parts[parts.length - 1])).toLowerCase()
  } else if (parts.length === 1) {
    alias = clean(parts[0]).toLowerCase()
  }
  if (!alias || alias.length === 0) {
    alias = clean(email.split('@')[0]).toLowerCase()
  }
  if (!alias || alias.length === 0) {
    alias = 'user'
  }
  return alias.slice(0, 8)
}

function splitNameFromEmailFallback(name: string, email: string): { firstName?: string; lastName: string } {
  const clean = (s: string) => s.replace(/[^a-zA-Z]/g, ' ').trim()
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    const lastName = parts.pop() as string
    return { firstName: parts.join(' '), lastName }
  }
  // try parse from email: firstname.lastname@...
  const local = email.split('@')[0] || ''
  const emailParts = clean(local).split(/\s+|\./).filter(Boolean)
  if (emailParts.length >= 2) {
    return { firstName: emailParts[0], lastName: emailParts.slice(1).join(' ') }
  }
  if (parts.length === 1) {
    return { lastName: parts[0] }
  }
  return { lastName: 'User' }
}

async function resolveSalesforceUserLicenseId(config: SalesforceConfig, licenseName = 'Salesforce'): Promise<string | undefined> {
  try {
    const instanceUrl = config.instanceUrl.replace(/\/$/, '')
    const soql = encodeURIComponent(`SELECT Id, Name FROM UserLicense WHERE Name = '${licenseName}' LIMIT 1`)
    const apiUrl = `${instanceUrl}/services/data/v64.0/query/?q=${soql}`
    const res = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${config.accessToken}`, Accept: 'application/json' }
    })
    if (!res.ok) return undefined
    const data = await res.json()
    return data.records?.[0]?.Id
  } catch {
    return undefined
  }
}

/**
 * Create a Salesforce User
 */
export async function createSalesforceUser(
  config: SalesforceConfig,
  input: CreateSalesforceUserInput
): Promise<CreateSalesforceUserResult> {
  try {
    if (!config.instanceUrl || !config.accessToken) {
      return { success: false, error: 'Instance URL and Access Token are required' }
    }
    if (!input.email || !input.profileId || !input.name) {
      return { success: false, error: 'Name, Email and ProfileId are required' }
    }

    const instanceUrl = config.instanceUrl.replace(/\/$/, '')
    const { firstName, lastName } = splitNameFromEmailFallback(input.name, input.email)
    const alias = generateAliasFromNameOrEmail(input.name, input.email, input.alias)

    const payload: Record<string, unknown> = {
      Username: input.email,
      Email: input.email,
      FederationIdentifier: input.email,
      Alias: alias,
      LastName: lastName,
      ProfileId: input.profileId,
      TimeZoneSidKey: input.timeZoneSidKey || 'GMT',
      LocaleSidKey: input.localeSidKey || 'en_US',
      EmailEncodingKey: input.emailEncodingKey || 'UTF-8',
      LanguageLocaleKey: input.languageLocaleKey || 'en_US'
    }
    if (firstName) payload.FirstName = firstName
    if (input.userRoleId) payload.UserRoleId = input.userRoleId
    if (input.phone) payload.Phone = input.phone
    if (input.division) payload['Division__c'] = input.division
    if (input.businessLine) payload['Business_Line__c'] = input.businessLine

    // License selection: prefer explicit userLicenseId; otherwise default to Salesforce
    if (input.userLicenseId) {
      payload['UserLicenseId'] = input.userLicenseId
    } else {
      const licenseId = await resolveSalesforceUserLicenseId(config, 'Salesforce')
      if (licenseId) {
        payload['UserLicenseId'] = licenseId
      }
    }

    const apiUrl = `${instanceUrl}/services/data/v64.0/sobjects/User`
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      try {
        const err = await response.json()
        if (err && Array.isArray(err) && err[0]?.message) {
          errorMessage = err[0].message
        } else if (typeof err?.message === 'string') {
          errorMessage = err.message
        }
      } catch {}
      return { success: false, error: errorMessage }
    }

    const data = await response.json()
    return { success: true, userId: data.id }
  } catch (error) {
    console.error('Salesforce user creation failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}


/**
 * Test Salesforce connection and retrieve organization information
 */
export async function testSalesforceConnection(
  config: SalesforceConfig
): Promise<SalesforceConnectionResult> {
  try {
    // Validate input parameters
    if (!config.instanceUrl || !config.accessToken) {
      return {
        success: false,
        error: 'Instance URL and Access Token are required'
      }
    }

    // Clean up instance URL (remove trailing slash)
    const instanceUrl = config.instanceUrl.replace(/\/$/, '')
    
    // Prepare the SOQL query for organization
    const query = encodeURIComponent('SELECT Id, Name, IsSandbox FROM Organization')
    const apiUrl = `${instanceUrl}/services/data/v64.0/query/?q=${query}`

    // Make API request for organization
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      
      try {
        const errorData = await response.json()
        if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData[0]?.message) {
          errorMessage = errorData[0].message
        }
      } catch {
        // Use default error message if JSON parsing fails
      }

      return {
        success: false,
        error: errorMessage
      }
    }

    const data = await response.json()

    // Check if we got organization data
    if (!data.records || data.records.length === 0) {
      return {
        success: false,
        error: 'No organization data returned'
      }
    }

    const organization: OrganizationInfo = data.records[0]

    // Get current user information
    let user: UserInfo | undefined
    try {
      const userInfoUrl = `${instanceUrl}/services/oauth2/userinfo`
      const userResponse = await fetch(userInfoUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Accept': 'application/json'
        }
      })

      if (userResponse.ok) {
        const userData = await userResponse.json()
        user = {
          user_id: userData.user_id,
          name: userData.name,
          email: userData.email,
          picture: userData.picture
        }
      }
    } catch (userError) {
      console.warn('Failed to fetch user info:', userError)
      // Continue without user info
    }

    return {
      success: true,
      organization,
      user
    }

  } catch (error) {
    console.error('Salesforce connection test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Save Salesforce configuration, organization info and user info to local storage
 */
export function saveSalesforceConfig(
  config: SalesforceConfig, 
  organization?: OrganizationInfo,
  user?: UserInfo
): void {
  try {
    const dataToSave = {
      config,
      organization,
      user,
      lastUpdated: new Date().toISOString()
    }
    
    localStorage.setItem('salesforce-config', JSON.stringify(dataToSave))
  } catch (error) {
    console.error('Failed to save Salesforce config:', error)
    throw new Error('Failed to save configuration')
  }
}

/**
 * Load Salesforce configuration, organization info and user info from local storage
 */
export function loadSalesforceConfig(): {
  config?: SalesforceConfig
  organization?: OrganizationInfo
  user?: UserInfo
  lastUpdated?: string
} {
  try {
    const saved = localStorage.getItem('salesforce-config')
    if (saved) {
      return JSON.parse(saved)
    }
    return {}
  } catch (error) {
    console.error('Failed to load Salesforce config:', error)
    return {}
  }
}

/**
 * Clear Salesforce configuration from local storage
 */
export function clearSalesforceConfig(): void {
  try {
    localStorage.removeItem('salesforce-config')
  } catch (error) {
    console.error('Failed to clear Salesforce config:', error)
  }
}

/**
 * Search Salesforce users by alias, name, or email
 */
export async function searchSalesforceUsers(
  config: SalesforceConfig,
  searchTerm: string
): Promise<{
  success: boolean
  users?: UserInfo[]
  error?: string
}> {
  try {
    // Validate input parameters
    if (!config.instanceUrl || !config.accessToken) {
      return {
        success: false,
        error: 'Instance URL and Access Token are required'
      }
    }

    // Validate search term is not empty
    if (!searchTerm || searchTerm.trim().length === 0) {
      return {
        success: false,
        error: 'Search term cannot be empty'
      }
    }

    // Clean up instance URL and search term
    const instanceUrl = config.instanceUrl.replace(/\/$/, '')
    const cleanSearchTerm = searchTerm.trim()
    
    // Build SOQL query with fuzzy matching for alias, name, and email
    const soqlQuery = `
      SELECT 
        Id, 
        Name, 
        Email, 
        Alias, 
        Division__c, 
        ProfileId, 
        Profile.Name, 
        IsActive,
        MediumPhotoUrl,
        LastModifiedBy.Name
      FROM User 
      WHERE 
        (Alias LIKE '%${cleanSearchTerm}%' 
         OR Name LIKE '%${cleanSearchTerm}%' 
         OR Email LIKE '%${cleanSearchTerm}%')
        AND IsActive IN (true, false)
      ORDER BY Name
      LIMIT 50
    `.replace(/\s+/g, ' ').trim()

    const query = encodeURIComponent(soqlQuery)
    const apiUrl = `${instanceUrl}/services/data/v64.0/query/?q=${query}`

    // Make API request
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      
      try {
        const errorData = await response.json()
        if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData[0]?.message) {
          errorMessage = errorData[0].message
        }
      } catch {
        // Use default error message if JSON parsing fails
      }

      return {
        success: false,
        error: errorMessage
      }
    }

    const data = await response.json()

    // Transform Salesforce user records to UserInfo format
    const users: UserInfo[] = (data.records || []).map((record: any) => ({
      user_id: record.Id,
      name: record.Name,
      email: record.Email,
      picture: record.MediumPhotoUrl || '',
      alias: record.Alias,
      division: record.Division__c,
      profile_id: record.ProfileId,
      profile_name: record.Profile?.Name,
      is_active: record.IsActive,
      last_modified_by: record.LastModifiedBy?.Name
    }))

    return {
      success: true,
      users
    }

  } catch (error) {
    console.error('Salesforce user search failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Toggle user active status in Salesforce
 */
export async function toggleUserActiveStatus(
  config: SalesforceConfig,
  userId: string,
  isActive: boolean
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Validate input parameters
    if (!config.instanceUrl || !config.accessToken) {
      return {
        success: false,
        error: 'Instance URL and Access Token are required'
      }
    }

    if (!userId) {
      return {
        success: false,
        error: 'User ID is required'
      }
    }

    // Clean up instance URL
    const instanceUrl = config.instanceUrl.replace(/\/$/, '')
    
    // Prepare the update request
    const apiUrl = `${instanceUrl}/services/data/v64.0/sobjects/User/${userId}`
    
    const updateData = {
      IsActive: isActive
    }

    // Make API request to update user
    const response = await fetch(apiUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(updateData)
    })
    console.log('Toggle user active status response:', response)
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      
      try {
        const errorData = await response.json()
        if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData[0]?.message) {
          errorMessage = errorData[0].message
        }
      } catch {
        // Use default error message if JSON parsing fails
      }

      return {
        success: false,
        error: errorMessage
      }
    }

    return {
      success: true
    }

  } catch (error) {
    console.error('Toggle user active status failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}
