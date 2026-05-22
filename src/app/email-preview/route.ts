import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const BROWSER_OVERRIDES = `
<style>
  [data-accordion-header] { cursor: pointer; }
  [data-pablo-avatar] {
    width: 130px !important;
    height: 130px !important;
    border: 4px solid rgba(255,255,255,0.9) !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.35);
    cursor: zoom-in;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    margin-bottom: 20px !important;
  }
  [data-pablo-avatar]:hover { transform: scale(1.05); box-shadow: 0 12px 40px rgba(0,0,0,0.45); }
  #avatar-lightbox {
    display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.75);
    z-index: 9999; align-items: center; justify-content: center; cursor: zoom-out;
  }
  #avatar-lightbox.open { display: flex; }
  #avatar-lightbox img {
    width: 280px; height: 280px; border-radius: 50%;
    border: 5px solid white; object-fit: cover; object-position: top center;
    box-shadow: 0 20px 60px rgba(0,0,0,0.6);
    animation: zoomIn 0.2s ease;
  }
  @keyframes zoomIn { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>
<div id="avatar-lightbox">
  <img src="https://interviewmind.one/assets/pablo-avatar.jpg" alt="Pablo Agis Burgos" />
</div>
<script>
(function () {
  // Avatar zoom
  var avatar = document.querySelector('[data-pablo-avatar]');
  var lightbox = document.getElementById('avatar-lightbox');
  if (avatar && lightbox) {
    avatar.addEventListener('click', function () { lightbox.classList.add('open'); });
    lightbox.addEventListener('click', function () { lightbox.classList.remove('open'); });
  }

  // Accordion toggle
  document.querySelectorAll('[data-accordion-header]').forEach(function (td) {
    var row = td.closest('tr');
    var contentRow = row ? row.nextElementSibling : null;
    if (!contentRow) return;
    contentRow.style.display = 'none';
    td.addEventListener('click', function (e) {
      var target = /** @type {Element} */ (e.target);
      if (target && target.closest && target.closest('[data-chevron]')) e.preventDefault();
      contentRow.style.display = contentRow.style.display === 'none' ? '' : 'none';
    });
  });

  // Override schedule CTA label
  var calLink = document.querySelector('a[href*="calendly"]');
  if (calLink) {
    var spans = calLink.querySelectorAll('span');
    if (spans[0]) spans[0].textContent = 'Book a call with Pablo';
  }
})();
</script>
`;

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');

  if (!id) {
    return new NextResponse('Missing id parameter', { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('sessions')
    .select('email_html')
    .eq('id', id)
    .single();

  if (error || !data?.email_html) {
    return new NextResponse(
      '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;color:#64748b;">Email preview not available.</body></html>',
      { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  const html = data.email_html.replace('</body>', BROWSER_OVERRIDES + '\n</body>');

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
