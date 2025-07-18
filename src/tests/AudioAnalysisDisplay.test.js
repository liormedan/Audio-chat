import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AudioAnalysisDisplay from '../components/AudioAnalysisDisplay';

describe('AudioAnalysisDisplay Component', () => {
  const mockAudioAnalysis = {
    duration: 180.5,
    sample_rate: 44100,
    peak_level: 0.85,
    rms_level: 0.25,
    crest_factor: 3.4,
    spectral_centroid: 2500,
    spectral_rolloff: 8000,
    estimated_tempo: 120,
    estimated_key: 'C',
    is_clipping: false,
    noise_floor: 0.02
  };

  test('renders without crashing', () => {
    render(<AudioAnalysisDisplay audioAnalysis={mockAudioAnalysis} />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  test('displays overview tab by default', () => {
    render(<AudioAnalysisDisplay audioAnalysis={mockAudioAnalysis} />);
    expect(screen.getByText('Quality')).toBeInTheDocument();
    expect(screen.getByText('Harmonic Content')).toBeInTheDocument();
    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.getByText('Sample Rate')).toBeInTheDocument();
  });

  test('switches to spectral tab when clicked', () => {
    render(<AudioAnalysisDisplay audioAnalysis={mockAudioAnalysis} />);
    
    fireEvent.click(screen.getByText('Spectral'));
    
    expect(screen.getByText('Spectral Centroid')).toBeInTheDocument();
    expect(screen.getByText('Spectral Rolloff')).toBeInTheDocument();
    expect(screen.getByText('Noise Floor')).toBeInTheDocument();
  });

  test('switches to dynamics tab when clicked', () => {
    render(<AudioAnalysisDisplay audioAnalysis={mockAudioAnalysis} />);
    
    fireEvent.click(screen.getByText('Dynamics'));
    
    expect(screen.getByText('RMS Level')).toBeInTheDocument();
    expect(screen.getByText('Peak Level')).toBeInTheDocument();
    expect(screen.getByText('Crest Factor')).toBeInTheDocument();
    expect(screen.getByText('Clipping')).toBeInTheDocument();
  });

  test('switches to musical tab when clicked', () => {
    render(<AudioAnalysisDisplay audioAnalysis={mockAudioAnalysis} />);
    
    fireEvent.click(screen.getByText('Musical'));
    
    expect(screen.getByText('Estimated Key')).toBeInTheDocument();
    expect(screen.getByText('Estimated Tempo')).toBeInTheDocument();
  });

  test('displays correct duration format', () => {
    render(<AudioAnalysisDisplay audioAnalysis={mockAudioAnalysis} />);
    expect(screen.getByText('03:00')).toBeInTheDocument();
  });

  test('displays correct sample rate', () => {
    render(<AudioAnalysisDisplay audioAnalysis={mockAudioAnalysis} />);
    expect(screen.getByText('44100 Hz')).toBeInTheDocument();
  });

  test('displays correct peak level', () => {
    render(<AudioAnalysisDisplay audioAnalysis={mockAudioAnalysis} />);
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  test('displays correct clipping status', () => {
    render(<AudioAnalysisDisplay audioAnalysis={mockAudioAnalysis} />);
    
    fireEvent.click(screen.getByText('Dynamics'));
    expect(screen.getByText('No')).toBeInTheDocument();
    
    // Test with clipping
    const clippingAnalysis = { ...mockAudioAnalysis, is_clipping: true };
    render(<AudioAnalysisDisplay audioAnalysis={clippingAnalysis} />);
    
    fireEvent.click(screen.getByText('Dynamics'));
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  test('returns null when no analysis data', () => {
    const { container } = render(<AudioAnalysisDisplay audioAnalysis={null} />);
    expect(container.firstChild).toBeNull();
  });
});