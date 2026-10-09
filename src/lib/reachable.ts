/**
 * A box that scrolls sideways, made reachable from the keyboard while it does.
 *
 * A table wider than a phone scrolls inside its wrapper, and the columns past
 * the edge are then out of reach to anyone without a pointer unless the
 * wrapper itself can take focus and be scrolled with the arrow keys. A wrapper
 * whose contents fit takes no focus, because a stop that does nothing is one
 * more press for everyone who tabs through the page.
 *
 * Whether it scrolls changes as the window and the contents do, so it is
 * measured again whenever either is resized.
 */
export function reachable(scroller: HTMLElement): () => void {
  const measure = (): void => {
    if (scroller.scrollWidth > scroller.clientWidth) scroller.tabIndex = 0;
    else scroller.removeAttribute("tabindex");
  };
  measure();
  const watching = new ResizeObserver(measure);
  watching.observe(scroller);
  for (const inner of scroller.children) watching.observe(inner);
  return () => {
    watching.disconnect();
  };
}
