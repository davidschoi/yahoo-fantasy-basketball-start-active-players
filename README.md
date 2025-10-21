# Yahoo Fantasy Basketball - Start Active Players Chrome Extension

A Chrome extension that automatically clicks "Start Active Players" for your entire week in Yahoo Fantasy Basketball, bypassing Yahoo's paywall for this premium feature.

## Features

- 🏀 **Weekly Automation**: Processes your entire week from current day to Sunday
- 🎯 **One-Click Operation**: Automatically navigates through each day and clicks "Start Active Players"
- 🔗 **Interactive Results**: Clickable date pills to review specific days

## Installation

See [INSTALL.md](INSTALL.md) for detailed installation instructions.

## How to Use

1. **Navigate to Your Team**
   - Go to Yahoo Fantasy Basketball roster page
   - Extension detects correct page automatically

2. **Start Weekly Processing**
   - Click extension icon → "Start Active Players"
   - Extension navigates through each day of the week
   - Automatically clicks "Start Active Players" for each day

3. **Review Results**
   - See summary of days needing manual review
   - Click date pills to navigate to specific days
   - Extension returns to your original page

## How It Works

1. **Page Detection**: Detects Yahoo Fantasy Basketball roster page
2. **Weekly Navigation**: Automatically navigates through each day of the week
3. **Button Clicking**: Finds and clicks "Start Active Players" button for each day
4. **Modal Handling**: Handles confirmation modals that appear after clicking
5. **Results Summary**: Shows days with remaining bench players needing manual review
6. **Return Navigation**: Returns to your original page after processing

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

See [INSTALL.md](INSTALL.md) for troubleshooting guide.

## Privacy & Security

- **No Data Collection**: The extension doesn't collect or store any personal data
- **Local Operation**: All processing happens locally in your browser
- **No External Requests**: The extension doesn't send data to external servers
- **Yahoo Terms**: Please review Yahoo's terms of service regarding automation

## Development

### Building from Source

1. **Clone and Install**

   ```bash
   git clone https://github.com/davidschoi/yahoo-fantasy-basketball-start-active-players
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

---

**Note**: This extension bypasses Yahoo's paywall for the "Start Active Players" feature by automatically clicking the button across your entire week.
