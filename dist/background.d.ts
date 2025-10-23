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
declare const STATUS_MESSAGES: Record<ProcessingStatus, string>;
declare class WeeklyProcessor {
    private isProcessing;
    private originalUrl;
    private results;
    private currentStatus;
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
    private resetState;
}
declare const processor: WeeklyProcessor;
