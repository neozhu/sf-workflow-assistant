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

export interface SalesforceConnectionResult {
  success: boolean
  organization?: OrganizationInfo
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
    
    // Prepare the SOQL query
    const query = encodeURIComponent('SELECT Id, Name, IsSandbox FROM Organization')
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

    // Check if we got organization data
    if (!data.records || data.records.length === 0) {
      return {
        success: false,
        error: 'No organization data returned'
      }
    }

    const organization: OrganizationInfo = data.records[0]

    return {
      success: true,
      organization
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
 * Save Salesforce configuration and organization info to local storage
 */
export function saveSalesforceConfig(
  config: SalesforceConfig, 
  organization?: OrganizationInfo
): void {
  try {
    const dataToSave = {
      config,
      organization,
      lastUpdated: new Date().toISOString()
    }
    
    localStorage.setItem('salesforce-config', JSON.stringify(dataToSave))
  } catch (error) {
    console.error('Failed to save Salesforce config:', error)
    throw new Error('Failed to save configuration')
  }
}

/**
 * Load Salesforce configuration and organization info from local storage
 */
export function loadSalesforceConfig(): {
  config?: SalesforceConfig
  organization?: OrganizationInfo
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
