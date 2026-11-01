(function () {
    'use strict';

    var CFG = window.FG_ACADEMY_CONFIG || {};
    var ADMIN_EMAIL = (CFG.ADMIN_EMAIL || 'info@francescagrandi.it').toLowerCase();
    var STORAGE_KEY = 'fg_academy_db_v1';
    var SESSION_KEY = 'fg_academy_session_v1';

    var CATEGORIES = [
        'Consapevolezza personale',
        'Autostima e fiducia in sé',
        'Perfezionismo',
        'Procrastinazione',
        'Paura del giudizio',
        'Gestione dei blocchi mentali',
        'Obiettivi e cambiamento'
    ];

    var RESOURCE_TYPES = [
        'PDF',
        'Guide pratiche',
        'Schede di esercizi',
        'Materiali di approfondimento',
        'Video YouTube',
        'Video introduttivi'
    ];

    // =========================================================================
    // 1. UTILITÀ SICUREZZA E HASHING PASSWORD (PBKDF2-SHA256 via WebCrypto)
    // =========================================================================
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function uid() {
        if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
        return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
    }

    function bytesToHex(buf) {
        return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    }

    function hexToBytes(hex) {
        var bytes = new Uint8Array(hex.length / 2);
        for (var i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
        }
        return bytes;
    }

    async function hashPassword(password, saltHex) {
        var salt = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16));
        var enc = new TextEncoder();
        var keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
        var bits = await crypto.subtle.deriveBits(
            { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
            keyMaterial,
            256
        );
        return { salt: bytesToHex(salt), hash: bytesToHex(bits) };
    }

    async function verifyPassword(password, saltHex, expectedHash) {
        var res = await hashPassword(password, saltHex);
        return res.hash === expectedHash;
    }

    function formatDate(iso) {
        try {
            return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
        } catch (e) {
            return '';
        }
    }

    function formatDateTime(iso) {
        try {
            return new Date(iso).toLocaleString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '';
        }
    }

    function toast(msg) {
        var root = document.getElementById('toast-root');
        if (!root) return;
        var el = document.createElement('div');
        el.className = 'toast';
        el.textContent = msg;
        root.appendChild(el);
        setTimeout(function () { el.remove(); }, 3200);
    }

    // =========================================================================
    // 2. DATABASE PERSISTENTE & REGOLE DI AUTORIZZAZIONE LATO SERVER/API
    // =========================================================================
    function defaultDB() {
        var now = new Date().toISOString();
        return {
            users: [],
            weeklyPrompt: {
                text: 'Qual è una cosa che continui a rimandare, anche se sai quanto sia importante per te?',
                updatedAt: now
            },
            posts: [
                {
                    id: 'post-welcome-draft',
                    authorName: 'Francesca Grandi',
                    authorRole: 'Mental Coach • Fondatrice',
                    authorPhoto: '../francesca-grandi.jpg',
                    title: 'Benvenuto in F.G. Academy!',
                    body: 'Prima di iniziare, mi piacerebbe conoscerti.\n\nQuesto è uno spazio in cui possiamo confrontarci, condividere esperienze e riflettere insieme sulle difficoltà che incontriamo nella vita quotidiana.\n\nTi faccio una domanda:\n\nSe potessi iniziare a cambiare una sola cosa della tua vita, quale sarebbe?\n\nSe ti va, raccontamelo nei commenti.',
                    imageUrl: '',
                    pinned: true,
                    status: 'draft',
                    likes: [],
                    saves: [],
                    createdAt: now,
                    updatedAt: now
                }
            ],
            comments: [],
            reports: [],
            events: [],
            resources: [],
            courses: [
                {
                    id: 'course-premium-protagonist',
                    title: 'Diventa il Protagonista — Percorso Completo',
                    description: 'Percorso strutturato per superare perfezionismo, paura del giudizio e procrastinazione, trasformando la chiarezza in azioni concrete.',
                    coverUrl: '',
                    tier: 'premium',
                    status: 'coming_soon',
                    modules: [
                        {
                            title: 'Modulo 1 — Fare chiarezza e definire il tuo obiettivo',
                            lessons: [
                                { id: 'l1', title: 'Riconoscere dove ti trovi oggi', tier: 'premium', contentUrl: 'protected://modulo-1-lezione-1' }
                            ]
                        }
                    ],
                    createdAt: now
                }
            ],
            notifications: []
        };
    }

    function loadDB() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                var init = defaultDB();
                localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
                return init;
            }
            var parsed = JSON.parse(raw);
            return Object.assign(defaultDB(), parsed);
        } catch (e) {
            return defaultDB();
        }
    }

    function saveDB(db) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    }

    function getSessionUser() {
        try {
            var tokenRaw = localStorage.getItem(SESSION_KEY);
            if (!tokenRaw) return null;
            var sess = JSON.parse(tokenRaw);
            var db = loadDB();
            var u = db.users.find(function (x) { return x.id === sess.userId && x.sessionToken === sess.token; });
            if (!u || u.suspended) return null;
            if (u.role !== 'admin' && u.approvalStatus !== 'approved') return null;
            return u;
        } catch (e) {
            return null;
        }
    }

    function isAdminUser(u) {
        return Boolean(u && u.role === 'admin' && u.email.toLowerCase() === ADMIN_EMAIL);
    }

    // Controlli autorizzativi rigorosi (applicati prima di qualsiasi mutazione)
    function requireAuth() {
        var u = getSessionUser();
        if (!u) throw new Error('401 Unauthorized: effettua l\'accesso per continuare.');
        return u;
    }

    function requireAdmin() {
        var u = requireAuth();
        if (!isAdminUser(u)) {
            throw new Error('403 Forbidden: solo l\'amministratrice Francesca Grandi può eseguire questa operazione.');
        }
        return u;
    }

    function pushNotification(db, type, message, targetView) {
        db.notifications.unshift({
            id: uid(),
            type: type,
            message: message,
            targetView: targetView || 'home',
            readBy: [],
            createdAt: new Date().toISOString()
        });
    }

    // Esponiamo l'API protetta anche su window.FGAcademyAPI per verifiche e test
    var API = {
        getCurrentUser: function () {
            var u = getSessionUser();
            if (!u) return null;
            return {
                id: u.id,
                firstName: u.firstName,
                lastName: u.lastName,
                email: u.email,
                bio: u.bio || '',
                avatarUrl: u.avatarUrl || '',
                role: u.role,
                emailVerified: u.emailVerified,
                marketingConsent: Boolean(u.marketingConsent),
                notifications: u.notifications || { posts: true, replies: true, events: true, resources: true, admin: true }
            };
        },

        register: async function (payload) {
            var firstName = String(payload.firstName || '').trim();
            var lastName = String(payload.lastName || '').trim();
            var email = String(payload.email || '').trim().toLowerCase();
            var password = String(payload.password || '');
            var confirmPassword = String(payload.confirmPassword || '');
            var privacyAccepted = Boolean(payload.privacyAccepted);
            var marketingConsent = Boolean(payload.marketingConsent);

            if (firstName.length < 2) throw new Error('Inserisci il tuo nome (almeno 2 caratteri).');
            if (lastName.length < 2) throw new Error('Inserisci il tuo cognome (almeno 2 caratteri).');
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error('Inserisci un indirizzo email valido.');
            if (password.length < 8) throw new Error('La password deve contenere almeno 8 caratteri.');
            if (password !== confirmPassword) throw new Error('Le due password non coincidono.');
            if (!privacyAccepted) throw new Error('Devi accettare l\'informativa privacy e i termini per registrarti.');

            var db = loadDB();
            if (db.users.some(function (u) { return u.email === email; })) {
                throw new Error('Esiste già un account registrato con questa email. Effettua il login.');
            }

            var secured = await hashPassword(password);
            var role = email === ADMIN_EMAIL ? 'admin' : 'member';
            var approvalStatus = role === 'admin' ? 'approved' : 'pending';
            var verifyToken = uid();
            var sessionToken = role === 'admin' ? uid() : null;
            var now = new Date().toISOString();

            var newUser = {
                id: uid(),
                firstName: firstName,
                lastName: lastName,
                email: email,
                passwordHash: secured.hash,
                passwordSalt: secured.salt,
                bio: '',
                avatarUrl: role === 'admin' ? '../francesca-grandi.jpg' : '',
                role: role,
                approvalStatus: approvalStatus,
                suspended: false,
                emailVerified: role === 'admin',
                verifyToken: verifyToken,
                resetToken: null,
                sessionToken: sessionToken,
                privacyAcceptedAt: now,
                marketingConsent: marketingConsent,
                notifications: {
                    posts: true,
                    replies: true,
                    events: true,
                    resources: true,
                    admin: true
                },
                createdAt: now,
                updatedAt: now
            };

            db.users.push(newUser);
            if (role !== 'admin') {
                pushNotification(db, 'admin', 'Nuova richiesta di accesso a F.G. Academy da ' + firstName + ' ' + lastName + ' (' + email + ')', 'admin');
                if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                    try {
                        fetch('https://api.web3forms.com/submit', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                            body: JSON.stringify({
                                access_key: CFG.WEB3FORMS_KEY || 'eafc21eb-6115-41ca-b86d-e1d693fabb91',
                                subject: '[F.G. Academy] Nuova richiesta di accesso da ' + firstName + ' ' + lastName,
                                from_name: firstName + ' ' + lastName,
                                email: email,
                                message: 'Nuova richiesta di iscrizione a F.G. Academy.\nNome: ' + firstName + ' ' + lastName + '\nEmail: ' + email + '\nAccedi al Pannello Admin di F.G. Academy per confermare l\'accesso.'
                            })
                        }).catch(function () {});
                    } catch (e) {}
                }
            }
            saveDB(db);
            if (role === 'admin') {
                localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: newUser.id, token: sessionToken }));
                return { user: API.getCurrentUser(), verifyToken: verifyToken, pendingApproval: false };
            }
            return { user: null, pendingApproval: true, firstName: firstName, email: email };
        },

        verifyEmail: function (token) {
            var db = loadDB();
            var u = db.users.find(function (x) { return x.verifyToken === token; });
            if (!u) throw new Error('Codice di verifica non valido.');
            u.emailVerified = true;
            u.verifyToken = null;
            u.updatedAt = new Date().toISOString();
            saveDB(db);
            return true;
        },

        login: async function (emailInput, passwordInput) {
            var email = String(emailInput || '').trim().toLowerCase();
            var password = String(passwordInput || '');
            var db = loadDB();
            var u = db.users.find(function (x) { return x.email === email; });
            if (!u) throw new Error('Credenziali non valide. Verifica email e password.');
            if (u.suspended) throw new Error('Questo account è stato sospeso dall\'amministratrice.');

            var ok = await verifyPassword(password, u.passwordSalt, u.passwordHash);
            if (!ok) throw new Error('Credenziali non valide. Verifica email e password.');

            u.role = u.email === ADMIN_EMAIL ? 'admin' : 'member';
            if (u.role === 'admin') {
                u.approvalStatus = 'approved';
            } else {
                if (u.approvalStatus === 'rejected') {
                    throw new Error('La tua richiesta di accesso a F.G. Academy non è stata approvata.');
                }
                if (u.approvalStatus !== 'approved') {
                    var pendErr = new Error('Il tuo accesso è in attesa di conferma da parte di Francesca Grandi.');
                    pendErr.pendingApproval = true;
                    pendErr.firstName = u.firstName;
                    pendErr.email = u.email;
                    throw pendErr;
                }
            }

            u.sessionToken = uid();
            saveDB(db);
            localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: u.id, token: u.sessionToken }));
            return API.getCurrentUser();
        },

        approveUser: function (userId) {
            requireAdmin();
            var db = loadDB();
            var target = db.users.find(function (x) { return x.id === userId; });
            if (!target) throw new Error('Utente non trovato.');
            target.approvalStatus = 'approved';
            target.emailVerified = true;
            target.updatedAt = new Date().toISOString();
            saveDB(db);
            return target;
        },

        rejectUser: function (userId) {
            requireAdmin();
            var db = loadDB();
            var target = db.users.find(function (x) { return x.id === userId; });
            if (!target) throw new Error('Utente non trovato.');
            target.approvalStatus = 'rejected';
            target.sessionToken = null;
            target.updatedAt = new Date().toISOString();
            saveDB(db);
            return target;
        },

        logout: function () {
            var u = getSessionUser();
            if (u) {
                var db = loadDB();
                var found = db.users.find(function (x) { return x.id === u.id; });
                if (found) found.sessionToken = null;
                saveDB(db);
            }
            localStorage.removeItem(SESSION_KEY);
        },

        requestPasswordReset: function (emailInput) {
            var email = String(emailInput || '').trim().toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error('Inserisci un\'email valida.');
            var db = loadDB();
            var u = db.users.find(function (x) { return x.email === email; });
            var token = uid().slice(0, 8).toUpperCase();
            if (u) {
                u.resetToken = token;
                saveDB(db);
            }
            return { resetToken: u ? token : null };
        },

        confirmPasswordReset: async function (emailInput, tokenInput, newPassword) {
            var email = String(emailInput || '').trim().toLowerCase();
            var token = String(tokenInput || '').trim().toUpperCase();
            if (String(newPassword || '').length < 8) throw new Error('La nuova password deve avere almeno 8 caratteri.');
            var db = loadDB();
            var u = db.users.find(function (x) { return x.email === email && x.resetToken && x.resetToken === token; });
            if (!u) throw new Error('Codice di recupero non valido o scaduto.');
            var secured = await hashPassword(newPassword);
            u.passwordHash = secured.hash;
            u.passwordSalt = secured.salt;
            u.resetToken = null;
            saveDB(db);
            return true;
        },

        // COMMUNITY POSTS (SOLO ADMIN CREA/MODIFICA/ELIMINA/APPROVA)
        createPost: function (data) {
            var admin = requireAdmin();
            var title = String(data.title || '').trim();
            var body = String(data.body || '').trim();
            var imageUrl = String(data.imageUrl || '').trim();
            var status = data.status === 'draft' ? 'draft' : 'published';
            if (body.length < 2) throw new Error('Inserisci il testo della discussione.');

            var db = loadDB();
            var now = new Date().toISOString();
            var post = {
                id: uid(),
                authorId: admin.id,
                authorName: 'Francesca Grandi',
                authorRole: 'Mental Coach • Fondatrice',
                authorPhoto: admin.avatarUrl || '../francesca-grandi.jpg',
                title: title,
                body: body,
                imageUrl: imageUrl,
                pinned: Boolean(data.pinned),
                status: status,
                likes: [],
                saves: [],
                createdAt: now,
                updatedAt: now
            };
            db.posts.unshift(post);
            if (status === 'published') {
                pushNotification(db, 'posts', 'Nuova discussione nella community: ' + (title || body.slice(0, 45) + '…'), 'community');
            }
            saveDB(db);
            return post;
        },

        updatePost: function (postId, updates) {
            requireAdmin();
            var db = loadDB();
            var p = db.posts.find(function (x) { return x.id === postId; });
            if (!p) throw new Error('Discussione non trovata.');
            var wasDraft = p.status === 'draft';
            if (updates.title !== undefined) p.title = String(updates.title).trim();
            if (updates.body !== undefined) {
                if (String(updates.body).trim().length < 2) throw new Error('Il testo non può essere vuoto.');
                p.body = String(updates.body).trim();
            }
            if (updates.imageUrl !== undefined) p.imageUrl = String(updates.imageUrl).trim();
            if (updates.pinned !== undefined) p.pinned = Boolean(updates.pinned);
            if (updates.status !== undefined) p.status = updates.status === 'draft' ? 'draft' : 'published';
            p.updatedAt = new Date().toISOString();
            if (wasDraft && p.status === 'published') {
                pushNotification(db, 'posts', 'Nuova discussione pubblicata: ' + (p.title || 'Benvenuto in F.G. Academy!'), 'community');
            }
            saveDB(db);
            return p;
        },

        deletePost: function (postId) {
            requireAdmin();
            var db = loadDB();
            db.posts = db.posts.filter(function (x) { return x.id !== postId; });
            db.comments = db.comments.filter(function (c) { return c.postId !== postId; });
            saveDB(db);
            return true;
        },

        addComment: function (postId, bodyText, parentId) {
            var u = requireAuth();
            var body = String(bodyText || '').trim();
            if (!body) throw new Error('Scrivi un commento prima di inviare.');
            var db = loadDB();
            var post = db.posts.find(function (p) { return p.id === postId && (p.status === 'published' || isAdminUser(u)); });
            if (!post) throw new Error('Discussione non disponibile.');

            var comment = {
                id: uid(),
                postId: postId,
                parentId: parentId || null,
                userId: u.id,
                authorName: u.firstName + ' ' + u.lastName,
                authorRole: isAdminUser(u) ? 'Mental Coach • Fondatrice' : 'Iscritto/a',
                authorAvatar: u.avatarUrl || '',
                isAdminAuthor: isAdminUser(u),
                body: body,
                likes: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            db.comments.push(comment);
            if (parentId) {
                pushNotification(db, 'replies', u.firstName + ' ha risposto a un commento nella community.', 'community');
            }
            saveDB(db);
            return comment;
        },

        updateComment: function (commentId, newBody) {
            var u = requireAuth();
            var body = String(newBody || '').trim();
            if (!body) throw new Error('Il commento non può essere vuoto.');
            var db = loadDB();
            var c = db.comments.find(function (x) { return x.id === commentId; });
            if (!c) throw new Error('Commento non trovato.');
            if (c.userId !== u.id && !isAdminUser(u)) {
                throw new Error('403 Forbidden: puoi modificare solo i tuoi commenti.');
            }
            c.body = body;
            c.updatedAt = new Date().toISOString();
            saveDB(db);
            return c;
        },

        deleteComment: function (commentId) {
            var u = requireAuth();
            var db = loadDB();
            var c = db.comments.find(function (x) { return x.id === commentId; });
            if (!c) throw new Error('Commento non trovato.');
            if (c.userId !== u.id && !isAdminUser(u)) {
                throw new Error('403 Forbidden: puoi eliminare solo i tuoi commenti.');
            }
            db.comments = db.comments.filter(function (x) { return x.id !== commentId && x.parentId !== commentId; });
            saveDB(db);
            return true;
        },

        accessCourseLesson: function (courseId, lessonId) {
            var u = requireAuth();
            var db = loadDB();
            var course = db.courses.find(function (c) { return c.id === courseId; });
            if (!course) throw new Error('Percorso non trovato.');
            if (course.tier === 'premium' && !isAdminUser(u)) {
                throw new Error('403 Forbidden: Questo percorso sarà disponibile prossimamente. Contenuto premium riservato.');
            }
            return { allowed: true };
        }
    };

    window.FGAcademyAPI = API;

    // =========================================================================
    // 3. STATO INTERFACCIA E ICONE
    // =========================================================================
    var state = {
        view: 'home',
        authTab: 'login',
        communityFilter: 'all',
        communitySort: 'newest',
        selectedPostId: null,
        replyToCommentId: null,
        editingCommentId: null,
        resourceCategory: 'all',
        resourceType: 'all',
        notifOpen: false,
        sidebarOpen: false,
        pendingVerifyToken: null,
        lastResetCode: null
    };

    var ICONS = {
        home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z"/></svg>',
        community: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
        eventi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
        risorse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
        percorsi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
        profilo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
        admin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
        logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
        bell: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
        lock: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
    };

    function renderLogoHTML() {
        return (
            '<div class="fg-logo">' +
                '<span class="fg-monogram">F<span>.</span>G<span>.</span></span>' +
                '<span class="fg-brand-text">' +
                    '<span class="fg-brand-title">F.G. Academy</span>' +
                    '<span class="fg-brand-sub">Mental Coach</span>' +
                '</span>' +
            '</div>'
        );
    }

    function renderAvatar(u, sizeClass) {
        var cls = 'avatar' + (sizeClass ? ' ' + sizeClass : '');
        if (u && u.avatarUrl) {
            return '<img class="' + cls + '" src="' + esc(u.avatarUrl) + '" alt="' + esc((u.firstName || '') + ' ' + (u.lastName || '')) + '">';
        }
        var ini = ((u && u.firstName ? u.firstName[0] : 'F') + (u && u.lastName ? u.lastName[0] : 'G')).toUpperCase();
        return '<span class="' + cls + '" aria-hidden="true">' + esc(ini) + '</span>';
    }

    function computeProfileCompletion(u) {
        var score = 0;
        if (u.firstName && u.lastName) score += 25;
        if (u.emailVerified) score += 25;
        if (u.bio && u.bio.trim().length >= 10) score += 25;
        if (u.avatarUrl && u.avatarUrl.trim().length > 0) score += 25;
        return score;
    }

    // =========================================================================
    // 4. SCHERMATA DI ACCESSO / REGISTRAZIONE / RECUPERO PASSWORD
    // =========================================================================
    function renderAuthScreen(msgObj) {
        var app = document.getElementById('app');
        var tab = state.authTab;
        var alertHTML = msgObj
            ? '<div class="form-msg ' + esc(msgObj.type || 'error') + '" role="alert">' + esc(msgObj.text) + '</div>'
            : '';

        var bodyHTML = '';
        if (tab === 'login') {
            bodyHTML =
                '<form id="login-form" novalidate>' +
                    '<div class="form-group">' +
                        '<label for="login-email">Email <span class="req">*</span></label>' +
                        '<input type="email" id="login-email" class="input" placeholder="latua@email.it" required autocomplete="email">' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label for="login-password">Password <span class="req">*</span></label>' +
                        '<input type="password" id="login-password" class="input" placeholder="Inserisci la tua password" required autocomplete="current-password">' +
                    '</div>' +
                    '<div style="display:flex;justify-content:flex-end;margin-bottom:1.1rem;">' +
                        '<button type="button" class="link-btn" id="goto-reset-btn">Hai dimenticato la password?</button>' +
                    '</div>' +
                    '<button type="submit" class="btn btn-primary btn-block">ACCEDI ALL\'ACADEMY</button>' +
                '</form>';
        } else if (tab === 'register') {
            bodyHTML =
                '<form id="register-form" novalidate>' +
                    '<div class="form-row-2">' +
                        '<div class="form-group">' +
                            '<label for="reg-nome">Nome <span class="req">*</span></label>' +
                            '<input type="text" id="reg-nome" class="input" placeholder="Nome" required autocomplete="given-name">' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label for="reg-cognome">Cognome <span class="req">*</span></label>' +
                            '<input type="text" id="reg-cognome" class="input" placeholder="Cognome" required autocomplete="family-name">' +
                        '</div>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label for="reg-email">Email <span class="req">*</span></label>' +
                        '<input type="email" id="reg-email" class="input" placeholder="latua@email.it" required autocomplete="email">' +
                    '</div>' +
                    '<div class="form-row-2">' +
                        '<div class="form-group">' +
                            '<label for="reg-pass">Password <span class="req">*</span></label>' +
                            '<input type="password" id="reg-pass" class="input" placeholder="Min. 8 caratteri" required autocomplete="new-password">' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label for="reg-pass2">Conferma password <span class="req">*</span></label>' +
                            '<input type="password" id="reg-pass2" class="input" placeholder="Ripeti password" required autocomplete="new-password">' +
                        '</div>' +
                    '</div>' +
                    '<label class="check-row">' +
                        '<input type="checkbox" id="reg-privacy" required>' +
                        '<span>Dichiaro di aver letto l\'<a href="' + esc(CFG.PRIVACY_URL || '../privacy.html') + '" target="_blank" rel="noopener noreferrer">informativa privacy</a> e accetto i termini di utilizzo di F.G. Academy. <strong style="color:var(--magenta)">*</strong></span>' +
                    '</label>' +
                    '<label class="check-row">' +
                        '<input type="checkbox" id="reg-marketing">' +
                        '<span><em>(Facoltativo)</em> Acconsento a ricevere comunicazioni promozionali, aggiornamenti sui futuri percorsi e novità da Francesca Grandi.</span>' +
                    '</label>' +
                    '<button type="submit" class="btn btn-primary btn-block">RICHIEDI ACCESSO GRATUITO</button>' +
                '</form>';
        } else if (tab === 'pending') {
            bodyHTML =
                '<div id="pending-approval-screen" style="text-align:center;padding:0.8rem 0 0.4rem;">' +
                    '<div style="width:56px;height:56px;border-radius:50%;background:var(--magenta-soft);color:var(--magenta);display:inline-flex;align-items:center;justify-content:center;font-size:1.6rem;margin-bottom:1rem;">⏳</div>' +
                    '<h2 style="font-size:1.3rem;font-weight:700;margin-bottom:0.65rem;color:var(--ink);">Richiesta di accesso inviata</h2>' +
                    '<p style="font-size:0.94rem;color:var(--ink-soft);line-height:1.6;margin-bottom:1rem;">' +
                        'Grazie <strong>' + esc(state.pendingUserName || '') + '</strong>! L\'accesso a <strong>F.G. Academy</strong> non è immediato ma viene confermato personalmente da <strong>Francesca Grandi</strong>.' +
                    '</p>' +
                    '<p style="font-size:0.88rem;color:var(--ink-soft);line-height:1.55;margin-bottom:1.5rem;">' +
                        'La tua richiesta per <strong>' + esc(state.pendingUserEmail || '') + '</strong> è attualmente in attesa di conferma. Potrai effettuare il login non appena il tuo accesso sarà approvato.' +
                    '</p>' +
                    '<button type="button" class="btn btn-outline btn-block" id="back-to-login-btn">&larr; Torna alla schermata di login</button>' +
                '</div>';
        } else if (tab === 'reset') {
            bodyHTML =
                '<form id="reset-form" novalidate>' +
                    '<div class="form-group">' +
                        '<label for="reset-email">La tua email di registrazione <span class="req">*</span></label>' +
                        '<input type="email" id="reset-email" class="input" placeholder="latua@email.it" required>' +
                    '</div>' +
                    (state.lastResetCode
                        ? '<div class="form-msg info">Codice di verifica generato: <strong>' + esc(state.lastResetCode) + '</strong></div>' +
                          '<div class="form-group">' +
                              '<label for="reset-code">Codice di verifica <span class="req">*</span></label>' +
                              '<input type="text" id="reset-code" class="input" value="' + esc(state.lastResetCode) + '" required>' +
                          '</div>' +
                          '<div class="form-group">' +
                              '<label for="reset-newpass">Nuova password (min. 8 caratteri) <span class="req">*</span></label>' +
                              '<input type="password" id="reset-newpass" class="input" required>' +
                          '</div>' +
                          '<button type="submit" class="btn btn-primary btn-block">SALVA NUOVA PASSWORD</button>'
                        : '<button type="submit" class="btn btn-primary btn-block">INVIA CODICE DI RECUPERO</button>'
                    ) +
                    '<div style="text-align:center;margin-top:1rem;">' +
                        '<button type="button" class="link-btn" id="back-to-login-btn">&larr; Torna al login</button>' +
                    '</div>' +
                '</form>';
        }

        app.innerHTML =
            '<div class="auth-shell">' +
                '<div class="auth-top-bar">' +
                    '<a href="' + esc(CFG.SITE_HOME_URL || '../landing.html') + '" class="auth-back">&larr; Torna a francescagrandi.it</a>' +
                '</div>' +
                '<div class="auth-card">' +
                    '<div class="auth-header">' +
                        renderLogoHTML() +
                        '<h1>Benvenuto in F.G. Academy</h1>' +
                        '<p>Lo spazio gratuito di crescita personale gestito da Francesca Grandi.</p>' +
                    '</div>' +
                    (tab !== 'reset' && tab !== 'pending'
                        ? '<div class="auth-tabs" role="tablist">' +
                              '<button type="button" class="auth-tab ' + (tab === 'login' ? 'active' : '') + '" id="tab-login">Accedi</button>' +
                              '<button type="button" class="auth-tab ' + (tab === 'register' ? 'active' : '') + '" id="tab-register">Registrati gratis</button>' +
                          '</div>'
                        : ''
                    ) +
                    alertHTML +
                    bodyHTML +
                    '<p class="auth-footer-note">Accesso gratuito &bull; Nessuna carta di credito richiesta</p>' +
                '</div>' +
            '</div>';

        var tLogin = document.getElementById('tab-login');
        var tReg = document.getElementById('tab-register');
        if (tLogin) tLogin.onclick = function () { state.authTab = 'login'; renderAuthScreen(); };
        if (tReg) tReg.onclick = function () { state.authTab = 'register'; renderAuthScreen(); };

        var gotoReset = document.getElementById('goto-reset-btn');
        if (gotoReset) gotoReset.onclick = function () { state.authTab = 'reset'; state.lastResetCode = null; renderAuthScreen(); };

        var backLogin = document.getElementById('back-to-login-btn');
        if (backLogin) backLogin.onclick = function () { state.authTab = 'login'; state.lastResetCode = null; renderAuthScreen(); };

        var loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.onsubmit = async function (e) {
                e.preventDefault();
                try {
                    await API.login(
                        document.getElementById('login-email').value,
                        document.getElementById('login-password').value
                    );
                    state.view = 'home';
                    renderApp();
                } catch (err) {
                    if (err && err.pendingApproval) {
                        state.authTab = 'pending';
                        state.pendingUserName = err.firstName || '';
                        state.pendingUserEmail = err.email || '';
                        renderAuthScreen();
                    } else {
                        renderAuthScreen({ type: 'error', text: err.message });
                    }
                }
            };
        }

        var regForm = document.getElementById('register-form');
        if (regForm) {
            regForm.onsubmit = async function (e) {
                e.preventDefault();
                try {
                    var res = await API.register({
                        firstName: document.getElementById('reg-nome').value,
                        lastName: document.getElementById('reg-cognome').value,
                        email: document.getElementById('reg-email').value,
                        password: document.getElementById('reg-pass').value,
                        confirmPassword: document.getElementById('reg-pass2').value,
                        privacyAccepted: document.getElementById('reg-privacy').checked,
                        marketingConsent: document.getElementById('reg-marketing').checked
                    });
                    if (res.pendingApproval) {
                        state.authTab = 'pending';
                        state.pendingUserName = res.firstName || '';
                        state.pendingUserEmail = res.email || '';
                        renderAuthScreen();
                        toast('Richiesta inviata! In attesa di conferma da Francesca.');
                    } else {
                        state.pendingVerifyToken = res.verifyToken;
                        state.view = 'home';
                        renderApp();
                        toast('Account amministratrice creato! Benvenuta Francesca.');
                    }
                } catch (err) {
                    renderAuthScreen({ type: 'error', text: err.message });
                }
            };
        }

        var resetForm = document.getElementById('reset-form');
        if (resetForm) {
            resetForm.onsubmit = async function (e) {
                e.preventDefault();
                var emailVal = document.getElementById('reset-email').value;
                try {
                    if (!state.lastResetCode) {
                        var out = API.requestPasswordReset(emailVal);
                        state.lastResetCode = out.resetToken || 'VERIFICA-EMAIL';
                        renderAuthScreen({ type: 'info', text: 'Inserisci il codice di recupero e scegli la nuova password.' });
                        var emIn = document.getElementById('reset-email');
                        if (emIn) emIn.value = emailVal;
                    } else {
                        var codeVal = document.getElementById('reset-code').value;
                        var newPass = document.getElementById('reset-newpass').value;
                        await API.confirmPasswordReset(emailVal, codeVal, newPass);
                        state.authTab = 'login';
                        state.lastResetCode = null;
                        renderAuthScreen({ type: 'success', text: 'Password aggiornata con successo! Ora puoi effettuare il login.' });
                    }
                } catch (err) {
                    renderAuthScreen({ type: 'error', text: err.message });
                }
            };
        }
    }

    // =========================================================================
    // 5. VISTE DELLA DASHBOARD (Home, Community, Eventi, Risorse, Percorsi, Profilo, Admin)
    // =========================================================================
    function renderHomeView(u, db) {
        var pct = computeProfileCompletion(u);
        var publishedPosts = db.posts.filter(function (p) { return p.status === 'published'; });
        var nextEvent = db.events[0] || null;
        var promptDate = formatDate(db.weeklyPrompt.updatedAt);

        var verifyBanner = !u.emailVerified
            ? '<div class="form-msg info" style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;">' +
                  '<span>Verifica il tuo indirizzo email (<strong>' + esc(u.email) + '</strong>) per completare al 100% il tuo profilo.</span>' +
                  '<button type="button" class="btn btn-primary btn-sm" id="verify-email-now-btn">Conferma email ora</button>' +
              '</div>'
            : '';

        var recentHTML = publishedPosts.length === 0
            ? '<p style="color:var(--ink-soft);font-size:0.92rem;">Non ci sono ancora discussioni pubblicate nella community.</p>'
            : publishedPosts.slice(0, 3).map(function (p) {
                return (
                    '<button type="button" class="recent-item" data-open-post="' + esc(p.id) + '">' +
                        '<div>' +
                            '<div class="recent-title">' + esc(p.title || 'Discussione della community') + '</div>' +
                            '<div class="recent-snippet">' + esc(p.body) + '</div>' +
                            '<div class="recent-meta">' + esc(p.authorName) + ' &bull; ' + esc(formatDate(p.createdAt)) + '</div>' +
                        '</div>' +
                        '<span style="color:var(--ink-muted);font-size:1.2rem;">&rsaquo;</span>' +
                    '</button>'
                );
            }).join('');

        return (
            verifyBanner +
            '<div class="welcome-block">' +
                '<h1>Ciao ' + esc(u.firstName) + ' 👋</h1>' +
                '<p>Benvenuto in F.G. Academy, uno spazio dedicato a chi desidera conoscersi meglio, superare i propri blocchi e costruire una vita più in linea con ciò che desidera.</p>' +
            '</div>' +

            '<!-- A. Spunto della settimana -->' +
            '<section class="card card-prompt" aria-label="Spunto della settimana">' +
                '<span class="prompt-quote-mark" aria-hidden="true">&rdquo;</span>' +
                '<div class="prompt-kicker">' +
                    '<span>💡 SPUNTO DELLA SETTIMANA</span>' +
                    '<span>&bull; ' + esc(promptDate) + '</span>' +
                    (isAdminUser(u) ? '<button type="button" class="link-btn" id="quick-edit-prompt-btn" style="margin-left:auto;">Modifica</button>' : '') +
                '</div>' +
                '<p class="prompt-text">' + esc(db.weeklyPrompt.text) + '</p>' +
            '</section>' +

            '<div class="dash-grid-2">' +
                '<!-- B. Il tuo profilo -->' +
                '<section class="card">' +
                    '<div class="card-label">👤 Il tuo profilo</div>' +
                    '<div class="profile-pct-row">' +
                        '<span class="profile-pct">' + pct + '% completo</span>' +
                        renderAvatar(u, '') +
                    '</div>' +
                    '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
                    '<button type="button" class="card-action-link" data-nav="profilo">Completa il tuo profilo &rsaquo;</button>' +
                '</section>' +

                '<!-- C. Prossimo evento -->' +
                '<section class="card">' +
                    '<div class="card-label">🗓️ Prossimo evento</div>' +
                    (nextEvent
                        ? '<h3 style="font-size:1.1rem;font-weight:700;margin-bottom:0.35rem;">' + esc(nextEvent.title) + '</h3>' +
                          '<p style="font-size:0.88rem;color:var(--ink-soft);margin-bottom:0.65rem;">' + esc(formatDate(nextEvent.eventDate)) + ' &bull; Ore ' + esc(nextEvent.eventTime) + '</p>' +
                          '<button type="button" class="card-action-link" data-nav="eventi">Vedi dettagli evento &rsaquo;</button>'
                        : '<h3 style="font-size:1.12rem;font-weight:700;margin-bottom:0.3rem;">Nessun evento in programma.</h3>' +
                          '<p style="font-size:0.88rem;color:var(--ink-soft);">Qui troverai i prossimi incontri gratuiti di F.G. Academy.</p>'
                    ) +
                '</section>' +
            '</div>' +

            '<!-- D. Discussioni recenti -->' +
            '<section class="card">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.6rem;">' +
                    '<h2 style="font-size:1.05rem;font-weight:700;">💬 Discussioni recenti</h2>' +
                    '<button type="button" class="card-action-link" data-nav="community">Vai alla community &rsaquo;</button>' +
                '</div>' +
                recentHTML +
            '</section>' +

            '<!-- E. Risorse gratuite -->' +
            '<section class="card row-card" data-nav="risorse" role="button" tabindex="0">' +
                '<div class="row-card-left">' +
                    '<div class="row-icon">' + ICONS.risorse + '</div>' +
                    '<div>' +
                        '<h2 style="font-size:1.02rem;font-weight:700;">Risorse gratuite</h2>' +
                        '<p style="font-size:0.88rem;color:var(--ink-soft);">Accedi alla biblioteca digitale gratuita: guide pratiche, esercizi e video.</p>' +
                    '</div>' +
                '</div>' +
                '<span style="color:var(--ink-muted);font-size:1.3rem;">&rsaquo;</span>' +
            '</section>' +

            '<!-- F. Percorsi premium -->' +
            '<section class="card row-card" data-nav="percorsi" role="button" tabindex="0">' +
                '<div class="row-card-left">' +
                    '<div class="row-icon">' + ICONS.lock + '</div>' +
                    '<div>' +
                        '<div style="display:flex;align-items:center;gap:0.5rem;">' +
                            '<h2 style="font-size:1.02rem;font-weight:700;">Percorsi premium</h2>' +
                            '<span class="badge">Nuovi percorsi in arrivo.</span>' +
                        '</div>' +
                        '<p style="font-size:0.88rem;color:var(--ink-soft);">Scopri in anteprima i futuri percorsi strutturati di F.G. Academy.</p>' +
                    '</div>' +
                '</div>' +
                '<span style="color:var(--ink-muted);font-size:1.3rem;">&rsaquo;</span>' +
            '</section>'
        );
    }

    function renderCommunityView(u, db) {
        var admin = isAdminUser(u);
        var posts = db.posts.filter(function (p) {
            return p.status === 'published' || admin;
        });

        if (state.communityFilter === 'saved') {
            posts = posts.filter(function (p) { return (p.saves || []).indexOf(u.id) !== -1; });
        } else if (state.communityFilter === 'pinned') {
            posts = posts.filter(function (p) { return Boolean(p.pinned); });
        }

        posts.sort(function (a, b) {
            if (a.pinned !== b.pinned && state.communityFilter === 'all') return a.pinned ? -1 : 1;
            var ta = new Date(a.createdAt).getTime();
            var tb = new Date(b.createdAt).getTime();
            return state.communitySort === 'oldest' ? ta - tb : tb - ta;
        });

        var postsHTML = posts.length === 0
            ? '<div class="card" style="text-align:center;padding:2.5rem 1.5rem;">' +
                  '<p style="color:var(--ink-soft);">Nessuna discussione presente in questa vista.</p>' +
              '</div>'
            : posts.map(function (p) {
                var liked = (p.likes || []).indexOf(u.id) !== -1;
                var saved = (p.saves || []).indexOf(u.id) !== -1;
                var postComments = db.comments.filter(function (c) { return c.postId === p.id; });
                var rootComments = postComments.filter(function (c) { return !c.parentId; });

                var commentsHTML = rootComments.map(function (c) {
                    var cLiked = (c.likes || []).indexOf(u.id) !== -1;
                    var canEditComment = c.userId === u.id;
                    var canDeleteComment = c.userId === u.id || admin;
                    var replies = postComments.filter(function (r) { return r.parentId === c.id; });

                    var repliesHTML = replies.map(function (r) {
                        var rLiked = (r.likes || []).indexOf(u.id) !== -1;
                        var canEditReply = r.userId === u.id;
                        var canDeleteReply = r.userId === u.id || admin;
                        return (
                            '<div class="comment-item reply">' +
                                '<div class="comment-top">' +
                                    '<div class="comment-author">' +
                                        esc(r.authorName) +
                                        (r.isAdminAuthor ? ' <span class="badge">Autrice</span>' : '') +
                                    '</div>' +
                                    '<span class="post-date">' + esc(formatDateTime(r.createdAt)) + '</span>' +
                                '</div>' +
                                '<div class="comment-text">' + esc(r.body) + '</div>' +
                                '<div class="comment-bar">' +
                                    '<button type="button" class="' + (rLiked ? 'active' : '') + '" data-like-comment="' + esc(r.id) + '">♥ Mi piace (' + (r.likes || []).length + ')</button>' +
                                    (canEditReply ? '<button type="button" data-edit-comment="' + esc(r.id) + '">Modifica</button>' : '') +
                                    (canDeleteReply ? '<button type="button" data-del-comment="' + esc(r.id) + '">Elimina</button>' : '') +
                                    '<button type="button" data-report-comment="' + esc(r.id) + '">Segnala</button>' +
                                '</div>' +
                            '</div>'
                        );
                    }).join('');

                    return (
                        '<div class="comment-item">' +
                            '<div class="comment-top">' +
                                '<div class="comment-author">' +
                                    esc(c.authorName) +
                                    (c.isAdminAuthor ? ' <span class="badge">Autrice</span>' : '') +
                                '</div>' +
                                '<span class="post-date">' + esc(formatDateTime(c.createdAt)) + '</span>' +
                            '</div>' +
                            '<div class="comment-text">' + esc(c.body) + '</div>' +
                            '<div class="comment-bar">' +
                                '<button type="button" class="' + (cLiked ? 'active' : '') + '" data-like-comment="' + esc(c.id) + '">♥ Mi piace (' + (c.likes || []).length + ')</button>' +
                                '<button type="button" data-reply-comment="' + esc(c.id) + '" data-reply-post="' + esc(p.id) + '">Rispondi</button>' +
                                (canEditComment ? '<button type="button" data-edit-comment="' + esc(c.id) + '">Modifica</button>' : '') +
                                (canDeleteComment ? '<button type="button" data-del-comment="' + esc(c.id) + '">Elimina</button>' : '') +
                                '<button type="button" data-report-comment="' + esc(c.id) + '">Segnala</button>' +
                            '</div>' +
                        '</div>' +
                        repliesHTML
                    );
                }).join('');

                return (
                    '<article class="card post-card ' + (p.status === 'draft' ? 'draft-card' : '') + '" id="post-' + esc(p.id) + '">' +
                        '<div class="post-head">' +
                            '<div class="post-author">' +
                                '<img class="avatar" src="' + esc(p.authorPhoto || '../francesca-grandi.jpg') + '" alt="Francesca Grandi">' +
                                '<div>' +
                                    '<div class="author-name">' +
                                        esc(p.authorName) +
                                        '<span class="badge">Mental Coach</span>' +
                                        (p.pinned ? '<span class="badge pin">📌 In evidenza</span>' : '') +
                                        (p.status === 'draft' ? '<span class="badge draft">Bozza da approvare</span>' : '') +
                                    '</div>' +
                                    '<div class="post-date">' + esc(formatDateTime(p.createdAt)) + '</div>' +
                                '</div>' +
                            '</div>' +
                            (admin
                                ? '<div style="display:flex;gap:0.4rem;flex-wrap:wrap;">' +
                                      (p.status === 'draft'
                                          ? '<button type="button" class="btn btn-primary btn-sm" data-publish-post="' + esc(p.id) + '">Approva e pubblica</button>'
                                          : ''
                                      ) +
                                      '<button type="button" class="btn btn-outline btn-sm" data-pin-post="' + esc(p.id) + '">' + (p.pinned ? 'Rimuovi evidenza' : 'Fissa') + '</button>' +
                                      '<button type="button" class="btn btn-outline btn-sm" data-edit-post="' + esc(p.id) + '">Modifica</button>' +
                                      '<button type="button" class="btn btn-danger btn-sm" data-del-post="' + esc(p.id) + '">Elimina</button>' +
                                  '</div>'
                                : ''
                            ) +
                        '</div>' +
                        (p.title ? '<h2 class="post-title">' + esc(p.title) + '</h2>' : '') +
                        '<div class="post-body">' + esc(p.body) + '</div>' +
                        (p.imageUrl ? '<img class="post-image" src="' + esc(p.imageUrl) + '" alt="Immagine discussione">' : '') +
                        '<div class="post-actions">' +
                            '<button type="button" class="act-btn ' + (liked ? 'active' : '') + '" data-like-post="' + esc(p.id) + '">♥ Mi piace (' + (p.likes || []).length + ')</button>' +
                            '<button type="button" class="act-btn" data-focus-comment="' + esc(p.id) + '">💬 Commenta (' + postComments.length + ')</button>' +
                            '<button type="button" class="act-btn ' + (saved ? 'active' : '') + '" data-save-post="' + esc(p.id) + '">🔖 ' + (saved ? 'Salvata' : 'Salva') + '</button>' +
                            '<button type="button" class="act-btn" data-report-post="' + esc(p.id) + '" style="margin-left:auto;">Segnala</button>' +
                        '</div>' +
                        '<div class="comments-box">' +
                            commentsHTML +
                            '<form class="comment-form" data-comment-form="' + esc(p.id) + '">' +
                                '<input type="text" class="input" name="commentBody" placeholder="Scrivi un commento nella discussione..." required maxlength="2000">' +
                                '<button type="submit" class="btn btn-primary btn-sm">Pubblica</button>' +
                            '</form>' +
                        '</div>' +
                    '</article>'
                );
            }).join('');

        return (
            '<div class="page-header">' +
                '<div>' +
                    '<h1>Community F.G. Academy</h1>' +
                    '<p style="color:var(--ink-soft);font-size:0.92rem;">Partecipa alle discussioni pubblicate da Francesca Grandi e confrontati con gli altri iscritti.</p>' +
                '</div>' +
                '<div style="display:flex;gap:0.6rem;align-items:center;">' +
                    '<button type="button" class="btn btn-outline btn-sm" id="open-rules-btn">Regolamento</button>' +
                    // REGOLA PRINCIPALE: il pulsante Nuova discussione esiste SOLO per l'amministratrice
                    (admin ? '<button type="button" class="btn btn-primary" id="new-post-btn">+ Nuova discussione</button>' : '') +
                '</div>' +
            '</div>' +
            '<div class="toolbar">' +
                '<div class="filter-pills" role="tablist">' +
                    '<button type="button" class="pill ' + (state.communityFilter === 'all' ? 'active' : '') + '" data-filter="all">Tutte</button>' +
                    '<button type="button" class="pill ' + (state.communityFilter === 'saved' ? 'active' : '') + '" data-filter="saved">Salvate</button>' +
                    '<button type="button" class="pill ' + (state.communityFilter === 'pinned' ? 'active' : '') + '" data-filter="pinned">In evidenza</button>' +
                '</div>' +
                '<div>' +
                    '<select id="community-sort" class="select" style="width:auto;padding:0.45rem 0.85rem;font-size:0.84rem;" aria-label="Ordina per data">' +
                        '<option value="newest" ' + (state.communitySort === 'newest' ? 'selected' : '') + '>Più recenti</option>' +
                        '<option value="oldest" ' + (state.communitySort === 'oldest' ? 'selected' : '') + '>Meno recenti</option>' +
                    '</select>' +
                '</div>' +
            '</div>' +
            postsHTML +
            '<div class="disclaimer-banner">' +
                '<span><strong>Nota importante:</strong> F.G. Academy è uno spazio di crescita personale e confronto e non sostituisce in alcun modo assistenza psicologica, psicoterapia o supporto sanitario.</span>' +
                '<button type="button" class="link-btn" id="open-rules-btn-2">Leggi il regolamento completo</button>' +
            '</div>'
        );
    }

    function renderEventiView(u, db) {
        var admin = isAdminUser(u);
        var listHTML = db.events.length === 0
            ? '<div class="card" style="text-align:center;padding:3rem 1.5rem;">' +
                  '<p style="font-size:1.05rem;font-weight:600;color:var(--ink);">Al momento non ci sono eventi in programma. Torna a trovarci per scoprire i prossimi appuntamenti.</p>' +
              '</div>'
            : '<div class="cards-grid">' + db.events.map(function (ev) {
                return (
                    '<article class="card course-card">' +
                        '<div>' +
                            (ev.imageUrl ? '<img src="' + esc(ev.imageUrl) + '" alt="' + esc(ev.title) + '" class="post-image">' : '') +
                            '<span class="badge" style="margin-bottom:0.6rem;">🗓️ ' + esc(formatDate(ev.eventDate)) + ' • ' + esc(ev.eventTime) + '</span>' +
                            '<h2 style="font-size:1.15rem;font-weight:700;margin-bottom:0.5rem;">' + esc(ev.title) + '</h2>' +
                            '<p style="font-size:0.9rem;color:var(--ink-soft);margin-bottom:1.1rem;">' + esc(ev.description) + '</p>' +
                        '</div>' +
                        '<div style="display:flex;gap:0.5rem;align-items:center;">' +
                            (ev.joinUrl ? '<a href="' + esc(ev.joinUrl) + '" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">Partecipa all\'evento</a>' : '') +
                            (admin ? '<button type="button" class="btn btn-danger btn-sm" data-del-event="' + esc(ev.id) + '">Elimina</button>' : '') +
                        '</div>' +
                    '</article>'
                );
            }).join('') + '</div>';

        return (
            '<div class="page-header">' +
                '<div>' +
                    '<h1>Eventi gratuiti</h1>' +
                    '<p style="color:var(--ink-soft);font-size:0.92rem;">Gli appuntamenti e gli incontri dal vivo di F.G. Academy.</p>' +
                '</div>' +
                (admin ? '<button type="button" class="btn btn-primary" id="new-event-btn">+ Nuovo evento</button>' : '') +
            '</div>' +
            listHTML
        );
    }

    function renderRisorseView(u, db) {
        var admin = isAdminUser(u);
        var items = db.resources.filter(function (r) {
            var catOk = state.resourceCategory === 'all' || r.category === state.resourceCategory;
            var typeOk = state.resourceType === 'all' || r.resourceType === state.resourceType;
            return catOk && typeOk;
        });

        var listHTML = items.length === 0
            ? '<div class="card" style="text-align:center;padding:3rem 1.5rem;">' +
                  '<p style="font-size:1rem;font-weight:600;color:var(--ink);margin-bottom:0.3rem;">Nessuna risorsa presente in questa categoria.</p>' +
                  '<p style="font-size:0.88rem;color:var(--ink-soft);">Nuovi PDF, esercizi pratici e video verranno pubblicati qui da Francesca Grandi.</p>' +
              '</div>'
            : '<div class="cards-grid">' + items.map(function (r) {
                return (
                    '<article class="card course-card">' +
                        '<div>' +
                            '<div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-bottom:0.65rem;">' +
                                '<span class="badge">' + esc(r.category) + '</span>' +
                                '<span class="badge" style="background:var(--bg);color:var(--ink-soft);">' + esc(r.resourceType) + '</span>' +
                            '</div>' +
                            '<h2 style="font-size:1.12rem;font-weight:700;margin-bottom:0.45rem;">' + esc(r.title) + '</h2>' +
                            '<p style="font-size:0.9rem;color:var(--ink-soft);margin-bottom:1.1rem;">' + esc(r.description) + '</p>' +
                        '</div>' +
                        '<div style="display:flex;gap:0.5rem;align-items:center;">' +
                            '<a href="' + esc(r.fileUrl) + '" target="_blank" rel="noopener noreferrer" download class="btn btn-primary btn-sm">Apri / Scarica</a>' +
                            (admin ? '<button type="button" class="btn btn-danger btn-sm" data-del-resource="' + esc(r.id) + '">Elimina</button>' : '') +
                        '</div>' +
                    '</article>'
                );
            }).join('') + '</div>';

        return (
            '<div class="page-header">' +
                '<div>' +
                    '<h1>Risorse gratuite</h1>' +
                    '<p style="color:var(--ink-soft);font-size:0.92rem;">Biblioteca digitale riservata agli iscritti: PDF, guide pratiche, schede di esercizi e video.</p>' +
                '</div>' +
                (admin ? '<button type="button" class="btn btn-primary" id="new-resource-btn">+ Carica risorsa</button>' : '') +
            '</div>' +
            '<div class="toolbar">' +
                '<select id="res-cat-filter" class="select" style="width:auto;min-width:220px;" aria-label="Filtra per categoria">' +
                    '<option value="all">Tutte le categorie</option>' +
                    CATEGORIES.map(function (c) {
                        return '<option value="' + esc(c) + '" ' + (state.resourceCategory === c ? 'selected' : '') + '>' + esc(c) + '</option>';
                    }).join('') +
                '</select>' +
                '<select id="res-type-filter" class="select" style="width:auto;min-width:200px;" aria-label="Filtra per tipologia">' +
                    '<option value="all">Tutte le tipologie</option>' +
                    RESOURCE_TYPES.map(function (t) {
                        return '<option value="' + esc(t) + '" ' + (state.resourceType === t ? 'selected' : '') + '>' + esc(t) + '</option>';
                    }).join('') +
                '</select>' +
            '</div>' +
            listHTML
        );
    }

    function renderPercorsiView(u, db) {
        var admin = isAdminUser(u);
        var freeCourses = db.courses.filter(function (c) { return c.tier === 'free'; });
        var premiumCourses = db.courses.filter(function (c) { return c.tier === 'premium'; });

        return (
            '<div class="page-header">' +
                '<div>' +
                    '<h1>Percorsi F.G. Academy</h1>' +
                    '<p style="color:var(--ink-soft);font-size:0.92rem;">Esplora i contenuti formativi gratuiti e scopri in anteprima i percorsi premium.</p>' +
                '</div>' +
                (admin ? '<button type="button" class="btn btn-primary" id="new-course-btn">+ Nuovo percorso</button>' : '') +
            '</div>' +

            '<h2 style="font-size:1.15rem;font-weight:700;margin-bottom:0.9rem;">Contenuti gratuiti</h2>' +
            (freeCourses.length === 0
                ? '<div class="card" style="margin-bottom:2rem;"><p style="color:var(--ink-soft);font-size:0.92rem;">Nuovi mini-percorsi gratuiti saranno disponibili in questa sezione.</p></div>'
                : '<div class="cards-grid" style="margin-bottom:2rem;">' + freeCourses.map(function (c) {
                    return (
                        '<article class="card course-card">' +
                            '<div>' +
                                '<span class="badge" style="margin-bottom:0.65rem;">Gratuito</span>' +
                                '<h3 style="font-size:1.15rem;font-weight:700;margin-bottom:0.45rem;">' + esc(c.title) + '</h3>' +
                                '<p style="font-size:0.9rem;color:var(--ink-soft);margin-bottom:1rem;">' + esc(c.description) + '</p>' +
                            '</div>' +
                            '<button type="button" class="btn btn-secondary btn-sm" data-open-course="' + esc(c.id) + '">Accedi al percorso</button>' +
                        '</article>'
                    );
                }).join('') + '</div>'
            ) +

            '<h2 style="font-size:1.15rem;font-weight:700;margin-bottom:0.9rem;">Percorsi premium</h2>' +
            '<div class="cards-grid">' +
                premiumCourses.map(function (c) {
                    return (
                        '<article class="card course-card locked">' +
                            '<div>' +
                                '<div class="lock-pill">' + ICONS.lock + ' <span>Percorso Premium</span></div>' +
                                '<h3 style="font-size:1.18rem;font-weight:700;margin-bottom:0.5rem;">' + esc(c.title) + '</h3>' +
                                '<p style="font-size:0.9rem;color:var(--ink-soft);margin-bottom:1rem;">' + esc(c.description) + '</p>' +
                            '</div>' +
                            '<div style="padding-top:0.85rem;border-top:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:0.5rem;">' +
                                '<span style="font-size:0.84rem;font-weight:600;color:var(--magenta);">🔒 Questo percorso sarà disponibile prossimamente.</span>' +
                            '</div>' +
                        '</article>'
                    );
                }).join('') +
            '</div>'
        );
    }

    function renderProfiloView(u, db) {
        var savedPosts = db.posts.filter(function (p) {
            return p.status === 'published' && (p.saves || []).indexOf(u.id) !== -1;
        });
        var notif = u.notifications || { posts: true, replies: true, events: true, resources: true, admin: true };

        return (
            '<div class="page-header">' +
                '<h1>Il tuo profilo personale</h1>' +
            '</div>' +

            '<div class="dash-grid-2">' +
                '<!-- Dati profilo e foto -->' +
                '<section class="card">' +
                    '<h2 style="font-size:1.08rem;font-weight:700;margin-bottom:1rem;">Informazioni personali</h2>' +
                    '<form id="profile-form">' +
                        '<div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.2rem;">' +
                            renderAvatar(u, 'lg') +
                            '<div>' +
                                '<label for="avatar-file" class="btn btn-secondary btn-sm" style="cursor:pointer;">Cambia foto</label>' +
                                '<input type="file" id="avatar-file" accept="image/*" style="display:none;">' +
                                '<p style="font-size:0.76rem;color:var(--ink-muted);margin-top:0.3rem;">JPG o PNG</p>' +
                            '</div>' +
                        '</div>' +
                        '<div class="form-row-2">' +
                            '<div class="form-group">' +
                                '<label for="prof-nome">Nome</label>' +
                                '<input type="text" id="prof-nome" class="input" value="' + esc(u.firstName) + '" required>' +
                            '</div>' +
                            '<div class="form-group">' +
                                '<label for="prof-cognome">Cognome</label>' +
                                '<input type="text" id="prof-cognome" class="input" value="' + esc(u.lastName) + '" required>' +
                            '</div>' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label for="prof-bio">Breve biografia</label>' +
                            '<textarea id="prof-bio" class="textarea" placeholder="Racconta brevemente chi sei e su cosa desideri lavorare...">' + esc(u.bio || '') + '</textarea>' +
                        '</div>' +
                        '<button type="submit" class="btn btn-primary">Salva profilo</button>' +
                    '</form>' +
                '</section>' +

                '<!-- Sicurezza & Notifiche -->' +
                '<section class="card">' +
                    '<h2 style="font-size:1.08rem;font-weight:700;margin-bottom:1rem;">Preferenze notifiche</h2>' +
                    '<form id="notif-prefs-form" style="margin-bottom:1.6rem;">' +
                        '<label class="check-row"><input type="checkbox" id="np-posts" ' + (notif.posts ? 'checked' : '') + '> <span>Nuove discussioni pubblicate</span></label>' +
                        '<label class="check-row"><input type="checkbox" id="np-replies" ' + (notif.replies ? 'checked' : '') + '> <span>Risposte ai tuoi commenti</span></label>' +
                        '<label class="check-row"><input type="checkbox" id="np-events" ' + (notif.events ? 'checked' : '') + '> <span>Nuovi eventi gratuiti</span></label>' +
                        '<label class="check-row"><input type="checkbox" id="np-resources" ' + (notif.resources ? 'checked' : '') + '> <span>Nuove risorse gratuite</span></label>' +
                        '<label class="check-row"><input type="checkbox" id="np-admin" ' + (notif.admin ? 'checked' : '') + '> <span>Comunicazioni importanti dell\'amministratrice</span></label>' +
                        '<label class="check-row"><input type="checkbox" id="np-marketing" ' + (u.marketingConsent ? 'checked' : '') + '> <span>Comunicazioni promozionali (consenso facoltativo)</span></label>' +
                        '<button type="submit" class="btn btn-secondary btn-sm">Aggiorna preferenze</button>' +
                    '</form>' +

                    '<h2 style="font-size:1.08rem;font-weight:700;margin-bottom:0.8rem;padding-top:1rem;border-top:1px solid var(--line);">Cambia password</h2>' +
                    '<form id="change-pass-form">' +
                        '<div class="form-group">' +
                            '<label for="cp-old">Password attuale</label>' +
                            '<input type="password" id="cp-old" class="input" required>' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label for="cp-new">Nuova password (min. 8 caratteri)</label>' +
                            '<input type="password" id="cp-new" class="input" required>' +
                        '</div>' +
                        '<button type="submit" class="btn btn-outline btn-sm">Aggiorna password</button>' +
                    '</form>' +
                '</section>' +
            '</div>' +

            '<!-- Discussioni salvate -->' +
            '<section class="card">' +
                '<h2 style="font-size:1.08rem;font-weight:700;margin-bottom:0.8rem;">🔖 Le tue discussioni salvate (' + savedPosts.length + ')</h2>' +
                (savedPosts.length === 0
                    ? '<p style="font-size:0.9rem;color:var(--ink-soft);">Non hai ancora salvato discussioni. Clicca su "Salva" sotto un post della community per ritrovarlo qui.</p>'
                    : savedPosts.map(function (p) {
                        return (
                            '<button type="button" class="recent-item" data-open-post="' + esc(p.id) + '">' +
                                '<div>' +
                                    '<div class="recent-title">' + esc(p.title || 'Discussione') + '</div>' +
                                    '<div class="recent-snippet">' + esc(p.body) + '</div>' +
                                '</div>' +
                                '<span>&rsaquo;</span>' +
                            '</button>'
                        );
                    }).join('')
                ) +
            '</section>' +

            '<!-- Assistenza tecnica reale via Web3Forms -->' +
            '<section class="card">' +
                '<h2 style="font-size:1.08rem;font-weight:700;margin-bottom:0.4rem;">Assistenza e supporto tecnico</h2>' +
                '<p style="font-size:0.88rem;color:var(--ink-soft);margin-bottom:1rem;">Riscontri un problema tecnico? Invia una segnalazione direttamente al supporto di F.G. Academy.</p>' +
                '<form id="support-form">' +
                    '<div class="form-group">' +
                        '<label for="sup-subject">Oggetto della richiesta</label>' +
                        '<input type="text" id="sup-subject" class="input" placeholder="Es. Problema con il caricamento di un file" required>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label for="sup-msg">Descrivi il problema</label>' +
                        '<textarea id="sup-msg" class="textarea" required placeholder="Descrivi cosa è successo..."></textarea>' +
                    '</div>' +
                    '<button type="submit" class="btn btn-primary btn-sm" id="sup-submit-btn">Invia richiesta di supporto</button>' +
                '</form>' +
            '</section>' +

            '<!-- Eliminazione account -->' +
            '<section class="card" style="border-color:#FECACA;">' +
                '<h2 style="font-size:1.05rem;font-weight:700;color:var(--danger);margin-bottom:0.4rem;">Eliminazione account e dati personali</h2>' +
                '<p style="font-size:0.88rem;color:var(--ink-soft);margin-bottom:1rem;">Puoi eliminare definitivamente il tuo account F.G. Academy e tutti i dati associati in qualsiasi momento.</p>' +
                '<button type="button" class="btn btn-danger btn-sm" id="delete-account-btn">Elimina il mio account</button>' +
            '</section>'
        );
    }

    function renderAdminView(u, db) {
        if (!isAdminUser(u)) {
            return '<div class="card"><p>Accesso riservato esclusivamente all\'amministratrice Francesca Grandi.</p></div>';
        }
        var sevenDaysAgo = Date.now() - 7 * 86400000;
        var newMembers = db.users.filter(function (x) { return new Date(x.createdAt).getTime() >= sevenDaysAgo; }).length;
        var openReports = db.reports.filter(function (r) { return r.status === 'open'; });
        var pendingUsers = db.users.filter(function (x) { return x.role !== 'admin' && x.approvalStatus !== 'approved' && x.approvalStatus !== 'rejected'; });

        return (
            '<div class="page-header">' +
                '<div>' +
                    '<h1>Pannello Amministratrice</h1>' +
                    '<p style="color:var(--ink-soft);font-size:0.92rem;">Gestisci richieste di accesso, contenuti, community e impostazioni di F.G. Academy.</p>' +
                '</div>' +
            '</div>' +

            '<div class="stats-grid">' +
                '<div class="stat-box"><div class="stat-num">' + pendingUsers.length + '</div><div class="stat-label">Richieste in attesa</div></div>' +
                '<div class="stat-box"><div class="stat-num">' + db.users.length + '</div><div class="stat-label">Iscritti totali</div></div>' +
                '<div class="stat-box"><div class="stat-num">' + db.comments.length + '</div><div class="stat-label">Commenti pubblicati</div></div>' +
                '<div class="stat-box"><div class="stat-num">' + openReports.length + '</div><div class="stat-label">Segnalazioni aperte</div></div>' +
            '</div>' +

            '<!-- Richieste di accesso in attesa di conferma -->' +
            '<section class="card" id="admin-pending-requests-card">' +
                '<h2 style="font-size:1.08rem;font-weight:700;margin-bottom:0.8rem;">⏳ Richieste di accesso da confermare (' + pendingUsers.length + ')</h2>' +
                (pendingUsers.length === 0
                    ? '<p style="font-size:0.9rem;color:var(--ink-soft);">Nessuna nuova richiesta di accesso in attesa di conferma.</p>'
                    : pendingUsers.map(function (m) {
                        return (
                            '<div style="display:flex;align-items:center;justify-content:space-between;padding:0.85rem 0;border-bottom:1px solid var(--line);gap:1rem;flex-wrap:wrap;">' +
                                '<div style="display:flex;align-items:center;gap:0.75rem;">' +
                                    renderAvatar(m, 'sm') +
                                    '<div>' +
                                        '<div style="font-size:0.92rem;font-weight:600;">' + esc(m.firstName + ' ' + m.lastName) + ' <span class="badge draft">In attesa di conferma</span></div>' +
                                        '<div style="font-size:0.8rem;color:var(--ink-soft);">' + esc(m.email) + ' &bull; Richiesta il ' + esc(formatDateTime(m.createdAt)) + '</div>' +
                                    '</div>' +
                                '</div>' +
                                '<div style="display:flex;gap:0.5rem;">' +
                                    '<button type="button" class="btn btn-primary btn-sm" data-approve-user="' + esc(m.id) + '">✓ Conferma accesso</button>' +
                                    '<button type="button" class="btn btn-danger btn-sm" data-reject-user="' + esc(m.id) + '">✕ Rifiuta</button>' +
                                '</div>' +
                            '</div>'
                        );
                    }).join('')
                ) +
            '</section>' +

            '<!-- Modifica Spunto della settimana -->' +
            '<section class="card">' +
                '<h2 style="font-size:1.08rem;font-weight:700;margin-bottom:0.8rem;">💡 Spunto della settimana</h2>' +
                '<form id="admin-prompt-form">' +
                    '<div class="form-group">' +
                        '<textarea id="admin-prompt-text" class="textarea" required>' + esc(db.weeklyPrompt.text) + '</textarea>' +
                    '</div>' +
                    '<button type="submit" class="btn btn-primary btn-sm">Aggiorna spunto in Dashboard</button>' +
                '</form>' +
            '</section>' +

            '<!-- Gestione Segnalazioni -->' +
            '<section class="card">' +
                '<h2 style="font-size:1.08rem;font-weight:700;margin-bottom:0.8rem;">🚩 Segnalazioni della community (' + openReports.length + ')</h2>' +
                (openReports.length === 0
                    ? '<p style="font-size:0.9rem;color:var(--ink-soft);">Nessuna segnalazione aperta al momento.</p>'
                    : openReports.map(function (rep) {
                        return (
                            '<div class="comment-item" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;">' +
                                '<div>' +
                                    '<div style="font-size:0.85rem;font-weight:700;">Tipo: ' + esc(rep.targetType) + ' &bull; Motivo: ' + esc(rep.reason) + '</div>' +
                                    '<div class="post-date">' + esc(formatDateTime(rep.createdAt)) + '</div>' +
                                '</div>' +
                                '<button type="button" class="btn btn-outline btn-sm" data-resolve-report="' + esc(rep.id) + '">Segna come risolta</button>' +
                            '</div>'
                        );
                    }).join('')
                ) +
            '</section>' +

            '<!-- Gestione Iscritti -->' +
            '<section class="card">' +
                '<h2 style="font-size:1.08rem;font-weight:700;margin-bottom:0.8rem;">👥 Iscritti registrati (' + db.users.length + ')</h2>' +
                db.users.map(function (m) {
                    var statusBadge = '';
                    if (m.role === 'admin') statusBadge = '<span class="badge">Admin</span>';
                    else if (m.approvalStatus === 'approved') statusBadge = '<span class="badge">Confermato</span>';
                    else if (m.approvalStatus === 'rejected') statusBadge = '<span class="badge draft">Rifiutato</span>';
                    else statusBadge = '<span class="badge draft">In attesa</span>';

                    return (
                        '<div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 0;border-bottom:1px solid var(--line);gap:1rem;flex-wrap:wrap;">' +
                            '<div style="display:flex;align-items:center;gap:0.75rem;">' +
                                renderAvatar(m, 'sm') +
                                '<div>' +
                                    '<div style="font-size:0.9rem;font-weight:600;">' + esc(m.firstName + ' ' + m.lastName) + ' ' + statusBadge + (m.suspended ? ' <span class="badge draft">Sospeso</span>' : '') + '</div>' +
                                    '<div style="font-size:0.78rem;color:var(--ink-muted);">' + esc(m.email) + ' &bull; Iscritto il ' + esc(formatDate(m.createdAt)) + '</div>' +
                                '</div>' +
                            '</div>' +
                            (m.role !== 'admin'
                                ? '<div style="display:flex;gap:0.5rem;">' +
                                      (m.approvalStatus !== 'approved' ? '<button type="button" class="btn btn-primary btn-sm" data-approve-user="' + esc(m.id) + '">✓ Conferma accesso</button>' : '') +
                                      '<button type="button" class="btn ' + (m.suspended ? 'btn-secondary' : 'btn-danger') + ' btn-sm" data-toggle-suspend="' + esc(m.id) + '">' + (m.suspended ? 'Riattiva' : 'Sospendi') + '</button>' +
                                  '</div>'
                                : ''
                            ) +
                        '</div>'
                    );
                }).join('') +
            '</section>'
        );
    }

    // =========================================================================
    // 6. MODALI (Nuova discussione, Regolamento, Segnalazione, Eventi, Risorse)
    // =========================================================================
    function openModal(html) {
        var root = document.getElementById('modal-root');
        root.innerHTML = '<div class="modal-card">' + html + '</div>';
        root.hidden = false;
        root.onclick = function (e) {
            if (e.target === root) closeModal();
        };
    }

    function closeModal() {
        var root = document.getElementById('modal-root');
        if (root) {
            root.hidden = true;
            root.innerHTML = '';
        }
    }

    function showCommunityRulesModal() {
        openModal(
            '<div class="modal-head">' +
                '<h2>Regolamento della Community</h2>' +
                '<button type="button" class="link-btn" id="modal-close-btn">Chiudi &times;</button>' +
            '</div>' +
            '<div style="font-size:0.9rem;color:var(--ink-soft);display:grid;gap:0.8rem;line-height:1.6;">' +
                '<p><strong>1. Rispetto e ascolto:</strong> F.G. Academy è uno spazio protetto di crescita personale. Ogni commento deve essere rispettoso verso le esperienze e la sensibilità degli altri iscritti.</p>' +
                '<p><strong>2. Apertura delle discussioni:</strong> Per garantire qualità, ordine e guida formativa, le nuove discussioni vengono aperte esclusivamente da Francesca Grandi. Tutti gli iscritti sono invitati a partecipare attivamente nei commenti.</p>' +
                '<p><strong>3. Tutela della riservatezza:</strong> Non condividere dati sensibili di terze persone, numeri di telefono o spam promozionale.</p>' +
                '<p><strong>4. Segnalazioni e moderazione:</strong> Puoi segnalare qualsiasi commento inappropriato tramite il pulsante "Segnala". L\'amministratrice può rimuovere i contenuti non idonei e sospendere gli account che violano il regolamento.</p>' +
                '<p style="padding:0.75rem;background:var(--magenta-soft);border-radius:12px;color:var(--ink);"><strong>Avvertenza importante:</strong> I contenuti e i confronti presenti in F.G. Academy hanno finalità di crescita personale e mental coaching e <strong>non sostituiscono in alcun modo assistenza psicologica, psicoterapia o supporto medico/sanitario</strong>.</p>' +
            '</div>'
        );
        document.getElementById('modal-close-btn').onclick = closeModal;
    }

    function showPostEditorModal(existingPost) {
        openModal(
            '<div class="modal-head">' +
                '<h2>' + (existingPost ? 'Modifica discussione' : 'Nuova discussione (Solo Admin)') + '</h2>' +
                '<button type="button" class="link-btn" id="modal-close-btn">Chiudi &times;</button>' +
            '</div>' +
            '<form id="post-modal-form">' +
                '<div class="form-group">' +
                    '<label for="pm-title">Titolo della discussione</label>' +
                    '<input type="text" id="pm-title" class="input" value="' + esc(existingPost ? existingPost.title : '') + '" placeholder="Es. Benvenuto in F.G. Academy!">' +
                '</div>' +
                '<div class="form-group">' +
                    '<label for="pm-body">Testo completo <span class="req">*</span></label>' +
                    '<textarea id="pm-body" class="textarea" rows="6" required>' + esc(existingPost ? existingPost.body : '') + '</textarea>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label for="pm-img">URL Immagine (opzionale)</label>' +
                    '<input type="url" id="pm-img" class="input" value="' + esc(existingPost ? existingPost.imageUrl : '') + '" placeholder="https://...">' +
                '</div>' +
                '<label class="check-row">' +
                    '<input type="checkbox" id="pm-pin" ' + (existingPost && existingPost.pinned ? 'checked' : '') + '>' +
                    '<span>Fissa questa discussione in evidenza in alto</span>' +
                '</label>' +
                '<div style="display:flex;gap:0.6rem;justify-content:flex-end;margin-top:1rem;">' +
                    '<button type="submit" name="status" value="published" class="btn btn-primary">' + (existingPost ? 'Salva e pubblica' : 'Pubblica discussione') + '</button>' +
                '</div>' +
            '</form>'
        );
        document.getElementById('modal-close-btn').onclick = closeModal;
        document.getElementById('post-modal-form').onsubmit = function (e) {
            e.preventDefault();
            try {
                var payload = {
                    title: document.getElementById('pm-title').value,
                    body: document.getElementById('pm-body').value,
                    imageUrl: document.getElementById('pm-img').value,
                    pinned: document.getElementById('pm-pin').checked,
                    status: 'published'
                };
                if (existingPost) {
                    API.updatePost(existingPost.id, payload);
                    toast('Discussione aggiornata e pubblicata.');
                } else {
                    API.createPost(payload);
                    toast('Nuova discussione pubblicata nella community.');
                }
                closeModal();
                renderApp();
            } catch (err) {
                toast(err.message);
            }
        };
    }

    // =========================================================================
    // 7. RENDER PRINCIPALE E GESTIONE EVENTI
    // =========================================================================
    function renderApp() {
        var u = getSessionUser();
        if (!u) {
            renderAuthScreen();
            return;
        }
        var db = loadDB();
        var admin = isAdminUser(u);
        var unreadNotifs = db.notifications.filter(function (n) {
            return (n.readBy || []).indexOf(u.id) === -1;
        });

        var navItems = [
            { id: 'home', label: 'Home', icon: ICONS.home },
            { id: 'community', label: 'Community', icon: ICONS.community },
            { id: 'eventi', label: 'Eventi', icon: ICONS.eventi },
            { id: 'risorse', label: 'Risorse gratuite', icon: ICONS.risorse },
            { id: 'percorsi', label: 'Percorsi', icon: ICONS.percorsi },
            { id: 'profilo', label: 'Profilo', icon: ICONS.profilo }
        ];
        if (admin) {
            var draftCount = db.posts.filter(function (p) { return p.status === 'draft'; }).length;
            var pendingCount = db.users.filter(function (x) { return x.role !== 'admin' && x.approvalStatus !== 'approved' && x.approvalStatus !== 'rejected'; }).length;
            navItems.push({ id: 'admin', label: 'Area Admin', icon: ICONS.admin, badge: (draftCount + pendingCount) || '' });
        }

        var mainHTML = '';
        if (state.view === 'home') mainHTML = renderHomeView(u, db);
        else if (state.view === 'community') mainHTML = renderCommunityView(u, db);
        else if (state.view === 'eventi') mainHTML = renderEventiView(u, db);
        else if (state.view === 'risorse') mainHTML = renderRisorseView(u, db);
        else if (state.view === 'percorsi') mainHTML = renderPercorsiView(u, db);
        else if (state.view === 'profilo') mainHTML = renderProfiloView(u, db);
        else if (state.view === 'admin') mainHTML = renderAdminView(u, db);

        var notifDropdownHTML = state.notifOpen
            ? '<div class="notif-dropdown" role="region" aria-label="Notifiche">' +
                  '<div class="notif-head">' +
                      '<h3>Notifiche</h3>' +
                      '<button type="button" class="link-btn" id="mark-all-read-btn">Segna lette</button>' +
                  '</div>' +
                  '<div class="notif-list">' +
                      (db.notifications.length === 0
                          ? '<p style="font-size:0.84rem;color:var(--ink-soft);">Nessuna notifica al momento.</p>'
                          : db.notifications.slice(0, 10).map(function (n) {
                              var isUnread = (n.readBy || []).indexOf(u.id) === -1;
                              return (
                                  '<button type="button" class="notif-item ' + (isUnread ? 'unread' : '') + '" data-notif-id="' + esc(n.id) + '" data-notif-view="' + esc(n.targetView) + '">' +
                                      esc(n.message) +
                                      '<time>' + esc(formatDateTime(n.createdAt)) + '</time>' +
                                  '</button>'
                              );
                          }).join('')
                      ) +
                  '</div>' +
              '</div>'
            : '';

        var app = document.getElementById('app');
        app.innerHTML =
            '<div class="app-layout">' +
                '<aside class="sidebar ' + (state.sidebarOpen ? 'open' : '') + '" aria-label="Menu principale">' +
                    '<div>' +
                        '<div class="sidebar-brand">' + renderLogoHTML() + '</div>' +
                        '<nav class="sidebar-nav">' +
                            navItems.map(function (item) {
                                return (
                                    '<button type="button" class="nav-item ' + (state.view === item.id ? 'active' : '') + '" data-nav="' + esc(item.id) + '">' +
                                        item.icon +
                                        '<span>' + esc(item.label) + '</span>' +
                                        (item.badge ? '<span class="nav-badge">' + esc(item.badge) + '</span>' : '') +
                                    '</button>'
                                );
                            }).join('') +
                        '</nav>' +
                    '</div>' +
                    '<div class="sidebar-footer">' +
                        '<button type="button" class="nav-item" id="logout-btn">' +
                            ICONS.logout +
                            '<span>Esci</span>' +
                        '</button>' +
                    '</div>' +
                '</aside>' +

                '<div class="main-area">' +
                    '<header class="topbar">' +
                        '<button type="button" class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Apri menu">☰</button>' +
                        '<div class="topbar-right">' +
                            '<button type="button" class="icon-bell-btn" id="bell-btn" aria-label="Notifiche">' +
                                ICONS.bell +
                                (unreadNotifs.length > 0 ? '<span class="bell-count">' + unreadNotifs.length + '</span>' : '') +
                            '</button>' +
                            '<button type="button" class="avatar" id="topbar-profile-btn" aria-label="Profilo utente" style="padding:0;overflow:hidden;">' +
                                renderAvatar(u, '') +
                            '</button>' +
                            notifDropdownHTML +
                        '</div>' +
                    '</header>' +
                    '<main class="content-wrap">' + mainHTML + '</main>' +
                '</div>' +
            '</div>';

        bindDashboardEvents(u, db);
    }

    function bindDashboardEvents(u, db) {
        // Navigazione menu
        document.querySelectorAll('[data-nav]').forEach(function (el) {
            el.onclick = function () {
                state.view = el.getAttribute('data-nav');
                state.sidebarOpen = false;
                state.notifOpen = false;
                renderApp();
            };
        });

        var mobBtn = document.getElementById('mobile-menu-btn');
        if (mobBtn) mobBtn.onclick = function () { state.sidebarOpen = !state.sidebarOpen; renderApp(); };

        var logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.onclick = function () {
            API.logout();
            state.view = 'home';
            state.authTab = 'login';
            renderApp();
        };

        var bellBtn = document.getElementById('bell-btn');
        if (bellBtn) bellBtn.onclick = function () { state.notifOpen = !state.notifOpen; renderApp(); };

        var topProf = document.getElementById('topbar-profile-btn');
        if (topProf) topProf.onclick = function () { state.view = 'profilo'; renderApp(); };

        var markRead = document.getElementById('mark-all-read-btn');
        if (markRead) markRead.onclick = function () {
            db.notifications.forEach(function (n) {
                if ((n.readBy || []).indexOf(u.id) === -1) n.readBy.push(u.id);
            });
            saveDB(db);
            state.notifOpen = false;
            renderApp();
        };

        document.querySelectorAll('[data-notif-id]').forEach(function (btn) {
            btn.onclick = function () {
                var nid = btn.getAttribute('data-notif-id');
                var n = db.notifications.find(function (x) { return x.id === nid; });
                if (n && (n.readBy || []).indexOf(u.id) === -1) n.readBy.push(u.id);
                saveDB(db);
                state.view = btn.getAttribute('data-notif-view') || 'community';
                state.notifOpen = false;
                renderApp();
            };
        });

        // Verifica email immediata
        var verifyBtn = document.getElementById('verify-email-now-btn');
        if (verifyBtn) verifyBtn.onclick = function () {
            var found = db.users.find(function (x) { return x.id === u.id; });
            if (found) {
                found.emailVerified = true;
                found.verifyToken = null;
                saveDB(db);
                toast('Indirizzo email verificato con successo!');
                renderApp();
            }
        };

        // Modifica rapida spunto (Admin)
        var quickPrompt = document.getElementById('quick-edit-prompt-btn');
        if (quickPrompt) quickPrompt.onclick = function () { state.view = 'admin'; renderApp(); };

        // Apertura discussione da Home o Profilo
        document.querySelectorAll('[data-open-post]').forEach(function (btn) {
            btn.onclick = function () {
                state.view = 'community';
                state.communityFilter = 'all';
                renderApp();
            };
        });

        // Community: filtri e ordinamento
        document.querySelectorAll('[data-filter]').forEach(function (b) {
            b.onclick = function () { state.communityFilter = b.getAttribute('data-filter'); renderApp(); };
        });
        var sortSel = document.getElementById('community-sort');
        if (sortSel) sortSel.onchange = function () { state.communitySort = sortSel.value; renderApp(); };

        var rulesBtn1 = document.getElementById('open-rules-btn');
        var rulesBtn2 = document.getElementById('open-rules-btn-2');
        if (rulesBtn1) rulesBtn1.onclick = showCommunityRulesModal;
        if (rulesBtn2) rulesBtn2.onclick = showCommunityRulesModal;

        var newPostBtn = document.getElementById('new-post-btn');
        if (newPostBtn) newPostBtn.onclick = function () { showPostEditorModal(null); };

        // Azioni Admin sui post
        document.querySelectorAll('[data-publish-post]').forEach(function (b) {
            b.onclick = function () {
                API.updatePost(b.getAttribute('data-publish-post'), { status: 'published' });
                toast('Bozza approvata e pubblicata nella community!');
                renderApp();
            };
        });
        document.querySelectorAll('[data-pin-post]').forEach(function (b) {
            b.onclick = function () {
                var id = b.getAttribute('data-pin-post');
                var p = db.posts.find(function (x) { return x.id === id; });
                if (p) {
                    API.updatePost(id, { pinned: !p.pinned });
                    renderApp();
                }
            };
        });
        document.querySelectorAll('[data-edit-post]').forEach(function (b) {
            b.onclick = function () {
                var p = db.posts.find(function (x) { return x.id === b.getAttribute('data-edit-post'); });
                if (p) showPostEditorModal(p);
            };
        });
        document.querySelectorAll('[data-del-post]').forEach(function (b) {
            b.onclick = function () {
                API.deletePost(b.getAttribute('data-del-post'));
                toast('Discussione eliminata.');
                renderApp();
            };
        });

        // Like, Salva, Segnala Post
        document.querySelectorAll('[data-like-post]').forEach(function (b) {
            b.onclick = function () {
                var p = db.posts.find(function (x) { return x.id === b.getAttribute('data-like-post'); });
                if (!p) return;
                p.likes = p.likes || [];
                var idx = p.likes.indexOf(u.id);
                if (idx === -1) p.likes.push(u.id);
                else p.likes.splice(idx, 1);
                saveDB(db);
                renderApp();
            };
        });
        document.querySelectorAll('[data-save-post]').forEach(function (b) {
            b.onclick = function () {
                var p = db.posts.find(function (x) { return x.id === b.getAttribute('data-save-post'); });
                if (!p) return;
                p.saves = p.saves || [];
                var idx = p.saves.indexOf(u.id);
                if (idx === -1) { p.saves.push(u.id); toast('Discussione salvata nel tuo profilo.'); }
                else { p.saves.splice(idx, 1); toast('Discussione rimossa dalle salvate.'); }
                saveDB(db);
                renderApp();
            };
        });
        document.querySelectorAll('[data-focus-comment]').forEach(function (b) {
            b.onclick = function () {
                var form = document.querySelector('[data-comment-form="' + b.getAttribute('data-focus-comment') + '"] input');
                if (form) form.focus();
            };
        });

        // Invio commenti
        document.querySelectorAll('[data-comment-form]').forEach(function (form) {
            form.onsubmit = function (e) {
                e.preventDefault();
                var pid = form.getAttribute('data-comment-form');
                var input = form.elements.commentBody;
                try {
                    API.addComment(pid, input.value, form.getAttribute('data-parent-id') || null);
                    input.value = '';
                    form.removeAttribute('data-parent-id');
                    renderApp();
                } catch (err) {
                    toast(err.message);
                }
            };
        });

        // Azioni sui commenti
        document.querySelectorAll('[data-like-comment]').forEach(function (b) {
            b.onclick = function () {
                var c = db.comments.find(function (x) { return x.id === b.getAttribute('data-like-comment'); });
                if (!c) return;
                c.likes = c.likes || [];
                var idx = c.likes.indexOf(u.id);
                if (idx === -1) c.likes.push(u.id);
                else c.likes.splice(idx, 1);
                saveDB(db);
                renderApp();
            };
        });
        document.querySelectorAll('[data-reply-comment]').forEach(function (b) {
            b.onclick = function () {
                var cid = b.getAttribute('data-reply-comment');
                var pid = b.getAttribute('data-reply-post');
                var form = document.querySelector('[data-comment-form="' + pid + '"]');
                if (form) {
                    form.setAttribute('data-parent-id', cid);
                    form.elements.commentBody.placeholder = 'Scrivi una risposta al commento...';
                    form.elements.commentBody.focus();
                }
            };
        });
        document.querySelectorAll('[data-edit-comment]').forEach(function (b) {
            b.onclick = function () {
                var cid = b.getAttribute('data-edit-comment');
                var c = db.comments.find(function (x) { return x.id === cid; });
                if (!c) return;
                openModal(
                    '<div class="modal-head"><h2>Modifica il tuo commento</h2><button type="button" class="link-btn" id="modal-close-btn">Chiudi &times;</button></div>' +
                    '<form id="edit-comment-modal-form">' +
                        '<div class="form-group"><textarea id="ecm-body" class="textarea" required>' + esc(c.body) + '</textarea></div>' +
                        '<button type="submit" class="btn btn-primary btn-sm">Salva modifica</button>' +
                    '</form>'
                );
                document.getElementById('modal-close-btn').onclick = closeModal;
                document.getElementById('edit-comment-modal-form').onsubmit = function (e) {
                    e.preventDefault();
                    API.updateComment(cid, document.getElementById('ecm-body').value);
                    closeModal();
                    renderApp();
                };
            };
        });
        document.querySelectorAll('[data-del-comment]').forEach(function (b) {
            b.onclick = function () {
                API.deleteComment(b.getAttribute('data-del-comment'));
                toast('Commento eliminato.');
                renderApp();
            };
        });

        // Segnalazioni
        function openReportModal(targetType, targetId) {
            openModal(
                '<div class="modal-head"><h2>Segnala contenuto inappropriato</h2><button type="button" class="link-btn" id="modal-close-btn">Chiudi &times;</button></div>' +
                '<form id="report-modal-form">' +
                    '<div class="form-group">' +
                        '<label for="rep-reason">Motivo della segnalazione <span class="req">*</span></label>' +
                        '<textarea id="rep-reason" class="textarea" required placeholder="Indica il motivo della segnalazione..."></textarea>' +
                    '</div>' +
                    '<button type="submit" class="btn btn-primary btn-sm">Invia segnalazione</button>' +
                '</form>'
            );
            document.getElementById('modal-close-btn').onclick = closeModal;
            document.getElementById('report-modal-form').onsubmit = function (e) {
                e.preventDefault();
                var reason = document.getElementById('rep-reason').value.trim();
                if (reason.length < 3) return;
                db.reports.push({
                    id: uid(),
                    reporterId: u.id,
                    targetType: targetType,
                    targetId: targetId,
                    reason: reason,
                    status: 'open',
                    createdAt: new Date().toISOString()
                });
                saveDB(db);
                closeModal();
                toast('Segnalazione inviata all\'amministratrice.');
            };
        }
        document.querySelectorAll('[data-report-post]').forEach(function (b) {
            b.onclick = function () { openReportModal('post', b.getAttribute('data-report-post')); };
        });
        document.querySelectorAll('[data-report-comment]').forEach(function (b) {
            b.onclick = function () { openReportModal('comment', b.getAttribute('data-report-comment')); };
        });

        // Risorse: filtri e caricamento Admin
        var resCat = document.getElementById('res-cat-filter');
        if (resCat) resCat.onchange = function () { state.resourceCategory = resCat.value; renderApp(); };
        var resType = document.getElementById('res-type-filter');
        if (resType) resType.onchange = function () { state.resourceType = resType.value; renderApp(); };

        var newResBtn = document.getElementById('new-resource-btn');
        if (newResBtn) newResBtn.onclick = function () {
            openModal(
                '<div class="modal-head"><h2>Carica nuova risorsa gratuita</h2><button type="button" class="link-btn" id="modal-close-btn">Chiudi &times;</button></div>' +
                '<form id="new-res-form">' +
                    '<div class="form-group"><label>Titolo <span class="req">*</span></label><input type="text" id="nr-title" class="input" required></div>' +
                    '<div class="form-group"><label>Descrizione <span class="req">*</span></label><textarea id="nr-desc" class="textarea" required></textarea></div>' +
                    '<div class="form-row-2">' +
                        '<div class="form-group"><label>Categoria</label><select id="nr-cat" class="select">' + CATEGORIES.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join('') + '</select></div>' +
                        '<div class="form-group"><label>Tipologia</label><select id="nr-type" class="select">' + RESOURCE_TYPES.map(function (t) { return '<option value="' + esc(t) + '">' + esc(t) + '</option>'; }).join('') + '</select></div>' +
                    '</div>' +
                    '<div class="form-group"><label>Link al file PDF o Video YouTube <span class="req">*</span></label><input type="url" id="nr-url" class="input" placeholder="https://..." required></div>' +
                    '<button type="submit" class="btn btn-primary btn-sm">Pubblica risorsa</button>' +
                '</form>'
            );
            document.getElementById('modal-close-btn').onclick = closeModal;
            document.getElementById('new-res-form').onsubmit = function (e) {
                e.preventDefault();
                requireAdmin();
                db.resources.unshift({
                    id: uid(),
                    title: document.getElementById('nr-title').value.trim(),
                    description: document.getElementById('nr-desc').value.trim(),
                    category: document.getElementById('nr-cat').value,
                    resourceType: document.getElementById('nr-type').value,
                    fileUrl: document.getElementById('nr-url').value.trim(),
                    createdAt: new Date().toISOString()
                });
                pushNotification(db, 'resources', 'Nuova risorsa gratuita disponibile in biblioteca!', 'risorse');
                saveDB(db);
                closeModal();
                toast('Risorsa pubblicata.');
                renderApp();
            };
        };

        document.querySelectorAll('[data-del-resource]').forEach(function (b) {
            b.onclick = function () {
                requireAdmin();
                db.resources = db.resources.filter(function (r) { return r.id !== b.getAttribute('data-del-resource'); });
                saveDB(db);
                renderApp();
            };
        });

        // Eventi: creazione Admin
        var newEvBtn = document.getElementById('new-event-btn');
        if (newEvBtn) newEvBtn.onclick = function () {
            openModal(
                '<div class="modal-head"><h2>Pubblica nuovo evento gratuito</h2><button type="button" class="link-btn" id="modal-close-btn">Chiudi &times;</button></div>' +
                '<form id="new-ev-form">' +
                    '<div class="form-group"><label>Titolo <span class="req">*</span></label><input type="text" id="ne-title" class="input" required></div>' +
                    '<div class="form-group"><label>Descrizione <span class="req">*</span></label><textarea id="ne-desc" class="textarea" required></textarea></div>' +
                    '<div class="form-row-2">' +
                        '<div class="form-group"><label>Data <span class="req">*</span></label><input type="date" id="ne-date" class="input" required></div>' +
                        '<div class="form-group"><label>Ora <span class="req">*</span></label><input type="text" id="ne-time" class="input" placeholder="20:30" required></div>' +
                    '</div>' +
                    '<div class="form-group"><label>Link di partecipazione (Zoom / Meet)</label><input type="url" id="ne-url" class="input" placeholder="https://..."></div>' +
                    '<button type="submit" class="btn btn-primary btn-sm">Pubblica evento</button>' +
                '</form>'
            );
            document.getElementById('modal-close-btn').onclick = closeModal;
            document.getElementById('new-ev-form').onsubmit = function (e) {
                e.preventDefault();
                requireAdmin();
                db.events.push({
                    id: uid(),
                    title: document.getElementById('ne-title').value.trim(),
                    description: document.getElementById('ne-desc').value.trim(),
                    eventDate: document.getElementById('ne-date').value,
                    eventTime: document.getElementById('ne-time').value.trim(),
                    joinUrl: document.getElementById('ne-url').value.trim(),
                    createdAt: new Date().toISOString()
                });
                pushNotification(db, 'events', 'Nuovo evento gratuito in programma!', 'eventi');
                saveDB(db);
                closeModal();
                toast('Evento pubblicato.');
                renderApp();
            };
        };

        document.querySelectorAll('[data-del-event]').forEach(function (b) {
            b.onclick = function () {
                requireAdmin();
                db.events = db.events.filter(function (ev) { return ev.id !== b.getAttribute('data-del-event'); });
                saveDB(db);
                renderApp();
            };
        });

        // Profilo: salvataggio, foto, password, assistenza, eliminazione
        var profForm = document.getElementById('profile-form');
        if (profForm) {
            profForm.onsubmit = function (e) {
                e.preventDefault();
                var found = db.users.find(function (x) { return x.id === u.id; });
                if (!found) return;
                found.firstName = document.getElementById('prof-nome').value.trim();
                found.lastName = document.getElementById('prof-cognome').value.trim();
                found.bio = document.getElementById('prof-bio').value.trim();
                found.updatedAt = new Date().toISOString();
                saveDB(db);
                toast('Profilo aggiornato con successo.');
                renderApp();
            };
        }

        var avatarFile = document.getElementById('avatar-file');
        if (avatarFile) {
            avatarFile.onchange = function () {
                var file = avatarFile.files && avatarFile.files[0];
                if (!file) return;
                var reader = new FileReader();
                reader.onload = function () {
                    var found = db.users.find(function (x) { return x.id === u.id; });
                    if (found) {
                        found.avatarUrl = reader.result;
                        saveDB(db);
                        toast('Foto profilo aggiornata.');
                        renderApp();
                    }
                };
                reader.readAsDataURL(file);
            };
        }

        var notifForm = document.getElementById('notif-prefs-form');
        if (notifForm) {
            notifForm.onsubmit = function (e) {
                e.preventDefault();
                var found = db.users.find(function (x) { return x.id === u.id; });
                if (!found) return;
                found.notifications = {
                    posts: document.getElementById('np-posts').checked,
                    replies: document.getElementById('np-replies').checked,
                    events: document.getElementById('np-events').checked,
                    resources: document.getElementById('np-resources').checked,
                    admin: document.getElementById('np-admin').checked
                };
                found.marketingConsent = document.getElementById('np-marketing').checked;
                saveDB(db);
                toast('Preferenze notifiche salvate.');
            };
        }

        var passForm = document.getElementById('change-pass-form');
        if (passForm) {
            passForm.onsubmit = async function (e) {
                e.preventDefault();
                var oldP = document.getElementById('cp-old').value;
                var newP = document.getElementById('cp-new').value;
                if (newP.length < 8) { toast('La nuova password deve avere almeno 8 caratteri.'); return; }
                var found = db.users.find(function (x) { return x.id === u.id; });
                var ok = await verifyPassword(oldP, found.passwordSalt, found.passwordHash);
                if (!ok) { toast('La password attuale non è corretta.'); return; }
                var secured = await hashPassword(newP);
                found.passwordHash = secured.hash;
                found.passwordSalt = secured.salt;
                saveDB(db);
                passForm.reset();
                toast('Password aggiornata con successo.');
            };
        }

        var supForm = document.getElementById('support-form');
        if (supForm) {
            supForm.onsubmit = function (e) {
                e.preventDefault();
                var btn = document.getElementById('sup-submit-btn');
                btn.disabled = true;
                btn.textContent = 'Invio in corso...';
                fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({
                        access_key: CFG.WEB3FORMS_KEY || 'eafc21eb-6115-41ca-b86d-e1d693fabb91',
                        subject: '[Supporto F.G. Academy] ' + document.getElementById('sup-subject').value.trim(),
                        from_name: u.firstName + ' ' + u.lastName,
                        email: u.email,
                        message: document.getElementById('sup-msg').value.trim()
                    })
                })
                .then(function (r) { return r.json(); })
                .then(function () {
                    supForm.reset();
                    btn.disabled = false;
                    btn.textContent = 'Invia richiesta di supporto';
                    toast('Richiesta inviata al supporto tecnico.');
                })
                .catch(function () {
                    btn.disabled = false;
                    btn.textContent = 'Invia richiesta di supporto';
                    toast('Errore di rete durante l\'invio. Riprova.');
                });
            };
        }

        var delAccBtn = document.getElementById('delete-account-btn');
        if (delAccBtn) {
            delAccBtn.onclick = function () {
                openModal(
                    '<div class="modal-head"><h2>Conferma eliminazione account</h2><button type="button" class="link-btn" id="modal-close-btn">Annulla &times;</button></div>' +
                    '<p style="font-size:0.92rem;color:var(--ink-soft);margin-bottom:1.2rem;">Sei sicuro/a di voler eliminare definitivamente il tuo account F.G. Academy e tutti i tuoi dati personali? Questa operazione non può essere annullata.</p>' +
                    '<div style="display:flex;gap:0.6rem;justify-content:flex-end;">' +
                        '<button type="button" class="btn btn-danger btn-sm" id="confirm-delete-account-btn">Sì, elimina definitivamente</button>' +
                    '</div>'
                );
                document.getElementById('modal-close-btn').onclick = closeModal;
                document.getElementById('confirm-delete-account-btn').onclick = function () {
                    db.users = db.users.filter(function (x) { return x.id !== u.id; });
                    db.comments = db.comments.filter(function (c) { return c.userId !== u.id; });
                    saveDB(db);
                    localStorage.removeItem(SESSION_KEY);
                    closeModal();
                    toast('Il tuo account è stato eliminato.');
                    renderApp();
                };
            };
        }

        // Admin: salvataggio Spunto della settimana, segnalazioni, sospensione utenti
        var adminPromptForm = document.getElementById('admin-prompt-form');
        if (adminPromptForm) {
            adminPromptForm.onsubmit = function (e) {
                e.preventDefault();
                requireAdmin();
                db.weeklyPrompt = {
                    text: document.getElementById('admin-prompt-text').value.trim(),
                    updatedAt: new Date().toISOString()
                };
                saveDB(db);
                toast('Spunto della settimana aggiornato!');
                renderApp();
            };
        }

        document.querySelectorAll('[data-resolve-report]').forEach(function (b) {
            b.onclick = function () {
                requireAdmin();
                var rep = db.reports.find(function (r) { return r.id === b.getAttribute('data-resolve-report'); });
                if (rep) rep.status = 'resolved';
                saveDB(db);
                renderApp();
            };
        });

        document.querySelectorAll('[data-approve-user]').forEach(function (b) {
            b.onclick = function () {
                try {
                    var target = API.approveUser(b.getAttribute('data-approve-user'));
                    toast('Accesso confermato per ' + target.firstName + ' ' + target.lastName + '!');
                    renderApp();
                } catch (err) {
                    toast(err.message);
                }
            };
        });

        document.querySelectorAll('[data-reject-user]').forEach(function (b) {
            b.onclick = function () {
                try {
                    var target = API.rejectUser(b.getAttribute('data-reject-user'));
                    toast('Richiesta di ' + target.firstName + ' rifiutata.');
                    renderApp();
                } catch (err) {
                    toast(err.message);
                }
            };
        });

        document.querySelectorAll('[data-toggle-suspend]').forEach(function (b) {
            b.onclick = function () {
                requireAdmin();
                var target = db.users.find(function (x) { return x.id === b.getAttribute('data-toggle-suspend'); });
                if (target && target.role !== 'admin') {
                    target.suspended = !target.suspended;
                    saveDB(db);
                    toast(target.suspended ? 'Utente sospeso.' : 'Utente riattivato.');
                    renderApp();
                }
            };
        });
    }

    // Avvio applicazione
    document.addEventListener('DOMContentLoaded', function () {
        renderApp();
    });
})();
