import GameBoard from './components/GameBoard';
import { ThemeProvider } from './contexts/ThemeContext';
import './styles/App.css';

function App() {
  return (
    <ThemeProvider>
      <div className="app">
        <GameBoard />
      </div>
    </ThemeProvider>
  );
}

export default App;
