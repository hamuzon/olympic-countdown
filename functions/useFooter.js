import { computed } from 'vue';

export function useFooter(currentYearRef) {
  const footerHTML = computed(() => {
    const year = currentYearRef?.value || new Date().getFullYear();
    // READMEに記載のURLなどを反映したフッター
    return `
      <div class="footer-content">
        <p>&copy; ${year} <a href="https://github.com/hamuzon" target="_blank" rel="noopener">hamuzon</a></p>
        <p><a href="https://github.com/hamuzon/olympic-countdown" target="_blank" rel="noopener">GitHub Repository</a></p>
      </div>
    `;
  });

  return { footerHTML };
}