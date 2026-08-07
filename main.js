// ==================== سلوكيات الواجهة العامة ====================

// فتح/قفل قائمة الموبايل
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');
if(navToggle){
  navToggle.addEventListener('click', ()=>{
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach(a=>{
    a.addEventListener('click', ()=> navLinks.classList.remove('open'));
  });
}

// ظهور تدريجي عند التمرير
const revealItems = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
},{threshold:.15});
revealItems.forEach(el=> io.observe(el));

// فتح/قفل أي مودال عن طريق data-modal / data-close
document.querySelectorAll('[data-open-modal]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const id = btn.getAttribute('data-open-modal');
    document.getElementById(id)?.classList.add('open');
  });
});
document.querySelectorAll('[data-close-modal]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    btn.closest('.overlay')?.classList.remove('open');
  });
});
document.querySelectorAll('.overlay').forEach(ov=>{
  ov.addEventListener('click', (e)=>{
    if(e.target === ov) ov.classList.remove('open');
  });
});

// التبديل بين مودال الدخول والتسجيل
document.querySelectorAll('[data-switch-modal]').forEach(btn=>{
  btn.addEventListener('click', (e)=>{
    e.preventDefault();
    const closeId = btn.getAttribute('data-switch-from');
    const openId  = btn.getAttribute('data-switch-modal');
    document.getElementById(closeId)?.classList.remove('open');
    document.getElementById(openId)?.classList.add('open');
  });
});
