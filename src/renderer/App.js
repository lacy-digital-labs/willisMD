import React from 'react';

function App() {
  return React.createElement('div', { style: { padding: '20px' } }, 
    React.createElement('h1', null, 'Hello World'),
    React.createElement('p', null, 'Minimal React app - no hooks, no state, no effects')
  );
}

export default App;