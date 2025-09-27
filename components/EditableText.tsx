import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface EditableTextProps {
  initialValue: string;
  onSave: (value: string) => void;
  className?: string;
  textarea?: boolean;
}

export const EditableText: React.FC<EditableTextProps> = ({ initialValue, onSave, className, textarea = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (value !== initialValue) {
        onSave(value);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !textarea) {
        e.preventDefault();
        handleSave();
    } else if (e.key === 'Escape') {
        setValue(initialValue);
        setIsEditing(false);
    }
  };

  const commonProps = {
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue(e.target.value),
    onBlur: handleSave,
    onKeyDown: handleKeyDown,
    className: `w-full p-1 border border-indigo-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white ${className}`
  };

  if (isEditing) {
    return textarea ? (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        rows={Math.max(2, value.split('\n').length)}
        {...commonProps}
      />
    ) : (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        {...commonProps}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer min-h-[2.5rem] p-1 rounded-md hover:bg-indigo-50 transition-colors w-full break-words whitespace-pre-wrap ${className}`}
      title="Click to edit"
    >
      {value || <span className="text-gray-400 italic">[Empty]</span>}
    </div>
  );
};
