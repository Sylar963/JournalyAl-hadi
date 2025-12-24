import React, { useState, useEffect, useRef } from 'react';
import { type UserProfile } from '../types';
import IconUpload from './icons/IconUpload';
import { useI18n } from '../hooks/useI18n';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
  profile: UserProfile;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onSave, profile }) => {
  const { t } = useI18n();
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
        alert(t('profile.file_too_large'));
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div 
        ref={modalRef} 
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        className="glass-panel rounded-2xl shadow-2xl w-full max-w-md border border-[color:var(--glass-border)] animate-scale-in"
      >
        <div className="p-6 border-b border-[color:var(--glass-border)] flex justify-between items-center">
          <h2 id="profile-modal-title" className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{t('profile.title')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-6">
            <div className="flex items-center space-x-4">
                <div className="relative w-20 h-20">
                    <div className="w-20 h-20 bg-gradient-to-br from-[var(--accent-secondary)] to-[var(--accent-primary)] rounded-full flex items-center justify-center font-bold text-white text-3xl overflow-hidden shadow-inner">
                        {picture ? (
                            <img src={picture} alt="Profile Preview" className="w-full h-full object-cover" />
                        ) : (
                            <span>{getInitials(name)}</span>
                        )}
                    </div>
                     <label htmlFor="profile-picture-upload" className="absolute -bottom-1 -right-1 bg-[var(--accent-primary)] rounded-full p-1.5 cursor-pointer hover:opacity-90 transition-all border-2 border-[#050507] shadow-lg">
                        <IconUpload className="w-4 h-4 text-black" />
                        <input id="profile-picture-upload" type="file" accept="image/png, image/jpeg" className="hidden" onChange={handlePictureUpload} />
                    </label>
                </div>
                <div className="flex-1">
                     <p className="text-lg font-bold text-white">{name || t('profile.default_name')}</p>
                     <p className="text-sm text-gray-400">{alias || t('profile.default_alias')}</p>
                </div>
            </div>

          <div>
            <label htmlFor="profile-name" className="block text-sm font-medium text-gray-300 mb-2">{t('profile.name_label')}</label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('profile.name_placeholder')}
              className="w-full bg-white/5 border border-[color:var(--glass-border)] rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition placeholder-gray-500"
            />
          </div>

           <div>
            <label htmlFor="profile-alias" className="block text-sm font-medium text-gray-300 mb-2">{t('profile.alias_label')}</label>
            <input
              id="profile-alias"
              type="text"
              value={alias}
              onChange={e => setAlias(e.target.value)}
              placeholder={t('profile.alias_placeholder')}
              className="w-full bg-white/5 border border-[color:var(--glass-border)] rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition placeholder-gray-500"
            />
          </div>

          <div>
            <label htmlFor="profile-purpose" className="block text-sm font-medium text-gray-300 mb-2">{t('profile.purpose_label')}</label>
            <textarea
              id="profile-purpose"
              value={journalPurpose || ''}
              onChange={e => setJournalPurpose(e.target.value)}
              placeholder={t('profile.purpose_placeholder')}
              rows={3}
              className="w-full bg-white/5 border border-[color:var(--glass-border)] rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition resize-none placeholder-gray-500"
            ></textarea>
          </div>

        </div>

        <div className="p-6 bg-white/5 border-t border-[color:var(--glass-border)] flex justify-end items-center rounded-b-2xl space-x-3 backdrop-blur-md">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-colors border border-transparent hover:border-white/10">{t('common.cancel')}</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white hover:opacity-90 rounded-xl transition-all shadow-[0_0_15px_var(--chart-glow-color-1)]">{t('profile.save')}</button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;