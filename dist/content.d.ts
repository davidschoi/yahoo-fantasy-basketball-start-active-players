interface DayResult {
    date: string;
    started: number;
    exceptions: string[];
    needsManualSelection: boolean;
}
declare class YahooFantasyAutomator {
    constructor();
    private setupMessageListener;
    private processCurrentDayLineup;
    private hasBenchPlayersWithGames;
    private findStartActivePlayersButton;
    private handleStartActivePlayersModal;
    private getRemainingBenchPlayersWithGames;
    private countTotalActivePlayersWithGames;
    private getCurrentDate;
    private formatDate;
    private delay;
    private getLeagueInfo;
}
declare const automator: YahooFantasyAutomator;
