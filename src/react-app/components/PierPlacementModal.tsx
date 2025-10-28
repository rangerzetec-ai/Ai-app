import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { PierPlacement } from "@/shared/types";

interface PierPlacementModalProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onSave: (pierData: Omit<PierPlacement, 'id'>) => void;
  initialData?: Partial<PierPlacement>;
  foundationCoordinates: { x: number; y: number };
}

export default function PierPlacementModal({
  isOpen,
  position,
  onClose,
  onSave,
  initialData,
  foundationCoordinates
}: PierPlacementModalProps) {
  const [elevation, setElevation] = useState<string>("");
  const [pierType, setPierType] = useState<PierPlacement["type"]>("push_pier");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setElevation(initialData?.elevation?.toString() || "");
      setPierType(initialData?.type || "push_pier");
      setNotes(initialData?.notes || "");
    }
  }, [isOpen, initialData]);

  const handleSave = () => {
    const pierData: Omit<PierPlacement, 'id'> = {
      x: foundationCoordinates.x,
      y: 0,
      z: foundationCoordinates.y,
      type: pierType,
      elevation: elevation ? parseFloat(elevation) : undefined,
      notes: notes.trim() || undefined,
    };
    
    onSave(pierData);
    onClose();
  };

  const handleCancel = () => {
    setElevation("");
    setPierType("push_pier");
    setNotes("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-96 max-w-[90vw] mx-4"
        style={{
          position: 'fixed',
          left: Math.min(position.x, window.innerWidth - 400),
          top: Math.min(position.y, window.innerHeight - 400),
          transform: position.x > window.innerWidth - 400 ? 'translateX(-100%)' : 'none'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Pier Details</h3>
          <button
            onClick={handleCancel}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Elevation */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Elevation
            </label>
            <input
              type="number"
              step="0.1"
              value={elevation}
              onChange={(e) => setElevation(e.target.value)}
              placeholder="Enter elevation"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Proposed Pier Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Proposed Pier Type
            </label>
            <select
              value={pierType}
              onChange={(e) => setPierType(e.target.value as PierPlacement["type"])}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="push_pier">Push Pier</option>
              <option value="helical_pier">Helical Pier</option>
              <option value="steel_pier">Steel Pier</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Position Info */}
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-600">
              <strong>Position:</strong> ({foundationCoordinates.x.toFixed(1)}, {foundationCoordinates.y.toFixed(1)})
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-slate-200">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Pier
          </button>
        </div>
      </div>
    </div>
  );
}
