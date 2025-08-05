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
}

export interface SalesforceConnectionResult {
  success: boolean
  organization?: OrganizationInfo
  user?: UserInfo
  error?: string
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
        MediumPhotoUrl
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
      is_active: record.IsActive
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
