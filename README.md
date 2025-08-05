# Salesforce Workflow Assistant

A powerful browser extension that streamlines Salesforce user management through workflow application forms. One-click create or activate Salesforce accounts directly from workflow applications with intelligent form data extraction and user search capabilities.

## Features

- � **Workflow Integration** - Automatically extracts applicant information from workflow.voith.com forms
- 🔍 **Smart User Search** - Search existing Salesforce users by name, email, or shortname
- ⚡ **One-Click Operations** - Create new users or activate existing accounts instantly
- 🖥️ **Sidepanel Interface** - Convenient sidepanel for seamless workflow integration
- 🔐 **Secure Connection** - Direct Salesforce API integration with access token authentication
- � **User Management** - View user profiles, check account status, and manage permissions
- 🌙 **Theme Support** - Light/Dark theme with system preference detection
- � **Organization Info** - Display connected Salesforce org details (Production/Sandbox)
- 💾 **Persistent Settings** - Save connection settings and preferences locally
- 🔧 **TypeScript** - Full type safety and excellent developer experience

## Demo

![Extension Demo](public/demo.gif)

*Watch how the Salesforce Workflow Assistant works: extract applicant data from workflow forms and manage Salesforce users seamlessly.*

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Salesforce CLI (for access token generation)
- Active Salesforce organization access

### Salesforce CLI Setup

Before using the extension, you need to set up Salesforce CLI and obtain an access token:

1. **Install Salesforce CLI** (if not already installed)
   ```bash
   # Download from https://developer.salesforce.com/tools/salesforcecli
   # Or install via npm
   npm install -g @salesforce/cli
   ```

2. **Login to your Salesforce organization**
   ```bash
   sf org login web --alias PROD
   ```
   This will open a browser window for authentication. Login with your Salesforce credentials.

3. **Get organization details and access token**
   ```bash
   sf org display --target-org PROD
   ```

4. **Copy the required information:**
   - **Access Token** - Copy the entire access token string
   - **Instance URL** - Copy the instance URL (e.g., https://yourorg.my.salesforce.com)

5. **Configure the extension:**
   - Open the extension sidepanel
   - Go to Settings tab
   - Paste the Access Token and Instance URL
   - Click "Test Connection" to verify

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/neozhu/sf-workflow-assistant.git
   cd sf-workflow-assistant
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development**
   ```bash
   pnpm dev
   ```

4. **Load extension in browser**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked extension"
   - Select the `.output/chrome-mv3` folder

### Usage

1. **Setup Salesforce Connection**
   - Follow the Salesforce CLI setup steps above
   - Configure access token and instance URL in extension settings

2. **Navigate to Workflow Form**
   - Go to workflow.voith.com
   - Open any user application form

3. **Extract and Process**
   - Click the extension icon to open sidepanel
   - The extension automatically extracts applicant information
   - Search for existing users or create new accounts
   - Activate/deactivate users as needed

4. **Manage Users**
   - Use the search functionality to find Salesforce users
   - View user profiles and account status
   - Perform account management operations

## Project Structure

```
sf-workflow-assistant/
├── entrypoints/           # Extension entry points
│   ├── background.ts      # Background script for message handling
│   ├── content.ts         # Content script for workflow form extraction
│   └── sidepanel/         # Sidepanel UI components
│       ├── App.tsx        # Main React application
│       ├── index.html     # HTML template
│       ├── main.tsx       # React entry point
│       └── components/    # UI components
│           ├── HomeTab.tsx      # User search and management
│           ├── ProfileTab.tsx   # User profile display
│           ├── SettingsTab.tsx  # Salesforce connection settings
│           ├── ApplicantInfo.tsx # Workflow applicant information
│           └── UserCard.tsx     # User display component
├── components/            # Reusable UI components
│   └── ui/                # shadcn/ui components
├── lib/                   # Utility functions
│   ├── salesforce.ts      # Salesforce API integration
│   └── utils.ts           # Common utilities
├── hooks/                 # Custom React hooks
│   ├── use-settings.ts    # Settings management
│   ├── use-theme.ts       # Theme management
│   └── use-mobile.ts      # Mobile device detection
├── assets/                # Static assets and styles
├── public/                # Public assets (icons, demo)
├── app.config.ts          # Runtime configuration
├── components.json        # shadcn/ui configuration
├── wxt.config.ts          # WXT and extension configuration
└── package.json           # Dependencies and scripts
```

## Key Components

### Content Script (`entrypoints/content.ts`)
- Automatically detects workflow.voith.com pages
- Extracts applicant information from forms
- Sends data to sidepanel for processing

### Sidepanel Interface
- **Home Tab**: User search, applicant info display, account management
- **Profile Tab**: Current user profile and organization details  
- **Settings Tab**: Salesforce connection configuration

### Salesforce Integration (`lib/salesforce.ts`)
- Direct API connection using access tokens
- User search and management operations
- Organization information retrieval
- Error handling and validation

## Configuration

### Salesforce Connection Settings

The extension requires proper Salesforce configuration:

1. **Access Token**: Obtained via Salesforce CLI (`sf org display --target-org PROD`)
2. **Instance URL**: Your Salesforce org URL (e.g., `https://yourorg.my.salesforce.com`)
3. **API Version**: Uses Salesforce API v64.0 by default

### Extension Permissions

The extension requires the following permissions:
- `sidePanel`: For the sidepanel interface
- `storage`: For saving settings and configuration
- `contextMenus`: For right-click menu options
- Host permissions for:
  - `*.salesforce.com/*`
  - `*.force.com/*` 
  - `*.my.salesforce.com/*`
  - `*.lightning.force.com/*`
  - `workflow.voith.com/*`

### Customization

#### Styling
- Edit `assets/tailwind.css` for global styles
- Modify theme colors in `components.json`
- Tailwind CSS 4.0 configuration in `wxt.config.ts`

#### Salesforce Integration
- Update API endpoints in `lib/salesforce.ts`
- Modify user search queries and filters
- Extend user management operations

#### Workflow Integration
- Update content script selectors in `entrypoints/content.ts`
- Modify applicant information extraction logic
- Add support for additional workflow forms

## Development Commands

```bash
# Development mode with hot reload (Chrome by default)
pnpm dev

# Development for specific browsers
pnpm dev:chrome
pnpm dev:firefox
pnpm dev:edge
pnpm dev:safari

# Build for production (Chrome by default)
pnpm build

# Build for specific browsers
pnpm build:chrome
pnpm build:firefox
pnpm build:edge
pnpm build:safari

# Create extension zip files
pnpm zip
pnpm zip:chrome
pnpm zip:firefox
pnpm zip:edge
pnpm zip:safari

# Type checking
pnpm compile
```

## Browser Support

This extension supports all major browsers through WXT's universal browser compatibility:

- ✅ **Chrome** (Manifest V3) - `pnpm dev:chrome`, `pnpm build:chrome`
- ✅ **Firefox** (Manifest V2) - `pnpm dev:firefox`, `pnpm build:firefox`  
- ✅ **Edge** (Manifest V3) - `pnpm dev:edge`, `pnpm build:edge`
- ✅ **Safari** (Manifest V2) - `pnpm dev:safari`, `pnpm build:safari`
- ✅ **Other Chromium-based browsers** (Opera, Brave, etc.)

## Troubleshooting

### Common Issues

1. **"Salesforce configuration not found"**
   - Ensure you've configured access token and instance URL in settings
   - Verify the access token is still valid (tokens may expire)

2. **"Failed to search users"**
   - Check your Salesforce permissions
   - Verify the API version compatibility
   - Ensure the instance URL is correct

3. **Content script not working**
   - Make sure you're on workflow.voith.com
   - Check if the page structure has changed
   - Reload the extension and refresh the page

4. **Extension not loading**
   - Verify all dependencies are installed (`pnpm install`)
   - Check for TypeScript compilation errors (`pnpm compile`)
   - Ensure proper build output in `.output/chrome-mv3`

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section above
- Review Salesforce API documentation for API-related issues

---

Built with ❤️ using [WXT](https://wxt.dev), [Tailwind CSS](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com), and [Salesforce APIs](https://developer.salesforce.com/docs/apis)
