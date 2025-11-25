// Types for applicant information
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
  dateLimit: string | null;
  workAreas: string[];
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

    // Extract Details section information
    const divisionInput = document.querySelector('input[name="MainData.Division"]') as HTMLInputElement;
    const division = divisionInput?.value?.trim() || '';

    const systemInput = document.querySelector('input[name="MainData.System"]') as HTMLInputElement;
    const system = systemInput?.value?.trim() || '';

    const locationInput = document.querySelector('input[name="MainData.Location"]') as HTMLInputElement;
    const location = locationInput?.value?.trim() || '';

    const businessAreaInput = document.querySelector('input[name="MainData.Area"]') as HTMLInputElement;
    const businessArea = businessAreaInput?.value?.trim() || '';

    const dateLimitInput = document.querySelector('input[name="MainData.DateLimit"]') as HTMLInputElement;
    const dateLimit = dateLimitInput?.value?.trim() || null;

    // Extract Work Areas information
    const workAreas: string[] = [];
    const workAreaDiv = document.querySelector('#tblWorkAreas');
    if (workAreaDiv) {
      const descriptionLabels = workAreaDiv.querySelectorAll('label[for*="Description"] .blueLabel');
      descriptionLabels.forEach(label => {
        const description = label.textContent?.trim();
        if (description) {
          workAreas.push(description);
        }
      });
    }

    const applicantInfo: ApplicantInfo = {
      name,
      shortname,
      email,
      phone,
      isUserApplicant,
      division,
      system,
      location,
      businessArea,
      dateLimit,
      workAreas
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

// Function to manually extract workflow info when called
function manualExtractWorkflowInfo() {
  const currentUrl = window.location.href;
  const isWorkflowPage = currentUrl.includes('workflow.voith.com/wfManagementsite/Viewer');
  
  if (isWorkflowPage) {
    console.log('Manual workflow info extraction requested:', currentUrl);
    
    const applicantInfo = extractApplicantInfo();
    if (applicantInfo && applicantInfo.shortname) {
      sendApplicantInfoToSidepanel(applicantInfo);
    } else {
      console.log('No applicant info found or data incomplete');
    }
  } else {
    console.log('Not a workflow page, extraction skipped');
  }
}

export default defineContentScript({
  matches: ['*://workflow.voith.com/*'],
  main() {
    console.log('Workflow Assistant content script loaded');
    
    // Listen for messages from background script (context menu clicks)
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'EXTRACT_WORKFLOW_INFO') {
        console.log('Context menu extract workflow info triggered');
        manualExtractWorkflowInfo();
        sendResponse({ success: true });
      }
    });
  },
});
