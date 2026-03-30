const CLOUD_NAME = 'dncftuhoo', UPLOAD_PRESET = 'cemabyss', SUPABASE_URL = 'https://xqvvwejwkmqdmsorqdzp.supabase.co', SUPABASE_KEY = 'sb_publishable_WLR6XzQijI3h1-oWa6T-mg_FeolGe9z';
const DEV_USERS = ["Zoro", "Redtree1222", "redtree"];
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let currentUser = localStorage.getItem('cem_user'), allVideos = [], allProfiles = [], allRanks = [], allSettings = [], allAudit = [], currentCtx = 'home', authMode = 'login', activeVideo = null, editingId = null;

const MARKET_THEMES = [
    { id: 'galaxy', name: 'Elite Galaxy Bundle', price: 2500, color: 'linear-gradient(to bottom, #a855f7, #6441a5)' },
    { id: 'creamy', name: 'Creamy Gold', price: 1000, color: '#d4a373' },
    { id: 'tropical', name: 'Animated Tropical', price: 2500, color: 'linear-gradient(135deg, #f15bb5, #fee440)' },
    { id: 'rainbow', name: 'Animated Rainbow', price: 5000, color: 'linear-gradient(45deg,red,orange,yellow,green,blue,purple)' },
    { id: 'glitched', name: 'Glitched Hacker', price: 7500, color: '#00ff00' },
    { id: 'frutiger', name: 'Frutiger Aero', price: 10000, color: 'linear-gradient(to bottom, #00a8ff, #005f99)' }
];

// Initial UI Boot
try {
    const main = document.getElementById('main-area');
    const nav = document.getElementById('nav-bar');
    if (main) main.style.display = 'block';
    if (nav) nav.style.display = 'flex';
} catch(e) {}

function toggleSidebar() {
    document.getElementById('side-bar').classList.toggle('open');
    document.getElementById('side-overlay').style.display = document.getElementById('side-bar').classList.contains('open') ? 'block' : 'none';
}
function closeSidebar() { document.getElementById('side-bar').classList.remove('open'); document.getElementById('side-overlay').style.display = 'none'; }
function logout() { supabaseClient.auth.signOut().then(() => { localStorage.removeItem('cem_user'); location.reload(); }); }
function openAuth() { document.getElementById('auth-shield').style.display = 'flex'; }
function closeAuth() { document.getElementById('auth-shield').style.display = 'none'; }
function toggleAuthMode() {
    authMode = authMode === 'login' ? 'register' : 'login';
    document.getElementById('auth-title').innerText = authMode === 'login' ? 'Login' : 'Register';
    document.getElementById('auth-toggle').innerText = authMode === 'login' ? 'No account? Register' : 'Have an account? Login';
    document.getElementById('login-user').style.display = authMode === 'login' ? 'none' : 'block';
    document.getElementById('reg-email').style.display = authMode === 'login' ? 'none' : 'block';
    document.getElementById('login-email').placeholder = authMode === 'login' ? 'Email or Username' : 'Email (Optional)';
    if (authMode === 'register') document.getElementById('login-email').style.display = 'none';
    else document.getElementById('login-email').style.display = 'block';
}

function getCol(n) { let h = 0; if (n) { for (let i = 0; i < n.length; i++)h = n.charCodeAt(i) + ((h << 5) - h); } return `hsl(${Math.abs(h) % 360}, 70%, 60%)`; }
function getAvatarStyle(u) { const p = allProfiles.find(x => x.username === u); if (p && p.avatar_url) return `background:url('${p.avatar_url}') center/cover;color:transparent;`; return `background:${getCol(u)};`; }

function formatName(u) {
    const p = allProfiles.find(x => x.username === u);
    const dName = (p && p.display_name) ? p.display_name : u;
    let nameMain = '';
    const isDev = DEV_USERS.includes(u);
    const badge = isDev ? `<span class="dev-badge">DEV</span>` : (p?.is_verified ? `<span class="badge">✓</span>` : '');

    if (p && p.rank) {
        const r = allRanks.find(rk => rk.id === p.rank);
        if (r && r.data) {
            const rData = r.data;
            const nameClass = `rank-name-${p.rank}`;
            const extraClass = rData.hasGalaxy ? 'galaxy-rank' : '';
            const b = `<span class="rank-badge-${p.rank} ${extraClass}">${rData.badgeText || ''}</span>`;
            nameMain = `<span class="${nameClass}">${dName}</span> ${b}`;
        } else {
            const glow = isDev ? 'glow-text' : '';
            nameMain = `<span class="${glow}">${dName}</span> ${badge}`;
        }
    } else {
        const glow = isDev ? 'glow-text' : '';
        nameMain = `<span class="${glow}">${dName}</span> ${badge}`;
    }

    return `<div class="user-info-wrap">
                <div style="font-weight:800">${nameMain}</div>
                <div style="color:var(--text-dim); font-size:11px; font-weight:normal; letter-spacing:0.5px;">@${u}</div>
            </div>`;
}

async function handleAuth() {
    let inputEmail = document.getElementById('login-email').value.trim();
    const p = document.getElementById('login-pass').value;
    const u = document.getElementById('login-user').value.trim();
    const regE = document.getElementById('reg-email').value.trim();

    if (authMode === 'register') {
        if (!u || !p) return alert("Username & Password required");
        let emailToUse = regE || `${u.toLowerCase().replace(/[^a-z0-9]/g, '')}@cemabyss.com`;
        const { data: taken } = await supabaseClient.from('profiles').select('username').eq('username', u).maybeSingle();
        if (taken) return alert("Username already taken!");
        const { data, error } = await supabaseClient.auth.signUp({ email: emailToUse, password: p, options: { data: { username: u } } });
        if (error) return alert(error.message);
        await supabaseClient.from('profiles').insert([{ username: u, is_banned: false, subscribers: 0, email_lookup: emailToUse.toLowerCase() }]);
        if (data.session) loginSuccess(u);
        else { alert("Success!"); toggleAuthMode(); }
    } else {
        let emailToSignIn = inputEmail;
        if (!inputEmail.includes('@')) {
            const { data: prof } = await supabaseClient.from('profiles').select('email_lookup').ilike('username', inputEmail).maybeSingle();
            if (prof) emailToSignIn = prof.email_lookup;
            else emailToSignIn = `${inputEmail.toLowerCase().replace(/[^a-z0-9]/g, '')}@cemabyss.com`;
        }
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email: emailToSignIn, password: p });
        if (error) return alert(error.message);
        if (data.user) loginSuccess(data.user.user_metadata.username);
    }
}

function loginSuccess(u) { localStorage.setItem('cem_user', u); location.reload(); }

async function fetchData() {
    const { data: v } = await supabaseClient.from('videos').select('*').order('id', { ascending: false });
    const { data: p } = await supabaseClient.from('profiles').select('*');
    const { data: r } = await supabaseClient.from('ranks').select('*');
    const { data: s } = await supabaseClient.from('site_settings').select('*');
    const { data: a } = await (DEV_USERS.includes(currentUser) ? supabaseClient.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50) : { data: [] });
    
    allVideos = v || []; allProfiles = p || []; allRanks = r || []; allSettings = s || []; allAudit = a || [];

    checkDailyCoins();
    applyGlobalBanner();
    updateRankCSS();
    
    if (currentCtx === 'admin') renderAdmin();
    else if (currentCtx === 'marketplace') renderMarketplace();
    else if (currentCtx === 'settings') renderSettings();
    else if (currentCtx === 'announcements') renderAnnouncements();
    else if (currentCtx !== 'profile') render();

    updateNav();
}

function handleRouting() {
    const params = new URLSearchParams(window.location.search);
    const vId = params.get('v'), tab = params.get('tab');
    if (vId) {
        const vid = allVideos.find(x => (x.video_id === vId || x.id == vId));
        if (vid) { openVideo(vid.id); return; }
    }
    if (tab) setContext(tab, document.querySelector(`[data-ctx="${tab}"]`));
    else setContext('home', document.querySelector('.side-item[data-ctx="home"]'));
}

window.onpopstate = () => handleRouting();

function updateNav() {
    if (currentUser) {
        document.getElementById('nav-user-area').style.display = 'flex';
        document.getElementById('nav-login-btn').style.display = 'none';
        document.getElementById('u-name-display').innerHTML = formatName(currentUser);
        const av = document.getElementById('nav-avatar');
        av.setAttribute('style', getAvatarStyle(currentUser));
        av.innerText = currentUser[0].toUpperCase();
        const p = allProfiles.find(x => x.username === currentUser);
        if (p) {
            const notifs = p.notifications ? (typeof p.notifications === 'string' ? JSON.parse(p.notifications) : p.notifications) : [];
            updateNotifBadge(notifs.filter(n => !n.seen).length);
            if (document.getElementById('u-coins')) document.getElementById('u-coins').innerText = `🪙 ${p.coins || 0}`;
        }
    } else {
        document.getElementById('nav-user-area').style.display = 'none';
        document.getElementById('nav-login-btn').style.display = 'block';
    }
}

function setContext(ctx, el) {
    currentCtx = ctx;
    const currentUrl = new URL(window.location);
    if (currentUrl.searchParams.get('tab') !== ctx && ctx !== 'home') {
        const newUrl = window.location.origin + window.location.pathname + '?tab=' + ctx;
        window.history.pushState({}, '', newUrl);
    } else if (ctx === 'home' && currentUrl.searchParams.has('tab')) {
        const newUrl = window.location.origin + window.location.pathname;
        window.history.pushState({}, '', newUrl);
    }

    document.querySelectorAll('.side-item, .mob-nav-item').forEach(i => {
        i.classList.remove('active');
        if (i.getAttribute('data-ctx') === ctx) i.classList.add('active');
    });

    try { closeSidebar(); } catch(e){}
    document.querySelectorAll('.page-view').forEach(p => { p.classList.remove('active'); p.style.display = 'none'; });
    const target = document.getElementById(`view-${ctx === 'studio' || ctx === 'imageboard' ? 'home' : ctx}`);
    if (target) { target.classList.add('active'); target.style.display = 'block'; }

    if (ctx === 'settings' && !currentUser) return openAuth();
    fetchData();
}

function render(target = 'v-grid', list = null) {
    const grid = document.getElementById(target); if(!grid) return;
    let d = list || allVideos;
    if (currentCtx === 'imageboard') d = d.filter(v => v.url.match(/\.(jpg|jpeg|png|webp|gif)$/i));
    else if (currentCtx === 'home') d = d.filter(v => v.url && !v.url.match(/\.(jpg|jpeg|png|webp|gif)$/i));
    else if (currentCtx === 'studio') d = d.filter(v => v.uploader === currentUser);

    grid.innerHTML = d.map(v => `
        <div class="card" onclick="openVideo('${v.id}')">
            <div class="v-thumb-wrap">
                <img src="${v.thumb}" class="v-img-prev">
                <div class="dots-btn" onclick="toggleMenu(event, '${v.id}')">⋮</div>
            </div>
            <div style="display:flex; gap:12px; margin-top:12px;">
                <div class="v-avatar" style="${getAvatarStyle(v.uploader)}">${v.uploader[0]}</div>
                <div style="flex:1; overflow:hidden;">
                    <div style="font-weight:700; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${v.title}</div>
                    <div style="margin-top:4px;">${formatName(v.uploader)}</div>
                </div>
            </div>
        </div>`).join('');
}

async function openVideo(id) {
    activeVideo = allVideos.find(v => v.id == id); if (!activeVideo) return;
    document.getElementById('player-page').style.display = 'block';
    document.getElementById('p-title').innerText = activeVideo.title;
    document.getElementById('p-uploader').innerHTML = formatName(activeVideo.uploader);
    document.getElementById('p-avatar').setAttribute('style', getAvatarStyle(activeVideo.uploader));
    document.getElementById('p-desc-content').innerText = activeVideo.details || "";
    document.getElementById('p-target').innerHTML = activeVideo.url.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? `<img src="${activeVideo.url}" class="p-media">` : `<video controls autoplay src="${activeVideo.url}"></video>`;
    renderRecs(); loadComments();
    await supabaseClient.from('videos').update({ views: (activeVideo.views || 0) + 1 }).eq('id', id);
}

function renderRecs() {
    const list = allVideos.filter(v => v.id != activeVideo.id).slice(0, 10);
    document.getElementById('rec-grid').innerHTML = list.map(v => `
        <div class="rec-card" onclick="openVideo('${v.id}')">
            <div class="rec-thumb"><img src="${v.thumb}" style="width:100%; height:100%; object-fit:cover; border-radius:16px;"></div>
            <div class="rec-info"><div class="rec-title">${v.title}</div>${formatName(v.uploader)}</div>
        </div>`).join('');
}

async function addComment() {
    if (!currentUser) return openAuth();
    const txt = document.getElementById('com-input').value.trim(); if (!txt) return;
    let arr = activeVideo.comments ? (typeof activeVideo.comments === 'string' ? JSON.parse(activeVideo.comments) : activeVideo.comments) : [];
    arr.push({ id: Date.now().toString(36), user: currentUser, text: txt, time: Date.now() });
    await supabaseClient.from('videos').update({ comments: JSON.stringify(arr) }).eq('id', activeVideo.id);
    activeVideo.comments = arr; document.getElementById('com-input').value = ""; loadComments();
}

function loadComments() {
    const list = document.getElementById('comments-list');
    let arr = activeVideo.comments || [];
    list.innerHTML = arr.map(c => `<div class="comment-item"><div class="v-avatar" style="${getAvatarStyle(c.user)}">${c.user[0]}</div><div style="flex:1"><div>${formatName(c.user)}</div><div class="comment-text">${c.text}</div></div></div>`).join('') || 'No comments.';
}

function renderMarketplace() {
    const list = document.getElementById('market-grid'); if(!list) return;
    const p = allProfiles.find(x => x.username === currentUser); if (!p) return;
    let unlocked = p.unlocked_themes || [];
    list.innerHTML = MARKET_THEMES.map(t => {
        const isOwned = unlocked.includes(t.id);
        return `<div class="theme-item" style="padding:20px; border-radius:12px; text-align:center; border:1px solid var(--border);">
            <h3>${t.name}</h3>
            ${isOwned ? `<button class="primary-btn" style="background:#222;">Purchased</button>` : `<button class="primary-btn" onclick="buyTheme('${t.id}', ${t.price})">Buy for 🪙 ${t.price}</button>`}
        </div>`;
    }).join('');
}

async function buyTheme(tid, price) {
    const p = allProfiles.find(x => x.username === currentUser); if(!p || (p.coins || 0) < price) return alert("Error.");
    let unlocked = p.unlocked_themes || []; if(!unlocked.includes(tid)) unlocked.push(tid);
    await supabaseClient.from('profiles').update({ coins: p.coins - price, unlocked_themes: unlocked }).eq('username', currentUser);
    alert("Purchased!"); fetchData();
}

function renderSettings() {
    const p = allProfiles.find(x => x.username === currentUser); if(!p) return;
    document.getElementById('set-name').value = p.display_name || '';
    let themeHtml = `<div class="theme-btn" onclick="setTheme('default')">Default</div>`;
    MARKET_THEMES.forEach(t => { if ((p.unlocked_themes || []).includes(t.id)) themeHtml += `<div class="theme-btn" style="background:${t.color}" onclick="setTheme('${t.id}')">${t.name}</div>`; });
    document.getElementById('my-themes-grid').innerHTML = themeHtml;
}

function setTheme(t) { document.documentElement.setAttribute('data-theme', t); localStorage.setItem('cem_theme', t); alert("Theme Set!"); }

async function saveBanner() {
    const txt = document.getElementById('admin-banner-text').value.trim();
    const col = document.getElementById('admin-banner-color').value;
    await supabaseClient.from('site_settings').upsert([{ id: 'banner', data: { active: !!txt, text: txt, color: col } }]);
    alert("Broadcasted!"); fetchData();
}

function applyGlobalBanner() {
    const b = allSettings.find(x => x.id === 'banner');
    const bDiv = document.getElementById('global-banner');
    if (b?.data?.active) { bDiv.style.display = 'flex'; bDiv.style.background = b.data.color; document.getElementById('banner-text-content').innerText = b.data.text; }
    else bDiv.style.display = 'none';
}

function checkDailyCoins() {
    if(!currentUser) return;
    const last = localStorage.getItem(`daily_${currentUser}`);
    if(last !== new Date().toDateString()) {
        const p = allProfiles.find(x => x.username === currentUser);
        if(p) { supabaseClient.from('profiles').update({ coins: (p.coins || 0) + 50 }).eq('username', currentUser).then(() => { localStorage.setItem(`daily_${currentUser}`, new Date().toDateString()); fetchData(); }); }
    }
}

function updateNotifBadge(n) { const b = document.getElementById('notif-badge'); if(b) { b.style.display = n > 0 ? 'flex' : 'none'; b.innerText = n; } }
function toggleMenu(e, id) { e.stopPropagation(); document.querySelectorAll('.dropdown').forEach(d => d.style.display = 'none'); document.getElementById(`menu-${id}`).style.display = 'block'; }
function closePlayer() { document.getElementById('player-page').style.display = 'none'; document.getElementById('p-target').innerHTML = ""; }
function updateRankCSS() {} 

document.addEventListener('DOMContentLoaded', () => { fetchData(); handleRouting(); });
window.onclick = () => document.querySelectorAll('.dropdown').forEach(d => d.style.display = 'none');

async function openProfile(user) {
    if (profileAudio) try { profileAudio.pause(); profileAudio = null; } catch(e){}
    currentCtx = 'profile'; 
    document.querySelectorAll('.side-item, .mob-nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.page-view').forEach(p => { p.classList.remove('active'); p.style.display = 'none'; });
    const v = document.getElementById('view-profile'); v.classList.add('active'); v.style.display = 'block';
    closeSidebar(); closePlayer();
    const p = allProfiles.find(x => x.username === user); if (!p) return;
    if (p.music_url) { profileAudio = new Audio(p.music_url); profileAudio.volume = 0.15; profileAudio.play().catch(() => document.addEventListener('click', () => { if(profileAudio && profileAudio.paused) profileAudio.play(); }, {once:true})); }
    const banner = document.getElementById('profile-banner');
    if (p.banner_url) banner.style.background = `url('${p.banner_url}') center/cover no-repeat`;
    else banner.style.background = `linear-gradient(135deg, #111, #000)`;
    document.getElementById('p-avatar-wrap').innerHTML = `<div class="v-avatar" style="width:120px; height:120px; font-size:50px; border-radius:50%; ${getAvatarStyle(user)}">${user[0]}</div>`;
    document.getElementById('p-name-area').innerHTML = `<h1>${p.display_name || user}</h1><div style="color:gray;">@${user}</div>`;
    document.getElementById('p-bio').innerText = p.bio || 'No bio.';
    render('profile-grid', allVideos.filter(v => v.uploader === user));
}

async function logAudit(action, target, details) {
    if (!DEV_USERS.includes(currentUser)) return;
    await supabaseClient.from('audit_logs').insert([{ admin_user: currentUser, action, target, details }]);
}

async function renderAdmin() {
    if (!DEV_USERS.includes(currentUser)) return setContext('home');
    const logs = allAudit.map(l => `<div>[${new Date(l.created_at).toLocaleString()}] <b>${l.admin_user}</b>: ${l.action} -> ${l.target} (${l.details})</div>`).join('');
    const logEl = document.getElementById('audit-log-content'); if(logEl) logEl.innerHTML = logs || 'No logs.';
}

async function pushNotif(target, type, data) {
    if (!target || target === currentUser) return;
    const p = allProfiles.find(x => x.username === target); if (!p) return;
    let notifs = p.notifications ? (typeof p.notifications === 'string' ? JSON.parse(p.notifications) : p.notifications) : [];
    notifs.push({ id: Date.now(), type, fromUser: data.from, videoId: data.videoId, seen: false });
    await supabaseClient.from('profiles').update({ notifications: JSON.stringify(notifs.slice(-50)) }).eq('username', target);
}

function openEdit(id, t, d) { editingId = id; document.getElementById('edit-title').value = t; document.getElementById('edit-desc').value = decodeURIComponent(d); document.getElementById('modal-edit').style.display = 'flex'; }
async function saveEdit() {
    let updates = { title: document.getElementById('edit-title').value, details: document.getElementById('edit-desc').value };
    await supabaseClient.from('videos').update(updates).eq('id', editingId); location.reload();
}

function shareVideo(e, id) { e.stopPropagation(); const v = allVideos.find(x => x.id == id); const url = `${window.location.origin}${window.location.pathname}?v=${v.video_id || v.id}`; navigator.clipboard.writeText(url).then(() => alert("🔗 Link Copied!")); }
async function pinVideo(id) { if(confirm("Pin globally?")) { await supabaseClient.from('site_settings').upsert([{ id: 'pinned_video', data: { videoId: id } }]); fetchData(); } }
async function deleteVideo(id) { if(confirm("Delete?")) { await supabaseClient.from('videos').delete().eq('id', id); location.reload(); } }
function openUpload() { document.getElementById('modal-upload').style.display = 'flex'; }
function closeUpload() { document.getElementById('modal-upload').style.display = 'none'; }
function closeEdit() { document.getElementById('modal-edit').style.display = 'none'; }
function updateRankCSS() {}
