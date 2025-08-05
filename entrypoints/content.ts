// Types for applicant information
interface ApplicantInfo {
  name: string;
  shortname: string;
  email: string;
  phone: string;
  isUserApplicant: boolean;
}

// Function to extract applicant information from the workflow page
function extractApplicantInfo(): ApplicantInfo | null {
  try {
    const subscriberDataDiv = document.querySelector('div[name="SubscriberData"]');
    if (!subscriberDataDiv) {
      console.log('SubscriberData div not found');
      return null;
    }

    // Extract User = Applicant status
    const isUserApplicantRadio = subscriberDataDiv.querySelector('input[name="MainData.InitIsUser"][value="1"]') as HTMLInputElement;
    const isUserApplicant = isUserApplicantRadio?.checked || false;

    // Extract name from the display name link
    const nameLink = subscriberDataDiv.querySelector('a[href*="profile?email"]');
    const name = nameLink?.textContent?.trim() || '';

    // Extract shortname
    const shortnameLink = subscriberDataDiv.querySelector('label[for="Subscriber_User_ShortName"]')?.parentElement?.querySelector('a');
    const shortname = shortnameLink?.textContent?.trim() || '';

    // Extract email
    const emailLink = subscriberDataDiv.querySelector('a[href^="mailto:"]');
    const email = emailLink?.textContent?.trim() || '';

    // Extract phone
    const phoneElements = subscriberDataDiv.querySelectorAll('a[href*="profile?email"]');
    let phone = '';
    for (const element of phoneElements) {
      const text = element.textContent?.trim() || '';
      if (text.includes('+') || text.match(/\d{3}/)) {
        phone = text;
        break;
      }
    }

    const applicantInfo: ApplicantInfo = {
      name,
      shortname,
      email,
      phone,
      isUserApplicant
    };

    console.log('Extracted applicant info:', applicantInfo);
    return applicantInfo;
  } catch (error) {
    console.error('Error extracting applicant info:', error);
    return null;
  }
}

// Function to send applicant info to sidepanel
function sendApplicantInfoToSidepanel(applicantInfo: ApplicantInfo) {
  browser.runtime.sendMessage({
    type: 'WORKFLOW_APPLICANT_INFO',
    data: applicantInfo
  }).catch(error => {
    console.error('Error sending message to background:', error);
  });
}

// Function to check if current page is a workflow page and extract info
function checkAndExtractWorkflowInfo() {
  const currentUrl = window.location.href;
  const isWorkflowPage = currentUrl.includes('workflow.voith.com/wfManagementsite/Viewer');
  
  if (isWorkflowPage) {
    console.log('Workflow page detected:', currentUrl);
    
    // Wait for the page content to load
    const observer = new MutationObserver((mutations, obs) => {
      const subscriberDataDiv = document.querySelector('div[name="SubscriberData"]');
      if (subscriberDataDiv) {
        obs.disconnect();
        
        // Extract applicant info
        const applicantInfo = extractApplicantInfo();
        if (applicantInfo && applicantInfo.shortname) {
          sendApplicantInfoToSidepanel(applicantInfo);
        }
      }
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also try immediate extraction in case content is already loaded
    setTimeout(() => {
      const applicantInfo = extractApplicantInfo();
      if (applicantInfo && applicantInfo.shortname) {
        sendApplicantInfoToSidepanel(applicantInfo);
      }
    }, 1000);
  }
}

export default defineContentScript({
  matches: ['*://workflow.voith.com/*'],
  main() {
    console.log('Workflow Assistant content script loaded');
    
    // Check on initial load
    checkAndExtractWorkflowInfo();
    
    // Also check on URL changes (for SPAs)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        setTimeout(() => checkAndExtractWorkflowInfo(), 500);
      }
    }).observe(document, { subtree: true, childList: true });
  },
});
