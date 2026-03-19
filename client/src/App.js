import { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import InputScreen from './components/InputScreen';
import ResultsScreen from './components/ResultsScreen';
import EmptyScreen from './components/EmptyScreen';
import LoadingScreen from './components/LoadingScreen';
import HistoryScreen from './components/HistoryScreen';
import AnalyticsScreen from './components/AnalyticsScreen';
import AutomationsScreen from './components/AutomationsScreen';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState('input');
  const [schedulerResult, setSchedulerResult] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  const handleResult = (result, sid) => {
    setSchedulerResult(result);
    setSessionId(sid);
    setScreen(result.slots.length > 0 ? 'results' : 'empty');
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', paddingTop: '56px' }}>
        <Sidebar screen={screen} setScreen={setScreen} />
        <main style={{ marginLeft: '220px', flex: 1, minHeight: 'calc(100vh - 56px)', padding: '40px' }}>
          {screen === 'input' && <InputScreen setScreen={setScreen} onResult={handleResult} />}
          {screen === 'loading' && <LoadingScreen />}
          {screen === 'results' && <ResultsScreen result={schedulerResult} sessionId={sessionId} setScreen={setScreen} />}
          {screen === 'empty' && <EmptyScreen result={schedulerResult} setScreen={setScreen} />}
          {screen === 'history' && <HistoryScreen setScreen={setScreen} onLoadResult={handleResult} />}
          {screen === 'analytics' && <AnalyticsScreen />}
          {screen === 'automations' && <AutomationsScreen />}
        </main>
      </div>
    </div>
  );
}
