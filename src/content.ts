// Content script for Yahoo Fantasy Basketball extension

interface StartActivePlayersResult {
  success: boolean
  message: string
  details?: string[]
  weeklyResults?: {
    totalDays: number
    processedDays: number
    daysWithExceptions: DayResult[]
    summary: string
  }
}

interface DayResult {
  date: string
  started: number
  exceptions: string[]
  needsManualSelection: boolean
}

class YahooFantasyAutomator {
  public setupMessageListener(): boolean {
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      if (request.action === 'processDay') {
        this.processCurrentDayLineup(request.date)
          .then((result) => {
            sendResponse(result)
          })
          .catch((error) => {
            sendResponse({
              success: false,
              message: 'Error processing day',
              details: [error.message],
            })
          })
        return true // Keep message channel open for async response
      }

      if (request.action === 'getLeagueInfo') {
        const leagueInfo = this.getLeagueInfo()
        sendResponse(leagueInfo)
        return true
      }

      return false
    })

    return true
  }

  private async processCurrentDayLineup(date: string): Promise<StartActivePlayersResult> {
    console.log(`Processing lineup for date: ${date}`)

    try {
      // Check if there are bench players with games
      if (!this.hasBenchPlayersWithGames()) {
        return {
          success: true,
          message: 'No bench players with games found',
          details: [],
        }
      }

      // Find and click the "Start Active Players" button
      const button = this.findStartActivePlayersButton()
      if (!button) {
        return {
          success: false,
          message: 'Start Active Players button not found',
          details: ['Button not found on page'],
        }
      }

      // Click the button
      button.click()
      console.log('Clicked Start Active Players button')

      // Handle the modal that appears
      await this.handleStartActivePlayersModal()

      // Get remaining bench players with games
      const remainingPlayers = this.getRemainingBenchPlayersWithGames()
      
      // Count total active players with games
      const totalActivePlayers = this.countTotalActivePlayersWithGames()

      const result: StartActivePlayersResult = {
        success: true,
        message: 'Successfully processed lineup',
        details: remainingPlayers.length > 0 ? [`Remaining bench players with games: ${remainingPlayers.join(', ')}`] : [],
        weeklyResults: {
          totalDays: 1,
          processedDays: 1,
          daysWithExceptions: remainingPlayers.length > 0 ? [{
            date,
            started: totalActivePlayers,
            exceptions: [`Remaining bench players with games: ${remainingPlayers.join(', ')}`],
            needsManualSelection: true
          }] : [],
          summary: remainingPlayers.length > 0 ? `Days needing manual review:\n${date}: ${totalActivePlayers} players with games\n⚠️ Remaining bench players with games: ${remainingPlayers.join(', ')}` : 'All active players started successfully! 🎉'
        }
      }

      // Update the started count with total active players
      result.weeklyResults!.daysWithExceptions[0].started = totalActivePlayers

      return result
    } catch (error) {
      console.error('Error processing lineup:', error)
      return {
        success: false,
        message: 'Error processing lineup',
        details: [(error as Error).message],
      }
    }
  }

  private hasBenchPlayersWithGames(): boolean {
    // Check if there are any bench players with game status links
    const benchPlayers = document.querySelectorAll('tr.bench[data-pos="BN"]')
    
    for (let i = 0; i < benchPlayers.length; i++) {
      const player = benchPlayers[i] as HTMLElement
      const gameStatus = player.querySelector('.ysf-game-status a')
      
      if (gameStatus) {
        console.log('Found bench player with game:', gameStatus.textContent)
        return true
      }
    }
    
    return false
  }

  private findStartActivePlayersButton(): HTMLElement | null {
    // Look for the "Start Active Players" button by class and text
    const buttons = document.querySelectorAll('button.start-active-players')
    
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i] as HTMLElement
      if (button.textContent?.includes('Start Active Players')) {
        console.log('Found Start Active Players button by class')
        return button
      }
    }

    // Fallback: look for button by text content
    const allButtons = document.querySelectorAll('button')
    for (let i = 0; i < allButtons.length; i++) {
      const button = allButtons[i] as HTMLElement
      if (button.textContent?.includes('Start Active Players')) {
        console.log('Found Start Active Players button by text')
        return button
      }
    }

    console.log('Start Active Players button not found')
    return null
  }

  private async handleStartActivePlayersModal(): Promise<void> {
    // Wait for modal to appear
    await this.delay(1000)

    // Look for confirm/ok button in modal
    const modalButtons = document.querySelectorAll('button')
    for (let i = 0; i < modalButtons.length; i++) {
      const button = modalButtons[i] as HTMLElement
      const text = button.textContent?.toLowerCase()
      if (text?.includes('confirm') || text?.includes('ok') || text?.includes('yes')) {
        console.log('Found modal confirm button:', text)
        button.click()
        await this.delay(500)
        return
      }
    }

    // If no confirm button found, try to close modal with Escape
    console.log('No confirm button found, trying Escape key')
    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
      which: 27,
      bubbles: true,
    })
    document.dispatchEvent(escapeEvent)
    await this.delay(500)
  }

  private getRemainingBenchPlayersWithGames(): string[] {
    const remainingPlayers: string[] = []
    const benchPlayers = document.querySelectorAll('tr.bench[data-pos="BN"]')
    
    for (let i = 0; i < benchPlayers.length; i++) {
      const player = benchPlayers[i] as HTMLElement
      const gameStatus = player.querySelector('.ysf-game-status a')
      
      if (gameStatus) {
        // Get player name from the row
        const nameCell = player.querySelector('td:nth-child(2)') // Assuming name is in 2nd column
        const playerName = nameCell?.textContent?.trim() || 'Unknown Player'
        remainingPlayers.push(playerName)
      }
    }
    
    console.log(`Found ${remainingPlayers.length} remaining bench players with games:`, remainingPlayers)
    return remainingPlayers
  }

  private countTotalActivePlayersWithGames(): number {
    // Count all players with games (both starting and bench)
    // Look for players with 'editable' class and opponent column has text
    const allPlayerRows = document.querySelectorAll('tr.editable[data-pos]')
    let totalActivePlayers = 0
    
    for (let i = 0; i < allPlayerRows.length; i++) {
      const row = allPlayerRows[i] as HTMLElement
      const oppCell = row.querySelector('td:nth-child(5)') // Opponent column (5th column)
      
      // Check if opponent column has text (indicating a game)
      if (oppCell && oppCell.textContent?.trim() && oppCell.textContent.trim() !== '') {
        totalActivePlayers++
      }
    }
    
    console.log(`Found ${totalActivePlayers} total active players with games`)
    return totalActivePlayers
  }

  private getLeagueInfo(): { leagueName: string; teamName: string } {
    try {
      const title = document.title
      // Get everything before the first pipe
      const pipeIndex = title.indexOf(' | ')
      if (pipeIndex === -1) {
        return { leagueName: 'Fantasy League', teamName: 'My Team' }
      }

      const beforePipe = title.substring(0, pipeIndex).trim()
      
      return { leagueName: beforePipe, teamName: '' }
    } catch (error) {
      console.error('Error getting league info:', error)
      return { leagueName: 'Fantasy League', teamName: 'My Team' }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Initialize the automator
const automator = new YahooFantasyAutomator()
automator.setupMessageListener()