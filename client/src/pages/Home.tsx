import { useMemo, useState, type ReactNode } from "react";
import {
  Bell, Bookmark, ChevronDown, Compass, Ellipsis, Flame, History, Home as HomeIcon,
  Library, ListVideo, Menu, MoreHorizontal, Play, Plus, Search, Settings, Sparkles,
  Video, X, Zap,
} from "lucide-react";
import { toast } from "sonner";

type VideoItem = {
  id: number; title: string; creator: string; views: string; age: string; duration: string;
  category: string; thumbnail: string; avatar: string; verified?: boolean;
};

const videos: VideoItem[] = [
  { id: 1, title: "The quiet art of making something that lasts", creator: "Milo Studio", views: "1.2M views", age: "2 days ago", duration: "18:42", category: "Design", thumbnail: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=85", avatar: "MS", verified: true },
  { id: 2, title: "A field guide to the new creative economy", creator: "Field Notes", views: "842K views", age: "5 days ago", duration: "24:16", category: "Business", thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85", avatar: "FN", verified: true },
  { id: 3, title: "The sound of a city waking up", creator: "Sora / sonic diary", views: "326K views", age: "1 week ago", duration: "09:08", category: "Music", thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=85", avatar: "SO" },
  { id: 4, title: "A very slow morning in the Dolomites", creator: "North / South", views: "2.8M views", age: "3 weeks ago", duration: "31:20", category: "Travel", thumbnail: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=85", avatar: "NS", verified: true },
  { id: 5, title: "How I organize a year of ideas in one notebook", creator: "Gina Park", views: "194K views", age: "4 days ago", duration: "12:36", category: "Productivity", thumbnail: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85", avatar: "GP" },
  { id: 6, title: "The camera that changed street photography", creator: "Frame by Frame", views: "608K views", age: "2 weeks ago", duration: "16:09", category: "Photography", thumbnail: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=85", avatar: "FF", verified: true },
  { id: 7, title: "Making ramen from scratch (and not rushing it)", creator: "Kitchen Hours", views: "971K views", age: "6 days ago", duration: "20:48", category: "Food", thumbnail: "https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&w=1200&q=85", avatar: "KH" },
  { id: 8, title: "Building a tiny app with a big point of view", creator: "Tinker Lab", views: "421K views", age: "1 month ago", duration: "27:04", category: "Tech", thumbnail: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=85", avatar: "TL", verified: true },
];

const categories = ["For you", "Trending", "Design", "Music", "Travel", "Tech", "Food", "Live"];
const primaryNav = [{ label: "Home", icon: HomeIcon }, { label: "Explore", icon: Compass }, { label: "Trending", icon: Flame }];
const libraryNav = [{ label: "Library", icon: Library }, { label: "History", icon: History }, { label: "Your videos", icon: Video }, { label: "Watch later", icon: Bookmark }];

function Avatar({ initials, className = "" }: { initials: string; className?: string }) {
  return <div className={`avatar ${className}`}>{initials}</div>;
}

function IconButton({ label, children, onClick, className = "" }: { label: string; children: ReactNode; onClick?: () => void; className?: string }) {
  return <button className={`icon-button ${className}`} aria-label={label} onClick={onClick}>{children}</button>;
}

function VideoCard({ video, onSelect }: { video: VideoItem; onSelect: (video: VideoItem) => void }) {
  return <article className="video-card" onClick={() => onSelect(video)}>
    <button className="thumbnail-wrap" aria-label={`Play ${video.title}`}>
      <img src={video.thumbnail} alt="" className="thumbnail" />
      <div className="thumbnail-shade" /><span className="duration">{video.duration}</span>
      <span className="card-play"><Play size={18} fill="currentColor" /></span><span className="save-hover"><Bookmark size={16} /></span>
    </button>
    <div className="video-card-copy"><Avatar initials={video.avatar} className="small-avatar" /><div className="min-w-0"><h3>{video.title}</h3><p className="creator-line">{video.creator} {video.verified && <span className="verified">✓</span>}</p><p className="meta-line">{video.views} <span>·</span> {video.age}</p></div><button className="card-more" aria-label="More options" onClick={(event) => { event.stopPropagation(); toast("More actions are coming soon"); }}><Ellipsis size={18} /></button></div>
  </article>;
}

function SideNav({ onNavigate, onClose }: { onNavigate: (label: string) => void; onClose?: () => void }) {
  return <aside className="side-nav"><div className="side-logo-row"><button className="wordmark" onClick={() => onNavigate("Home")}><span className="logo-mark"><Play size={14} fill="currentColor" /></span><span>streamly</span></button>{onClose && <IconButton label="Close navigation" onClick={onClose}><X size={18} /></IconButton>}</div><div className="side-scroll">
    <nav className="side-section">{primaryNav.map(({ label, icon: Icon }, index) => <button key={label} onClick={() => onNavigate(label)} className={`side-link ${index === 0 ? "active" : ""}`}><Icon size={19} /><span>{label}</span>{label === "Trending" && <span className="nav-hot">new</span>}</button>)}</nav>
    <div className="side-divider" /><p className="side-label">Your space</p><nav className="side-section">{libraryNav.map(({ label, icon: Icon }) => <button key={label} onClick={() => onNavigate(label)} className="side-link"><Icon size={19} /><span>{label}</span></button>)}</nav>
    <div className="side-divider" /><p className="side-label">Subscriptions</p><div className="sub-list">{["Milo Studio", "Field Notes", "North / South", "Tinker Lab"].map((name, index) => <button key={name} onClick={() => onNavigate(name)} className="sub-item"><Avatar initials={["MS", "FN", "NS", "TL"][index]} className="tiny-avatar" /><span>{name}</span><span className="sub-live" style={{ opacity: index === 2 ? 1 : 0 }} /></button>)}</div>
    <button className="side-link muted-link" onClick={() => onNavigate("Settings")}><Settings size={19} /><span>Settings</span></button>
  </div><div className="side-footer"><p>Streamly is a demo experience.</p><span>© 2026 Streamly</span></div></aside>;
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("For you");
  const [selectedVideo, setSelectedVideo] = useState(videos[0]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const notify = (message: string) => toast(message);
  const filteredVideos = useMemo(() => {
    const query = search.trim().toLowerCase();
    return videos.filter((video) => (category === "For you" || category === "Trending" || category === "Live" || video.category === category) && (!query || `${video.title} ${video.creator} ${video.category}`.toLowerCase().includes(query)));
  }, [category, search]);
  const selectVideo = (video: VideoItem) => { setSelectedVideo(video); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const navigate = (label: string) => { notify(`${label} is ready to explore`); setSidebarOpen(false); };

  return <div className="app-shell">
    {sidebarOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setSidebarOpen(false)} />}
    <SideNav onNavigate={navigate} onClose={sidebarOpen ? () => setSidebarOpen(false) : undefined} />
    <div className="content-wrap"><header className="topbar"><IconButton label="Open navigation" className="mobile-menu" onClick={() => setSidebarOpen(true)}><Menu size={21} /></IconButton><button className="mobile-wordmark wordmark" onClick={() => notify("You are already on the home feed")}><span className="logo-mark"><Play size={13} fill="currentColor" /></span><span>streamly</span></button>
      <div className="search-wrap"><Search size={18} className="search-icon" /><input aria-label="Search videos" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && notify(search ? `Searching for “${search}”` : "Type something to search")} placeholder="Search videos, creators, topics" />{search && <button className="clear-search" onClick={() => setSearch("")} aria-label="Clear search"><X size={15} /></button>}<button className="search-submit" aria-label="Search" onClick={() => notify(search ? `Searching for “${search}”` : "Type something to search")}><Search size={17} /></button></div>
      <div className="top-actions"><IconButton label="Upload video" onClick={() => notify("Upload flow is coming soon")}><Plus size={21} /></IconButton><IconButton label="Notifications" onClick={() => notify("You are all caught up")}><Bell size={20} /></IconButton><button className="profile-button" onClick={() => notify("Profile menu is coming soon")}><Avatar initials="AL" className="profile-avatar" /><ChevronDown size={14} /></button></div>
    </header>
    <main className="main-content"><div className="eyebrow-row"><span className="eyebrow-dot" /><span>Thursday, September 10</span><span className="eyebrow-separator" /><span className="eyebrow-muted">A better way to spend your next 10 minutes</span></div>
      <div className="intro-row"><div><h1>Good evening, Alex<span className="lime-dot">.</span></h1><p>Here are a few things worth your attention.</p></div><button className="ghost-action" onClick={() => notify("Your feed has been refreshed")}><Sparkles size={16} /> Curate my feed</button></div>
      <section className="feature-layout"><div className="feature-player" style={{ backgroundImage: `url(${selectedVideo.thumbnail})` }}><div className="player-blur" /><div className="player-overlay" /><div className="player-topline"><span className="feature-label"><Sparkles size={13} /> Editor's pick</span><button className="player-menu" onClick={() => notify("More player options are coming soon")} aria-label="Player options"><MoreHorizontal size={20} /></button></div><button className="big-play" aria-label={`Play ${selectedVideo.title}`} onClick={() => notify(`Playing “${selectedVideo.title}”`)}><Play size={29} fill="currentColor" /></button><div className="player-bottom"><div><p className="player-kicker">{selectedVideo.category} · {selectedVideo.duration}</p><h2>{selectedVideo.title}</h2><p className="player-creator"><Avatar initials={selectedVideo.avatar} className="tiny-avatar" /> {selectedVideo.creator} <span className="verified">✓</span></p></div><button className="queue-button" onClick={() => notify("Added to your queue")}><ListVideo size={17} /> Queue</button></div></div>
        <div className="feature-rail"><div className="rail-header"><div><span className="rail-kicker"><Zap size={13} /> On the rise</span><h2>Worth a watch</h2></div><button onClick={() => setCategory("Trending")}>See all <span>↗</span></button></div>{[videos[3], videos[1], videos[6]].map((video, index) => <button className={`rail-card ${selectedVideo.id === video.id ? "selected" : ""}`} key={video.id} onClick={() => selectVideo(video)}><span className="rail-number">0{index + 1}</span><img src={video.thumbnail} alt="" /><span className="rail-copy"><strong>{video.title}</strong><small>{video.creator} · {video.views}</small></span><span className="rail-duration">{video.duration}</span></button>)}<div className="rail-note"><div className="note-icon"><Sparkles size={15} /></div><p><strong>Fresh perspective</strong><br />Your feed is getting smarter as you watch.</p><button aria-label="Learn more" onClick={() => notify("Personalized recommendations are coming soon")}>→</button></div></div></section>
      <div className="section-heading"><div><span className="section-kicker">Handpicked for you</span><h2>Latest from your corner</h2></div><button className="view-all" onClick={() => notify("Showing all latest videos")}>View all <span>↗</span></button></div>
      <div className="category-bar" role="tablist" aria-label="Video categories">{categories.map((item) => <button key={item} role="tab" aria-selected={category === item} className={category === item ? "category-active" : ""} onClick={() => setCategory(item)}>{item === "Trending" && <Flame size={14} />}{item === "Live" && <span className="live-dot" />}{item}</button>)}</div>
      {filteredVideos.length ? <div className="video-grid">{filteredVideos.map((video) => <VideoCard key={video.id} video={video} onSelect={selectVideo} />)}</div> : <div className="empty-state"><div className="empty-icon"><Search size={22} /></div><h3>No videos found</h3><p>Try another search or choose a different corner of Streamly.</p><button onClick={() => { setSearch(""); setCategory("For you"); }}>Reset feed</button></div>}
      <section className="creator-banner"><div className="creator-glow" /><div className="creator-copy"><span className="section-kicker">Made for the curious</span><h2>There is always another<br /><em>rabbit hole</em> to find.</h2><p>Follow a few good creators. Let the rest unfold.</p></div><div className="creator-orbit"><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="orbit-core"><Sparkles size={24} /></div><span className="orbit-avatar orbit-a"><Avatar initials="MS" /></span><span className="orbit-avatar orbit-b"><Avatar initials="SO" /></span><span className="orbit-avatar orbit-c"><Avatar initials="GP" /></span></div><button className="creator-cta" onClick={() => notify("Creator discovery is coming soon")}>Find your people <span>→</span></button></section>
      <footer className="main-footer"><span><span className="logo-mark mini"><Play size={10} fill="currentColor" /></span> streamly</span><span>Good videos, no noise.</span><span>Privacy · Terms · Help</span></footer>
    </main></div></div>;
}

export { videos };
