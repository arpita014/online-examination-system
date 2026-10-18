document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  auth.onAuthStateChanged(async (user) => {
    if (!user) return;
    const isAuthPage = window.location.pathname.includes('login.html') ||
      window.location.pathname.includes('register.html') ||
      window.location.pathname.endsWith('/') ||
      window.location.pathname.endsWith('index.html');

    if (isAuthPage) {
      try {
        const doc = await db.collection('users').doc(user.uid).get();
        if (doc.exists) {
          Utils.redirectByRole(doc.data().role);
        }
      } catch (error) {
        console.error(error);
      }
    }
  });

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      if (!Utils.validateEmail(email)) {
        Utils.showToast('Please enter a valid email', 'error');
        return;
      }

      submitBtn.disabled = true;
      Utils.showLoading(true);

      try {
        const credential = await auth.signInWithEmailAndPassword(email, password);
        const doc = await db.collection('users').doc(credential.user.uid).get();

        if (!doc.exists) {
          throw new Error('User profile not found');
        }

        const userData = doc.data();
        if (userData.status === 'inactive') {
          await auth.signOut();
          throw new Error('Your account is inactive. Contact admin.');
        }

        Utils.showToast('Login successful!', 'success');
        setTimeout(() => Utils.redirectByRole(userData.role), 500);
      } catch (error) {
        let message = 'Login failed. Please try again.';
        if (
          error.code === 'auth/user-not-found' ||
          error.code === 'auth/wrong-password' ||
          error.code === 'auth/invalid-credential'
        ) {
          message = 'Invalid email or password';
        }
        Utils.showToast(message, 'error');
      } finally {
        submitBtn.disabled = false;
        Utils.showLoading(false);
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fullName = document.getElementById('fullName').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const course = document.getElementById('course').value.trim();
      const college = document.getElementById('college').value.trim();
      const submitBtn = registerForm.querySelector('button[type="submit"]');

      if (!fullName || !email || !password || !course || !college) {
        Utils.showToast('All fields are required', 'error');
        return;
      }

      if (!Utils.validateEmail(email)) {
        Utils.showToast('Please enter a valid email', 'error');
        return;
      }

      if (password.length < 6) {
        Utils.showToast('Password must be at least 6 characters', 'error');
        return;
      }

      if (password !== confirmPassword) {
        Utils.showToast('Passwords do not match', 'error');
        return;
      }

      submitBtn.disabled = true;
      Utils.showLoading(true);

      try {
        const credential = await auth.createUserWithEmailAndPassword(email, password);

        await db.collection('users').doc(credential.user.uid).set({
          fullName,
          email,
          course,
          college,
          role: 'student',
          status: 'active',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        Utils.showToast('Registration successful! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = 'student/dashboard.html';
        }, 1000);
      } catch (error) {
        let message = 'Registration failed. Please try again.';
        if (error.code === 'auth/email-already-in-use') {
          message = 'Email is already registered';
        } else if (error.code === 'auth/weak-password') {
          message = 'Password is too weak';
        }
        Utils.showToast(message, 'error');
      } finally {
        submitBtn.disabled = false;
        Utils.showLoading(false);
      }
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await auth.signOut();
        Utils.showToast('Logged out successfully', 'success');
        setTimeout(() => {
          window.location.href = '../login.html';
        }, 500);
      } catch (error) {
        Utils.showToast('Logout failed', 'error');
      }
    });
  }
});
