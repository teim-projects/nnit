// ============================================
// ADD THESE SECTIONS TO YOUR AddLeadFollowUpForm.jsx
// Place them after the header and before the date inputs
// ============================================

// 1. ADD STATE VARIABLES (at top of component, after existing states):
const [followupMode, setFollowupMode] = useState('call'); // call, whatsapp, email, video_call, in_person, demo, site_visit
const [clientResponse, setClientResponse] = useState(''); // very_positive, positive, neutral, negative, no_response, call_back_later
const [currentStage, setCurrentStage] = useState('');
const [moveToStage, setMoveToStage] = useState('');

// 2. ADD THIS SECTION IN YOUR FORM (after the header, before date inputs):

{/* ===== FOLLOW-UP MODE SECTION ===== */}
<div className="px-6 pt-4 border-b pb-4">
  <label className="block text-sm font-semibold text-gray-700 mb-3">
    Follow-up Mode <span className="text-red-500">*</span>
  </label>
  <div className="grid grid-cols-4 gap-2">
    <button
      type="button"
      onClick={() => setFollowupMode('call')}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        followupMode === 'call'
          ? 'bg-blue-600 text-white shadow-md'
          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
      }`}
    >
      📞 Call
    </button>
    
    <button
      type="button"
      onClick={() => setFollowupMode('whatsapp')}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        followupMode === 'whatsapp'
          ? 'bg-green-600 text-white shadow-md'
          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
      }`}
    >
      💬 WhatsApp
    </button>
    
    <button
      type="button"
      onClick={() => setFollowupMode('email')}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        followupMode === 'email'
          ? 'bg-blue-600 text-white shadow-md'
          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
      }`}
    >
      📧 Email
    </button>
    
    <button
      type="button"
      onClick={() => setFollowupMode('video_call')}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        followupMode === 'video_call'
          ? 'bg-purple-600 text-white shadow-md'
          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
      }`}
    >
      📹 Video Call
    </button>
    
    <button
      type="button"
      onClick={() => setFollowupMode('in_person')}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        followupMode === 'in_person'
          ? 'bg-orange-600 text-white shadow-md'
          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
      }`}
    >
      👤 In-Person
    </button>
    
    <button
      type="button"
      onClick={() => setFollowupMode('demo')}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        followupMode === 'demo'
          ? 'bg-indigo-600 text-white shadow-md'
          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
      }`}
    >
      📊 Demo
    </button>
    
    <button
      type="button"
      onClick={() => setFollowupMode('site_visit')}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        followupMode === 'site_visit'
          ? 'bg-teal-600 text-white shadow-md'
          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
      }`}
    >
      📍 Site Visit
    </button>
  </div>
</div>

{/* ===== CONDUCTED BY SECTION ===== */}
<div className="px-6 pt-4">
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Conducted By <span className="text-red-500">*</span>
      </label>
      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
        <option value="">Select Team Member</option>
        <option value="rajesh">Rajesh Kumar</option>
        <option value="rahul">Rahul Mehta</option>
        {/* Add more team members */}
      </select>
    </div>
  </div>
</div>

{/* ===== STAGE & RESPONSE SECTION ===== */}
<div className="px-6 pt-4 border-t mt-4">
  <h3 className="text-sm font-bold text-blue-700 mb-3">STAGE & RESPONSE</h3>
  
  <div className="grid grid-cols-2 gap-4 mb-4">
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Current Stage <span className="text-red-500">*</span>
      </label>
      <select
        value={currentStage}
        onChange={(e) => setCurrentStage(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      >
        <option value="">Select Stage</option>
        <option value="demo_completed">Demo Completed</option>
        <option value="quotation_sent">Quotation Sent</option>
        <option value="negotiation">Negotiation</option>
        <option value="site_visit_done">Site Visit Done</option>
        <option value="proposal_sent">Proposal Sent</option>
      </select>
    </div>
    
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Move to Next Stage
      </label>
      <select
        value={moveToStage}
        onChange={(e) => setMoveToStage(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      >
        <option value="">— No Change —</option>
        <option value="quotation_sent">Quotation Sent</option>
        <option value="negotiation">Negotiation</option>
        <option value="site_visit_scheduled">Site Visit Scheduled</option>
        <option value="deal_closed">Deal Closed</option>
      </select>
    </div>
  </div>
  
  {/* CLIENT RESPONSE BUTTONS */}
  <div className="mb-4">
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      Client Response <span className="text-red-500">*</span>
    </label>
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => setClientResponse('very_positive')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          clientResponse === 'very_positive'
            ? 'bg-green-600 text-white shadow-md'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        Very Positive
      </button>
      
      <button
        type="button"
        onClick={() => setClientResponse('positive')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          clientResponse === 'positive'
            ? 'bg-green-500 text-white shadow-md'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        Positive
      </button>
      
      <button
        type="button"
        onClick={() => setClientResponse('neutral')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          clientResponse === 'neutral'
            ? 'bg-gray-600 text-white shadow-md'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        Neutral
      </button>
      
      <button
        type="button"
        onClick={() => setClientResponse('negative')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          clientResponse === 'negative'
            ? 'bg-red-600 text-white shadow-md'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        Negative
      </button>
      
      <button
        type="button"
        onClick={() => setClientResponse('no_response')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          clientResponse === 'no_response'
            ? 'bg-gray-500 text-white shadow-md'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        No Response
      </button>
      
      <button
        type="button"
        onClick={() => setClientResponse('call_back_later')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          clientResponse === 'call_back_later'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        Call Back Later
      </button>
    </div>
  </div>
</div>

{/* ===== DISCUSSION NOTES SECTION ===== */}
<div className="px-6 pt-4 border-t mt-4">
  <h3 className="text-sm font-bold text-blue-700 mb-3">DISCUSSION NOTES</h3>
  
  <div className="mb-4">
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      Follow-up Summary / Key Discussion Points <span className="text-red-500">*</span>
    </label>
    <textarea
      value={discussionNotes}
      onChange={(e) => setDiscussionNotes(e.target.value)}
      rows={4}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      placeholder="What was discussed? Key pain points shared, objections raised, decisions taken..."
    />
  </div>
  
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Commitment by Client
      </label>
      <textarea
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
        placeholder="e.g., Will share PO by Friday, Arranging technical team..."
      />
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Commitment by Us
      </label>
      <textarea
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
        placeholder="e.g., Sending revised proposal, Escalating discount request..."
      />
    </div>
  </div>
</div>

// 3. UPDATE YOUR handleSubmit TO INCLUDE NEW FIELDS:
const payload = {
  lead: leadId,
  followup_date: followupDate,
  next_followup_date: nextFollowupDate || null,
  status,
  remarks: remarks.trim(),
  discussion_notes: discussionNotes.trim(),
  followup_mode: followupMode, // ← ADD THIS
  client_response: clientResponse, // ← ADD THIS
  current_stage: currentStage, // ← ADD THIS
  move_to_stage: moveToStage || null, // ← ADD THIS
  // ... rest of your existing payload
};

// 4. ADD VALIDATION:
if (!followupMode) {
  Swal.fire({
    icon: "error",
    title: "Validation",
    text: "Please select a follow-up mode",
  });
  return false;
}

if (!clientResponse) {
  Swal.fire({
    icon: "error",
    title: "Validation",
    text: "Please select client response",
  });
  return false;
}

// ============================================
// DONE! Your follow-up form will now look like the image
// ============================================
