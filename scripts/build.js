import { execSync } from 'child_process'
import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

console.log('🏗️ Building Yahoo Fantasy Basketball extension...')

// Create dist directory if it doesn't exist
if (!existsSync('dist')) {
  mkdirSync('dist')
}

// Copy manifest.json
copyFileSync('src/manifest.json', 'dist/manifest.json')
console.log('✅ Copied manifest.json')

// Copy icons
const iconsDir = 'dist/icons'
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true })
}

const iconSizes = [16, 48, 128]
iconSizes.forEach(size => {
  copyFileSync(`icons/icon${size}.png`, `dist/icons/icon${size}.png`)
})
console.log('✅ Copied icons')

console.log('🎉 Build completed successfully!')
console.log('📦 Extension ready in dist/ folder')
