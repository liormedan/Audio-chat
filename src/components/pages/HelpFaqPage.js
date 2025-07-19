import React from 'react';
import './Pages.css';

function HelpFaqPage() {
  return (
    <div className="settings-page">
      <div className="settings-section">
        <h4>Frequently Asked Questions</h4>
      </div>
      
      <div className="faq-item">
        <h5>What is AudioChat?</h5>
        <p>
          AudioChat is a multi-model chat interface that allows you to interact with various large language models (LLMs) and includes audio capabilities for voice input and output.
        </p>
      </div>
      
      <div className="faq-item">
        <h5>Which LLM providers are supported?</h5>
        <p>
          AudioChat currently supports OpenAI (GPT models), Anthropic (Claude), Google (Gemini), and local LLMs through Ollama or similar services.
        </p>
      </div>
      
      <div className="faq-item">
        <h5>How do I set up my API keys?</h5>
        <p>
          Go to the API Keys section in Settings and enter your API keys for each provider. Your keys are stored locally in your browser and are never sent to our servers.
        </p>
      </div>
      
      <div className="faq-item">
        <h5>How do I use the audio features?</h5>
        <p>
          Click the microphone icon in the message input to start recording. Your voice will be transcribed and sent to the selected LLM. You can also enable text-to-speech for responses in the Appearance settings.
        </p>
      </div>
      
      <div className="faq-item">
        <h5>Is my conversation history saved?</h5>
        <p>
          Yes, your conversations are saved locally in your browser. You can clear your history at any time from the sidebar menu.
        </p>
      </div>
      
      <div className="faq-item">
        <h5>How can I export my conversations?</h5>
        <p>
          You can export individual conversations or your entire history as JSON or text files using the export option in the chat menu.
        </p>
      </div>
      
      <div className="settings-section">
        <h4>Support</h4>
        <p>
          If you need further assistance or want to report a bug, please contact us at:
        </p>
        <a href="mailto:support@audiochat.example.com" className="support-link">
          support@audiochat.example.com
        </a>
        
        <div className="version-info">
          AudioChat v1.0.0
        </div>
      </div>
    </div>
  );
}

export default HelpFaqPage;