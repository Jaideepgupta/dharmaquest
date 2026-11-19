import Link from 'next/link';
import { ArrowRight, BookOpen, Compass, Heart, Play, ScrollText, CircleHelp, Sparkles, Sun, Flower2, Brain, GraduationCap } from 'lucide-react';
import ExploreGrid from '@/components/ExploreGrid';
import LessonPreview from '@/components/LessonPreview';
import ContinueLearning from '@/components/ContinueLearning';
import { darshanas } from '@/lib/content/darshanas';
import { lessonMeta } from '@/lib/learning/lessons';
import { verseOfTheDay as v } from '@/lib/content/verses';

const journey = [
  { label: 'Bhagavad Gita', detail: 'Chapter 2 · Sankhya Yoga', href: '/gita/bhagavad-gita/2' },
  { label: 'The Upanishads', detail: 'Begin with Isha or Katha', href: '/scriptures/upanishads' },
  { label: 'The Six Darshanas', detail: 'Meet the schools of thought', href: '/darshanas' },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-pattern" aria-hidden="true"></div>
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line"></span> YOUR JOURNEY INTO TIMELESS WISDOM</div>
            <h1>Ancient Wisdom.<br /><em>New Perspectives.</em></h1>
            <p className="hero-lede">Explore the scriptures, philosophies and timeless wisdom of Sanatan Dharma through an engaging learning experience.</p>
            <div className="hero-buttons">
              <Link href="/scriptures" className="button button-primary">Explore scriptures <ArrowRight size={17} aria-hidden="true" /></Link>
              <Link href="/learn" className="button button-quiet"><span className="play-circle" aria-hidden="true"><Play size={12} fill="currentColor" /></span> Start learning</Link>
            </div>
            <div className="hero-proof"><span>Curiosity-led learning</span><i aria-hidden="true"></i><span>Rooted in sources</span></div>
          </div>
          <div className="hero-art" role="img" aria-label="Decorative illustration inspired by Indian sacred geometry">
            <div className="art-orbit orbit-one"></div><div className="art-orbit orbit-two"></div>
            <div className="art-sun"><div className="sun-core">ॐ</div><div className="sun-ring"></div>
              {[1, 2, 3, 4, 5, 6].map((n) => <div key={n} className={`sun-petal p${n}`}></div>)}
            </div>
            <div className="art-label label-top"><span>01 / DISCOVER</span><b>Begin with a question</b></div>
            <div className="art-label label-bottom"><span>02 / UNDERSTAND</span><b>Find your own perspective</b></div>
            <span className="art-star star-a">✳</span><span className="art-star star-b">✧</span>
          </div>
        </div>
      </section>

      <section className="daily-section" aria-labelledby="verse-title">
        <div className="container daily-card">
          <div className="daily-left">
            <div className="section-kicker"><Sun size={15} aria-hidden="true" /> FEATURED VERSE</div>
            <h2 id="verse-title" className="sr-only">Featured verse: {v.reference}</h2>
            <div className="daily-quote" lang="sa">{v.sanskrit.map((l) => <span key={l}>{l}<br /></span>)}</div>
            <p className="translit" lang="sa-Latn">{v.transliteration.map((l) => <span key={l}>{l}<br /></span>)}</p>
            <p className="quote-translation">{v.briefSummary}</p>
            <p className="note-small">{v.summaryNote}</p>
            <div className="quote-meta"><span>{v.reference.toUpperCase()}</span><span className="meta-divider" aria-hidden="true"></span><span>{v.theme.toUpperCase()}</span></div>
          </div>
          <div className="daily-right">
            <span className="daily-number">MEANING AND SOURCE</span>
            <dl className="verse-facts">
              <div><dt>Hindi</dt><dd><span className="badge badge-review">Content under review</span></dd></div>
              <div><dt>English translation</dt><dd><span className="badge badge-review">Content under review</span></dd></div>
              <div><dt>Source</dt><dd>{v.source.title} — {v.source.locator}. {v.source.attribution}.</dd></div>
              <div><dt>Transliteration</dt><dd>{v.transliterationScheme}</dd></div>
            </dl>
            <Link className="text-link" href="/gita/bhagavad-gita/2/47">Read more <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>
          <div className="daily-watermark" aria-hidden="true">ॐ</div>
        </div>
      </section>

      <section className="section continue-section" aria-labelledby="continue-title">
        <div className="container">
          <div className="section-heading">
            <div><div className="section-kicker">CONTINUE LEARNING</div><h2 id="continue-title">A sample journey<br /><em>to begin with.</em></h2></div>
            <p>Here is a suggested route through the library. Once you complete a lesson, this section shows your own place instead. Progress is kept privately in this browser.</p>
          </div>
          <ContinueLearning meta={lessonMeta}>
          <ol className="journey">
            {journey.map((j, i) => (
              <li key={j.label}>
                <Link href={j.href}>
                  <span className="journey-n" aria-hidden="true">{i + 1}</span>
                  <span><b>{j.label}</b><small>{j.detail}</small></span>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>
          </ContinueLearning>
        </div>
      </section>

      <section className="section explore-section" id="explore" aria-labelledby="explore-title">
        <div className="container">
          <div className="section-heading">
            <div><div className="section-kicker">A WORLD OF KNOWLEDGE</div><h2 id="explore-title">Where would you like<br /><em>to begin?</em></h2></div>
            <p>Follow a story, open a scripture, or explore a philosophical question. There is no single way in.</p>
          </div>
          <ExploreGrid />
        </div>
      </section>

      <section className="learning-section" id="learning" aria-labelledby="learning-title">
        <div className="container learning-grid">
          <div className="learning-copy"><div className="section-kicker">LEARN AT YOUR OWN PACE</div>
            <h2 id="learning-title">One idea at a time.<br /><em>A lifetime of discovery.</em></h2>
            <p>Start with a clear, approachable summary. Go deeper when curiosity takes you further. Every topic offers two ways to learn.</p>
            <div className="learning-features">
              <div><span className="feature-icon"><Sparkles size={18} aria-hidden="true" /></span><span><b>Brief view</b><small>Get the central idea in a few minutes.</small></span></div>
              <div><span className="feature-icon"><BookOpen size={18} aria-hidden="true" /></span><span><b>Detailed view</b><small>Explore context, verses, meanings and interpretations.</small></span></div>
              <div><span className="feature-icon"><Compass size={18} aria-hidden="true" /></span><span><b>Follow your curiosity</b><small>Connect ideas across texts and traditions.</small></span></div>
            </div>
            <Link href="/learn" className="button button-primary">Explore learning paths <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          <LessonPreview />
        </div>
      </section>

      <section className="darshana-section" id="darshanas" aria-labelledby="darshana-title">
        <div className="container">
          <div className="darshana-heading"><div><div className="section-kicker">EXPLORE THE BIG QUESTIONS</div><h2 id="darshana-title">Six perspectives.<br /><em>One vast conversation.</em></h2></div>
            <p>The six classical Darshanas offer distinct approaches to knowledge, reality, consciousness and liberation.</p></div>
          <ul className="darshana-list">
            {darshanas.map((d) => (
              <li key={d.slug}>
                <Link className="darshana-row" href={`/darshanas/${d.slug}`}>
                  <span className="darshana-number">{d.number}</span>
                  <span className="darshana-name"><b>{d.name}</b><small>{d.focus}</small></span>
                  <p>{d.coreQuestion}</p>
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="darshana-footnote">A starting point for exploration. Each school contains diverse texts, thinkers and interpretations.</div>
        </div>
      </section>

      <section className="path-section" aria-labelledby="path-title">
        <div className="container path-inner">
          <div className="path-copy"><div className="section-kicker">YOUR JOURNEY, YOUR WAY</div><h2 id="path-title">Curiosity is a<br /><em>beautiful beginning.</em></h2>
            <p>Whether you are opening these texts for the first time or returning to study them more deeply, there is a path for you.</p>
            <Link href="/learn" className="button button-dark">Find your starting point <ArrowRight size={16} aria-hidden="true" /></Link></div>
          <div className="path-cards">
            <Link href="/learn#beginner" className="path-card"><span className="path-icon"><Flower2 aria-hidden="true" /></span><span className="path-level">BEGINNER</span><h3>New to the wisdom</h3><p>Build a foundation with stories, simple explanations and key ideas.</p><span className="path-time">START WITH THE BASICS <ArrowRight size={14} aria-hidden="true" /></span></Link>
            <Link href="/learn#intermediate" className="path-card featured"><span className="path-icon"><Brain aria-hidden="true" /></span><span className="path-level">INTERMEDIATE</span><h3>Curious explorer</h3><p>Connect scriptures, compare philosophies and follow deeper questions.</p><span className="path-time">EXPLORE CONNECTIONS <ArrowRight size={14} aria-hidden="true" /></span></Link>
            <Link href="/learn#advanced" className="path-card"><span className="path-icon"><GraduationCap aria-hidden="true" /></span><span className="path-level">ADVANCED</span><h3>Dedicated student</h3><p>Study original passages, commentaries and philosophical traditions.</p><span className="path-time">GO DEEPER <ArrowRight size={14} aria-hidden="true" /></span></Link>
          </div>
        </div>
      </section>

      <section className="approach-section" id="about-approach" aria-labelledby="approach-title">
        <div className="container approach-grid">
          <div><div className="section-kicker">OUR APPROACH</div><h2 id="approach-title">Respect the source.<br /><em>Make room for inquiry.</em></h2>
            <Link href="/about" className="text-link dark-link">Read how we handle sources <ArrowRight size={15} aria-hidden="true" /></Link></div>
          <div className="approach-points">
            <div><span><ScrollText aria-hidden="true" /></span><p><b>Grounded in sources</b><small>Translations, references and traditions are clearly identified, and original texts are kept separate from interpretation.</small></p></div>
            <div><span><Heart aria-hidden="true" /></span><p><b>Many perspectives, respectfully presented</b><small>We make space for different schools, lineages and interpretations.</small></p></div>
            <div><span><CircleHelp aria-hidden="true" /></span><p><b>Questions are welcome</b><small>Explore, compare and think critically. Learning is a journey, not a test.</small></p></div>
          </div>
        </div>
      </section>

      <section className="closing-section">
        <div className="closing-mandala" aria-hidden="true">✺</div>
        <div className="container closing-content"><div className="section-kicker">THE JOURNEY BEGINS WITH YOU</div><h2>Let curiosity<br /><em>lead the way.</em></h2>
          <Link href="/scriptures" className="button button-primary">Explore DharmaQuest <ArrowRight size={16} aria-hidden="true" /></Link></div>
      </section>
    </>
  );
}
