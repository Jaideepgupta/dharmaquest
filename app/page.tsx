'use client';

import { useMemo, useState } from 'react';
import {
  ArrowRight, BookOpen, Bookmark, ChevronRight, Compass,
  GraduationCap, Heart, Menu, Search, Sparkles, Sun, X,
  Play, Clock3, BookMarked, Brain, ScrollText, Flower2, CircleHelp
} from 'lucide-react';

const scriptureItems = [
  { title: 'Bhagavad Gita', subtitle: 'The song of the Divine', tag: '18 chapters · 700 verses', category: 'Gita Library', icon: 'ॐ', tone: 'saffron', description: 'Explore Karma, Bhakti, Jnana and the path of Dharma.' },
  { title: 'The Upanishads', subtitle: 'Questions of the Self', tag: 'Principal texts & more', category: 'Wisdom texts', icon: '◉', tone: 'plum', description: 'Discover Atman, Brahman, consciousness and liberation.' },
  { title: 'The Four Vedas', subtitle: 'Foundations of Vedic knowledge', tag: 'Rig · Sama · Yajur · Atharva', category: 'Wisdom texts', icon: '✺', tone: 'gold', description: 'Meet the oldest layers of Vedic tradition and thought.' },
  { title: 'The Six Darshanas', subtitle: 'Six ways of seeing reality', tag: 'Logic · Yoga · Vedanta · more', category: 'Philosophy', icon: '⌘', tone: 'green', description: 'Compare the classical schools of Indian philosophy.' },
  { title: 'Ramayana', subtitle: 'The journey of Rama', tag: 'Itihasa', category: 'Itihasa & Purana', icon: 'ध', tone: 'blue', description: 'Explore ideals of courage, devotion, relationships and Dharma.' },
  { title: 'Mahabharata', subtitle: 'A world of choices and Dharma', tag: 'Itihasa', category: 'Itihasa & Purana', icon: '॥', tone: 'rose', description: 'Follow the epic story and the questions it raises.' },
  { title: 'The Gita Library', subtitle: 'Many conversations, many paths', tag: 'Bhagavad · Ashtavakra · Uddhava', category: 'Gita Library', icon: 'गीत', tone: 'plum', description: 'Explore different Gita texts in their own contexts.' },
  { title: 'Puranas', subtitle: 'Stories, cosmology and traditions', tag: 'Mahapurana & more', category: 'Itihasa & Purana', icon: '❋', tone: 'gold', description: 'Discover sacred narratives and the traditions they shape.' },
];

const categories = ['All paths', 'Gita Library', 'Wisdom texts', 'Philosophy', 'Itihasa & Purana'];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('All paths');
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mode, setMode] = useState<'Brief' | 'Detailed'>('Brief');
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => scriptureItems.filter(item => {
    const matchesCategory = activeCategory === 'All paths' || item.category === activeCategory;
    const q = query.trim().toLowerCase();
    return matchesCategory && (!q || `${item.title} ${item.subtitle} ${item.description} ${item.category}`.toLowerCase().includes(q));
  }), [activeCategory, query]);

  const visible = showAll ? filtered : filtered.slice(0, 4);

  return (
    <main>
      <div className="announcement"><Sparkles size={14} /> A new way to explore timeless wisdom <span className="announcement-dot">✦</span> Start with one lesson a day</div>
      <header className="nav-wrap">
        <nav className="nav container">
          <a className="brand" href="#" aria-label="DharmaQuest home">
            <span className="brand-mark">ॐ</span>
            <span><strong>DharmaQuest</strong><small>WISDOM · WONDER · DISCOVERY</small></span>
          </a>
          <div className={`nav-links ${mobileOpen ? 'open' : ''}`}>
            <a href="#explore" onClick={() => setMobileOpen(false)}>Explore</a>
            <a href="#learning" onClick={() => setMobileOpen(false)}>Learning paths</a>
            <a href="#darshanas" onClick={() => setMobileOpen(false)}>Darshanas</a>
            <a href="#about" onClick={() => setMobileOpen(false)}>Our approach</a>
            <button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X /></button>
          </div>
          <div className="nav-actions">
            <button className="icon-button search-top" aria-label="Focus search" onClick={() => document.getElementById('scripture-search')?.focus()}><Search size={18}/></button>
            <a className="sign-in" href="#learning">Sign in</a>
            <a className="button button-dark button-small" href="#explore">Start exploring <ArrowRight size={15}/></a>
          </div>
          <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu /></button>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-pattern"></div>
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line"></span> YOUR JOURNEY INTO TIMELESS WISDOM</div>
            <h1>Ancient wisdom.<br/><em>New perspectives.</em></h1>
            <p className="hero-lede">A thoughtful space to explore the scriptures, stories and philosophies of Sanatan Dharma — one meaningful discovery at a time.</p>
            <div className="hero-buttons">
              <a href="#explore" className="button button-primary">Begin your journey <ArrowRight size={17}/></a>
              <a href="#learning" className="button button-quiet"><span className="play-circle"><Play size={12} fill="currentColor"/></span> See how it works</a>
            </div>
            <div className="hero-proof"><div className="avatar-stack"><span>अ</span><span>ॐ</span><span>ज्ञ</span></div><span>Curiosity-led learning</span><i></i><span>Rooted in sources</span></div>
          </div>
          <div className="hero-art" aria-label="Decorative illustration inspired by Indian sacred geometry">
            <div className="art-orbit orbit-one"></div><div className="art-orbit orbit-two"></div>
            <div className="art-sun"><div className="sun-core">ॐ</div><div className="sun-ring"></div><div className="sun-petal p1"></div><div className="sun-petal p2"></div><div className="sun-petal p3"></div><div className="sun-petal p4"></div><div className="sun-petal p5"></div><div className="sun-petal p6"></div></div>
            <div className="art-label label-top"><span>01 / DISCOVER</span><b>Begin with a question</b></div>
            <div className="art-label label-bottom"><span>02 / UNDERSTAND</span><b>Find your own perspective</b></div>
            <span className="art-star star-a">✳</span><span className="art-star star-b">✧</span><span className="art-star star-c">·</span>
          </div>
        </div>
        <div className="hero-bottom container"><span>SCROLL TO EXPLORE</span><div className="scroll-line"></div><span>01 — 04</span></div>
      </section>

      <section className="daily-section">
        <div className="container daily-card">
          <div className="daily-left">
            <div className="section-kicker"><Sun size={15}/> A MOMENT OF WISDOM</div>
            <div className="daily-quote">कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।</div>
            <p className="quote-translation">“Your focus is on action alone, never on its fruits.”</p>
            <div className="quote-meta"><span>BHAGAVAD GITA 2.47</span><span className="meta-divider"></span><span>KARMA YOGA</span></div>
          </div>
          <div className="daily-right">
            <span className="daily-number">TODAY’S REFLECTION</span>
            <p>What changes when you give your full attention to the work, rather than worrying about the outcome?</p>
            <button className="text-link" onClick={() => setMode('Detailed')}>Explore this verse <ArrowRight size={15}/></button>
          </div>
          <div className="daily-watermark">ॐ</div>
        </div>
      </section>

      <section className="section explore-section" id="explore">
        <div className="container">
          <div className="section-heading">
            <div><div className="section-kicker">A WORLD OF KNOWLEDGE</div><h2>Where would you like<br/><em>to begin?</em></h2></div>
            <p>Follow a story, open a scripture, or explore a philosophical question. There is no single way in.</p>
          </div>
          <div className="explore-toolbar">
            <div className="category-tabs">{categories.map(cat => <button key={cat} className={activeCategory === cat ? 'active' : ''} onClick={() => {setActiveCategory(cat);setShowAll(false);}}>{cat}</button>)}</div>
            <label className="search-box"><Search size={17}/><input id="scripture-search" value={query} onChange={e => {setQuery(e.target.value);setShowAll(true);}} placeholder="Search scriptures, ideas..." /></label>
          </div>
          <div className="scripture-grid">
            {visible.map((item, i) => <article className="scripture-card" key={item.title}>
              <div className={`card-art ${item.tone}`}><span className="card-art-symbol">{item.icon}</span><span className="card-index">0{i+1}</span><span className="card-art-caption">{item.category.toUpperCase()}</span></div>
              <div className="scripture-card-body"><div className="card-meta">{item.tag}</div><h3>{item.title}</h3><p className="card-subtitle">{item.subtitle}</p><p className="card-description">{item.description}</p><a href="#learning" className="card-link">Explore collection <ArrowRight size={15}/></a></div>
            </article>)}
            {visible.length === 0 && <div className="empty-state">No matches yet. Try another search or category.</div>}
          </div>
          {filtered.length > 4 && <div className="center-action"><button className="button button-outline" onClick={() => setShowAll(!showAll)}>{showAll ? 'Show less' : 'View all collections'} <ArrowRight size={16}/></button></div>}
        </div>
      </section>

      <section className="learning-section" id="learning">
        <div className="container learning-grid">
          <div className="learning-copy"><div className="section-kicker">LEARN AT YOUR OWN PACE</div><h2>One idea at a time.<br/><em>A lifetime of discovery.</em></h2><p>Start with a clear, approachable summary. Go deeper when curiosity takes you further. Every topic offers two ways to learn.</p>
            <div className="learning-features"><div><span className="feature-icon"><Sparkles size={18}/></span><span><b>Brief view</b><small>Get the central idea in a few minutes.</small></span></div><div><span className="feature-icon"><BookOpen size={18}/></span><span><b>Detailed view</b><small>Explore context, verses, meanings and interpretations.</small></span></div><div><span className="feature-icon"><Compass size={18}/></span><span><b>Follow your curiosity</b><small>Connect ideas across texts and traditions.</small></span></div></div>
            <a href="#explore" className="button button-primary">Explore learning paths <ArrowRight size={16}/></a>
          </div>
          <div className="lesson-preview">
            <div className="lesson-top"><span className="lesson-label">A SAMPLE LESSON</span><span className="lesson-progress">LESSON 01 <span>•</span> 5 MIN</span></div>
            <div className="lesson-title-row"><div><span className="lesson-tag">BHAGAVAD GITA · CHAPTER 2</span><h3>Sankhya Yoga</h3><p>The yoga of knowledge</p></div><div className="lesson-om">ॐ</div></div>
            <div className="mode-toggle"><button className={mode === 'Brief' ? 'selected' : ''} onClick={() => setMode('Brief')}>Brief view</button><button className={mode === 'Detailed' ? 'selected' : ''} onClick={() => setMode('Detailed')}>Detailed view</button></div>
            {mode === 'Brief' ? <div className="lesson-content"><div className="lesson-callout">THE CHAPTER IN A NUTSHELL</div><p>Arjuna is overwhelmed by the thought of fighting in the war. Krishna begins by teaching him about the eternal nature of the Self, the importance of Dharma and the discipline of action without attachment.</p><div className="lesson-takeaway"><Sparkles size={16}/><span><b>Central idea</b><small>Act with clarity and commitment. Let wisdom guide your actions, not fear of the outcome.</small></span></div></div> : <div className="lesson-content"><div className="lesson-callout">DEEPER EXPLORATION</div><p>Chapter 2 moves from Arjuna’s grief to Krishna’s teaching on the nature of the Self (Atman), the demands of Dharma, equanimity in action and the characteristics of steady wisdom (Sthitaprajna).</p><div className="lesson-takeaway"><BookMarked size={16}/><span><b>Explore the structure</b><small>Verses 2.1–10: Arjuna’s grief · 2.11–30: The Self · 2.31–38: Dharma · 2.39–53: Karma Yoga · 2.54–72: Steady wisdom.</small></span></div></div>}
            <div className="lesson-footer"><span><Clock3 size={14}/> Your pace, your path</span><button onClick={() => setMode(mode === 'Brief' ? 'Detailed' : 'Brief')}>Switch view <ArrowRight size={14}/></button></div>
          </div>
        </div>
      </section>

      <section className="darshana-section" id="darshanas">
        <div className="container">
          <div className="darshana-heading"><div><div className="section-kicker">EXPLORE THE BIG QUESTIONS</div><h2>Six perspectives.<br/><em>One vast conversation.</em></h2></div><p>The six classical Darshanas offer distinct approaches to knowledge, reality, consciousness and liberation.</p></div>
          <div className="darshana-list">
            {[['01','Nyaya','Logic & valid knowledge','How do we know what is true?'],['02','Vaisheshika','Categories of reality','What are the building blocks of existence?'],['03','Samkhya','Consciousness & nature','What is the difference between the observer and the observed?'],['04','Yoga','Practice & inner stillness','How can the mind become steady?'],['05','Purva Mimamsa','Dharma & Vedic interpretation','How do we understand duty and action?'],['06','Vedanta','Brahman & the Self','What is the ultimate nature of reality?']].map(([n,name,sub,q]) => <div className="darshana-row" key={name}><span className="darshana-number">{n}</span><div className="darshana-name"><b>{name}</b><small>{sub}</small></div><p>{q}</p><ChevronRight size={18}/></div>)}
          </div>
          <div className="darshana-footnote">A starting point for exploration. Each school contains diverse texts, thinkers and interpretations.</div>
        </div>
      </section>

      <section className="path-section">
        <div className="container path-inner">
          <div className="path-copy"><div className="section-kicker">YOUR JOURNEY, YOUR WAY</div><h2>Curiosity is a<br/><em>beautiful beginning.</em></h2><p>Whether you are opening these texts for the first time or returning to study them more deeply, there is a path for you.</p><a href="#explore" className="button button-dark">Find your starting point <ArrowRight size={16}/></a></div>
          <div className="path-cards"><div className="path-card"><span className="path-icon"><Flower2/></span><span className="path-level">PATH 01</span><h3>New to the wisdom</h3><p>Build a foundation with stories, simple explanations and key ideas.</p><span className="path-time">START WITH THE BASICS <ArrowRight size={14}/></span></div><div className="path-card featured"><span className="path-icon"><Brain/></span><span className="path-level">PATH 02</span><h3>Curious explorer</h3><p>Connect scriptures, compare philosophies and follow deeper questions.</p><span className="path-time">EXPLORE CONNECTIONS <ArrowRight size={14}/></span></div><div className="path-card"><span className="path-icon"><GraduationCap/></span><span className="path-level">PATH 03</span><h3>Dedicated student</h3><p>Study original passages, commentaries and philosophical traditions.</p><span className="path-time">GO DEEPER <ArrowRight size={14}/></span></div></div>
        </div>
      </section>

      <section className="approach-section" id="about"><div className="container approach-grid"><div><div className="section-kicker">A THOUGHTFUL WAY TO LEARN</div><h2>Respect the source.<br/><em>Make room for inquiry.</em></h2></div><div className="approach-points"><div><span><ScrollText/></span><p><b>Grounded in sources</b><small>Translations, references and traditions are clearly identified.</small></p></div><div><span><Heart/></span><p><b>Many perspectives, respectfully presented</b><small>We make space for different schools, lineages and interpretations.</small></p></div><div><span><CircleHelp/></span><p><b>Questions are welcome</b><small>Explore, compare and think critically. Learning is a journey, not a test.</small></p></div></div></div></section>

      <section className="closing-section"><div className="closing-mandala">✺</div><div className="container closing-content"><div className="section-kicker">THE JOURNEY BEGINS WITH YOU</div><h2>Let curiosity<br/><em>lead the way.</em></h2><a href="#explore" className="button button-primary">Explore DharmaQuest <ArrowRight size={16}/></a></div></section>

      <footer className="footer"><div className="container footer-main"><a className="brand" href="#"><span className="brand-mark">ॐ</span><span><strong>DharmaQuest</strong><small>WISDOM · WONDER · DISCOVERY</small></span></a><p>A modern learning space for timeless ideas.</p><div className="footer-links"><a href="#explore">Explore</a><a href="#learning">Learning paths</a><a href="#about">Our approach</a><button onClick={() => setSaved(!saved)}><Bookmark size={14} fill={saved ? 'currentColor' : 'none'}/>{saved ? 'Saved' : 'Save this site'}</button></div></div><div className="container footer-bottom"><span>© 2026 DharmaQuest · An independent learning concept</span><span>Built for wonder, guided by sources.</span></div></footer>
    </main>
  );
}
