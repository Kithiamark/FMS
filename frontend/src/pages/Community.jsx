import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeDollarSign,
  BellRing,
  MessageCircle,
  Milk,
  Plus,
  Search,
  Send,
  TrendingDown,
  UsersRound,
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

const postTypes = [
  ['DISCUSSION', 'Discussion'],
  ['SURPLUS', 'Surplus Milk'],
  ['LOW_MILK', 'Low Milk'],
  ['PRICE', 'Milk Price'],
  ['ALERT', 'Dairy Alert'],
  ['TREND', 'Trend'],
];

const dairyAlerts = [
  'Kiambu milk price average: KES 52/L this morning',
  'Heat cycle watch: check cows showing mounting behavior after evening feed',
  'Calf vaccine reminder: confirm 3-month schedule before Friday',
  'Surplus milk request: processors asking for clean chilled milk before 10 AM',
];

const typeIcon = {
  PRICE: BadgeDollarSign,
  ALERT: AlertTriangle,
  SURPLUS: Milk,
  LOW_MILK: TrendingDown,
  TREND: BellRing,
  DISCUSSION: MessageCircle,
};

const Community = () => {
  const { data: communities = [], isLoading: communitiesLoading } = useCommunities();
  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const selectedCommunity = useMemo(() => {
    if (!communities.length) return null;
    return communities.find((community) => String(community.id) === String(selectedCommunityId)) || communities[0];
  }, [communities, selectedCommunityId]);
  const [filters, setFilters] = useState({ type: '' });
  const [form, setForm] = useState({
    post_type: 'DISCUSSION',
    county: '',
    title: '',
    body: '',
    milk_price_kes: '',
    litres_available: '',
    preferred_pickup_time: '',
  });
  const [communityForm, setCommunityForm] = useState({ name: '', county: '', description: '' });
  const [inviteForm, setInviteForm] = useState({ display_name: '', phone_number: '+254' });
  const [activeModal, setActiveModal] = useState(null);
  const postFilters = {
    ...filters,
    community: selectedCommunity?.id || '',
  };
  const { data: posts = [], isLoading: postsLoading } = useCommunityPosts(postFilters);
  const createPost = useCreateCommunityPost();
  const createCommunity = useCreateCommunity();
  const inviteMember = useInviteCommunityMember();
  const { addToast } = useToast();

  const submitPost = (event) => {
    event.preventDefault();
    createPost.mutate({
      ...form,
      community: selectedCommunity?.id || null,
      milk_price_kes: form.post_type === 'PRICE' && form.milk_price_kes ? Number(form.milk_price_kes) : null,
      litres_available: ['SURPLUS', 'LOW_MILK'].includes(form.post_type) && form.litres_available ? Number(form.litres_available) : null,
    }, {
      onSuccess: () => {
        setForm({ post_type: 'DISCUSSION', county: '', title: '', body: '', milk_price_kes: '', litres_available: '', preferred_pickup_time: '' });
        setActiveModal(null);
        addToast('Community update shared.', 'success');
      },
      onError: () => addToast('Could not share the update.', 'error'),
    });
  };

  const submitCommunity = (event) => {
    event.preventDefault();
    createCommunity.mutate(communityForm, {
      onSuccess: (community) => {
        setSelectedCommunityId(String(community.id));
        setCommunityForm({ name: '', county: '', description: '' });
        setActiveModal(null);
        addToast('Community created.', 'success');
      },
      onError: () => addToast('Could not create community.', 'error'),
    });
  };

  const submitInvite = (event) => {
    event.preventDefault();
    if (!selectedCommunity?.id) {
      addToast('Create or choose a community first.', 'error');
      return;
    }
    inviteMember.mutate({ communityId: selectedCommunity.id, payload: inviteForm }, {
      onSuccess: () => {
        setInviteForm({ display_name: '', phone_number: '+254' });
        setActiveModal(null);
        addToast('Invite captured in test mode.', 'success');
      },
      onError: () => addToast('Could not add the friend.', 'error'),
    });
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-4">
      <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-700 text-white shadow-sm dark:border-emerald-500/30 dark:bg-emerald-950">
        <div className="flex whitespace-nowrap py-3 text-sm font-semibold">
          <div className="animate-[marquee_28s_linear_infinite]">
            {dairyAlerts.concat(dairyAlerts).map((alert, index) => (
              <span key={`${alert}-${index}`} className="mx-8 inline-flex items-center gap-2">
                <BellRing size={16} /> {alert}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold text-slate-950 dark:text-slate-100">Arvion Communities</h1>
        <p className="text-slate-500 dark:text-slate-400">Create farmer groups, add friends, share dairy alerts, and post surplus or low milk updates.</p>
      </div>

      <section className="grid min-h-[680px] overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:grid-cols-[330px_1fr_320px]">
        <aside className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 xl:border-b-0 xl:border-r">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold text-slate-950 dark:text-slate-100">Communities</h2>
            <button onClick={() => setActiveModal('create-community')} className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-700 text-white" aria-label="Create community">
              <Plus size={20} />
            </button>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              <Search size={16} />
              <span>Search groups</span>
            </div>
          </div>

          <div className="max-h-[310px] overflow-y-auto p-2">
            {communitiesLoading ? (
              <p className="p-4 text-sm text-slate-500">Loading groups...</p>
            ) : communities.length ? communities.map((community) => {
              const active = selectedCommunity?.id === community.id;
              return (
                <button
                  key={community.id}
                  type="button"
                  onClick={() => setSelectedCommunityId(String(community.id))}
                  className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${active ? 'bg-emerald-100 text-emerald-950 dark:bg-emerald-500/15 dark:text-emerald-100' : 'hover:bg-white dark:hover:bg-slate-900'}`}
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-700 font-bold text-white">
                    {community.name?.charAt(0) || 'A'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{community.name}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{community.county || 'All counties'} • {community.member_count || 0} members</p>
                  </div>
                </button>
              );
            }) : (
              <p className="p-4 text-sm text-slate-500">No communities yet. Create one below.</p>
            )}
          </div>

          <div className="border-t border-slate-200 p-4 dark:border-slate-800">
            <button onClick={() => setActiveModal('create-community')} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
              <Plus size={18} /> New community
            </button>
          </div>
        </aside>

        <main className="flex min-h-[680px] flex-col bg-[#efeae2] dark:bg-slate-950">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
            <div>
              <h2 className="font-heading text-xl font-bold text-slate-950 dark:text-slate-100">{selectedCommunity?.name || 'Choose a community'}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{selectedCommunity?.description || 'Community messages and dairy updates appear here.'}</p>
            </div>
            <select value={filters.type} onChange={event => setFilters({ type: event.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950">
              <option value="">All</option>
              {postTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {postsLoading ? <div className="rounded-2xl bg-white p-6 text-slate-500 dark:bg-slate-900">Loading messages...</div> : posts.length ? posts.map(post => {
              const Icon = typeIcon[post.post_type] || MessageCircle;
              const isSupply = ['SURPLUS', 'LOW_MILK', 'PRICE'].includes(post.post_type);
              return (
                <article key={post.id} className={`max-w-[760px] rounded-2xl border p-4 shadow-sm ${isSupply ? 'ml-auto border-emerald-100 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}>
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-slate-950 dark:text-emerald-300">
                      <Icon size={14} /> {post.post_type.replace('_', ' ')}
                    </span>
                    {post.milk_price_kes && <p className="text-sm font-bold text-slate-900 dark:text-slate-100">KES {post.milk_price_kes}/L</p>}
                    {post.litres_available && <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{post.litres_available} L</p>}
                  </div>
                  <h3 className="font-heading text-lg font-bold text-slate-950 dark:text-slate-100">{post.title}</h3>
                  <p className="mt-1 text-slate-700 dark:text-slate-300">{post.body}</p>
                  {post.preferred_pickup_time && <p className="mt-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">Best time: {post.preferred_pickup_time}</p>}
                  <p className="mt-3 text-xs text-slate-400">{post.county || 'All counties'} • {post.author_name || 'Farmer'} • {new Date(post.created_at).toLocaleString()}</p>
                </article>
              );
            }) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900/80">
                No messages yet. Share the first surplus, low milk flag, price, or dairy alert.
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['SURPLUS', Milk, 'Surplus milk'],
                ['LOW_MILK', TrendingDown, 'Low milk'],
                ['PRICE', BadgeDollarSign, 'Milk price'],
              ].map(([type, icon, label]) => {
                const ActionIcon = icon;
                return (
                  <button key={type} onClick={() => { setForm({ ...form, post_type: type }); setActiveModal('share-post'); }} className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-emerald-500/10">
                    <ActionIcon size={18} /> {label}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setActiveModal('share-post')} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800">
              <Plus size={18} /> Share community update
            </button>
          </div>
        </main>

        <aside className="border-t border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 xl:border-l xl:border-t-0">
          <h2 className="font-heading text-xl font-bold text-slate-950 dark:text-slate-100">Members</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add friends and see who is in the group.</p>
          <button onClick={() => setActiveModal('invite')} disabled={!selectedCommunity?.id} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:bg-slate-300">
            <Plus size={18} /> Add Friend
          </button>
          <div className="mt-5 space-y-2">
            {(selectedCommunity?.members || []).length ? selectedCommunity.members.map(member => (
              <div key={member.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-700 font-bold text-white">{(member.display_name || member.user_name || 'F').charAt(0)}</div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{member.display_name || member.user_name}</p>
                  <p className="text-xs text-slate-500">{member.role} • {member.farm_name}</p>
                </div>
              </div>
            )) : (
              <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800">No members loaded yet.</p>
            )}
          </div>
        </aside>
      </section>

      <Modal isOpen={activeModal === 'create-community'} onClose={() => setActiveModal(null)} title="Create Community">
        <form onSubmit={submitCommunity} className="space-y-3">
          <input required value={communityForm.name} onChange={event => setCommunityForm({ ...communityForm, name: event.target.value })} placeholder="Group name" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500" />
          <input value={communityForm.county} onChange={event => setCommunityForm({ ...communityForm, county: event.target.value })} placeholder="County" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500" />
          <textarea rows="3" value={communityForm.description} onChange={event => setCommunityForm({ ...communityForm, description: event.target.value })} placeholder="Purpose" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500" />
          <Button type="submit" disabled={createCommunity.isPending} className="w-full">Create Community</Button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'invite'} onClose={() => setActiveModal(null)} title="Add Friend">
        <form onSubmit={submitInvite} className="space-y-3">
          <input value={inviteForm.display_name} onChange={event => setInviteForm({ ...inviteForm, display_name: event.target.value })} placeholder="Friend name" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500" />
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
          <Button type="submit" disabled={inviteMember.isPending || !selectedCommunity?.id} className="w-full">Add Friend</Button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'share-post'} onClose={() => setActiveModal(null)} title="Share Dairy Update">
        <form onSubmit={submitPost} className="space-y-3">
          <select value={form.post_type} onChange={event => setForm({ ...form, post_type: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
            {postTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input required value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="Short title" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500" />
          <input value={form.county} onChange={event => setForm({ ...form, county: event.target.value })} placeholder="County" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500" />
          <textarea required rows="4" value={form.body} onChange={event => setForm({ ...form, body: event.target.value })} placeholder="Message farmers..." className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500" />
          {form.post_type === 'PRICE' ? (
            <input type="number" min="1" value={form.milk_price_kes} onChange={event => setForm({ ...form, milk_price_kes: event.target.value })} placeholder="Milk price KES/L" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500" />
          ) : (
            <input type="number" min="0" value={form.litres_available} onChange={event => setForm({ ...form, litres_available: event.target.value })} placeholder="Litres, if relevant" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500" />
          )}
          <input value={form.preferred_pickup_time} onChange={event => setForm({ ...form, preferred_pickup_time: event.target.value })} placeholder="Pickup/time note" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500" />
          <Button type="submit" disabled={createPost.isPending} className="w-full"><Send size={17} className="mr-2" /> Send</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Community;
