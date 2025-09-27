import { useState, useRef } from "react";
import { FileText, Download, DollarSign, Calculator, CheckCircle2, Eye, Zap } from "lucide-react";
import { Appointment, PierPlacements, SalesPerson } from "@/shared/types";

interface ContractGeneratorProps {
  appointment: Appointment;
  pierPlacements: PierPlacements;
  salesPerson?: SalesPerson | null;
  onContractGenerated: (contractUrl: string) => void;
}

interface PricingConfig {
  push_pier: { price: number; label: string };
  helical_pier: { price: number; label: string };
  steel_pier: { price: number; label: string };
  labor_per_pier: number;
  permit_fee: number;
  inspection_fee: number;
}

const DEFAULT_PRICING: PricingConfig = {
  push_pier: { price: 1250, label: "Push Pier System" },
  helical_pier: { price: 950, label: "Helical Pier System" },
  steel_pier: { price: 1100, label: "Steel Push Pier" },
  labor_per_pier: 300,
  permit_fee: 150,
  inspection_fee: 200,
};

export default function ContractGenerator({ 
  appointment, 
  pierPlacements, 
  salesPerson,
  onContractGenerated 
}: ContractGeneratorProps) {
  const [contractData, setContractData] = useState({
    project_duration: "3-5 business days",
    warranty_period: "25 years",
    payment_terms: "50% deposit, 50% on completion",
    special_notes: "",
    discount_percentage: 0,
  });
  
  const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING);
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const contractRef = useRef<HTMLDivElement>(null);

  // Calculate pricing breakdown
  const pierCounts = {
    push_pier: pierPlacements.filter(p => p.type === "push_pier").length,
    helical_pier: pierPlacements.filter(p => p.type === "helical_pier").length,
    steel_pier: pierPlacements.filter(p => p.type === "steel_pier").length,
  };

  const calculations = {
    push_pier_total: pierCounts.push_pier * pricing.push_pier.price,
    helical_pier_total: pierCounts.helical_pier * pricing.helical_pier.price,
    steel_pier_total: pierCounts.steel_pier * pricing.steel_pier.price,
    get materials_total() {
      return this.push_pier_total + this.helical_pier_total + this.steel_pier_total;
    },
    labor_total: (pierCounts.push_pier + pierCounts.helical_pier + pierCounts.steel_pier) * pricing.labor_per_pier,
    get subtotal() {
      return this.materials_total + this.labor_total + pricing.permit_fee + pricing.inspection_fee;
    },
    get discount_amount() {
      return this.subtotal * (contractData.discount_percentage / 100);
    },
    get total() {
      return this.subtotal - this.discount_amount;
    }
  };

  const generateContract = async () => {
    setGenerating(true);
    try {
      // In a real implementation, this would send to a PDF generation service
      const contractUrl = `contract-${appointment.id}-${Date.now()}.pdf`;
      onContractGenerated(contractUrl);
      
      // For demo purposes, show success
      setTimeout(() => {
        alert("Professional contract generated successfully! Ready for customer signature.");
        setGenerating(false);
      }, 2000);
    } catch (error) {
      console.error("Contract generation failed:", error);
      setGenerating(false);
    }
  };

  const generateContractHtml = () => {
    // For now, use a generic customer name since lead info isn't directly on appointment
    const leadName = "Valued Customer";
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Foundation Repair Contract - ${leadName}</title>
        <style>
          body { font-family: 'Arial', sans-serif; margin: 40px; color: #333; }
          .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .company-name { font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 5px; }
          .tagline { color: #64748b; font-style: italic; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 18px; font-weight: bold; color: #2563eb; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px; }
          .pier-breakdown { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .pricing-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .pricing-table th, .pricing-table td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          .pricing-table th { background: #f1f5f9; font-weight: bold; }
          .total-row { font-weight: bold; font-size: 18px; background: #dbeafe; }
          .warranty-box { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px; border-radius: 8px; text-align: center; }
          .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
          .signature-box { width: 200px; border-bottom: 1px solid #333; padding-top: 40px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">PierPro Foundation Repair</div>
          <div class="tagline">Professional Foundation Solutions You Can Trust</div>
        </div>
        
        <div class="section">
          <div class="section-title">Contract Details</div>
          <p><strong>Customer:</strong> ${leadName}</p>
          <p><strong>Property Address:</strong> ${appointment.location_address || "To be confirmed"}</p>
          <p><strong>Sales Representative:</strong> ${salesPerson ? `${salesPerson.first_name} ${salesPerson.last_name}` : "PierPro Team"}</p>
          <p><strong>Contract Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Estimated Project Duration:</strong> ${contractData.project_duration}</p>
        </div>

        <div class="pier-breakdown">
          <div class="section-title">Foundation Repair Scope</div>
          <p><strong>Total Piers Required:</strong> ${pierPlacements.length}</p>
          ${pierCounts.push_pier > 0 ? `<p>• Push Piers: ${pierCounts.push_pier} units</p>` : ''}
          ${pierCounts.helical_pier > 0 ? `<p>• Helical Piers: ${pierCounts.helical_pier} units</p>` : ''}
          ${pierCounts.steel_pier > 0 ? `<p>• Steel Piers: ${pierCounts.steel_pier} units</p>` : ''}
        </div>

        <div class="section">
          <div class="section-title">Investment Breakdown</div>
          <table class="pricing-table">
            <thead>
              <tr><th>Description</th><th>Quantity</th><th>Unit Price</th><th>Total</th></tr>
            </thead>
            <tbody>
              ${pierCounts.push_pier > 0 ? `<tr><td>${pricing.push_pier.label}</td><td>${pierCounts.push_pier}</td><td>$${pricing.push_pier.price.toLocaleString()}</td><td>$${calculations.push_pier_total.toLocaleString()}</td></tr>` : ''}
              ${pierCounts.helical_pier > 0 ? `<tr><td>${pricing.helical_pier.label}</td><td>${pierCounts.helical_pier}</td><td>$${pricing.helical_pier.price.toLocaleString()}</td><td>$${calculations.helical_pier_total.toLocaleString()}</td></tr>` : ''}
              ${pierCounts.steel_pier > 0 ? `<tr><td>${pricing.steel_pier.label}</td><td>${pierCounts.steel_pier}</td><td>$${pricing.steel_pier.price.toLocaleString()}</td><td>$${calculations.steel_pier_total.toLocaleString()}</td></tr>` : ''}
              <tr><td>Professional Installation Labor</td><td>${pierPlacements.length}</td><td>$${pricing.labor_per_pier.toLocaleString()}</td><td>$${calculations.labor_total.toLocaleString()}</td></tr>
              <tr><td>Permits & Documentation</td><td>1</td><td>$${pricing.permit_fee}</td><td>$${pricing.permit_fee}</td></tr>
              <tr><td>Inspection & Quality Assurance</td><td>1</td><td>$${pricing.inspection_fee}</td><td>$${pricing.inspection_fee}</td></tr>
              <tr><td colspan="3"><strong>Subtotal</strong></td><td><strong>$${calculations.subtotal.toLocaleString()}</strong></td></tr>
              ${contractData.discount_percentage > 0 ? `<tr><td colspan="3"><strong>Discount (${contractData.discount_percentage}%)</strong></td><td><strong>-$${calculations.discount_amount.toLocaleString()}</strong></td></tr>` : ''}
              <tr class="total-row"><td colspan="3"><strong>Total Investment</strong></td><td><strong>$${calculations.total.toLocaleString()}</strong></td></tr>
            </tbody>
          </table>
        </div>

        <div class="warranty-box">
          <h3>🛡️ ${contractData.warranty_period} Transferable Warranty</h3>
          <p>Your foundation repair is backed by our industry-leading warranty, giving you complete peace of mind.</p>
        </div>

        <div class="section">
          <div class="section-title">Payment Terms</div>
          <p>${contractData.payment_terms}</p>
          <p><strong>Deposit Required:</strong> $${(calculations.total * 0.5).toLocaleString()}</p>
          <p><strong>Final Payment:</strong> $${(calculations.total * 0.5).toLocaleString()}</p>
        </div>

        ${contractData.special_notes ? `
        <div class="section">
          <div class="section-title">Special Notes</div>
          <p>${contractData.special_notes}</p>
        </div>` : ''}

        <div class="signature-section">
          <div>
            <div class="signature-box"></div>
            <p>Customer Signature</p>
            <p>Date: ___________</p>
          </div>
          <div>
            <div class="signature-box"></div>
            <p>PierPro Representative</p>
            <p>Date: ___________</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-lg">Contract Generator</h3>
            <p className="text-sm text-slate-600">Professional contracts that close deals</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium text-amber-700">One-Call Close Tool</span>
        </div>
      </div>

      {/* Pricing Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left: Configuration */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-3">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-slate-900">Pricing Configuration</h4>
          </div>

          {/* Pier Type Pricing */}
          <div className="space-y-3">
            {Object.entries(pricing).map(([key, config]) => {
              if (typeof config === 'object' && 'price' in config) {
                const count = pierCounts[key as keyof typeof pierCounts];
                return (
                  <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-slate-700">{config.label}</span>
                      <div className="text-xs text-slate-500">
                        {count} piers × ${config.price.toLocaleString()} = ${(count * config.price).toLocaleString()}
                      </div>
                    </div>
                    <input
                      type="number"
                      value={config.price}
                      onChange={(e) => setPricing(prev => ({
                        ...prev,
                        [key]: { ...config, price: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-24 px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                );
              }
              return null;
            })}
          </div>

          {/* Additional Costs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
              <span className="text-sm text-slate-700">Labor per pier</span>
              <input
                type="number"
                value={pricing.labor_per_pier}
                onChange={(e) => setPricing(prev => ({ ...prev, labor_per_pier: parseInt(e.target.value) || 0 }))}
                className="w-20 px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
              <span className="text-sm text-slate-700">Permit fee</span>
              <input
                type="number"
                value={pricing.permit_fee}
                onChange={(e) => setPricing(prev => ({ ...prev, permit_fee: parseInt(e.target.value) || 0 }))}
                className="w-20 px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
              <span className="text-sm text-slate-700">Inspection fee</span>
              <input
                type="number"
                value={pricing.inspection_fee}
                onChange={(e) => setPricing(prev => ({ ...prev, inspection_fee: parseInt(e.target.value) || 0 }))}
                className="w-20 px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Discount */}
          <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-900">Discount %</span>
            </div>
            <input
              type="number"
              min="0"
              max="50"
              value={contractData.discount_percentage}
              onChange={(e) => setContractData(prev => ({ ...prev, discount_percentage: parseInt(e.target.value) || 0 }))}
              className="w-16 px-2 py-1 text-sm border border-amber-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Right: Pricing Summary */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-3">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h4 className="font-medium text-slate-900">Investment Summary</h4>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Materials Total:</span>
                <span className="font-medium">${calculations.materials_total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Labor Total:</span>
                <span className="font-medium">${calculations.labor_total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Permits & Inspection:</span>
                <span className="font-medium">${(pricing.permit_fee + pricing.inspection_fee).toLocaleString()}</span>
              </div>
              <hr className="border-slate-300" />
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-medium">${calculations.subtotal.toLocaleString()}</span>
              </div>
              {contractData.discount_percentage > 0 && (
                <div className="flex justify-between text-sm text-amber-700">
                  <span>Discount ({contractData.discount_percentage}%):</span>
                  <span>-${calculations.discount_amount.toLocaleString()}</span>
                </div>
              )}
              <hr className="border-slate-300" />
              <div className="flex justify-between text-lg font-bold text-slate-900">
                <span>Total Investment:</span>
                <span className="text-emerald-700">${calculations.total.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="mt-4 p-3 bg-white/70 rounded-lg border border-slate-200">
              <div className="text-xs font-medium text-slate-700 mb-2">Payment Schedule:</div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Deposit (50%):</span>
                <span className="font-medium text-blue-700">${(calculations.total * 0.5).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">On Completion:</span>
                <span className="font-medium text-blue-700">${(calculations.total * 0.5).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Quality Indicators */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="font-medium text-emerald-900">Professional Quality</span>
            </div>
            <div className="text-sm text-emerald-800 space-y-1">
              <div>✓ 25-year transferable warranty</div>
              <div>✓ Licensed & insured technicians</div>
              <div>✓ Premium materials & equipment</div>
              <div>✓ Complete project documentation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Project Duration</label>
          <input
            type="text"
            value={contractData.project_duration}
            onChange={(e) => setContractData(prev => ({ ...prev, project_duration: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Warranty Period</label>
          <input
            type="text"
            value={contractData.warranty_period}
            onChange={(e) => setContractData(prev => ({ ...prev, warranty_period: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-2">Special Notes</label>
          <textarea
            value={contractData.special_notes}
            onChange={(e) => setContractData(prev => ({ ...prev, special_notes: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any special conditions or notes for this project..."
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="inline-flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? 'Hide Preview' : 'Preview Contract'}
          </button>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={generateContract}
            disabled={generating || pierPlacements.length === 0}
            className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
          >
            <FileText className="w-4 h-4 mr-2" />
            {generating ? "Generating..." : "Generate Contract"}
          </button>
        </div>
      </div>

      {/* Contract Preview */}
      {showPreview && (
        <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Contract Preview</span>
              <button
                onClick={() => {
                  const contractHtml = generateContractHtml();
                  const blob = new Blob([contractHtml], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `contract-${appointment.id}.html`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                <Download className="w-3 h-3 mr-1" />
                Download HTML
              </button>
            </div>
          </div>
          <div 
            ref={contractRef}
            className="max-h-96 overflow-y-auto p-4 bg-white"
            dangerouslySetInnerHTML={{ __html: generateContractHtml() }}
          />
        </div>
      )}

      {pierPlacements.length === 0 && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
            <span className="text-sm text-amber-800">
              Place piers on the foundation to enable contract generation
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
