// ==========================================
// GOOGLE FIREBASE CLOUD SYNC & AUTH MANAGER
// Tự động kết nối Firebase Cloud Firestore & Authentication
// Lưu trữ tiến trình game miễn phí & đa thiết bị
// ==========================================

var FIREBASE_SYNC = (function () {
    var initialized = false;
    var auth = null;
    var db = null;
    var currentUser = null;
    var status = 'unconfigured'; // 'unconfigured' | 'ready' | 'connected' | 'error'
    var saveTimer = null;

    // Lấy config Firebase từ localStorage hoặc từ GAME_CONFIG.firebase
    function getActiveConfig() {
        var stored = null;
        try {
            var raw = localStorage.getItem('CAMPING_FIREBASE_CONFIG');
            if (raw) stored = JSON.parse(raw);
        } catch (e) {}
        if (stored && stored.apiKey && stored.projectId && stored.apiKey.trim().length > 10) {
            return stored;
        }
        var cfg = typeof GAME_CONFIG !== 'undefined' ? GAME_CONFIG.firebase : null;
        if (cfg && cfg.apiKey && cfg.apiKey.trim().length > 10 && cfg.projectId) {
            return cfg;
        }
        return null;
    }

    function isConfigValid() {
        return !!getActiveConfig();
    }

    // Tiện ích tự động bóc tách config khi người dùng dán nguyên đoạn mã từ Firebase Console
    function parseConfigString(text) {
        if (!text || typeof text !== 'string') return null;
        var clean = text.trim();
        // Nếu là JSON hợp lệ
        try {
            var parsed = JSON.parse(clean);
            if (parsed.apiKey && parsed.projectId) return parsed;
        } catch (e) {}

        // Trích xuất bằng regex các trường thông dụng
        function extractField(key) {
            var re = new RegExp('["\']?' + key + '["\']?\\s*:\\s*["\']([^"\']+)["\']', 'i');
            var match = clean.match(re);
            return match ? match[1].trim() : '';
        }

        var apiKey = extractField('apiKey');
        var projectId = extractField('projectId');
        if (apiKey && projectId) {
            return {
                apiKey: apiKey,
                authDomain: extractField('authDomain') || (projectId + '.firebaseapp.com'),
                projectId: projectId,
                storageBucket: extractField('storageBucket') || (projectId + '.appspot.com'),
                messagingSenderId: extractField('messagingSenderId'),
                appId: extractField('appId')
            };
        }
        return null;
    }

    function saveConfig(cfgOrStr) {
        var configObj = (typeof cfgOrStr === 'string') ? parseConfigString(cfgOrStr) : cfgOrStr;
        if (!configObj || !configObj.apiKey || !configObj.projectId) {
            return { success: false, message: 'Dữ liệu cấu hình không hợp lệ. Cần có ít nhất apiKey và projectId.' };
        }
        try {
            localStorage.setItem('CAMPING_FIREBASE_CONFIG', JSON.stringify(configObj));
            initialized = false;
            init();
            return { success: true, config: configObj };
        } catch (e) {
            return { success: false, message: e.message || 'Lỗi lưu trữ cấu hình' };
        }
    }

    function clearConfig() {
        try {
            localStorage.removeItem('CAMPING_FIREBASE_CONFIG');
            if (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.firebase) {
                GAME_CONFIG.firebase.apiKey = '';
                GAME_CONFIG.firebase.projectId = '';
            }
            if (auth) auth.signOut();
            initialized = false;
            auth = null;
            db = null;
            currentUser = null;
            status = 'unconfigured';
            return true;
        } catch (e) {
            return false;
        }
    }

    function init() {
        if (typeof firebase === 'undefined') {
            console.log('Firebase SDK not loaded, running in local fallback mode');
            status = 'unconfigured';
            return;
        }

        var activeCfg = getActiveConfig();
        if (!activeCfg) {
            console.log('Firebase config not filled yet. Ready for setup.');
            status = 'unconfigured';
            return;
        }

        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(activeCfg);
            } else if (!initialized) {
                // Đã có app cũ nhưng đổi config
                firebase.app().delete().then(function () {
                    firebase.initializeApp(activeCfg);
                }).catch(function () {});
            }
            auth = firebase.auth();
            db = firebase.firestore();
            initialized = true;
            status = 'ready';
            console.log('🔥 Firebase Cloud Sync initialized successfully for project:', activeCfg.projectId);

            // Bắt kết quả đăng nhập sau khi redirect trên điện thoại
            if (auth.getRedirectResult) {
                auth.getRedirectResult().then(function (result) {
                    if (result && result.user) {
                        var user = result.user;
                        currentUser = user;
                        SAVE.googleUser = {
                            uid: user.uid,
                            email: user.email || '',
                            name: user.displayName || user.email.split('@')[0],
                            picture: user.photoURL || 'assets/images/ui/character01.png',
                            provider: 'firebase',
                            lastSynced: Date.now()
                        };
                        saveGame();
                        console.log('🎉 Đăng nhập Google thành công qua Redirect:', user.email);
                        checkAndSyncCloudData(user);
                        if (typeof showToast === 'function') {
                            showToast('🎉 Đăng nhập Google thành công: ' + (user.displayName || user.email), '#2e7d32');
                        }
                    }
                }).catch(function (err) {
                    if (err && err.code && err.code !== 'auth/null-user') {
                        console.warn('Redirect sign-in notice:', err);
                    }
                });
            }

            // Lắng nghe thay đổi trạng thái đăng nhập
            auth.onAuthStateChanged(function (user) {
                if (user) {
                    currentUser = user;
                    status = 'connected';
                    SAVE.googleUser = {
                        uid: user.uid,
                        email: user.email || '',
                        name: user.displayName || user.email.split('@')[0],
                        picture: user.photoURL || 'assets/images/ui/character01.png',
                        provider: 'firebase',
                        lastSynced: Date.now()
                    };
                    saveGame();
                    console.log('🔥 Firebase user active:', user.email);

                    // Tự động kiểm tra bản lưu đám mây
                    checkAndSyncCloudData(user);
                } else {
                    currentUser = null;
                    if (status === 'connected') status = 'ready';
                }
            });
        } catch (e) {
            console.error('Firebase initialization error:', e);
            status = 'error';
        }
    }

    // Tự động kiểm tra bản lưu trên Firestore khi vừa đăng nhập
    function checkAndSyncCloudData(user, onComplete) {
        if (!db || !user) return;
        var docRef = db.collection('camping_saves').doc(user.uid);
        docRef.get().then(function (doc) {
            if (doc.exists) {
                var cloudPayload = doc.data();
                var cloudSave = cloudPayload ? cloudPayload.saveData : null;
                if (cloudSave) {
                    // So sánh tiến trình giữa máy và đám mây
                    var localLv = (SAVE && SAVE.level) || 1;
                    var cloudLv = cloudSave.level || 1;
                    var localStars = (SAVE && SAVE.stars) ? Object.keys(SAVE.stars).length : 0;
                    var cloudStars = cloudSave.stars ? Object.keys(cloudSave.stars).length : 0;

                    if (cloudLv > localLv || (cloudLv === localLv && cloudStars >= localStars)) {
                        console.log('Loading higher progress from Firebase Firestore...');
                        SAVE = Object.assign(defaultSave(), cloudSave);
                        SAVE.googleUser = {
                            uid: user.uid,
                            email: user.email || '',
                            name: user.displayName || user.email.split('@')[0],
                            picture: user.photoURL || 'assets/images/ui/character01.png',
                            provider: 'firebase',
                            lastSynced: Date.now()
                        };
                        try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) {}
                        if (typeof window.loadLevel === 'function') {
                            window.loadLevel(SAVE.level || 1, { restoreState: true });
                        }
                    } else {
                        // Máy hiện tại có tiến trình mới hơn -> cập nhật lên Firestore
                        saveToFirestore(SAVE, user);
                    }
                }
            } else {
                // Lần đầu đăng nhập trên tài khoản này -> lưu tiến trình hiện tại lên Firestore
                saveToFirestore(SAVE, user);
            }
            if (onComplete) onComplete(true);
        }).catch(function (err) {
            console.warn('Firestore fetch notice:', err);
            if (onComplete) onComplete(false, err);
        });
    }

    // Lưu dữ liệu vào Cloud Firestore
    function saveToFirestore(saveData, customUser, callback) {
        var user = customUser || currentUser || (auth && auth.currentUser);
        if (!db || !user) {
            if (callback) callback(false, 'No user logged in');
            return false;
        }

        var docRef = db.collection('camping_saves').doc(user.uid);
        var payload = {
            version: 1,
            savedAt: Date.now(),
            playerId: (SAVE && SAVE.playerId) || 'CAMP-DEFAULT',
            user: {
                uid: user.uid,
                email: user.email,
                name: user.displayName
            },
            saveData: JSON.parse(JSON.stringify(saveData || SAVE))
        };

        docRef.set(payload, { merge: true }).then(function () {
            console.log('☁️ Saved to Firebase Firestore successfully at', new Date().toLocaleTimeString());
            if (SAVE.googleUser) {
                SAVE.googleUser.lastSynced = Date.now();
                try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) {}
            }
            if (callback) callback(true);
        }).catch(function (err) {
            console.error('Firestore save error:', err);
            if (callback) callback(false, err);
        });
        return true;
    }

    // Tự động lưu có debounce (tránh gọi Firestore liên tục khi người chơi di chuyển ô)
    function debouncedSave(delayMs) {
        if (!initialized || !db || !currentUser) return;
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(function () {
            saveToFirestore(SAVE);
        }, delayMs || 1500);
    }

    // Tải dữ liệu từ Cloud Firestore
    function loadFromFirestore(callback) {
        var user = currentUser || (auth && auth.currentUser);
        if (!db || !user) {
            if (callback) callback(false, 'No user logged in');
            return;
        }

        var docRef = db.collection('camping_saves').doc(user.uid);
        docRef.get().then(function (doc) {
            if (doc.exists) {
                var data = doc.data();
                if (callback) callback(true, data ? data.saveData : null);
            } else {
                if (callback) callback(false, 'Document not found');
            }
        }).catch(function (err) {
            if (callback) callback(false, err);
        });
    }

    function isNativePlatform() {
        return typeof window.Capacitor !== 'undefined' &&
               typeof window.Capacitor.isNativePlatform === 'function' &&
               window.Capacitor.isNativePlatform();
    }

    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // Đăng nhập Google:
    // 1. Trên Android APK: Dùng Native Google Sign-In (hiện hộp thoại chọn tài khoản Google gốc của Android, không mở web)
    // 2. Trên Web Desktop: Dùng Popup trực quan
    // 3. Trên Web Mobile: Dùng Redirect
    function signInWithGoogle(onSuccess, onError) {
        if (!initialized || !auth) {
            if (onError) onError('Firebase is not configured yet');
            return;
        }

        // --- TRƯỜNG HỢP 1: Chạy trong ứng dụng Android APK (Native Capacitor) ---
        if (isNativePlatform()) {
            var fbAuthPlugin = (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.FirebaseAuthentication);
            if (!fbAuthPlugin && window.Capacitor && typeof window.Capacitor.registerPlugin === 'function') {
                try {
                    fbAuthPlugin = window.Capacitor.registerPlugin('FirebaseAuthentication');
                } catch (e) {
                    console.warn('Could not register FirebaseAuthentication:', e);
                }
            }

            if (!fbAuthPlugin || typeof fbAuthPlugin.signInWithGoogle !== 'function') {
                console.error('Native FirebaseAuthentication plugin is missing');
                if (onError) onError('Không tìm thấy plugin Google Sign-In native trên APK. Vui lòng build lại dự án trong Android Studio.');
                return;
            }

            console.log('📱 Gọi hộp thoại Google gốc của Android qua FirebaseAuthentication plugin...');
            fbAuthPlugin.signInWithGoogle().then(function (result) {
                console.log('Native Google Sign-In result:', result);
                var nativeUser = result.user || {};
                var cred = result.credential || {};

                function handleSignedInUser(userObj) {
                    currentUser = userObj;
                    SAVE.googleUser = {
                        uid: userObj.uid,
                        email: userObj.email || '',
                        name: userObj.displayName || (userObj.email ? userObj.email.split('@')[0] : 'Người chơi Google'),
                        picture: userObj.photoUrl || userObj.photoURL || 'assets/images/ui/character01.png',
                        provider: 'firebase',
                        lastSynced: Date.now()
                    };
                    saveGame();
                    checkAndSyncCloudData(userObj, function () {
                        if (onSuccess) onSuccess(userObj);
                    });
                }

                // Nếu nhận được idToken từ Android Google Play Services, đăng nhập tiếp vào Web SDK để kích hoạt Firestore
                if (cred.idToken && firebase.auth && firebase.auth.GoogleAuthProvider) {
                    var authCredential = firebase.auth.GoogleAuthProvider.credential(cred.idToken);
                    auth.signInWithCredential(authCredential).then(function (authRes) {
                        handleSignedInUser(authRes.user || nativeUser);
                    }).catch(function (authErr) {
                        console.warn('Web SDK sign-in credential notice:', authErr);
                        handleSignedInUser(nativeUser);
                    });
                } else {
                    handleSignedInUser(nativeUser);
                }
            }).catch(function (error) {
                console.error('Native Google Sign-In error:', error);
                var errStr = String((error && (error.message || error.code || error)) || '');
                if (errStr.indexOf('10') !== -1 || errStr.indexOf('DEVELOPER_ERROR') !== -1) {
                    if (onError) onError('Lỗi Google 10 (Developer Error): Cần thêm mã SHA-1 vào Firebase Console và tải lại google-services.json vào android/app/');
                } else if (errStr.indexOf('16') !== -1 || errStr.indexOf('canceled') !== -1 || errStr.indexOf('CANCELED') !== -1) {
                    if (onError) onError({ code: 'auth/popup-closed-by-user', message: 'Bạn đã đóng hộp thoại Google.' });
                } else {
                    if (onError) onError(error);
                }
            });
            return;
        }

        // --- TRƯỜNG HỢP 2: Chạy trên trình duyệt Web (Desktop / Mobile browser) ---
        var provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        if (isMobileDevice()) {
            saveGame();
            auth.signInWithRedirect(provider).catch(function (error) {
                console.error('Firebase Google redirect error:', error);
                if (onError) onError(error);
            });
        } else {
            auth.signInWithPopup(provider).then(function (result) {
                var user = result.user;
                currentUser = user;
                SAVE.googleUser = {
                    uid: user.uid,
                    email: user.email || '',
                    name: user.displayName || user.email.split('@')[0],
                    picture: user.photoURL || 'assets/images/ui/character01.png',
                    provider: 'firebase',
                    lastSynced: Date.now()
                };
                saveGame();

                checkAndSyncCloudData(user, function () {
                    if (onSuccess) onSuccess(user);
                });
            }).catch(function (error) {
                console.error('Firebase Google sign-in error:', error);
                if (error && error.code === 'auth/popup-blocked') {
                    auth.signInWithRedirect(provider).catch(function (e) {
                        if (onError) onError(e);
                    });
                } else if (onError) {
                    onError(error);
                }
            });
        }
    }

    // Đăng xuất Firebase
    function signOut(onComplete) {
        if (isNativePlatform() && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.FirebaseAuthentication) {
            window.Capacitor.Plugins.FirebaseAuthentication.signOut().catch(function () {});
        }
        if (auth) {
            auth.signOut().then(function () {
                currentUser = null;
                SAVE.googleUser = null;
                saveGame();
                if (onComplete) onComplete(true);
            }).catch(function (err) {
                SAVE.googleUser = null;
                saveGame();
                if (onComplete) onComplete(false, err);
            });
        } else {
            SAVE.googleUser = null;
            saveGame();
            if (onComplete) onComplete(true);
        }
    }

    // Đổi và xác nhận quyền sở hữu ID người chơi trên Cloud Firestore
    function claimPlayerId(newId, oldId, callback) {
        var cleanId = (newId || '').trim().toUpperCase();
        if (!cleanId) {
            if (callback) callback(false, 'ID không được để trống');
            return;
        }

        if (!initialized || !db) {
            // Chế độ ngoại tuyến hoặc chưa cấu hình Firebase
            if (callback) callback(true, cleanId);
            return;
        }

        var uid = currentUser ? currentUser.uid : (SAVE.playerId || 'anonymous');
        var docRef = db.collection('player_names').doc(cleanId);

        var hasResolved = false;
        var timer = setTimeout(function () {
            if (!hasResolved) {
                hasResolved = true;
                if (callback) callback(true, cleanId);
            }
        }, 3500);

        function safeDone(success, msg) {
            if (hasResolved) return;
            hasResolved = true;
            clearTimeout(timer);
            if (callback) callback(success, msg);
        }

        docRef.get().then(function (doc) {
            if (doc.exists) {
                var data = doc.data();
                if (data && data.uid && data.uid !== uid) {
                    // ID này đã được một người chơi khác đăng ký
                    safeDone(false, 'ID "' + cleanId + '" đã có người sử dụng. Vui lòng chọn tên khác!');
                    return;
                }
            }

            // Ghi nhận ID mới này thuộc về tài khoản hiện tại
            docRef.set({
                uid: uid,
                playerId: cleanId,
                email: currentUser ? currentUser.email : '',
                updatedAt: Date.now()
            }, { merge: true }).then(function () {
                // Nếu đổi từ ID cũ khác, xóa bản ghi ID cũ
                var cleanOld = (oldId || '').trim().toUpperCase();
                if (cleanOld && cleanOld !== cleanId) {
                    db.collection('player_names').doc(cleanOld).delete().catch(function () {});
                }
                safeDone(true, cleanId);
            }).catch(function (err) {
                console.warn('Firestore claimPlayerId notice:', err);
                safeDone(true, cleanId);
            });
        }).catch(function (err) {
            console.warn('Firestore check error:', err);
            safeDone(true, cleanId);
        });
    }

    return {
        init: init,
        isConfigured: isConfigValid,
        getActiveConfig: getActiveConfig,
        parseConfigString: parseConfigString,
        saveConfig: saveConfig,
        clearConfig: clearConfig,
        getStatus: function () { return status; },
        getCurrentUser: function () { return currentUser; },
        loginWithGoogle: signInWithGoogle,
        save: saveToFirestore,
        debouncedSave: debouncedSave,
        load: loadFromFirestore,
        claimPlayerId: claimPlayerId,
        logout: signOut
    };
})();

// Khởi tạo Firebase khi trang đã nạp xong
if (typeof window !== 'undefined') {
    window.FIREBASE_SYNC = FIREBASE_SYNC;
    window.addEventListener('DOMContentLoaded', function () {
        FIREBASE_SYNC.init();
    });
}
