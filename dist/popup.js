"use strict";
document.addEventListener("DOMContentLoaded", () => {
    const startActiveBtn = document.getElementById("startActiveBtn");
    const loading = document.getElementById("loading");
    const results = document.getElementById("results");
    const statusDot = document.getElementById("statusDot");
    const statusText = document.getElementById("statusText");
    const leagueInfo = document.getElementById("leagueInfo");
    startActiveBtn.addEventListener("click", startActivePlayers);
    initializeHideableInstructions();
    checkPageStatus().then(() => {
        restoreStateFromBackground();
    });
    async function restoreStateFromBackground() {
        try {
            const [tab] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            });
            if (!tab || !tab.url?.includes("basketball.fantasysports.yahoo.com")) {
                return;
            }
            const response = await chrome.runtime.sendMessage({
                action: "getCurrentState",
            });
            if (response.success && response.state) {
                const state = response.state;
                if (state.isProcessing) {
                    setStatus("processing", state.statusMessage);
                    startActiveBtn.disabled = true;
                    showLoading(true);
                }
                else if (state.status === "completed" && state.results.summary) {
                    setStatus("completed", state.statusMessage);
                    startActiveBtn.disabled = false;
                    showLoading(false);
                    await showWeeklyResults("Weekly lineup processing completed!", state.results);
                }
                else if (state.status === "error") {
                    setStatus("error", state.statusMessage);
                    startActiveBtn.disabled = false;
                    showLoading(false);
                    showResults("error", state.statusMessage);
                }
            }
        }
        catch (error) {
            console.error("Error restoring state from background:", error);
        }
    }
    async function checkPageStatus() {
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
            if (!tab.url?.includes("basketball.fantasysports.yahoo.com") &&
                !tab.url?.includes("fantasysports.yahoo.com")) {
                setStatus("offline", "Not on Yahoo Fantasy page");
                startActiveBtn.disabled = true;
                return;
            }
            const urlPattern = /basketball\.fantasysports\.yahoo\.com\/[a-z]+\/\d+\/\d+/;
            if (!urlPattern.test(tab.url || "")) {
                setStatus("offline", "Please navigate to My Team page");
                startActiveBtn.disabled = true;
                return;
            }
            await updateLeagueInfo(tab.id);
            setStatus("online", "Ready to start active players");
            startActiveBtn.disabled = false;
        }
        catch (error) {
            console.error("Error checking page status:", error);
            setStatus("offline", "Error checking page");
            startActiveBtn.disabled = true;
        }
    }
    async function updateLeagueInfo(tabId) {
        try {
            const response = await chrome.tabs.sendMessage(tabId, {
                action: "getLeagueInfo",
            });
            if (response?.leagueName) {
                leagueInfo.textContent = response.leagueName;
            }
            else {
                leagueInfo.textContent = "Yahoo Fantasy Basketball";
            }
        }
        catch (error) {
            leagueInfo.textContent = "Yahoo Fantasy Basketball";
        }
    }
    function setStatus(status, message) {
        statusDot.className = `status-dot ${status}`;
        statusText.textContent = message;
    }
    async function startActivePlayers() {
        try {
            const [tab] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            });
            if (!tab || !tab.url?.includes("basketball.fantasysports.yahoo.com")) {
                setStatus("offline", "Please navigate to Yahoo Fantasy Basketball page");
                startActiveBtn.disabled = true;
                return;
            }
            showLoading(true);
            hideResults();
            startActiveBtn.disabled = true;
            setStatus("processing", "Active players processing...");
            if (!tab || !tab.id) {
                throw new Error("No active tab found");
            }
            const response = (await chrome.runtime.sendMessage({
                action: "processWeeklyLineups",
            }));
            if (response.success) {
                await showWeeklyResults(response.message || "Weekly lineup processing completed!", response.weeklyResults);
                setStatus("completed", "Active players completed");
            }
            else {
                showResults("error", response.error || "Failed to process weekly lineups");
                setStatus("error", "Active players error");
            }
        }
        catch (error) {
            console.error("Error starting active players:", error);
            showResults("error", `Error: ${error.message}`);
            setStatus("error", "Active players error");
        }
        finally {
            showLoading(false);
            startActiveBtn.disabled = false;
        }
    }
    function showLoading(show) {
        loading.classList.toggle("show", show);
    }
    function showResults(type, message, details) {
        results.className = `results show ${type}`;
        results.innerHTML = `
      <div style="font-weight: 500;">${message}</div>
      ${details ? `<div style="font-size: 11px; opacity: 0.8;">${details.join("<br>")}</div>` : ""}
    `;
    }
    async function showWeeklyResults(message, weeklyResults) {
        results.className = `results show success`;
        let detailsHtml = "";
        if (weeklyResults && weeklyResults.daysWithExceptions.length > 0) {
            const [tab] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            });
            let baseUrl = "";
            if (tab?.url) {
                try {
                    const url = new URL(tab.url);
                    const pathParts = url.pathname.split('/');
                    if (pathParts.length >= 4 && pathParts[1] === 'nba') {
                        const leagueId = pathParts[2];
                        const teamId = pathParts[3];
                        baseUrl = `https://basketball.fantasysports.yahoo.com/nba/${leagueId}/${teamId}`;
                    }
                }
                catch (error) {
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
        if (weeklyResults && weeklyResults.daysWithExceptions.length > 0) {
            const datePills = results.querySelectorAll('.date-pill');
            datePills.forEach((pill) => {
                pill.addEventListener('click', (e) => {
                    e.preventDefault();
                    const url = pill.href;
                    chrome.tabs.update({ url });
                });
            });
        }
    }
    function hideResults() {
        results.classList.remove("show");
    }
    function initializeHideableInstructions() {
        const instructions = document.getElementById("instructions");
        const hideButton = document.getElementById("hideInstructionsBtn");
        if (!instructions || !hideButton) {
            return;
        }
        const isHidden = localStorage.getItem("hideInstructions") === "true";
        if (isHidden) {
            instructions.style.display = "none";
        }
        hideButton.addEventListener("click", () => {
            instructions.style.display = "none";
            localStorage.setItem("hideInstructions", "true");
        });
    }
    setInterval(checkPageStatus, 5000);
});
