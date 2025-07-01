/**
 * Content Editor Component - Inline editing for research content
 * 
 * Provides rich text editing capabilities for AI-generated research content
 * with auto-save functionality and content validation.
 */
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../ui/button';

interface ContentEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}

/**
 * Rich text editor for editing research section content
 */
export function ContentEditor({
  content,
  onContentChange,
  placeholder = 'Enter content...',
  disabled = false,
  maxLength = 10000
}: ContentEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update local content when prop changes
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [localContent, isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
    // Focus textarea after render
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      onContentChange(localContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save content:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalContent(content); // Reset to original content
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const wordCount = localContent.trim().split(/\s+/).filter(word => word.length > 0).length;
  const hasChanges = localContent !== content;

  if (!isEditing) {
    return (
      <div className="group relative">
        <div 
          className={`min-h-[100px] p-4 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors ${
            !content ? 'text-slate-400 italic' : 'text-slate-700'
          }`}
          onClick={handleEdit}
        >
          {content || placeholder}
        </div>
        
        {/* Edit button overlay */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleEdit}
          disabled={disabled}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Edit
        </Button>
        
        {/* Content stats */}
        {content && (
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{wordCount} words</span>
            <span>Click to edit</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isSaving}
          maxLength={maxLength}
          className="w-full min-h-[200px] p-4 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        {/* Character count */}
        <div className="absolute bottom-2 right-2 text-xs text-slate-400">
          {localContent.length}/{maxLength}
        </div>
      </div>
      
      {/* Editor controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          <span>{wordCount} words</span>
          {hasChanges && <span className="ml-2 text-amber-600">● Unsaved changes</span>}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
      
      {/* Keyboard shortcuts help */}
      <div className="text-xs text-slate-500">
        <span>Ctrl+Enter to save, Esc to cancel</span>
      </div>
    </div>
  );
} 