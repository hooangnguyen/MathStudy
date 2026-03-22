import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { cn } from '../../utils/utils';
import 'mathlive';

interface MathFieldProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
    readOnly?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
}

export interface MathFieldHandle {
    focus: () => void;
    setValue: (value: string) => void;
    insert: (latex: string) => void;
}

export const MathField = forwardRef<MathFieldHandle, MathFieldProps>(
    ({ value, onChange, className, placeholder, readOnly, onFocus, onBlur }, ref) => {
        const internalRef = useRef<any>(null);
        // Track the last value sent by the mathfield to avoid overwriting and breaking selection
        const lastValueRef = useRef<string>(value);

        useImperativeHandle(ref, () => ({
            focus: () => internalRef.current?.focus(),
            setValue: (val: string) => {
                if (internalRef.current) {
                    internalRef.current.value = val;
                    lastValueRef.current = val;
                }
            },
            insert: (latex: string) => {
                if (internalRef.current) {
                    // Force insertion as math since the default mode is now text
                    internalRef.current.insert(latex, { mode: 'math' });
                    internalRef.current.focus();
                }
            }
        }));

        useEffect(() => {
            const mf = internalRef.current;
            if (mf) {
                // If it's the very first time initializing, or if value changed from outside
                if (mf.value !== value && value !== lastValueRef.current) {
                    mf.value = value;
                } else if (mf.value !== value && value === lastValueRef.current && mf.value === '') {
                    // Fix initialization edge case where both are empty string or match
                    // but the internal DOM is missing the text
                    mf.value = value;
                }
                lastValueRef.current = value;
            }
        }, [value]);

        useEffect(() => {
            const mf = internalRef.current;
            if (mf) {
                mf.readOnly = readOnly || false;
                
                // Ensure initial value is piped through during first massive mount
                if (value && mf.value !== value) {
                    mf.value = value;
                }
                
                // Set text mode as default so user can type normal Vietnamese phrases with spaces
                mf.defaultMode = 'text';

                // Configuration for better UX
                mf.mathVirtualKeyboardPolicy = 'auto';
                mf.smartFence = true;
                mf.smartMode = true;
                mf.virtualKeyboardMode = 'onfocus';

                if (placeholder) {
                    mf.placeholder = placeholder;
                }

                const handleInput = (e: any) => {
                    const newVal = e.target.value;
                    lastValueRef.current = newVal;
                    onChange(newVal);
                };

                const handleFocus = () => onFocus?.();
                const handleBlur = () => onBlur?.();

                mf.addEventListener('input', handleInput);
                mf.addEventListener('focus', handleFocus);
                mf.addEventListener('focusout', handleBlur);

                return () => {
                    mf.removeEventListener('input', handleInput);
                    mf.removeEventListener('focus', handleFocus);
                    mf.removeEventListener('focusout', handleBlur);
                };
            }
        }, [onChange, readOnly, placeholder, onFocus, onBlur]);

        return (
            <div className={cn("w-full min-w-0", className)}>
                {/* @ts-ignore */}
                <math-field
                    ref={internalRef}
                    line-breaking="auto"
                    style={{
                        position: 'relative',
                        width: '100%',
                        padding: '12px 48px 12px 16px',
                        borderRadius: '1rem',
                        border: '2px solid #e2e8f0',
                        fontSize: '1.25rem',
                        outline: 'none',
                        backgroundColor: 'white',
                        minHeight: '60px',
                        display: 'block',
                        caretColor: '#4f46e5',
                        '--caret-color': '#4f46e5',
                        '--selection-background-color': '#e0e7ff',
                        '--fill-surface': 'transparent',
                        '--keyboard-zindex': '2000',
                        '--outline-color': '#4f46e5',
                        whiteSpace: 'pre-wrap',
                        overflowWrap: 'anywhere',
                        wordBreak: 'break-word',
                        height: 'auto',
                        maxWidth: '100%',
                        pointerEvents: readOnly ? 'none' : 'auto'
                    } as any}
                />
            </div>
        );
    }
);
