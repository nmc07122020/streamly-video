import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { shouldUsePersonalFeed } from "@/lib/feed";
import { Bell, ChevronDown, Film, Menu, MoreVertical, Play, Plus, Search, X, Youtube } from "lucide-react";
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

const primaryNav = [{ label: "Video ngắn", icon: Film }];

function initials(name: string) {
  return name.split(/\s|\//).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "YT";
}

function Avatar({ value, className = "" }: { value: string; className?: string }) {
  return <span className={`avatar ${className}`}>{value}</span>;
}

function VideoCard({ video, onOpen }: { video: FeedVideo; onOpen: (video: FeedVideo) => void }) {
  return <article className="yt-video-card" onClick={() => onOpen(video)}><button className="yt-thumbnail" aria-label={`Phát ${video.title}`}><img src={video.thumbnail} alt="" /><span className="yt-duration">{video.duration || "HD"}</span><span className="yt-play"><Play size={18} fill="currentColor" /></span></button><div className="yt-card-info"><Avatar value={video.avatar} className="yt-avatar" /><div className="yt-card-copy"><h3>{video.title}</h3><p>{video.creator} <span className="verified-check">✓</span></p><span>{video.views} <b>·</b> {video.age}</span></div><button className="yt-card-menu" aria-label="Thao tác khác" onClick={(event) => { event.stopPropagation(); toast("Các thao tác khác sẽ sớm ra mắt"); }}><MoreVertical size={18} /></button></div></article>;
}

function SideNav({ onNavigate }: { onNavigate: (label: string) => void }) {
  return <aside className="yt-sidebar"><div className="yt-side-top"><button className="yt-wordmark" onClick={() => onNavigate("Video ngắn")}><span className="yt-logo"><Play size={14} fill="currentColor" /></span><strong>streamly</strong></button></div><div className="yt-side-scroll"><nav className="yt-nav-group">{primaryNav.map(({ label, icon: Icon }) => <button key={label} className="yt-nav-item active" onClick={() => onNavigate(label)}><Icon size={21} /><span>{label}</span></button>)}</nav></div><div className="yt-side-footer">Giới thiệu · Báo chí · Bản quyền · Liên hệ<br />Điều khoản · Quyền riêng tư · An toàn<div className="yt-copyright">© 2026 Streamly</div></div></aside>;
}

export default function Home() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const connectionQuery = trpc.youtube.connection.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const feedQuery = trpc.youtube.feed.useQuery(undefined, { enabled: isAuthenticated && Boolean(connectionQuery.data?.connected), retry: false });
  const [search, setSearch] = useState("");
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
  const feed = useMemo<FeedVideo[]>(() => personalVideos.map((video) => ({ id: video.id, title: video.title, creator: video.creator, views: "Từ các kênh bạn đăng ký", age: video.publishedAt ? new Date(video.publishedAt).toLocaleDateString("vi-VN", { month: "short", day: "numeric" }) : "Mới đây", category: video.category || "All", thumbnail: video.thumbnail, avatar: initials(video.creator), url: video.url })), [personalVideos]);
  const hasPersonalFeed = shouldUsePersonalFeed(connected, feed.length);
  const filterFeed = (items: FeedVideo[]) => items.filter((video) => {
    const categoryLabel = video.category;
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || `${video.title} ${video.creator} ${video.category} ${categoryLabel}`.toLowerCase().includes(query);
    return matchesSearch;
  });
  const filteredPersonal = filterFeed(feed);

  const openVideo = (video: FeedVideo) => {
    if (video.url) window.open(video.url, "_blank", "noopener,noreferrer");
    else toast(`Đang phát “${video.title}”`);
  };
  const navigate = (label: string) => { toast(`${label} đã sẵn sàng để khám phá`); setSidebarOpen(false); };

  return <div className="yt-app"><button className={`yt-mobile-scrim ${sidebarOpen ? "visible" : ""}`} aria-label="Đóng menu" onClick={() => setSidebarOpen(false)} /><SideNav onNavigate={navigate} /><div className="yt-main"><header className="yt-header"><button className="yt-icon-btn yt-hamburger" aria-label="Mở menu điều hướng" onClick={() => setSidebarOpen(true)}><Menu size={23} /></button><button className="yt-mobile-wordmark yt-wordmark" onClick={() => navigate("Video ngắn")}><span className="yt-logo"><Play size={13} fill="currentColor" /></span><strong>streamly</strong></button><div className="yt-search"><input aria-label="Tìm kiếm" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && toast(search ? `Đang tìm “${search}”` : "Nhập nội dung cần tìm")} placeholder="Tìm kiếm" />{search && <button aria-label="Xóa tìm kiếm" onClick={() => setSearch("")}><X size={17} /></button>}<button className="yt-search-btn" aria-label="Tìm kiếm" onClick={() => toast(search ? `Đang tìm “${search}”` : "Nhập nội dung cần tìm")}><Search size={21} /></button></div><div className="yt-header-actions"><button className="yt-create" onClick={() => toast("Tính năng tải video sẽ sớm ra mắt")}><Plus size={20} /><span>Tạo</span></button><button className="yt-icon-btn" aria-label="Thông báo" onClick={() => toast("Bạn đã xem hết thông báo")}><Bell size={21} /></button><button className="yt-profile" onClick={() => toast(user ? `Đã đăng nhập với tài khoản ${user.name || user.email || "Streamly"}` : "Đăng nhập để cá nhân hóa Streamly")}><Avatar value={user ? initials(user.name || user.email || "AL") : "AL"} className="yt-profile-avatar" /></button></div></header>
    <div className="yt-content"><section className={`yt-personal-banner ${connected ? "connected" : ""}`}><div className="yt-personal-icon"><Youtube size={27} /></div><div className="yt-personal-copy"><span>{connected ? "YouTube của bạn" : "Chào mừng đến Streamly"}</span><h1>{connected ? `Mới nhất từ ${connectionQuery.data?.channelTitle || "các kênh bạn đăng ký"}` : "Video của bạn, trong một không gian yên bình."}</h1><p>{connected ? `${feed.length} video từ các kênh bạn theo dõi, được cập nhật từ YouTube.` : "Đăng nhập và kết nối YouTube để đưa các kênh đăng ký cùng feed cá nhân vào đây."}</p></div><button className="yt-connect-btn" onClick={connectYoutube}>{connected ? "Làm mới kết nối" : isAuthenticated ? "Kết nối YouTube" : "Đăng nhập để kết nối"}<ChevronDown size={16} /></button></section>{connected && <><div className="yt-section-heading yt-personal-heading"><h2>Video mới nhất</h2><button onClick={() => void feedQuery.refetch()}>Làm mới <span>↻</span></button></div>{feedQuery.isLoading ? <div className="yt-loading"><span /><span /><span /></div> : feedQuery.error ? <div className="yt-empty"><Search size={24} /><h3>Không thể tải feed YouTube</h3><p>{feedQuery.error.message || "YouTube đã trả về lỗi. Hãy kết nối lại tài khoản."}</p><button onClick={() => void feedQuery.refetch()}>Thử lại</button></div> : hasPersonalFeed ? <div className="yt-video-grid">{filteredPersonal.map((video) => <VideoCard key={video.id} video={video} onOpen={openVideo} />)}</div> : <div className="yt-empty"><Search size={24} /><h3>Chưa tìm thấy video cá nhân</h3><p>Tài khoản YouTube đã kết nối nhưng chưa có video công khai nào được trả về.</p><button onClick={() => void feedQuery.refetch()}>Thử lại</button></div>}</>}<footer className="yt-footer"><span>Giới thiệu</span><span>Điều khoản</span><span>Quyền riêng tư</span><span>Trợ giúp</span><span className="yt-footer-brand">Streamly · Video hay, không ồn ào.</span></footer></div></div></div>;
}
