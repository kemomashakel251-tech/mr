// ==================== محتوى ديناميكي من Firestore ====================

// ---------- محتوى الصفحة الرئيسية (نص البانر + الإحصائيات) ----------
async function loadSiteContent(){
  try{
    const doc = await db.collection('siteContent').doc('home').get();
    if(!doc.exists) return;
    const d = doc.data();
    setText('heroTitle', d.heroTitle);
    setText('heroHighlight', d.heroHighlight);
    setText('heroLead', d.heroLead);
    setText('stat1Num', d.stat1Num); setText('stat1Label', d.stat1Label);
    setText('stat2Num', d.stat2Num); setText('stat2Label', d.stat2Label);
    setText('stat3Num', d.stat3Num); setText('stat3Label', d.stat3Label);
    setText('footerDesc', d.footerDesc);
    if(d.whatsapp){
      const wa = document.getElementById('whatsappLink');
      if(wa) wa.href = 'https://wa.me/' + d.whatsapp;
    }
    setLink('socialFacebook', d.facebook);
    setLink('socialInstagram', d.instagram);
    setLink('socialYoutube', d.youtube);
    setLink('socialTiktok', d.tiktok);
  }catch(err){ console.warn('site content:', err.message); }
}
function setLink(id, url){
  const el = document.getElementById(id);
  if(el && url){ el.href = url; el.classList.remove('hidden'); }
}
function setText(id, val){
  const el = document.getElementById(id);
  if(el && val !== undefined) el.textContent = val;
}

// ---------- الكورسات / المجموعات ----------
async function loadCourses(){
  const wrap = document.getElementById('coursesGrid');
  if(!wrap) return;
  try{
    const snap = await db.collection('courses').where('active','==', true)
      .orderBy('createdAt','desc').get();
    if(snap.empty){
      wrap.innerHTML = `<div class="empty-state">لسه مفيش كورسات متاحة، تابعنا قريب</div>`;
      return;
    }
    wrap.innerHTML = '';
    snap.forEach(doc=>{
      const c = doc.data();
      wrap.insertAdjacentHTML('beforeend', `
        <div class="card reveal">
          <span class="tag">${escapeHtml(c.stage || 'كل المراحل')}</span>
          <h3>${escapeHtml(c.title)}</h3>
          <p>${escapeHtml(c.description || '')}</p>
          <div class="card-foot">
            <span class="price">${c.price ? c.price + ' ج.م' : 'مجاني'}
              ${c.oldPrice ? `<s>${c.oldPrice} ج.م</s>` : ''}
            </span>
            <button class="btn btn-gold btn-sm" onclick="requestEnroll('${doc.id}','${escapeHtml(c.title)}')">اشترك دلوقتي</button>
          </div>
        </div>
      `);
    });
    document.querySelectorAll('.reveal').forEach(el=> io.observe(el));
  }catch(err){
    wrap.innerHTML = `<div class="empty-state">تعذر تحميل الكورسات الآن</div>`;
    console.warn('courses:', err.message);
  }
}

// ---------- المدرسين ----------
async function loadTeachers(){
  const wrap = document.getElementById('teachersGrid');
  if(!wrap) return;
  try{
    const snap = await db.collection('teachers').get();
    if(snap.empty){ wrap.innerHTML = `<div class="empty-state">قريباً</div>`; return; }
    wrap.innerHTML = '';
    snap.forEach(doc=>{
      const t = doc.data();
      wrap.insertAdjacentHTML('beforeend', `
        <div class="card teacher-card reveal">
          <div class="teacher-avatar">${escapeHtml((t.name||'م').trim()[0])}</div>
          <h3>${escapeHtml(t.name)}</h3>
          <p>${escapeHtml(t.subject || '')}</p>
          ${t.bio ? `<p style="font-size:.82rem;color:var(--paper-dim);margin-top:6px">${escapeHtml(t.bio)}</p>` : ''}
        </div>
      `);
    });
    document.querySelectorAll('.reveal').forEach(el=> io.observe(el));
  }catch(err){ console.warn('teachers:', err.message); }
}

// ---------- آراء الطلاب ----------
async function loadTestimonials(){
  const wrap = document.getElementById('testimonialsGrid');
  if(!wrap) return;
  try{
    const snap = await db.collection('testimonials').limit(6).get();
    if(snap.empty) return;
    wrap.innerHTML = '';
    snap.forEach(doc=>{
      const t = doc.data();
      wrap.insertAdjacentHTML('beforeend', `
        <div class="quote-card reveal">
          <p>"${escapeHtml(t.text)}"</p>
          <div class="who">${escapeHtml(t.name)} — ${escapeHtml(t.role||'طالب')}</div>
        </div>
      `);
    });
    document.querySelectorAll('.reveal').forEach(el=> io.observe(el));
  }catch(err){ console.warn('testimonials:', err.message); }
}

// ---------- طلب اشتراك في كورس ----------
async function requestEnroll(courseId, courseTitle){
  const user = auth.currentUser;
  if(!user){
    document.getElementById('loginModal')?.classList.add('open');
    return;
  }
  try{
    await db.collection('enrollmentRequests').add({
      courseId, courseTitle,
      studentId: user.uid,
      studentName: user.displayName || '',
      status:'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert('تم إرسال طلب الاشتراك، هيتم تفعيل الكورس بعد تأكيد الدفع من الإدارة.');
  }catch(err){
    alert('حصل خطأ في إرسال الطلب، حاول تاني');
  }
}

function escapeHtml(str){
  if(str === undefined || str === null) return '';
  return String(str).replace(/[&<>"']/g, m=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));
}

loadSiteContent();
loadCourses();
loadTeachers();
loadTestimonials();
