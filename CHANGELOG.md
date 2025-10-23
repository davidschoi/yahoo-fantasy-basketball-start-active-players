# Changelog

## [1.0.1] - 2025-10-23

### Added

- **Persistent State Management**: Extension now maintains context across popup sessions
- **Background Script State**: Processing state persists when switching tabs or closing popup
- **Reset State Functionality**: New "Reset State" button to clear processing state
- **Type-Safe Status System**: Union types for processing status with consistent messaging
- **Shared Type Definitions**: Centralized types for better maintainability
- **State Restoration**: Popup automatically restores previous state on reopen

### Fixed

- **Chrome Web Store Compliance**: Removed unused `storage` permission
- **State Persistence Bug**: Fixed issue where extension lost context when popup was closed
- **TypeScript Compilation**: Resolved unused variable warnings
- **Permission Optimization**: Streamlined to only essential permissions (`tabs`)

### Improved

- **User Experience**: No more lost progress when switching tabs during processing
- **Code Organization**: Better separation of concerns with shared types
- **Error Handling**: More robust state management with proper error states
- **Type Safety**: Enhanced type checking across all components

### Technical Details

- Added `ProcessingStatus` union type for type-safe status management
- Implemented background script state persistence
- Created shared `types.ts` for consistent type definitions
- Enhanced popup-to-background communication for state queries
- Optimized manifest permissions for Chrome Web Store compliance

## [1.0.0] - 2025-10-20

### Added

- Chrome extension for Yahoo Fantasy Basketball
- Automatic "Start Active Players" functionality
- TypeScript implementation with strict type checking
- Custom SFL logo with athletic silhouette design
- Automated build system with icon generation
- Popup interface with real-time status indicators
- Smart player detection and lineup management
- Comprehensive error handling and user feedback

### Technical Details

- Built with TypeScript, Chrome APIs, Sharp for image processing
- Generates 16px, 48px, 128px icons from SVG source
- Uses npm for package management
- Ready for Chrome extension installation
