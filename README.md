# Yahoo Fantasy Basketball - Start Active Players Chrome Extension

A Chrome extension that automatically starts active players for the rest of the week in Yahoo Fantasy Basketball, replacing the premium "Start Active Players" feature that's now behind a paywall.

## Features

- 🏀 **Automatic Lineup Management**: Automatically moves active players from bench to starting positions
- 🎯 **Smart Detection**: Identifies players with games scheduled for the current week
- 🚀 **One-Click Operation**: Simple popup interface for easy use
- 🔄 **Real-time Status**: Shows current page status and operation results
- 🛡️ **Error Handling**: Comprehensive error handling and user feedback

## Installation

### Method 1: Build and Load Extension (Recommended)

1. **Clone and Build**

   ```bash
   git clone <repository-url>
   cd yahoo-fantasy-basketball-start-active-players
   npm install
   npm run build
   ```

2. **Open Chrome Extensions Page**
   - Open Google Chrome
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the `dist` folder (created after build)
   - The extension should now appear in your extensions list

4. **Pin the Extension**
   - Click the puzzle piece icon in Chrome's toolbar
   - Find "Yahoo Fantasy Basketball - Start Active Players"
   - Click the pin icon to keep it visible

### Method 2: Development Mode

For development, you can use:

```bash
npm run dev  # Builds and shows success message
```

### Method 2: Manual Installation

1. Download all files to a folder on your computer
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the folder
5. The extension will be loaded and ready to use

## How to Use

1. **Navigate to Your Team**
   - Go to Yahoo Fantasy Basketball
   - Navigate to your team's roster/lineup page
   - The extension will automatically detect if you're on the correct page

2. **Start Active Players**
   - Click the extension icon in your browser toolbar
   - Click "🚀 Start Active Players" button
   - The extension will automatically move active players to your starting lineup

3. **Monitor Results**
   - The popup will show the status of the operation
   - You'll see how many players were moved
   - Any errors or issues will be displayed

## How It Works

The extension works by:

1. **Page Detection**: Automatically detects when you're on a Yahoo Fantasy Basketball roster page
2. **Player Analysis**: Scans your roster to identify active players (those with games scheduled)
3. **Lineup Optimization**: Moves active players from bench to starting positions
4. **Smart Matching**: Ensures players are placed in appropriate positions based on eligibility

## Technical Details

### Files Structure

```bash
├── src/                  # TypeScript source files
│   ├── content.ts        # Main automation logic
│   ├── popup.ts          # Popup functionality
│   └── popup.html         # User interface
├── scripts/              # Build scripts
│   ├── build.ts          # Main build script
│   └── generate-icons.ts # Icon generation
├── icons/                # Extension icons
│   └── icon.svg          # Source SVG icon
├── dist/                 # Built extension (generated)
├── manifest.json         # Extension configuration
├── tsconfig.json         # TypeScript configuration
├── package.json          # Dependencies and scripts
└── README.md             # This file
```

### Permissions

- `activeTab`: Access to the current Yahoo Fantasy page
- `storage`: Save user preferences (future feature)
- `host_permissions`: Access to Yahoo Fantasy domains

### Browser Compatibility

- Chrome (Manifest V3)
- Edge (Chromium-based)
- Other Chromium-based browsers

## Troubleshooting

### Extension Not Working?

1. **Check Page**: Make sure you're on your team's roster page
2. **Refresh**: Try refreshing the page and clicking the extension again
3. **Permissions**: Ensure the extension has permission to access the page
4. **Update**: Make sure you have the latest version of the extension

### Common Issues

**"Not on Yahoo Fantasy page"**

- Navigate to `basketball.fantasysports.yahoo.com`
- Make sure you're logged into your Yahoo account

**"Please navigate to My Team page"**

- Go to your team's roster or lineup page
- The extension needs to see your player list to work

**"No active players found"**

- This means all your active players are already in your starting lineup
- Or there might be no games scheduled for your players this week

### Getting Help

If you encounter issues:

1. Check the browser console for error messages
2. Make sure you're on the correct Yahoo Fantasy page
3. Try refreshing the page and running the extension again
4. Check that your team has players with games scheduled

## Privacy & Security

- **No Data Collection**: The extension doesn't collect or store any personal data
- **Local Operation**: All processing happens locally in your browser
- **No External Requests**: The extension doesn't send data to external servers
- **Yahoo Terms**: Please review Yahoo's terms of service regarding automation

## Development

### Building from Source

1. **Clone and Install**

   ```bash
   git clone <repository-url>
   cd yahoo-fantasy-basketball-start-active-players
   npm install
   ```

2. **Build the Extension**

   ```bash
   npm run build
   ```

3. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked" and select the `dist` folder

### Development Workflow

- **Build**: `npm run build` - Compiles TypeScript and generates icons
- **Clean**: `npm run clean` - Removes dist directory
- **Dev**: `npm run dev` - Builds and shows success message

### TypeScript Features

- **Strict Type Checking**: Full TypeScript support with strict mode
- **Chrome API Types**: Proper typing for Chrome extension APIs
- **Build System**: Automated build process with icon generation
- **Error Handling**: Comprehensive error handling and type safety
- **Package Manager**: Uses npm for reliable dependency management

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes in the `src/` directory
4. Run `npm run build` to test
5. Test thoroughly
6. Submit a pull request

## Disclaimer

This extension is not affiliated with Yahoo or Yahoo Fantasy Sports. It's a third-party tool created to help fantasy basketball players manage their lineups. Use at your own discretion and in accordance with Yahoo's terms of service.

## License

This project is open source and available under the MIT License.

## Changelog

### Version 1.0.0

- Initial release
- Basic active player detection
- Automatic lineup management
- User-friendly popup interface
- Error handling and feedback

---

**Note**: This extension replaces the premium "Start Active Players" feature that Yahoo has moved behind a paywall. It provides similar functionality through browser automation.
