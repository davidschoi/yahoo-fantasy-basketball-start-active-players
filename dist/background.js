"use strict";
class WeeklyProcessor {
    constructor() {
        this.isProcessing = false;
        this.originalUrl = "";
        this.results = {
            totalDays: 7,
            processedDays: 0,
            daysWithExceptions: [],
            summary: "",
        };
        this.setupMessageListener();
    }
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
            if (request.action === "processWeeklyLineups") {
                this.processWeeklyLineups()
                    .then((results) => {
                    sendResponse({ success: true, weeklyResults: results });
                })
                    .catch((error) => {
                    sendResponse({ success: false, error: error.message });
                });
                return true;
            }
            if (request.action === "getDayResult") {
                this.handleDayResult(request.dayResult);
                sendResponse({ success: true });
                return true;
            }
            return false;
        });
    }
    async processWeeklyLineups() {
        if (this.isProcessing) {
            throw new Error("Weekly processing already in progress");
        }
        this.isProcessing = true;
        this.results = {
            totalDays: 7,
            processedDays: 0,
            daysWithExceptions: [],
            summary: "",
        };
        try {
            const [tab] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            });
            if (!tab || !tab.id) {
                throw new Error("No active tab found");
            }
            this.originalUrl = tab.url || "";
            const currentDate = this.getCurrentDate(tab.url || "");
            const startDate = new Date(currentDate);
            const currentDay = startDate.getDay();
            const totalDays = currentDay === 0 ? 1 : (7 - currentDay + 1);
            console.log(`Current day: ${currentDay}, Total days to process: ${totalDays}`);
            for (let i = 0; i < totalDays; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                console.log(`Processing day ${i}: ${date.toDateString()} (day ${date.getDay()})`);
                const dateStr = this.formatDate(date);
                console.log(`Navigating to date: ${dateStr}`);
                try {
                    await this.navigateToDate(tab.id, dateStr);
                    await this.delay(3000);
                    const response = await chrome.tabs.sendMessage(tab.id, {
                        action: "processDay",
                        date: dateStr,
                    });
                    if (response?.success) {
                        this.results.processedDays++;
                        if (response.dayResult.needsManualSelection ||
                            response.dayResult.exceptions.length > 0) {
                            this.results.daysWithExceptions.push(response.dayResult);
                        }
                    }
                }
                catch (error) {
                    console.error(`Error processing ${dateStr}:`, error);
                    this.results.daysWithExceptions.push({
                        date: dateStr,
                        started: 0,
                        exceptions: [`Error: ${error.message}`],
                        needsManualSelection: true,
                    });
                }
            }
            this.results.summary = this.generateWeeklySummary(this.results);
            console.log(`Weekly lineup processing completed! 📊`);
            console.log(this.results.summary);
            if (this.originalUrl) {
                await chrome.tabs.update(tab.id, { url: this.originalUrl });
                console.log(`Navigated back to original URL: ${this.originalUrl}`);
            }
            return this.results;
        }
        finally {
            this.isProcessing = false;
        }
    }
    async navigateToDate(tabId, dateStr) {
        const tab = await chrome.tabs.get(tabId);
        const currentUrl = new URL(tab.url || "");
        currentUrl.searchParams.set("date", dateStr);
        await chrome.tabs.update(tabId, {
            url: currentUrl.toString(),
        });
        await this.waitForTabLoad(tabId);
    }
    async waitForTabLoad(tabId) {
        return new Promise((resolve) => {
            const listener = (updatedTabId, changeInfo) => {
                if (updatedTabId === tabId && changeInfo.status === "complete") {
                    chrome.tabs.onUpdated.removeListener(listener);
                    resolve();
                }
            };
            chrome.tabs.onUpdated.addListener(listener);
        });
    }
    handleDayResult(dayResult) {
        this.results.processedDays++;
        if (dayResult.needsManualSelection || dayResult.exceptions.length > 0) {
            this.results.daysWithExceptions.push(dayResult);
        }
    }
    generateWeeklySummary(results) {
        const daysWithRemainingBench = results.daysWithExceptions.filter(day => day.exceptions.some(exception => exception.includes("Remaining bench players")));
        if (daysWithRemainingBench.length === 0) {
            return "All active players started successfully! 🎉";
        }
        let summary = "Days needing manual review:\n";
        daysWithRemainingBench.forEach((day) => {
            const remainingPlayers = day.exceptions
                .filter(e => e.includes("Remaining bench players"))
                .map(e => e.replace("Remaining bench players with games: ", ""))
                .join(", ");
            summary += `${day.date}: ${day.started} players with games\n`;
            summary += `⚠️ Remaining bench players with games: ${remainingPlayers}\n`;
        });
        return summary;
    }
    getCurrentDate(url) {
        try {
            const urlObj = new URL(url);
            const dateParam = urlObj.searchParams.get("date");
            if (dateParam) {
                return this.parseLocalDate(dateParam);
            }
        }
        catch {
        }
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    parseLocalDate(ymd) {
        const parts = ymd.split("-");
        const y = parseInt(parts[0] || "0", 10);
        const m = parseInt(parts[1] || "0", 10);
        const d = parseInt(parts[2] || "1", 10);
        return new Date(y, (m ? m - 1 : 0), d);
    }
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
const _processor = new WeeklyProcessor();
