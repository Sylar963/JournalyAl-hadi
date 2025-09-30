import React, { useState, useEffect, useRef } from 'react';
import { type UserProfile } from '../types';
import IconUpload from './icons/IconUpload';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
  profile: UserProfile;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onSave, profile }) => {
  const [name, setName] = useState(profile.name);
  const [alias, setAlias] = useState(profile.alias);
  const [picture, setPicture] = useState<string | undefined>(profile.picture);
  const [journalPurpose, setJournalPurpose] = useState(profile.journalPurpose);

  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  
  useEffect(() => {
    setName(profile.name);
    setAlias(profile.alias);
    setPicture(profile.picture);
    setJournalPurpose(profile.journalPurpose);
  }, [profile, isOpen]);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;

      const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      firstElement.focus();

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
        if (event.key === 'Tab') {
          if (event.shiftKey) { // Shift + Tab
            if (document.activeElement === firstElement) {
              event.preventDefault();
              lastElement.focus();
            }
          } else { // Tab
            if (document.activeElement === lastElement) {
              event.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        triggerRef.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  const handleSave = () => {
    onSave({ name, alias, picture, journalPurpose });
  };
  
  const handlePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert("File is too large. Please select an image under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const getInitials = (name: string): string => {
    const names = name.split(' ');
    if (names.length === 0) return '';
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef} 
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-800"
      >
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <h2 id="profile-modal-title" className="text-xl font-bold text-white">Edit Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-6">
            <div className="flex items-center space-x-4">
                <div className="relative w-20 h-20">
                    <div className="w-20 h-20 bg-amber-600 rounded-full flex items-center justify-center font-bold text-white text-3xl overflow-hidden">
                        {picture ? (
                            <img src={picture} alt="Profile Preview" className="w-full h-full object-cover" />
                        ) : (
                            <span>{getInitials(name)}</span>
                        )}
                    </div>
                     <label htmlFor="profile-picture-upload" className="absolute -bottom-1 -right-1 bg-yellow-600 rounded-full p-1.5 cursor-pointer hover:bg-yellow-700 transition-colors border-2 border-gray-900">
                        <IconUpload className="w-4 h-4 text-black" />
                        <input id="profile-picture-upload" type="file" accept="image/png, image/jpeg" className="hidden" onChange={handlePictureUpload} />
                    </label>
                </div>
                <div className="flex-1">
                     <p className="text-lg font-bold text-white">{name || 'Your Name'}</p>
                     <p className="text-sm text-gray-400">{alias || 'Your Alias'}</p>
                </div>
            </div>

          <div>
            <label htmlFor="profile-name" className="block text-sm font-medium text-gray-300 mb-2">Name</label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., John Doe"
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
            />
          </div>

           <div>
            <label htmlFor="profile-alias" className="block text-sm font-medium text-gray-300 mb-2">Alias</label>
            <input
              id="profile-alias"
              type="text"
              value={alias}
              onChange={e => setAlias(e.target.value)}
              placeholder="e.g., john.doe@example.com"
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label htmlFor="profile-purpose" className="block text-sm font-medium text-gray-300 mb-2">Journal Purpose</label>
            <textarea
              id="profile-purpose"
              value={journalPurpose || ''}
              onChange={e => setJournalPurpose(e.target.value)}
              placeholder="e.g., To track my morning moods"
              rows={3}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
            ></textarea>
          </div>

        </div>

        <div className="p-6 bg-black/25 border-t border-gray-800 flex justify-end items-center rounded-b-xl space-x-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium bg-yellow-600 text-black hover:bg-yellow-700 rounded-lg transition-colors">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;