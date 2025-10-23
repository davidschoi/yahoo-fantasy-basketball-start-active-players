type ProcessingStatus = "idle" | "processing" | "completed" | "error";

interface WeeklyResults {
	totalDays: number;
	processedDays: number;
	daysWithExceptions: DayResult[];
	summary: string;
}

interface DayResult {
	date: string;
	started: number;
	exceptions: string[];
	needsManualSelection: boolean;
}

const STATUS_MESSAGES: Record<ProcessingStatus, string> = {
	idle: "Ready to start active players",
	processing: "Active players processing...",
	completed: "Active players completed",
	error: "Active players error"
};

class WeeklyProcessor {
	private isProcessing: boolean = false;
	private originalUrl: string = "";
	private results: WeeklyResults = {
		totalDays: 7,
		processedDays: 0,
		daysWithExceptions: [],
		summary: "",
	};
	private currentStatus: ProcessingStatus = "idle";

	constructor() {
		this.setupMessageListener();
	}

	private setupMessageListener(): void {
		chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
			if (request.action === "processWeeklyLineups") {
				this.processWeeklyLineups()
					.then((results) => {
						sendResponse({ success: true, weeklyResults: results });
					})
					.catch((error) => {
						sendResponse({ success: false, error: error.message });
					});
				return true; // Keep message channel open for async response
			}

			if (request.action === "getDayResult") {
				this.handleDayResult(request.dayResult);
				sendResponse({ success: true });
				return true;
			}

			if (request.action === "getCurrentState") {
				sendResponse({
					success: true,
					state: {
						isProcessing: this.isProcessing,
						status: this.currentStatus,
						statusMessage: STATUS_MESSAGES[this.currentStatus],
						results: this.results,
						originalUrl: this.originalUrl
					}
				});
				return true;
			}

			if (request.action === "resetState") {
				this.resetState();
				sendResponse({ success: true });
				return true;
			}

			return false;
		});
	}

	async processWeeklyLineups(): Promise<WeeklyResults> {
		if (this.isProcessing) {
			throw new Error("Weekly processing already in progress");
		}

		this.isProcessing = true;
		this.currentStatus = "processing";
		this.results = {
			totalDays: 7,
			processedDays: 0,
			daysWithExceptions: [],
			summary: "",
		};

		try {
			// Get the current tab
			const [tab] = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			});

			if (!tab || !tab.id) {
				throw new Error("No active tab found");
			}

			// Store the original URL to navigate back to later
			this.originalUrl = tab.url || "";

			// Get current date from URL or current date
			const currentDate = this.getCurrentDate(tab.url || "");
			const startDate = new Date(currentDate);

			// Process each day from today until Sunday (inclusive)
			// Calculate how many days until Sunday (Sunday is day 0)
			const currentDay = startDate.getDay();
			// If we're already on Sunday, we process 1 day (just Sunday)
			// If we're on any other day, we process until Sunday
			const totalDays = currentDay === 0 ? 1 : (7 - currentDay + 1);
			
			console.log(`Current day: ${currentDay}, Total days to process: ${totalDays}`);

			for (let i = 0; i < totalDays; i++) {
				const date = new Date(startDate);
				date.setDate(startDate.getDate() + i);

				console.log(`Processing day ${i}: ${date.toDateString()} (day ${date.getDay()})`);

				const dateStr = this.formatDate(date);
				console.log(`Navigating to date: ${dateStr}`);

				try {
					// Navigate to the specific date
					await this.navigateToDate(tab.id, dateStr);
					await this.delay(3000); // Wait for page to load

					// Send message to content script to process this day
					const response = await chrome.tabs.sendMessage(tab.id, {
						action: "processDay",
						date: dateStr,
					});

					if (response?.success) {
						this.results.processedDays++;
						if (
							response.dayResult.needsManualSelection ||
							response.dayResult.exceptions.length > 0
						) {
							this.results.daysWithExceptions.push(response.dayResult);
						}
					}
				} catch (error) {
					console.error(`Error processing ${dateStr}:`, error);
					this.results.daysWithExceptions.push({
						date: dateStr,
						started: 0,
						exceptions: [`Error: ${(error as Error).message}`],
						needsManualSelection: true,
					});
				}
			}

			// Generate summary
			this.results.summary = this.generateWeeklySummary(this.results);
			console.log(`Weekly lineup processing completed! 📊`);
			console.log(this.results.summary);

			// Navigate back to the original URL
			if (this.originalUrl) {
				await chrome.tabs.update(tab.id, { url: this.originalUrl });
				console.log(`Navigated back to original URL: ${this.originalUrl}`);
			}

			// Update status to completed
			this.currentStatus = "completed";

			return this.results;
		} catch (error) {
			// Update status to error
			this.currentStatus = "error";
			throw error;
		} finally {
			this.isProcessing = false;
		}
	}

	private async navigateToDate(tabId: number, dateStr: string): Promise<void> {
		// Get current URL and add/update date parameter
		const tab = await chrome.tabs.get(tabId);
		const currentUrl = new URL(tab.url || "");
		currentUrl.searchParams.set("date", dateStr);

		// Navigate to the new URL
		await chrome.tabs.update(tabId, {
			url: currentUrl.toString(),
		});

		// Wait for navigation to complete
		await this.waitForTabLoad(tabId);
	}

	private async waitForTabLoad(tabId: number): Promise<void> {
		return new Promise((resolve) => {
			const listener = (updatedTabId: number, changeInfo: any) => {
				if (updatedTabId === tabId && changeInfo.status === "complete") {
					chrome.tabs.onUpdated.removeListener(listener);
					resolve();
				}
			};
			chrome.tabs.onUpdated.addListener(listener);
		});
	}

	private handleDayResult(dayResult: DayResult): void {
		this.results.processedDays++;
		if (dayResult.needsManualSelection || dayResult.exceptions.length > 0) {
			this.results.daysWithExceptions.push(dayResult);
		}
	}

	private generateWeeklySummary(results: WeeklyResults): string {
		// Only show days with remaining bench players (exceptions that mention "Remaining bench players")
		const daysWithRemainingBench = results.daysWithExceptions.filter(day => 
			day.exceptions.some(exception => exception.includes("Remaining bench players"))
		);

		if (daysWithRemainingBench.length === 0) {
			return "All active players started successfully! 🎉";
		}

		let summary = "Days needing manual review:\n";
		daysWithRemainingBench.forEach((day) => {
			const remainingPlayers = day.exceptions
				.filter(e => e.includes("Remaining bench players"))
				.map(e => e.replace("Remaining bench players with games: ", ""))
				.join(", ");
			
			// Show how many players have games
			summary += `${day.date}: ${day.started} players with games\n`;
			summary += `⚠️ Remaining bench players with games: ${remainingPlayers}\n`;
		});

		return summary;
	}

	private getCurrentDate(url: string): Date {
		// Always work with local-midnight dates
		try {
			const urlObj = new URL(url);
			const dateParam = urlObj.searchParams.get("date");
			if (dateParam) {
				return this.parseLocalDate(dateParam);
			}
		} catch {
			// ignore
		}
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), now.getDate());
	}

	private parseLocalDate(ymd: string): Date {
		// ymd is "YYYY-MM-DD"
		const parts = ymd.split("-");
		const y = parseInt(parts[0] || "0", 10);
		const m = parseInt(parts[1] || "0", 10);
		const d = parseInt(parts[2] || "1", 10);
		return new Date(y, (m ? m - 1 : 0), d); // local midnight
	}

	private formatDate(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private resetState(): void {
		this.isProcessing = false;
		this.currentStatus = "idle";
		this.originalUrl = "";
		this.results = {
			totalDays: 7,
			processedDays: 0,
			daysWithExceptions: [],
			summary: "",
		};
	}
}

// Initialize the processor
const processor = new WeeklyProcessor();
// Reference to prevent unused variable warning
void processor;	