import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';

export const FileUpload: React.FC<{ onUploadSuccess?: () => void }> = ({ onUploadSuccess }) => {
  const { selectDataset, refreshDatasets, setNotification, setError } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadError('Only CSV files (.csv) are supported.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const summary = await api.uploadDataset(file);
      setNotification(`Dataset '${summary.original_name}' uploaded and parsed successfully!`);
      await refreshDatasets();
      await selectDataset(summary.id);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err: any) {
      const errDetail = err.response?.data?.detail;
      if (typeof errDetail === 'object' && errDetail.errors) {
        setUploadError(errDetail.errors.join(' '));
      } else {
        setUploadError(errDetail || 'Failed to upload CSV file.');
      }
      setError(errDetail || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
            : 'border-slate-700/80 bg-slate-900/40 hover:border-slate-500 hover:bg-slate-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
            {isUploading ? (
              <div className="w-8 h-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>

          <div>
            <p className="text-base font-semibold text-white">
              {isUploading ? 'Validating and parsing CSV...' : 'Click to upload or drag & drop custom CSV'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Arbitrary tabular CSV datasets up to 50MB. Auto-detects columns, encoding, missing values & types.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300">
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
            <span>Accepts any structured table with headers</span>
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="mt-4 p-4 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-3 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-100">Upload Validation Notice</p>
            <p className="mt-0.5 text-rose-300">{uploadError}</p>
          </div>
        </div>
      )}
    </div>
  );
};
