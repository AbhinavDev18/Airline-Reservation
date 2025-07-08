// Auth references
const auth = firebase.auth();
const loginLink = document.getElementById('login-link');
const logoutLink = document.getElementById('logout-link');
const dashboardLink = document.getElementById('dashboard-link');

// Check authentication state on page load
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        console.log('User is signed in:', user.email);
        updateUIForAuthenticatedUser(user);
    } else {
        // User is signed out
        console.log('User is signed out');
        updateUIForUnauthenticatedUser();
    }
});

// Update UI for authenticated user
function updateUIForAuthenticatedUser(user) {
    if (loginLink) loginLink.style.display = 'none';
    if (logoutLink) logoutLink.style.display = 'block';
    if (dashboardLink) dashboardLink.style.display = 'block';

    // Store user data in local storage for easy access
    localStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0]
    }));
}

// Update UI for unauthenticated user
function updateUIForUnauthenticatedUser() {
    if (loginLink) loginLink.style.display = 'block';
    if (logoutLink) logoutLink.style.display = 'none';
    if (dashboardLink) dashboardLink.style.display = 'none';

    // Clear user data from local storage
    localStorage.removeItem('user');
}

// Sign up with email and password
function signUp(email, password, displayName) {
    return auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Update the user's profile
            return userCredential.user.updateProfile({
                displayName: displayName
            }).then(() => {
                // Create user document in Firestore
                return db.collection('users').doc(userCredential.user.uid).set({
                    email: email,
                    displayName: displayName,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }).then(() => {
                console.log('User profile updated and document created');
                return userCredential.user;
            });
        });
}

// Sign in with email and password
function signIn(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
}

// Sign in with Google
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    return auth.signInWithPopup(provider)
        .then((result) => {
            // Check if it's a new user
            const isNewUser = result.additionalUserInfo.isNewUser;
            if (isNewUser) {
                // Create user document in Firestore
                return db.collection('users').doc(result.user.uid).set({
                    email: result.user.email,
                    displayName: result.user.displayName,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => {
                    console.log('New Google user document created');
                    return result.user;
                });
            }
            return result.user;
        });
}

// Sign out
function signOut() {
    return auth.signOut();
}

// Check if a user is logged in and redirect if not
function requireAuth() {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged(user => {
            if (user) {
                resolve(user);
            } else {
                window.location.href = 'login.html';
                reject(new Error('Authentication required'));
            }
        });
    });
}

// Set up the logout functionality
if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        signOut()
            .then(() => {
                window.location.href = 'index.html';
            })
            .catch((error) => {
                console.error('Error signing out:', error);
            });
    });
}
