const firebaseConfig = {
    apiKey: "AIzaSyBohsADSMihBMTiuM2BPTK_VBJCvww_1EQ",
    authDomain: "chat-8e355.firebaseapp.com",
    projectId: "chat-8e355",
    storageBucket: "chat-8e355.firebasestorage.app",
    messagingSenderId: "626008585529",
    appId: "1:626008585529:web:67f5476605c4fbf49d64e8",
    measurementId: "G-HDL0Z6WHJF"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const ADMIN_USERNAME = "x9K2mP7vL4qW8nR3zT6yB1cF5hJ0gD8sA4eU2iO9pQ7wE5rT3yU1iO8pA6sD4fG2hJ9kL7zX5cV3bN1mQ4wE6rT8yU0iO2pA4sD6fG8hJ0kL2zX4cV6bN8mQ1wE3rT5yU7iO9pA2sD4fG6hJ8kL0zX";
const ADMIN_PASSWORD = "pA9sD7fG5hJ3kL1zX8cV6bN4mQ2wE0rT9yU7iO5pA3sD1fG8hJ6kL4zX2cV0bN9mQ7wE5rT3yU1iO8pA6sD4fG2hJ9kL7zX5cV3bN1mQ4wE6rT8yU0";

const AVATAR_OPTIONS = ["👦🏽", "🧑🏻‍💻", "🦸🏻‍♂️", "👧🏽", "👩🏻‍🎨", "🦊", "🐯", "🤖", "👻", "🦄", "🚀", "⚡", "🔥", "💎", "🌟"];
let regAvatarIndex = 0, settingAvatarIndex = 0;
let currentUser = null, currentChatId = null, activeContactTarget = null;
let activeContacts = [], unsavedContacts = [], allUsersCache = [];
let isAndroid = false;

// DETECT OPERATING SYSTEM IMMEDIATELY
function detectOSAndApplyUI() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    isAndroid = /android/i.test(ua);
    const body = document.getElementById("os-body");
    
    if (isAndroid) {
        body.classList.remove("desktop-detected");
        body.classList.add("android-detected");
    } else {
        body.classList.remove("android-detected");
        body.classList.add("desktop-detected");
    }
}
detectOSAndApplyUI();

auth.onAuthStateChanged((user) => {
    detectOSAndApplyUI();
    document.getElementById("loading-screen").classList.add("hidden");
    if (!localStorage.getItem("zivo_tc")) {
        document.getElementById("tc-modal").classList.remove("hidden");
        return;
    }
    if (user) {
        db.collection("users").doc(user.uid).get().then(doc => {
            const data = doc.data() || {};
            const isAdmin = user.uid === "admin_master_uid" || data.name === "SuperAdmin";
            initSession(user.uid, data.name || "User", data.avatar || "👦🏽", data.bio || "", data.pinnedChats || [], data.blockedUsers || [], data.savedContactIds || [], isAdmin);
        }).catch(() => initSession(user.uid, "User", "👦🏽", "", [], [], [], false));
    } else {
        document.getElementById("auth-screen").classList.remove("hidden");
    }
});

function handleTCAccept() {
    localStorage.setItem("zivo_tc", "true");
    document.getElementById("tc-modal").classList.add("hidden");
    document.getElementById("auth-screen").classList.remove("hidden");
}
function handleTCDcline() { alert("Must accept terms."); }

function shiftRegAvatar(dir) {
    regAvatarIndex = (regAvatarIndex + dir + AVATAR_OPTIONS.length) % AVATAR_OPTIONS.length;
    document.getElementById("reg-carousel-display").innerText = AVATAR_OPTIONS[regAvatarIndex];
}

function toggleAuth(mode) {
    if (mode === 'login') {
        document.getElementById("signup-fields").classList.add("hidden");
        document.getElementById("login-fields").classList.remove("hidden");
    } else {
        document.getElementById("login-fields").classList.add("hidden");
        document.getElementById("signup-fields").classList.remove("hidden");
    }
}

document.getElementById("submit-signup-btn").onclick = () => {
    const u = document.getElementById("reg-username").value.trim();
    const p = document.getElementById("reg-password").value;
    if (!u || !p) return alert("Fill fields");
    const avatar = AVATAR_OPTIONS[regAvatarIndex];
    auth.createUserWithEmailAndPassword(`${u.toLowerCase()}@zivochat.app`, p).then(res => {
        db.collection("users").doc(res.user.uid).set({ uid: res.user.uid, name: u, avatar, bio: "", pinnedChats: [], blockedUsers: [], savedContactIds: [], status: "active" })
        .then(() => initSession(res.user.uid, u, avatar, "", [], [], [], false));
    }).catch(e => alert(e.message));
};

document.getElementById("submit-login-btn").onclick = () => {
    const u = document.getElementById("login-username").value.trim();
    const p = document.getElementById("login-password").value;
    if (!u || !p) return alert("Fill fields");
    if (u === ADMIN_USERNAME && p === ADMIN_PASSWORD) {
        initSession("admin_master_uid", "SuperAdmin", "🛡️", "Admin", [], [], [], true);
        return;
    }
    auth.signInWithEmailAndPassword(`${u.toLowerCase()}@zivochat.app`, p).then(res => {
        db.collection("users").doc(res.user.uid).get().then(doc => {
            const d = doc.data() || {};
            initSession(res.user.uid, d.name || u, d.avatar || "👦🏽", d.bio || "", d.pinnedChats || [], d.blockedUsers || [], d.savedContactIds || [], false);
        });
    }).catch(e => alert(e.message));
};

function initSession(uid, name, avatar, bio, pinnedChats, blockedUsers, savedContactIds, isAdmin) {
    currentUser = { uid, name, avatar, bio, pinnedChats, blockedUsers, savedContactIds, isAdmin };
    document.getElementById("auth-screen").classList.add("hidden");
    document.getElementById("app-screen").classList.remove("hidden");
    
    if (isAdmin) document.getElementById("admin-panel-icon-btn").classList.remove("hidden");
    renderMyProfileInfo();
    syncData();
}

function renderMyProfileInfo() {
    document.getElementById("desktop-my-name").innerText = currentUser.name;
    document.getElementById("desktop-my-avatar").innerText = currentUser.avatar;
}

function logoutUser() {
    auth.signOut().then(() => location.reload());
}

function syncData() {
    db.collection("users").onSnapshot(snap => {
        allUsersCache = [];
        const map = {};
        snap.forEach(d => { allUsersCache.push(d.data()); map[d.id] = d.data(); });

        db.collection("users").doc(currentUser.uid).onSnapshot(myDoc => {
            if (myDoc.exists) {
                const data = myDoc.data();
                currentUser.savedContactIds = data.savedContactIds || [];
                currentUser.pinnedChats = data.pinnedChats || [];
                currentUser.blockedUsers = data.blockedUsers || [];
                activeContacts = currentUser.savedContactIds.map(id => map[id]).filter(Boolean);
                renderChatList();
            }
        });
    });
}

// Search Listeners
['desktop-search-input', 'mobile-search-input'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.oninput = (e) => handleSearchInput(e.target.value, id.includes('desktop') ? 'desktop-suggestions' : 'mobile-suggestions');
    }
});

function handleSearchInput(q, dropdownId) {
    const box = document.getElementById(dropdownId);
    if (!q.trim()) { box.classList.add("hidden"); return; }
    const matches = allUsersCache.filter(u => u.uid !== currentUser.uid && u.name.toLowerCase().includes(q.toLowerCase())).slice(0,5);
    if (matches.length > 0) {
        box.innerHTML = "";
        matches.forEach(u => {
            const div = document.createElement("div");
            div.className = "suggestion-row";
            div.innerHTML = `<span>${u.avatar}</span> <span>${u.name}</span>`;
            div.onclick = () => selectUser(u);
            box.appendChild(div);
        });
        box.classList.remove("hidden");
    } else {
        box.classList.add("hidden");
    }
}

function selectUser(user) {
    if (!currentUser.savedContactIds.includes(user.uid)) {
        currentUser.savedContactIds.push(user.uid);
        db.collection("users").doc(currentUser.uid).update({ savedContactIds: currentUser.savedContactIds });
    }
    document.querySelectorAll('.suggestions-dropdown').forEach(d => d.classList.add("hidden"));
    switchChat([currentUser.uid, user.uid].sort().join("_"), user);
}

function renderChatList() {
    ['desktop-dm-list', 'mobile-dm-list'].forEach(listId => {
        const list = document.getElementById(listId);
        if (!list) return;
        list.innerHTML = "";
        if (activeContacts.length === 0) {
            list.innerHTML = `<p style="font-size:12px; color:var(--text-muted); padding:10px;">No chats. Search above.</p>`;
            return;
        }
        activeContacts.forEach(c => {
            const chatId = [currentUser.uid, c.uid].sort().join("_");
            const div = document.createElement("div");
            div.className = `chat-row ${currentChatId === chatId ? 'active' : ''}`;
            div.innerHTML = `
                <span style="font-size:24px;">${c.avatar || '👤'}</span>
                <div style="flex:1; overflow:hidden;">
                    <strong style="font-size:13px; display:block;">${c.name}</strong>
                    <span style="font-size:11px; color:var(--text-muted);">Tap to chat</span>
                </div>
            `;
            div.onclick = () => switchChat(chatId, c);
            list.appendChild(div);
        });
    });
}

function switchChat(chatId, contact) {
    currentChatId = chatId;
    activeContactTarget = contact;

    document.getElementById("desktop-chat-title").innerText = contact.name;
    document.getElementById("desktop-chat-avatar").innerText = contact.avatar || '👤';
    document.getElementById("desktop-chat-actions").classList.remove("hidden");
    document.getElementById("desktop-input-area").classList.remove("hidden");

    document.getElementById("mobile-chat-title").innerText = contact.name;
    document.getElementById("mobile-chat-avatar").innerText = contact.avatar || '👤';
    document.getElementById("mobile-view-home").classList.remove("active");
    document.getElementById("mobile-view-chat").classList.add("active");

    renderChatList();
    loadMessages();
}

function closeMobileChat() {
    document.getElementById("mobile-view-chat").classList.remove("active");
    document.getElementById("mobile-view-home").classList.add("active");
    currentChatId = null;
}

let msgUnsub = null;
function loadMessages() {
    if (msgUnsub) msgUnsub();
    ['desktop-messages-container', 'mobile-messages-container'].forEach(id => {
        document.getElementById(id).innerHTML = "";
    });

    msgUnsub = db.collection("chats").doc(currentChatId).collection("messages").orderBy("timestamp", "asc").onSnapshot(snap => {
        let html = "";
        snap.forEach(doc => {
            const m = doc.data();
            const isMe = m.senderId === currentUser.uid;
            html += `<div class="msg-bubble ${isMe ? 'my-msg' : 'other-msg'}">${m.text}</div>`;
        });
        ['desktop-messages-container', 'mobile-messages-container'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.innerHTML = html || `<div style="margin:auto; color:var(--text-muted);">No messages yet</div>`; el.scrollTop = el.scrollHeight; }
        });
    });
}

function sendDesktopMessage() {
    const input = document.getElementById("desktop-msg-input");
    sendMsg(input.value);
    input.value = "";
}

function sendMobileMessage() {
    const input = document.getElementById("mobile-msg-input");
    sendMsg(input.value);
    input.value = "";
}

function sendMsg(text) {
    if (!text.trim() || !currentChatId) return;
    db.collection("chats").doc(currentChatId).set({ participants: currentChatId.split("_") }, { merge: true });
    db.collection("chats").doc(currentChatId).collection("messages").add({
        text, senderId: currentUser.uid, timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

function openProfileModal(uid) {
    db.collection("users").doc(uid).get().then(doc => {
        if (!doc.exists) return;
        const u = doc.data();
        document.getElementById("profile-name").innerText = u.name;
        document.getElementById("profile-bio").innerText = u.bio || "No bio added.";
        document.getElementById("profile-avatar").innerText = u.avatar || '👤';
        document.getElementById("profile-modal").classList.remove("hidden");
    });
}
function closeProfileModal() { document.getElementById("profile-modal").classList.add("hidden"); }

function openStatusModal() { document.getElementById("status-modal").classList.remove("hidden"); }
function closeStatusModal() { document.getElementById("status-modal").classList.add("hidden"); }

function openSettings() { document.getElementById("settings-modal").classList.remove("hidden"); }
function closeSettings() { document.getElementById("settings-modal").classList.add("hidden"); }

function triggerWallpaper() { document.getElementById("global-wallpaper-input").click(); }
function handleWallpaperUpload(input) {
    const file = input.files[0];
    if (!file || !currentChatId) return;
    const r = new FileReader();
    r.onload = (e) => {
        db.collection("chats").doc(currentChatId).set({ wallpaper: e.target.result }, { merge: true });
        document.documentElement.style.setProperty("--chat-wallpaper", `url('${e.target.result}')`);
        alert("Wallpaper updated!");
    };
    r.readAsDataURL(file);
}

function openAdminModal() { document.getElementById("admin-modal").classList.remove("hidden"); }
function closeAdminModal() { document.getElementById("admin-modal").classList.add("hidden"); }
