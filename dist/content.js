"use strict";
class YahooFantasyAutomator {
    constructor() {
        this.setupMessageListener();
    }
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
            if (request.action === "processDay") {
                this.processCurrentDayLineup()
                    .then((result) => {
                    sendResponse({ success: true, dayResult: result });
                })
                    .catch((error) => {
                    sendResponse({
                        success: false,
                        error: error.message,
                        dayResult: {
                            date: this.getCurrentDate().toISOString().split("T")[0] || "",
                            started: 0,
                            exceptions: [`Error: ${error.message}`],
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
                }
                catch (error) {
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
    async processCurrentDayLineup() {
        const currentDate = this.getCurrentDate();
        const dateStr = this.formatDate(currentDate);
        const result = {
            date: dateStr,
            started: 0,
            exceptions: [],
            needsManualSelection: false,
        };
        console.log("Checking for bench players with games...");
        const hasBenchPlayersWithGames = this.hasBenchPlayersWithGames();
        if (!hasBenchPlayersWithGames) {
            console.log("No bench players with games found");
            return result;
        }
        console.log("Found bench players with games, looking for 'Start Active Players' button...");
        const startActiveButton = this.findStartActivePlayersButton();
        if (!startActiveButton) {
            console.log("No 'Start Active Players' button found");
            result.exceptions.push("No 'Start Active Players' button found on this page");
            result.needsManualSelection = true;
            return result;
        }
        console.log("Found 'Start Active Players' button, clicking it...");
        try {
            startActiveButton.click();
            await this.handleStartActivePlayersModal();
            const remainingBenchPlayers = this.getRemainingBenchPlayersWithGames();
            if (remainingBenchPlayers.length > 0) {
                result.exceptions.push(`Remaining bench players with games: ${remainingBenchPlayers.join(", ")}`);
                result.needsManualSelection = true;
            }
            const totalActivePlayers = this.countTotalActivePlayersWithGames();
            result.started = totalActivePlayers;
            console.log(`Total active players with games: ${totalActivePlayers}, ${remainingBenchPlayers.length} remain on bench`);
        }
        catch (error) {
            console.error("Error clicking 'Start Active Players' button:", error);
            result.exceptions.push(`Error clicking button: ${error.message}`);
            result.needsManualSelection = true;
        }
        return result;
    }
    hasBenchPlayersWithGames() {
        const benchPlayersWithGames = document.querySelectorAll('tr.bench[data-pos="BN"] .ysf-game-status a');
        const hasGames = benchPlayersWithGames.length > 0;
        console.log(`Found ${benchPlayersWithGames.length} bench players with games`);
        return hasGames;
    }
    findStartActivePlayersButton() {
        const buttons = document.querySelectorAll('button, a, [role="button"]');
        for (let i = 0; i < buttons.length; i++) {
            const button = buttons[i];
            const text = button.textContent?.trim();
            const className = button.className;
            if (text === "Start Active Players" &&
                className.includes("start-active-players")) {
                console.log("Found 'Start Active Players' button with classes:", className);
                return button;
            }
        }
        for (let i = 0; i < buttons.length; i++) {
            const button = buttons[i];
            const text = button.textContent?.trim();
            if (text === "Start Active Players") {
                console.log("Found 'Start Active Players' button by text only");
                return button;
            }
        }
        return null;
    }
    async handleStartActivePlayersModal() {
        await this.delay(1000);
        const modal = document.querySelector('[role="dialog"], .modal, .ysf-modal');
        if (modal) {
            console.log("Modal detected, looking for confirm button...");
            const confirmButton = modal.querySelector('button[type="submit"], .btn-primary, .confirm-btn, button:contains("OK"), button:contains("Confirm")');
            if (confirmButton) {
                console.log("Found confirm button, clicking it...");
                confirmButton.click();
                await this.delay(1000);
            }
            else {
                console.log("No confirm button found, trying Escape key...");
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                await this.delay(1000);
            }
        }
    }
    getRemainingBenchPlayersWithGames() {
        const remainingPlayers = [];
        const benchPlayers = document.querySelectorAll('tr.bench[data-pos="BN"]');
        for (let i = 0; i < benchPlayers.length; i++) {
            const player = benchPlayers[i];
            const gameStatus = player.querySelector('.ysf-game-status a');
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
    countTotalActivePlayersWithGames() {
        const opponentHeader = document.querySelector('th[title="Opponents"]');
        if (!opponentHeader) {
            console.log('Could not find Opponents header');
            return 0;
        }
        const headerRow = opponentHeader.parentElement;
        if (!headerRow) {
            console.log('Could not find header row');
            return 0;
        }
        const headers = Array.from(headerRow.children);
        const opponentColumnIndex = headers.indexOf(opponentHeader) + 1;
        console.log(`Opponent column is at index: ${opponentColumnIndex}`);
        const allPlayerRows = document.querySelectorAll('tr.editable[data-pos]');
        let totalActivePlayers = 0;
        for (let i = 0; i < allPlayerRows.length; i++) {
            const row = allPlayerRows[i];
            const oppCell = row.querySelector(`td:nth-child(${opponentColumnIndex})`);
            if (oppCell && oppCell.textContent?.trim() && oppCell.textContent.trim() !== '') {
                totalActivePlayers++;
            }
        }
        console.log(`Found ${totalActivePlayers} total active players with games`);
        return totalActivePlayers;
    }
    getCurrentDate() {
        const urlParams = new URLSearchParams(window.location.search);
        const dateParam = urlParams.get("date");
        if (dateParam) {
            const date = new Date(dateParam);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
        return new Date();
    }
    formatDate(date) {
        return date.toISOString().split("T")[0] || "";
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    getLeagueInfo() {
        try {
            const title = document.title;
            const pipeIndex = title.indexOf(" | ");
            if (pipeIndex === -1) {
                return { leagueName: "Fantasy League", teamName: "My Team" };
            }
            const beforePipe = title.substring(0, pipeIndex).trim();
            return { leagueName: beforePipe, teamName: "" };
        }
        catch (error) {
            console.error("Error getting league info:", error);
            return { leagueName: "Fantasy League", teamName: "My Team" };
        }
    }
}
const _automator = new YahooFantasyAutomator();
window.YahooFantasyAutomator = YahooFantasyAutomator;
