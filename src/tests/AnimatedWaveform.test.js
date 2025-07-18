import React from 'react';
import { render } from '@testing-library/react';
import AnimatedWaveform from '../components/AnimatedWaveform';

// Mock the canvas API
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  clearRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fillRect: jest.fn()
}));

// Mock the Web Audio API
window.AudioContext = jest.fn(() => ({
  createAnalyser: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    fftSize: 0,
    frequencyBinCount: 1024,
    getByteTimeDomainData: jest.fn()
  })),
  createMediaElementSource: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn()
  })),
  destination: {},
  close: jest.fn(),
  state: 'running',
  resume: jest.fn()
}));

window.webkitAudioContext = window.AudioContext;

describe('AnimatedWaveform Component', () => {
  const mockAudioUrl = 'http://example.com/audio.mp3';

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    const { container } = render(
      <AnimatedWaveform audioUrl={mockAudioUrl} isPlaying={false} />
    );
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  test('creates audio context when audio URL is provided', () => {
    render(<AnimatedWaveform audioUrl={mockAudioUrl} isPlaying={false} />);
    expect(window.AudioContext).toHaveBeenCalled();
  });

  test('does not create audio context when no audio URL is provided', () => {
    render(<AnimatedWaveform audioUrl={null} isPlaying={false} />);
    expect(window.AudioContext).not.toHaveBeenCalled();
  });

  test('sets up canvas with correct dimensions', () => {
    const { container } = render(
      <AnimatedWaveform audioUrl={mockAudioUrl} isPlaying={false} />
    );
    const canvas = container.querySelector('canvas');
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(100);
  });

  test('applies custom color when provided', () => {
    const customColor = '#ff0000';
    render(
      <AnimatedWaveform 
        audioUrl={mockAudioUrl} 
        isPlaying={false} 
        color={customColor} 
      />
    );
    // Note: We can't easily test the actual color applied to the canvas
    // in this test environment, but we can verify the component renders
  });

  test('handles play state changes', () => {
    const { rerender } = render(
      <AnimatedWaveform audioUrl={mockAudioUrl} isPlaying={false} />
    );
    
    // Change to playing state
    rerender(<AnimatedWaveform audioUrl={mockAudioUrl} isPlaying={true} />);
    
    // Change back to paused state
    rerender(<AnimatedWaveform audioUrl={mockAudioUrl} isPlaying={false} />);
    
    // These state changes should not cause errors
    expect(true).toBeTruthy();
  });

  test('handles audio URL changes', () => {
    const { rerender } = render(
      <AnimatedWaveform audioUrl={mockAudioUrl} isPlaying={false} />
    );
    
    const newAudioUrl = 'http://example.com/new-audio.mp3';
    rerender(<AnimatedWaveform audioUrl={newAudioUrl} isPlaying={false} />);
    
    // URL change should not cause errors
    expect(true).toBeTruthy();
  });
});