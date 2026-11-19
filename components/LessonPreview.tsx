'use client';

import { useState } from 'react';
import { ArrowRight, BookMarked, Clock3, Sparkles } from 'lucide-react';

export default function LessonPreview() {
  const [mode, setMode] = useState<'Brief' | 'Detailed'>('Brief');
  return (
    <div className="lesson-preview">
      <div className="lesson-top"><span className="lesson-label">SAMPLE LESSON</span><span className="lesson-progress">PREVIEW · ILLUSTRATIVE</span></div>
      <div className="lesson-title-row">
        <div><span className="lesson-tag">BHAGAVAD GITA · CHAPTER 2</span><h3>Sankhya Yoga</h3><p>The yoga of knowledge</p></div>
        <div className="lesson-om" aria-hidden="true">ॐ</div>
      </div>
      <div className="mode-toggle" role="group" aria-label="Reading mode">
        <button type="button" aria-pressed={mode === 'Brief'} className={mode === 'Brief' ? 'selected' : ''} onClick={() => setMode('Brief')}>Brief view</button>
        <button type="button" aria-pressed={mode === 'Detailed'} className={mode === 'Detailed' ? 'selected' : ''} onClick={() => setMode('Detailed')}>Detailed view</button>
      </div>
      {mode === 'Brief' ? (
        <div className="lesson-content">
          <div className="lesson-callout">THE CHAPTER IN A NUTSHELL</div>
          <p>Arjuna is overwhelmed by the thought of fighting in the war. Krishna begins by teaching him about the eternal nature of the Self, the importance of Dharma and the discipline of action without attachment.</p>
          <div className="lesson-takeaway"><Sparkles size={16} aria-hidden="true" /><span><b>Central idea</b><small>Act with clarity and commitment. Let wisdom guide your actions, not fear of the outcome.</small></span></div>
        </div>
      ) : (
        <div className="lesson-content">
          <div className="lesson-callout">DEEPER EXPLORATION</div>
          <p>Chapter 2 moves from Arjuna’s grief to Krishna’s teaching on the nature of the Self (Atman), the demands of Dharma, equanimity in action and the characteristics of steady wisdom (Sthitaprajna).</p>
          <div className="lesson-takeaway"><BookMarked size={16} aria-hidden="true" /><span><b>Explore the structure</b><small>Verses 2.1–10: Arjuna’s grief · 2.11–30: The Self · 2.31–38: Dharma · 2.39–53: Karma Yoga · 2.54–72: Steady wisdom.</small></span></div>
        </div>
      )}
      <div className="lesson-footer">
        <span><Clock3 size={14} aria-hidden="true" /> Your pace, your path</span>
        <button type="button" onClick={() => setMode(mode === 'Brief' ? 'Detailed' : 'Brief')}>Switch view <ArrowRight size={14} aria-hidden="true" /></button>
      </div>
      <p className="lesson-disclaimer">An illustrative DharmaQuest summary. Verse-by-verse lessons with cited translations are in preparation.</p>
    </div>
  );
}
