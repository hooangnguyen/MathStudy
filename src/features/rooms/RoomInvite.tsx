import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { Check, Link2, Maximize2, Share2, Users, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { buildJoinUrl, displayJoinUrl } from './joinLink';

/** Mã QR dạng SVG (nét, phóng to bao nhiêu cũng được). */
export const QrCode: React.FC<{ value: string; className?: string; label?: string }> = ({ value, className, label }) => {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    let cancelled = false;
    QRCode.toString(value, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1e1b4b', light: '#ffffff' } })
      .then((out) => !cancelled && setSvg(out))
      .catch(() => !cancelled && setSvg(''));
    return () => { cancelled = true; };
  }, [value]);

  return (
    <div
      role="img"
      aria-label={label ?? 'Mã QR vào phòng'}
      className={cn('bg-white [&>svg]:w-full [&>svg]:h-full', className)}
      // SVG do thư viện qrcode tạo từ link của chính app, không chứa nội dung người dùng nhập
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

interface RoomInviteProps {
  code: string;
  /** Tên hiển thị trên màn trình chiếu, vd. tên đề quiz */
  title?: string;
  playerCount?: number;
  /** Cho phép mở màn trình chiếu toàn màn hình (cho giáo viên chiếu lên bảng) */
  presentable?: boolean;
}

/**
 * Thẻ mời vào phòng kiểu Kahoot/Quizizz: mã QR, mã phòng, link, nút sao chép/chia sẻ
 * và chế độ trình chiếu để học sinh quét từ màn hình lớn.
 */
export const RoomInvite: React.FC<RoomInviteProps> = ({ code, title, playerCount, presentable = false }) => {
  const url = buildJoinUrl(code);
  const [copied, setCopied] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Sao chép link này:', url);
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title: 'Vào phòng MathStudy', text: `Vào phòng bằng mã ${code}`, url });
    } catch {
      /* người dùng huỷ chia sẻ */
    }
  };

  const openPresenter = () => {
    setPresenting(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  const closePresenter = () => {
    setPresenting(false);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  };

  useEffect(() => {
    if (!presenting) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPresenting(false);
    // Thoát toàn màn hình bằng phím của trình duyệt thì cũng đóng màn trình chiếu
    const onFullscreen = () => !document.fullscreenElement && setPresenting(false);
    window.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFullscreen);
    };
  }, [presenting]);

  return (
    <>
      <section className="w-full bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5" aria-label="Mời vào phòng">
        <div className="flex items-center gap-4">
          <QrCode value={url} className="w-32 h-32 sm:w-36 sm:h-36 shrink-0 rounded-2xl border border-slate-200 p-1.5" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-500">Mã phòng</p>
            <p className="text-[2rem] sm:text-5xl font-black tracking-[0.08em] sm:tracking-[0.15em] tabular-nums text-indigo-700 leading-tight whitespace-nowrap" data-testid="room-code">
              {code}
            </p>
            <p className="text-sm text-slate-500 mt-1 leading-snug">
              Quét mã QR bằng camera điện thoại, hoặc nhập mã ở mục <span className="font-semibold text-slate-700">Vào phòng</span>.
            </p>
          </div>
        </div>

        <p className="mt-3 px-3 py-2 rounded-xl bg-slate-50 text-sm font-semibold text-slate-600 truncate" title={url}>
          {displayJoinUrl(code)}
        </p>

        <div className={cn('grid gap-2 mt-3', presentable ? (canShare ? 'grid-cols-3' : 'grid-cols-2') : canShare ? 'grid-cols-2' : 'grid-cols-1')}>
          <button
            onClick={copyLink}
            className={cn(
              'h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-colors',
              copied ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            )}
          >
            {copied ? <Check size={18} /> : <Link2 size={18} />}
            {copied ? 'Đã chép' : 'Chép link'}
          </button>
          {canShare && (
            <button onClick={share} className="h-11 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-sm font-bold flex items-center justify-center gap-1.5">
              <Share2 size={18} /> Chia sẻ
            </button>
          )}
          {presentable && (
            <button onClick={openPresenter} className="h-11 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-bold flex items-center justify-center gap-1.5">
              <Maximize2 size={18} /> Trình chiếu
            </button>
          )}
        </div>
      </section>

      {/* Portal ra <body>: phần tử cha có transform (hiệu ứng chuyển cảnh) sẽ làm `fixed` bị bó trong cha */}
      {presenting && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Trình chiếu mã vào phòng"
          className="fixed inset-0 z-[100] bg-gradient-to-br from-indigo-600 to-violet-700 text-white flex flex-col items-center justify-center p-6 gap-6 overflow-y-auto"
        >
          <button
            onClick={closePresenter}
            aria-label="Đóng trình chiếu"
            className="absolute top-4 right-4 w-12 h-12 rounded-2xl bg-white/15 hover:bg-white/25 flex items-center justify-center"
          >
            <X size={26} />
          </button>

          {title && <p className="text-xl sm:text-2xl font-bold text-indigo-100 text-center max-w-3xl">{title}</p>}

          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-14">
            <QrCode value={url} className="w-[min(70vw,52vh)] h-[min(70vw,52vh)] rounded-3xl p-3 shadow-2xl" />
            <div className="text-center lg:text-left space-y-4">
              <div>
                <p className="text-lg sm:text-2xl font-semibold text-indigo-100">Quét mã QR hoặc vào</p>
                <p className="text-2xl sm:text-4xl font-black break-all">{displayJoinUrl(code)}</p>
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-semibold text-indigo-100">Mã phòng</p>
                <p className="text-6xl sm:text-8xl font-black tracking-[0.12em] tabular-nums">{code}</p>
              </div>
              {playerCount !== undefined && (
                <p className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/15 text-xl sm:text-2xl font-black">
                  <Users size={26} /> {playerCount} đã vào
                </p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
