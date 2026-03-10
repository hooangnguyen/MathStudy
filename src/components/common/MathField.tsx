import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
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
}

export const MathField = forwardRef<MathFieldHandle, MathFieldProps>(
    ({ value, onChange, className, placeholder, readOnly, onFocus, onBlur }, ref) => {
        const internalRef = useRef<any>(null);

        useImperativeHandle(ref, () => ({
            focus: () => internalRef.current?.focus(),
            setValue: (val: string) => {
                if (internalRef.current) {
                    internalRef.current.value = val;
                }
            },
            insert: (latex: string) => {
                if (internalRef.current) {
                    internalRef.current.insert(latex);
                    internalRef.current.focus();
                }
            }
        }));

        useEffect(() => {
            const mf = internalRef.current;
            if (mf) {
                // Set initial value
                if (mf.value !== value) {
                    mf.value = value;
                }

                mf.readOnly = readOnly || false;

                // Configuration for better UX (MathType-like)
                mf.mathVirtualKeyboardPolicy = 'auto';
                mf.smartFence = true;
                mf.smartMode = true;

                // Customize the virtual keyboard to show common templates
                mf.virtualKeyboardMode = 'onfocus';

                if (placeholder) {
                    mf.placeholder = placeholder;
                }

                const handleInput = (e: any) => {
                    onChange(e.target.value);
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
        }, [value, onChange, readOnly, placeholder, onFocus, onBlur]);

        return (
            <div className={className}>
                {/* @ts-ignore */}
                <math-field
                    ref={internalRef}
                    style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '1rem',
                        border: '2px solid #e2e8f0',
                        fontSize: '1.25rem',
                        outline: 'none',
                        backgroundColor: 'white',
                        minHeight: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        caretColor: '#4f46e5',
                        '--caret-color': '#4f46e5',
                        '--selection-background-color': '#e0e7ff',
                        '--fill-surface': 'transparent',
                        '--keyboard-zindex': '2000',
                        '--outline-color': '#4f46e5',
                    } as any}
                />
            </div>
        );
    }
);
