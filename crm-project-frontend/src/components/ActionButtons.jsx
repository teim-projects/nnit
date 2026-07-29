import React from 'react';
import { IoLogoWhatsapp } from 'react-icons/io5';
import { MdEmail, MdDelete, MdRemoveRedEye } from 'react-icons/md';
import Swal from 'sweetalert2';

/**
 * ActionButtons Component - Reusable action buttons for Lead & Customer tables
 * Compact, attractive design with WhatsApp, Email, Delete, and View actions
 */
export default function ActionButtons({ 
  row, 
  onView, 
  onDelete,
  showWhatsApp = true,
  showEmail = true,
  showDelete = true
}) {
  
  const handleWhatsApp = (e) => {
    e.stopPropagation();
    const contact = row.customer_contact || row.contact_number || row.contact;
    if (!contact) {
      Swal.fire({
        icon: 'warning',
        title: 'No Contact',
        text: 'No contact number available'
      });
      return;
    }
    
    // Remove any special characters and spaces
    const cleanNumber = contact.replace(/[^0-9]/g, '');
    const whatsappNumber = cleanNumber.startsWith('91') ? cleanNumber : `91${cleanNumber}`;
    
    // Open WhatsApp
    window.open(`https://wa.me/${whatsappNumber}`, '_blank');
  };

  const handleEmail = (e) => {
    e.stopPropagation();
    const email = row.customer_email || row.email;
    if (!email) {
      Swal.fire({
        icon: 'warning',
        title: 'No Email',
        text: 'No email address available'
      });
      return;
    }
    
    // Open default email client
    window.location.href = `mailto:${email}`;
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(row.id);
    }
  };

  const handleView = (e) => {
    e.stopPropagation();
    if (onView) {
      onView(row);
    }
  };

  return (
    <div className="flex items-center justify-center gap-1">
      {showWhatsApp && (
        <button
          onClick={handleWhatsApp}
          className="action-btn action-btn-whatsapp"
          title="Send WhatsApp"
        >
          <IoLogoWhatsapp className="w-3.5 h-3.5" />
        </button>
      )}
      
      {showEmail && (
        <button
          onClick={handleEmail}
          className="action-btn action-btn-email"
          title="Send Email"
        >
          <MdEmail className="w-3.5 h-3.5" />
        </button>
      )}
      
      {showDelete && (
        <button
          onClick={handleDelete}
          className="action-btn action-btn-delete"
          title="Delete"
        >
          <MdDelete className="w-3.5 h-3.5" />
        </button>
      )}
      
      <button
        onClick={handleView}
        className="action-btn action-btn-view"
        title="View Details"
      >
        <MdRemoveRedEye className="w-3.5 h-3.5" />
        <span className="ml-1">View</span>
      </button>
    </div>
  );
}

/* 
 * CSS Classes (Add to your global CSS file):
 * 
 * .action-btn {
 *   @apply inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors;
 * }
 * 
 * .action-btn-whatsapp {
 *   @apply bg-green-600 text-white hover:bg-green-700;
 * }
 * 
 * .action-btn-email {
 *   @apply bg-blue-600 text-white hover:bg-blue-700;
 * }
 * 
 * .action-btn-delete {
 *   @apply bg-red-600 text-white hover:bg-red-700;
 * }
 * 
 * .action-btn-view {
 *   @apply bg-orange-600 text-white hover:bg-orange-700;
 * }
 */
