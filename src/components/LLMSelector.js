import React from 'react';
import './LLMSelector.css';

function LLMSelector({ llms, selected, onSelect }) {
  return (
    <div className="llm-selector">
      <label htmlFor="llm-select">Model:</label>
      <select 
        id="llm-select"
        value={selected.id} 
        onChange={(e) => onSelect(llms.find(llm => llm.id === e.target.value))}
        className="llm-select"
      >
        {llms.map(llm => (
          <option key={llm.id} value={llm.id}>
            {llm.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default LLMSelector;