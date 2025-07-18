import React, { useState, useEffect } from 'react';
import uploadService from '../services/upload';
import './AudioExport.css';

function AudioExport({ audioFileId, segment = null }) {
    const [formats, setFormats] = useState([]);
    const [selectedFormat, setSelectedFormat] = useState('wav');
    const [selectedQuality, setSelectedQuality] = useState('high');
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState(null);
    const [exportResult, setExportResult] = useState(null);

    // Load supported formats
    useEffect(() => {
        const loadFormats = async () => {
            try {
                const supportedFormats = await uploadService.getSupportedFormats();
                setFormats(supportedFormats);

                // Set default format and quality
                if (supportedFormats.length > 0) {
                    setSelectedFormat(supportedFormats[0].id);
                    if (supportedFormats[0].qualities.length > 0) {
                        setSelectedQuality(supportedFormats[0].qualities[0].id);
                    }
                }
            } catch (error) {
                console.error('Error loading formats:', error);
                setExportError('Failed to load supported formats');
            }
        };

        loadFormats();
    }, []);

    // Get qualities for selected format
    const getQualities = () => {
        const format = formats.find(f => f.id === selectedFormat);
        return format ? format.qualities : [];
    };

    // Handle format change
    const handleFormatChange = (e) => {
        const newFormat = e.target.value;
        setSelectedFormat(newFormat);

        // Set default quality for this format
        const format = formats.find(f => f.id === newFormat);
        if (format && format.qualities.length > 0) {
            setSelectedQuality(format.qualities[0].id);
        }
    };

    // Handle quality change
    const handleQualityChange = (e) => {
        setSelectedQuality(e.target.value);
    };

    // Handle export button click
    const handleExport = async () => {
        if (!audioFileId) return;

        setIsExporting(true);
        setExportError(null);
        setExportResult(null);

        try {
            const result = await uploadService.exportAudio(
                audioFileId,
                selectedFormat,
                selectedQuality
            );

            setExportResult(result);
        } catch (error) {
            console.error('Export error:', error);
            setExportError(error.message || 'Failed to export audio');
        } finally {
            setIsExporting(false);
        }
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (!bytes) return 'Unknown';

        if (bytes < 1024) {
            return `${bytes} B`;
        } else if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        } else {
            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        }
    };

    return (
        <div className="audio-export">
            <h3>Export Audio</h3>

            {segment && (
                <div className="segment-info">
                    <p>
                        Exporting segment from {Math.floor(segment.start)}s to {Math.ceil(segment.end)}s
                        (Duration: {Math.ceil(segment.end - segment.start)}s)
                    </p>
                </div>
            )}

            <div className="export-options">
                <div className="export-option">
                    <label>Format:</label>
                    <select value={selectedFormat} onChange={handleFormatChange}>
                        {formats.map(format => (
                            <option key={format.id} value={format.id}>
                                {format.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="export-option">
                    <label>Quality:</label>
                    <select value={selectedQuality} onChange={handleQualityChange}>
                        {getQualities().map(quality => (
                            <option key={quality.id} value={quality.id}>
                                {quality.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="export-description">
                    {selectedFormat && (
                        <p>
                            {formats.find(f => f.id === selectedFormat)?.description || ''}
                            {' - '}
                            {getQualities().find(q => q.id === selectedQuality)?.description || ''}
                        </p>
                    )}
                </div>
            </div>

            <div className="export-actions">
                <button
                    className="export-button"
                    onClick={handleExport}
                    disabled={isExporting || !audioFileId}
                >
                    {isExporting ? 'Exporting...' : 'Export Audio'}
                </button>
            </div>

            {exportError && (
                <div className="export-error">
                    <p>{exportError}</p>
                </div>
            )}

            {exportResult && (
                <div className="export-result">
                    <h4>Export Complete</h4>
                    <div className="result-details">
                        <p>Format: {exportResult.format.toUpperCase()}</p>
                        <p>Quality: {exportResult.quality}</p>
                        <p>File Size: {formatFileSize(exportResult.file_size)}</p>
                    </div>
                    <div className="download-section">
                        <a
                            href={exportResult.url}
                            download={`exported_audio.${exportResult.format}`}
                            className="download-button"
                        >
                            Download File
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AudioExport;