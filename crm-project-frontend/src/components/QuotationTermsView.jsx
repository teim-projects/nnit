import React from 'react';
import { FileText } from 'lucide-react';

const QuotationTermsView = ({ terms }) => {
  if (!terms || terms.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <FileText className="mx-auto text-gray-400 mb-2" size={48} />
        <p className="text-gray-500">
          No terms & conditions attached to this quotation.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Terms & Conditions
      </h2>
      
      <div className="space-y-4">
        {terms.map((term) => (
          <div key={term.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {term.sequence}. {term.title}
                </h3>
                {term.is_customized && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                    Customized
                  </span>
                )}
              </div>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed text-justify">
                {term.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuotationTermsView;
