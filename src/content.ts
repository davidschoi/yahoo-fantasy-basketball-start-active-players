interface DayResult {
	date: string;
	started: number;
	exceptions: string[];
	needsManualSelection: boolean;
}

class YahooFantasyAutomator {
	constructor() {
		this.setupMessageListener();
	}

	private setupMessageListener(): void {
		chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
			if (request.action === "processDay") {
				this.processCurrentDayLineup()
					.then((result) => {
						sendResponse({ success: true, dayResult: result });
					})
					.catch((error) => {
						sendResponse({ 
							success: false, 
							error: (error as Error).message,
							dayResult: {
								date: this.getCurrentDate().toISOString().split("T")[0] || "",
								started: 0,
								exceptions: [`Error: ${(error as Error).message}`],
								needsManualSelection: true,
							}
						});
					});
				return true;
			}

			if (request.action === "getLeagueInfo") {
				try {
					const leagueInfo = this.getLeagueInfo();
					sendResponse(leagueInfo);
				} catch (error) {
					sendResponse({ 
						leagueName: "Fantasy League", 
						teamName: "My Team" 
					});
				}
				return true;
			}

			return false;
		});
	}

	private async processCurrentDayLineup(): Promise<DayResult> {
		const currentDate = this.getCurrentDate();
		const dateStr = this.formatDate(currentDate);

		const result: DayResult = {
			date: dateStr,
			started: 0,
			exceptions: [],
			needsManualSelection: false,
		};

		console.log("Checking for bench players with games...");
		
		// Check if there are bench players with games
		const hasBenchPlayersWithGames = this.hasBenchPlayersWithGames();
		
		if (!hasBenchPlayersWithGames) {
			console.log("No bench players with games found");
			return result; // No need to start players
		}

		console.log("Found bench players with games, looking for 'Start Active Players' button...");
		
		// Look for the "Start Active Players" button
		const startActiveButton = this.findStartActivePlayersButton();
		
		if (!startActiveButton) {
			console.log("No 'Start Active Players' button found");
			result.exceptions.push("No 'Start Active Players' button found on this page");
			result.needsManualSelection = true;
			return result;
		}

		console.log("Found 'Start Active Players' button, clicking it...");
		
		try {
			// Click the button
			startActiveButton.click();
			
			// Wait for modal to appear and handle it
			await this.handleStartActivePlayersModal();
			
			// Count remaining bench players with games (these couldn't be started)
			const remainingBenchPlayers = this.getRemainingBenchPlayersWithGames();
			
			if (remainingBenchPlayers.length > 0) {
				result.exceptions.push(`Remaining bench players with games: ${remainingBenchPlayers.join(", ")}`);
				result.needsManualSelection = true;
			}
			
			// Count total active players with games (starting + bench)
			const totalActivePlayers = this.countTotalActivePlayersWithGames();
			result.started = totalActivePlayers;
			
			console.log(`Total active players with games: ${totalActivePlayers}, ${remainingBenchPlayers.length} remain on bench`);
			
		} catch (error) {
			console.error("Error clicking 'Start Active Players' button:", error);
			result.exceptions.push(`Error clicking button: ${(error as Error).message}`);
			result.needsManualSelection = true;
		}

		return result;
	}

	private hasBenchPlayersWithGames(): boolean {
		// Check if there are any bench players with games
		const benchPlayersWithGames = document.querySelectorAll('tr.bench[data-pos="BN"] .ysf-game-status a');
		const hasGames = benchPlayersWithGames.length > 0;
		
		console.log(`Found ${benchPlayersWithGames.length} bench players with games`);
		return hasGames;
	}

	private findStartActivePlayersButton(): HTMLElement | null {
		// Look for button with the specific class and text
		const buttons = document.querySelectorAll('button, a, [role="button"]');
		
		for (let i = 0; i < buttons.length; i++) {
			const button = buttons[i] as HTMLElement;
			const text = button.textContent?.trim();
			const className = button.className;
			
			// Check if it has the right text and class
			if (text === "Start Active Players" && 
				className.includes("start-active-players")) {
				console.log("Found 'Start Active Players' button with classes:", className);
				return button;
			}
		}
		
		// Fallback: look for any button with the text
		for (let i = 0; i < buttons.length; i++) {
			const button = buttons[i] as HTMLElement;
			const text = button.textContent?.trim();
			
			if (text === "Start Active Players") {
				console.log("Found 'Start Active Players' button by text only");
				return button;
			}
		}
		
		return null;
	}

	private async handleStartActivePlayersModal(): Promise<void> {
		// Wait for modal to appear
		await this.delay(1000);
		
		// Look for modal and handle it
		const modal = document.querySelector('[role="dialog"], .modal, .ysf-modal');
		if (modal) {
			console.log("Modal detected, looking for confirm button...");
			
			// Look for confirm/OK button in modal
			const confirmButton = modal.querySelector('button[type="submit"], .btn-primary, .confirm-btn, button:contains("OK"), button:contains("Confirm")') as HTMLElement;
			if (confirmButton) {
				console.log("Found confirm button, clicking it...");
				confirmButton.click();
				await this.delay(1000);
			} else {
				// Try pressing Escape to close modal
				console.log("No confirm button found, trying Escape key...");
				document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
				await this.delay(1000);
			}
		}
	}

	private getRemainingBenchPlayersWithGames(): string[] {
		const remainingPlayers: string[] = [];
		const benchPlayers = document.querySelectorAll('tr.bench[data-pos="BN"]');
		
		for (let i = 0; i < benchPlayers.length; i++) {
			const player = benchPlayers[i] as HTMLElement;
			const gameStatus = player.querySelector('.ysf-game-status a');
			
			// Check if player has a game
			if (gameStatus && (gameStatus.textContent?.includes('pm') || gameStatus.textContent?.includes('am'))) {
				const nameElement = player.querySelector('a[href*="player"]');
				const name = nameElement?.textContent?.trim();
				if (name) {
					remainingPlayers.push(name);
				}
			}
		}
		
		console.log(`Remaining bench players with games: ${remainingPlayers.join(", ")}`);
		return remainingPlayers;
	}

	private countTotalActivePlayersWithGames(): number {
		// Count all players with games (both starting and bench)
		// Find the opponent column by header title
		const opponentHeader = document.querySelector('th[title="Opponents"]');
		if (!opponentHeader) {
			console.log('Could not find Opponents header');
			return 0;
		}
		
		// Get the column index (1-based)
		const headerRow = opponentHeader.parentElement;
		if (!headerRow) {
			console.log('Could not find header row');
			return 0;
		}
		
		const headers = Array.from(headerRow.children);
		const opponentColumnIndex = headers.indexOf(opponentHeader) + 1; // Convert to 1-based index
		
		console.log(`Opponent column is at index: ${opponentColumnIndex}`);
		
		// Count players with games
		const allPlayerRows = document.querySelectorAll('tr.editable[data-pos]');
		let totalActivePlayers = 0;
		
		for (let i = 0; i < allPlayerRows.length; i++) {
			const row = allPlayerRows[i] as HTMLElement;
			const oppCell = row.querySelector(`td:nth-child(${opponentColumnIndex})`);
			
			// Check if opponent column has text (indicating a game)
			if (oppCell && oppCell.textContent?.trim() && oppCell.textContent.trim() !== '') {
				totalActivePlayers++;
			}
		}
		
		console.log(`Found ${totalActivePlayers} total active players with games`);
		return totalActivePlayers;
	}

	private getCurrentDate(): Date {
		// Try to extract date from URL first
		const urlParams = new URLSearchParams(window.location.search);
		const dateParam = urlParams.get("date");

		if (dateParam) {
			const date = new Date(dateParam);
			if (!isNaN(date.getTime())) {
				return date;
			}
		}

		// Fallback to current date
		return new Date();
	}

	private formatDate(date: Date): string {
		return date.toISOString().split("T")[0] || "";
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private getLeagueInfo(): { leagueName: string; teamName: string } {
		try {
			const title = document.title;
			// Get everything before the first pipe
			const pipeIndex = title.indexOf(" | ");
			if (pipeIndex === -1) {
				return { leagueName: "Fantasy League", teamName: "My Team" };
			}

			const beforePipe = title.substring(0, pipeIndex).trim();
			
			return { leagueName: beforePipe, teamName: "" };
		} catch (error) {
			console.error("Error getting league info:", error);
			return { leagueName: "Fantasy League", teamName: "My Team" };
		}
	}
}

// Initialize the automator
const automator = new YahooFantasyAutomator();
// Reference to prevent unused variable warning
void automator;
(window as unknown as { YahooFantasyAutomator: typeof YahooFantasyAutomator }).YahooFantasyAutomator = YahooFantasyAutomator;