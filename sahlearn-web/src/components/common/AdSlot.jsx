import { useEffect, useRef } from 'react';

// Same public publisher ID as the loader in index.html and /ads.txt.
const CLIENT = 'ca-pub-1503199816496831';

/**
 * One AdSense display unit. Renders nothing until it is given a slot ID, so the
 * site stays ad-free until units are placed after approval.
 *
 * Usage: <AdSlot slot="1234567890" />
 */
export default function AdSlot({ slot, format = 'auto', className = '' }) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!slot || pushed.current) return;
    // A remounted slot must not be pushed twice — AdSense throws
    // "All 'ins' elements in the DOM with class=adsbygoogle already have ads".
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // The script is blocked or still loading. Nothing to show, nothing to fix.
    }
  }, [slot]);

  if (!slot) return null;

  return (
    // print:hidden keeps ads off printed pages; the label is an AdSense policy
    // requirement where an ad could be mistaken for site content.
    <div className={`my-8 print:hidden ${className}`}>
      <p className="text-[10px] uppercase tracking-widest text-ink-400 mb-1">Advertisement</p>
      <ins
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
