import { useEffect, useState } from "react";
import axios from "axios";

const TermsMultiSelect = ({
  value = [],
  onChange,
  termsType,          // required (id of terms_condition_type)
  baseApi,            // required
  disabled = false,
  token,
  label = "Terms"     // Add label prop
}) => {
  // INVENTORY MODULE REMOVED - This component is now disabled
  // Returns a simple message instead of fetching terms
  
  return (
    <div className="space-y-3">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} <span className="text-gray-400">(Optional)</span>
        </label>
      )}

      {/* Info Message */}
      <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
        <div className="text-sm text-gray-500 text-center">
          Terms & Conditions module is not available
        </div>
      </div>
    </div>
  );
};

export default TermsMultiSelect;
