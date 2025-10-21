# Installation Guide

## Build and Load Extension (Recommended)

1. **Clone and Build**

   ```bash
   git clone https://github.com/davidschoi/yahoo-fantasy-basketball-start-active-players.git
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

## Development Mode

For development, you can use:

```bash
npm run dev # Builds and shows success message
```

## Manual Installation

1. Download all files to a folder on your computer
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the folder
5. The extension will be loaded and ready to use

## Troubleshooting

### Extension Not Working?

1. **Check Page**: Make sure you're on your team's roster page
2. **Refresh**: Try refreshing the page and clicking the extension again
3. **Permissions**: Ensure the extension has permission to access the page
4. **Update**: Make sure you have the latest version of the extension

### Common Issues

**"Not on Yahoo Fantasy page"**

- Navigate to your team's roster page at `basketball.fantasysports.yahoo.com`

**"Please navigate to roster page"**

- Go to your team's roster page (not league page)
- URL should look like: `/nba/leagueId/teamId`

**"Active players processing..."**

- Extension is working through each day of the week
- Wait for completion and check results

### Getting Help

If you encounter issues:

1. Check the browser console for error messages
2. Make sure you're on the correct Yahoo Fantasy page
3. Try refreshing the page and running the extension again
4. Check that your team has players with games scheduled