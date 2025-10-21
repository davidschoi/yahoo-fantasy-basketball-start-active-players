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
declare class WeeklyProcessor {
    private isProcessing;
    private originalUrl;
    private results;
    constructor();
    private setupMessageListener;
    processWeeklyLineups(): Promise<WeeklyResults>;
    private navigateToDate;
    private waitForTabLoad;
    private handleDayResult;
    private generateWeeklySummary;
    private getCurrentDate;
    private parseLocalDate;
    private formatDate;
    private delay;
}
declare const _processor: WeeklyProcessor;
