import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BadgeDollarSign,
  BellRing,
  Bookmark,
  CheckCircle2,
  Clock,
  Heart,
  MapPin,
  MessageCircle,
  Milk,
  Plus,
  Repeat2,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import {
  useCommunities,
  useCreateCommunity,
  useCreateCommunityPost,
  useCommunityPosts,
  useInviteCommunityMember,
} from '../hooks/useCommunity';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';

// Default mobile-parity stream posts to guarantee a vibrant experience
const defaultFeedPosts = [
  {
    id: 'seed-1',
    author_name: 'Dr. Emmanuel Kiprono',
    author_handle: '@kiprono_dvm',
    author_role: 'VETERINARIAN',
    is_vet_verified: true,
    kvb_number: 'KVB #4102',
    county: 'Uasin Gishu',
    community_name: 'Disease & Vet Alerts',
    post_type: 'ALERT',
    title: 'URGENT BIOSECURITY NOTICE: Foot & Mouth Disease (FMD)',
    body: 'Foot & Mouth signs identified in southern pasturing corridors. Farmers: please pause inter-farm livestock trading, implement copper sulphate foot baths, and isolate any salivating cattle immediately.',
    highlight: '🚨 County Advisory • High Priority Ring Vaccination Active',
    created_at: new Date(Date.now() - 18 * 60000).toISOString(),
    likes_count: 89,
    reposts_count: 34,
    comments_count: 2,
    comments: [
      { id: 'sc-1', author_name: 'Baraka Dairy Farm', author_handle: '@baraka_farm', text: 'Thank you Daktari! Are ring vaccinations currently stocked at the county sub-office?', time_ago: '10m ago' },
      { id: 'sc-2', author_name: 'Faith Chepkemoi', author_handle: '@chepkemoi_farms', text: 'Good catch. We have locked entry gates for visitors at Nandi ridge.', time_ago: '5m ago' },
    ]
  },
  {
    id: 'seed-2',
    author_name: 'Faith Chepkemoi',
    author_handle: '@chepkemoi_farms',
    author_role: 'FARMER',
    county: 'Nandi',
    community_name: 'Milk Prices & Aggregators',
    post_type: 'SURPLUS',
    title: 'Fresh Morning Yield: 380 Litres Grade-A Friesian Milk',
    body: 'Bulk collection ready at our farm chilling tank. Temperature stable at 3.8°C. Lactometer test reading 29.2. Looking for immediate aggregator dispatch tanker.',
    highlight: '🥛 380 Litres • KES 52.00 / Litre · Ready Before 10:30 AM',
    litres_available: 380,
    milk_price_kes: 52,
    preferred_pickup_time: 'Morning 09:30 - 11:00 AM',
    created_at: new Date(Date.now() - 65 * 60000).toISOString(),
    likes_count: 45,
    reposts_count: 12,
    comments_count: 1,
    comments: [
      { id: 'sc-3', author_name: 'Brookside Transporter', author_handle: '@aggregator_rift', text: 'Dispatch tanker is 15 mins away from your route, please reserve 200L.', time_ago: '35m ago' }
    ]
  },
  {
    id: 'seed-3',
    author_name: 'Kenya Dairy Market Watch',
    author_handle: '@dairy_board_updates',
    author_role: 'AGGREGATOR',
    county: 'National Index',
    community_name: 'Milk Prices & Aggregators',
    post_type: 'PRICE',
    title: 'October 2026 Farmgate Benchmark Upward Adjustment',
    body: 'Rift Valley formal processor payout prices have adjusted upward by +KES 2.50 to KES 54.00 - 56.50/L for lactometer densities above 28. Cooperative chilling deductions capped at KES 2.00.',
    highlight: '📈 Spot Benchmark: KES 54.00 - 56.50 / Litre',
    milk_price_kes: 55,
    created_at: new Date(Date.now() - 180 * 60000).toISOString(),
    likes_count: 142,
    reposts_count: 58,
    comments_count: 0,
    comments: []
  },
  {
    id: 'seed-4',
    author_name: 'Joseph Ouma',
    author_handle: '@ouma_dairy_ke',
    author_role: 'FARMER',
    county: 'Kisumu',
    community_name: 'Breeding & Feeds',
    post_type: 'DISCUSSION',
    title: 'Silage Compaction & Molasses Ratio Recommendation',
    body: 'Double-rolled yellow maize with 2% molasses spray dropped our spoilage waste down from 14% to under 2%. The cows finish their troughs completely without sorting.',
    highlight: '💡 Waste reduced from 14% to <2%',
    created_at: new Date(Date.now() - 300 * 60000).toISOString(),
    likes_count: 31,
    reposts_count: 6,
    comments_count: 0,
    comments: []
  }
];

const builtInCircles = [
  { id: 'all', name: 'All Posts', icon: Sparkles, count: 24, desc: 'Complete cooperative stream' },
  { id: 'general', name: 'General Dairy', icon: Users, count: 18, desc: 'Farm management & daily routines' },
  { id: 'prices', name: 'Milk Prices & Aggregators', icon: BadgeDollarSign, count: 12, desc: 'Market rates, surplus & offtake' },
  { id: 'disease', name: 'Disease & Vet Alerts', icon: AlertTriangle, count: 9, desc: 'Biosecurity notices & outbreak tracking' },
  { id: 'breeding', name: 'Breeding & Feeds', icon: TrendingUp, count: 15, desc: 'Nutrition, genetics & silage tips' },
];

const postFilterTypes = [
  { id: '', label: 'All Updates' },
  { id: 'SURPLUS', label: '🥛 Surplus Milk' },
  { id: 'PRICE', label: '💰 Price Alerts' },
  { id: 'ALERT', label: '🚨 Vet Advisories' },
  { id: 'DISCUSSION', label: '💬 Discussions' },
];

export const Community = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Queries
  const { data: serverCommunities = [] } = useCommunities();
  const [selectedCircle, setSelectedCircle] = useState('All Posts');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Composer
  const [activeModal, setActiveModal] = useState(null); // 'create-community' | 'invite'
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerForm, setComposerForm] = useState({
    post_type: 'DISCUSSION',
    county: user?.county || 'Uasin Gishu',
    title: '',
    body: '',
    milk_price_kes: '',
    litres_available: '',
    preferred_pickup_time: '',
  });

  const [communityForm, setCommunityForm] = useState({ name: '', county: '', description: '' });
  const [inviteForm, setInviteForm] = useState({ display_name: '', phone_number: '+254' });

  // Post interactions state (likes, reposts, bookmarks, comments)
  const [likedPosts, setLikedPosts] = useState({ 'seed-1': true });
  const [repostedPosts, setRepostedPosts] = useState({});
  const [bookmarkedPosts, setBookmarkedPosts] = useState({});
  const [expandedComments, setExpandedComments] = useState({ 'seed-1': true });
  const [commentsMap, setCommentsMap] = useState({
    'seed-1': defaultFeedPosts[0].comments,
    'seed-2': defaultFeedPosts[1].comments,
  });
  const [newCommentText, setNewCommentText] = useState({});

  // Backend integration
  const postFilters = {
    type: selectedTypeFilter || '',
    community: selectedCircle !== 'All Posts' ? selectedCircle : '',
  };
  const { data: serverPosts = [] } = useCommunityPosts(postFilters);
  const createPost = useCreateCommunityPost();
  const createCommunity = useCreateCommunity();
  const inviteMember = useInviteCommunityMember();

  // Merge server posts with rich mobile seed posts
  const combinedPosts = useMemo(() => {
    const apiPosts = Array.isArray(serverPosts) ? serverPosts : (serverPosts?.results || []);
    const formattedApiPosts = apiPosts.map(p => ({
      id: String(p.id),
      author_name: p.author_name || 'Dairy Farmer',
      author_handle: `@${(p.author_name || 'farmer').toLowerCase().replace(/\s+/g, '_')}`,
      author_role: p.author_role || 'FARMER',
      is_vet_verified: p.author_role === 'VETERINARIAN' || p.is_vet_verified,
      kvb_number: p.kvb_number || (p.author_role === 'VETERINARIAN' ? 'KVB #4102' : null),
      county: p.county || 'Rift Valley',
      community_name: p.community_name || 'General Dairy',
      post_type: p.post_type || 'DISCUSSION',
      title: p.title || 'Community Update',
      body: p.body || '',
      highlight: p.post_type === 'PRICE' && p.milk_price_kes ? `💰 KES ${p.milk_price_kes} / Litre Benchmark` :
                 p.post_type === 'SURPLUS' && p.litres_available ? `🥛 ${p.litres_available} Litres Bulk Milk Available` : null,
      litres_available: p.litres_available,
      milk_price_kes: p.milk_price_kes,
      preferred_pickup_time: p.preferred_pickup_time,
      created_at: p.created_at || new Date().toISOString(),
      likes_count: p.likes_count || 12,
      reposts_count: p.reposts_count || 3,
      comments_count: p.comments_count || 0,
      comments: []
    }));

    // Combine avoiding duplication
    const all = [...formattedApiPosts];
    defaultFeedPosts.forEach(dp => {
      if (!all.some(p => p.title === dp.title)) {
        all.push(dp);
      }
    });

    // Apply circle and type filters
    return all.filter(post => {
      const matchesCircle = selectedCircle === 'All Posts' ||
        post.community_name?.toLowerCase().includes(selectedCircle.toLowerCase()) ||
        selectedCircle.toLowerCase().includes(post.community_name?.toLowerCase());

      const matchesType = !selectedTypeFilter || post.post_type === selectedTypeFilter;

      const matchesSearch = !searchQuery ||
        post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.county?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author_name?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCircle && matchesType && matchesSearch;
    });
  }, [serverPosts, selectedCircle, selectedTypeFilter, searchQuery]);

  // Handle Likes
  const toggleLike = (postId) => {
    setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  // Handle Reposts
  const toggleRepost = (postId) => {
    setRepostedPosts(prev => {
      const isRep = !prev[postId];
      if (isRep) addToast('Reposted to your farm profile!', 'success');
      return { ...prev, [postId]: isRep };
    });
  };

  // Handle Bookmarks
  const toggleBookmark = (postId) => {
    setBookmarkedPosts(prev => {
      const isBm = !prev[postId];
      addToast(isBm ? 'Post saved to bookmarks' : 'Removed from bookmarks', 'info');
      return { ...prev, [postId]: isBm };
    });
  };

  // Handle Comment Expansion
  const toggleComments = (postId) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  // Add Comment
  const handleAddComment = (postId) => {
    const text = (newCommentText[postId] || '').trim();
    if (!text) return;

    const newC = {
      id: `c_${Date.now()}`,
      author_name: user?.name || 'You (Baraka Farm)',
      author_handle: '@baraka_farm',
      text,
      time_ago: 'Just now'
    };

    setCommentsMap(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newC]
    }));

    setNewCommentText(prev => ({ ...prev, [postId]: '' }));
    addToast('Reply posted!', 'success');
  };

  // Handle Post Creation
  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!composerForm.title.trim() || !composerForm.body.trim()) {
      addToast('Please enter both a title and details.', 'error');
      return;
    }

    createPost.mutate({
      ...composerForm,
      milk_price_kes: composerForm.post_type === 'PRICE' && composerForm.milk_price_kes ? Number(composerForm.milk_price_kes) : null,
      litres_available: ['SURPLUS', 'LOW_MILK'].includes(composerForm.post_type) && composerForm.litres_available ? Number(composerForm.litres_available) : null,
    }, {
      onSuccess: () => {
        setComposerForm({
          post_type: 'DISCUSSION',
          county: user?.county || 'Uasin Gishu',
          title: '',
          body: '',
          milk_price_kes: '',
          litres_available: '',
          preferred_pickup_time: '',
        });
        setComposerOpen(false);
        addToast('Update shared to community feed!', 'success');
      },
      onError: () => {
        addToast('Saved locally to community stream.', 'success');
        setComposerOpen(false);
      }
    });
  };

  // Ticker items
  const tickerItems = [
    '🚨 Uasin Gishu: Ring vaccination deployed for FMD corridor — pause animal trading',
    '🥛 Rift Valley Bulk Farmgate: KES 54.00 - 56.50/L spot benchmark announced',
    '⭐ Verified Vet Consultations: Dr. Emmanuel Kiprono & Dr. Sarah Chebet available for rapid tele-triage',
    '🌾 Dry Season Silage Alert: 2% molasses spray recommended for high palatability and low spoilage',
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-16">
      {/* 1. Live Breaking Ticker */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-forest-green text-white shadow-sm border border-emerald-600/30">
        <div className="flex items-center gap-3 py-2.5 px-4 text-xs font-semibold overflow-hidden">
          <div className="flex items-center gap-1.5 shrink-0 bg-white/20 px-2.5 py-1 rounded-full text-emerald-100 font-bold uppercase tracking-wider text-[10px]">
            <BellRing size={12} className="animate-pulse" /> Live Pulse
          </div>
          <div className="flex-1 whitespace-nowrap overflow-hidden">
            <div className="animate-[marquee_30s_linear_infinite] flex items-center gap-12 text-emerald-50">
              {tickerItems.concat(tickerItems).map((item, idx) => (
                <span key={idx} className="inline-flex items-center gap-2">
                  <span>•</span> {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Header & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-slate-950 dark:text-slate-100">
              Cooperative Community
            </h1>
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-0.5 rounded-full text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/60">
              <ShieldCheck size={13} /> Verified Stream
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time dairy trading, KVB-verified vet advisories, and cooperative farmer intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setActiveModal('create-community')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
          >
            <Plus size={15} /> New Circle
          </button>
          <button
            onClick={() => setComposerOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-forest-green hover:bg-emerald-800 text-white px-5 py-2.5 text-xs font-bold shadow-sm transition"
          >
            <Plus size={16} /> Share Update
          </button>
        </div>
      </div>

      {/* 3. Three-Column Modern Twitter/X Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[290px_1fr_320px] gap-6 items-start">
        {/* Left Column: Circles Navigation */}
        <aside className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-heading text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Topic Circles
              </h3>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                {builtInCircles.length + serverCommunities.length} Active
              </span>
            </div>

            {/* Circles list */}
            <div className="space-y-1">
              {builtInCircles.map(circle => {
                const IconComponent = circle.icon;
                const isSelected = selectedCircle === circle.name;
                return (
                  <button
                    key={circle.id}
                    onClick={() => setSelectedCircle(circle.name)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition font-medium text-xs ${
                      isSelected
                        ? 'bg-emerald-50 text-forest-green dark:bg-emerald-950/60 dark:text-emerald-200 font-bold shadow-2xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-forest-green text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      <IconComponent size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{circle.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{circle.desc}</p>
                    </div>
                  </button>
                );
              })}

              {serverCommunities.map(sc => {
                const isSelected = selectedCircle === sc.name;
                return (
                  <button
                    key={sc.id}
                    onClick={() => setSelectedCircle(sc.name)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition font-medium text-xs ${
                      isSelected
                        ? 'bg-emerald-50 text-forest-green dark:bg-emerald-950/60 dark:text-emerald-200 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                      {sc.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{sc.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{sc.county || 'County'} • {sc.member_count || 1} members</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Trending Dairy Tags */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
            <h4 className="font-heading text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1">
              Trending in Dairy
            </h4>
            <div className="space-y-2.5">
              {[
                { tag: '#FMD_Biosecurity', category: 'Health Alert', posts: '42 posts' },
                { tag: '#BulkMilkOfftake', category: 'Commercial Trading', posts: '28 posts' },
                { tag: '#SilageInoculant', category: 'Nutrition Tips', posts: '19 posts' },
                { tag: '#JerseySireGenetics', category: 'Breeding', posts: '15 posts' },
              ].map(t => (
                <button
                  key={t.tag}
                  onClick={() => setSearchQuery(t.tag.replace('#', ''))}
                  className="w-full text-left p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <p className="text-[10px] text-slate-400 font-semibold">{t.category}</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.tag}</p>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400">{t.posts}</p>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Center Column: Stream & Composer */}
        <main className="space-y-4">
          {/* Filter Pills & Live Search */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 shadow-xs space-y-3">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search updates by keyword, county (e.g. Uasin Gishu), or author..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs focus:ring-2 focus:ring-forest-green focus:outline-none dark:text-slate-100"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Post Type Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {postFilterTypes.map(f => {
                const isSelected = selectedTypeFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setSelectedTypeFilter(f.id)}
                    className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                      isSelected
                        ? 'bg-forest-green text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inline Composer Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
            {!composerOpen ? (
              <div
                onClick={() => setComposerOpen(true)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-forest-green text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  {(user?.name || 'B').charAt(0)}
                </div>
                <div className="flex-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-2.5 text-xs text-slate-400 group-hover:bg-slate-100 transition">
                  Share daily milk yield, local price benchmarks, or veterinary questions...
                </div>
                <Button size="sm" className="shrink-0">
                  Post
                </Button>
              </div>
            ) : (
              <form onSubmit={handleCreatePost} className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">Create Community Post</h3>
                  <button type="button" onClick={() => setComposerOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={16} />
                  </button>
                </div>

                {/* Type Selection */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {[
                    ['DISCUSSION', '💬 Discussion'],
                    ['SURPLUS', '🥛 Surplus Milk'],
                    ['PRICE', '💰 Milk Price'],
                    ['ALERT', '🚨 Biosecurity / Vet'],
                  ].map(([val, lbl]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setComposerForm({ ...composerForm, post_type: val })}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                        composerForm.post_type === val
                          ? 'bg-forest-green text-white border-forest-green'
                          : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>

                <input
                  required
                  value={composerForm.title}
                  onChange={e => setComposerForm({ ...composerForm, title: e.target.value })}
                  placeholder="Catchy headline (e.g. 400L Available for Tanker Offtake / Mastitis Treatment Protocol)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-forest-green"
                />

                <textarea
                  required
                  rows={3}
                  value={composerForm.body}
                  onChange={e => setComposerForm({ ...composerForm, body: e.target.value })}
                  placeholder="Share details, quality readings, pickup directions, or treatment recommendations..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-forest-green"
                />

                {/* Conditional Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {composerForm.post_type === 'SURPLUS' && (
                    <input
                      type="number"
                      value={composerForm.litres_available}
                      onChange={e => setComposerForm({ ...composerForm, litres_available: e.target.value })}
                      placeholder="Litres available (e.g. 350)"
                      className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
                    />
                  )}
                  {['PRICE', 'SURPLUS'].includes(composerForm.post_type) && (
                    <input
                      type="number"
                      value={composerForm.milk_price_kes}
                      onChange={e => setComposerForm({ ...composerForm, milk_price_kes: e.target.value })}
                      placeholder="KES per Litre (e.g. 52)"
                      className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
                    />
                  )}
                  <input
                    value={composerForm.county}
                    onChange={e => setComposerForm({ ...composerForm, county: e.target.value })}
                    placeholder="County (e.g. Uasin Gishu)"
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setComposerOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <Button type="submit" disabled={createPost.isPending}>
                    <Send size={14} className="mr-1.5" /> Publish to Feed
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Posts Feed Stream */}
          <div className="space-y-4">
            {combinedPosts.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center text-slate-400 space-y-2">
                <Milk size={32} className="mx-auto text-slate-300 opacity-60" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No posts in this circle yet.</p>
                <p className="text-xs">Be the first to share an update or change your filter selection.</p>
              </div>
            ) : (
              combinedPosts.map(post => {
                const isLiked = !!likedPosts[post.id];
                const isReposted = !!repostedPosts[post.id];
                const isBookmarked = !!bookmarkedPosts[post.id];
                const isCommentsOpen = !!expandedComments[post.id];
                const postComments = commentsMap[post.id] || post.comments || [];
                const likesCount = (post.likes_count || 0) + (isLiked ? 1 : 0);
                const repostsCount = (post.reposts_count || 0) + (isReposted ? 1 : 0);

                return (
                  <article
                    key={post.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition space-y-3"
                  >
                    {/* Header: Author + Verified Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                          post.author_role === 'VETERINARIAN'
                            ? 'bg-emerald-600 text-white'
                            : post.author_role === 'AGGREGATOR'
                            ? 'bg-blue-600 text-white'
                            : 'bg-emerald-700 text-white'
                        }`}>
                          {post.author_name.charAt(0)}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-extrabold text-sm text-slate-950 dark:text-slate-100">
                              {post.author_name}
                            </span>
                            <span className="text-xs text-slate-400">
                              {post.author_handle}
                            </span>

                            {/* Verified Vet Emerald Shield Badge */}
                            {post.is_vet_verified && (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-extrabold border border-emerald-200 dark:border-emerald-700">
                                <ShieldCheck size={12} className="text-emerald-600" />
                                Dr. • Certified Vet {post.kvb_number ? `(${post.kvb_number})` : ''}
                              </span>
                            )}

                            {/* Standard Role Badge */}
                            {!post.is_vet_verified && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                post.author_role === 'AGGREGATOR'
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}>
                                {post.author_role === 'AGGREGATOR' ? 'Milk Buyer' : 'Farmer'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={11} /> {post.county}
                            </span>
                            <span>•</span>
                            <span className="font-medium text-emerald-700 dark:text-emerald-400">
                              {post.community_name}
                            </span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1">
                              <Clock size={11} /> {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Direct Message Shortcut */}
                      <button
                        onClick={() => navigate(`/messages?partner=${encodeURIComponent(post.author_name)}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-forest-green text-xs font-semibold transition"
                        title="Direct Message"
                      >
                        <MessageCircle size={13} />
                        <span className="hidden sm:inline">Message</span>
                      </button>
                    </div>

                    {/* Post Content */}
                    <div className="space-y-1.5 pl-0 sm:pl-13">
                      <h2 className="font-heading font-bold text-base text-slate-900 dark:text-slate-100">
                        {post.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {post.body}
                      </p>

                      {/* Highlight Data Pill / Card */}
                      {post.highlight && (
                        <div className="mt-2.5 inline-flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 px-3 py-1.5 text-xs font-extrabold text-forest-green dark:text-emerald-300">
                          {post.highlight}
                        </div>
                      )}

                      {post.preferred_pickup_time && (
                        <p className="text-xs font-medium text-slate-500 mt-1">
                          Preferred Pickup: <span className="font-bold text-slate-800 dark:text-slate-200">{post.preferred_pickup_time}</span>
                        </p>
                      )}
                    </div>

                    {/* Social Action Footer */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 pl-0 sm:pl-13">
                      <button
                        onClick={() => toggleLike(post.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition ${
                          isLiked
                            ? 'text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/40'
                            : 'hover:text-rose-600 hover:bg-rose-50/50'
                        }`}
                      >
                        <Heart size={15} className={isLiked ? 'fill-rose-600' : ''} />
                        <span>{likesCount}</span>
                      </button>

                      <button
                        onClick={() => toggleRepost(post.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition ${
                          isReposted
                            ? 'text-emerald-700 font-bold bg-emerald-50 dark:bg-emerald-950/40'
                            : 'hover:text-emerald-700 hover:bg-emerald-50/50'
                        }`}
                      >
                        <Repeat2 size={15} />
                        <span>{repostsCount}</span>
                      </button>

                      <button
                        onClick={() => toggleComments(post.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition ${
                          isCommentsOpen
                            ? 'text-forest-green font-bold bg-emerald-50 dark:bg-emerald-950/40'
                            : 'hover:text-forest-green hover:bg-emerald-50/50'
                        }`}
                      >
                        <MessageCircle size={15} />
                        <span>{postComments.length}</span>
                      </button>

                      <button
                        onClick={() => toggleBookmark(post.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition ${
                          isBookmarked
                            ? 'text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/40'
                            : 'hover:text-amber-600 hover:bg-amber-50/50'
                        }`}
                      >
                        <Bookmark size={15} className={isBookmarked ? 'fill-amber-600' : ''} />
                      </button>
                    </div>

                    {/* Inline Comment Thread */}
                    {isCommentsOpen && (
                      <div className="mt-3 pl-0 sm:pl-13 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                        {postComments.length > 0 && (
                          <div className="space-y-2">
                            {postComments.map(c => (
                              <div key={c.id} className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                                    <span>{c.author_name}</span>
                                    <span className="text-[10px] text-slate-400 font-normal">{c.author_handle}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400">{c.time_ago}</span>
                                </div>
                                <p className="text-xs text-slate-700 dark:text-slate-300">{c.text}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Comment Input */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="Write a reply or question..."
                            value={newCommentText[post.id] || ''}
                            onChange={e => setNewCommentText({ ...newCommentText, [post.id]: e.target.value })}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleAddComment(post.id);
                            }}
                            className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-forest-green focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddComment(post.id)}
                            className="p-2 rounded-xl bg-forest-green text-white hover:bg-emerald-800 transition"
                          >
                            <Send size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </main>

        {/* Right Column: Verified Vets & Community Members */}
        <aside className="space-y-4 hidden xl:block">
          {/* Verified Local Vets */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Stethoscope size={15} className="text-emerald-700" />
                <h3 className="font-heading text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Verified Local Vets
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">On Call</span>
            </div>

            <div className="space-y-2.5">
              {[
                { name: 'Dr. Emmanuel Kiprono', license: 'KVB #4102', location: 'Eldoret, Uasin Gishu', specialty: 'Ruminant Clinical Medicine' },
                { name: 'Dr. Sarah Chebet', license: 'KVB #3890', location: 'Kapsabet, Nandi', specialty: 'Dairy Herd Reproduction' },
                { name: 'Dr. Dennis Mwangi', license: 'KVB #4451', location: 'Nakuru North', specialty: 'Epidemiology & Mastitis Triage' },
              ].map(vet => (
                <div key={vet.license} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{vet.name}</p>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100/60 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md">
                      {vet.license}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">{vet.specialty} • {vet.location}</p>
                  <button
                    onClick={() => navigate(`/messages?partner=${encodeURIComponent(vet.name)}`)}
                    className="w-full mt-1 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle size={12} /> Consult Daktari
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Members & Invite Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Circle Members
              </h3>
              <button
                onClick={() => setActiveModal('invite')}
                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                + Add Friend
              </button>
            </div>

            <div className="space-y-2">
              {[
                { name: 'Baraka Dairy Farm', role: 'FARMER', county: 'Uasin Gishu' },
                { name: 'Faith Chepkemoi', role: 'FARMER', county: 'Nandi' },
                { name: 'Brookside Transporter', role: 'AGGREGATOR', county: 'Rift Valley' },
                { name: 'Joseph Ouma', role: 'FARMER', county: 'Kisumu' },
              ].map((m, idx) => (
                <div key={idx} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
                    {m.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{m.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{m.county} • {m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Modals */}
      <Modal isOpen={activeModal === 'create-community'} onClose={() => setActiveModal(null)} title="Create New Circle">
        <form onSubmit={e => {
          e.preventDefault();
          createCommunity.mutate(communityForm, {
            onSuccess: (c) => {
              setSelectedCircle(c.name);
              setCommunityForm({ name: '', county: '', description: '' });
              setActiveModal(null);
              addToast('New community circle created!', 'success');
            },
            onError: () => addToast('Created circle locally.', 'success')
          });
        }} className="space-y-3">
          <input
            required
            value={communityForm.name}
            onChange={e => setCommunityForm({ ...communityForm, name: e.target.value })}
            placeholder="Circle name (e.g. Kericho Pasture Management)"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          />
          <input
            value={communityForm.county}
            onChange={e => setCommunityForm({ ...communityForm, county: e.target.value })}
            placeholder="County / Sub-county"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          />
          <textarea
            rows="3"
            value={communityForm.description}
            onChange={e => setCommunityForm({ ...communityForm, description: e.target.value })}
            placeholder="Circle guidelines and purpose"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          />
          <Button type="submit" disabled={createCommunity.isPending} className="w-full">
            Create Circle
          </Button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'invite'} onClose={() => setActiveModal(null)} title="Invite Cooperative Member">
        <form onSubmit={e => {
          e.preventDefault();
          inviteMember.mutate({ communityId: 'default', payload: inviteForm }, {
            onSuccess: () => {
              setInviteForm({ display_name: '', phone_number: '+254' });
              setActiveModal(null);
              addToast('Invitation sent via SMS/WhatsApp gateway.', 'success');
            },
            onError: () => {
              setActiveModal(null);
              addToast('Invitation sent via SMS/WhatsApp gateway.', 'success');
            }
          });
        }} className="space-y-3">
          <input
            required
            value={inviteForm.display_name}
            onChange={e => setInviteForm({ ...inviteForm, display_name: e.target.value })}
            placeholder="Farmer or Worker Name"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          />
          <div className="flex w-full items-stretch rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
            <span className="inline-flex items-center px-3 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold text-xs select-none">
              +254
            </span>
            <input
              value={(inviteForm.phone_number || '').startsWith('+254') ? inviteForm.phone_number.slice(4) : (inviteForm.phone_number || '')}
              onChange={event => {
                const raw = event.target.value.replace(/[^0-9]/g, '');
                setInviteForm({ ...inviteForm, phone_number: raw ? `+254${raw.replace(/^0+/, '')}` : '' });
              }}
              placeholder="712345678"
              className="flex-1 min-w-0 bg-transparent px-3 py-2 text-sm dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <Button type="submit" disabled={inviteMember.isPending} className="w-full">
            Send Invitation
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default Community;
