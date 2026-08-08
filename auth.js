// ==================== تسجيل الدخول / إنشاء حساب ====================

function setMsg(el, text, ok=false){
  if(!el) return;
  el.textContent = text;
  el.className = 'form-msg ' + (ok ? 'ok' : 'err');
}

// ---------- تسجيل حساب جديد ----------
const registerForm = document.getElementById('registerForm');
if(registerForm){
  registerForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const name  = document.getElementById('regName').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass  = document.getElementById('regPass').value;
    const msg   = document.getElementById('registerMsg');
    const btn   = registerForm.querySelector('button[type=submit]');

    if(name.length < 3){ return setMsg(msg,'من فضلك اكتب الاسم كامل'); }
    if(pass.length < 6){ return setMsg(msg,'كلمة السر لازم تكون 6 حروف/أرقام على الأقل'); }

    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
    try{
      const cred = await auth.createUserWithEmailAndPassword(email, pass);
      await cred.user.updateProfile({displayName:name});
      await db.collection('users').doc(cred.user.uid).set({
        name, phone, email,
        role:'student',
        enrolledCourses:[],
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      setMsg(msg,'تم إنشاء الحساب بنجاح، جاري تحويلك...', true);
      setTimeout(()=> window.location.href = 'dashboard.html', 800);
    }catch(err){
      setMsg(msg, translateAuthError(err.code));
    }finally{
      btn.disabled = false; btn.innerHTML = 'إنشاء الحساب';
    }
  });
}

// ---------- تسجيل الدخول ----------
const loginForm = document.getElementById('loginForm');
if(loginForm){
  loginForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pass  = document.getElementById('loginPass').value;
    const msg   = document.getElementById('loginMsg');
    const btn   = loginForm.querySelector('button[type=submit]');

    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
    try{
      await auth.signInWithEmailAndPassword(email, pass);
      setMsg(msg,'تم الدخول بنجاح، جاري تحويلك...', true);
      setTimeout(()=> window.location.href = 'dashboard.html', 600);
    }catch(err){
      setMsg(msg, translateAuthError(err.code));
    }finally{
      btn.disabled = false; btn.innerHTML = 'دخول';
    }
  });
}

// ---------- تسجيل الخروج ----------
document.querySelectorAll('[data-logout]').forEach(btn=>{
  btn.addEventListener('click', async ()=>{
    await auth.signOut();
    window.location.href = 'index.html';
  });
});

// ---------- تحديث الناف بار حسب حالة الدخول ----------
auth.onAuthStateChanged((user)=>{
  const guestBtns = document.querySelectorAll('[data-guest-only]');
  const userBtns  = document.querySelectorAll('[data-user-only]');
  guestBtns.forEach(el=> el.classList.toggle('hidden', !!user));
  userBtns.forEach(el=> el.classList.toggle('hidden', !user));

  const nameEls = document.querySelectorAll('[data-user-name]');
  if(user){
    nameEls.forEach(el=> el.textContent = user.displayName || 'طالب');
  }

  // حماية صفحة الداشبورد
  if(document.body.dataset.protected === 'student' && !user){
    window.location.href = 'index.html';
  }
});

function translateAuthError(code){
  const map = {
    'auth/email-already-in-use':'الإيميل ده متسجل قبل كده، جرّب تسجيل الدخول',
    'auth/invalid-email':'صيغة الإيميل مش صحيحة',
    'auth/weak-password':'كلمة السر ضعيفة، لازم 6 حروف على الأقل',
    'auth/user-not-found':'مفيش حساب بالإيميل ده',
    'auth/wrong-password':'كلمة السر غلط',
    'auth/invalid-credential':'بيانات الدخول غلط، تأكد من الإيميل وكلمة السر',
    'auth/too-many-requests':'محاولات كتير غلط، حاول تاني بعد شوية'
  };
  return map[code] || 'حصل خطأ، حاول تاني';
}
