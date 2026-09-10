import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { shouldUsePersonalFeed } from "@/lib/feed";
import {
  Bell, Bookmark, ChevronDown, Compass, Film, Flame, History, Home as HomeIcon,
  Library, Menu, MoreVertical, Play, Plus, Search, Settings, ThumbsUp, Video,
  X, Youtube,
} from "lucide-react";
import { toast } from "sonner";

type FeedVideo = {
  id: string;
  title: string;
  creator: string;
  views: string;
  age: string;
  duration?: string;
  category: string;
  thumbnail: string;
  avatar: string;
  url?: string;
};

const demoVideos: FeedVideo[] = [
  { id: "demo-1", title: "The quiet art of making something that lasts", creator: "Milo Studio", views: "1.2M views", age: "2 days ago", duration: "18:42", category: "Design", thumbnail: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=85", avatar: "MS" },
  { id: "demo-2", title: "A field guide to the new creative economy", creator: "Field Notes", views: "842K views", age: "5 days ago", duration: "24:16", category: "Business", thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85", avatar: "FN" },
  { id: "demo-3", title: "The sound of a city waking up", creator: "Sora / sonic diary", views: "326K views", age: "1 week ago", duration: "09:08", category: "Music", thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=85", avatar: "SO" },
  { id: "demo-4", title: "A very slow morning in the Dolomites", creator: "North / South", views: "2.8M views", age: "3 weeks ago", duration: "31:20", category: "Travel", thumbnail: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=85", avatar: "NS" },
  { id: "demo-5", title: "How I organize a year of ideas in one notebook", creator: "Gina Park", views: "194K views", age: "4 days ago", duration: "12:36", category: "Productivity", thumbnail: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85", avatar: "GP" },
  { id: "demo-6", title: "The camera that changed street photography", creator: "Frame by Frame", views: "608K views", age: "2 weeks ago", duration: "16:09", category: "Photography", thumbnail: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=85", avatar: "FF" },
  { id: "demo-7", title: "Making ramen from scratch (and not rushing it)", creator: "Kitchen Hours", views: "971K views", age: "6 days ago", duration: "20:48", category: "Food", thumbnail: "https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&w=1200&q=85", avatar: "KH" },
  { id: "demo-8", title: "Building a tiny app with a big point of view", creator: "Tinker Lab", views: "421K views", age: "1 month ago", duration: "27:04", category: "Tech", thumbnail: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=85", avatar: "TL" },
];

const topics = ["All", "Music", "Mixes", "Live", "Design", "Gaming", "News", "Travel", "Recently uploaded"];
const primaryNav = [{ label: "Home", icon: HomeIcon }, { label: "Shorts", icon: Film }, { label: "Subscriptions", icon: Youtube }];
const libraryNav = [{ label: "Library", icon: Library }, { label: "History", icon: History }, { label: "Your videos", icon: Video }, { label: "Watch later", icon: Bookmark }];

function initials(name: string) {
  return name.split(/\s|\//).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "YT";
}

function Avatar({ value, className = "" }: { value: string; className?: string }) {
  return <span className={`avatar ${className}`}>{value}</span>;
}

function VideoCard({ video, onOpen }: { video: FeedVideo; onOpen: (video: FeedVideo) => void }) {
  return <article className="yt-video-card" onClick={() => onOpen(video)}><button className="yt-thumbnail" aria-label={`Play ${video.title}`}><img src={video.thumbnail} alt="" /><span className="yt-duration">{video.duration || "HD"}</span><span className="yt-play"><Play size={18} fill="currentColor" /></span></button><div className="yt-card-info"><Avatar value={video.avatar} className="yt-avatar" /><div className="yt-card-copy"><h3>{video.title}</h3><p>{video.creator} <span className="verified-check">✓</span></p><span>{video.views} <b>·</b> {video.age}</span></div><button className="yt-card-menu" aria-label="More actions" onClick={(event) => { event.stopPropagation(); toast("More actions are coming soon"); }}><MoreVertical size={18} /></button></div></article>;
}

function SideNav({ onConnect, onNavigate }: { onConnect: () => void; onNavigate: (label: string) => void }) {
  return <aside className="yt-sidebar"><div className="yt-side-top"><button className="yt-wordmark" onClick={() => onNavigate("Home")}><span className="yt-logo"><Play size={14} fill="currentColor" /></span><strong>streamly</strong></button></div><div className="yt-side-scroll"><nav className="yt-nav-group">{primaryNav.map(({ label, icon: Icon }, index) => <button key={label} className={`yt-nav-item ${index === 0 ? "active" : ""}`} onClick={() => onNavigate(label)}><Icon size={21} fill={index === 0 ? "currentColor" : "none"} /><span>{label}</span></button>)}</nav><div className="yt-nav-rule" /><nav className="yt-nav-group">{libraryNav.map(({ label, icon: Icon }) => <button key={label} className="yt-nav-item" onClick={() => onNavigate(label)}><Icon size={21} /><span>{label}</span></button>)}</nav><div className="yt-nav-rule" /><section className="connect-card"><span className="connect-icon"><Youtube size={22} /></span><strong>Make it personal</strong><p>Connect YouTube to see your subscriptions and latest videos here.</p><button onClick={onConnect}>Connect YouTube</button></section><div className="yt-nav-rule" /><button className="yt-nav-item" onClick={() => onNavigate("Settings")}><Settings size={21} /><span>Settings</span></button></div><div className="yt-side-footer">About · Press · Copyright · Contact us<br />Terms · Privacy · Policy & Safety<div className="yt-copyright">© 2026 Streamly</div></div></aside>;
}

export default function Home() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const connectionQuery = trpc.youtube.connection.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const feedQuery = trpc.youtube.feed.useQuery(undefined, { enabled: isAuthenticated && Boolean(connectionQuery.data?.connected), retry: false });
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("youtube");
    if (status === "connected") {
      toast.success("YouTube đã được kết nối");
      void connectionQuery.refetch();
      void feedQuery.refetch();
      window.history.replaceState({}, "", "/");
    } else if (status === "error") {
      toast.error("Không thể kết nối YouTube. Hãy thử lại.");
      window.history.replaceState({}, "", "/");
    } else if (status === "login") {
      toast("Hãy đăng nhập Streamly trước khi kết nối YouTube");
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const connectYoutube = () => {
    if (authLoading) return;
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    window.location.href = "/api/youtube/oauth/start";
  };

  const personalVideos = feedQuery.data?.videos ?? [];
  const connected = Boolean(connectionQuery.data?.connected);
  const feed = useMemo<FeedVideo[]>(() => personalVideos.map((video) => ({ id: video.id, title: video.title, creator: video.creator, views: "From your subscriptions", age: video.publishedAt ? new Date(video.publishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Recently", category: "Subscriptions", thumbnail: video.thumbnail, avatar: initials(video.creator), url: video.url })), [personalVideos]);
  const hasPersonalFeed = shouldUsePersonalFeed(connected, feed.length);
  const videos = hasPersonalFeed ? feed : demoVideos;
  const filteredVideos = videos.filter((video) => (topic === "All" || topic === "Recently uploaded" || video.category.toLowerCase().includes(topic.toLowerCase())) && (!search.trim() || `${video.title} ${video.creator}`.toLowerCase().includes(search.trim().toLowerCase())));

  const openVideo = (video: FeedVideo) => {
    if (video.url) window.open(video.url, "_blank", "noopener,noreferrer");
    else toast(`Playing “${video.title}”`);
  };
  const navigate = (label: string) => { toast(`${label} is ready to explore`); setSidebarOpen(false); };

  return <div className="yt-app"><button className={`yt-mobile-scrim ${sidebarOpen ? "visible" : ""}`} aria-label="Close menu" onClick={() => setSidebarOpen(false)} /><SideNav onConnect={connectYoutube} onNavigate={navigate} /><div className="yt-main"><header className="yt-header"><button className="yt-icon-btn yt-hamburger" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={23} /></button><button className="yt-mobile-wordmark yt-wordmark" onClick={() => navigate("Home")}><span className="yt-logo"><Play size={13} fill="currentColor" /></span><strong>streamly</strong></button><div className="yt-search"><input aria-label="Search" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && toast(search ? `Searching for “${search}”` : "Type something to search")} placeholder="Search" />{search && <button aria-label="Clear search" onClick={() => setSearch("")}><X size={17} /></button>}<button className="yt-search-btn" aria-label="Search" onClick={() => toast(search ? `Searching for “${search}”` : "Type something to search")}><Search size={21} /></button></div><div className="yt-header-actions"><button className="yt-create" onClick={() => toast("Upload flow is coming soon")}><Plus size={20} /><span>Create</span></button><button className="yt-icon-btn" aria-label="Notifications" onClick={() => toast("You are all caught up")}><Bell size={21} /></button><button className="yt-profile" onClick={() => toast(user ? `Signed in as ${user.name || user.email || "Streamly user"}` : "Sign in to personalize Streamly")}><Avatar value={user ? initials(user.name || user.email || "AL") : "AL"} className="yt-profile-avatar" /></button></div></header>
    <div className="yt-content"><div className="yt-chips">{topics.map((item) => <button key={item} className={topic === item ? "selected" : ""} onClick={() => setTopic(item)}>{item}</button>)}</div><section className={`yt-personal-banner ${connected ? "connected" : ""}`}><div className="yt-personal-icon"><Youtube size={27} /></div><div className="yt-personal-copy"><span>{connected ? "Your YouTube" : "Welcome to Streamly"}</span><h1>{connected ? `Latest from ${connectionQuery.data?.channelTitle || "your subscriptions"}` : "Your videos, in one calm place."}</h1><p>{connected ? `${feed.length} videos from channels you follow, refreshed from YouTube.` : "Sign in and connect YouTube to bring your subscriptions and personal feed into this view."}</p></div><button className="yt-connect-btn" onClick={connectYoutube}>{connected ? "Refresh connection" : isAuthenticated ? "Connect YouTube" : "Sign in to connect"}<ChevronDown size={16} /></button></section><div className="yt-section-heading"><h2>{hasPersonalFeed ? "Latest uploads" : "Recommended for you"}</h2><button onClick={() => setTopic("Recently uploaded")}>View all <span>→</span></button></div>{feedQuery.isLoading ? <div className="yt-loading"><span /><span /><span /></div> : feedQuery.error ? <div className="yt-empty"><Search size={24} /><h3>YouTube feed could not load</h3><p>{feedQuery.error.message || "The YouTube API returned an error. Try reconnecting the account."}</p><button onClick={() => void feedQuery.refetch()}>Try again</button></div> : filteredVideos.length ? <div className="yt-video-grid">{filteredVideos.map((video) => <VideoCard key={video.id} video={video} onOpen={openVideo} />)}</div> : <div className="yt-empty"><Search size={24} /><h3>No videos found</h3><p>Try another search or reset the selected topic.</p><button onClick={() => { setSearch(""); setTopic("All"); }}>Reset feed</button></div>}<footer className="yt-footer"><span>About</span><span>Terms</span><span>Privacy</span><span>Help</span><span className="yt-footer-brand">Streamly · Good videos, no noise.</span></footer></div></div></div>;
}

void ThumbsUp;
void Flame;
void Compass;
