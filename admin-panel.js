// ==================== لوحة تحكم الأدمن ====================

const loginScreen = document.getElementById('adminLoginScreen');
const adminApp = document.getElementById('adminApp');

// ---------- دخول الأدمن ----------
document.getElementById('adminLoginForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const email = document.getElementById('adminEmail').value.trim();
  const pass  = document.getElementById('adminPass').value;
  const msg   = document.getElementById('adminLoginMsg');
  try{
    await auth.signInWithEmailAndPassword(email, pass);
    // التحقق هيتم في onAuthStateChanged
  }catch(err){
    setMsg(msg, 'بيانات الدخول غلط');
  }
});

auth.onAuthStateChanged(async (user)=>{
  if(!user){
    loginScreen.style.display = 'flex';
    adminApp.style.display = 'none';
    return;
  }
  // التأكد إن اليوزر ده أدمن فعلاً من مجموعة admins
  try{
    const adminDoc = await db.collection('admins').doc(user.uid).get();
    if(!adminDoc.exists){
      setMsg(document.getElementById('adminLoginMsg'), 'الحساب ده مش عنده صلاحية دخول اللوحة');
      await auth.signOut();
      return;
    }
    loginScreen.style.display = 'none';
    adminApp.classList.remove('hidden');
    adminApp.style.display = 'flex';
    initAdminApp();
  }catch(err){
    console.warn(err);
    await auth.signOut();
  }
});

let adminInitialized = false;
function initAdminApp(){
  if(adminInitialized) return; // تحميل مرة واحدة فقط
  adminInitialized = true;

  // التنقل بين الأقسام
  document.querySelectorAll('.admin-nav-item[data-panel]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.admin-nav-item[data-panel]').forEach(b=> b.classList.remove('active'));
      document.querySelectorAll('.admin-panel').forEach(p=> p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.panel).classList.add('active');
    });
  });

  loadOverview();
  loadSiteContentAdmin();
  loadCoursesAdmin();
  loadTeachersAdmin();
  loadRequestsAdmin();
  loadStudentsAdmin();
  loadTestimonialsAdmin();
}

document.querySelectorAll('[data-logout]').forEach(btn=>{
  btn.addEventListener('click', ()=> auth.signOut());
});

// ==================== نظرة عامة ====================
async function loadOverview(){
  const [courses, teachers, students, requests] = await Promise.all([
    db.collection('courses').get(),
    db.collection('teachers').get(),
    db.collection('users').where('role','==','student').get(),
    db.collection('enrollmentRequests').where('status','==','pending').get()
  ]);
  document.getElementById('ovCourses').textContent = courses.size;
  document.getElementById('ovTeachers').textContent = teachers.size;
  document.getElementById('ovStudents').textContent = students.size;
  document.getElementById('ovPending').textContent = requests.size;
}

// ==================== محتوى الصفحة الرئيسية ====================
async function loadSiteContentAdmin(){
  const doc = await db.collection('siteContent').doc('home').get();
  const d = doc.exists ? doc.data() : {};
  document.getElementById('scHeroTitle').value = d.heroTitle || '';
  document.getElementById('scHeroHighlight').value = d.heroHighlight || '';
  document.getElementById('scHeroLead').value = d.heroLead || '';
  document.getElementById('scStat1Num').value = d.stat1Num || '';
  document.getElementById('scStat1Label').value = d.stat1Label || '';
  document.getElementById('scStat2Num').value = d.stat2Num || '';
  document.getElementById('scStat2Label').value = d.stat2Label || '';
  document.getElementById('scStat3Num').value = d.stat3Num || '';
  document.getElementById('scStat3Label').value = d.stat3Label || '';
  document.getElementById('scWhatsapp').value = d.whatsapp || '';
  document.getElementById('scFooterDesc').value = d.footerDesc || '';
  document.getElementById('scFacebook').value = d.facebook || '';
  document.getElementById('scInstagram').value = d.instagram || '';
  document.getElementById('scYoutube').value = d.youtube || '';
  document.getElementById('scTiktok').value = d.tiktok || '';
}

document.getElementById('siteContentForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const msg = document.getElementById('scMsg');
  try{
    await db.collection('siteContent').doc('home').set({
      heroTitle: document.getElementById('scHeroTitle').value,
      heroHighlight: document.getElementById('scHeroHighlight').value,
      heroLead: document.getElementById('scHeroLead').value,
      stat1Num: document.getElementById('scStat1Num').value,
      stat1Label: document.getElementById('scStat1Label').value,
      stat2Num: document.getElementById('scStat2Num').value,
      stat2Label: document.getElementById('scStat2Label').value,
      stat3Num: document.getElementById('scStat3Num').value,
      stat3Label: document.getElementById('scStat3Label').value,
      whatsapp: document.getElementById('scWhatsapp').value.trim(),
      footerDesc: document.getElementById('scFooterDesc').value.trim(),
      facebook: document.getElementById('scFacebook').value.trim(),
      instagram: document.getElementById('scInstagram').value.trim(),
      youtube: document.getElementById('scYoutube').value.trim(),
      tiktok: document.getElementById('scTiktok').value.trim(),
    }, {merge:true});
    setMsg(msg,'تم الحفظ بنجاح', true);
  }catch(err){ setMsg(msg,'حصل خطأ، حاول تاني'); }
});

// ==================== الكورسات ====================
let lessonCount = 0;
function addLessonRow(title='', url=''){
  lessonCount++;
  const box = document.getElementById('lessonsList');
  const row = document.createElement('div');
  row.className = 'lesson-row';
  row.innerHTML = `
    <input type="text" placeholder="اسم الدرس" class="lesson-title" value="${escapeHtml(title)}">
    <input type="text" placeholder="رابط الفيديو" class="lesson-url" value="${escapeHtml(url)}">
    <button type="button" class="icon-btn danger" onclick="this.parentElement.remove()">حذف</button>
  `;
  box.appendChild(row);
}

function openCourseModal(id=null, data=null){
  document.getElementById('courseForm').reset();
  document.getElementById('lessonsList').innerHTML = '';
  document.getElementById('courseId').value = id || '';
  document.getElementById('courseModalTitle').textContent = id ? 'تعديل الكورس' : 'كورس جديد';
  if(data){
    document.getElementById('cTitle').value = data.title || '';
    document.getElementById('cStage').value = data.stage || '';
    document.getElementById('cPrice').value = data.price || '';
    document.getElementById('cDesc').value = data.description || '';
    document.getElementById('cActive').value = String(data.active !== false);
    (data.lessons || []).forEach(l=> addLessonRow(l.title, l.videoUrl));
  }
  document.getElementById('courseModal').classList.add('open');
}

async function loadCoursesAdmin(){
  db.collection('courses').orderBy('createdAt','desc').onSnapshot(async (snap)=>{
    const tbody = document.getElementById('coursesTable');
    if(snap.empty){ tbody.innerHTML = `<tr><td colspan="6">لا يوجد كورسات</td></tr>`; return; }
    tbody.innerHTML = '';
    snap.forEach(doc=>{
      const c = doc.data();
      tbody.insertAdjacentHTML('beforeend', `
        <tr>
          <td>${escapeHtml(c.title)}</td>
          <td>${escapeHtml(c.stage || '-')}</td>
          <td>${c.price ? c.price + ' ج.م' : 'مجاني'}</td>
          <td><span class="badge ${c.active !== false ? 'approved' : 'pending'}">${c.active !== false ? 'منشور' : 'مخفي'}</span></td>
          <td><button class="icon-btn" onclick="manageLessons('${doc.id}')">إدارة الدروس</button></td>
          <td class="row-actions">
            <button class="icon-btn" onclick='editCourse("${doc.id}")'>تعديل</button>
            <button class="icon-btn danger" onclick="deleteCourse('${doc.id}')">حذف</button>
          </td>
        </tr>
      `);
    });
  });
}

window.editCourse = async function(id){
  const doc = await db.collection('courses').doc(id).get();
  const lessonsSnap = await db.collection('courses').doc(id).collection('lessons').orderBy('order').get();
  const data = doc.data();
  data.lessons = lessonsSnap.docs.map(d=> d.data());
  openCourseModal(id, data);
};

window.deleteCourse = async function(id){
  if(!confirm('متأكد إنك عايز تحذف الكورس ده؟')) return;
  await db.collection('courses').doc(id).delete();
  loadOverview();
};

window.manageLessons = function(id){
  editCourse(id);
};

document.getElementById('courseForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const msg = document.getElementById('courseMsg');
  const id = document.getElementById('courseId').value;
  const payload = {
    title: document.getElementById('cTitle').value.trim(),
    stage: document.getElementById('cStage').value.trim(),
    price: Number(document.getElementById('cPrice').value) || 0,
    description: document.getElementById('cDesc').value.trim(),
    active: document.getElementById('cActive').value === 'true',
  };
  try{
    let courseRef;
    if(id){
      courseRef = db.collection('courses').doc(id);
      await courseRef.update(payload);
      // مسح الدروس القديمة وإعادة كتابتها
      const old = await courseRef.collection('lessons').get();
      const batch = db.batch();
      old.forEach(d=> batch.delete(d.ref));
      await batch.commit();
    }else{
      payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      courseRef = await db.collection('courses').add(payload);
    }
    // إضافة الدروس
    const rows = document.querySelectorAll('#lessonsList .lesson-row');
    let order = 0;
    for(const row of rows){
      const title = row.querySelector('.lesson-title').value.trim();
      const url = row.querySelector('.lesson-url').value.trim();
      if(!title) continue;
      await courseRef.collection('lessons').add({title, videoUrl:url, order: order++});
    }
    setMsg(msg,'تم الحفظ بنجاح', true);
    setTimeout(()=>{
      document.getElementById('courseModal').classList.remove('open');
      loadOverview();
    }, 500);
  }catch(err){ setMsg(msg,'حصل خطأ، حاول تاني'); console.warn(err); }
});

// ==================== المدرسين ====================
function openTeacherModal(id=null, data=null){
  document.getElementById('teacherForm').reset();
  document.getElementById('teacherId').value = id || '';
  document.getElementById('teacherModalTitle').textContent = id ? 'تعديل المدرس' : 'مدرس جديد';
  if(data){
    document.getElementById('tName').value = data.name || '';
    document.getElementById('tSubject').value = data.subject || '';
    document.getElementById('tBio').value = data.bio || '';
  }
  document.getElementById('teacherModal').classList.add('open');
}

function loadTeachersAdmin(){
  db.collection('teachers').onSnapshot(snap=>{
    const tbody = document.getElementById('teachersTable');
    if(snap.empty){ tbody.innerHTML = `<tr><td colspan="3">لا يوجد مدرسين</td></tr>`; return; }
    tbody.innerHTML = '';
    snap.forEach(doc=>{
      const t = doc.data();
      tbody.insertAdjacentHTML('beforeend', `
        <tr>
          <td>${escapeHtml(t.name)}</td>
          <td>${escapeHtml(t.subject || '-')}</td>
          <td class="row-actions">
            <button class="icon-btn" onclick='editTeacher("${doc.id}")'>تعديل</button>
            <button class="icon-btn danger" onclick="deleteTeacher('${doc.id}')">حذف</button>
          </td>
        </tr>
      `);
    });
  });
}
window.editTeacher = async function(id){
  const doc = await db.collection('teachers').doc(id).get();
  openTeacherModal(id, doc.data());
};
window.deleteTeacher = async function(id){
  if(!confirm('متأكد من الحذف؟')) return;
  await db.collection('teachers').doc(id).delete();
  loadOverview();
};
document.getElementById('teacherForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const msg = document.getElementById('teacherMsg');
  const id = document.getElementById('teacherId').value;
  const payload = {
    name: document.getElementById('tName').value.trim(),
    subject: document.getElementById('tSubject').value.trim(),
    bio: document.getElementById('tBio').value.trim(),
  };
  try{
    if(id) await db.collection('teachers').doc(id).update(payload);
    else await db.collection('teachers').add(payload);
    setMsg(msg,'تم الحفظ', true);
    setTimeout(()=>{ document.getElementById('teacherModal').classList.remove('open'); loadOverview(); }, 400);
  }catch(err){ setMsg(msg,'حصل خطأ'); }
});

// ==================== طلبات الاشتراك ====================
function loadRequestsAdmin(){
  db.collection('enrollmentRequests').orderBy('createdAt','desc').onSnapshot(snap=>{
    const tbody = document.getElementById('requestsTable');
    if(snap.empty){ tbody.innerHTML = `<tr><td colspan="4">لا يوجد طلبات</td></tr>`; return; }
    tbody.innerHTML = '';
    snap.forEach(doc=>{
      const r = doc.data();
      tbody.insertAdjacentHTML('beforeend', `
        <tr>
          <td>${escapeHtml(r.studentName || '-')}</td>
          <td>${escapeHtml(r.courseTitle || '-')}</td>
          <td><span class="badge ${r.status === 'approved' ? 'approved' : 'pending'}">${r.status === 'approved' ? 'مفعّل' : 'معلّق'}</span></td>
          <td class="row-actions">
            ${r.status !== 'approved' ? `<button class="icon-btn" onclick="approveRequest('${doc.id}','${r.studentId}','${r.courseId}')">تفعيل</button>` : ''}
            <button class="icon-btn danger" onclick="deleteRequest('${doc.id}')">حذف</button>
          </td>
        </tr>
      `);
    });
  });
}
window.approveRequest = async function(reqId, studentId, courseId){
  try{
    await db.collection('users').doc(studentId).update({
      enrolledCourses: firebase.firestore.FieldValue.arrayUnion(courseId)
    });
    await db.collection('enrollmentRequests').doc(reqId).update({status:'approved'});
    loadOverview();
  }catch(err){ alert('حصل خطأ في التفعيل'); console.warn(err); }
};
window.deleteRequest = async function(id){
  if(!confirm('حذف الطلب؟')) return;
  await db.collection('enrollmentRequests').doc(id).delete();
};

// ==================== الطلاب ====================
function loadStudentsAdmin(){
  db.collection('users').where('role','==','student').onSnapshot(snap=>{
    const tbody = document.getElementById('studentsTable');
    if(snap.empty){ tbody.innerHTML = `<tr><td colspan="4">لا يوجد طلاب</td></tr>`; return; }
    tbody.innerHTML = '';
    snap.forEach(doc=>{
      const s = doc.data();
      tbody.insertAdjacentHTML('beforeend', `
        <tr>
          <td>${escapeHtml(s.name || '-')}</td>
          <td>${escapeHtml(s.email || '-')}</td>
          <td>${escapeHtml(s.phone || '-')}</td>
          <td>${(s.enrolledCourses || []).length}</td>
        </tr>
      `);
    });
  });
}

// ==================== آراء الطلاب ====================
function openTestimonialModal(id=null, data=null){
  document.getElementById('testimonialForm').reset();
  document.getElementById('testimonialId').value = id || '';
  if(data){
    document.getElementById('tsName').value = data.name || '';
    document.getElementById('tsRole').value = data.role || '';
    document.getElementById('tsText').value = data.text || '';
  }
  document.getElementById('testimonialModal').classList.add('open');
}
function loadTestimonialsAdmin(){
  db.collection('testimonials').onSnapshot(snap=>{
    const tbody = document.getElementById('testimonialsTable');
    if(snap.empty){ tbody.innerHTML = `<tr><td colspan="3">لا يوجد آراء</td></tr>`; return; }
    tbody.innerHTML = '';
    snap.forEach(doc=>{
      const t = doc.data();
      tbody.insertAdjacentHTML('beforeend', `
        <tr>
          <td>${escapeHtml(t.name)}</td>
          <td>${escapeHtml((t.text||'').slice(0,60))}...</td>
          <td class="row-actions">
            <button class="icon-btn" onclick='editTestimonial("${doc.id}")'>تعديل</button>
            <button class="icon-btn danger" onclick="deleteTestimonial('${doc.id}')">حذف</button>
          </td>
        </tr>
      `);
    });
  });
}
window.editTestimonial = async function(id){
  const doc = await db.collection('testimonials').doc(id).get();
  openTestimonialModal(id, doc.data());
};
window.deleteTestimonial = async function(id){
  if(!confirm('حذف الرأي ده؟')) return;
  await db.collection('testimonials').doc(id).delete();
};
document.getElementById('testimonialForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const msg = document.getElementById('testimonialMsg');
  const id = document.getElementById('testimonialId').value;
  const payload = {
    name: document.getElementById('tsName').value.trim(),
    role: document.getElementById('tsRole').value.trim(),
    text: document.getElementById('tsText').value.trim(),
  };
  try{
    if(id) await db.collection('testimonials').doc(id).update(payload);
    else await db.collection('testimonials').add(payload);
    setMsg(msg,'تم الحفظ', true);
    setTimeout(()=> document.getElementById('testimonialModal').classList.remove('open'), 400);
  }catch(err){ setMsg(msg,'حصل خطأ'); }
});

// ==================== أدوات مساعدة ====================
function setMsg(el, text, ok=false){
  if(!el) return;
  el.textContent = text;
  el.className = 'form-msg ' + (ok ? 'ok' : 'err');
}
function escapeHtml(str){
  if(str === undefined || str === null) return '';
  return String(str).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// نافبار (لا يوجد navToggle في الأدمن لكن main.js بيتوقع العنصر، متسيبش الكود يبوظ)
