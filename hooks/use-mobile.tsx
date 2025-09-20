import { useWindowSize } from "./useWindowSize"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const { width } = useWindowSize()

  if (width === undefined) {
    return false
  }

  return width < MOBILE_BREAKPOINT
}
