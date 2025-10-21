#!/usr/bin/env node

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface BuildStep {
	name: string;
	action: () => void;
}

const buildSteps: BuildStep[] = [
	{
		name: "Clean dist directory",
		action: () => {
			const distDir = path.join(__dirname, "..", "dist");
			if (fs.existsSync(distDir)) {
				fs.rmSync(distDir, { recursive: true });
			}
			fs.mkdirSync(distDir, { recursive: true });
		},
	},
	{
		name: "Compile TypeScript",
		action: () => {
			console.log("Compiling TypeScript...");
			execSync("npx tsc", { stdio: "inherit" });
		},
	},
	{
		name: "Copy HTML files",
		action: () => {
			const srcDir = path.join(__dirname, "..", "src");
			const distDir = path.join(__dirname, "..", "dist");

			// Copy popup.html
			const popupSrc = path.join(srcDir, "popup.html");
			const popupDist = path.join(distDir, "popup.html");
			fs.copyFileSync(popupSrc, popupDist);

			console.log("Copied HTML files to dist/");
		},
	},
	{
		name: "Generate icons",
		action: () => {
			console.log("Generating icons...");
			execSync("npx tsx scripts/generate-icons.ts", { stdio: "inherit" });
		},
	},
	{
		name: "Copy manifest",
		action: () => {
			const manifestSrc = path.join(__dirname, "..", "manifest.json");
			const manifestDist = path.join(__dirname, "..", "dist", "manifest.json");
			fs.copyFileSync(manifestSrc, manifestDist);

			console.log("Copied manifest.json to dist/");
		},
	},
	{
		name: "Copy icons to dist",
		action: () => {
			const iconsSrc = path.join(__dirname, "..", "icons");
			const iconsDist = path.join(__dirname, "..", "dist", "icons");

			if (!fs.existsSync(iconsDist)) {
				fs.mkdirSync(iconsDist, { recursive: true });
			}

			// Copy all icon files
			const iconFiles = fs
				.readdirSync(iconsSrc)
				.filter((file) => file.endsWith(".png") || file.endsWith(".svg"));

			iconFiles.forEach((file) => {
				const src = path.join(iconsSrc, file);
				const dist = path.join(iconsDist, file);
				fs.copyFileSync(src, dist);
			});

			console.log("Copied icons to dist/icons/");
		},
	},
];

async function build(): Promise<void> {
	console.log("🚀 Starting build process...\n");

	try {
		for (const step of buildSteps) {
			console.log(`📦 ${step.name}...`);
			step.action();
			console.log(`✅ ${step.name} completed\n`);
		}

		console.log("🎉 Build completed successfully!");
		console.log("📁 Extension files are ready in the 'dist' directory");
		console.log(
			"🔧 Load the 'dist' directory as an unpacked extension in Chrome",
		);
	} catch (error) {
		console.error("❌ Build failed:", error);
		process.exit(1);
	}
}

// Run the build
build();
