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
  });

  // Handle messages from content script
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);

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
