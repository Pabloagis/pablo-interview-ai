import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const BROWSER_OVERRIDES = `
<style>
  [data-accordion-header] { cursor: pointer; }
</style>
<script>
(function () {
  // Sections start collapsed; no visual change to header on toggle
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
