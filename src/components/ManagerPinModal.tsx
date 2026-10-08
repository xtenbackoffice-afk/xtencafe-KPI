import React, { useState, useEffect, useRef } from 'react';
import { Lock, X, Delete, ShieldCheck, AlertCircle } from 'lucide-react';

interface ManagerPinModalProps {
  isOpen: boolean;
  expectedPin: string;
  actionDescription?: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const ManagerPinModal: React.FC<ManagerPinModalProps> = ({
  isOpen,
  expectedPin,
  actionDescription,
  onSuccess,
  onClose,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setErrorMsg('');
      setTimeout(() => {
        hiddenInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const verifyPinCode = (candidate: string) => {
    if (candidate === expectedPin) {
      setPinInput('');
      setErrorMsg('');
      onSuccess();
    } else {
      setErrorMsg(
        'รหัส PIN ไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้งครับ'
      );
      setPinInput('');
      setTimeout(() => {
        hiddenInputRef.current?.focus();
      }, 50);
    }
  };

  const handleDigitPress = (digit: string) => {
    if (pinInput.length >= 4) return;
    setErrorMsg('');
    const next = pinInput + digit;
    setPinInput(next);
    if (next.length === 4) {
      setTimeout(() => verifyPinCode(next), 120);
    }
  };

  const handleBackspace = () => {
    setErrorMsg('');
    setPinInput((prev) => prev.slice(0, -1));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length !== 4) {
      setErrorMsg('กรุณากรอกรหัส PIN ให้ครบ 4 หลักครับ');
      return;
    }
    verifyPinCode(pinInput);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-xl w-full max-w-sm p-6 relative shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิดหน้าต่างรหัส PIN"
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 mb-4 pr-6">
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              ยืนยันรหัส PIN สำหรับผู้ดูแลระบบ
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              {actionDescription ||
                'กรุณากรอกรหัส PIN 4 หลักเพื่อดำเนินการต่อ'}
            </p>
          </div>
        </div>

        <form onSubmit={handleFormSubmit}>
          <input
            ref={hiddenInputRef}
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pinInput}
            onChange={(e) => {
              const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 4);
              setErrorMsg('');
              setPinInput(digitsOnly);
              if (digitsOnly.length === 4) {
                setTimeout(() => verifyPinCode(digitsOnly), 120);
              }
            }}
            className="sr-only"
            aria-label="รหัส PIN 4 หลัก"
          />

          <div
            onClick={() => hiddenInputRef.current?.focus()}
            className="grid grid-cols-4 gap-3 my-5 cursor-text"
          >
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = idx < pinInput.length;
              const isCurrent = idx === pinInput.length;
              return (
                <div
                  key={idx}
                  className={`h-13 rounded-lg border flex items-center justify-center font-mono text-xl font-bold transition-all ${
                    isCurrent
                      ? 'border-slate-900 ring-2 ring-slate-900/15 bg-white'
                      : isFilled
                      ? 'border-slate-400 bg-slate-50 text-slate-900'
                      : 'border-slate-200 bg-slate-50 text-slate-300'
                  }`}
                >
                  {isFilled ? '•' : ''}
                </div>
              );
            })}
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs font-semibold text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigitPress(digit)}
                className="h-11 rounded-lg bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 font-mono text-base font-semibold text-slate-900 transition-colors cursor-pointer tabular-nums"
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                setPinInput('');
                setErrorMsg('');
                hiddenInputRef.current?.focus();
              }}
              className="h-11 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
            >
              ล้างค่า
            </button>

            <button
              type="button"
              onClick={() => handleDigitPress('0')}
              className="h-11 rounded-lg bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 font-mono text-base font-semibold text-slate-900 transition-colors cursor-pointer tabular-nums"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleBackspace}
              aria-label="ลบตัวเลขสุดท้าย"
              className="h-11 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
            >
              <Delete className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              className="py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>ยืนยันรหัส PIN</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
