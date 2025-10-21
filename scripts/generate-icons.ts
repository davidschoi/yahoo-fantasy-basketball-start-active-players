#!/usr/bin/env node

import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface IconSize {
	size: number;
	filename: string;
}

const iconSizes: IconSize[] = [
	{ size: 16, filename: "icon16.png" },
	{ size: 48, filename: "icon48.png" },
	{ size: 128, filename: "icon128.png" },
];

const iconDir = path.join(__dirname, "..", "icons");
const sourceIconPath = path.join(iconDir, "icon.svg");

async function generateIcons(): Promise<void> {
	try {
		// Check if source icon exists
		if (!fs.existsSync(sourceIconPath)) {
			console.error(`Source icon not found at: ${sourceIconPath}`);
			console.log("Please ensure icon.svg exists in the icons directory");
			process.exit(1);
		}

		console.log("Generating icon files from SVG...");

		// Generate each icon size
		for (const iconSize of iconSizes) {
			const outputPath = path.join(iconDir, iconSize.filename);

			console.log(
				`Creating ${iconSize.filename} (${iconSize.size}x${iconSize.size})`,
			);

			await sharp(sourceIconPath)
				.resize(iconSize.size, iconSize.size, {
					fit: "contain",
					background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
				})
				.png()
				.toFile(outputPath);
		}

		console.log("✅ Icon generation complete!");
		console.log("Generated files:");
		iconSizes.forEach((icon) => {
			console.log(`  - ${icon.filename} (${icon.size}x${icon.size})`);
		});
	} catch (error) {
		console.error("❌ Error generating icons:", error);
		process.exit(1);
	}
}

// Run the script
generateIcons();
