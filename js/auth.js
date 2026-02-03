/* ========== AUTHENTICATION FUNCTIONS ========== */
let currentUser = null;

// Form Management Functions
function showLoginForm() {
  document.getElementById('loginFormContainer').style.display = 'block';
  document.getElementById('signupFormContainer').style.display = 'none';
  document.getElementById('resetPasswordFormContainer').style.display = 'none';
  
  clearMessages();
  document.getElementById('loginForm').reset();
}

function showSignupForm() {
  document.getElementById('loginFormContainer').style.display = 'none';
  document.getElementById('signupFormContainer').style.display = 'block';
  document.getElementById('resetPasswordFormContainer').style.display = 'none';
  
  clearMessages();
  document.getElementById('signupForm').reset();
}

function showResetPassword() {
  document.getElementById('loginFormContainer').style.display = 'none';
  document.getElementById('signupFormContainer').style.display = 'none';
  document.getElementById('resetPasswordFormContainer').style.display = 'block';
  
  clearMessages();
  document.getElementById('resetPasswordForm').reset();
}

function clearMessages() {
  const messages = ['loginError', 'loginSuccess', 'loginInfo', 
                   'signupError', 'signupSuccess', 
                   'resetError', 'resetSuccess', 'resetInfo'];
  
  messages.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = 'none';
      element.textContent = '';
    }
  });
}

function showMessage(elementId, message, isError = false) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
    element.style.display = 'block';
    element.style.color = isError ? '#f44336' : '#4CAF50';
    element.style.background = isError ? '#ffebee' : '#e8f5e9';
    
    if (!isError) {
      setTimeout(() => {
        element.style.display = 'none';
      }, 5000);
    }
  }
}

function showInfo(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
    element.style.display = 'block';
    element.style.color = '#666';
    element.style.background = '#f5f5f5';
  }
}

// Authentication Functions
async function handleLogin(email, password) {
  try {
    const loginSubmit = document.getElementById('loginSubmit');
    loginSubmit.disabled = true;
    loginSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> লগ ইন কৰি আছে...';

    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    currentUser = userCredential.user;
    showMessage('loginSuccess', 'লগ ইন সফল!');
    
    initializeSupabase();
    
    setTimeout(() => {
      showApp();
    }, 1000);

  } catch (error) {
    console.error("Login error:", error);
    let errorMessage = "লগ ইন কৰোতে সমস্যা হৈছে।";
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = "ইমেইলটো পোৱা নগ'ল। নতুন একাউণ্ট খোলক।";
        break;
      case 'auth/wrong-password':
        errorMessage = "পাছৱৰ্ডটো ভুল হ'ব পাৰে। পাছৱৰ্ড পাহৰিলে পুনৰুদ্ধাৰ কৰক।";
        break;
      case 'auth/invalid-email':
        errorMessage = "বৈধ ইমেইল নহয়।";
        break;
      case 'auth/user-disabled':
        errorMessage = "এই একাউণ্টটো নিষ্ক্ৰিয় কৰা হৈছে।";
        break;
      case 'auth/too-many-requests':
        errorMessage = "অনেকবাৰ চেষ্টা কৰা হৈছে। কিছুসময়ৰ পিছত পুনৰ চেষ্টা কৰক।";
        break;
    }
    
    showMessage('loginError', errorMessage, true);
  } finally {
    const loginSubmit = document.getElementById('loginSubmit');
    loginSubmit.disabled = false;
    loginSubmit.innerHTML = '<i class="fas fa-sign-in-alt"></i> লগ ইন';
  }
}

async function handleSignup(name, email, password, confirmPassword) {
  if (password !== confirmPassword) {
    showMessage('signupError', "পাছৱৰ্ড দুটা একে নহয়!", true);
    return;
  }

  if (password.length < 6) {
    showMessage('signupError', "পাছৱৰ্ড কমেও ৬ আখৰ হ'ব লাগিব!", true);
    return;
  }

  try {
    const signupSubmit = document.getElementById('signupSubmit');
    signupSubmit.disabled = true;
    signupSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> একাউণ্ট খোলা হৈ আছে...';

    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    currentUser = userCredential.user;
    
    if (name) {
      await currentUser.updateProfile({
        displayName: name
      });
    }
    
    initializeSupabase();
    
    showMessage('signupSuccess', 'একাউণ্ট সফলভাৱে খোলা হৈছে! আপোনাক স্বয়ংক্ৰিয়ভাৱে লগ ইন কৰা হৈছে।');
    
    setTimeout(() => {
      showApp();
    }, 2000);

  } catch (error) {
    console.error("Signup error:", error);
    let errorMessage = "একাউণ্ট খোলোতে সমস্যা হৈছে।";
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = "ইমেইলটো ইতিমধ্যে ব্যৱহাৰ কৰা হৈছে। লগ ইন কৰক বা অন্য ইমেইল ব্যৱহাৰ কৰক।";
        break;
      case 'auth/invalid-email':
        errorMessage = "বৈধ ইমেইল নহয়।";
        break;
      case 'auth/weak-password':
        errorMessage = "পাছৱৰ্ডটো দুর্বল। আৰু শক্তিশালী পাছৱৰ্ড ব্যৱহাৰ কৰক।";
        break;
      case 'auth/operation-not-allowed':
        errorMessage = "এমেইল/পাছৱৰ্ডৰ দ্বাৰা ৰেজিষ্ট্ৰেশন বৰ্তমান সক্ৰিয় নাই।";
        break;
    }
    
    showMessage('signupError', errorMessage, true);
  } finally {
    const signupSubmit = document.getElementById('signupSubmit');
    signupSubmit.disabled = false;
    signupSubmit.innerHTML = '<i class="fas fa-user-plus"></i> একাউণ্ট খোলক';
  }
}

async function handlePasswordReset(email) {
  try {
    const resetSubmit = document.getElementById('resetSubmit');
    resetSubmit.disabled = true;
    resetSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> প্ৰেৰণ কৰি আছে...';

    showInfo('resetInfo', 'প্ৰক্ৰিয়াটো চলি আছে... অনুগ্ৰহ কৰি অপেক্ষা কৰক।');
    
    await auth.sendPasswordResetEmail(email);
    
    showMessage('resetSuccess', 'পাছৱৰ্ড ৰিসেট লিংক আপোনাৰ ইমেইলত প্ৰেৰণ কৰা হৈছে! অনুগ্ৰহ কৰি আপোনাৰ ইমেইল চেক কৰক।');
    
    document.getElementById('resetPasswordForm').reset();
    
    setTimeout(() => {
      const infoElement = document.getElementById('resetInfo');
      if (infoElement) infoElement.style.display = 'none';
    }, 1000);
    
    setTimeout(() => {
      showLoginForm();
    }, 5000);

  } catch (error) {
    console.error("Password reset error:", error);
    let errorMessage = "পাছৱৰ্ড ৰিসেট কৰোতে সমস্যা হৈছে।";
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = "এই ইমেইলৰ সৈতে কোনো একাউণ্ট পোৱা নগ'ল।";
        break;
      case 'auth/invalid-email':
        errorMessage = "বৈধ ইমেইল নহয়।";
        break;
      case 'auth/missing-email':
        errorMessage = "অনুগ্ৰহ কৰি ইমেইলটো লিখক।";
        break;
      case 'auth/too-many-requests':
        errorMessage = "অনেকবাৰ চেষ্টা কৰা হৈছে। কিছুসময়ৰ পিছত পুনৰ চেষ্টা কৰক।";
        break;
      default:
        errorMessage = "অনুগ্রহ করে পুনরায় চেষ্টা করুন।";
    }
    
    showMessage('resetError', errorMessage, true);
  } finally {
    const resetSubmit = document.getElementById('resetSubmit');
    resetSubmit.disabled = false;
    resetSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> ৰিসেট লিংক প্ৰেৰণ কৰক';
  }
}

async function handleLogout() {
  try {
    const logoutBtn = document.querySelector('.logout-btn');
    const originalText = logoutBtn.innerHTML;
    logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> লগ আউট কৰি আছে...';
    logoutBtn.disabled = true;
    
    await auth.signOut();
    
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'flex';
    showLoginForm();
    
    showMessage('loginSuccess', 'সফলভাৱে লগ আউট কৰা হৈছে।');
    
  } catch (error) {
    console.error("Logout error:", error);
    showMessage('loginError', "লগ আউট কৰোতে সমস্যা হৈছে।", true);
  } finally {
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
      logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> লগ আউট';
      logoutBtn.disabled = false;
    }
  }
}

function showApp() {
  const userName = document.getElementById('userName');
  const userEmail = document.getElementById('userEmail');
  
  if (userName) {
    userName.textContent = currentUser.displayName || "ছাত্ৰ/ছাত্ৰী";
  }
  
  if (userEmail) {
    userEmail.textContent = currentUser.email;
  }
  
  document.getElementById('loginContainer').style.display = 'none';
  document.getElementById('appContainer').style.display = 'block';
  
  initializeMainApp();
  
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

// Firebase Auth State Listener
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    showApp();
  } else {
    currentUser = null;
  }
});

// Event Listeners for Forms
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const resetForm = document.getElementById('resetPasswordForm');
  
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      handleLogin(email, password);
    });
  }
  
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('signupName').value;
      const email = document.getElementById('signupEmail').value;
      const password = document.getElementById('signupPassword').value;
      const confirmPassword = document.getElementById('signupConfirmPassword').value;
      handleSignup(name, email, password, confirmPassword);
    });
  }
  
  if (resetForm) {
    resetForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('resetEmail').value;
      handlePasswordReset(email);
    });
  }
});

// Export for use in other files
window.showLoginForm = showLoginForm;
window.showSignupForm = showSignupForm;
window.showResetPassword = showResetPassword;
window.handleLogout = handleLogout;
window.currentUser = currentUser;
