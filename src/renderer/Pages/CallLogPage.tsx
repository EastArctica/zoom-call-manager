import { useState, useEffect } from 'react';
import { useSettings, CallLogEntry } from '../context/SettingsContext';
import './CallLogPage.css';

export interface CallLogPageProps {

};

export default function CallLogPage({ } : CallLogPageProps) {
  const { settings } = useSettings();
  const [callLog, setCallLog] = useState<CallLogEntry[]>([]);
  const [filterMatched, setFilterMatched] = useState<string>('all'); // 'all', 'matched', 'unmatched'
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Load call log from settings
  useEffect(() => {
    if (settings.callLog) {
      setCallLog(settings.callLog);
    }
  }, [settings.callLog]);

  // Format date from timestamp
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Filter call log based on matched status and search term
  const filteredCallLog = callLog.filter((entry) => {
    // Filter by matched status
    if (filterMatched === 'matched' && !entry.matched) return false;
    if (filterMatched === 'unmatched' && entry.matched) return false;
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        entry.to.toLowerCase().includes(searchLower) ||
        entry.callerID.toLowerCase().includes(searchLower) ||
        entry.url.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  return (
    <div className="call-log-container">
      <h1 className="call-log-title">Call Log</h1>
      
      <div className="call-log-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search calls..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-input search-input"
          />
        </div>
        
        <div className="filter-container">
          <label htmlFor="filter-matched">Filter:</label>
          <select
            id="filter-matched"
            value={filterMatched}
            onChange={(e) => setFilterMatched(e.target.value)}
            className="select-input"
          >
            <option value="all">All Calls</option>
            <option value="matched">Matched Calls</option>
            <option value="unmatched">Unmatched Calls</option>
          </select>
        </div>
      </div>
      
      <div className="table-container">
        <table className="calls-table">
          <thead>
            <tr>
              <th>Date/Time</th>
              <th>To</th>
              <th>Caller ID</th>
              <th>URL</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredCallLog.length > 0 ? (
              filteredCallLog.map((call, index) => (
                <tr key={index}>
                  <td>{formatDate(call.at)}</td>
                  <td>{call.to}</td>
                  <td>{call.callerID}</td>
                  <td className="url-cell">
                    <a href={call.url} target="_blank" rel="noopener noreferrer">
                      {call.url}
                    </a>
                  </td>
                  <td>
                    <span className={`status-badge ${call.matched ? 'matched' : 'unmatched'}`}>
                      {call.matched ? 'Matched' : 'Unmatched'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="empty-table-message">
                  {callLog.length === 0
                    ? 'No calls in the log yet.'
                    : 'No calls match your current filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
