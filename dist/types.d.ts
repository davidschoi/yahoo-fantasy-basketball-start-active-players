export type ProcessingStatus = "idle" | "processing" | "completed" | "error";
export interface WeeklyResults {
    totalDays: number;
    processedDays: number;
    daysWithExceptions: DayResult[];
    summary: string;
}
export interface DayResult {
    date: string;
    started: number;
    exceptions: string[];
    needsManualSelection: boolean;
}
export declare const STATUS_MESSAGES: Record<ProcessingStatus, string>;
