import React from 'react';
import { UploadCloud, Sparkles, Database, FileSpreadsheet } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FileUpload } from '../components/dataset/FileUpload';
import { SampleDataButtons } from '../components/dataset/SampleDataButtons';
import { DatasetMetadataCard } from '../components/dataset/DatasetMetadataCard';
import { DataPreviewTable } from '../components/dataset/DataPreviewTable';

export const UploadPage: React.FC = () => {
  const { activeDataset } = useApp();

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Upload & Sample Section */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dataset Upload & Ingestion</h1>
          <p className="text-xs text-slate-400 mt-1">
            Upload any custom tabular CSV or load our pre-configured classification / regression samples
          </p>
        </div>

        <FileUpload />

        <div className="pt-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Or Load Sample Demonstration Dataset
          </p>
          <SampleDataButtons />
        </div>
      </div>

      {/* Dataset Metadata & Records Explorer */}
      {activeDataset && (
        <div className="space-y-6 pt-4 border-t border-slate-800/80">
          <DatasetMetadataCard />
          <DataPreviewTable />
        </div>
      )}
    </div>
  );
};
