import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const ACCORDION_SCRIPT = `
<script>
(function () {
  document.querySelectorAll('[data-accordion-header]').forEach(function (td) {
    td.style.cursor = 'pointer';
    var row = td.closest('tr');
    var contentRow = row ? row.nextElementSibling : null;
    var chevron = td.querySelector('[data-chevron]');
    if (!contentRow) return;
    td.addEventListener('click', function () {
      var isOpen = contentRow.style.display !== 'none';
      contentRow.style.display = isOpen ? 'none' : '';
      if (chevron) chevron.innerHTML = isOpen ? '&#9654;' : '&#9660;';
    });
  });
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

  const html = data.email_html.replace('</body>', ACCORDION_SCRIPT + '\n</body>');

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
