import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileImage, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Image as ImageIcon,
  FolderOpen,
  FileCheck,
  Zap,
  Info
} from 'lucide-react';
import { ReceiptDocument } from '../types';

interface UploadAreaProps {
  onProcessCustomFile: (file: File) => void;
  onSelectPresetReceipt: (receiptId: string) => void;
  presetReceipts: ReceiptDocument[];
  isProcessing: boolean;
}

export const UploadArea: React.FC<UploadAreaProps> = ({
  onProcessCustomFile,
  onSelectPresetReceipt,
  presetReceipts,
  isProcessing,
}) => {
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setValidationError(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setValidationError('Invalid file format. Only JPEG and PNG thermal receipt images are supported (.webp is not supported).');
      setSelectedFile(null);
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setValidationError('File size exceeds 15MB limit.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleStartProcess = () => {
    if (selectedFile) {
      onProcessCustomFile(selectedFile);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-teal-500 bg-teal-50/50 scale-[0.99]'
            : selectedFile
            ? 'border-emerald-400 bg-emerald-50/30'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/jpg"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          {selectedFile ? (
            <div className="flex items-center gap-3 bg-white p-3 rounded-md border border-emerald-300 shadow-xs">
              <FileCheck className="w-6 h-6 text-emerald-600" />
              <div className="text-left">
                <span className="font-mono font-bold text-xs text-slate-800 block">
                  {selectedFile.name}
                </span>
                <span className="text-[11px] text-slate-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Image Validated (Simulated pipeline prototype)
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-teal-600 mb-1 border border-slate-200">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1.5 justify-center">
                <p className="text-xs sm:text-sm font-semibold text-slate-800">
                  Drag & drop degraded receipt image, or <span className="text-teal-600 underline">Browse files</span>
                </p>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  Simulated pipeline (prototype)
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Supported formats: <strong className="text-slate-700">JPEG, PNG</strong> (Thermal paper documents)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Validation Error Message */}
      {validationError && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Process Action for Selected File */}
      {selectedFile && (
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={() => setSelectedFile(null)}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
          >
            Clear
          </button>
          <button
            id="btn-process-receipt"
            onClick={handleStartProcess}
            disabled={isProcessing}
            className="px-5 py-2 text-xs font-bold rounded-md bg-teal-700 hover:bg-teal-600 text-white flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
          >
            <Zap className="w-4 h-4 text-teal-300" />
            <span>Process Receipt (5-Filter Pipeline)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sample Thermal Receipts for Research Testing */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            Or select a Research Sample Thermal Receipt to test evidence verification:
          </span>
          <span className="text-[10px] text-slate-400 font-mono">5 Presets Available</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {presetReceipts.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onSelectPresetReceipt(preset.id)}
              className="p-2 rounded-md border border-slate-200 bg-slate-50 hover:bg-teal-50/60 hover:border-teal-300 text-left transition-all group flex flex-col justify-between"
            >
              <div>
                <span className="font-mono text-[10px] font-bold text-slate-800 block truncate group-hover:text-teal-900">
                  {preset.merchantName}
                </span>
                <span className="text-[9px] text-slate-500 block truncate mt-0.5">
                  Rcpt #{preset.receiptNumber}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[9px] px-1 py-0.2 rounded bg-white text-slate-600 border border-slate-200 font-mono capitalize truncate max-w-[80px]">
                  {preset.degradationType.replace('_', ' ')}
                </span>
                <span className={`text-[8px] font-bold font-mono px-1 rounded ${
                  preset.overallDecision === 'accepted' ? 'text-emerald-700 bg-emerald-100' : preset.overallDecision === 'warning' ? 'text-amber-700 bg-amber-100' : 'text-red-700 bg-red-100'
                }`}>
                  {preset.overallDecision === 'accepted' ? 'OK' : preset.overallDecision === 'warning' ? 'WARN' : 'VERIF'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
