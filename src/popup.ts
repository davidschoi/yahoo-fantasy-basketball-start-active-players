import { ProcessingStatus } from './types';

document.addEventListener("DOMContentLoaded", () => {
	const startActiveBtn = document.getElementById(
		"startActiveBtn",
	) as HTMLButtonElement;
	const refreshBtn = document.getElementById("refreshBtn") as HTMLButtonElement;
	const resetBtn = document.getElementById("resetBtn") as HTMLButtonElement;
	const loading = document.getElementById("loading") as HTMLElement;
	const results = document.getElementById("results") as HTMLElement;
	const statusDot = document.getElementById("statusDot") as HTMLElement;
	const statusText = document.getElementById("statusText") as HTMLElement;
	const leagueInfo = document.getElementById("leagueInfo") as HTMLElement;

	// Check initial page status and restore state
	checkPageStatus();
	restoreStateFromBackground();

	// Initialize hideable instructions
	initializeHideableInstructions();

	// Event listeners
	startActiveBtn.addEventListener("click", startActivePlayers);
	refreshBtn.addEventListener("click", checkPageStatus);
	resetBtn.addEventListener("click", resetState);

	async function restoreStateFromBackground(): Promise<void> {
		try {
			const response = await chrome.runtime.sendMessage({
				action: "getCurrentState",
			}) as {
				success: boolean;
				state?: {
					isProcessing: boolean;
					status: ProcessingStatus;
					statusMessage: string;
					results: {
						totalDays: number;
						processedDays: number;
						daysWithExceptions: Array<{
							date: string;
							started: number;
							exceptions: string[];
							needsManualSelection: boolean;
						}>;
						summary: string;
					};
					originalUrl: string;
				};
			};

			if (response.success && response.state) {
				const state = response.state;
				
				// Update status based on background state
				if (state.isProcessing) {
					setStatus("processing", state.statusMessage);
					startActiveBtn.disabled = true;
					showLoading(true);
				} else if (state.status === "completed" && state.results.summary) {
					setStatus("completed", state.statusMessage);
					startActiveBtn.disabled = false;
					showLoading(false);
					await showWeeklyResults("Weekly lineup processing completed!", state.results);
				} else if (state.status === "error") {
					setStatus("error", state.statusMessage);
					startActiveBtn.disabled = false;
					showLoading(false);
					showResults("error", state.statusMessage);
				}
			}
		} catch (error) {
			console.error("Error restoring state from background:", error);
		}
	}

	async function resetState(): Promise<void> {
		try {
			await chrome.runtime.sendMessage({
				action: "resetState",
			});
			
			// Reset UI state
			setStatus("online", "Ready to start active players");
			startActiveBtn.disabled = false;
			showLoading(false);
			hideResults();
			
			// Refresh page status
			await checkPageStatus();
		} catch (error) {
			console.error("Error resetting state:", error);
		}
	}

	async function checkPageStatus(): Promise<void> {
		try {
			const [tab] = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			});

			if (!tab) {
				setStatus("offline", "No active tab found");
				startActiveBtn.disabled = true;
				return;
			}

			if (
				!tab.url?.includes("basketball.fantasysports.yahoo.com") &&
				!tab.url?.includes("fantasysports.yahoo.com")
			) {
				setStatus("offline", "Not on Yahoo Fantasy page");
				startActiveBtn.disabled = true;
				return;
			}

			// Check for Yahoo Fantasy Basketball My Team page URL pattern
			// Pattern: basketball.fantasysports.yahoo.com/sport/leagueId/teamId
			const urlPattern =
				/basketball\.fantasysports\.yahoo\.com\/[a-z]+\/\d+\/\d+/;
			if (!urlPattern.test(tab.url || "")) {
				setStatus("offline", "Please navigate to My Team page");
				startActiveBtn.disabled = true;
				return;
			}

			// Get league and team information
			await updateLeagueInfo(tab.id!);

			setStatus("online", "Ready to start active players");
			startActiveBtn.disabled = false;
		} catch (error) {
			console.error("Error checking page status:", error);
			setStatus("offline", "Error checking page");
			startActiveBtn.disabled = true;
		}
	}

	async function updateLeagueInfo(tabId: number): Promise<void> {
		try {
			const response = await chrome.tabs.sendMessage(tabId, {
				action: "getLeagueInfo",
			});

			if (response?.leagueName) {
				leagueInfo.textContent = response.leagueName;
			} else {
				leagueInfo.textContent = "Yahoo Fantasy Basketball";
			}
		} catch (error) {
			console.error("Error getting league info:", error);
			leagueInfo.textContent = "Yahoo Fantasy Basketball";
		}
	}

	function setStatus(status: "online" | "offline" | ProcessingStatus, message: string): void {
		statusDot.className = `status-dot ${status}`;
		statusText.textContent = message;
	}

	async function startActivePlayers(): Promise<void> {
		try {
			showLoading(true);
			hideResults();
			startActiveBtn.disabled = true;
			setStatus("processing", "Active players processing...");

			const [tab] = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			});

			if (!tab || !tab.id) {
				throw new Error("No active tab found");
			}

			const response = (await chrome.runtime.sendMessage({
				action: "processWeeklyLineups",
			})) as {
				success: boolean;
				message?: string;
				error?: string;
				details?: string[];
				weeklyResults?: {
					totalDays: number;
					processedDays: number;
					daysWithExceptions: Array<{
						date: string;
						started: number;
						exceptions: string[];
						needsManualSelection: boolean;
					}>;
					summary: string;
				};
			};

			if (response.success) {
				await showWeeklyResults(
					response.message || "Weekly lineup processing completed!",
					response.weeklyResults,
				);
				setStatus("completed", "Active players completed");
			} else {
				showResults(
					"error",
					response.error || "Failed to process weekly lineups",
				);
				setStatus("error", "Active players error");
			}
		} catch (error) {
			console.error("Error starting active players:", error);
			showResults("error", `Error: ${(error as Error).message}`);
			setStatus("error", "Active players error");
		} finally {
			showLoading(false);
			startActiveBtn.disabled = false;
		}
	}

	function showLoading(show: boolean): void {
		loading.classList.toggle("show", show);
	}

	function showResults(
		type: "success" | "error",
		message: string,
		details?: string[] | null,
	): void {
		results.className = `results show ${type}`;
		results.innerHTML = `
      <div style="font-weight: 500;">${message}</div>
      ${details ? `<div style="font-size: 11px; opacity: 0.8;">${details.join("<br>")}</div>` : ""}
    `;
	}

	async function showWeeklyResults(
		message: string,
		weeklyResults?: {
			totalDays: number;
			processedDays: number;
			daysWithExceptions: Array<{
				date: string;
				started: number;
				exceptions: string[];
				needsManualSelection: boolean;
			}>;
			summary: string;
		},
	): Promise<void> {
		results.className = `results show success`;

		let detailsHtml = "";

		if (weeklyResults && weeklyResults.daysWithExceptions.length > 0) {
			// Get current tab to extract league and team IDs
			const [tab] = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			});

			let baseUrl = "";
			if (tab?.url) {
				try {
					const url = new URL(tab.url);
					// Extract league ID and team ID from URL pattern: /nba/leagueId/teamId
					const pathParts = url.pathname.split('/');
					if (pathParts.length >= 4 && pathParts[1] === 'nba') {
						const leagueId = pathParts[2];
						const teamId = pathParts[3];
						baseUrl = `https://basketball.fantasysports.yahoo.com/nba/${leagueId}/${teamId}`;
					}
				} catch (error) {
					console.error("Error parsing URL:", error);
				}
			}

			detailsHtml = `
				<div style="font-size: 12px; margin-top: 8px;">
					<div style="font-weight: 500; margin: 8px 0 4px 0;">⚠️ Days needing manual review:</div>
			`;

			weeklyResults.daysWithExceptions.forEach((day) => {
				const dateUrl = `${baseUrl}?date=${day.date}`;
				detailsHtml += `
					<div style="margin: 2px 0; padding: 8px; background: #f8f9fa; border: 1px solid #e0e4e9; border-radius: 4px; font-size: 11px;">
						<strong style="color: #232a31;">
							<a href="${dateUrl}" class="date-pill">${day.date}</a>
						</strong> ${day.started} players have games
						${day.exceptions.length > 0 ? `<br><span style="color: #dc3545;">⚠️ ${day.exceptions.join(", ")}</span>` : ""}
					</div>
				`;
			});

			detailsHtml += `</div>`;
		}

		results.innerHTML = `
			<div style="font-weight: 500">${message}</div>
			${detailsHtml}
		`;

		// Add click event listeners to date pills
		if (weeklyResults && weeklyResults.daysWithExceptions.length > 0) {
			const datePills = results.querySelectorAll('.date-pill');
			datePills.forEach((pill) => {
				pill.addEventListener('click', (e) => {
					e.preventDefault();
					const url = (pill as HTMLAnchorElement).href;
					chrome.tabs.update({ url });
				});
			});
		}
	}

	function hideResults(): void {
		results.classList.remove("show");
	}

	function initializeHideableInstructions(): void {
		const instructions = document.getElementById("instructions");
		const hideButton = document.getElementById("hideInstructionsBtn");

		if (!instructions || !hideButton) {
			return;
		}

		// Check localStorage for saved state
		const isHidden = localStorage.getItem("hideInstructions") === "true";

		// Hide instructions if previously hidden
		if (isHidden) {
			instructions.style.display = "none";
		}

		// Add click listener to hide button
		hideButton.addEventListener("click", () => {
			instructions.style.display = "none";
			localStorage.setItem("hideInstructions", "true");
		});
	}

	// Auto-refresh status every 5 seconds
	setInterval(checkPageStatus, 5000);
});
