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
let regAvatarIndex = 0;
let settingAvatarIndex = 0;

let currentUser = null;
let currentChatId = null;
let activeContacts = [];
let unsavedContacts = [];
let allUsersCache = [];
let activeStatusesMap = {};
let activeMessageIdForDeletion = null;
let activeContactProfileTarget = null;
let unreadCounts = {};
let deferredInstallPrompt = null;

let mediaRecorder = null;
let audioChunks = [];
let audioContext = null;
let analyser = null;
let microphoneStream = null;
let animationFrameId = null;
let recordingTimerInterval = null;
let recordingSeconds = 0;

const tcModal = document.getElementById("tc-modal");
const installModal = document.getElementById("install-modal");
const authScreen = document.getElementById("auth-screen");
const appScreen = document.getElementById("app-screen");
const viewHome = document.getElementById("view-home");
const viewChat = document.getElementById("view-chat");

const signupFields = document.getElementById("signup-fields");
const loginFields = document.getElementById("login-fields");
const authSubtitle = document.getElementById("auth-subtitle");

const regUsername = document.getElementById("reg-username");
const regPassword = document.getElementById("reg-password");
const regCarouselDisplay = document.getElementById("reg-carousel-display");
const regFileInput = document.getElementById("reg-file-input");
const submitSignupBtn = document.getElementById("submit-signup-btn");

const loginUsername = document.getElementById("login-username");
const loginPassword = document.getElementById("login-password");
const submitLoginBtn = document.getElementById("submit-login-btn");

const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const attachFileBtn = document.getElementById("attach-file-btn");
const chatFileInput = document.getElementById("chat-file-input");

const textInputWrapper = document.getElementById("text-input-wrapper");
const voiceWaveWrapper = document.getElementById("voice-wave-wrapper");
const voiceRecordBtn = document.getElementById("voice-record-btn");
const cancelVoiceBtn = document.getElementById("cancel-voice-btn");
const uploadVoiceBtn = document.getElementById("upload-voice-btn");
const audioWaveCanvas = document.getElementById("audio-wave-canvas");
const recordingTimerEl = document.getElementById("recording-timer");

const messagesContainer = document.getElementById("messages-container");
const chatTitle = document.getElementById("chat-title");
const chatHeaderAvatar = document.getElementById("chat-header-avatar");
const unsavedContactBanner = document.getElementById("unsaved-contact-banner");
const pinChatBtn = document.getElementById("pin-chat-btn");
const blockChatBtn = document.getElementById("block-chat-btn");
const dmList = document.getElementById("dm-list");

const searchUserInput = document.getElementById("search-user-input");
const searchUserBtn = document.getElementById("search-user-btn");
const searchSuggestions = document.getElementById("search-suggestions");

const profileModal = document.getElementById("profile-modal");
const profileModalAvatar = document.getElementById("profile-modal-avatar");
const profileModalName = document.getElementById("profile-modal-name");
const profileModalBio = document.getElementById("profile-modal-bio");

const statusModal = document.getElementById("status-modal");
const statusFileInput = document.getElementById("status-file-input");
const statusPrivacyContactsList = document.getElementById("status-privacy-contacts-list");

const statusViewerModal = document.getElementById("status-viewer-modal");
const viewerUserName = document.getElementById("viewer-user-name");
const viewerMediaContainer = document.getElementById("viewer-media-container");

const deleteMsgModal = document.getElementById("delete-msg-modal");
const adminModal = document.getElementById("admin-modal");
const adminUsersList = document.getElementById("admin-users-list");
const settingsModal = document.getElementById("settings-modal");
const settingTheme = document.getElementById("setting-theme");
const settingBioInput = document.getElementById("setting-bio-input");
const settingCarouselDisplay = document.getElementById("setting-carousel-display");
const chatWallpaperFileInput = document.getElementById("chat-wallpaper-file-input");

auth.onAuthStateChanged((user) => {
    const acceptedTC = localStorage.getItem("zivo_tc_accepted");
    const loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) loadingScreen.classList.add("hidden");

    if (!acceptedTC) {
        tcModal.classList.remove("hidden");
        return;
    }

    if (user) {
        db.collection("users").doc(user.uid).get().then((doc) => {
            const data = doc.data();
            if (data && data.status === "inactive") {
                alert("Account inactive.");
                auth.signOut();
                return;
            }
            const isAdmin = user.uid === "admin_master_uid" || (data && data.name === "SuperAdmin");
            initUserSession(user.uid, data ? data.name : "User", data ? data.avatar : "👦🏽", data ? data.bio : "", data ? data.pinnedChats || [] : [], data ? data.blockedUsers || [] : [], data ? data.savedContactIds || [] : [], isAdmin);
        }).catch(() => {
            initUserSession(user.uid, "User", "👦🏽", "", [], [], [], false);
        });
    } else {
        authScreen.classList.remove("hidden");
        appScreen.classList.add("hidden");
    }
});

window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
});

function openInstallModal() { installModal.classList.remove("hidden"); }
function closeInstallModal() { installModal.classList.add("hidden"); }
function confirmAppInstall() {
    closeInstallModal();
    if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then(() => { deferredInstallPrompt = null; });
    } else {
        alert("To install, tap your mobile browser menu (three dots) and select 'Add to Home screen'.");
    }
}

function handleTCAccept() {
    localStorage.setItem("zivo_tc_accepted", "true");
    tcModal.classList.add("hidden");
    authScreen.classList.remove("hidden");
}
function handleTCDcline() { alert("You must accept Terms to proceed."); }

function shiftRegAvatar(dir) {
    regAvatarIndex = (regAvatarIndex + dir + AVATAR_OPTIONS.length) % AVATAR_OPTIONS.length;
    regCarouselDisplay.innerText = AVATAR_OPTIONS[regAvatarIndex];
    regFileInput.value = "";
}

function shiftSettingAvatar(dir) {
    settingAvatarIndex = (settingAvatarIndex + dir + AVATAR_OPTIONS.length) % AVATAR_OPTIONS.length;
    settingCarouselDisplay.innerText = AVATAR_OPTIONS[settingAvatarIndex];
}

function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    settingTheme.value = next;
}

function getEmailFromUsername(input) {
    const trimmed = input.trim();
    if (trimmed.includes("@")) return trimmed.toLowerCase();
    return `${trimmed.toLowerCase().replace(/\s+/g, '_')}@zivochat.app`;
}

function readFileAsDataURLWithLimit(fileInput, maxMB, callback) {
    const file = fileInput.files[0];
    if (!file) { callback(null); return; }
    if (file.size > maxMB * 1024 * 1024) { alert(`File exceeds ${maxMB}MB limit.`); callback(null); return; }
    const reader = new FileReader();
    reader.onload = (e) => callback(e.target.result);
    reader.readAsDataURL(file);
}

function toggleAuthMode(mode) {
    if (mode === 'login') {
        signupFields.classList.add("hidden");
        loginFields.classList.remove("hidden");
        authSubtitle.innerText = "Sign in to continue";
    } else {
        loginFields.classList.add("hidden");
        signupFields.classList.remove("hidden");
        authSubtitle.innerText = "Create an account";
    }
}

submitSignupBtn.addEventListener("click", () => {
    const username = regUsername.value.trim();
    const password = regPassword.value;
    if (!username || !password) return alert("Enter credentials!");
    readFileAsDataURLWithLimit(regFileInput, 35, (base64) => {
        const avatar = base64 || AVATAR_OPTIONS[regAvatarIndex];
        auth.createUserWithEmailAndPassword(getEmailFromUsername(username), password).then((res) => {
            db.collection("users").doc(res.user.uid).set({
                uid: res.user.uid, name: username, avatar, bio: "", pinnedChats: [], blockedUsers: [], savedContactIds: [], status: "active"
            }).then(() => initUserSession(res.user.uid, username, avatar, "", [], [], [], false));
        }).catch(err => alert(err.message));
    });
});

submitLoginBtn.addEventListener("click", () => {
    const username = loginUsername.value.trim();
    const password = loginPassword.value;
    if (!username || !password) return alert("Enter credentials!");
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        initUserSession("admin_master_uid", "SuperAdmin", "🛡️", "Admin", [], [], [], true);
        return;
    }
    auth.signInWithEmailAndPassword(getEmailFromUsername(username), password).then((res) => {
        db.collection("users").doc(res.user.uid).get().then((doc) => {
            const data = doc.data();
            if (data && data.status === "inactive") { alert("Inactive account."); auth.signOut(); return; }
            initUserSession(res.user.uid, data ? data.name : username, data ? data.avatar : "👦🏽", data ? data.bio : "", data ? data.pinnedChats || [] : [], data ? data.blockedUsers || [] : [], data ? data.savedContactIds || [] : [], false);
        });
    }).catch(err => alert(err.message));
});

function initUserSession(uid, name, avatar, bio, pinnedChats, blockedUsers, savedContactIds, isAdmin) {
    currentUser = { uid, name, avatar, bio, pinnedChats, blockedUsers, savedContactIds, isAdmin };
    authScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");
    switchNavTab('chats');
    syncAllUsersChatsAndStatuses();
}

function logoutUser() {
    auth.signOut().then(() => {
        currentUser = null;
        currentChatId = null;
        appScreen.classList.add("hidden");
        authScreen.classList.remove("hidden");
        toggleAuthMode('login');
    });
}

function switchNavTab(tab) {
    viewHome.classList.add("active");
    viewChat.classList.remove("active");
}

function renderAvatarElement(el, avatar) {
    if (avatar && (avatar.startsWith("data:") || avatar.startsWith("http"))) {
        el.innerHTML = `<img src="${avatar}" alt="avatar">`;
    } else {
        el.innerText = avatar || "👤";
    }
}

function syncAllUsersChatsAndStatuses() {
    db.collection("users").onSnapshot((snap) => {
        allUsersCache = [];
        const userMap = {};
        snap.forEach(doc => { const u = doc.data(); allUsersCache.push(u); userMap[u.uid] = u; });

        db.collection("users").doc(currentUser.uid).onSnapshot((myDoc) => {
            if (myDoc.exists) {
                const myData = myDoc.data();
                currentUser.savedContactIds = myData.savedContactIds || [];
                currentUser.pinnedChats = myData.pinnedChats || [];
                currentUser.blockedUsers = myData.blockedUsers || [];
                activeContacts = currentUser.savedContactIds.map(id => userMap[id]).filter(Boolean);
                renderContacts();
            }
        });

        if (!currentUser.isAdmin) {
            db.collection("chats").where("participants", "array-contains", currentUser.uid).onSnapshot((chatSnap) => {
                unsavedContacts = [];
                chatSnap.forEach((doc) => {
                    const data = doc.data();
                    const otherUid = (data.participants || []).find(id => id !== currentUser.uid);
                    if (otherUid && userMap[otherUid]) {
                        if ((currentUser.blockedUsers || []).includes(otherUid)) return;
                        if ((data.deletedBy || []).includes(currentUser.uid)) return;
                        if (!currentUser.savedContactIds.includes(otherUid) && !unsavedContacts.some(c => c.uid === otherUid)) {
                            unsavedContacts.push(userMap[otherUid]);
                        }
                    }
                });
                renderContacts();
            });
        }
    });

    db.collection("statuses").onSnapshot((statusSnap) => {
        const now = Date.now();
        activeStatusesMap = {};
        statusSnap.forEach((doc) => {
            const s = doc.data();
            if (s.expiresAt && s.expiresAt > now && !(s.hiddenFrom || []).includes(currentUser.uid)) {
                activeStatusesMap[s.userId] = { id: doc.id, ...s };
            }
        });
        renderContacts();
    });
}

searchUserInput.addEventListener("input", () => {
    const q = searchUserInput.value.trim().toLowerCase();
    if (!q) { searchSuggestions.classList.add("hidden"); return; }
    const matches = allUsersCache.filter(u => u.uid !== currentUser.uid && u.name.toLowerCase().includes(q) && !(currentUser.blockedUsers || []).includes(u.uid)).slice(0, 5);
    if (matches.length > 0) {
        searchSuggestions.innerHTML = "";
        matches.forEach(u => {
            const item = document.createElement("div");
            item.className = "search-suggestion-item";
            item.innerHTML = `<span>${u.avatar}</span> <span>${u.name}</span>`;
            item.onclick = () => selectUserFromSearch(u);
            searchSuggestions.appendChild(item);
        });
        searchSuggestions.classList.remove("hidden");
    } else {
        searchSuggestions.classList.add("hidden");
    }
});

function selectUserFromSearch(userData) {
    if (!currentUser.savedContactIds.includes(userData.uid)) {
        currentUser.savedContactIds.push(userData.uid);
        db.collection("users").doc(currentUser.uid).update({ savedContactIds: currentUser.savedContactIds });
        if (!activeContacts.some(c => c.uid === userData.uid)) activeContacts.unshift(userData);
    }
    renderContacts();
    switchChat([currentUser.uid, userData.uid].sort().join("_"), userData, true);
    searchUserInput.value = "";
    searchSuggestions.classList.add("hidden");
}

function renderContacts() {
    dmList.innerHTML = "";
    const combined = [
        ...activeContacts.map(c => ({ ...c, isSaved: true })),
        ...unsavedContacts.filter(u => !activeContacts.some(a => a.uid === u.uid)).map(c => ({ ...c, isSaved: false }))
    ];

    if (combined.length === 0) {
        dmList.innerHTML = `<div class="empty-state">No active chats. Search above.</div>`;
        return;
    }

    combined.forEach((contact) => {
        const dmId = [currentUser.uid, contact.uid].sort().join("_");
        const item = document.createElement("div");
        item.className = "chat-list-item";
        item.innerHTML = `
            <div class="avatar-box"><span>${contact.avatar || '👤'}</span></div>
            <div class="chat-info-col">
                <h4>${contact.name} ${contact.isSaved ? '' : '<span style="font-size:10px; color:var(--text-muted)">(Unsaved)</span>'}</h4>
                <p>Tap to start messaging</p>
            </div>
            <button class="btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="event.stopPropagation(); openProfileModal('${contact.uid}')">Info</button>
        `;
        item.onclick = () => switchChat(dmId, contact, contact.isSaved);
        dmList.appendChild(item);
    });
}

let activeChatListener = null;
function switchChat(chatId, contact, isSaved) {
    currentChatId = chatId;
    activeContactProfileTarget = contact;
    chatTitle.innerText = contact.name;
    renderAvatarElement(chatHeaderAvatar, contact.avatar);

    viewHome.classList.remove("active");
    viewChat.classList.add("active");

    if (activeChatListener) activeChatListener();
    activeChatListener = db.collection("chats").doc(chatId).onSnapshot((doc) => {
        if (doc.exists && doc.data().wallpaper) {
            document.documentElement.style.setProperty("--chat-wallpaper", `url('${doc.data().wallpaper}')`);
        } else {
            document.documentElement.style.setProperty("--chat-wallpaper", "var(--bg-main)");
        }
    });

    if (!isSaved) unsavedContactBanner.classList.remove("hidden");
    else unsavedContactBanner.classList.add("hidden");

    loadMessages();
}

function closeActiveChat() {
    viewChat.classList.remove("active");
    viewHome.classList.add("active");
    currentChatId = null;
}

let unsubscribeMessages = null;
function loadMessages() {
    if (unsubscribeMessages) unsubscribeMessages();
    messagesContainer.innerHTML = "";
    unsubscribeMessages = db.collection("chats").doc(currentChatId).collection("messages").orderBy("timestamp", "asc").onSnapshot((snapshot) => {
        messagesContainer.innerHTML = "";
        if (snapshot.empty) {
            messagesContainer.innerHTML = `<div class="empty-state">No messages yet.</div>`;
            return;
        }
        snapshot.forEach((doc) => {
            const msg = doc.data();
            if (msg.deletedFor && msg.deletedFor.includes(currentUser.uid)) return;
            const div = document.createElement("div");
            div.className = `message-bubble ${msg.senderId === currentUser.uid ? 'my-msg' : 'other-msg'}`;
            div.innerHTML = `<span>${msg.text || ''}</span>`;
            messagesContainer.appendChild(div);
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}

sendBtn.addEventListener("click", () => sendMessage());
messageInput.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); sendMessage(); } });

function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !currentChatId) return;
    const participantIds = currentChatId.split("_");
    db.collection("chats").doc(currentChatId).set({ participants: participantIds, lastSenderId: currentUser.uid }, { merge: true });
    db.collection("chats").doc(currentChatId).collection("messages").add({
        text, senderId: currentUser.uid, senderName: currentUser.name, senderAvatar: currentUser.avatar, deletedFor: [], timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    messageInput.value = "";
}

function openProfileModal(uid) {
    db.collection("users").doc(uid).get().then(doc => {
        if (!doc.exists) return;
        const u = doc.data();
        profileModalName.innerText = u.name;
        profileModalBio.innerText = u.bio || "No bio";
        profileModal.classList.remove("hidden");
    });
}
function closeProfileModal() { profileModal.classList.add("hidden"); }

function openSettings() { settingsModal.classList.remove("hidden"); }
function closeSettings() { settingsModal.classList.add("hidden"); }
function saveAppSettings() {
    const bio = settingBioInput.value.trim();
    db.collection("users").doc(currentUser.uid).update({ bio }).then(() => { alert("Saved!"); closeSettings(); });
}

function openStatusModal() { statusModal.classList.remove("hidden"); }
function closeStatusModal() { statusModal.classList.add("hidden"); }
function closeStatusViewer() { statusViewerModal.classList.add("hidden"); }
function closeAdminModal() { adminModal.classList.add("hidden"); }
function closeDeleteMsgModal() { deleteMsgModal.classList.add("hidden"); }
