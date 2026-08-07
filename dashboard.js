// ==================== لوحة الطالب ====================

auth.onAuthStateChanged(async (user)=>{
  if(!user) return; // auth.js بيحول برا الصفحة
  const wrap = document.getElementById('myCoursesGrid');
  try{
    const userDoc = await db.collection('users').doc(user.uid).get();
    const enrolled = (userDoc.data() && userDoc.data().enrolledCourses) || [];

    if(enrolled.length === 0){
      wrap.innerHTML = `<div class="empty-state">لسه ملكش أي كورسات مفعّلة.<br>اشترك في كورس من <a href="index.html#courses" style="color:var(--gold)">صفحة الكورسات</a> وهيتفعل بعد تأكيد الاشتراك.</div>`;
      return;
    }

    wrap.innerHTML = '';
    for(const courseId of enrolled){
      const cDoc = await db.collection('courses').doc(courseId).get();
      if(!cDoc.exists) continue;
      const c = cDoc.data();

      // جلب الدروس الخاصة بالكورس
      const lessonsSnap = await db.collection('courses').doc(courseId)
        .collection('lessons').orderBy('order','asc').get();
      let lessonsHtml = '<p style="color:var(--paper-dim); font-size:.85rem">لسه مفيش دروس مضافة</p>';
      if(!lessonsSnap.empty){
        lessonsHtml = lessonsSnap.docs.map(l=>{
          const les = l.data();
          return `<a href="${les.videoUrl}" target="_blank" style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--line); font-size:.88rem">
            <span>${les.title}</span><span style="color:var(--gold)">مشاهدة ▶</span>
          </a>`;
        }).join('');
      }

      wrap.insertAdjacentHTML('beforeend', `
        <div class="card">
          <span class="tag">${c.stage || ''}</span>
          <h3>${c.title}</h3>
          <div style="margin-top:14px">${lessonsHtml}</div>
        </div>
      `);
    }
  }catch(err){
    wrap.innerHTML = `<div class="empty-state">تعذر تحميل بياناتك، حاول تحدّث الصفحة</div>`;
    console.warn(err);
  }
});
