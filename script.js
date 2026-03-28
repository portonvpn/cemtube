const CLOUD_NAME = 'dncftuhoo', UPLOAD_PRESET = 'cemabyss', SUPABASE_URL = 'https://xqvvwejwkmqdmsorqdzp.supabase.co', SUPABASE_KEY = 'sb_publishable_WLR6XzQijI3h1-oWa6T-mg_FeolGe9z';
const DEV_USERS = ["Zoro", "Redtree1222", "redtree"];
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let currentUser = localStorage.getItem('cem_user'), allVideos = [], allProfiles = [], allRanks = [], allSettings = [], currentCtx = 'home', authMode = 'login';

function toggleSidebar() { document.getElementById('side-bar').classList.toggle('open'); }
function closeSidebar() { document.getElementById('side-bar').classList.remove('open'); }
function logout() { localStorage.removeItem('cem_user'); location.reload(); }
function toggleAuthMode() {
    authMode = authMode === 'login' ? 'register' : 'login';
    document.getElementById('auth-title').innerText = authMode === 'login' ? 'Login' : 'Register';
    document.getElementById('auth-toggle').innerText = authMode === 'login' ? 'No account? Register' : 'Have an account? Login';
}

async function handleAuth() {
    const uInput = document.getElementById('login-user'), pInput = document.getElementById('login-pass');
    const u = uInput.value.trim(), p = pInput.value.trim();
    if (!u || !p) return alert("Required");

    if (authMode === 'register') {
        const { data: taken } = await supabaseClient.from('profiles').select('username').eq('username', u).maybeSingle();
        if (taken) return alert("Taken");
        await supabaseClient.from('profiles').insert([{ username: u, pass: p, coins: 100, subscribers: 0 }]);
        loginSuccess(u);
    } else {
        const { data: user } = await supabaseClient.from('profiles').select('*').eq('username', u).eq('pass', p).maybeSingle();
        if (!user) return alert("Wrong credentials");
        loginSuccess(u);
    }
}
function loginSuccess(u) { localStorage.setItem('cem_user', u); location.reload(); }

async function fetchData() {
    const { data: v } = await supabaseClient.from('videos').select('*').order('id', { ascending: false });
    const { data: p } = await supabaseClient.from('profiles').select('*');
    const { data: r } = await supabaseClient.from('ranks').select('*');
    const { data: s } = await supabaseClient.from('site_settings').select('*');
    allVideos = v || []; allProfiles = p || []; allRanks = r || []; allSettings = s || [];
    updateRankCSS(); applyGlobalBanner(); updateNav();
    if (currentCtx === 'home') render('v-grid');
}

function updateNav() {
    const p = allProfiles.find(x => x.username === currentUser);
    if (!p) return;
    document.getElementById('u-name-display').innerText = p.display_name || currentUser;
    document.getElementById('u-coins').innerText = `🪙 ${p.coins || 0}`;
    if (DEV_USERS.includes(currentUser)) document.getElementById('admin-nav-item').style.display = 'block';
}

function setContext(ctx) {
    currentCtx = ctx;
    document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
    document.getElementById('view-' + ctx).classList.add('active');
    fetchData();
}

function render(target) {
    const grid = document.getElementById(target);
    grid.innerHTML = allVideos.map(v => `<div class="card" onclick="playVideo('${v.id}')"><img src="${v.thumb}"><h3>${v.title}</h3></div>`).join('');
}

async function handleUpload() {
    const v = document.getElementById('vid-input').files[0];
    if (!v) return;
    const fd = new FormData(); fd.append('file', v); fd.append('upload_preset', UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, { method: "POST", body: fd });
    const d = await res.json();
    await supabaseClient.from('videos').insert([{ title: document.getElementById('vid-name').value, uploader: currentUser, url: d.secure_url, thumb: d.secure_url.replace(/\.[^/.]+$/, ".jpg") }]);
    location.reload();
}

function openUpload() { document.getElementById('modal-upload').style.display = 'flex'; }
function closeUpload() { document.getElementById('modal-upload').style.display = 'none'; }

if (currentUser) {
    document.getElementById('nav-bar').style.display = 'flex';
    document.getElementById('main-area').style.display = 'block';
    fetchData();
} else {
    document.getElementById('auth-shield').style.display = 'flex';
}
