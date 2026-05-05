import { computed, unref } from 'vue';
import { useRequestURL } from '#app';

/**
 * フッターのHTML文字列を生成するComposable
 * @param {Ref<string> | string | number} [currentYearRef] - 現在表示されている年 (オプション)。指定しない場合は現在の年を使用。
 * @returns {{ footerHTML: ComputedRef<string> }}
 */
export function useFooter(currentYearRef) {
  const requestUrl = useRequestURL();

  const footerHTML = computed(() => {
    const baseYear = 2025;
    const dynamicCurrentYear = unref(currentYearRef) || new Date().getFullYear();
    const host = requestUrl.host || '';
    
    let yearStr = baseYear.toString();
    if (dynamicCurrentYear > baseYear) {
      yearStr = `${baseYear}–${dynamicCurrentYear}`;
    } else if (dynamicCurrentYear < baseYear) {
      yearStr = `${dynamicCurrentYear}–${baseYear}`;
    }
    
    if(host.includes("hamuzon.github.io")){
      return `&copy; ${yearStr} <a href="https://hamuzon.github.io" target="_blank">@hamuzon</a>`;
    } else if (host.includes("hamuzon-jp.f5.si")) {
      return `&copy; ${yearStr} <a href="https://hamuzon-jp.f5.si" target="_blank">@hamuzon</a>`;
    } else if(host.includes("hamusata.f5.si")){
      return `&copy; ${yearStr} <a href="https://hamusata.f5.si" target="_blank">@hamusata</a>`;
    } else {
      return `&copy; ${yearStr} Olympic Countdown`;
    }
  });

  return { footerHTML };
}