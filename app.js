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
let isAndroidDevice = false;

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
const chatInputArea = document.getElementById("chat-input-area");
const chatTitle = document.getElementById("chat-title");
const chatHeaderAvatar = document.getElementById("chat-header-avatar");
const chatHeaderActions = document.getElementById("chat-header-actions");
const chatSearchBar = document.getElementById("chat-search-bar");
const chatSearchInput = document.getElementById("chat-search-input");
const unsavedContactBanner = document.getElementById("unsaved-contact-banner");
const pinChatBtn = document.getElementById("pin-chat-btn");
const blockChatBtn = document.getElementById("block-chat-btn");
const currentUserDisplay = document.getElementById("current-user-display");
const userAvatarPreview = document.getElementById("user-avatar-preview");
const dmList = document.getElementById("dm-list");
const mobileBackBtn = document.getElementById("mobile-back-btn");

const searchUserInput = document.getElementById("search-user-input");
const searchUserBtn = document.getElementById("search-user-btn");
const searchSuggestions = document.getElementById("search-suggestions");

const profileModal = document.getElementById("profile-modal");
const profileModalAvatar = document.getElementById("profile-modal-avatar");
const profileModalName = document.getElementById("profile-modal-name");
const profileModalBio = document.getElementById("profile-modal-bio");

const statusModal = document.getElementById("status-modal");
const statusFileInput = document.getElementById("status-file-input");
const statusDurationVal = document.getElementById("status-duration-val");
const statusDurationUnit = document.getElementById("status-duration-unit");
const statusPrivacyContactsList = document.getElementById("status-privacy-contacts-list");

const statusViewerModal = document.getElementById("status-viewer-modal");
const viewerUserAvatar = document.getElementById("viewer-user-avatar");
const viewerUserName = document.getElementById("viewer-user-name");
const viewerTimeLeft = document.getElementById("viewer-time-left");
const viewerMediaContainer = document.getElementById("viewer-media-container");

const deleteMsgModal = document.getElementById("delete-msg-modal");
const adminModal = document.getElementById("admin-modal");
const adminPanelIconBtn = document.getElementById("admin-panel-icon-btn");
const adminUsersList = document.getElementById("admin-users-list");

const settingsModal = document.getElementById("settings-modal");
const settingTheme = document.getElementById("setting-theme");
const settingColor = document.getElementById("setting-color");
const settingBioInput = document.getElementById("setting-bio-input");
const settingCarouselDisplay = document.getElementById("setting-carousel-display");
const chatWallpaperFileInput = document.getElementById("chat-wallpaper-file-input");

// DETECT OS AUTO-SENSING ON STARTUP
function detectDeviceEnvironment() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    isAndroidDevice = /android/i.test(ua);
    const bodyEl = document.body;

    if (isAndroidDevice || window.innerWidth <= 768) {
        bodyEl.classList.remove("desktop-mode");
        bodyEl.classList.add("android-mode");
    } else {
        bodyEl.classList.remove("android-mode");
        bodyEl.classList.add("desktop-mode");
    }
}

window.addEventListener("resize", detectDeviceEnvironment);

auth.onAuthStateChanged((user) => {
    detectDeviceEnvironment();
    const acceptedTC = localStorage.getItem("zivo_tc_accepted");
    const loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) loadingScreen.classList.add("hidden");

    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const installBtn = document.getElementById("install-app-btn");
    if (installBtn) {
        if (/android|win|macintosh|mac os x/i.test(userAgent)) {
            installBtn.classList.remove("hidden");
        } else {
            installBtn.classList.add("hidden");
        }
    }

    if (!acceptedTC) {
        tcModal.classList.remove("hidden");
        return;
    }

    if (user) {
        db.collection("users").doc(user.uid).get().then((doc) => {
            const data = doc.data();
            if (data && data.status === "inactive") {
                alert("Your account has been marked as Inactive by the administrator.");
                auth.signOut();
                return;
            }
            const isAdmin = user.uid === "admin_master_uid" || (data && data.name === "SuperAdmin");
            
            initUserSession(
                user.uid,
                data ? data.name : "User",
                data ? data.avatar : "👦🏽",
                data ? data.bio : "",
                data ? data.pinnedChats || [] : [],
                data ? data.blockedUsers || [] : [],
                data ? data.savedContactIds || [] : [],
                isAdmin
            );
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
    const installBtn = document.getElementById("install-app-btn");
    if (installBtn) installBtn.classList.remove("hidden");
});

function openInstallModal() {
    installModal.classList.remove("hidden");
}

function closeInstallModal() {
    installModal.classList.add("hidden");
}

function confirmAppInstall() {
    closeInstallModal();
    if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then((choiceResult) => {
            deferredInstallPrompt = null;
        });
    } else {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        if (/macintosh|mac os x/i.test(userAgent)) {
            alert("To install Zivo Chat on Mac, open Chrome menu (three dots) and select 'Save and Share' -> 'Install Zivo Chat...' or 'Add to Dock'.");
        } else if (/win/i.test(navigator.platform) || /windows/i.test(userAgent)) {
            alert("To install Zivo Chat on Windows, click the install icon (monitor with down arrow) right in your browser's address bar!");
        } else {
            alert("Android PWA install ready! Tap your browser's menu and select 'Install app' or 'Add to Home screen'.");
        }
    }
}

function handleTCAccept() {
    localStorage.setItem("zivo_tc_accepted", "true");
    tcModal.classList.add("hidden");
    authScreen.classList.remove("hidden");
}

function handleTCDcline() {
    alert("You must accept the Terms & Conditions to use Zivo Chat.");
}

function shiftRegAvatar(direction) {
    regAvatarIndex = (regAvatarIndex + direction + AVATAR_OPTIONS.length) % AVATAR_OPTIONS.length;
    regCarouselDisplay.innerText = AVATAR_OPTIONS[regAvatarIndex];
    regFileInput.value = "";
}

function shiftSettingAvatar(direction) {
    settingAvatarIndex = (settingAvatarIndex + direction + AVATAR_OPTIONS.length) % AVATAR_OPTIONS.length;
    settingCarouselDisplay.innerText = AVATAR_OPTIONS[settingAvatarIndex];
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
    settingTheme.value = newTheme;
}

function getEmailFromUsername(input) {
    const trimmed = input.trim();
    if (trimmed.includes("@")) return trimmed.toLowerCase();
    return `${trimmed.toLowerCase().replace(/\s+/g, '_')}@zivochat.app`;
}

function processAnyImageToCompressedDataURL(fileInput, callback) {
    const file = fileInput.files[0];
    if (!file) { callback(null); return; }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            
            let width = img.width;
            let height = img.height;
            const maxDim = 1600;
            if (width > maxDim || height > maxDim) {
                if (width > height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.75);
            callback(compressedDataUrl);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function readFileAsDataURLWithLimit(fileInput, maxMB, callback) {
    const file = fileInput.files[0];
    if (!file) { callback(null); return; }
    
    const maxSize = maxMB * 1024 * 1024;
    if (file.size > maxSize) {
        alert(`File size exceeds ${maxMB} MB limit! Please choose a smaller file.`);
        callback(null);
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => callback(e.target.result);
    reader.readAsDataURL(file);
}

function toggleAuthMode(mode) {
    if (mode === 'login') {
        signupFields.classList.add("hidden");
        loginFields.classList.remove("hidden");
        authSubtitle.innerText = "Log in to your account to start messaging.";
    } else {
        loginFields.classList.add("hidden");
        signupFields.classList.remove("hidden");
        authSubtitle.innerText = "Create your account to start messaging.";
    }
}

submitSignupBtn.addEventListener("click", () => {
    const username = regUsername.value.trim();
    const password = regPassword.value;
    if (!username || !password) return alert("Enter both username and password!");

    readFileAsDataURLWithLimit(regFileInput, 35, (base64Img) => {
        const avatar = base64Img || AVATAR_OPTIONS[regAvatarIndex];
        auth.createUserWithEmailAndPassword(getEmailFromUsername(username), password)
            .then((userCredential) => {
                db.collection("users").doc(userCredential.user.uid).set({
                    uid: userCredential.user.uid,
                    name: username,
                    nameLower: username.toLowerCase(),
                    avatar: avatar,
                    bio: "",
                    pinnedChats: [],
                    blockedUsers: [],
                    savedContactIds: [],
                    status: "active"
                }).then(() => {
                    initUserSession(userCredential.user.uid, username, avatar, "", [], [], [], false);
                });
            })
            .catch((error) => alert(error.message));
    });
});

submitLoginBtn.addEventListener("click", () => {
    const username = loginUsername.value.trim();
    const password = loginPassword.value;
    if (!username || !password) return alert("Enter both username and password!");

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        initUserSession("admin_master_uid", "SuperAdmin", "🛡️", "Platform System Administrator", [], [], [], true);
        return;
    }

    auth.signInWithEmailAndPassword(getEmailFromUsername(username), password)
        .then((userCredential) => {
            db.collection("users").doc(userCredential.user.uid).get().then((doc) => {
                const data = doc.data();
                if (data && data.status === "inactive") {
                    alert("Your account has been marked as Inactive by the administrator.");
                    auth.signOut();
                    return;
                }
                initUserSession(
                    userCredential.user.uid,
                    data ? data.name : username,
                    data ? data.avatar : "👦🏽",
                    data ? data.bio : "",
                    data ? data.pinnedChats || [] : [],
                    data ? data.blockedUsers || [] : [],
                    data ? data.savedContactIds || [] : [],
                    false
                );
            });
        })
        .catch((error) => alert(error.message));
});

function initUserSession(uid, username, avatar, bio, pinnedChats, blockedUsers, savedContactIds, isAdmin) {
    currentUser = { uid, name: username, avatar, bio, pinnedChats, blockedUsers, savedContactIds, isAdmin };

    renderAvatarElement(userAvatarPreview, avatar);
    currentUserDisplay.innerText = currentUser.name;
    settingBioInput.value = bio || "";
    settingCarouselDisplay.innerText = AVATAR_OPTIONS[settingAvatarIndex];

    if (isAdmin) {
        adminPanelIconBtn.classList.remove("hidden");
    } else {
        adminPanelIconBtn.classList.add("hidden");
        db.collection("users").doc(currentUser.uid).set({
            uid: currentUser.uid,
            name: currentUser.name,
            nameLower: currentUser.name.toLowerCase(),
            avatar: currentUser.avatar,
            bio: currentUser.bio || "",
            pinnedChats: currentUser.pinnedChats || [],
            blockedUsers: currentUser.blockedUsers || [],
            savedContactIds: currentUser.savedContactIds || [],
            status: "active"
        }, { merge: true });
    }

    authScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");

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

function renderAvatarElement(element, avatar) {
    if (avatar && (avatar.startsWith("data:") || avatar.startsWith("http"))) {
        element.innerHTML = `<img src="${avatar}" alt="avatar">`;
    } else {
        element.innerText = avatar || "👤";
    }
}

function syncAllUsersChatsAndStatuses() {
    db.collection("users").onSnapshot((userSnapshot) => {
        allUsersCache = [];
        const userMap = {};
        userSnapshot.forEach(doc => {
            const u = doc.data();
            allUsersCache.push(u);
            userMap[u.uid] = u;
        });

        db.collection("users").doc(currentUser.uid).onSnapshot((myDoc) => {
            if (myDoc.exists) {
                const myData = myDoc.data();
                currentUser.savedContactIds = myData.savedContactIds || [];
                currentUser.pinnedChats = myData.pinnedChats || [];
                currentUser.blockedUsers = myData.blockedUsers || [];

                activeContacts = currentUser.savedContactIds
                    .map(id => userMap[id])
                    .filter(Boolean);
                renderContacts();
            }
        });

        if (!currentUser.isAdmin) {
            db.collection("chats")
                .where("participants", "array-contains", currentUser.uid)
                .onSnapshot((chatSnapshot) => {
                    unsavedContacts = [];
                    chatSnapshot.forEach((doc) => {
                        const data = doc.data();
                        const chatId = doc.id;
                        const otherUid = (data.participants || []).find(id => id !== currentUser.uid);

                        if (otherUid && userMap[otherUid]) {
                            if ((currentUser.blockedUsers || []).includes(otherUid)) return;
                            if ((data.deletedBy || []).includes(currentUser.uid)) return;

                            const isSaved = (currentUser.savedContactIds || []).includes(otherUid);
                            if (!isSaved && !unsavedContacts.some(c => c.uid === otherUid)) {
                                unsavedContacts.push(userMap[otherUid]);
                            }

                            if (data.lastSenderId && data.lastSenderId !== currentUser.uid && chatId !== currentChatId) {
                                unreadCounts[otherUid] = (unreadCounts[otherUid] || 0) + 1;
                            }
                        }
                    });
                    renderContacts();
                });
        }
    });

    db.collection("statuses").onSnapshot((statusSnapshot) => {
        const now = Date.now();
        activeStatusesMap = {};
        statusSnapshot.forEach((doc) => {
            const s = doc.data();
            if (s.expiresAt && s.expiresAt > now) {
                const hiddenFrom = s.hiddenFrom || [];
                if (!hiddenFrom.includes(currentUser.uid)) {
                    activeStatusesMap[s.userId] = { id: doc.id, ...s };
                }
            }
        });
        renderContacts();
    });
}

searchUserInput.addEventListener("input", () => {
    const query = searchUserInput.value.trim().toLowerCase();
    if (!query) {
        searchSuggestions.classList.add("hidden");
        return;
    }
    const matches = allUsersCache.filter(u =>
        u.uid !== currentUser.uid &&
        u.name && u.name.toLowerCase().includes(query) &&
        !(currentUser.blockedUsers || []).includes(u.uid)
    ).slice(0, 6);

    if (matches.length > 0) {
        showSuggestionDropdown(matches, "Matching Users");
    } else {
        searchSuggestions.classList.add("hidden");
    }
});

searchUserInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        executeUserSearch();
    }
});
searchUserBtn.addEventListener("click", executeUserSearch);

function executeUserSearch() {
    const query = searchUserInput.value.trim();
    if (!query) return;

    const queryLower = query.toLowerCase();
    const exactMatch = allUsersCache.find(u => u.uid !== currentUser.uid && u.name && u.name.toLowerCase() === queryLower);

    if (exactMatch) {
        selectUserFromSearch(exactMatch);
        return;
    }

    const closeMatches = allUsersCache.filter(u => {
        if (u.uid === currentUser.uid || !u.name || (currentUser.blockedUsers || []).includes(u.uid)) return false;
        const uname = u.name.toLowerCase();
        return uname.includes(queryLower) || queryLower.includes(uname);
    }).slice(0, 5);

    if (closeMatches.length > 0) {
        showSuggestionDropdown(closeMatches, `"${query}" not found. Did you mean:`);
    } else {
        searchSuggestions.innerHTML = `<div class="suggestion-header">No user found matching "${query}"</div>`;
        searchSuggestions.classList.remove("hidden");
    }
}

function showSuggestionDropdown(users, headerText) {
    searchSuggestions.innerHTML = `<div class="suggestion-header">${headerText}</div>`;
    users.forEach(user => {
        const item = document.createElement("div");
        item.className = "suggestion-item";
        const avatarHTML = user.avatar && (user.avatar.startsWith("data:") || user.avatar.startsWith("http"))
            ? `<img src="${user.avatar}" alt="avatar">`
            : `<span>${user.avatar || '👤'}</span>`;
        item.innerHTML = `${avatarHTML} <span>${user.name}</span>`;
        item.onclick = () => selectUserFromSearch(user);
        searchSuggestions.appendChild(item);
    });
    searchSuggestions.classList.remove("hidden");
}

function selectUserFromSearch(userData) {
    if (!(currentUser.savedContactIds || []).includes(userData.uid)) {
        currentUser.savedContactIds = [...(currentUser.savedContactIds || []), userData.uid];
        db.collection("users").doc(currentUser.uid).update({ savedContactIds: currentUser.savedContactIds });
        if (!activeContacts.some(c => c.uid === userData.uid)) {
            activeContacts.unshift(userData);
        }
    }
    renderContacts();
    const dmId = [currentUser.uid, userData.uid].sort().join("_");
    switchChat(dmId, userData, true);
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
        dmList.innerHTML = `<p style="font-size:12px; color:var(--text-muted); padding:10px;">No chats yet. Search a username to start messaging.</p>`;
        return;
    }

    const pinned = currentUser.pinnedChats || [];
    combined.sort((a, b) => {
        const aPinned = pinned.includes(a.uid);
        const bPinned = pinned.includes(b.uid);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return 0;
    });

    combined.forEach((contact) => {
        const dmId = [currentUser.uid, contact.uid].sort().join("_");
        const isPinned = pinned.includes(contact.uid);
        const unreadCount = unreadCounts[contact.uid] || 0;
        const contactStatus = contact.isSaved ? activeStatusesMap[contact.uid] : null;

        const chatDiv = document.createElement("div");
        chatDiv.className = `chat-item ${currentChatId === dmId ? 'active' : ''} ${isPinned ? 'pinned' : ''}`;

        let avatarInnerHTML = "";
        if (contactStatus) {
            if (contactStatus.mediaType && contactStatus.mediaType.startsWith("video/")) {
                avatarInnerHTML = `<span class="avatar-txt">🎬</span>`;
            } else {
                avatarInnerHTML = `<img src="${contactStatus.mediaUrl}" alt="status">`;
            }
        } else if (contact.avatar && (contact.avatar.startsWith("data:") || contact.avatar.startsWith("http"))) {
            avatarInnerHTML = `<img src="${contact.avatar}" alt="avatar">`;
        } else {
            avatarInnerHTML = `<span class="avatar-txt">${contact.avatar || '💬'}</span>`;
        }

        const displayNameHTML = contact.isSaved
            ? `<span class="chat-name-text">${contact.name} ${isPinned ? '📌' : ''}</span>`
            : `<span class="chat-name-text">${contact.name} <span class="not-saved-tag">- Not Saved</span></span>`;

        const unreadHTML = unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : '';

        chatDiv.innerHTML = `
            <div class="chat-item-left">
                <div class="avatar-wrapper ${contactStatus ? 'has-status' : ''}">
                    ${avatarInnerHTML}
                </div>
                <div class="chat-name-col">
                    ${displayNameHTML}
                </div>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
                <button class="chip-btn info-btn" title="View Bio & Info" onclick="event.stopPropagation(); openProfileModal('${contact.uid}')">ℹ️ Info</button>
                ${unreadHTML}
            </div>
        `;

        const avatarEl = chatDiv.querySelector(".avatar-wrapper");
        if (contactStatus) {
            avatarEl.addEventListener("click", (e) => {
                e.stopPropagation();
                openStatusViewer(contact, contactStatus);
            });
        }

        chatDiv.addEventListener("click", () => {
            unreadCounts[contact.uid] = 0;
            switchChat(dmId, contact, contact.isSaved);
        });

        dmList.appendChild(chatDiv);
    });
}

let activeChatListener = null;
function switchChat(chatId, contact, isSaved) {
    currentChatId = chatId;
    activeContactProfileTarget = contact;
    chatTitle.innerText = isSaved ? contact.name : `${contact.name} - Not Saved`;
    renderAvatarElement(chatHeaderAvatar, contact.avatar);

    chatInputArea.classList.remove("hidden");
    chatHeaderActions.classList.remove("hidden");
    chatSearchBar.classList.add("hidden");
    chatSearchInput.value = "";

    const chatAreaEl = document.querySelector(".chat-area");
    chatAreaEl.classList.add("mobile-active");
    if (mobileBackBtn) mobileBackBtn.classList.remove("hidden");

    if (activeChatListener) activeChatListener();
    activeChatListener = db.collection("chats").doc(chatId).onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            if (data.wallpaper) {
                document.documentElement.style.setProperty("--chat-wallpaper", `url('${data.wallpaper}')`);
            } else {
                document.documentElement.style.setProperty("--chat-wallpaper", "var(--bg-main)");
            }
        } else {
            document.documentElement.style.setProperty("--chat-wallpaper", "var(--bg-main)");
        }
    });

    if (!isSaved) {
        unsavedContactBanner.classList.remove("hidden");
    } else {
        unsavedContactBanner.classList.add("hidden");
    }

    const pinned = currentUser.pinnedChats || [];
    pinChatBtn.innerText = pinned.includes(contact.uid) ? "📌 Unpin" : "📌 Pin";

    const blocked = currentUser.blockedUsers || [];
    blockChatBtn.innerText = blocked.includes(contact.uid) ? "Unblock" : "🚫 Block";

    renderContacts();
    loadMessages();
}

function returnToChatList() {
    const chatAreaEl = document.querySelector(".chat-area");
    chatAreaEl.classList.remove("mobile-active");
    if (mobileBackBtn) mobileBackBtn.classList.add("hidden");
    currentChatId = null;
}

function triggerChatWallpaperUpload() {
    if (!currentChatId) return alert("Open a chat first!");
    chatWallpaperFileInput.click();
}

function handleChatWallpaperUpload(input) {
    processAnyImageToCompressedDataURL(input, (compressedBase64) => {
        if (!compressedBase64 || !currentChatId) return;
        db.collection("chats").doc(currentChatId).set({
            wallpaper: compressedBase64
        }, { merge: true }).then(() => {
            alert("Chat background updated successfully for both users!");
            input.value = "";
        }).catch(err => alert("Error setting wallpaper: " + err.message));
    });
}

function toggleChatSearch() {
    if (chatSearchBar.classList.contains("hidden")) {
        chatSearchBar.classList.remove("hidden");
        chatSearchInput.focus();
    } else {
        chatSearchBar.classList.add("hidden");
        chatSearchInput.value = "";
        filterChatMessages("");
    }
}

function filterChatMessages(query) {
    const q = query.toLowerCase();
    const msgEls = messagesContainer.querySelectorAll(".message");
    msgEls.forEach(el => {
        const text = el.innerText.toLowerCase();
        if (text.includes(q)) {
            el.style.display = "block";
        } else {
            el.style.display = "none";
        }
    });
}

function saveCurrentUnknownContact() {
    if (!activeContactProfileTarget) return;
    const uid = activeContactProfileTarget.uid;
    if (!(currentUser.savedContactIds || []).includes(uid)) {
        currentUser.savedContactIds = [...(currentUser.savedContactIds || []), uid];
        db.collection("users").doc(currentUser.uid).update({ savedContactIds: currentUser.savedContactIds });
    }
    unsavedContacts = unsavedContacts.filter(c => c.uid !== uid);
    if (!activeContacts.some(c => c.uid === uid)) {
        activeContacts.unshift(activeContactProfileTarget);
    }
    unsavedContactBanner.classList.add("hidden");
    chatTitle.innerText = activeContactProfileTarget.name;
    renderContacts();
}

function deleteCurrentUnknownContact() {
    if (!activeContactProfileTarget || !currentChatId) return;
    const uid = activeContactProfileTarget.uid;
    db.collection("chats").doc(currentChatId).set({
        deletedBy: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
    }, { merge: true });

    unsavedContacts = unsavedContacts.filter(c => c.uid !== uid);
    currentChatId = null;
    activeContactProfileTarget = null;
    unsavedContactBanner.classList.add("hidden");
    chatInputArea.classList.add("hidden");
    chatHeaderActions.classList.add("hidden");
    chatSearchBar.classList.add("hidden");
    chatTitle.innerText = "Select a contact to chat";
    messagesContainer.innerHTML = `<div class="empty-state"><p>Contact deleted.</p></div>`;
    renderContacts();
}

function togglePinCurrentChat() {
    if (!activeContactProfileTarget) return;
    let pinned = currentUser.pinnedChats || [];
    const targetUid = activeContactProfileTarget.uid;

    if (pinned.includes(targetUid)) {
        pinned = pinned.filter(id => id !== targetUid);
        pinChatBtn.innerText = "📌 Pin";
    } else {
        pinned.push(targetUid);
        pinChatBtn.innerText = "📌 Unpin";
    }

    currentUser.pinnedChats = pinned;
    db.collection("users").doc(currentUser.uid).update({ pinnedChats: pinned });
    renderContacts();
}

function toggleBlockCurrentChat() {
    if (!activeContactProfileTarget) return;
    let blocked = currentUser.blockedUsers || [];
    const targetUid = activeContactProfileTarget.uid;

    if (blocked.includes(targetUid)) {
        blocked = blocked.filter(id => id !== targetUid);
        blockChatBtn.innerText = "🚫 Block";
        alert("User unblocked.");
    } else {
        blocked.push(targetUid);
        blockChatBtn.innerText = "Unblock";
        activeContacts = activeContacts.filter(c => c.uid !== targetUid);
        unsavedContacts = unsavedContacts.filter(c => c.uid !== targetUid);
        currentChatId = null;
        chatTitle.innerText = "Select a contact to chat";
        chatInputArea.classList.add("hidden");
        chatHeaderActions.classList.add("hidden");
        chatSearchBar.classList.add("hidden");
        unsavedContactBanner.classList.add("hidden");
        messagesContainer.innerHTML = `<div class="empty-state"><p>User blocked.</p></div>`;
        alert("User blocked.");
    }

    currentUser.blockedUsers = blocked;
    db.collection("users").doc(currentUser.uid).update({ blockedUsers: blocked });
    renderContacts();
}

function openActiveChatProfile() {
    if (!activeContactProfileTarget) return;
    openProfileModal(activeContactProfileTarget.uid);
}

function openProfileModal(uid) {
    db.collection("users").doc(uid).get().then((doc) => {
        if (!doc.exists) return;
        const u = doc.data();
        profileModalName.innerText = u.name;
        profileModalBio.innerText = u.bio ? u.bio : "No bio added yet.";

        if (u.avatar && (u.avatar.startsWith("data:") || u.avatar.startsWith("http"))) {
            profileModalAvatar.innerHTML = `<img src="${u.avatar}" alt="avatar" style="width:68px; height:68px; border-radius:50%; object-fit:cover;">`;
        } else {
            profileModalAvatar.innerText = u.avatar || "👤";
        }
        profileModal.classList.remove("hidden");
    });
}

function closeProfileModal() {
    profileModal.classList.add("hidden");
}

let unsubscribeMessages = null;
function loadMessages() {
    if (unsubscribeMessages) unsubscribeMessages();
    messagesContainer.innerHTML = "";

    unsubscribeMessages = db.collection("chats")
        .doc(currentChatId)
        .collection("messages")
        .orderBy("timestamp", "asc")
        .onSnapshot((snapshot) => {
            messagesContainer.innerHTML = "";
            if (snapshot.empty) {
                messagesContainer.innerHTML = `<div class="empty-state"><p>No messages here yet. Say hello!</p></div>`;
                return;
            }
            snapshot.forEach((doc) => {
                const msgId = doc.id;
                const msg = doc.data();

                if (msg.deletedFor && msg.deletedFor.includes(currentUser.uid)) return;

                const div = document.createElement("div");
                div.className = `message ${msg.senderId === currentUser.uid ? 'my-message' : ''}`;

                let senderAvatarHtml = msg.senderAvatar && (msg.senderAvatar.startsWith("data:") || msg.senderAvatar.startsWith("http"))
                    ? `<img src="${msg.senderAvatar}" class="msg-sender-avatar" alt="logo">`
                    : `<span class="msg-sender-avatar">${msg.senderAvatar || '👤'}</span>`;

                let contentHTML = `
                    <div class="msg-header-row">
                        ${senderAvatarHtml}
                        <span class="sender">${msg.senderName}</span>
                    </div>
                `;

                if (msg.fileUrl) {
                    if (msg.fileType && msg.fileType.startsWith("image/")) {
                        contentHTML += `<img src="${msg.fileUrl}" class="chat-sent-media" alt="Image">`;
                    } else if (msg.fileType && msg.fileType.startsWith("video/")) {
                        contentHTML += `<video src="${msg.fileUrl}" controls class="chat-sent-media"></video>`;
                    } else if (msg.fileType && msg.fileType.startsWith("audio/")) {
                        contentHTML += `<audio src="${msg.fileUrl}" controls class="chat-audio-player"></audio>`;
                    } else {
                        contentHTML += `<a href="${msg.fileUrl}" download="${msg.fileName || 'file'}" class="chat-file-attachment">📎 ${msg.fileName || 'Download File'}</a>`;
                    }
                }

                if (msg.text) {
                    contentHTML += `<span>${msg.text}</span>`;
                }

                let timeStr = "Just now";
                if (msg.timestamp && msg.timestamp.toDate) {
                    const d = msg.timestamp.toDate();
                    timeStr = d.toLocaleDateString() + " • " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }

                contentHTML += `
                    <div class="msg-footer">
                        <span class="msg-timestamp">${timeStr}</span>
                        <button class="msg-delete-icon" onclick="openDeleteMessageModal('${msgId}')" title="Delete Message">🗑️</button>
                    </div>
                `;

                div.innerHTML = contentHTML;
                messagesContainer.appendChild(div);
            });
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
}

sendBtn.addEventListener("click", () => sendMessage(null, null, null));
messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        sendMessage(null, null, null);
    }
});

attachFileBtn.addEventListener("click", () => chatFileInput.click());
chatFileInput.addEventListener("change", () => {
    const file = chatFileInput.files[0];
    if (!file) return;

    readFileAsDataURLWithLimit(chatFileInput, 35, (base64Data) => {
        if (base64Data) {
            sendMessage(base64Data, file.name, file.type);
        }
        chatFileInput.value = "";
    });
});

voiceRecordBtn.addEventListener("click", startLiveVoiceRecording);
cancelVoiceBtn.addEventListener("click", cancelLiveVoiceRecording);
uploadVoiceBtn.addEventListener("click", stopAndUploadVoiceRecording);

async function startLiveVoiceRecording() {
    try {
        microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(microphoneStream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) audioChunks.push(event.data);
        };
        mediaRecorder.start();

        textInputWrapper.classList.add("hidden");
        voiceWaveWrapper.classList.remove("hidden");

        recordingSeconds = 0;
        recordingTimerEl.innerText = "0:00";
        recordingTimerInterval = setInterval(() => {
            recordingSeconds++;
            const mins = Math.floor(recordingSeconds / 60);
            const secs = recordingSeconds % 60;
            recordingTimerEl.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }, 1000);

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(microphoneStream);
        source.connect(analyser);
        analyser.fftSize = 64;

        drawLiveAudioWave();
    } catch (err) {
        alert("Microphone access denied or unavailable.");
    }
}

function drawLiveAudioWave() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvasCtx = audioWaveCanvas.getContext("2d");

    function renderFrame() {
        animationFrameId = requestAnimationFrame(renderFrame);
        analyser.getByteFrequencyData(dataArray);

        canvasCtx.clearRect(0, 0, audioWaveCanvas.width, audioWaveCanvas.height);

        const barWidth = (audioWaveCanvas.width / bufferLength) * 1.6;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const barHeight = Math.max(4, (dataArray[i] / 255) * audioWaveCanvas.height);
            canvasCtx.fillStyle = "#3b82f6";
            const y = (audioWaveCanvas.height - barHeight) / 2;
            canvasCtx.beginPath();
            canvasCtx.roundRect(x, y, barWidth - 2, barHeight, 3);
            canvasCtx.fill();
            x += barWidth;
        }
    }
    renderFrame();
}

function cleanupVoiceRecordingUI() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (recordingTimerInterval) clearInterval(recordingTimerInterval);
    if (microphoneStream) {
        microphoneStream.getTracks().forEach(track => track.stop());
        microphoneStream = null;
    }
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    voiceWaveWrapper.classList.add("hidden");
    textInputWrapper.classList.remove("hidden");
}

function cancelLiveVoiceRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.onstop = null;
        mediaRecorder.stop();
    }
    audioChunks = [];
    cleanupVoiceRecordingUI();
}

function stopAndUploadVoiceRecording() {
    if (!mediaRecorder || mediaRecorder.state === "inactive") return;

    mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
        const reader = new FileReader();
        reader.onload = (e) => {
            sendMessage(e.target.result, "voice_message.mp3", "audio/mp3");
        };
        reader.readAsDataURL(audioBlob);
        cleanupVoiceRecordingUI();
    };
    mediaRecorder.stop();
}

function sendMessage(fileData, fileName, fileType) {
    const text = messageInput.value.trim();
    if ((!text && !fileData) || !currentChatId) return;

    const participantIds = currentChatId.split("_");

    db.collection("chats").doc(currentChatId).set({
        participants: participantIds,
        lastSenderId: currentUser.uid,
        deletedBy: [],
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    db.collection("chats").doc(currentChatId).collection("messages").add({
        text: text || "",
        fileUrl: fileData || "",
        fileName: fileName || "",
        fileType: fileType || "",
        senderId: currentUser.uid,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        deletedFor: [],
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    if (!fileData) messageInput.value = "";
}

function openDeleteMessageModal(msgId) {
    activeMessageIdForDeletion = msgId;
    deleteMsgModal.classList.remove("hidden");
}

function closeDeleteMsgModal() {
    activeMessageIdForDeletion = null;
    deleteMsgModal.classList.add("hidden");
}

function confirmDeleteMessageForMe() {
    if (!activeMessageIdForDeletion || !currentChatId) return;
    db.collection("chats").doc(currentChatId).collection("messages").doc(activeMessageIdForDeletion).update({
        deletedFor: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
    }).then(() => {
        closeDeleteMsgModal();
    });
}

function confirmDeleteMessageForEveryone() {
    if (!activeMessageIdForDeletion || !currentChatId) return;
    db.collection("chats").doc(currentChatId).collection("messages").doc(activeMessageIdForDeletion).delete().then(() => {
        closeDeleteMsgModal();
    });
}

let currentUserStatusHiddenFrom = [];

function openStatusModal() {
    statusModal.classList.remove("hidden");
    loadStatusPrivacyList();
}

function closeStatusModal() {
    statusModal.classList.add("hidden");
}

function loadStatusPrivacyList() {
    statusPrivacyContactsList.innerHTML = "";
    if (activeContacts.length === 0) {
        statusPrivacyContactsList.innerHTML = `<p style="font-size:12px; color:var(--text-muted); text-align:center;">No saved contacts yet.</p>`;
        return;
    }

    db.collection("statuses").where("userId", "==", currentUser.uid).get().then((snap) => {
        snap.forEach(doc => {
            const data = doc.data();
            if (data.hiddenFrom) currentUserStatusHiddenFrom = data.hiddenFrom;
        });

        activeContacts.forEach(contact => {
            const isBlocked = currentUserStatusHiddenFrom.includes(contact.uid);
            const row = document.createElement("div");
            row.className = "privacy-row";
            row.innerHTML = `
                <span>${contact.name}</span>
                <button class="${isBlocked ? 'danger-btn' : 'secondary-btn'}" style="padding:4px 10px; font-size:11px;" onclick="toggleStatusPrivacyForContact('${contact.uid}')">
                    ${isBlocked ? 'Unblock' : 'Block'}
                </button>
            `;
            statusPrivacyContactsList.appendChild(row);
        });
    });
}

function toggleStatusPrivacyForContact(targetUid) {
    if (currentUserStatusHiddenFrom.includes(targetUid)) {
        currentUserStatusHiddenFrom = currentUserStatusHiddenFrom.filter(id => id !== targetUid);
    } else {
        currentUserStatusHiddenFrom.push(targetUid);
    }

    db.collection("statuses").where("userId", "==", currentUser.uid).get().then((snap) => {
        snap.forEach(doc => {
            db.collection("statuses").doc(doc.id).update({ hiddenFrom: currentUserStatusHiddenFrom });
        });
        loadStatusPrivacyList();
    });
}

function postNewStatus() {
    readFileAsDataURLWithLimit(statusFileInput, 35, (base64Data) => {
        if (!base64Data) return;
        const file = statusFileInput.files[0];

        let amount = parseInt(statusDurationVal.value, 10) || 24;
        const unit = statusDurationUnit.value;
        let durationMs = unit === "hours" ? amount * 60 * 60 * 1000 : amount * 60 * 1000;
        const maxMs = 24 * 60 * 60 * 1000;
        if (durationMs > maxMs) durationMs = maxMs;

        const expiresAt = Date.now() + durationMs;

        db.collection("statuses").where("userId", "==", currentUser.uid).get().then((snap) => {
            snap.forEach(doc => db.collection("statuses").doc(doc.id).delete());

            db.collection("statuses").add({
                userId: currentUser.uid,
                userName: currentUser.name,
                mediaUrl: base64Data,
                mediaType: file.type,
                expiresAt: expiresAt,
                hiddenFrom: currentUserStatusHiddenFrom,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                alert("Status uploaded successfully!");
                statusFileInput.value = "";
                closeStatusModal();
            });
        });
    });
}

function openStatusViewer(contact, statusObj) {
    viewerUserName.innerText = contact.name;
    renderAvatarElement(viewerUserAvatar, contact.avatar);

    const minsLeft = Math.max(1, Math.round((statusObj.expiresAt - Date.now()) / 60000));
    viewerTimeLeft.innerText = minsLeft >= 60 ? `Expires in ${Math.round(minsLeft / 60)}h` : `Expires in ${minsLeft}m`;

    if (statusObj.mediaType && statusObj.mediaType.startsWith("video/")) {
        viewerMediaContainer.innerHTML = `<video src="${statusObj.mediaUrl}" controls autoplay></video>`;
    } else {
        viewerMediaContainer.innerHTML = `<img src="${statusObj.mediaUrl}" alt="Status">`;
    }

    statusViewerModal.classList.remove("hidden");
}

function closeStatusViewer() {
    viewerMediaContainer.innerHTML = "";
    statusViewerModal.classList.add("hidden");
}

function openAdminModal() {
    if (!currentUser || !currentUser.isAdmin) return;
    adminModal.classList.remove("hidden");
    loadAdminUsers();
}

function closeAdminModal() {
    adminModal.classList.add("hidden");
}

function loadAdminUsers() {
    adminUsersList.innerHTML = "<p style='text-align:center; color:var(--text-muted);'>Loading users...</p>";
    db.collection("users").get().then((snapshot) => {
        adminUsersList.innerHTML = "";
        if (snapshot.empty) {
            adminUsersList.innerHTML = "<p style='text-align:center; color:var(--text-muted);'>No registered users found.</p>";
            return;
        }

        snapshot.forEach((doc) => {
            const u = doc.data();
            const row = document.createElement("div");
            row.className = "privacy-row";

            const isInactive = u.status === "inactive";
            const nextStatus = isInactive ? "active" : "inactive";

            row.innerHTML = `
                <div>
                    <strong>${u.name}</strong> <span style="font-size:11px; color:var(--text-muted);">(${isInactive ? 'Inactive' : 'Active'})</span>
                </div>
                <div style="display:flex; gap:6px;">
                    <button class="${isInactive ? 'primary-btn' : 'secondary-btn'}" style="padding:4px 8px; font-size:11px;" onclick="toggleUserStatus('${u.uid}', '${nextStatus}')">
                        Set ${nextStatus.toUpperCase()}
                    </button>
                    <button class="danger-btn" style="padding:4px 8px; font-size:11px;" onclick="adminDeleteUser('${u.uid}')">Delete</button>
                </div>
            `;
            adminUsersList.appendChild(row);
        });
    });
}

function toggleUserStatus(uid, newStatus) {
    db.collection("users").doc(uid).update({ status: newStatus }).then(() => loadAdminUsers());
}

function adminDeleteUser(uid) {
    if (!confirm("Permanently delete this user account?")) return;
    db.collection("users").doc(uid).delete().then(() => loadAdminUsers());
}

function deleteAccount() {
    if (!confirm("Permanently delete your account?")) return;
    if (currentUser.isAdmin) return alert("Admin account cannot be deleted here.");
    const user = auth.currentUser;
    if (user) {
        db.collection("users").doc(currentUser.uid).delete().then(() => {
            user.delete().then(() => {
                alert("Account deleted.");
                location.reload();
            });
        }).catch((error) => alert(error.message));
    }
}

function openSettings() { 
    settingTheme.value = document.documentElement.getAttribute("data-theme") || "dark";
    settingsModal.classList.remove("hidden"); 
}
function closeSettings() { settingsModal.classList.add("hidden"); }

function updateSettings() {
    document.documentElement.setAttribute("data-theme", settingTheme.value);
    document.documentElement.style.setProperty("--accent", settingColor.value);
}

function saveAppSettings() {
    const newAvatar = AVATAR_OPTIONS[settingAvatarIndex] || currentUser.avatar;
    const newBio = settingBioInput.value.trim();

    currentUser.avatar = newAvatar;
    currentUser.bio = newBio;
    renderAvatarElement(userAvatarPreview, newAvatar);

    if (!currentUser.isAdmin) {
        db.collection("users").doc(currentUser.uid).update({
            avatar: newAvatar,
            bio: newBio
        }).then(() => {
            alert("Settings saved successfully!");
            closeSettings();
        }).catch(err => {
            alert("Error saving settings: " + err.message);
        });
    } else {
        alert("Settings saved!");
        closeSettings();
    }
}
