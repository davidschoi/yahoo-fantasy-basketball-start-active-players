import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './popup.css'

interface WeeklyResults {
  totalDays: number
  processedDays: number
  daysWithExceptions: DayResult[]
  summary: string
}

interface DayResult {
  date: string
  started: number
  exceptions: string[]
  needsManualSelection: boolean
}

interface Status {
  type: 'online' | 'offline' | 'processing' | 'completed' | 'error'
  message: string
}

const App: React.FC = () => {
  const [status, setStatus] = useState<Status>({ type: 'offline', message: 'Checking page...' })
  const [leagueInfo, setLeagueInfo] = useState<string>('Yahoo Fantasy Basketball')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [results, setResults] = useState<WeeklyResults | null>(null)
  const [showInstructions, setShowInstructions] = useState<boolean>(() => {
    return localStorage.getItem('hideInstructions') !== 'true'
  })

  useEffect(() => {
    checkPageStatus()
    
    // Auto-refresh status every 5 seconds
    const interval = setInterval(checkPageStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const checkPageStatus = async (): Promise<void> => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      })

      if (!tab) {
        setStatus({ type: 'offline', message: 'No active tab found' })
        return
      }

      if (
        !tab.url?.includes('basketball.fantasysports.yahoo.com') &&
        !tab.url?.includes('fantasysports.yahoo.com')
      ) {
        setStatus({ type: 'offline', message: 'Not on Yahoo Fantasy page' })
        return
      }

      // Check for Yahoo Fantasy Basketball roster page URL pattern
      const urlPattern = /basketball\.fantasysports\.yahoo\.com\/[a-z]+\/\d+\/\d+/
      if (!urlPattern.test(tab.url || '')) {
        setStatus({ type: 'offline', message: 'Please navigate to roster page' })
        return
      }

      // Get league and team information
      await updateLeagueInfo(tab.id!)

      setStatus({ type: 'online', message: 'Ready to start active players' })
    } catch (error) {
      console.error('Error checking page status:', error)
      setStatus({ type: 'offline', message: 'Error checking page' })
    }
  }

  const updateLeagueInfo = async (tabId: number): Promise<void> => {
    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'getLeagueInfo',
      })

      if (response?.leagueName) {
        setLeagueInfo(response.leagueName)
      } else {
        setLeagueInfo('Yahoo Fantasy Basketball')
      }
    } catch (error) {
      console.error('Error getting league info:', error)
      setLeagueInfo('Yahoo Fantasy Basketball')
    }
  }

  const startActivePlayers = async (): Promise<void> => {
    try {
      setIsLoading(true)
      setResults(null)
      setStatus({ type: 'processing', message: 'Active players processing...' })

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      })

      if (!tab || !tab.id) {
        throw new Error('No active tab found')
      }

      const response = (await chrome.runtime.sendMessage({
        action: 'processWeeklyLineups',
      })) as {
        success: boolean
        message?: string
        error?: string
        weeklyResults?: WeeklyResults
      }

      if (response.success) {
        setResults(response.weeklyResults || null)
        setStatus({ type: 'completed', message: 'Active players completed' })
      } else {
        setStatus({ type: 'error', message: 'Active players error' })
      }
    } catch (error) {
      console.error('Error starting active players:', error)
      setStatus({ type: 'error', message: 'Active players error' })
    } finally {
      setIsLoading(false)
    }
  }

  const hideInstructions = (): void => {
    setShowInstructions(false)
    localStorage.setItem('hideInstructions', 'true')
  }

  const navigateToDate = (dateUrl: string): void => {
    chrome.tabs.update({ url: dateUrl })
  }

  const getStatusDotColor = (type: Status['type']): string => {
    switch (type) {
      case 'online':
      case 'completed':
        return 'bg-success'
      case 'processing':
        return 'bg-warning animate-pulse'
      case 'error':
        return 'bg-error'
      default:
        return 'bg-error'
    }
  }

  return (
    <div className="w-full h-full bg-white">
      {/* Header */}
      <div className="bg-primary-500 text-white p-4">
        <h1 className="text-lg font-bold">{leagueInfo}</h1>
        <div className="flex items-center mt-2">
          <div className={`w-2 h-2 rounded-full mr-2 ${getStatusDotColor(status.type)}`}></div>
          <span className="text-sm">{status.message}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Instructions */}
        {showInstructions && (
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-sm">How to use:</h4>
              <button
                onClick={hideInstructions}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Hide
              </button>
            </div>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Navigate to your team's roster page</li>
              <li>• Click "Start Active Players" to automatically process the entire week</li>
              <li>• The extension will navigate through each day and start active players</li>
            </ul>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={startActivePlayers}
          disabled={status.type !== 'online' || isLoading}
          className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white font-bold py-3 px-4 rounded-full transition-colors"
        >
          {isLoading ? 'Processing...' : 'Start Active Players'}
        </button>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="text-center mt-4">
            <div className="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="font-semibold mb-2">Weekly lineup processing completed!</div>
            
            {results.daysWithExceptions.length > 0 && (
              <div className="text-xs">
                <div className="font-semibold mb-2 text-warning">⚠️ Days needing manual review:</div>
                
                {results.daysWithExceptions.map((day, index) => {
                  const dateUrl = `https://basketball.fantasysports.yahoo.com/nba/${window.location.pathname.split('/')[2]}/${window.location.pathname.split('/')[3]}?date=${day.date}`
                  
                  return (
                    <div key={index} className="mb-2 p-2 bg-white border border-gray-200 rounded text-xs">
                      <div className="font-semibold text-gray-800">
                        <button
                          onClick={() => navigateToDate(dateUrl)}
                          className="inline-block px-2 py-1 bg-primary-500 text-white rounded-full hover:bg-gray-100 hover:text-primary-500 transition-colors"
                        >
                          {day.date}
                        </button>
                        : {day.started} players have games
                      </div>
                      {day.exceptions.length > 0 && (
                        <div className="text-error text-xs mt-1">
                          ⚠️ {day.exceptions.join(', ')}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<App />)
}
