interface GetSalesforceSessionMessage {
  type: 'GET_SALESFORCE_SESSION'
  instanceUrl?: string
}

interface SalesforceSessionResponse {
  success: boolean
  instanceUrl?: string
  accessToken?: string
  sourceDomain?: string
  error?: string
}

interface SalesforceCookieCandidate {
  cookieUrl: string
  instanceUrl: string
}

function normalizeSalesforceUrl(rawUrl?: string): string | null {
  if (!rawUrl?.trim()) return null

  try {
    const url = new URL(rawUrl.includes('://') ? rawUrl : `https://${rawUrl}`)
    return url.origin
  } catch {
    return null
  }
}

function getSalesforceCookieCandidates(instanceUrl?: string): SalesforceCookieCandidate[] {
  const normalizedUrl = normalizeSalesforceUrl(instanceUrl)
  if (!normalizedUrl) return []

  const candidates: SalesforceCookieCandidate[] = []
  const url = new URL(normalizedUrl)
  const host = url.hostname
  const mySalesforceUrl = host.endsWith('.lightning.force.com')
    ? `${url.protocol}//${host.replace('.lightning.force.com', '.my.salesforce.com')}`
    : normalizedUrl

  if (host.endsWith('.lightning.force.com')) {
    candidates.push({ cookieUrl: normalizedUrl, instanceUrl: mySalesforceUrl })
    candidates.push({ cookieUrl: mySalesforceUrl, instanceUrl: mySalesforceUrl })
  } else if (host.endsWith('.my.salesforce.com')) {
    candidates.push({ cookieUrl: normalizedUrl, instanceUrl: normalizedUrl })
    candidates.push({
      cookieUrl: `${url.protocol}//${host.replace('.my.salesforce.com', '.lightning.force.com')}`,
      instanceUrl: normalizedUrl
    })
  } else {
    candidates.push({ cookieUrl: normalizedUrl, instanceUrl: normalizedUrl })
  }

  return candidates
}

async function getSalesforceSessionFromCookies(instanceUrl?: string): Promise<SalesforceSessionResponse> {
  const candidates = getSalesforceCookieCandidates(instanceUrl)
  if (candidates.length === 0) {
    return {
      success: false,
      error: 'Please provide a valid Salesforce Instance URL first'
    }
  }

  for (const candidate of candidates) {
    const cookie = await browser.cookies.get({
      url: candidate.cookieUrl,
      name: 'sid'
    })

    if (cookie?.value) {
      return {
        success: true,
        instanceUrl: candidate.instanceUrl,
        accessToken: cookie.value,
        sourceDomain: cookie.domain
      }
    }
  }

  return {
    success: false,
    error: 'No Salesforce session cookie found. Open Salesforce in this browser and sign in, then try again.'
  }
}

export default defineBackground(() => {
  console.log('Background script loaded!', { id: browser.runtime.id });

  // Handle extension icon click to open sidepanel
  browser.action.onClicked.addListener(async (tab) => {
    if (tab.id) {
      await browser.sidePanel.open({ tabId: tab.id });
    }
  });

  // Set up sidepanel options on install
  browser.runtime.onInstalled.addListener(async () => {
    await browser.sidePanel.setOptions({
      path: 'sidepanel.html',
      enabled: true
    });
    
    await browser.sidePanel.setPanelBehavior({
      openPanelOnActionClick: true
    });

    // Create context menu
    browser.contextMenus.create({
      id: 'extract-workflow-info',
      title: 'Extract Workflow Information',
      contexts: ['page'],
      documentUrlPatterns: ['*://workflow.voith.com/*']
    });
  });

  // Handle context menu clicks
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'extract-workflow-info' && tab?.id) {
      console.log('Context menu clicked: Extract Workflow Information');
      
      try {
        // First, ensure sidepanel is open
        await browser.sidePanel.open({ tabId: tab.id });
        console.log('Sidepanel opened');
        
        // Wait a moment for sidepanel to fully load
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Send message to content script to extract workflow info
        await browser.tabs.sendMessage(tab.id, {
          type: 'EXTRACT_WORKFLOW_INFO'
        });
      } catch (error) {
        console.error('Error in context menu handler:', error);
      }
    }
  });

  // Handle messages from content script
  browser.runtime.onMessage.addListener((message: GetSalesforceSessionMessage | any, sender, sendResponse) => {
    console.log('Background received message:', message);

    if (message.type === 'GET_SALESFORCE_SESSION') {
      getSalesforceSessionFromCookies(message.instanceUrl)
        .then(sendResponse)
        .catch((error) => {
          console.error('Failed to get Salesforce session from cookies:', error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to read Salesforce browser session'
          } satisfies SalesforceSessionResponse);
        });

      return true;
    }

    if (message.type === 'WORKFLOW_APPLICANT_INFO') {
      // Forward the message to the sidepanel
      browser.runtime.sendMessage({
        type: 'WORKFLOW_APPLICANT_INFO',
        data: message.data,
        tabId: sender.tab?.id
      }).catch(error => {
        console.error('Error forwarding message to sidepanel:', error);
      });
    }

    return true; // Indicates we will send a response asynchronously
  });
});
